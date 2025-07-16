import { generateToken, verifyToken } from '../auth';

describe('Authentication', () => {
  const mockUser = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.userId).toBe(mockUser.id);
      expect(decoded!.username).toBe(mockUser.username);
      expect(decoded!.email).toBe(mockUser.email);
      expect(decoded!.displayName).toBe(mockUser.displayName);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.userId).toBe(mockUser.id);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyToken(malformedToken);
      
      expect(decoded).toBeNull();
    });

    it('should include expiration info', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.iat).toBeDefined(); // issued at
      expect(decoded!.exp).toBeDefined(); // expires at
      expect(decoded!.exp! > decoded!.iat!).toBe(true);
    });
  });

  describe('token lifecycle', () => {
    it('should create and verify token successfully', () => {
      // Generate token
      const token = generateToken(mockUser);
      expect(token).toBeTruthy();
      
      // Verify token
      const decoded = verifyToken(token);
      expect(decoded).toBeTruthy();
      
      // Check all user data is preserved
      expect(decoded!.userId).toBe(mockUser.id);
      expect(decoded!.username).toBe(mockUser.username);
      expect(decoded!.email).toBe(mockUser.email);
      expect(decoded!.displayName).toBe(mockUser.displayName);
    });
  });
});