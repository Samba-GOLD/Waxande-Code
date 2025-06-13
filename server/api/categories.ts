import express from 'express';
import { db } from '../db/index.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all categories for the current user
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    
    const categories = await db
      .selectFrom('categories')
      .selectAll()
      .where('user_id', '=', userId!)
      .orderBy('name', 'asc')
      .execute();
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new category
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;
    
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    
    // Check if category already exists for this user
    const existingCategory = await db
      .selectFrom('categories')
      .selectAll()
      .where('name', '=', name)
      .where('user_id', '=', userId!)
      .executeTakeFirst();
    
    if (existingCategory) {
      res.status(409).json({ error: 'Category already exists' });
      return;
    }
    
    const result = await db
      .insertInto('categories')
      .values({
        name,
        user_id: userId!
      })
      .returning('id')
      .executeTakeFirst();
    
    if (!result) {
      res.status(500).json({ error: 'Failed to create category' });
      return;
    }
    
    const newCategory = await db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', result.id)
      .executeTakeFirst();
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { name } = req.body;
    const categoryId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(categoryId)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }
    
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    
    // Check if category belongs to user
    const category = await db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', categoryId)
      .executeTakeFirst();
    
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    if (category.user_id !== userId) {
      res.status(403).json({ error: 'You do not have permission to update this category' });
      return;
    }
    
    const result = await db
      .updateTable('categories')
      .set({ name })
      .where('id', '=', categoryId)
      .executeTakeFirst();
    
    if (!result || Number(result.numUpdatedRows) === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    const updatedCategory = await db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', categoryId)
      .executeTakeFirst();
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(categoryId)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }
    
    // Check if category belongs to user
    const category = await db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', categoryId)
      .executeTakeFirst();
    
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    if (category.user_id !== userId) {
      res.status(403).json({ error: 'You do not have permission to delete this category' });
      return;
    }
    
    const result = await db
      .deleteFrom('categories')
      .where('id', '=', categoryId)
      .executeTakeFirst();
    
    if (!result || Number(result.numDeletedRows) === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
