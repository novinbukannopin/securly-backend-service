import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: ['createLink', 'getUser', 'getAllOwnLinks'],
  [Role.ADMIN]: [
    'createLink',
    'getUsers',
    'getUser',
    'getAllOwnLinks',
    'getAllLinks',
    'manageUsers'
  ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
