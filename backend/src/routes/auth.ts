import express from 'express';
import { UserRepository } from '../repositories/userRepository';
import { LoginSchema, RegisterSchema } from '../lib/validation';
import { generateToken } from '../lib/auth';

const router = express.Router();
const userRepository = new UserRepository();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const validation = RegisterSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
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

    // Create user
    const user = await userRepository.create(userData);
    
    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Registration failed',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const validation = LoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data',
          details: validation.error.errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    const { email, password } = validation.data;

    // Verify user credentials
    const user = await userRepository.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// POST /api/auth/refresh - Refresh token (optional - for future use)
router.post('/refresh', async (req, res) => {
  // This could be implemented later for token refresh functionality
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Token refresh not implemented yet',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
    
    const user = await userRepository.findById(decoded.userId);
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

    res.json({ user });
  } catch (error) {
    return res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

export default router;