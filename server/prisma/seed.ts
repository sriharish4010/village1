import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting Village1 development database seed...');

  // 1. Initial Categories
  const categoriesData = [
    {
      name: 'Grocery Stores',
      slug: 'grocery-stores',
      description: 'Daily fresh provisions, grains, spices, oils, pulses, and pantry essentials',
      icon: '🛒',
    },
    {
      name: 'Salons & Barber Shops',
      slug: 'salons-barber-shops',
      description: 'Men and women haircutting, shaving, facial, and grooming services with queue tokens',
      icon: '✂️',
    },
    {
      name: 'Bakeries & Sweets',
      slug: 'bakeries-sweets',
      description: 'Fresh tea snacks, cakes, puffs, biscuits, and traditional village sweets',
      icon: '🍞',
    },
    {
      name: 'Fancy Stores & Gifts',
      slug: 'fancy-stores',
      description: 'Cosmetics, bangles, stationery gifts, toys, and festival decorative items',
      icon: '✨',
    },
    {
      name: 'Stationery & Xerox',
      slug: 'stationery-shops',
      description: 'School notebooks, pens, printing, photocopying, and office supplies',
      icon: '📚',
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const upserted = await prisma.shopCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        isActive: true,
      },
    });
    categoryMap[cat.slug] = upserted.id;
  }
  console.log('[Seed] Categories seeded successfully');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('AdminSecure@123', 10);
  const shopkeeperPasswordHash = await bcrypt.hash('Shopkeeper@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  // 2. Platform Administrator
  const admin = await prisma.user.upsert({
    where: { email: 'admin@village1.in' },
    update: {},
    create: {
      email: 'admin@village1.in',
      phone: '9999900001',
      passwordHash: adminPasswordHash,
      role: 'ADMIN' as any,
      isActive: true,
      customerProfile: {
        create: {
          fullName: 'Village1 Platform Admin',
          village: 'Chennai Head Office',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pinCode: '600001',
          preferredLanguage: 'en',
        },
      },
    },
  });
  console.log('[Seed] Admin user seeded:', admin.email);

  // 3. Shopkeeper User
  const shopkeeper = await prisma.user.upsert({
    where: { email: 'shopkeeper@village1.in' },
    update: {},
    create: {
      email: 'shopkeeper@village1.in',
      phone: '9876543210',
      passwordHash: shopkeeperPasswordHash,
      role: 'SHOPKEEPER' as any,
      isActive: true,
      customerProfile: {
        create: {
          fullName: 'Murugan Shanmugam',
          village: 'Alanganallur',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pinCode: '625501',
          preferredLanguage: 'ta',
        },
      },
    },
  });
  console.log('[Seed] Shopkeeper user seeded:', shopkeeper.email);

  // 4. Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@village1.in' },
    update: {},
    create: {
      email: 'customer@village1.in',
      phone: '9123456780',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER' as any,
      isActive: true,
      customerProfile: {
        create: {
          fullName: 'Kavitha Ramachandran',
          village: 'Alanganallur',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pinCode: '625501',
          preferredLanguage: 'en',
        },
      },
      addresses: {
        create: {
          addressLine: '12, West Car Street',
          village: 'Alanganallur',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pinCode: '625501',
          landmark: 'Near Temple Arch',
          isDefault: true,
        },
      },
    },
  });
  console.log('[Seed] Customer user seeded:', customer.email);

  // 5. Approved Sample Grocery Shop
  const groceryShop = await prisma.shop.upsert({
    where: { slug: 'murugan-maligai-alanganallur' },
    update: {},
    create: {
      name: 'Murugan Maligai Store',
      slug: 'murugan-maligai-alanganallur',
      categoryId: categoryMap['grocery-stores'],
      description: 'Your reliable neighborhood grocery shop providing quality rice, pulses, oils, spices and dairy products since 2005.',
      address: '24, Main Bazaar Road, Alanganallur',
      village: 'Alanganallur',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pinCode: '625501',
      latitude: 10.0435,
      longitude: 78.0772,
      phone: '9876543210',
      email: 'murugan.shop@village1.in',
      openingHours: '07:30',
      closingHours: '21:30',
      weeklyHoliday: 'None',
      verificationStatus: 'APPROVED' as any,
      approvedAt: new Date(),
      isActive: true,
      pickupInstructions: 'Pick up at the front counter. Show your 4-digit pickup code.',
      policies: 'Check products before leaving the shop. 24-hour return policy for packaged grocery items.',
      members: {
        create: {
          userId: shopkeeper.id,
          role: 'OWNER' as any,
          permissions: 'orders,inventory,staff,reports,settings',
        },
      },
      products: {
        create: [
          {
            name: 'Ponni Boiled Rice (5 kg)',
            description: 'Premium quality aged South Indian Ponni boiled rice for daily meals',
            price: 320,
            stock: 45,
            unit: 'bag',
            isAvailable: true,
          },
          {
            name: 'Pure Gingelly Oil (1 Litre)',
            description: 'Cold-pressed traditional sesame oil for cooking and health',
            price: 240,
            stock: 30,
            unit: 'bottle',
            isAvailable: true,
          },
          {
            name: 'Toor Dal First Quality (1 kg)',
            description: 'Clean unpolished toor dal rich in protein for authentic sambar',
            price: 165,
            stock: 60,
            unit: 'kg',
            isAvailable: true,
          },
          {
            name: 'Aachi Chilli Powder (200g)',
            description: 'Fine ground pure red chilli powder from Guntur chillies',
            price: 68,
            stock: 80,
            unit: 'packet',
            isAvailable: true,
          },
          {
            name: 'Tata Salt Crystal (1 kg)',
            description: 'Vacuum evaporated iodized crystal salt',
            price: 28,
            stock: 120,
            unit: 'packet',
            isAvailable: true,
          },
        ],
      },
    },
  });
  console.log('[Seed] Sample Grocery Shop seeded:', groceryShop.name);

  // 6. Approved Sample Salon Shop
  const salonShop = await prisma.shop.upsert({
    where: { slug: 'karthik-hair-studio-alanganallur' },
    update: {},
    create: {
      name: "Karthik Men's Hair Studio",
      slug: 'karthik-hair-studio-alanganallur',
      categoryId: categoryMap['salons-barber-shops'],
      description: 'Modern air-conditioned hair styling, shaving, facial care, and grooming studio.',
      address: '7, Bus Stand Complex, Alanganallur',
      village: 'Alanganallur',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pinCode: '625501',
      phone: '9842109876',
      openingHours: '08:00',
      closingHours: '21:00',
      weeklyHoliday: 'Tuesday',
      verificationStatus: 'APPROVED' as any,
      approvedAt: new Date(),
      isActive: true,
      pickupInstructions: 'Take token from app or counter and arrive 5 minutes prior to appointment slot.',
      members: {
        create: {
          userId: shopkeeper.id,
          role: 'OWNER' as any,
          permissions: 'services,appointments,queue,reports',
        },
      },
      services: {
        create: [
          {
            name: 'Gentlemen Haircut & Style',
            description: 'Complete haircut with head massage and styling',
            price: 120,
            durationMinutes: 25,
            isAvailable: true,
          },
          {
            name: 'Traditional Shaving & Beard Trim',
            description: 'Clean razor shave with hot towel treatment and aftershave',
            price: 60,
            durationMinutes: 15,
            isAvailable: true,
          },
          {
            name: 'Herbal Head Massage',
            description: 'Relaxing 20-minute cooling oil head massage',
            price: 150,
            durationMinutes: 20,
            isAvailable: true,
          },
        ],
      },
    },
  });
  console.log('[Seed] Sample Salon Shop seeded:', salonShop.name);

  console.log('[Seed] Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
