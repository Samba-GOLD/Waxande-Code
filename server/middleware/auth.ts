import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be set in environment variables

export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number, username: string, email: string };
      
      const user = await db
        .selectFrom('users')
        .where('id', '=', decoded.id)
        .select(['id', 'username', 'email'])
        .executeTakeFirst();
      
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
