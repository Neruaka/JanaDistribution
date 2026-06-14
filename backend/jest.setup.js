// Sets dummy JWT secrets required by AuthService constructor.
// These are TEST-ONLY values — real secrets must come from environment variables.
process.env.JWT_SECRET = 'test-jwt-secret-for-automated-tests-at-least-32chars';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-distinct-from-access-secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
