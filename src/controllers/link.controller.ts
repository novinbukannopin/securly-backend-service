import catchAsync from '../utils/catchAsync';
import { linkService } from '../services';
import httpStatus from 'http-status';
import type { User, Link, UTM } from '@prisma/client';

const create = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response: any = await linkService.createLink(req.body, user);

  res.status(httpStatus.CREATED).send(response);
});

const getAllOwnLinks = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const links = await linkService.getAllOwnLinks(user);
  res.status(httpStatus.OK).send(links);
});

const getAllLinks = catchAsync(async (req, res) => {
  const links = await linkService.getAllLinks();
  res.status(httpStatus.OK).send(links);
});

export default { create, getAllOwnLinks, getAllLinks };
