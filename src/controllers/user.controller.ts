import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import type { User } from '@prisma/client';

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const user = await userService.createUser(email, password, name, role);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const getOwnProfile = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const users = await userService.getUserOwnProfile(Number(user.id), [
    'id',
    'email',
    'name',
    'username',
    'dob',
    'language'
  ]);
  res.send(users);
});

const updateUser = catchAsync(async (req, res) => {
  const user: User = req.user as User;
  const users = await userService.updateUserById(user.id, req.body);
  res.send(users);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getOwnProfile,
  getUser,
  updateUser,
  deleteUser
};
