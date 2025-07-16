import express from 'express';
import { EventRepository } from '../repositories/eventRepository';
import { UserRepository } from '../repositories/userRepository';
import { TagRepository } from '../repositories/tagRepository';
import { CreateEventSchema, UpdateEventSchema } from '../lib/validation';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../lib/auth';
import { EventType } from '../types/models';

const router = express.Router();
const eventRepository = new EventRepository();
const userRepository = new UserRepository();
const tagRepository = new TagRepository();

// GET /api/events - Get all events with pagination
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const creatorId = req.query.creatorId as string;

    let result;
    if (creatorId) {
      // Get events by specific creator
      result = await eventRepository.findByCreator(creatorId, page, limit);
    } else {
      // Get all events
      result = await eventRepository.findAll(page, limit);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch events',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// GET /api/events/stats - Get event statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await eventRepository.getEventStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch event statistics',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventRepository.findById(id);
    
    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch event',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/events - Create new event (requires authentication)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = CreateEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const eventData = validation.data;

    // Prepare event data with proper types
    const processedEventData = {
      ...eventData,
      timestamp: eventData.timestamp ? 
        (typeof eventData.timestamp === 'string' ? new Date(eventData.timestamp) : eventData.timestamp) 
        : undefined,
    };

    // Validate assigned users exist
    if (processedEventData.assignedUserIds && processedEventData.assignedUserIds.length > 0) {
      for (const userId of processedEventData.assignedUserIds) {
        const userExists = await userRepository.exists(userId);
        if (!userExists) {
          return res.status(400).json({
            error: {
              code: 'INVALID_USER_ID',
              message: `User with ID ${userId} does not exist`,
            },
            timestamp: new Date().toISOString(),
            path: req.path,
          });
        }
      }
    }

    // Validate tags exist
    if (processedEventData.tagIds && processedEventData.tagIds.length > 0) {
      for (const tagId of processedEventData.tagIds) {
        const tagExists = await tagRepository.exists(tagId);
        if (!tagExists) {
          return res.status(400).json({
            error: {
              code: 'INVALID_TAG_ID',
              message: `Tag with ID ${tagId} does not exist`,
            },
            timestamp: new Date().toISOString(),
            path: req.path,
          });
        }
      }
    }

    const event = await eventRepository.create(processedEventData, req.user!.id);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create event',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// PUT /api/events/:id - Update event (requires authentication)
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validation = UpdateEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const eventData = validation.data;

    // Prepare event data with proper types
    const processedEventData = {
      ...eventData,
      timestamp: eventData.timestamp ? 
        (typeof eventData.timestamp === 'string' ? new Date(eventData.timestamp) : eventData.timestamp) 
        : undefined,
    };

    // Check if event exists
    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check ownership - only creator can edit
    if (existingEvent.creatorId !== req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only edit events you created',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Validate assigned users exist
    if (processedEventData.assignedUserIds && processedEventData.assignedUserIds.length > 0) {
      for (const userId of processedEventData.assignedUserIds) {
        const userExists = await userRepository.exists(userId);
        if (!userExists) {
          return res.status(400).json({
            error: {
              code: 'INVALID_USER_ID',
              message: `User with ID ${userId} does not exist`,
            },
            timestamp: new Date().toISOString(),
            path: req.path,
          });
        }
      }
    }

    // Validate tags exist
    if (processedEventData.tagIds && processedEventData.tagIds.length > 0) {
      for (const tagId of processedEventData.tagIds) {
        const tagExists = await tagRepository.exists(tagId);
        if (!tagExists) {
          return res.status(400).json({
            error: {
              code: 'INVALID_TAG_ID',
              message: `Tag with ID ${tagId} does not exist`,
            },
            timestamp: new Date().toISOString(),
            path: req.path,
          });
        }
      }
    }

    const updatedEvent = await eventRepository.update(id, processedEventData, req.user!.id);
    if (!updatedEvent) {
      return res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update event',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update event',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// DELETE /api/events/:id - Delete event (requires authentication)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check ownership - only creator can delete
    if (existingEvent.creatorId !== req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only delete events you created',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const deleted = await eventRepository.delete(id);
    if (!deleted) {
      return res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete event',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete event',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

export default router;