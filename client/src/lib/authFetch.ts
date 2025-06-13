/**
 * Fetch wrapper that includes the authentication token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  
  // Add auth header if token exists
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * GET request with authentication
 */
export async function authGet<T>(url: string): Promise<T> {
  const response = await authFetch(url);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
  
  return response.json();
}

/**
 * POST request with authentication
 */
export async function authPost<T>(url: string, data: any): Promise<T> {
  const response = await authFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
  
  return response.json();
}

/**
 * PUT request with authentication
 */
export async function authPut<T>(url: string, data: any): Promise<T> {
  const response = await authFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
  
  return response.json();
}

/**
 * DELETE request with authentication
 */
export async function authDelete(url: string): Promise<void> {
  const response = await authFetch(url, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
}