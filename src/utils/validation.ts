// Input validation and sanitization utilities for admin operations

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
    if (email.length > 254) {
      errors.push('Email is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Amount validation for financial operations
export function validateAmount(amount: any, min: number = 0, max: number = 10000000): ValidationResult {
  const errors: string[] = [];
  
  if (amount === null || amount === undefined) {
    errors.push('Amount is required');
  } else {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      errors.push('Amount must be a valid number');
    } else {
      if (numAmount < min) {
        errors.push(`Amount must be at least ${min.toLocaleString('vi-VN')}`);
      }
      if (numAmount > max) {
        errors.push(`Amount cannot exceed ${max.toLocaleString('vi-VN')}`);
      }
      if (!Number.isInteger(numAmount)) {
        errors.push('Amount must be a whole number');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Text validation with length limits
export function validateText(text: string, fieldName: string, minLength: number = 1, maxLength: number = 255): ValidationResult {
  const errors: string[] = [];
  
  if (!text || typeof text !== 'string') {
    errors.push(`${fieldName} is required`);
  } else {
    const trimmedText = text.trim();
    if (trimmedText.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    if (trimmedText.length > maxLength) {
      errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Product validation
export function validateProduct(productData: any): ValidationResult {
  const errors: string[] = [];
  
  // Title validation
  const titleValidation = validateText(productData.title, 'Product title', 3, 100);
  errors.push(...titleValidation.errors);
  
  // Description validation
  const descriptionValidation = validateText(productData.description, 'Product description', 10, 500);
  errors.push(...descriptionValidation.errors);
  
  // Price validation
  const priceValidation = validateAmount(productData.price, 1000, 50000000);
  errors.push(...priceValidation.errors);
  
  // Category validation
  const validCategories = ['gaming', 'social', 'productivity'];
  if (!productData.category || !validCategories.includes(productData.category)) {
    errors.push('Invalid product category');
  }
  
  // Stock validation
  if (productData.stock !== undefined) {
    const stockValidation = validateAmount(productData.stock, 0, 10000);
    errors.push(...stockValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// User validation
export function validateUser(userData: any): ValidationResult {
  const errors: string[] = [];
  
  // Email validation
  const emailValidation = validateEmail(userData.email);
  errors.push(...emailValidation.errors);
  
  // Name validation (optional but if provided must be valid)
  if (userData.name) {
    const nameValidation = validateText(userData.name, 'Name', 2, 50);
    errors.push(...nameValidation.errors);
  }
  
  // Role validation
  const validRoles = ['user', 'admin'];
  if (userData.role && !validRoles.includes(userData.role)) {
    errors.push('Invalid user role');
  }
  
  // Status validation
  const validStatuses = ['active', 'suspended', 'banned'];
  if (userData.status && !validStatuses.includes(userData.status)) {
    errors.push('Invalid user status');
  }
  
  // Balance validation
  if (userData.balance !== undefined) {
    const balanceValidation = validateAmount(userData.balance, 0, 100000000);
    errors.push(...balanceValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Top-up validation
export function validateTopUp(topUpData: any): ValidationResult {
  const errors: string[] = [];
  
  // Amount validation
  const amountValidation = validateAmount(topUpData.amount, 1000, 10000000);
  errors.push(...amountValidation.errors);
  
  // Description validation
  const descriptionValidation = validateText(topUpData.description, 'Description', 5, 200);
  errors.push(...descriptionValidation.errors);
  
  // Admin note validation (optional)
  if (topUpData.adminNote) {
    const noteValidation = validateText(topUpData.adminNote, 'Admin note', 1, 500);
    errors.push(...noteValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .substring(0, 254); // RFC limit
}

export function sanitizeAmount(amount: any): number {
  const num = Number(amount);
  if (isNaN(num)) return 0;
  
  // Round to nearest integer and ensure it's positive
  return Math.max(0, Math.round(num));
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitMap.get(identifier);
  
  if (!current || current.resetTime < windowStart) {
    // Reset or initialize
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

// IP address validation
export function validateIPAddress(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// SQL injection prevention (basic)
export function containsSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'UNION', 'OR', 'AND', '--', ';', '/*', '*/', 'xp_', 'sp_'
  ];
  
  const upperInput = input.toUpperCase();
  return sqlKeywords.some(keyword => upperInput.includes(keyword));
}

// XSS prevention
export function containsXSS(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// Comprehensive input validation
export function validateAndSanitizeInput(input: any, type: 'string' | 'email' | 'number' | 'amount'): {
  isValid: boolean;
  sanitized: any;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitized: any = input;
  let isValid = true;
  
  if (input === null || input === undefined) {
    errors.push('Input is required');
    isValid = false;
    return { isValid, sanitized: '', errors };
  }
  
  switch (type) {
    case 'string':
      if (typeof input !== 'string') {
        errors.push('Input must be a string');
        isValid = false;
      } else {
        if (containsSQLInjection(input)) {
          errors.push('Input contains potentially dangerous content');
          isValid = false;
        }
        if (containsXSS(input)) {
          errors.push('Input contains potentially dangerous scripts');
          isValid = false;
        }
        sanitized = sanitizeString(input);
      }
      break;
      
    case 'email':
      const emailValidation = validateEmail(input);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
        isValid = false;
      } else {
        sanitized = sanitizeEmail(input);
      }
      break;
      
    case 'number':
    case 'amount':
      const numValidation = validateAmount(input);
      if (!numValidation.isValid) {
        errors.push(...numValidation.errors);
        isValid = false;
      } else {
        sanitized = sanitizeAmount(input);
      }
      break;
  }
  
  return { isValid, sanitized, errors };
}
