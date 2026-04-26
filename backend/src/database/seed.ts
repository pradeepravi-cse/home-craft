import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { Service } from '../service-catalog/service.entity';
import { Product, ProductCategory } from '../products/product.entity';
import { PricingRule, DiscountType } from '../pricing/pricing-rule.entity';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin', DATABASE_URL } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  schema: 'public',
  uuidExtension: 'pgcrypto',
  entities: [User, Service, Product, PricingRule],
  synchronize: true,
  logging: false,
});

async function seed() {
  await dataSource.initialize();

  // ── Admin user ──────────────────────────────────────────────────────────
  const userRepo = dataSource.getRepository(User);
  let admin = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });

  if (!admin) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD!, 10);
    admin = await userRepo.save(
      userRepo.create({ email: ADMIN_EMAIL, password: hashed, name: ADMIN_NAME, role: UserRole.ADMIN }),
    );
    console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Admin user "${ADMIN_EMAIL}" already exists — skipping.`);
  }

  // ── Services ─────────────────────────────────────────────────────────────
  const serviceRepo = dataSource.getRepository(Service);
  const existingServices = await serviceRepo.count();

  if (existingServices === 0) {
    const prePleating = serviceRepo.create({
      name: 'Saree Pleating',
      description: 'Professional saree pleating service',
      basePrice: 20,
      isOptional: false,
      workflowDefinition: {
        steps: [
          { id: 'RECEIVED', label: 'Saree Received', transitions: ['PROCESSING'] },
          { id: 'PROCESSING', label: 'Pleating In Progress', transitions: ['READY'] },
          { id: 'READY', label: 'Ready for Collection', transitions: ['COMPLETED'] },
          { id: 'COMPLETED', label: 'Completed', transitions: [] },
        ],
        initialStep: 'RECEIVED',
        completionStep: 'COMPLETED',
        dependencies: [],
      },
    });

    const draping = serviceRepo.create({
      name: 'Saree Draping',
      description: 'Professional saree draping service (optional add-on)',
      basePrice: 30,
      isOptional: true,
      workflowDefinition: {
        steps: [
          { id: 'SCHEDULED', label: 'Appointment Scheduled', transitions: ['DRAPING'] },
          { id: 'DRAPING', label: 'Draping In Progress', transitions: ['COMPLETED'] },
          { id: 'COMPLETED', label: 'Completed', transitions: [] },
        ],
        initialStep: 'SCHEDULED',
        completionStep: 'COMPLETED',
        dependencies: [],
      },
    });

    await serviceRepo.save([prePleating, draping]);
    console.log('✅ Seeded services: Saree Pleating, Saree Draping');
  } else {
    console.log('ℹ️  Services already exist — skipping.');
  }

  // ── Bakery Products ───────────────────────────────────────────────────────
  const productRepo = dataSource.getRepository(Product);
  const existingProducts = await productRepo.count();

  if (existingProducts === 0) {
    const products = productRepo.create([
      { name: 'Chocolate Chip Cookies', category: ProductCategory.COOKIES, price: 150, costPrice: 60, unit: 'per dozen' },
      { name: 'Butter Cookies', category: ProductCategory.COOKIES, price: 120, costPrice: 50, unit: 'per dozen' },
      { name: 'Chocolate Truffle Cake', category: ProductCategory.CAKES, price: 800, costPrice: 350, unit: 'per kg' },
      { name: 'Vanilla Sponge Cake', category: ProductCategory.CAKES, price: 600, costPrice: 280, unit: 'per kg' },
      { name: 'Fudge Brownies', category: ProductCategory.BROWNIES, price: 200, costPrice: 80, unit: 'per box of 6' },
      { name: 'Veg Puffs', category: ProductCategory.PUFFS, price: 30, costPrice: 12, unit: 'per piece' },
    ]);

    await productRepo.save(products);
    console.log('✅ Seeded 6 bakery products');
  } else {
    console.log('ℹ️  Products already exist — skipping.');
  }

  // ── Pricing Rules ─────────────────────────────────────────────────────────
  const pricingRepo = dataSource.getRepository(PricingRule);
  const existingRules = await pricingRepo.count();

  if (existingRules === 0) {
    // We need the pleating service ID for the combo rule
    const prePleating = await serviceRepo.findOne({
      where: { name: 'Saree Pleating' },
    });
    const draping = await serviceRepo.findOne({ where: { name: 'Saree Draping' } });

    if (prePleating && draping) {
      const comboRule = pricingRepo.create({
        name: 'Pleating + Draping Combo Discount',
        description: 'Get ₹10 off when booking both Pleating and Draping together',
        conditions: {
          requiredServiceIds: [prePleating.id, draping.id],
        },
        discountType: DiscountType.FIXED,
        discountValue: 10,
      });

      await pricingRepo.save(comboRule);
      console.log('✅ Seeded combo pricing rule');
    }
  } else {
    console.log('ℹ️  Pricing rules already exist — skipping.');
  }

  await dataSource.destroy();
  console.log('🎉 Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
