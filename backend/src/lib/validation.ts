import { z } from 'zod';
import { EventType } from '../types/models';

// Event validation schemas
export const EventTypeSchema = z.enum([
  EventType.SIMPLE_MESSAGE,
  EventType.PHOTO_WITH_NOTES,
  EventType.EMAIL,
  EventType.TEXT,
  EventType.DOCUMENT
]);

export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  type: EventTypeSchema,
  timestamp: z.string().datetime().optional().or(z.date().optional()),
  metadata: z.record(z.any()).optional(),
  assignedUserIds: z.array(z.string().cuid()).optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const UpdateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: EventTypeSchema.optional(),
  timestamp: z.string().datetime().optional().or(z.date().optional()),
  metadata: z.record(z.any()).optional(),
  assignedUserIds: z.array(z.string().cuid()).optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

// User validation schemas
export const CreateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
});

// Tag validation schemas
export const CreateTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
});

export const UpdateTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
});

// Search validation schema
export const SearchEventsSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  users: z.array(z.string().cuid()).optional(),
  types: z.array(EventTypeSchema).optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['timestamp', 'createdAt', 'updatedAt']).optional().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = CreateUserSchema;

// File upload validation
export const FileUploadSchema = z.object({
  originalname: z.string(),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
});

// Validation helper functions
export function validateEventType(type: string): type is EventType {
  return Object.values(EventType).includes(type as EventType);
}

export function validateCuid(id: string): boolean {
  return /^c[a-z0-9]{24}$/.test(id);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Type guards
export function isValidEventType(value: any): value is EventType {
  return typeof value === 'string' && Object.values(EventType).includes(value as EventType);
}

export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Sanitization helpers
export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function sanitizeHtml(str: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}