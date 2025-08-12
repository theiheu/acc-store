import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validateAmount,
  validateText,
  validateProduct,
  validateUser,
  validateTopUp,
  sanitizeString,
  sanitizeEmail,
  sanitizeAmount,
  containsSQLInjection,
  containsXSS,
  validateAndSanitizeInput,
} from './validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        '',
        null as any,
        undefined as any,
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is too long');
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      const validAmounts = [1000, 50000, 1000000];

      validAmounts.forEach(amount => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        -100,
        0,
        'not-a-number',
        null,
        undefined,
        15000000, // Above default max
      ];

      invalidAmounts.forEach(amount => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should respect custom min/max values', () => {
      const result1 = validateAmount(500, 1000, 10000);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Amount must be at least 1,000');

      const result2 = validateAmount(15000, 1000, 10000);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Amount cannot exceed 10,000');
    });

    it('should reject decimal amounts', () => {
      const result = validateAmount(1000.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be a whole number');
    });
  });

  describe('validateText', () => {
    it('should validate correct text', () => {
      const result = validateText('Valid text', 'Test field', 5, 20);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject text that is too short', () => {
      const result = validateText('Hi', 'Test field', 5, 20);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test field must be at least 5 characters long');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(25);
      const result = validateText(longText, 'Test field', 5, 20);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test field cannot exceed 20 characters');
    });

    it('should reject empty or null text', () => {
      const result1 = validateText('', 'Test field');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Test field is required');

      const result2 = validateText(null as any, 'Test field');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Test field is required');
    });
  });

  describe('validateProduct', () => {
    const validProduct = {
      title: 'Test Product',
      description: 'This is a test product description',
      price: 50000,
      category: 'gaming',
      stock: 10,
    };

    it('should validate correct product data', () => {
      const result = validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject product with invalid title', () => {
      const invalidProduct = { ...validProduct, title: 'Hi' };
      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Product title'))).toBe(true);
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = { ...validProduct, price: 500 };
      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 1,000'))).toBe(true);
    });

    it('should reject product with invalid category', () => {
      const invalidProduct = { ...validProduct, category: 'invalid-category' };
      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid product category');
    });
  });

  describe('validateUser', () => {
    const validUser = {
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      status: 'active',
      balance: 10000,
    };

    it('should validate correct user data', () => {
      const result = validateUser(validUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('should reject user with invalid role', () => {
      const invalidUser = { ...validUser, role: 'invalid-role' };
      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid user role');
    });

    it('should reject user with invalid status', () => {
      const invalidUser = { ...validUser, status: 'invalid-status' };
      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid user status');
    });
  });

  describe('validateTopUp', () => {
    const validTopUp = {
      amount: 100000,
      description: 'Test top-up',
      adminNote: 'Admin note',
    };

    it('should validate correct top-up data', () => {
      const result = validateTopUp(validTopUp);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject top-up with invalid amount', () => {
      const invalidTopUp = { ...validTopUp, amount: 500 };
      const result = validateTopUp(invalidTopUp);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 1,000'))).toBe(true);
    });

    it('should reject top-up with short description', () => {
      const invalidTopUp = { ...validTopUp, description: 'Hi' };
      const result = validateTopUp(invalidTopUp);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Description'))).toBe(true);
    });
  });

  describe('Sanitization Functions', () => {
    describe('sanitizeString', () => {
      it('should remove HTML tags and quotes', () => {
        const input = '<script>alert("xss")</script>Hello "World"';
        const result = sanitizeString(input);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).not.toContain('"');
      });

      it('should trim whitespace', () => {
        const input = '  Hello World  ';
        const result = sanitizeString(input);
        expect(result).toBe('Hello World');
      });

      it('should limit length', () => {
        const longInput = 'a'.repeat(1500);
        const result = sanitizeString(longInput);
        expect(result.length).toBeLessThanOrEqual(1000);
      });
    });

    describe('sanitizeEmail', () => {
      it('should convert to lowercase and trim', () => {
        const input = '  USER@EXAMPLE.COM  ';
        const result = sanitizeEmail(input);
        expect(result).toBe('user@example.com');
      });

      it('should remove invalid characters', () => {
        const input = 'user<>@example.com';
        const result = sanitizeEmail(input);
        expect(result).toBe('user@example.com');
      });
    });

    describe('sanitizeAmount', () => {
      it('should convert to positive integer', () => {
        expect(sanitizeAmount(-100.5)).toBe(0);
        expect(sanitizeAmount(100.7)).toBe(101);
        expect(sanitizeAmount('150')).toBe(150);
      });

      it('should handle invalid input', () => {
        expect(sanitizeAmount('not-a-number')).toBe(0);
        expect(sanitizeAmount(null)).toBe(0);
        expect(sanitizeAmount(undefined)).toBe(0);
      });
    });
  });

  describe('Security Functions', () => {
    describe('containsSQLInjection', () => {
      it('should detect SQL injection attempts', () => {
        const maliciousInputs = [
          "'; DROP TABLE users; --",
          'SELECT * FROM users',
          'UNION SELECT password FROM admin',
          '1 OR 1=1',
        ];

        maliciousInputs.forEach(input => {
          expect(containsSQLInjection(input)).toBe(true);
        });
      });

      it('should allow safe input', () => {
        const safeInputs = [
          'Hello World',
          'user@example.com',
          'Product description',
        ];

        safeInputs.forEach(input => {
          expect(containsSQLInjection(input)).toBe(false);
        });
      });
    });

    describe('containsXSS', () => {
      it('should detect XSS attempts', () => {
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '<img onerror="alert(1)" src="x">',
          '<iframe src="malicious.com"></iframe>',
        ];

        maliciousInputs.forEach(input => {
          expect(containsXSS(input)).toBe(true);
        });
      });

      it('should allow safe input', () => {
        const safeInputs = [
          'Hello World',
          'This is a normal description',
          'Price: $100',
        ];

        safeInputs.forEach(input => {
          expect(containsXSS(input)).toBe(false);
        });
      });
    });
  });

  describe('validateAndSanitizeInput', () => {
    it('should validate and sanitize string input', () => {
      const result = validateAndSanitizeInput('  Hello World  ', 'string');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject malicious string input', () => {
      const result = validateAndSanitizeInput('<script>alert("xss")</script>', 'string');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('dangerous scripts'))).toBe(true);
    });

    it('should validate and sanitize email input', () => {
      const result = validateAndSanitizeInput('  USER@EXAMPLE.COM  ', 'email');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });

    it('should validate and sanitize amount input', () => {
      const result = validateAndSanitizeInput('1000.5', 'amount');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(1001);
    });

    it('should handle null/undefined input', () => {
      const result = validateAndSanitizeInput(null, 'string');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input is required');
    });
  });
});
