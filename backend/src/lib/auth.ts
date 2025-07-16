import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/userRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    displayName: string;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export function generateToken(user: { id: string; username: string; email: string; displayName: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Verify user still exists
  const userRepository = new UserRepository();
  const user = await userRepository.findById(decoded.userId);
  
  if (!user) {
    return res.status(403).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User associated with token no longer exists',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
  };

  next();
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const userRepository = new UserRepository();
      const user = await userRepository.findById(decoded.userId);
      
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        };
      }
    }
  }

  next();
}

// Check if user owns resource or is admin
export function requireOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  if (req.user.id !== resourceUserId) {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only access your own resources',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  next();
}