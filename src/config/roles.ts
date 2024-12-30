import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: [
    // LINK
    'link:create',
    'link:update',
    'link:get-own',
    'link:get-by-id',
    'link:update-is-hidden',
    'link:delete',
    'link:archive',
    'link:get-analytics',

    // PROFILE
    'profile:me'
  ],
  [Role.ADMIN]: [
    // LINK
    'link:create',
    'link:update',
    'link:get-own',
    'link:get-all',
    'link:get-by-id',
    'link:update-is-hidden',

    'link:get-analytics',

    // LINK ADMIN
    'link:delete',

    'link:archive',

    // USER
    'admin:get-user-by-id',

    'user:get',
    'user:get-all',
    'user:manage',
    'admin:get-all-users',

    // PROFILE
    'profile:me',

    // REVIEW
    'review:get-all'
  ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
