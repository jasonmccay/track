import { prisma } from '../lib/database';
import { Event, CreateEventRequest, UpdateEventRequest, EventType, PaginatedResponse } from '../types/models';

export class EventRepository {
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  displayName: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.event.count(),
    ]);

    const formattedEvents = events.map(this.formatEvent);

    return {
      data: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Event | null> {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        attachments: true,
      },
    });

    return event ? this.formatEvent(event) : null;
  }

  async create(eventData: CreateEventRequest, creatorId: string): Promise<Event> {
    const { assignedUserIds = [], tagIds = [], ...eventFields } = eventData;

    const event = await prisma.event.create({
      data: {
        ...eventFields,
        type: eventData.type as string, // Convert enum to string for SQLite
        timestamp: eventData.timestamp || new Date(),
        metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
        creatorId,
        assignedUsers: {
          create: assignedUserIds.map(userId => ({
            userId,
          })),
        },
        tags: {
          create: tagIds.map(tagId => ({
            tagId,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        attachments: true,
      },
    });

    return this.formatEvent(event);
  }

  async update(id: string, eventData: UpdateEventRequest, editorId: string): Promise<Event | null> {
    try {
      const { assignedUserIds, tagIds, ...eventFields } = eventData;

      // Get current event to track changes
      const currentEvent = await this.findById(id);
      if (!currentEvent) {
        return null;
      }

      // Prepare update data
      const updateData: any = {
        ...eventFields,
      };

      if (eventData.type) {
        updateData.type = eventData.type as string;
      }

      if (eventData.metadata !== undefined) {
        updateData.metadata = eventData.metadata ? JSON.stringify(eventData.metadata) : null;
      }

      // Update event with relationships
      const event = await prisma.event.update({
        where: { id },
        data: {
          ...updateData,
          // Handle assigned users
          ...(assignedUserIds !== undefined && {
            assignedUsers: {
              deleteMany: {},
              create: assignedUserIds.map(userId => ({
                userId,
              })),
            },
          }),
          // Handle tags
          ...(tagIds !== undefined && {
            tags: {
              deleteMany: {},
              create: tagIds.map(tagId => ({
                tagId,
              })),
            },
          }),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  displayName: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          attachments: true,
        },
      });

      // Track changes in edit history
      await this.recordEditHistory(id, currentEvent, this.formatEvent(event), editorId);

      return this.formatEvent(event);
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.event.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.event.count({
      where: { id },
    });
    return count > 0;
  }

  async findByCreator(creatorId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { creatorId },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  displayName: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.event.count({
        where: { creatorId },
      }),
    ]);

    const formattedEvents = events.map(this.formatEvent);

    return {
      data: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByDateRange(startDate: Date, endDate: Date, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  displayName: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.event.count({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const formattedEvents = events.map(this.formatEvent);

    return {
      data: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventStats() {
    const [totalEvents, eventsByType, recentEvents] = await Promise.all([
      prisma.event.count(),
      prisma.event.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
      }),
      prisma.event.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.map(item => ({
        type: item.type as EventType,
        count: item._count.type,
      })),
      recentEvents,
    };
  }

  private async recordEditHistory(eventId: string, oldEvent: Event, newEvent: Event, editorId: string) {
    const changes: Record<string, any> = {};

    // Compare fields and record changes
    if (oldEvent.title !== newEvent.title) {
      changes.title = { from: oldEvent.title, to: newEvent.title };
    }
    if (oldEvent.content !== newEvent.content) {
      changes.content = { from: oldEvent.content, to: newEvent.content };
    }
    if (oldEvent.type !== newEvent.type) {
      changes.type = { from: oldEvent.type, to: newEvent.type };
    }
    if (oldEvent.timestamp.getTime() !== newEvent.timestamp.getTime()) {
      changes.timestamp = { from: oldEvent.timestamp, to: newEvent.timestamp };
    }

    // Record changes if any
    if (Object.keys(changes).length > 0) {
      await prisma.eventEditHistory.create({
        data: {
          eventId,
          changes: JSON.stringify(changes),
          editedBy: editorId,
        },
      });
    }
  }

  private formatEvent(event: any): Event {
    return {
      id: event.id,
      title: event.title,
      content: event.content,
      type: event.type as EventType,
      timestamp: event.timestamp,
      metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      creatorId: event.creatorId,
      creator: event.creator,
      assignedUsers: event.assignedUsers?.map((au: any) => au.user) || [],
      tags: event.tags?.map((et: any) => et.tag) || [],
      attachments: event.attachments || [],
    };
  }
}