import { PrismaClient } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

// Mock modules
jest.mock('uuid', () => ({
  v4: jest.fn(() => '123456789abcdef')
}));
jest.mock('@prisma/client');

// Create mock PrismaClient instance
const mockPrismaClient = {
  link: {
    findUnique: jest.fn()
  }
};

// Mock PrismaClient constructor
(PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);

describe('URL Shortener Functions', () => {
  let linkService: typeof import('../../../src/services/link.service');

  beforeAll(async () => {
    // Import actual functions after mocks are set up
    linkService = await import('../../../src/services/link.service');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateShortCode', () => {
    it('should generate 8 character short code', async () => {
      // Arrange
      const expectedShortCode = '32fb8fd8';
      jest.spyOn(linkService, 'generateShortCode').mockResolvedValue(expectedShortCode);

      // Act
      const result = await linkService.generateShortCode();

      // Assert
      expect(result).toHaveLength(8);
      expect(result).toBe('32fb8fd8');
      expect(linkService.generateShortCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('ensureShortURLUnique', () => {
    it('should not throw error when short code is unique', async () => {
      // Arrange
      const shortCode = 'abc123';
      mockPrismaClient.link.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(linkService.ensureShortURLUnique(shortCode)).resolves.not.toThrow();

      expect(mockPrismaClient.link.findUnique).toHaveBeenCalledWith({
        where: { shortCode }
      });
    });

    it('should throw ApiError when short code already exists', async () => {
      // Arrange
      const shortCode = 'abc123';
      mockPrismaClient.link.findUnique.mockResolvedValue({
        id: 1,
        shortCode,
        originalUrl: 'https://example.com'
      });

      // Act & Assert
      await expect(linkService.ensureShortURLUnique(shortCode)).rejects.toThrow(ApiError);

      await expect(linkService.ensureShortURLUnique(shortCode)).rejects.toThrow(
        'Short URL has been used'
      );

      expect(mockPrismaClient.link.findUnique).toHaveBeenCalledWith({
        where: { shortCode }
      });
    });
  });
});
