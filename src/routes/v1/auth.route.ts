import express from 'express';
import validate from '../../middlewares/validate';
import authValidation from '../../validations/auth.validation';
import auth from '../../middlewares/auth';
import passport from 'passport';
import { authController } from '../../controllers';
import config from '../../config/config';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.post(
  '/forgot-password',
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: config.frontendUrl + '/login'
  }),
  authController.googleAuthCallback
);

export default router;
