import express from 'express';
import { db } from '../db/index.js';

const router = express.Router();

// Get all languages
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    console.log('Fetching all languages');
    const languages = await db
      .selectFrom('languages')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
    
    res.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Add a new language
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Language name is required' });
      return;
    }
    
    console.log(`Adding new language: ${name}`);
    const result = await db
      .insertInto('languages')
      .values({ name })
      .returning('id')
      .executeTakeFirst();
    
    if (!result) {
      res.status(500).json({ error: 'Failed to add language' });
      return;
    }
    
    const newLanguage = await db
      .selectFrom('languages')
      .selectAll()
      .where('id', '=', result.id)
      .executeTakeFirst();
    
    res.status(201).json(newLanguage);
  } catch (error) {
    console.error('Error adding language:', error);
    
    // Check for unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Language already exists' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to add language' });
  }
});

// Delete a language
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid language ID' });
      return;
    }
    
    console.log(`Deleting language with ID: ${id}`);
    
    // Check if there are snippets using this language
    const snippetsCount = await db
      .selectFrom('snippets')
      .where('language_id', '=', id)
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    
    if (snippetsCount && Number(snippetsCount.count) > 0) {
      res.status(409).json({ 
        error: 'Cannot delete language that has snippets associated with it' 
      });
      return;
    }
    
    const result = await db
      .deleteFrom('languages')
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!result || Number(result.numDeletedRows) === 0) {
      res.status(404).json({ error: 'Language not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

export default router;
