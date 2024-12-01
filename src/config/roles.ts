import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: [
    'link:create',
    'user:get',
    'link:update',
    'link:get-own',
    'link:get-by-id',
    'link:update-is-hidden',
    'link:delete'
  ],
  [Role.ADMIN]: [
    'link:create',
    'link:update',
    'link:get-own',
    'link:get-all',
    'link:get-by-id',
    'link:update-is-hidden',
    'link:delete',
    'user:get',
    'user:get-all',
    'user:manage'
  ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
