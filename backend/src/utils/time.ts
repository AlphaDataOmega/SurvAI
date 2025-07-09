/**
 * @fileoverview Time utility functions for date calculations
 * 
 * Utility functions for handling date calculations, time windows,
 * and timezone considerations for EPC calculations.
 */

/**
 * Get date that is X days ago from current time
 * 
 * @param days - Number of days to subtract from current date
 * @returns Date object representing the date X days ago
 * @throws Error if days is negative
 */
export function getDateDaysAgo(days: number): Date {
  // VALIDATION: Validate input
  if (days < 0) {
    throw new Error('Days cannot be negative');
  }
  
  if (!Number.isInteger(days)) {
    throw new Error('Days must be an integer');
  }
  
  // CALCULATION: Current time minus days in milliseconds
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - (days * msPerDay));
}

/**
 * Check if a date is within a specified time window (days ago)
 * 
 * @param date - Date to check
 * @param windowDays - Size of time window in days
 * @returns true if date is within the time window, false otherwise
 * @throws Error if windowDays is negative or date is invalid
 */
export function isWithinTimeWindow(date: Date, windowDays: number): boolean {
  // VALIDATION: Validate inputs
  if (windowDays < 0) {
    throw new Error('Window days cannot be negative');
  }
  
  if (!Number.isInteger(windowDays)) {
    throw new Error('Window days must be an integer');
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // PATTERN: Use getDateDaysAgo for consistency
  const cutoffDate = getDateDaysAgo(windowDays);
  return date >= cutoffDate;
}

/**
 * Get start and end dates for a time window
 * 
 * @param windowDays - Size of time window in days
 * @returns Object with startDate and endDate
 */
export function getTimeWindow(windowDays: number): {
  startDate: Date;
  endDate: Date;
} {
  if (windowDays < 0) {
    throw new Error('Window days cannot be negative');
  }
  
  return {
    startDate: getDateDaysAgo(windowDays),
    endDate: new Date()
  };
}

/**
 * Check if a date is today (same calendar day)
 * 
 * @param date - Date to check
 * @returns true if date is today, false otherwise
 */
export function isToday(date: Date): boolean {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Format date to ISO string for database queries
 * 
 * @param date - Date to format
 * @returns ISO string representation
 */
export function formatDateForDB(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  return date.toISOString();
}