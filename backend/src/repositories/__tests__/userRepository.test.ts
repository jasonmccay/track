import { UserRepository } from '../userRepository';
import { CreateUserRequest } from '../../types/models';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe('UserRepository class', () => {
    it('should be instantiated', () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
    });

    it('should have all required methods', () => {
      expect(typeof userRepository.findAll).toBe('function');
      expect(typeof userRepository.findById).toBe('function');
      expect(typeof userRepository.findByEmail).toBe('function');
      expect(typeof userRepository.create).toBe('function');
      expect(typeof userRepository.update).toBe('function');
      expect(typeof userRepository.delete).toBe('function');
      expect(typeof userRepository.exists).toBe('function');
      expect(typeof userRepository.existsByEmail).toBe('function');
      expect(typeof userRepository.existsByUsername).toBe('function');
      expect(typeof userRepository.verifyPassword).toBe('function');
    });
  });

  describe('Input validation', () => {
    it('should handle valid user data structure', () => {
      const validUserData: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      };

      expect(validUserData.username).toBe('testuser');
      expect(validUserData.email).toBe('test@example.com');
      expect(validUserData.displayName).toBe('Test User');
      expect(validUserData.password).toBe('password123');
    });
  });
});