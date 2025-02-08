import httpStatus from 'http-status';
import { TokenType } from '@prisma/client';
import { authService, tokenService, userService } from '../../src/services';
import { encryptPassword, isPasswordMatch } from '../../src/utils/encryption';
import ApiError from '../../src/utils/ApiError';
import prisma from '../../src/client';

jest.mock('../../src/client', () => ({
  token: {
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
}));

jest.mock('../../src/services/user.service');
jest.mock('../../src/services/token.service');
jest.mock('../../src/utils/encryption');

describe('Auth Service', () => {
  describe('loginUserWithEmailAndPassword', () => {
    it('should return user data without password if credentials are correct', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser'
      };

      (userService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (isPasswordMatch as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginUserWithEmailAndPassword(
        'test@example.com',
        'password123'
      );

      expect(result).toHaveProperty('id', 'user123');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw an error if the password is incorrect', async () => {
      (userService.getUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword'
      });
      (isPasswordMatch as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginUserWithEmailAndPassword('test@example.com', 'wrongpassword')
      ).rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or passwords'));
    });

    it('should throw an error if the user logs in with Google account', async () => {
      (userService.getUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user123',
        email: 'google@example.com',
        password: null
      });

      await expect(
        authService.loginUserWithEmailAndPassword('google@example.com', 'password')
      ).rejects.toThrow(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'This account was created using Google Login. Please log in using Google'
        )
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token if found', async () => {
      const mockToken = { id: 'token123', token: 'refreshToken' };
      (prisma.token.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (prisma.token.delete as jest.Mock).mockResolvedValue({});

      await expect(authService.logout('refreshToken')).resolves.toBeUndefined();
      expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: 'token123' } });
    });

    it('should throw an error if refresh token is not found', async () => {
      (prisma.token.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.logout('invalidToken')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Not found')
      );
    });
  });

  describe('refreshAuth', () => {
    it('should generate new auth tokens when given a valid refresh token', async () => {
      const mockTokenData = { id: 'token123', userId: 'user123' };
      (tokenService.verifyToken as jest.Mock).mockResolvedValue(mockTokenData);
      (tokenService.generateAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken'
      });

      const result = await authService.refreshAuth('validRefreshToken');

      expect(result).toHaveProperty('accessToken', 'newAccessToken');
      expect(tokenService.verifyToken).toHaveBeenCalledWith('validRefreshToken', TokenType.REFRESH);
      expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: 'token123' } });
    });

    it('should throw an error if refresh token is invalid', async () => {
      (tokenService.verifyToken as jest.Mock).mockRejectedValue(new Error());

      await expect(authService.refreshAuth('invalidRefreshToken')).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password and delete reset tokens', async () => {
      const mockUser = { id: 'user123' };
      (tokenService.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (encryptPassword as jest.Mock).mockResolvedValue('newHashedPassword');
      (userService.updateUserById as jest.Mock).mockResolvedValue({});

      await expect(
        authService.resetPassword('validResetToken', 'newPassword')
      ).resolves.toBeUndefined();
      expect(userService.updateUserById).toHaveBeenCalledWith('user123', {
        password: 'newHashedPassword'
      });
      expect(prisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123', type: TokenType.RESET_PASSWORD }
      });
    });

    it('should throw an error if reset token is invalid', async () => {
      (tokenService.verifyToken as jest.Mock).mockRejectedValue(new Error());

      await expect(authService.resetPassword('invalidResetToken', 'newPassword')).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed')
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and delete verification token', async () => {
      (tokenService.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (userService.updateUserById as jest.Mock).mockResolvedValue({});

      await expect(authService.verifyEmail('validVerifyToken')).resolves.toBeUndefined();
      expect(userService.updateUserById).toHaveBeenCalledWith('user123', { isEmailVerified: true });
      expect(prisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123', type: TokenType.VERIFY_EMAIL }
      });
    });

    it('should throw an error if verification token is invalid', async () => {
      (tokenService.verifyToken as jest.Mock).mockRejectedValue(new Error());

      await expect(authService.verifyEmail('invalidVerifyToken')).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
      );
    });
  });
});
