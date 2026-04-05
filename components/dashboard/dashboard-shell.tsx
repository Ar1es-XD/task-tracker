"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, KanbanSquare, LoaderCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { CalendarView } from "@/components/dashboard/calendar-view";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { TaskForm } from "@/components/dashboard/task-form";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useCreateTaskMutation,
    useDeleteTaskMutation,
    useTasks,
    useUpdateTaskMutation,
} from "@/hooks/use-tasks";
import type { TaskPayload, TaskStatus } from "@/types/task";

type DashboardShellProps = {
    userName: string;
    userEmail: string;
};

export function DashboardShell({ userName, userEmail }: DashboardShellProps) {
    const { data: tasks = [], isLoading, isError, error, refetch } = useTasks();

    const createTaskMutation = useCreateTaskMutation();
    const updateTaskMutation = useUpdateTaskMutation();
    const deleteTaskMutation = useDeleteTaskMutation();

    const handleCreateTask = async (payload: TaskPayload) => {
        try {
            await createTaskMutation.mutateAsync(payload);
            toast.success("Task created");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create task");
            throw error;
        }
    };

    const handleMoveTask = (id: string, status: TaskStatus) => {
        void updateTaskMutation
            .mutateAsync({
                id,
                payload: { status },
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : "Failed to move task");
            });
    };

    const handleDeleteTask = (id: string) => {
        void deleteTaskMutation
            .mutateAsync(id)
            .then(() => {
                toast.success("Task deleted");
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : "Failed to delete task");
            });
    };

    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_85%_0%,hsl(var(--accent-foreground)/0.08),transparent_35%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35))]">
            <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[250px_1fr] lg:p-6">
                <aside className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-md lg:h-[calc(100vh-3rem)] lg:sticky lg:top-6">
                    <p className="text-sm font-semibold tracking-wide text-muted-foreground">
                        Task Tracker
                    </p>
                    <p className="mt-1 text-lg font-semibold">Workspace</p>

                    <nav className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium">
                            <KanbanSquare className="size-4" />
                            Board
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                            <CalendarDays className="size-4" />
                            Calendar
                        </div>
                    </nav>

                    <Card className="mt-6 ring-0">
                        <CardHeader>
                            <CardTitle className="text-sm">Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p className="font-medium">{userName}</p>
                            <p className="text-muted-foreground">{userEmail}</p>
                        </CardContent>
                    </Card>
                </aside>

                <main className="space-y-4">
                    <header className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-md">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold">Task Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Organize work, sync due dates to Google Calendar, and ship on time.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{tasks.length} tasks</Badge>
                                <ThemeToggle />
                                <TaskForm
                                    onSubmit={handleCreateTask}
                                    isLoading={createTaskMutation.isPending}
                                />
                                <Button variant="outline" onClick={() => signOut()}>
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    </header>

                    {isLoading ? (
                        <Card>
                            <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                                <LoaderCircle className="size-4 animate-spin" />
                                Loading tasks...
                            </CardContent>
                        </Card>
                    ) : null}

                    {isError ? (
                        <Card>
                            <CardContent className="py-10">
                                <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
                                    <AlertTriangle className="size-6 text-destructive" />
                                    <p className="text-sm font-medium">
                                        {error instanceof Error ? error.message : "Failed to load tasks"}
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                                        Retry
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {!isLoading && !isError ? (
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            {tasks.length === 0 ? (
                                <Card>
                                    <CardContent className="py-14 text-center">
                                        <p className="text-base font-medium">No tasks yet</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Create your first task to start building your board.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <KanbanBoard
                                        tasks={tasks}
                                        isDeleting={deleteTaskMutation.isPending}
                                        onDeleteTask={handleDeleteTask}
                                        onMoveTask={handleMoveTask}
                                    />
                                    <CalendarView tasks={tasks} />
                                </>
                            )}
                        </motion.section>
                    ) : null}
                </main>
            </div>
        </div>
    );
}
