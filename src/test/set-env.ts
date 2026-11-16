/**
 * Gives a test file a valid server environment. Import it first, before any module that imports
 * `@/lib/env`, so the variables exist when that module checks them.
 */
process.env.OAUTH_ISSUER_URL = "http://localhost:9";
process.env.OAUTH_CLIENT_ID = "geek-social";
process.env.OAUTH_CLIENT_SECRET = "test-client-secret-0123456789";
process.env.OAUTH_REDIRECT_URI = "http://localhost:3006/api/auth/callback";
process.env.SESSION_SECRET = "test-session-secret-0123456789-abcdefghij";
