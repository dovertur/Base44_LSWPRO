import { calculateNextDueDate } from './recurrence';

/**
 * Ensures a routine has the proper recurrence structure for backward compatibility
 * @param {object} routine - The routine object
 * @returns {object} - Routine with proper recurrence structure
 */
export function normalizeRoutineRecurrence(routine) {
  if (!routine.recurrence) {
    // Legacy routine - infer recurrence from frequency if it exists
    if (routine.frequency && routine.frequency !== 'once') {
      const recurrence = {
        type: routine.frequency === 'daily' ? 'daily' :
              routine.frequency === 'weekly' ? 'weekly' :
              routine.frequency === 'monthly' ? 'monthly' : 'none',
        interval: 1
      };
      
      return { ...routine, recurrence };
    } else {
      // Non-recurring routine
      return { 
        ...routine, 
        recurrence: { type: 'none', interval: 1 } 
      };
    }
  }
  
  return routine;
}

/**
 * Migrates legacy routine frequency to new recurrence structure
 * @param {object} routine - The routine object
 * @returns {object} - Updated routine object
 */
export function migrateRoutineToRecurrence(routine) {
  const normalized = normalizeRoutineRecurrence(routine);
  
  // Remove legacy frequency field if it exists
  const { frequency, ...cleanedRoutine } = normalized;
  
  return cleanedRoutine;
}

/**
 * Gets the next due date for any routine, handling both legacy and new formats
 * @param {object} routine - The routine object
 * @returns {Date|null} - Next due date or null
 */
export function getNextDueDateForRoutine(routine) {
  const normalizedRoutine = normalizeRoutineRecurrence(routine);
  
  if (normalizedRoutine.recurrence.type === 'none') {
    return null;
  }
  
  return calculateNextDueDate(normalizedRoutine);
}