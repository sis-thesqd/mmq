/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: unknown;
}

/**
 * Validates and sanitizes an account number
 *
 * @param input - The input to validate
 * @returns Validation result with sanitized value
 */
export function validateAccountNumber(input: string | number): ValidationResult {
  // Convert to string and trim
  const trimmed = String(input).trim();

  // Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Account number is required',
    };
  }

  // Remove any non-numeric characters
  const sanitized = trimmed.replace(/\D/g, '');

  // Check if anything remains after sanitization
  if (!sanitized) {
    return {
      isValid: false,
      error: 'Account number must contain only numbers',
    };
  }

  // Convert to number
  const accountNumber = parseInt(sanitized, 10);

  // Validate range (positive integers only)
  if (isNaN(accountNumber) || accountNumber <= 0) {
    return {
      isValid: false,
      error: 'Account number must be a positive number',
    };
  }

  // Validate reasonable range (e.g., max 10 digits)
  if (sanitized.length > 10) {
    return {
      isValid: false,
      error: 'Account number is too large',
    };
  }

  return {
    isValid: true,
    sanitized: accountNumber,
  };
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 *
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove basic XSS characters
}

/**
 * Validates an email address
 *
 * @param email - The email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed.toLowerCase(),
  };
}

/**
 * Validates a task ID (ClickUp format)
 *
 * @param taskId - The task ID to validate
 * @returns Validation result
 */
export function validateTaskId(taskId: string): ValidationResult {
  const trimmed = String(taskId).trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Task ID is required',
    };
  }

  // ClickUp task IDs are alphanumeric
  const taskIdRegex = /^[a-zA-Z0-9]+$/;

  if (!taskIdRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid task ID format',
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Task ID is too long',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
  };
}

/**
 * Validates a position number
 *
 * @param position - The position to validate
 * @returns Validation result
 */
export function validatePosition(position: number | string): ValidationResult {
  const num = typeof position === 'string' ? parseInt(position, 10) : position;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Position must be a number',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: 'Position must be non-negative',
    };
  }

  if (num > 10000) {
    return {
      isValid: false,
      error: 'Position is too large',
    };
  }

  return {
    isValid: true,
    sanitized: num,
  };
}

/**
 * Validates an object has required keys
 *
 * @param obj - The object to validate
 * @param requiredKeys - Array of required key names
 * @returns Validation result
 */
export function validateRequiredKeys(
  obj: Record<string, unknown>,
  requiredKeys: string[]
): ValidationResult {
  const missingKeys: string[] = [];

  for (const key of requiredKeys) {
    if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingKeys.join(', ')}`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Sanitizes an object by removing undefined/null values
 *
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<T>;
}
