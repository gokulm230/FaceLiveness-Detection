/**
 * Date and time utility functions for the face liveness detection app
 */

/**
 * Format a date and time for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions = {
    includeTime: true,
    includeSeconds: false,
    includeDate: true,
    relative: false,
    format: 'locale' // 'locale', 'iso', 'custom'
  };

  const config = { ...defaultOptions, ...options };

  // Relative time (e.g., "2 minutes ago")
  if (config.relative) {
    return formatRelativeTime(dateObj);
  }

  // ISO format
  if (config.format === 'iso') {
    return dateObj.toISOString();
  }

  // Custom locale formatting
  const formatOptions = {};

  if (config.includeDate) {
    formatOptions.year = 'numeric';
    formatOptions.month = 'short';
    formatOptions.day = 'numeric';
  }

  if (config.includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    
    if (config.includeSeconds) {
      formatOptions.second = '2-digit';
    }
  }

  try {
    return dateObj.toLocaleString('en-US', formatOptions);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateObj.toString();
  }
};

/**
 * Format relative time (e.g., "2 minutes ago", "in 3 hours")
 * @param {Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return diffSec === 0 ? 'now' : rtf.format(-diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(-diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(-diffHour, 'hour');
  } else if (Math.abs(diffDay) < 7) {
    return rtf.format(-diffDay, 'day');
  } else {
    // For dates more than a week away, show absolute date
    return formatDateTime(date, { relative: false, includeTime: false });
  }
};

/**
 * Calculate duration between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Human-readable duration
 */
export const calculateDuration = (startDate, endDate = new Date()) => {
  if (!startDate) return 'Unknown';

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid';
  }

  const diffMs = end.getTime() - start.getTime();
  
  if (diffMs < 0) {
    return 'Invalid duration';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format duration in milliseconds to human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (ms) => {
  if (typeof ms !== 'number' || ms < 0) {
    return 'Invalid';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get session duration for display
 * @param {string|Date} startTime - Session start time
 * @param {string|Date} endTime - Session end time
 * @returns {Object} Duration information
 */
export const getSessionDuration = (startTime, endTime = new Date()) => {
  if (!startTime) {
    return {
      duration: 'Unknown',
      milliseconds: 0,
      isValid: false
    };
  }

  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      duration: 'Invalid',
      milliseconds: 0,
      isValid: false
    };
  }

  const diffMs = end.getTime() - start.getTime();
  
  if (diffMs < 0) {
    return {
      duration: 'Invalid',
      milliseconds: 0,
      isValid: false
    };
  }

  return {
    duration: formatDuration(diffMs),
    milliseconds: diffMs,
    isValid: true
  };
};

/**
 * Check if a date is within a certain time range
 * @param {string|Date} date - Date to check
 * @param {number} rangeMs - Range in milliseconds
 * @returns {boolean} True if within range
 */
export const isWithinTimeRange = (date, rangeMs) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const diffMs = Math.abs(now.getTime() - dateObj.getTime());
  return diffMs <= rangeMs;
};

/**
 * Get time zone information
 * @returns {Object} Time zone details
 */
export const getTimeZoneInfo = () => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    
    return {
      timeZone,
      offset: offset / 60, // Convert to hours
      offsetString: formatTimezoneOffset(offset),
      name: timeZone.split('/').pop() || timeZone
    };
  } catch (error) {
    console.error('Failed to get timezone info:', error);
    return {
      timeZone: 'Unknown',
      offset: 0,
      offsetString: '+00:00',
      name: 'Unknown'
    };
  }
};

/**
 * Format timezone offset
 * @param {number} offsetMinutes - Offset in minutes
 * @returns {string} Formatted offset (e.g., "+05:30")
 */
const formatTimezoneOffset = (offsetMinutes) => {
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes <= 0 ? '+' : '-';
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Create a timestamp for logging
 * @returns {string} ISO timestamp
 */
export const createTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Parse session time from various formats
 * @param {any} time - Time in various formats
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseSessionTime = (time) => {
  if (!time) return null;
  
  if (time instanceof Date) {
    return isNaN(time.getTime()) ? null : time;
  }
  
  if (typeof time === 'string') {
    const parsed = new Date(time);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  if (typeof time === 'number') {
    // Assume timestamp in milliseconds
    const parsed = new Date(time);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
};

/**
 * Format timestamp for file names (safe for file systems)
 * @param {Date} date - Date to format
 * @returns {string} File-safe timestamp
 */
export const formatFilenameTimestamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};
