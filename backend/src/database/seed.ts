import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

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
  entities: [User],
  synchronize: true,
  logging: false,
});

async function seed() {
  await dataSource.initialize();

  const repo = dataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`User "${ADMIN_EMAIL}" already exists — skipping seed.`);
    await dataSource.destroy();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD!, 10);
  await repo.save(repo.create({ email: ADMIN_EMAIL, password: hashed, name: ADMIN_NAME }));
  console.log(`Created admin user: ${ADMIN_EMAIL}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
