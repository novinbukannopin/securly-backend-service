import httpStatus from 'http-status';
import prisma from '../../src/client';
import { encryptPassword } from '../../src/utils/encryption';
import { userService } from '../../src/services';
import ApiError from '../../src/utils/ApiError';

jest.mock('../../src/client', () => ({
  user: {
    findUnique: jest.fn() as jest.Mock,
    findMany: jest.fn() as jest.Mock,
    create: jest.fn() as jest.Mock,
    update: jest.fn() as jest.Mock,
    delete: jest.fn() as jest.Mock,
    count: jest.fn() as jest.Mock
  },
  link: {
    count: jest.fn() as jest.Mock
  }
}));

jest.mock('../../src/utils/encryption', () => ({ encryptPassword: jest.fn() as jest.Mock }));

describe('User Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (encryptPassword as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });

      const user = await userService.createUser('test@example.com', 'password123');
      expect(user).toHaveProperty('id');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
      await expect(userService.createUser('test@example.com', 'password123')).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
    });
  });

  describe('queryUsers', () => {
    it('should return paginated list of users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
      const users = await userService.queryUsers({}, { limit: 10, page: 1 });
      expect(users).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getUserOwnProfile', () => {
    it('should return user profile with link count', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
      (prisma.link.count as jest.Mock).mockResolvedValue(5);
      const profile = await userService.getUserOwnProfile(1);
      expect(profile).toHaveProperty('linkCount', 5);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
      const user = await userService.getUserById(1);
      expect(user).toHaveProperty('id', 1);
    });
  });

  describe('updateUserById', () => {
    it('should update user if exists and email is not taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
        if (where.email && where.email !== 'test@example.com') {
          return where.email === 'updated@example.com'
            ? { id: 2, email: 'updated@example.com' }
            : null;
        }
        return { id: 1, email: 'test@example.com' };
      });

      await expect(userService.updateUserById(1, { email: 'updated@example.com' })).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
    });
  });

  describe('deleteUserById', () => {
    it('should delete user if exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
      (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });

      const user = await userService.deleteUserById(1);
      expect(user).toHaveProperty('id', 1);
      expect(prisma.user.delete).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.deleteUserById(99)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
    });
  });
});
