import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { generateSeed } from './auctions/draw-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Sporting Goods', slug: 'sporting-goods' },
    { name: 'Collectibles', slug: 'collectibles' },
    { name: 'Toys', slug: 'toys' },
    { name: 'Motors', slug: 'motors' },
    { name: 'Art', slug: 'art' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Create Users
  const hashedPassword = await argon2.hash('password123');
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@bidnest.com' },
    update: {},
    create: {
      email: 'admin@bidnest.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      wallet: { create: { balance: 1000 } }
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller@bidnest.com' },
    update: {},
    create: {
      email: 'seller@bidnest.com',
      password: hashedPassword,
      name: 'Power Seller',
      role: 'SELLER',
      wallet: { create: { balance: 500 } }
    },
  });

  const bidder1 = await prisma.user.upsert({
    where: { email: 'bidder@bidnest.com' },
    update: {},
    create: {
      email: 'bidder@bidnest.com',
      password: hashedPassword,
      name: 'Lucky Bidder',
      role: 'USER',
      wallet: { create: { balance: 100 } }
    },
  });

  const electronicsCategory = await prisma.category.findUnique({ where: { slug: 'electronics' } });

  // Create Sample Auction
  const { seed, seedHash } = generateSeed();
  await prisma.auction.create({
    data: {
      title: 'Vintage Film Camera',
      description: 'Excellent condition vintage camera. Tested and working.',
      categoryId: electronicsCategory!.id,
      sellerId: seller1.id,
      condition: 'Used - Excellent',
      entryFee: 1.5,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'LIVE',
      seedHash: seedHash,
      seed: seed,
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
