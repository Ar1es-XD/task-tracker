export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    userId: string;
    googleEventId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TaskPayload {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
}

export interface TaskUpdatePayload {
    title?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
}
