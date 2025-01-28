import express from 'express';
import indexRoute from './index.route';

const indexRouter = express.Router();

const defaultRoutes = [
  {
    path: '/',
    route: indexRoute
  }
];

defaultRoutes.forEach((route) => {
  indexRouter.use(route.path, route.route);
});

export default indexRouter;
