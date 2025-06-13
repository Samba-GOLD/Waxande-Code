import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDirectory = process.env.DATA_DIRECTORY || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, 'database.sqlite');
const sqliteDb = new Database(dbPath);

// Define the database schema
export interface LanguageTable {
  id: number;
  name: string;
  created_at: string;
}

export interface UserTable {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryTable {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface TagTable {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface SnippetTable {
  id: number;
  title: string;
  code: string;
  description: string | null;
  language_id: number | null;
  user_id: number | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SnippetFileTable {
  id: number;
  snippet_id: number;
  filename: string;
  content: string;
  language_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SnippetTagTable {
  snippet_id: number;
  tag_id: number;
}

export interface DatabaseSchema {
  languages: LanguageTable;
  users: UserTable;
  categories: CategoryTable;
  tags: TagTable;
  snippets: SnippetTable;
  snippet_files: SnippetFileTable;
  snippet_tags: SnippetTagTable;
}

// Create and export the database instance
export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
  log: ['query', 'error']
});
