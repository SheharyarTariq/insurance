import { CalendarDate } from "@internationalized/date";

export const parseCalendarDate = (dateStr?: string): CalendarDate | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new CalendarDate(year, month, day);
  };
  