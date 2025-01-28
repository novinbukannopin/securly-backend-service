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

const cities = [
  { city: 'Jakarta', region: 'DKI Jakarta', country: 'Indonesia' },
  { city: 'Surabaya', region: 'Jawa Timur', country: 'Indonesia' },
  { city: 'Bandung', region: 'Jawa Barat', country: 'Indonesia' },
  { city: 'Yogyakarta', region: 'DI Yogyakarta', country: 'Indonesia' },
  { city: 'Medan', region: 'Sumatera Utara', country: 'Indonesia' },
  { city: 'Denpasar', region: 'Bali', country: 'Indonesia' },
  { city: 'Makassar', region: 'Sulawesi Selatan', country: 'Indonesia' },
  { city: 'Semarang', region: 'Jawa Tengah', country: 'Indonesia' },
  { city: 'Palembang', region: 'Sumatera Selatan', country: 'Indonesia' },
  { city: 'Balikpapan', region: 'Kalimantan Timur', country: 'Indonesia' },
];

// List UserAgent sample
const userAgentSamples = [
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    browser: 'Chrome',
    browserVersion: '91.0.4472.124',
    os: 'Windows',
    osVersion: '10.0',
    cpuArch: 'x64',
    deviceType: 'Desktop',
    engine: 'Blink',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    browser: 'Safari',
    browserVersion: '14.1.1',
    os: 'iOS',
    osVersion: '14.6',
    cpuArch: 'ARM',
    deviceType: 'Mobile',
    engine: 'WebKit',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
    browser: 'Chrome',
    browserVersion: '91.0.4472.124',
    os: 'Android',
    osVersion: '11',
    cpuArch: 'ARM',
    deviceType: 'Mobile',
    engine: 'Blink',
  },
];


async function main() {
  // const admins = await prisma.user.create({
  //   data: {
  //     email: admin.email || '',
  //     password: (await encryptPassword(admin.password || '')) || '',
  //     name: admin.name,
  //     role: 'ADMIN'
  //   }
  // });
  // console.log({ admins });

  const linkIds = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

  const generateRandomClickAndUserAgent = async (linkId: number) => {
    const randomDate = new Date(
      new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Random date within 30 days
    );

    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomUserAgent = userAgentSamples[Math.floor(Math.random() * userAgentSamples.length)];

    // Create a new UserAgent entry
    const userAgent = await prisma.userAgent.create({
      data: {
        ua: randomUserAgent.ua,
        browser: randomUserAgent.browser,
        browserVersion: randomUserAgent.browserVersion,
        os: randomUserAgent.os,
        osVersion: randomUserAgent.osVersion,
        cpuArch: randomUserAgent.cpuArch,
        deviceType: randomUserAgent.deviceType,
        engine: randomUserAgent.engine,
      },
    });

    // Create a new Click entry
    await prisma.click.create({
      data: {
        id: crypto.randomUUID(),
        linkId,
        timestamp: randomDate,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location: randomCity.city, // Properti 'location' dari sampel kota
        region: randomCity.region, // Properti 'region' dari sampel kota
        country: randomCity.country, // Properti 'country' dari sampel kota
        loc: `${(Math.random() * 90).toFixed(4)}, ${(Math.random() * 180).toFixed(4)}`,
        org: 'Random ISP',
        postal: `${Math.floor(10000 + Math.random() * 89999)}`,
        timezone: `UTC${Math.floor(-12 + Math.random() * 24)}`,
        countryCode: 'ID',
        userAgentId: userAgent.id,
      },
    });
  };

  for (const linkId of linkIds) {
    for (let i = 0; i < 100; i++) {
      // Generate 100 clicks per link, each with a unique UserAgent
      await generateRandomClickAndUserAgent(linkId);
    }
  }

  console.log('Seeder finished!');
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
