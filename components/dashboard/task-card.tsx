"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/types/task";

const statusLabelMap: Record<TaskStatus, string> = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Done",
};

type TaskCardProps = {
    task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full"
        >
            <Card className="border border-border/70 bg-card/95 backdrop-blur-sm">
                <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-sm leading-tight">{task.title}</CardTitle>
                        <Badge variant="secondary">{statusLabelMap[task.status]}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {task.description ? (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                    ) : null}
                    {task.dueDate ? (
                        <p className="text-xs text-muted-foreground">
                            Due {format(new Date(task.dueDate), "PPP")}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">No due date</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
