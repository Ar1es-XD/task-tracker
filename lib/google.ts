import { google } from "googleapis";

type CalendarTask = {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    googleEventId?: string | null;
};

function getCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.calendar({
        version: "v3",
        auth,
    });
}

function getEventWindow(dueDate: Date | null) {
    const start = dueDate ?? new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export async function createEvent(task: CalendarTask, accessToken: string) {
    if (!task.dueDate) {
        return null;
    }

    const calendar = getCalendarClient(accessToken);
    const eventWindow = getEventWindow(task.dueDate);

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
            summary: task.title,
            description: task.description ?? "Task created from Task Tracker",
            start: { dateTime: eventWindow.start },
            end: { dateTime: eventWindow.end },
        },
    });

    return response.data.id ?? null;
}

export async function updateEvent(task: CalendarTask, accessToken: string) {
    if (!task.googleEventId || !task.dueDate) {
        return null;
    }

    const calendar = getCalendarClient(accessToken);
    const eventWindow = getEventWindow(task.dueDate);

    await calendar.events.patch({
        calendarId: "primary",
        eventId: task.googleEventId,
        requestBody: {
            summary: task.title,
            description: task.description ?? "Task updated from Task Tracker",
            start: { dateTime: eventWindow.start },
            end: { dateTime: eventWindow.end },
        },
    });

    return task.googleEventId;
}

export async function deleteEvent(eventId: string, accessToken: string) {
    const calendar = getCalendarClient(accessToken);

    await calendar.events.delete({
        calendarId: "primary",
        eventId,
    });
}
