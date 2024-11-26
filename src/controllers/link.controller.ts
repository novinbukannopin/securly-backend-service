import catchAsync from '../utils/catchAsync';
import { linkService } from '../services';
import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import { extractParamsGet } from '../utils/extractParamsGet';

const create = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response: any = await linkService.create(req.body, user);

  res.status(httpStatus.CREATED).send(response);
});

const getAll = catchAsync(async (req, res) => {
  const showMe: boolean = req.query.show_me !== undefined ? req.query.show_me === 'true' : false;
  const { user, page, limit, isHidden } = extractParamsGet(req);

  const links = await linkService.getAll(showMe, user, limit, page, isHidden);
  res.status(httpStatus.OK).send(links);
});

const getAllOwn = catchAsync(async (req, res) => {
  const { user, page, limit, isHidden } = extractParamsGet(req);

  const links = await linkService.getAllOwn(user, limit, page, isHidden);
  res.status(httpStatus.OK).send(links);
});

const getById = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const link = await linkService.getById(user, req.params.id);
  res.status(httpStatus.OK).send(link);
});

const updateIsHidden = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const { isHidden } = req.body;

  await linkService.setHidden(user, req.params.id, isHidden);
  res.status(httpStatus.NO_CONTENT).send();
});

export default { create, getAllOwn, getAll, getById, updateIsHidden };
