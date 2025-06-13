import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import snippetsRouter from './api/snippets.js';
import languagesRouter from './api/languages.js';
import authRouter from './api/auth.js';
import categoriesRouter from './api/categories.js';
import tagsRouter from './api/tags.js';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);

// Health check endpoint
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Export a function to start the server
export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting server...');
  startServer(process.env.PORT || 3001);
}
