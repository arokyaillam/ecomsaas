import { db, superAdmins, merchantPlans, stores, users } from './index.js';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config({ path: resolve(fileURLToPath(import.meta.url), '../../../../../.env') });

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const [admin] = await db.insert(superAdmins).values({
    email: 'superadmin@ecomsaas.com',
    password: adminPassword,
    name: 'Super Admin',
    isActive: true,
  }).onConflictDoNothing().returning();

  if (admin) {
    console.log('✅ Super Admin created: superadmin@ecomsaas.com / admin123');
  } else {
    console.log('⏭️  Super Admin already exists, skipping');
  }

  // 2. Create Merchant Plans
  const plansData = [
    {
      name: 'Starter',
      description: 'Perfect for small stores just getting started',
      price: '0',
      currency: 'USD',
      interval: 'month',
      features: ['Up to 100 products', '1 GB storage', 'Basic analytics', 'Email support'],
      maxProducts: 100,
      maxStorage: 1024,
      isActive: true,
    },
    {
      name: 'Professional',
      description: 'Best for growing businesses with more needs',
      price: '29.99',
      currency: 'USD',
      interval: 'month',
      features: ['Up to 1000 products', '10 GB storage', 'Advanced analytics', 'Priority support', 'Custom domain', 'Discount codes'],
      maxProducts: 1000,
      maxStorage: 10240,
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'For large-scale operations with full customization',
      price: '99.99',
      currency: 'USD',
      interval: 'month',
      features: ['Unlimited products', '50 GB storage', 'Premium analytics', '24/7 support', 'Custom domain', 'Discount codes', 'Multi-currency', 'API access'],
      maxProducts: 999999,
      maxStorage: 51200,
      isActive: true,
    },
  ];

  const insertedPlans = [];
  for (const plan of plansData) {
    const [inserted] = await db.insert(merchantPlans).values(plan).onConflictDoNothing().returning();
    if (inserted) {
      insertedPlans.push(inserted);
      console.log(`✅ Plan created: ${plan.name} ($${plan.price}/${plan.interval})`);
    } else {
      console.log(`⏭️  Plan "${plan.name}" already exists, skipping`);
    }
  }

  // Fetch all plans (including existing) for merchant assignment
  const allPlans = await db.select().from(merchantPlans);

  // 3. Create Test Merchants
  const merchantsData = [
    {
      name: 'Fashion Hub',
      domain: 'fashionhub',
      status: 'active',
      isApproved: true,
      approvedAt: new Date(Date.now() - 15 * 86400000),
      planId: allPlans.find(p => p.name === 'Professional')?.id || null,
      ownerEmail: 'owner@fashionhub.com',
      ownerName: 'Sarah Johnson',
      totalOrders: 247,
      totalRevenue: '15420.50',
      totalCustomers: 189,
      primaryColor: '#e11d48',
    },
    {
      name: 'TechZone',
      domain: 'techzone',
      status: 'active',
      isApproved: true,
      approvedAt: new Date(Date.now() - 30 * 86400000),
      planId: allPlans.find(p => p.name === 'Enterprise')?.id || null,
      ownerEmail: 'admin@techzone.io',
      ownerName: 'Mike Chen',
      totalOrders: 1023,
      totalRevenue: '89340.00',
      totalCustomers: 756,
      primaryColor: '#0ea5e9',
    },
    {
      name: 'HomeDecor',
      domain: 'homedecor',
      status: 'active',
      isApproved: true,
      approvedAt: new Date(Date.now() - 7 * 86400000),
      planId: allPlans.find(p => p.name === 'Starter')?.id || null,
      ownerEmail: 'info@homedecor.shop',
      ownerName: 'Emma Wilson',
      totalOrders: 64,
      totalRevenue: '3210.75',
      totalCustomers: 52,
      primaryColor: '#16a34a',
    },
    {
      name: 'GadgetWorld',
      domain: 'gadgetworld',
      status: 'pending',
      isApproved: false,
      ownerEmail: 'new@gadgetworld.com',
      ownerName: 'Alex Rivera',
      totalOrders: 0,
      totalRevenue: '0',
      totalCustomers: 0,
    },
    {
      name: 'OrganicFoods',
      domain: 'organicfoods',
      status: 'pending',
      isApproved: false,
      ownerEmail: 'hello@organicfoods.co',
      ownerName: 'Lisa Park',
      totalOrders: 0,
      totalRevenue: '0',
      totalCustomers: 0,
    },
    {
      name: 'BookNest',
      domain: 'booknest',
      status: 'suspended',
      isApproved: true,
      approvedAt: new Date(Date.now() - 60 * 86400000),
      planId: allPlans.find(p => p.name === 'Professional')?.id || null,
      ownerEmail: 'support@booknest.com',
      ownerName: 'David Kim',
      totalOrders: 312,
      totalRevenue: '18920.00',
      totalCustomers: 245,
    },
    {
      name: 'FitGear',
      domain: 'fitgear',
      status: 'suspended',
      isApproved: true,
      approvedAt: new Date(Date.now() - 45 * 86400000),
      ownerEmail: 'admin@fitgear.store',
      ownerName: 'Rachel Green',
      totalOrders: 156,
      totalRevenue: '9870.25',
      totalCustomers: 120,
    },
    {
      name: 'CraftCorner',
      domain: 'craftcorner',
      status: 'deactivated',
      isApproved: true,
      approvedAt: new Date(Date.now() - 90 * 86400000),
      ownerEmail: 'owner@craftcorner.com',
      ownerName: 'Tom Baker',
      totalOrders: 45,
      totalRevenue: '2340.00',
      totalCustomers: 38,
    },
  ];

  for (const merchant of merchantsData) {
    const [inserted] = await db.insert(stores).values(merchant).onConflictDoNothing().returning();
    if (inserted) {
      console.log(`✅ Merchant created: ${merchant.name} (${merchant.status})`);

      // Create owner user for approved merchants
      if (merchant.isApproved) {
        const userPassword = await bcrypt.hash('merchant123', 10);
        await db.insert(users).values({
          email: merchant.ownerEmail,
          password: userPassword,
          role: 'OWNER',
          storeId: inserted.id,
        }).onConflictDoNothing();
      }
    } else {
      console.log(`⏭️  Merchant "${merchant.name}" already exists, skipping`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Summary:');
  console.log('   Super Admin: superadmin@ecomsaas.com / admin123');
  console.log('   Plans: Starter (Free), Professional ($29.99/mo), Enterprise ($99.99/mo)');
  console.log('   Merchants: 8 (3 active, 2 pending, 2 suspended, 1 deactivated)');
  console.log('   Merchant password (where applicable): merchant123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});