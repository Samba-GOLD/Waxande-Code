import express from 'express';
import { db } from '../db/index.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';

// Types with extended properties for tags and files
interface SnippetWithDetails {
  id: number;
  title: string;
  code: string;
  description: string | null;
  language_id: number | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  language_name?: string | null;
  category_name?: string | null;
  tags: Array<{ id: number; name: string }>;
  files: Array<{
    id: number;
    filename: string;
    content: string;
    language_id: number | null;
    language_name: string | null;
  }>;
}

const router = express.Router();

// Get all snippets with optional filtering
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    console.log('Fetching snippets for user:', userId, 'with query params:', req.query);
    
    let query = db
      .selectFrom('snippets')
      .leftJoin('languages', 'snippets.language_id', 'languages.id')
      .leftJoin('categories', 'snippets.category_id', 'categories.id')
      .where('snippets.user_id', '=', userId!)
      .select([
        'snippets.id',
        'snippets.title',
        'snippets.description',
        'snippets.code',
        'snippets.language_id',
        'snippets.category_id',
        'snippets.created_at',
        'snippets.updated_at',
        'languages.name as language_name',
        'categories.name as category_name'
      ]);
    
    // Filter by language if provided
    if (req.query.language_id) {
      const languageId = parseInt(req.query.language_id as string);
      if (!isNaN(languageId)) {
        query = query.where('snippets.language_id', '=', languageId);
      }
    }
    
    // Filter by category if provided
    if (req.query.category_id) {
      const categoryId = parseInt(req.query.category_id as string);
      if (!isNaN(categoryId)) {
        query = query.where('snippets.category_id', '=', categoryId);
      }
    }
    
    // Search by title, description or code
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      query = query.where(eb => eb.or([
        eb('snippets.title', 'like', searchTerm),
        eb('snippets.description', 'like', searchTerm),
        eb('snippets.code', 'like', searchTerm)
      ]));
    }
    
    // Filter by tag if provided
    if (req.query.tag_id) {
      const tagId = parseInt(req.query.tag_id as string);
      if (!isNaN(tagId)) {
        query = query
          .innerJoin('snippet_tags', 'snippets.id', 'snippet_tags.snippet_id')
          .where('snippet_tags.tag_id', '=', tagId);
      }
    }
    
    const snippets = await query
      .orderBy('snippets.updated_at', 'desc')
      .execute();
    
    // For each snippet, get its tags and files
    const snippetsWithDetails: SnippetWithDetails[] = [];
    
    for (const snippet of snippets) {
      // Get tags
      const tags = await db
        .selectFrom('tags')
        .innerJoin('snippet_tags', 'tags.id', 'snippet_tags.tag_id')
        .select(['tags.id', 'tags.name'])
        .where('snippet_tags.snippet_id', '=', snippet.id)
        .execute();
      
      // Get files
      const files = await db
        .selectFrom('snippet_files')
        .leftJoin('languages', 'snippet_files.language_id', 'languages.id')
        .select([
          'snippet_files.id',
          'snippet_files.filename',
          'snippet_files.content',
          'snippet_files.language_id',
          'languages.name as language_name'
        ])
        .where('snippet_files.snippet_id', '=', snippet.id)
        .execute();
      
      // Add tags and files to the snippet
      const snippetWithDetails: SnippetWithDetails = {
        ...snippet,
        tags,
        files
      };
      
      snippetsWithDetails.push(snippetWithDetails);
    }
    
    res.json(snippetsWithDetails);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// Get a single snippet by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid snippet ID' });
      return;
    }
    
    console.log(`Fetching snippet with ID: ${id} for user: ${userId}`);
    
    const snippet = await db
      .selectFrom('snippets')
      .leftJoin('languages', 'snippets.language_id', 'languages.id')
      .leftJoin('categories', 'snippets.category_id', 'categories.id')
      .select([
        'snippets.id',
        'snippets.title',
        'snippets.description',
        'snippets.code',
        'snippets.language_id',
        'snippets.category_id',
        'snippets.created_at',
        'snippets.updated_at',
        'languages.name as language_name',
        'categories.name as category_name'
      ])
      .where('snippets.id', '=', id)
      .where('snippets.user_id', '=', userId!)
      .executeTakeFirst();
    
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
      return;
    }
    
    // Get tags
    const tags = await db
      .selectFrom('tags')
      .innerJoin('snippet_tags', 'tags.id', 'snippet_tags.tag_id')
      .select(['tags.id', 'tags.name'])
      .where('snippet_tags.snippet_id', '=', id)
      .execute();
    
    // Get files
    const files = await db
      .selectFrom('snippet_files')
      .leftJoin('languages', 'snippet_files.language_id', 'languages.id')
      .select([
        'snippet_files.id',
        'snippet_files.filename',
        'snippet_files.content',
        'snippet_files.language_id',
        'languages.name as language_name'
      ])
      .where('snippet_files.snippet_id', '=', id)
      .execute();
    
    // Add tags and files to the snippet
    const snippetWithDetails: SnippetWithDetails = {
      ...snippet,
      tags,
      files
    };
    
    res.json(snippetWithDetails);
  } catch (error) {
    console.error(`Error fetching snippet with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
});

// Create a new snippet
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { title, description, category_id, language_id, files, tags } = req.body;
    const userId = req.user?.id;
    
    if (!title || !files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'Title and at least one file are required' });
      return;
    }
    
    for (const file of files) {
      if (!file.filename || !file.content) {
        res.status(400).json({ error: 'Each file must have a filename and content' });
        return;
      }
    }
    
    console.log(`Creating new snippet: ${title} for user: ${userId}`);
    
    // Start a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Create the snippet
      const snippetResult = await trx
        .insertInto('snippets')
        .values({
          title,
          // Keep the code field for backward compatibility
          code: files[0].content,
          description: description || null,
          language_id: language_id || null,
          category_id: category_id || null,
          user_id: userId!,
          updated_at: new Date().toISOString()
        })
        .returning('id')
        .executeTakeFirst();
      
      if (!snippetResult) {
        throw new Error('Failed to create snippet');
      }
      
      const snippetId = snippetResult.id;
      
      // Create the files
      for (const file of files) {
        await trx
          .insertInto('snippet_files')
          .values({
            snippet_id: snippetId,
            filename: file.filename,
            content: file.content,
            language_id: file.language_id || null,
            updated_at: new Date().toISOString()
          })
          .execute();
      }
      
      // Create tag associations
      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagId of tags) {
          // Check if tag exists and belongs to user
          const tag = await trx
            .selectFrom('tags')
            .select('id')
            .where('id', '=', tagId)
            .where('user_id', '=', userId!)
            .executeTakeFirst();
          
          if (tag) {
            await trx
              .insertInto('snippet_tags')
              .values({
                snippet_id: snippetId,
                tag_id: tagId
              })
              .execute();
          }
        }
      }
      
      return snippetId;
    });
    
    // Get the created snippet with all its details
    const newSnippet = await db
      .selectFrom('snippets')
      .leftJoin('languages', 'snippets.language_id', 'languages.id')
      .leftJoin('categories', 'snippets.category_id', 'categories.id')
      .select([
        'snippets.id',
        'snippets.title',
        'snippets.description',
        'snippets.code',
        'snippets.language_id',
        'snippets.category_id',
        'snippets.created_at',
        'snippets.updated_at',
        'languages.name as language_name',
        'categories.name as category_name'
      ])
      .where('snippets.id', '=', result)
      .executeTakeFirst();
    
    if (!newSnippet) {
      res.status(500).json({ error: 'Failed to retrieve created snippet' });
      return;
    }
    
    // Get tags
    const snippetTags = await db
      .selectFrom('tags')
      .innerJoin('snippet_tags', 'tags.id', 'snippet_tags.tag_id')
      .select(['tags.id', 'tags.name'])
      .where('snippet_tags.snippet_id', '=', newSnippet.id)
      .execute();
    
    // Get files
    const snippetFiles = await db
      .selectFrom('snippet_files')
      .leftJoin('languages', 'snippet_files.language_id', 'languages.id')
      .select([
        'snippet_files.id',
        'snippet_files.filename',
        'snippet_files.content',
        'snippet_files.language_id',
        'languages.name as language_name'
      ])
      .where('snippet_files.snippet_id', '=', newSnippet.id)
      .execute();
    
    // Add tags and files to the snippet
    const snippetWithDetails: SnippetWithDetails = {
      ...newSnippet,
      tags: snippetTags,
      files: snippetFiles
    };
    
    res.status(201).json(snippetWithDetails);
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

// Update a snippet
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid snippet ID' });
      return;
    }
    
    const { title, description, category_id, language_id, files, tags } = req.body;
    
    if (!title || !files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'Title and at least one file are required' });
      return;
    }
    
    for (const file of files) {
      if (!file.filename || !file.content) {
        res.status(400).json({ error: 'Each file must have a filename and content' });
        return;
      }
    }
    
    // Check if snippet exists and belongs to user
    const snippet = await db
      .selectFrom('snippets')
      .select('id')
      .where('id', '=', id)
      .where('user_id', '=', userId!)
      .executeTakeFirst();
    
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
      return;
    }
    
    console.log(`Updating snippet with ID: ${id} for user: ${userId}`);
    
    // Start a transaction
    await db.transaction().execute(async (trx) => {
      // Update the snippet
      await trx
        .updateTable('snippets')
        .set({
          title,
          // Keep the code field for backward compatibility
          code: files[0].content,
          description: description || null,
          language_id: language_id || null,
          category_id: category_id || null,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', id)
        .execute();
      
      // Delete existing files
      await trx
        .deleteFrom('snippet_files')
        .where('snippet_id', '=', id)
        .execute();
      
      // Create new files
      for (const file of files) {
        await trx
          .insertInto('snippet_files')
          .values({
            snippet_id: id,
            filename: file.filename,
            content: file.content,
            language_id: file.language_id || null,
            updated_at: new Date().toISOString()
          })
          .execute();
      }
      
      // Delete existing tag associations
      await trx
        .deleteFrom('snippet_tags')
        .where('snippet_id', '=', id)
        .execute();
      
      // Create new tag associations
      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagId of tags) {
          // Check if tag exists and belongs to user
          const tag = await trx
            .selectFrom('tags')
            .select('id')
            .where('id', '=', tagId)
            .where('user_id', '=', userId!)
            .executeTakeFirst();
          
          if (tag) {
            await trx
              .insertInto('snippet_tags')
              .values({
                snippet_id: id,
                tag_id: tagId
              })
              .execute();
          }
        }
      }
    });
    
    // Get the updated snippet with all its details
    const updatedSnippet = await db
      .selectFrom('snippets')
      .leftJoin('languages', 'snippets.language_id', 'languages.id')
      .leftJoin('categories', 'snippets.category_id', 'categories.id')
      .select([
        'snippets.id',
        'snippets.title',
        'snippets.description',
        'snippets.code',
        'snippets.language_id',
        'snippets.category_id',
        'snippets.created_at',
        'snippets.updated_at',
        'languages.name as language_name',
        'categories.name as category_name'
      ])
      .where('snippets.id', '=', id)
      .executeTakeFirst();
    
    if (!updatedSnippet) {
      res.status(500).json({ error: 'Failed to retrieve updated snippet' });
      return;
    }
    
    // Get tags
    const snippetTags = await db
      .selectFrom('tags')
      .innerJoin('snippet_tags', 'tags.id', 'snippet_tags.tag_id')
      .select(['tags.id', 'tags.name'])
      .where('snippet_tags.snippet_id', '=', id)
      .execute();
    
    // Get files
    const snippetFiles = await db
      .selectFrom('snippet_files')
      .leftJoin('languages', 'snippet_files.language_id', 'languages.id')
      .select([
        'snippet_files.id',
        'snippet_files.filename',
        'snippet_files.content',
        'snippet_files.language_id',
        'languages.name as language_name'
      ])
      .where('snippet_files.snippet_id', '=', id)
      .execute();
    
    // Add tags and files to the snippet
    const snippetWithDetails: SnippetWithDetails = {
      ...updatedSnippet,
      tags: snippetTags,
      files: snippetFiles
    };
    
    res.json(snippetWithDetails);
  } catch (error) {
    console.error(`Error updating snippet with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

// Duplicate a snippet
router.post('/:id/duplicate', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid snippet ID' });
      return;
    }
    
    // Check if snippet exists and belongs to user
    const snippet = await db
      .selectFrom('snippets')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId!)
      .executeTakeFirst();
    
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
      return;
    }
    
    console.log(`Duplicating snippet with ID: ${id} for user: ${userId}`);
    
    // Start a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Create the new snippet
      const newSnippetResult = await trx
        .insertInto('snippets')
        .values({
          title: `${snippet.title} (Copy)`,
          code: snippet.code,
          description: snippet.description,
          language_id: snippet.language_id,
          category_id: snippet.category_id,
          user_id: userId!,
          updated_at: new Date().toISOString()
        })
        .returning('id')
        .executeTakeFirst();
      
      if (!newSnippetResult) {
        throw new Error('Failed to duplicate snippet');
      }
      
      const newSnippetId = newSnippetResult.id;
      
      // Get the files from the original snippet
      const files = await trx
        .selectFrom('snippet_files')
        .selectAll()
        .where('snippet_id', '=', id)
        .execute();
      
      // Create new files for the duplicated snippet
      for (const file of files) {
        await trx
          .insertInto('snippet_files')
          .values({
            snippet_id: newSnippetId,
            filename: file.filename,
            content: file.content,
            language_id: file.language_id,
            updated_at: new Date().toISOString()
          })
          .execute();
      }
      
      // Get the tags from the original snippet
      const tags = await trx
        .selectFrom('snippet_tags')
        .selectAll()
        .where('snippet_id', '=', id)
        .execute();
      
      // Create new tag associations for the duplicated snippet
      for (const tag of tags) {
        await trx
          .insertInto('snippet_tags')
          .values({
            snippet_id: newSnippetId,
            tag_id: tag.tag_id
          })
          .execute();
      }
      
      return newSnippetId;
    });
    
    // Get the duplicated snippet with all its details
    const newSnippet = await db
      .selectFrom('snippets')
      .leftJoin('languages', 'snippets.language_id', 'languages.id')
      .leftJoin('categories', 'snippets.category_id', 'categories.id')
      .select([
        'snippets.id',
        'snippets.title',
        'snippets.description',
        'snippets.code',
        'snippets.language_id',
        'snippets.category_id',
        'snippets.created_at',
        'snippets.updated_at',
        'languages.name as language_name',
        'categories.name as category_name'
      ])
      .where('snippets.id', '=', result)
      .executeTakeFirst();
    
    if (!newSnippet) {
      res.status(500).json({ error: 'Failed to retrieve duplicated snippet' });
      return;
    }
    
    // Get tags
    const snippetTags = await db
      .selectFrom('tags')
      .innerJoin('snippet_tags', 'tags.id', 'snippet_tags.tag_id')
      .select(['tags.id', 'tags.name'])
      .where('snippet_tags.snippet_id', '=', newSnippet.id)
      .execute();
    
    // Get files
    const snippetFiles = await db
      .selectFrom('snippet_files')
      .leftJoin('languages', 'snippet_files.language_id', 'languages.id')
      .select([
        'snippet_files.id',
        'snippet_files.filename',
        'snippet_files.content',
        'snippet_files.language_id',
        'languages.name as language_name'
      ])
      .where('snippet_files.snippet_id', '=', newSnippet.id)
      .execute();
    
    // Add tags and files to the snippet
    const snippetWithDetails: SnippetWithDetails = {
      ...newSnippet,
      tags: snippetTags,
      files: snippetFiles
    };
    
    res.status(201).json(snippetWithDetails);
  } catch (error) {
    console.error(`Error duplicating snippet with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to duplicate snippet' });
  }
});

// Delete a snippet
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid snippet ID' });
      return;
    }
    
    // Check if snippet exists and belongs to user
    const snippet = await db
      .selectFrom('snippets')
      .select('id')
      .where('id', '=', id)
      .where('user_id', '=', userId!)
      .executeTakeFirst();
    
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
      return;
    }
    
    console.log(`Deleting snippet with ID: ${id} for user: ${userId}`);
    
    // Delete the snippet (cascade will delete files and tag associations)
    const result = await db
      .deleteFrom('snippets')
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!result || Number(result.numDeletedRows) === 0) {
      res.status(404).json({ error: 'Snippet not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting snippet with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

export default router;
