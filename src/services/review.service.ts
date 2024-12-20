import prisma from '../client';
import { LinkType, ReviewAction, ReviewStatus } from '@prisma/client';

const createOrUpdateUrlWithReview = async ({
  originalUrl,
  type,
  reviewerId = 1,
  action,
  reason,
  evidence
}: {
  originalUrl: string;
  type: LinkType;
  reviewerId: number;
  action: ReviewAction;
  reason?: string;
  evidence?: string;
}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: reviewerId }
    });

    if (!user) {
      throw new Error(`User with ID ${reviewerId} not found.`);
    }

    const url = await prisma.uRL.upsert({
      where: { originalUrl },
      create: {
        originalUrl,
        type
      },
      update: {}
    });

    const newReview = await prisma.review.create({
      data: {
        action: action as any,
        reason,
        evidence,
        status: ReviewStatus.PENDING,
        url: { connect: { id: url.id } },
        reviewer: { connect: { id: reviewerId } }
      }
    });

    return {
      message: 'URL and review processed successfully.',
      url,
      review: newReview
    };
  } catch (error) {
    console.error('Error processing URL and review:', error);
    throw new Error('Internal server error.');
  }
};

const getAll = async () => {
  return prisma.review.findMany({
    include: {
      url: true
    }
  });
};

export default {
  createOrUpdateUrlWithReview,
  getAll
};
