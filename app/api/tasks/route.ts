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

export async function POST(req: Request) {
    try {
        console.log("POST HIT");

        const session = await getServerSession(authOptions);
        console.log("SESSION:", session);

        if (!session || !session.user || !session.user.id) {
            console.error("NO USER ID");
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        console.log("BODY:", body);

        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
            return new Response("Title is required", { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title,
                userId: session.user.id,
            },
        });

        console.log("CREATED:", task);

        return Response.json(task);
    } catch (err) {
        console.error("ERROR:", err);
        return new Response("Server error", { status: 500 });
    }
}
