"use client";

import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, LoaderCircle, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TaskCard } from "@/components/dashboard/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/types/task";

const columns: { id: TaskStatus; label: string }[] = [
    { id: "todo", label: "To Do" },
    { id: "in-progress", label: "In Progress" },
    { id: "done", label: "Done" },
];

type KanbanBoardProps = {
    tasks: Task[];
    isDeleting: boolean;
    onDeleteTask: (id: string) => void;
    onMoveTask: (id: string, status: TaskStatus) => void;
};

type ColumnProps = {
    columnId: TaskStatus;
    label: string;
    tasks: Task[];
    isDeleting: boolean;
    onDeleteTask: (id: string) => void;
};

function DraggableTask({ task, isDeleting, onDeleteTask }: { task: Task; isDeleting: boolean; onDeleteTask: (id: string) => void; }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            task,
        },
    });

    return (
        <motion.div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
            }}
            className={isDragging ? "opacity-40" : "opacity-100"}
            layout
        >
            <div className="relative">
                <div
                    className="absolute right-2 top-2 z-10 cursor-grab text-muted-foreground"
                    {...listeners}
                    {...attributes}
                >
                    <GripVertical className="size-4" />
                </div>
                <TaskCard task={task} />
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-9 top-1.5"
                    onClick={() => onDeleteTask(task.id)}
                    disabled={isDeleting}
                    aria-label="Delete task"
                >
                    {isDeleting ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="size-3.5" />
                    )}
                </Button>
            </div>
        </motion.div>
    );
}

function Column({ columnId, label, tasks, onDeleteTask, isDeleting }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
    });

    return (
        <Card
            ref={setNodeRef}
            className={isOver ? "ring-2 ring-primary/30" : "ring-1 ring-border/70"}
        >
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">{label}</CardTitle>
                <Badge variant="outline">{tasks.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
                <AnimatePresence>
                    {tasks.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground"
                        >
                            Drop tasks here
                        </motion.div>
                    ) : (
                        tasks.map((task) => (
                            <DraggableTask
                                key={task.id}
                                task={task}
                                onDeleteTask={onDeleteTask}
                                isDeleting={isDeleting}
                            />
                        ))
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

export function KanbanBoard({
    tasks,
    isDeleting,
    onDeleteTask,
    onMoveTask,
}: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

    const groupedTasks = useMemo(
        () => ({
            todo: tasks.filter((task) => task.status === "todo"),
            "in-progress": tasks.filter((task) => task.status === "in-progress"),
            done: tasks.filter((task) => task.status === "done"),
        }),
        [tasks],
    );

    const handleDragStart = (event: DragStartEvent) => {
        const task = event.active.data.current?.task as Task | undefined;
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);

        if (!event.over) {
            return;
        }

        const task = event.active.data.current?.task as Task | undefined;
        const targetStatus = event.over.id as TaskStatus;

        if (!task || !targetStatus || task.status === targetStatus) {
            return;
        }

        onMoveTask(task.id, targetStatus);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid gap-4 xl:grid-cols-3">
                {columns.map((column) => (
                    <Column
                        key={column.id}
                        columnId={column.id}
                        label={column.label}
                        tasks={groupedTasks[column.id]}
                        isDeleting={isDeleting}
                        onDeleteTask={onDeleteTask}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <motion.div layout initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
                        <TaskCard task={activeTask} />
                    </motion.div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
