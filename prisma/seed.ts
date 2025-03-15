import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';
import * as dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

dotenv.config();

const prisma = new PrismaClient();
const admin: Partial<User> = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  name: process.env.ADMIN_NAME
};

async function main() {
  try {
    console.log('Seeding Click and UserAgent data...');

    // Ambil semua Link yang ada di database
    const links = await prisma.link.findMany();
    if (links.length === 0) {
      console.warn('No links found. Please seed links first.');
      return;
    }

    for (const link of links) {
      // Tentukan jumlah klik secara dinamis (100, 200, atau 300)
      const clickCount = faker.helpers.arrayElement([100, 200, 300]);

      for (let i = 0; i < clickCount; i++) {
        // Buat UserAgent
        const userAgent = await prisma.userAgent.create({
          data: {
            ua: faker.internet.userAgent(),
            browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']),
            browserVersion: faker.system.semver(),
            os: faker.system.commonFileType(),
            osVersion: faker.system.semver(),
            cpuArch: faker.system.fileExt(),
            deviceType: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
            engine: faker.system.mimeType()
          }
        });

        // Buat Click yang terhubung ke UserAgent dan Link
        await prisma.click.create({
          data: {
            linkId: link.id,
            timestamp: faker.date.recent(),
            ip: faker.internet.ip(),
            location: faker.address.city(),
            region: faker.address.state(),
            country: faker.address.country(),
            loc: `${faker.address.latitude()},${faker.address.longitude()}`,
            org: faker.company.name(),
            postal: faker.address.zipCode(),
            timezone: faker.address.timeZone(),
            countryCode: faker.address.countryCode(),
            userAgentId: userAgent.id
          }
        });
      }
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
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
