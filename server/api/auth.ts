import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be set in environment variables

// Register a new user
router.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await db
      .selectFrom('users')
      .where(eb => eb.or([
        eb('email', '=', email),
        eb('username', '=', username)
      ]))
      .selectAll()
      .executeTakeFirst();
    
    if (existingUser) {
      res.status(409).json({ error: 'User with this email or username already exists' });
      return;
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await db
      .insertInto('users')
      .values({
        username,
        email,
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .returning('id')
      .executeTakeFirst();
    
    if (!result) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }
    
    // Create token
    const token = jwt.sign(
      { id: result.id, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Find user
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .select(['id', 'username', 'email', 'password_hash'])
      .executeTakeFirst();
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', async (req: express.Request, res: express.Response) => {
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
        .select(['id', 'username', 'email', 'created_at'])
        .executeTakeFirst();
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

export default router;
