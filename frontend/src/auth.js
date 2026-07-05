/**
 * Auth helpers — token stored in localStorage under key `sh_token`.
 * The API client reads the token and injects it as a Bearer header.
 */

export const getToken = () => localStorage.getItem('sh_token');

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sh_user') || 'null');
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  localStorage.removeItem('sh_token');
  localStorage.removeItem('sh_user');
};
