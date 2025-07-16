import express from 'express';
import { UserRepository } from '../repositories/userRepository';
import { CreateUserSchema, UpdateUserSchema } from '../lib/validation';
import { ApiError } from '../types/models';
import { authenticateToken, AuthenticatedRequest } from '../lib/auth';

const router = express.Router();
const userRepository = new UserRepository();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await userRepository.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const validation = CreateUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const userData = validation.data;

    // Check if email already exists
    const existingEmail = await userRepository.existsByEmail(userData.email);
    if (existingEmail) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email address is already in use',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check if username already exists
    const existingUsername = await userRepository.existsByUsername(userData.username);
    if (existingUsername) {
      return res.status(409).json({
        error: {
          code: 'USERNAME_ALREADY_EXISTS',
          message: 'Username is already in use',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const user = await userRepository.create(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// PUT /api/users/:id - Update user (requires authentication)
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validation = UpdateUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const userData = validation.data;

    // Check ownership - users can only update their own account
    if (req.user!.id !== id) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only update your own account',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Check if email is being changed and if it's already in use
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await userRepository.existsByEmail(userData.email);
      if (emailExists) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email address is already in use',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }
    }

    // Check if username is being changed and if it's already in use
    if (userData.username && userData.username !== existingUser.username) {
      const usernameExists = await userRepository.existsByUsername(userData.username);
      if (usernameExists) {
        return res.status(409).json({
          error: {
            code: 'USERNAME_ALREADY_EXISTS',
            message: 'Username is already in use',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }
    }

    const updatedUser = await userRepository.update(id, userData);
    if (!updatedUser) {
      return res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update user',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// DELETE /api/users/:id - Delete user (requires authentication)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership - users can only delete their own account
    if (req.user!.id !== id) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only delete your own account',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }
    
    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const deleted = await userRepository.delete(id);
    if (!deleted) {
      return res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete user',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

export default router;