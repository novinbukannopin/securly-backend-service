import { Role, Provider, TokenType } from '@prisma/client';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { tokenService, userService } from '../../src/services';
import prisma from '../../src/client';

jest.mock('../../src/client', () => ({
  user: {
    findUnique: jest.fn() as jest.Mock,
    findMany: jest.fn() as jest.Mock,
    create: jest.fn() as jest.Mock,
    update: jest.fn() as jest.Mock,
    delete: jest.fn() as jest.Mock,
    count: jest.fn() as jest.Mock,
  },
  link: {
    count: jest.fn() as jest.Mock,
  },
  token: {
    create: jest.fn() as jest.Mock,
    findFirst: jest.fn() as jest.Mock,
  }
}));

jest.mock('../../src/utils/encryption', () => ({ encryptPassword: jest.fn() as jest.Mock }));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_token'),
  verify: jest.fn(() => ({ sub: 1, exp: moment().add(1, 'day').unix() })),
}));

describe('Token Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = tokenService.generateToken(1, moment().add(1, 'day'), TokenType.ACCESS);
      expect(token).toBe('mocked_token');
      expect(jwt.sign).toHaveBeenCalled();
    });
  });

  describe('saveToken', () => {
    it('should save token in database', async () => {
      (prisma.token.create as jest.Mock).mockResolvedValue({ token: 'mocked_token' });
      const savedToken = await tokenService.saveToken('mocked_token', 1, moment().add(1, 'day'), TokenType.ACCESS);
      expect(savedToken).toHaveProperty('token', 'mocked_token');
      expect(prisma.token.create).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify token and return token data', async () => {
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ token: 'mocked_token' });
      const verifiedToken = await tokenService.verifyToken('mocked_token', TokenType.ACCESS);
      expect(verifiedToken).toHaveProperty('token', 'mocked_token');
      expect(prisma.token.findFirst).toHaveBeenCalled();
    });

    it('should throw error if token not found', async () => {
      (prisma.token.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(tokenService.verifyToken('invalid_token', TokenType.ACCESS))
        .rejects.toThrow('Token not found');
    });
  });

  describe('generateAuthTokens', () => {
    it('should generate access and refresh tokens', async () => {
      (prisma.token.create as jest.Mock).mockResolvedValue({ token: 'mocked_refresh_token' });
      const tokens = await tokenService.generateAuthTokens({ id: 1 });
      expect(tokens).toHaveProperty('access');
      expect(tokens).toHaveProperty('refresh');
    });
  });

  describe('generateVerifyEmailToken', () => {
    it('should generate verify email token', async () => {
      (prisma.token.create as jest.Mock).mockResolvedValue({ token: 'mocked_verify_token' });
      const token = await tokenService.generateVerifyEmailToken({ id: 1 });
      expect(token).toBe('mocked_token');
    });
  });
});
