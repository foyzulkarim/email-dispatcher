# Authentication System

This document describes the authentication system implemented for the Email Dispatcher Service.

## Overview

The authentication system uses Google OAuth 2.0 for user authentication and JWT tokens for session management. Users authenticate with their Google account, and the system issues JWT tokens for subsequent API requests.

## Environment Variables

Add these variables to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Development Authentication (only for development)
DEV_AUTH_TOKEN=dev-token-for-testing
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/google`
Authenticate with Google OAuth token.

**Request Body:**
```json
{
  "idToken": "google-id-token-from-client"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://...",
      "role": "user",
      "isActive": true
    },
    "token": "jwt-token",
    "expiresIn": "7d"
  },
  "message": "Authentication successful"
}
```

#### POST `/api/auth/dev-login` (Development Only)
Development-only login endpoint for testing.

**Request Body:**
```json
{
  "email": "test@example.com",
  "name": "Test User"
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### PUT `/api/auth/me`
Update current user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "settings": {
    "defaultSender": {
      "name": "Default Sender",
      "email": "sender@example.com"
    },
    "timezone": "America/New_York"
  }
}
```

#### POST `/api/auth/refresh`
Refresh JWT token (requires authentication).

#### POST `/api/auth/logout`
Logout (client-side token invalidation).

#### GET `/api/auth/verify`
Verify token validity (requires authentication).

## Authentication Middleware

### `authenticateUser`
Requires valid JWT token. Attaches user object to `request.user`.

### `requireAdmin`
Requires authenticated user with admin role.

### `requireOwnership(paramName)`
Ensures user can only access their own resources.

### `optionalAuth`
Optional authentication - doesn't fail if no token provided.

### `developmentAuth`
Development mode authentication with fallback to normal auth.

## Usage Examples

### Protecting Routes

```typescript
// Require authentication
fastify.get('/protected', {
  preHandler: authenticateUser
}, async (request, reply) => {
  const user = request.user; // User is guaranteed to exist
  // ... route logic
});

// Require admin role
fastify.get('/admin-only', {
  preHandler: requireAdmin
}, async (request, reply) => {
  // Only admins can access this route
});

// Require ownership
fastify.get('/user/:userId/data', {
  preHandler: requireOwnership()
}, async (request, reply) => {
  // Users can only access their own data (admins can access any)
});
```

### Client-Side Integration

1. **Google OAuth Flow:**
   - Implement Google Sign-In on the client
   - Send the ID token to `/api/auth/google`
   - Store the returned JWT token

2. **Making Authenticated Requests:**
   ```javascript
   const response = await fetch('/api/protected-endpoint', {
     headers: {
       'Authorization': `Bearer ${jwtToken}`,
       'Content-Type': 'application/json'
     }
   });
   ```

3. **Token Refresh:**
   ```javascript
   const refreshResponse = await fetch('/api/auth/refresh', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${currentToken}`
     }
   });
   ```

## Development Mode

For development, you can use the development login endpoint:

```bash
curl -X POST http://localhost:4000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com", "name": "Dev User"}'
```

Or use the development token in the Authorization header:
```
Authorization: Bearer dev-token-for-testing
```

## Security Considerations

1. **JWT Secret:** Use a strong, random JWT secret in production
2. **Token Expiration:** Tokens expire after 7 days by default
3. **HTTPS:** Always use HTTPS in production
4. **Token Storage:** Store tokens securely on the client (httpOnly cookies recommended)
5. **Google Client ID:** Keep your Google Client ID secure and configure authorized domains

## User Roles

- `user`: Regular user with access to their own resources
- `admin`: Administrator with access to all resources and admin functions

## Error Responses

Authentication errors return appropriate HTTP status codes:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Invalid request data

Example error response:
```json
{
  "success": false,
  "error": "Authentication token required"
}
```
