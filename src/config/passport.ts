import prisma from '../client';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
  VerifiedCallback
} from 'passport-jwt';
import {
  Strategy as GoogleStrategy,
  VerifyCallback as GoogleVerifyCallback
} from 'passport-google-oauth20';
import config from './config';
import { TokenType, User } from '@prisma/client';
import userService from '../services/user.service';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      where: { id: payload.sub }
    });

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

const googleOptions = {
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
};

const googleVerify: any = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifiedCallback
) => {
  try {
    if (!profile.emails || profile.emails.length === 0) {
      return done(new Error('Email not found in Google profile'), false);
    }

    const email = profile.emails[0].value;
    const name = profile.displayName || undefined;
    const role = 'USER';

    let dbUser = await userService.getUserByEmail(email, [
      'id',
      'email',
      'name',
      'role',
      'isEmailVerified'
    ]);

    if (!dbUser) {
      dbUser = await userService.createUser(email, undefined, name, 'USER', 'GOOGLE');
    }

    done(null, dbUser);
  } catch (error) {
    done(error, false);
  }
};

export const googleStrategy = new GoogleStrategy(googleOptions, googleVerify);
