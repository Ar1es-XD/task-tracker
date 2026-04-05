import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createEvent, deleteEvent, updateEvent } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/types/task";

const VALID_STATUS: TaskStatus[] = ["todo", "in-progress", "done"];
const VALID_PRIORITY = ["low", "medium", "high"] as const;
type TaskPriority = (typeof VALID_PRIORITY)[number];

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!session?.user || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();

        const data: {
            title?: string;
            dueDate?: Date | null;
            status?: TaskStatus;
            priority?: TaskPriority;
        } = {};

        const existingTask = await prisma.task.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (typeof body.title === "string") {
            const title = body.title.trim();
            if (!title) {
                return NextResponse.json(
                    { error: "Title cannot be empty" },
                    { status: 400 },
                );
            }
            data.title = title;
        }

        if ("dueDate" in body) {
            if (body.dueDate === null || body.dueDate === "") {
                data.dueDate = null;
            } else {
                const dueDate = new Date(body.dueDate);
                if (Number.isNaN(dueDate.getTime())) {
                    return NextResponse.json(
                        { error: "Invalid due date" },
                        { status: 400 },
                    );
                }
                data.dueDate = dueDate;
            }
        }

        if (typeof body.status === "string") {
            if (!VALID_STATUS.includes(body.status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            data.status = body.status;
        }

        if (typeof body.priority === "string") {
            if (!VALID_PRIORITY.includes(body.priority as TaskPriority)) {
                return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
            }
            data.priority = body.priority as TaskPriority;
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data,
        });

        if (session.accessToken) {
            try {
                if (updatedTask.googleEventId) {
                    await updateEvent(
                        {
                            id: updatedTask.id,
                            title: updatedTask.title,
                            description: updatedTask.description,
                            dueDate: updatedTask.dueDate,
                            googleEventId: updatedTask.googleEventId,
                        },
                        session.accessToken,
                    );
                } else {
                    const googleEventId = await createEvent(
                        {
                            id: updatedTask.id,
                            title: updatedTask.title,
                            description: updatedTask.description,
                            dueDate: updatedTask.dueDate,
                        },
                        session.accessToken,
                    );

                    if (googleEventId) {
                        const syncedTask = await prisma.task.update({
                            where: { id: updatedTask.id },
                            data: { googleEventId },
                        });

                        return NextResponse.json({ task: syncedTask }, { status: 200 });
                    }
                }
            } catch (calendarError) {
                console.error("Failed to sync Google Calendar event:", calendarError);
            }
        }

        return NextResponse.json({ task: updatedTask }, { status: 200 });
    } catch (error) {
        console.error("Failed to update task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 },
        );
    }
}

export async function DELETE(_: Request, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!session?.user || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const task = await prisma.task.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (task.googleEventId && session.accessToken) {
            try {
                await deleteEvent(task.googleEventId, session.accessToken);
            } catch (calendarError) {
                console.error("Failed to delete Google Calendar event:", calendarError);
            }
        }

        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 },
        );
    }
}
