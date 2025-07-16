// Core data models matching the database schema

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  content: string;
  type: EventType;
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  creator?: User;
  assignedUsers?: User[];
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  eventId: string;
  uploadedAt: Date;
}

export interface EventEditHistory {
  id: string;
  eventId: string;
  changes: Record<string, any>;
  editedAt: Date;
  editedBy: string;
}

// Enums
export enum EventType {
  SIMPLE_MESSAGE = 'SIMPLE_MESSAGE',
  PHOTO_WITH_NOTES = 'PHOTO_WITH_NOTES',
  EMAIL = 'EMAIL',
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT'
}

// API Request/Response types
export interface CreateEventRequest {
  title: string;
  content: string;
  type: EventType;
  timestamp?: Date;
  metadata?: Record<string, any>;
  assignedUserIds?: string[];
  tagIds?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  content?: string;
  type?: EventType;
  timestamp?: Date;
  metadata?: Record<string, any>;
  assignedUserIds?: string[];
  tagIds?: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string | null;
}

export interface SearchEventsRequest {
  query?: string;
  tags?: string[];
  users?: string[];
  types?: EventType[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  error: ApiError;
  timestamp: string;
  path: string;
}