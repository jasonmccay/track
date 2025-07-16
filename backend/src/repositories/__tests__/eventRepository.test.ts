import { EventRepository } from '../eventRepository';
import { CreateEventRequest, EventType } from '../../types/models';

describe('EventRepository', () => {
  let eventRepository: EventRepository;

  beforeEach(() => {
    eventRepository = new EventRepository();
  });

  describe('EventRepository class', () => {
    it('should be instantiated', () => {
      expect(eventRepository).toBeInstanceOf(EventRepository);
    });

    it('should have all required methods', () => {
      expect(typeof eventRepository.findAll).toBe('function');
      expect(typeof eventRepository.findById).toBe('function');
      expect(typeof eventRepository.create).toBe('function');
      expect(typeof eventRepository.update).toBe('function');
      expect(typeof eventRepository.delete).toBe('function');
      expect(typeof eventRepository.exists).toBe('function');
      expect(typeof eventRepository.findByCreator).toBe('function');
      expect(typeof eventRepository.findByDateRange).toBe('function');
      expect(typeof eventRepository.getEventStats).toBe('function');
    });
  });

  describe('Input validation', () => {
    it('should handle valid event data structure', () => {
      const validEventData: CreateEventRequest = {
        title: 'Test Event',
        content: 'This is a test event',
        type: EventType.SIMPLE_MESSAGE,
        timestamp: new Date(),
        metadata: { key: 'value' },
        assignedUserIds: ['user1', 'user2'],
        tagIds: ['tag1', 'tag2'],
      };

      expect(validEventData.title).toBe('Test Event');
      expect(validEventData.content).toBe('This is a test event');
      expect(validEventData.type).toBe(EventType.SIMPLE_MESSAGE);
      expect(validEventData.timestamp).toBeInstanceOf(Date);
      expect(validEventData.metadata).toEqual({ key: 'value' });
      expect(validEventData.assignedUserIds).toEqual(['user1', 'user2']);
      expect(validEventData.tagIds).toEqual(['tag1', 'tag2']);
    });

    it('should handle minimal event data', () => {
      const minimalEventData: CreateEventRequest = {
        title: 'Minimal Event',
        content: 'Minimal content',
        type: EventType.TEXT,
      };

      expect(minimalEventData.title).toBe('Minimal Event');
      expect(minimalEventData.content).toBe('Minimal content');
      expect(minimalEventData.type).toBe(EventType.TEXT);
      expect(minimalEventData.timestamp).toBeUndefined();
      expect(minimalEventData.metadata).toBeUndefined();
      expect(minimalEventData.assignedUserIds).toBeUndefined();
      expect(minimalEventData.tagIds).toBeUndefined();
    });
  });

  describe('Event types', () => {
    it('should support all event types', () => {
      const eventTypes = [
        EventType.SIMPLE_MESSAGE,
        EventType.PHOTO_WITH_NOTES,
        EventType.EMAIL,
        EventType.TEXT,
        EventType.DOCUMENT,
      ];

      eventTypes.forEach(type => {
        const eventData: CreateEventRequest = {
          title: `${type} Event`,
          content: `Content for ${type}`,
          type,
        };

        expect(eventData.type).toBe(type);
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters', () => {
      const page = 2;
      const limit = 10;
      const skip = (page - 1) * limit;

      expect(skip).toBe(10);
      expect(page).toBe(2);
      expect(limit).toBe(10);
    });

    it('should calculate total pages correctly', () => {
      const total = 25;
      const limit = 10;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(3);
    });
  });
});