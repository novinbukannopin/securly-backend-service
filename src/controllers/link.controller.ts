import catchAsync from '../utils/catchAsync';
import { linkService } from '../services';
import httpStatus from 'http-status';
import type { Link, User, UTM } from '@prisma/client';
import { extractParamsGet } from '../utils/extractParamsGet';
import { AnalyticsData } from '../types/response';

const create = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response: any = await linkService.create(req.body, user);

  res.status(httpStatus.CREATED).send({
    code: httpStatus.CREATED.toPrecision(),
    message: 'Link created successfully',
    data: response
  });
});

const getAll = catchAsync(async (req, res) => {
  const showMe: boolean = req.query.show_me !== undefined ? req.query.show_me === 'true' : false;
  const { user, page, limit, includeHidden, includeDeleted } = extractParamsGet(req);

  const links = await linkService.getAll(showMe, user, limit, page, includeHidden, includeDeleted);
  res.status(httpStatus.OK).send(links);
});

const getAllOwn = catchAsync(async (req, res) => {
  const { user, page, limit, includeHidden, includeDeleted } = extractParamsGet(req);

  const links = await linkService.getAllOwn(user, limit, page, includeHidden, includeDeleted);
  res.status(httpStatus.OK).send(links);
});

const getById = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const link = await linkService.getById(user, req.params.id);
  res.status(httpStatus.OK).send(link);
});

// const updateIsHidden = catchAsync(async (req, res) => {
//   const user: User = req.user as User;
//   const { isHidden } = req.body;
//
//   const response = await linkService.setHidden(user, req.params.id, isHidden);
//   res.status(httpStatus.CREATED).send({
//     code: httpStatus.CREATED.toPrecision(),
//     message: 'Link hidden status updated successfully',
//     data: response
//   });
// });

const archive = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const action = req.body.action as 'archive' | 'unarchive';

  const response = await linkService.archive(user, req.params.id, action);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: `Link ${action} successfully`,
    data: response
  });
});

const update = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const data: Partial<Link> & { utm?: Partial<UTM>; tag?: string[] } = req.body;

  const response = await linkService.update(user, req.params.id, data);

  res.status(httpStatus.OK).send({
    code: httpStatus.OK,
    message: 'Link updated successfully',
    data: response
  });
});

const deleted = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  await linkService.softDelete(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'Link deleted successfully'
  });
});

const restore = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const response = await linkService.restore(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'Link restored successfully',
    data: response
  });
});

const removeUTM = catchAsync(async (req, res) => {
  const user: User = req.user as User;

  const response = await linkService.removeUTM(user, req.params.id);
  res.status(httpStatus.OK).send({
    code: httpStatus.OK.toPrecision(),
    message: 'UTM removed successfully',
    data: response
  });
});

const redirect = catchAsync(async (req, res) => {
  const { code } = req.params;
  const headers = req.headers;
  const { ip, userAgent } = { ip: headers['x-forwarded-for'], userAgent: headers['user-agent'] };
  const IP = Array.isArray(ip) ? ip[0] : ip;
  const response = await linkService.goto(code, IP, userAgent);
  res.redirect(response.originalUrl);
});

const getAnalytics = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const response = await linkService.getAnalytics(user);
  res.status(httpStatus.OK).send(response);
});

export default {
  create,
  getAll,
  getAllOwn,
  getById,
  update,
  deleted,
  restore,
  removeUTM,
  redirect,
  archive,
  getAnalytics
};
