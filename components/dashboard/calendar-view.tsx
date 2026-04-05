"use client";

import { format, isSameDay } from "date-fns";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/types/task";

type CalendarViewProps = {
    tasks: Task[];
};

export function CalendarView({ tasks }: CalendarViewProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const tasksWithDueDates = useMemo(
        () => tasks.filter((task) => Boolean(task.dueDate)),
        [tasks],
    );

    const dueDates = useMemo(
        () => tasksWithDueDates.map((task) => new Date(task.dueDate as string)),
        [tasksWithDueDates],
    );

    const selectedTasks = useMemo(() => {
        if (!selectedDate) return [];

        return tasksWithDueDates.filter((task) =>
            isSameDay(new Date(task.dueDate as string), selectedDate),
        );
    }, [selectedDate, tasksWithDueDates]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[auto_1fr]">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                        hasTask: dueDates,
                    }}
                    modifiersClassNames={{
                        hasTask: "after:absolute after:bottom-1.5 after:size-1 after:rounded-full after:bg-primary",
                    }}
                    className="w-full rounded-xl border border-border/70"
                />

                <div className="rounded-xl border border-border/70 p-3">
                    <p className="mb-3 text-sm font-medium">
                        {selectedDate ? format(selectedDate, "PPP") : "Select a day"}
                    </p>
                    {selectedTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks due on this date.</p>
                    ) : (
                        <ul className="space-y-2">
                            {selectedTasks.map((task) => (
                                <li key={task.id} className="rounded-lg bg-muted/60 p-2.5">
                                    <p className="text-sm font-medium">{task.title}</p>
                                    {task.description ? (
                                        <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                                    ) : null}
                                    <Badge variant="outline" className="mt-2">
                                        {task.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
