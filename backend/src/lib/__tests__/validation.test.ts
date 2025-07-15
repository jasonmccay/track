import {
  CreateEventSchema,
  UpdateEventSchema,
  CreateUserSchema,
  CreateTagSchema,
  SearchEventsSchema,
  LoginSchema,
  validateEventType,
  validateCuid,
  validateEmail,
  validateHexColor,
  isValidEventType,
  sanitizeString,
  sanitizeHtml,
} from '../validation';
import { EventType } from '../../types/models';

describe('Validation Schemas', () => {
  describe('CreateEventSchema', () => {
    it('should validate a valid event creation request', () => {
      const validEvent = {
        title: 'Test Event',
        content: 'This is a test event',
        type: EventType.SIMPLE_MESSAGE,
        timestamp: new Date().toISOString(),
        assignedUserIds: ['clh1234567890123456789012'],
        tagIds: ['clh1234567890123456789013'],
      };

      const result = CreateEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject event with empty title', () => {
      const invalidEvent = {
        title: '',
        content: 'This is a test event',
        type: EventType.SIMPLE_MESSAGE,
      };

      const result = CreateEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject event with invalid type', () => {
      const invalidEvent = {
        title: 'Test Event',
        content: 'This is a test event',
        type: 'INVALID_TYPE',
      };

      const result = CreateEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateUserSchema', () => {
    it('should validate a valid user creation request', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      };

      const result = CreateUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        displayName: 'Test User',
        password: 'password123',
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject user with short password', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: '123',
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateTagSchema', () => {
    it('should validate a valid tag creation request', () => {
      const validTag = {
        name: 'work',
        color: '#3B82F6',
      };

      const result = CreateTagSchema.safeParse(validTag);
      expect(result.success).toBe(true);
    });

    it('should reject tag with invalid color', () => {
      const invalidTag = {
        name: 'work',
        color: 'blue',
      };

      const result = CreateTagSchema.safeParse(invalidTag);
      expect(result.success).toBe(false);
    });
  });

  describe('SearchEventsSchema', () => {
    it('should validate a valid search request', () => {
      const validSearch = {
        query: 'test',
        tags: ['work', 'urgent'],
        page: 1,
        limit: 20,
        sortBy: 'timestamp' as const,
        sortOrder: 'desc' as const,
      };

      const result = SearchEventsSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalSearch = {};

      const result = SearchEventsSchema.safeParse(minimalSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('timestamp');
        expect(result.data.sortOrder).toBe('desc');
      }
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateEventType', () => {
    it('should return true for valid event types', () => {
      expect(validateEventType(EventType.SIMPLE_MESSAGE)).toBe(true);
      expect(validateEventType(EventType.PHOTO_WITH_NOTES)).toBe(true);
    });

    it('should return false for invalid event types', () => {
      expect(validateEventType('INVALID_TYPE')).toBe(false);
      expect(validateEventType('')).toBe(false);
    });
  });

  describe('validateCuid', () => {
    it('should return true for valid CUIDs', () => {
      expect(validateCuid('clh1234567890123456789012')).toBe(true);
    });

    it('should return false for invalid CUIDs', () => {
      expect(validateCuid('invalid-id')).toBe(false);
      expect(validateCuid('123')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validateHexColor', () => {
    it('should return true for valid hex colors', () => {
      expect(validateHexColor('#FF0000')).toBe(true);
      expect(validateHexColor('#3B82F6')).toBe(true);
    });

    it('should return false for invalid hex colors', () => {
      expect(validateHexColor('red')).toBe(false);
      expect(validateHexColor('#FF')).toBe(false);
      expect(validateHexColor('FF0000')).toBe(false);
    });
  });
});

describe('Type Guards', () => {
  describe('isValidEventType', () => {
    it('should return true for valid event types', () => {
      expect(isValidEventType(EventType.SIMPLE_MESSAGE)).toBe(true);
      expect(isValidEventType('SIMPLE_MESSAGE')).toBe(true);
    });

    it('should return false for invalid event types', () => {
      expect(isValidEventType('INVALID_TYPE')).toBe(false);
      expect(isValidEventType(123)).toBe(false);
      expect(isValidEventType(null)).toBe(false);
    });
  });
});

describe('Sanitization Helpers', () => {
  describe('sanitizeString', () => {
    it('should trim and normalize whitespace', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world');
      expect(sanitizeString('test\n\nstring')).toBe('test string');
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeHtml('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
    });
  });
});