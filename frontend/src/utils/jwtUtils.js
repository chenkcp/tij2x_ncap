import { jwtDecode } from 'jwt-decode';

/**
 * Decode JWT token and extract payload
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Check if JWT token is valid and not expired
 * @param {string} token - JWT token
 * @param {number} bufferMinutes - Buffer time in minutes before expiration
 */
export const isTokenValid = (token, bufferMinutes = 5) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const bufferTime = bufferMinutes * 60; // Convert to seconds
    
    // Check if token is expired with buffer
    return decoded.exp > (currentTime + bufferTime);
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return false;
  }
};

/**
 * Get time until token expires (in seconds)
 */
export const getTokenTimeToExpiry = (token) => {
  if (!token) return 0;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    console.error('Error getting token expiry time:', error);
    return 0;
  }
};

/**
 * Check if token expires soon (within specified minutes)
 */
export const isTokenExpiringSoon = (token, warningMinutes = 30) => {
  const timeToExpiry = getTokenTimeToExpiry(token);
  const warningTime = warningMinutes * 60; // Convert to seconds
  
  return timeToExpiry > 0 && timeToExpiry <= warningTime;
};

/**
 * Extract user information from JWT token
 */
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub || decoded.user_id,
    email: decoded.email,
    name: decoded.name || decoded.preferred_username || decoded.given_name,
    firstName: decoded.given_name,
    lastName: decoded.family_name,
    roles: decoded.roles || decoded.authorities || [],
    permissions: decoded.permissions || [],
    exp: decoded.exp,
    iat: decoded.iat,
    iss: decoded.iss
  };
};

/**
 * Format token expiry time as readable string
 */
export const formatTokenExpiry = (token) => {
  if (!token) return 'Unknown';

  try {
    const decoded = jwtDecode(token);
    const expiryDate = new Date(decoded.exp * 1000);
    
    return {
      date: expiryDate.toLocaleDateString(),
      time: expiryDate.toLocaleTimeString(),
      iso: expiryDate.toISOString(),
      relative: getRelativeTime(expiryDate)
    };
  } catch (error) {
    console.error('Error formatting token expiry:', error);
    return 'Invalid token';
  }
};

/**
 * Get relative time string (e.g., "in 30 minutes", "2 hours ago")
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else if (diffMinutes < 0) {
    const absMinutes = Math.abs(diffMinutes);
    const absHours = Math.floor(absMinutes / 60);
    
    if (absHours > 0) {
      return `${absHours} hour${absHours > 1 ? 's' : ''} ago`;
    } else {
      return `${absMinutes} minute${absMinutes > 1 ? 's' : ''} ago`;
    }
  } else {
    return 'just now';
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (token, requiredRole) => {
  const user = getUserFromToken(token);
  if (!user || !user.roles) return false;
  
  return user.roles.includes(requiredRole);
};

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = (token, requiredRoles) => {
  const user = getUserFromToken(token);
  if (!user || !user.roles || !Array.isArray(requiredRoles)) return false;
  
  return requiredRoles.some(role => user.roles.includes(role));
};

/**
 * Check if user has required permission
 */
export const hasPermission = (token, requiredPermission) => {
  const user = getUserFromToken(token);
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(requiredPermission);
};

/**
 * Generate a token renewal reminder timestamp
 */
export const getTokenRenewalReminder = (token, reminderMinutes = 30) => {
  const timeToExpiry = getTokenTimeToExpiry(token);
  const reminderTime = reminderMinutes * 60; // Convert to seconds
  
  if (timeToExpiry <= reminderTime) {
    return Date.now(); // Show reminder now
  }
  
  const reminderTimestamp = Date.now() + ((timeToExpiry - reminderTime) * 1000);
  return reminderTimestamp;
};

export default {
  decodeToken,
  isTokenValid,
  getTokenTimeToExpiry,
  isTokenExpiringSoon,
  getUserFromToken,
  formatTokenExpiry,
  hasRole,
  hasAnyRole,
  hasPermission,
  getTokenRenewalReminder
};