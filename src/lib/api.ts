import { authGet, authPost, authPut, authDelete } from './authFetch';

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Language {
  id: number;
  name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface SnippetFile {
  id: number;
  snippet_id: number;
  filename: string;
  content: string;
  language_id: number | null;
  language_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: number;
  title: string;
  code: string; // Maintained for backward compatibility
  description: string | null;
  language_id: number | null;
  language_name: string | null;
  category_id: number | null;
  category_name: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  files: SnippetFile[];
  tags: Tag[];
}

// File request type for creating/updating snippets
export interface FileRequest {
  filename: string;
  content: string;
  language_id: number | null;
}

// Input types for API requests
export interface SnippetInput {
  title: string;
  description?: string | null;
  category_id?: number | null;
  language_id?: number | null;
  files: FileRequest[];
  tags?: number[];
}

// Authentication API
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  return response.json();
}

export async function register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  return authGet('/api/auth/me');
}

// Snippets API
export async function getSnippets(filters?: {
  language_id?: number;
  category_id?: number;
  tag_id?: number;
  search?: string;
}): Promise<Snippet[]> {
  const params = new URLSearchParams();
  
  if (filters?.language_id) {
    params.append('language_id', filters.language_id.toString());
  }
  
  if (filters?.category_id) {
    params.append('category_id', filters.category_id.toString());
  }
  
  if (filters?.tag_id) {
    params.append('tag_id', filters.tag_id.toString());
  }
  
  if (filters?.search) {
    params.append('search', filters.search);
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return authGet<Snippet[]>(`/api/snippets${queryString}`);
}

export async function getSnippet(id: number): Promise<Snippet> {
  return authGet<Snippet>(`/api/snippets/${id}`);
}

export async function createSnippet(snippet: SnippetInput): Promise<Snippet> {
  return authPost<Snippet>('/api/snippets', snippet);
}

export async function updateSnippet(id: number, snippet: SnippetInput): Promise<Snippet> {
  return authPut<Snippet>(`/api/snippets/${id}`, snippet);
}

export async function duplicateSnippet(id: number): Promise<Snippet> {
  return authPost<Snippet>(`/api/snippets/${id}/duplicate`, {});
}

export async function deleteSnippet(id: number): Promise<void> {
  return authDelete(`/api/snippets/${id}`);
}

// Languages API - Some functions don't require auth for basic read access
export async function getLanguages(): Promise<Language[]> {
  try {
    // Try with auth first
    return await authGet<Language[]>('/api/languages');
  } catch (error) {
    // If unauthorized, try without auth for public languages
    if (error instanceof Error && error.message === 'Unauthorized') {
      const response = await fetch('/api/languages');
      if (response.ok) {
        return response.json();
      }
    }
    throw error;
  }
}

export async function createLanguage(name: string): Promise<Language> {
  return authPost<Language>('/api/languages', { name });
}

export async function deleteLanguage(id: number): Promise<void> {
  return authDelete(`/api/languages/${id}`);
}

// Categories API
export async function getCategories(): Promise<Category[]> {
  return authGet<Category[]>('/api/categories');
}

export async function createCategory(name: string): Promise<Category> {
  return authPost<Category>('/api/categories', { name });
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  return authPut<Category>(`/api/categories/${id}`, { name });
}

export async function deleteCategory(id: number): Promise<void> {
  return authDelete(`/api/categories/${id}`);
}

// Tags API
export async function getTags(): Promise<Tag[]> {
  return authGet<Tag[]>('/api/tags');
}

export async function createTag(name: string): Promise<Tag> {
  return authPost<Tag>('/api/tags', { name });
}

export async function deleteTag(id: number): Promise<void> {
  return authDelete(`/api/tags/${id}`);
}
