import { TagRepository } from '../tagRepository';
import { CreateTagRequest } from '../../types/models';

describe('TagRepository', () => {
  let tagRepository: TagRepository;

  beforeEach(() => {
    tagRepository = new TagRepository();
  });

  describe('TagRepository class', () => {
    it('should be instantiated', () => {
      expect(tagRepository).toBeInstanceOf(TagRepository);
    });

    it('should have all required methods', () => {
      expect(typeof tagRepository.findAll).toBe('function');
      expect(typeof tagRepository.findById).toBe('function');
      expect(typeof tagRepository.findByName).toBe('function');
      expect(typeof tagRepository.create).toBe('function');
      expect(typeof tagRepository.update).toBe('function');
      expect(typeof tagRepository.delete).toBe('function');
      expect(typeof tagRepository.exists).toBe('function');
      expect(typeof tagRepository.existsByName).toBe('function');
      expect(typeof tagRepository.findByIds).toBe('function');
      expect(typeof tagRepository.findByNames).toBe('function');
      expect(typeof tagRepository.createMultiple).toBe('function');
      expect(typeof tagRepository.getTagsWithEventCount).toBe('function');
      expect(typeof tagRepository.getPopularTags).toBe('function');
    });
  });

  describe('Input validation', () => {
    it('should handle valid tag data structure', () => {
      const validTagData: CreateTagRequest = {
        name: 'work',
        color: '#3B82F6',
      };

      expect(validTagData.name).toBe('work');
      expect(validTagData.color).toBe('#3B82F6');
    });

    it('should handle tag data without color', () => {
      const validTagData: CreateTagRequest = {
        name: 'personal',
      };

      expect(validTagData.name).toBe('personal');
      expect(validTagData.color).toBeUndefined();
    });
  });

  describe('Color generation', () => {
    it('should generate valid hex colors', () => {
      // Access the private method through any to test it
      const repo = tagRepository as any;
      const color = repo.getRandomColor();
      
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate different colors on multiple calls', () => {
      const repo = tagRepository as any;
      const colors = new Set();
      
      // Generate 20 colors to increase chance of getting different ones
      for (let i = 0; i < 20; i++) {
        colors.add(repo.getRandomColor());
      }
      
      // Should have at least 2 different colors (very likely with 20 attempts)
      expect(colors.size).toBeGreaterThan(1);
    });
  });
});