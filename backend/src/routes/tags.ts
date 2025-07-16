import express from 'express';
import { TagRepository } from '../repositories/tagRepository';
import { CreateTagSchema, UpdateTagSchema } from '../lib/validation';
import { optionalAuth, AuthenticatedRequest } from '../lib/auth';

const router = express.Router();
const tagRepository = new TagRepository();

// GET /api/tags - Get all tags
router.get('/', async (req, res) => {
  try {
    const { withCount, popular, limit } = req.query;
    
    let tags;
    
    if (popular === 'true') {
      const limitNum = limit ? parseInt(limit as string) : 10;
      tags = await tagRepository.getPopularTags(limitNum);
    } else if (withCount === 'true') {
      tags = await tagRepository.getTagsWithEventCount();
    } else {
      tags = await tagRepository.findAll();
    }
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tags',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// GET /api/tags/:id - Get tag by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await tagRepository.findById(id);
    
    if (!tag) {
      return res.status(404).json({
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }
    
    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tag',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/tags - Create new tag
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = CreateTagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tag data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const tagData = validation.data;

    // Check if tag name already exists
    const existingTag = await tagRepository.existsByName(tagData.name);
    if (existingTag) {
      return res.status(409).json({
        error: {
          code: 'TAG_ALREADY_EXISTS',
          message: 'Tag with this name already exists',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const tag = await tagRepository.create(tagData);
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tag',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/tags/batch - Create multiple tags
router.post('/batch', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { names } = req.body;
    
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Names array is required and must not be empty',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Validate each tag name
    for (const name of names) {
      const validation = CreateTagSchema.safeParse({ name });
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid tag name: ${name}`,
            details: validation.error.errors,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }
    }

    const tags = await tagRepository.createMultiple(names);
    res.status(201).json(tags);
  } catch (error) {
    console.error('Error creating tags:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tags',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validation = UpdateTagSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tag data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const tagData = validation.data;

    // Check if tag exists
    const existingTag = await tagRepository.findById(id);
    if (!existingTag) {
      return res.status(404).json({
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check if name is being changed and if it's already in use
    if (tagData.name && tagData.name !== existingTag.name) {
      const nameExists = await tagRepository.existsByName(tagData.name);
      if (nameExists) {
        return res.status(409).json({
          error: {
            code: 'TAG_ALREADY_EXISTS',
            message: 'Tag with this name already exists',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }
    }

    const updatedTag = await tagRepository.update(id, tagData);
    if (!updatedTag) {
      return res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update tag',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update tag',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const existingTag = await tagRepository.findById(id);
    if (!existingTag) {
      return res.status(404).json({
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const deleted = await tagRepository.delete(id);
    if (!deleted) {
      return res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete tag',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete tag',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

export default router;