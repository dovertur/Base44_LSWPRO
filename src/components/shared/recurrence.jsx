import { addDays, addWeeks, addMonths, set, startOfDay, getDay, setDay, getDate, setDate, isAfter } from 'date-fns';

/**
 * Calculates the next due date for a given routine based on its recurrence rule.
 * @param {object} routine - The routine object. Must contain `next_due_date` and `recurrence` properties.
 * @returns {Date | null} - The new next due date as a Date object, or null if recurrence is 'none' or has ended.
 */
export function calculateNextDueDate(routine) {
  const { recurrence, next_due_date } = routine;
  if (!recurrence || recurrence.type === 'none' || !next_due_date) {
    return null;
  }

  // Use the start of the current due date for calculation to avoid time zone issues.
  const currentDueDate = new Date(next_due_date);
  let newDueDate;

  switch (recurrence.type) {
    case 'daily':
      newDueDate = addDays(currentDueDate, recurrence.interval || 1);
      break;

    case 'weekly':
      {
        const interval = recurrence.interval || 1;
        const daysOfWeek = (recurrence.daysOfWeek || []).sort((a, b) => a - b);
        if (daysOfWeek.length === 0) {
            // If no specific days, just advance by weeks from current due date
            newDueDate = addWeeks(currentDueDate, interval);
            break;
        }

        const currentDay = getDay(currentDueDate); // Sunday is 0, Saturday is 6
        let nextDayInWeek = -1;

        // Find the next valid day in the current week (that is AFTER the current day)
        for (const day of daysOfWeek) {
          if (day > currentDay) {
            nextDayInWeek = day;
            break;
          }
        }
        
        if (nextDayInWeek !== -1) {
            // Next occurrence is in the same week, just move to that day
            newDueDate = setDay(currentDueDate, nextDayInWeek, { weekStartsOn: 0 });
        } else {
            // Next occurrence is in a future week
            const firstDayOfNextCycle = daysOfWeek[0];
            // Move to the start of the next week cycle, then set the day
            const startOfCurrentWeek = startOfWeek(currentDueDate, { weekStartsOn: 0 });
            const startOfNextWeekCycle = addWeeks(startOfCurrentWeek, interval);
            newDueDate = setDay(startOfNextWeekCycle, firstDayOfNextCycle, { weekStartsOn: 0 });
        }
      }
      break;

    case 'monthly':
      {
        const interval = recurrence.interval || 1;
        const targetDayOfMonth = recurrence.dayOfMonth || getDate(currentDueDate);
        
        // Add interval months to the current due date
        const nextMonthDate = addMonths(currentDueDate, interval);
        // Set the day to the target day of the month
        newDueDate = setDate(nextMonthDate, targetDayOfMonth);
      }
      break;

    default:
      return null;
  }

  // Preserve the original time from the next_due_date
  const originalTime = new Date(next_due_date);
  const finalDate = set(newDueDate, {
    hours: originalTime.getHours(),
    minutes: originalTime.getMinutes(),
    seconds: originalTime.getSeconds(),
  });

  // If there's an end date, make sure the new due date is not after it.
  if (recurrence.endDate && isAfter(finalDate, new Date(recurrence.endDate))) {
      return null; // Stop recurrence
  }

  return finalDate;
}