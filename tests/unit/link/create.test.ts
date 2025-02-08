import { LinkType, User } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';
import { linkService } from '../../../src/services';

// Mock prisma client
jest.mock('../../../src/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    link: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

let mockCtx: MockContext;
const prisma = require('../../../src/client').default;

describe('Link Service - create', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      username: null,
      password: null,
      dob: null,
      language: null,
      role: 'USER',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCtx = createMockContext();
  });

  it('should create a link successfully with minimal data', async () => {
    // Mock user check
    prisma.user.findUnique.mockResolvedValue(mockUser);

    // Mock link creation
    const mockCreatedLink = {
      id: '1',
      userId: mockUser.id,
      originalUrl: 'https://example.com',
      shortCode: 'abc123',
      type: LinkType.BENIGN,
      comments: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      expiresAt: null,
      expiredRedirectUrl: null,
      UTM: null,
      qrcode: null,
      TagLink: [],
    };

    prisma.link.create.mockResolvedValue(mockCreatedLink);

    const linkData = {
      originalUrl: 'https://example.com',
    };

    const result = await linkService.create(linkData, mockUser);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUser.id },
    });

    expect(prisma.link.create).toHaveBeenCalled();
    expect(result).toEqual(mockCreatedLink);
  });

  it('should create a link with UTM parameters', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const mockCreatedLink = {
      id: '1',
      userId: mockUser.id,
      originalUrl: 'https://example.com',
      shortCode: 'abc123',
      type: LinkType.BENIGN,
      UTM: {
        source: 'test',
        medium: 'email',
        campaign: 'test-campaign',
      },
      // ... other link properties
    };

    prisma.link.create.mockResolvedValue(mockCreatedLink);

    const linkData = {
      originalUrl: 'https://example.com',
      utm: {
        source: 'test',
        medium: 'email',
        campaign: 'test-campaign',
      },
    };

    const result = await linkService.create(linkData, mockUser);

    expect(prisma.link.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          UTM: {
            create: {
              source: 'test',
              medium: 'email',
              campaign: 'test-campaign',
              term: null,
              content: null,
            },
          },
        }),
      })
    );
    expect(result).toEqual(mockCreatedLink);
  });

  it('should create a link with tags', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const mockCreatedLink = {
      id: '1',
      userId: mockUser.id,
      originalUrl: 'https://example.com',
      shortCode: 'abc123',
      TagLink: [
        {
          tag: {
            name: 'test-tag',
          },
        },
      ],
      // ... other link properties
    };

    prisma.link.create.mockResolvedValue(mockCreatedLink);

    const linkData = {
      originalUrl: 'https://example.com',
      tags: ['test-tag'],
    };

    const result = await linkService.create(linkData, mockUser);

    expect(prisma.link.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          TagLink: {
            create: [
              {
                tag: {
                  connectOrCreate: {
                    where: { name: 'test-tag' },
                    create: { name: 'test-tag' },
                  },
                },
              },
            ],
          },
        }),
      })
    );
    expect(result).toEqual(mockCreatedLink);
  });

  it('should throw error when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const linkData = {
      originalUrl: 'https://example.com',
    };

    await expect(linkService.create(linkData, mockUser)).rejects.toThrow(ApiError);
    await expect(linkService.create(linkData, mockUser)).rejects.toThrow('User not found');
  });
});

// Mock context file (context/context.ts)
export type MockContext = {
  prisma: {
    user: any;
    link: any;
  };
};

export function createMockContext(): MockContext {
  return {
    prisma: {
      user: {
        findUnique: jest.fn(),
      },
      link: {
        create: jest.fn(),
      },
    },
  };
}
