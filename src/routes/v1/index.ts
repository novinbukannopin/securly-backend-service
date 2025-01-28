import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import docsRoute from './docs.route';
import config from '../../config/config';
import linkRoute from './link.route';
import indexRoute from './index.route';
import reviewRoute from './review.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/links',
    route: linkRoute
  },
  {
    path: '/reviews',
    route: reviewRoute
  },
  {
    path: '/',
    route: indexRoute
  }
];

// TODO - add more features
// TODO - Analytic route
// TODO - Click route
// TODO - Tags route

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
