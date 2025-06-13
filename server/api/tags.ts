import express from 'express';
import { db } from '../db/index.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all tags for the current user
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    
    const tags = await db
      .selectFrom('tags')
      .selectAll()
      .where('user_id', '=', userId!)
      .orderBy('name', 'asc')
      .execute();
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create a new tag
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;
    
    if (!name) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }
    
    // Check if tag already exists for this user
    const existingTag = await db
      .selectFrom('tags')
      .selectAll()
      .where('name', '=', name)
      .where('user_id', '=', userId!)
      .executeTakeFirst();
    
    if (existingTag) {
      res.status(409).json({ error: 'Tag already exists' });
      return;
    }
    
    const result = await db
      .insertInto('tags')
      .values({
        name,
        user_id: userId!
      })
      .returning('id')
      .executeTakeFirst();
    
    if (!result) {
      res.status(500).json({ error: 'Failed to create tag' });
      return;
    }
    
    const newTag = await db
      .selectFrom('tags')
      .selectAll()
      .where('id', '=', result.id)
      .executeTakeFirst();
    
    res.status(201).json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Delete a tag
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const tagId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(tagId)) {
      res.status(400).json({ error: 'Invalid tag ID' });
      return;
    }
    
    // Check if tag belongs to user
    const tag = await db
      .selectFrom('tags')
      .selectAll()
      .where('id', '=', tagId)
      .executeTakeFirst();
    
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }
    
    if (tag.user_id !== userId) {
      res.status(403).json({ error: 'You do not have permission to delete this tag' });
      return;
    }
    
    const result = await db
      .deleteFrom('tags')
      .where('id', '=', tagId)
      .executeTakeFirst();
    
    if (!result || Number(result.numDeletedRows) === 0) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
