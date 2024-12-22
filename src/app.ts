import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { googleStrategy, jwtStrategy } from './config/passport';
import { authLimiter } from './middlewares/rateLimiter';
import routes from './routes/v1';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';
import { IPinfoWrapper } from 'node-ipinfo';
import { UAParser } from 'ua-parser-js';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true
  })
);

app.use(async (req, res, next) => {
  if (req.method === 'GET') {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipinfoWrapper = new IPinfoWrapper(config.ipinfoToken);
    if (typeof ip === 'string') {
      const details = await ipinfoWrapper.lookupIp(ip);
    }
    const data = UAParser(req.headers['user-agent']);
  }
  next();
});
// app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);
passport.use('google', googleStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
