"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
} from "@tanstack/react-query";

import type { Task, TaskPayload, TaskUpdatePayload } from "@/types/task";

const TASKS_QUERY_KEY = ["tasks"];

async function parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    if (!response.ok) {
        console.error("API ERROR:", text);
        throw new Error(text || "Request failed");
    }

    if (!text) {
        throw new Error("Empty response from server");
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        console.error("Invalid JSON:", text);
        throw new Error("Invalid JSON response");
    }
}

function unwrapTask<T extends Task>(data: T | { task?: T } | undefined): T {
    if (!data) {
        throw new Error("Empty response from server");
    }

    if (typeof data === "object" && "task" in data && data.task) {
        return data.task;
    }

    return data as T;
}

async function fetchTasks(): Promise<Task[]> {
    const response = await fetch("/api/tasks", { cache: "no-store" });
    const data = await parseResponse<{ tasks: Task[] }>(response);
    return data?.tasks ?? [];
}

async function createTask(payload: TaskPayload): Promise<Task> {
    const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await parseResponse<Task | { task: Task }>(response);
    return unwrapTask(data);
}

async function updateTask({
    id,
    payload,
}: {
    id: string;
    payload: TaskUpdatePayload;
}): Promise<Task> {
    const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await parseResponse<Task | { task: Task }>(response);
    return unwrapTask(data);
}

async function deleteTask(id: string): Promise<void> {
    const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });

    await parseResponse<{ success: true }>(response);
}

export function useTasks() {
    return useQuery({
        queryKey: TASKS_QUERY_KEY,
        queryFn: fetchTasks,
    });
}

export function useCreateTaskMutation(): UseMutationResult<Task, Error, TaskPayload> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTask,
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
            const optimisticId = `optimistic-${Date.now()}`;
            const now = new Date().toISOString();

            const optimisticTask: Task = {
                id: optimisticId,
                title: payload.title,
                description: payload.description ?? null,
                dueDate: payload.dueDate ?? null,
                status: "todo",
                priority: payload.priority ?? "medium",
                userId: "optimistic",
                googleEventId: null,
                createdAt: now,
                updatedAt: now,
            };

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) => [
                optimisticTask,
                ...current,
            ]);

            return {
                previousTasks,
                optimisticId,
            };
        },
        onError: (_, __, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSuccess: (task, _, context) => {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) =>
                current.map((currentTask) =>
                    currentTask.id === context?.optimisticId ? task : currentTask,
                ),
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
}

export function useUpdateTaskMutation(): UseMutationResult<
    Task,
    Error,
    { id: string; payload: TaskUpdatePayload }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTask,
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) =>
                current.map((task) =>
                    task.id === id
                        ? {
                            ...task,
                            ...payload,
                            dueDate:
                                payload.dueDate === undefined
                                    ? task.dueDate
                                    : payload.dueDate,
                        }
                        : task,
                ),
            );

            return { previousTasks };
        },
        onError: (_, __, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSuccess: (updatedTask) => {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) =>
                current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
}

export function useDeleteTaskMutation(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTask,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) =>
                current.filter((task) => task.id !== id),
            );

            return { previousTasks };
        },
        onError: (_, __, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
}
