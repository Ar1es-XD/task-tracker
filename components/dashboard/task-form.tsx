"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TaskPayload, TaskPriority } from "@/types/task";

type TaskFormProps = {
    onSubmit: (payload: TaskPayload) => Promise<void>;
    isLoading?: boolean;
};

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("SUBMIT CLICKED");

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        setError(null);

        try {
            console.log("SUBMIT TRIGGERED");
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                dueDate: dueDate || undefined,
                priority,
            });

            setTitle("");
            setDescription("");
            setDueDate("");
            setPriority("medium");
            setOpen(false);
        } catch (submissionError) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Failed to create task",
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Task</Button>
            </DialogTrigger>
            <AnimatePresence>
                {open ? (
                    <DialogContent forceMount asChild showCloseButton={false}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <DialogHeader>
                                <DialogTitle>Create Task</DialogTitle>
                                <DialogDescription>
                                    Add details and optionally set a due date.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Title</p>
                                    <Input
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Prepare quarterly roadmap"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Description</p>
                                    <Textarea
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder="Outline milestones, dependencies, and owners"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Priority</p>
                                    <select
                                        value={priority}
                                        onChange={(event) =>
                                            setPriority(event.target.value as TaskPriority)
                                        }
                                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Due Date</p>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(event) => setDueDate(event.target.value)}
                                    />
                                </div>

                                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                                <DialogFooter className="px-0 pb-0 pt-3">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Creating..." : "Create"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </motion.div>
                    </DialogContent>
                ) : null}
            </AnimatePresence>
        </Dialog>
    );
}
