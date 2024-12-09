import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';
import * as dotenv from 'dotenv';
import { encryptPassword } from '../src/utils/encryption';

dotenv.config();

const prisma = new PrismaClient();
const admin: Partial<User> = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  name: process.env.ADMIN_NAME
};

async function main() {
  const admins = await prisma.user.create({
    data: {
      email: admin.email || '',
      password: (await encryptPassword(admin.password || '')) || '',
      name: admin.name,
      role: 'ADMIN'
    }
  });
  console.log({ admins });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
