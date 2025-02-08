import { ReviewStatus, ReviewAction } from '@prisma/client';
import prisma from '../../src/client';
import { reviewService } from '../../src/services';

jest.mock('../../src/client', () => ({
  user: {
    findUnique: jest.fn() as jest.Mock,
  },
  uRL: {
    upsert: jest.fn() as jest.Mock,
  },
  review: {
    create: jest.fn() as jest.Mock,
    findMany: jest.fn() as jest.Mock,
  },
}));

describe('Review Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateUrlWithReview', () => {
    it('should create a review if user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.uRL.upsert as jest.Mock).mockResolvedValue({ id: 1, originalUrl: 'https://example.com' });
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: 1,
        action: ReviewAction.APPROVE,
        status: ReviewStatus.PENDING,
        urlId: 1,
        reviewerId: 1,
      });

      const result = await reviewService.createOrUpdateUrlWithReview({
        originalUrl: 'https://example.com',
        type: 'BENIGN',
        reviewerId: 1,
        action: ReviewAction.APPROVE,
      });

      expect(result).toHaveProperty('review');
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(prisma.uRL.upsert).toHaveBeenCalled();
      expect(prisma.review.create).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return all reviews', async () => {
      (prisma.review.findMany as jest.Mock).mockResolvedValue([
        { id: 1, action: ReviewAction.APPROVE, status: ReviewStatus.PENDING, urlId: 1, reviewerId: 1 }
      ]);

      const reviews = await reviewService.getAll();
      expect(reviews).toHaveLength(1);
      expect(prisma.review.findMany).toHaveBeenCalled();
    });
  });
});
