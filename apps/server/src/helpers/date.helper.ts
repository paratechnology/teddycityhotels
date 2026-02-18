// src/helpers/date.helpers.ts

/**
 * Extracts the 3-letter month abbreviation from a date string.
 * Assumes format like "Wed Jun 12 2025 10:40:11 GMT+0100 (...)"
 * @param dateString The date string from the fingerprint device.
 * @returns Month abbreviation (e.g., "Jun") or null if parsing fails.
 */
export function extractMonthAbbreviation(dateString: string): string | null {
    const parts = dateString.split(' ');
    // Expecting parts[1] to be the month abbreviation
    return parts.length > 1 ? parts[1] : null;
}

/**
 * Extracts the day of the month as a two-digit string.
 * Assumes format like "Wed Jun 12 2025 10:40:11 GMT+0100 (...)"
 * @param dateString The date string from the fingerprint device.
 * @returns Day (e.g., "12") or null if parsing fails.
 */
export function extractDayString(dateString: string): string | null {
    const parts = dateString.split(' ');
    // Expecting parts[2] to be the day
    return parts.length > 2 ? parts[2] : null;
}

/**
 * Extracts the year as a four-digit string.
 * Assumes format like "Wed Jun 12 2025 10:40:11 GMT+0100 (...)"
 * @param dateString The date string from the fingerprint device.
 * @returns Year (e.g., "2025") or null if parsing fails.
 */
export function extractYearString(dateString: string): string | null {
    const parts = dateString.split(' ');
    // Expecting parts[3] to be the year
    return parts.length > 3 ? parts[3] : null;
}