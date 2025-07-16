import { prisma } from '../lib/database';
import { Tag, CreateTagRequest } from '../types/models';

export class TagRepository {
  async findAll(): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return tags;
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await prisma.tag.findUnique({
      where: { id },
    });
    return tag;
  }

  async findByName(name: string): Promise<Tag | null> {
    const tag = await prisma.tag.findUnique({
      where: { name },
    });
    return tag;
  }

  async create(tagData: CreateTagRequest): Promise<Tag> {
    const tag = await prisma.tag.create({
      data: {
        name: tagData.name,
        color: tagData.color,
      },
    });
    return tag;
  }

  async update(id: string, tagData: Partial<CreateTagRequest>): Promise<Tag | null> {
    try {
      const tag = await prisma.tag.update({
        where: { id },
        data: tagData,
      });
      return tag;
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.tag.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.tag.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await prisma.tag.count({
      where: { name },
    });
    return count > 0;
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return tags;
  }

  async findByNames(names: string[]): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          in: names,
        },
      },
    });
    return tags;
  }

  async createMultiple(tagNames: string[]): Promise<Tag[]> {
    const existingTags = await this.findByNames(tagNames);
    const existingTagNames = existingTags.map(tag => tag.name);
    
    const newTagNames = tagNames.filter(name => !existingTagNames.includes(name));
    
    if (newTagNames.length === 0) {
      return existingTags;
    }

    // Create new tags with random colors
    const newTags = await Promise.all(
      newTagNames.map(name => 
        this.create({
          name,
          color: this.getRandomColor(),
        })
      )
    );

    return [...existingTags, ...newTags];
  }

  async getTagsWithEventCount(): Promise<Array<Tag & { eventCount: number }>> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      eventCount: tag._count.events,
    }));
  }

  async getPopularTags(limit: number = 10): Promise<Array<Tag & { eventCount: number }>> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        events: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      eventCount: tag._count.events,
    }));
  }

  private getRandomColor(): string {
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#6366F1', // Indigo
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}