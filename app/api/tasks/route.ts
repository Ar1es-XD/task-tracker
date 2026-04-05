import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createEvent } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/types/task";

const VALID_STATUS: TaskStatus[] = ["todo", "in-progress", "done"];
const VALID_PRIORITY = ["low", "medium", "high"] as const;
type TaskPriority = (typeof VALID_PRIORITY)[number];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!session?.user || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ tasks }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!session?.user || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description =
            typeof body.description === "string" ? body.description.trim() : "";
        const dueDate = body.dueDate ? new Date(body.dueDate) : null;
        const status: TaskStatus =
            typeof body.status === "string" && VALID_STATUS.includes(body.status)
                ? body.status
                : "todo";
        const priority: TaskPriority =
            typeof body.priority === "string" &&
                VALID_PRIORITY.includes(body.priority as TaskPriority)
                ? (body.priority as TaskPriority)
                : "medium";

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (dueDate && Number.isNaN(dueDate.getTime())) {
            return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
        }

        const createdTask = await prisma.task.create({
            data: {
                title,
                description: description || null,
                dueDate,
                status,
                priority,
                userId,
            },
        });

        if (session.accessToken) {
            try {
                const googleEventId = await createEvent(
                    {
                        id: createdTask.id,
                        title: createdTask.title,
                        description: createdTask.description,
                        dueDate: createdTask.dueDate,
                    },
                    session.accessToken,
                );

                if (googleEventId) {
                    const syncedTask = await prisma.task.update({
                        where: { id: createdTask.id },
                        data: { googleEventId },
                    });

                    return NextResponse.json({ task: syncedTask }, { status: 201 });
                }
            } catch (calendarError) {
                console.error("Failed to create Google Calendar event:", calendarError);
            }
        }

        return NextResponse.json({ task: createdTask }, { status: 201 });
    } catch (error) {
        console.error("Failed to create task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 },
        );
    }
}
