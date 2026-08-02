require('./dnsSet');
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const readline = require('readline');
const SuperAdmin = require('../models/admin/SuperAdmin');
const Setting = require('../models/admin/Setting');
const Legal = require('../models/admin/Legal');
const { hashPassword } = require('../utils/hashPassword');
const logger = require('../utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

const seedSuperAdmin = async () => {
  const exists = await SuperAdmin.findOne({ email: 'admin@eduprime.com' });
  if (exists) {
    console.log('  ⚠️  Default super admin already exists. Skipping.');
    return;
  }

  await SuperAdmin.create({
    name: 'EduPrime Admin',
    email: 'admin@eduprime.com',
    password: await hashPassword('admin123'),
    role: 'super_admin',
  });
  console.log('  ✅ Default super admin created (admin@eduprime.com / admin123)');
};

const seedSettings = async () => {
  const defaults = [
    { key: 'app_name', value: 'EduPrime', description: 'Application name' },
    { key: 'support_email', value: 'support@eduprime.com', description: 'Platform support email' },
    { key: 'support_phone', value: '+254700000000', description: 'Platform support phone' },
    { key: 'default_currency', value: 'KES', description: 'Default currency' },
    { key: 'default_country', value: 'Kenya', description: 'Default country' },
    { key: 'max_schools', value: 0, description: 'Max schools (0 = unlimited)' },
    { key: 'email_enabled', value: true, description: 'Global email toggle' },
    { key: 'sms_enabled', value: true, description: 'Global SMS toggle' },
    { key: 'redis_enabled', value: true, description: 'Global Redis toggle' },
    { key: 'cloudinary_enabled', value: true, description: 'Global Cloudinary toggle' },
    { key: 'socket_enabled', value: true, description: 'Global WebSocket toggle' },
    { key: 'logo_url', value: '', description: 'Platform logo URL' },
    { key: 'favicon_url', value: '', description: 'Platform favicon URL' },
    { key: 'timezone', value: 'Africa/Nairobi', description: 'Default timezone' },
    { key: 'date_format', value: 'DD/MM/YYYY', description: 'Date display format' },
    { key: 'maintenance_mode', value: false, description: 'Maintenance mode toggle' },
    { key: 'allow_self_registration', value: false, description: 'Allow schools to self-register' },
    { key: 'trial_days', value: 0, description: 'Trial period in days (0 = no trial)' },
    { key: 'primary_color', value: '#0d1b2a', description: 'Theme primary color' },
    { key: 'accent_color', value: '#f0a500', description: 'Theme accent color' },
  ];

  for (const setting of defaults) {
    const exists = await Setting.findOne({ key: setting.key });
    if (!exists) {
      await Setting.create(setting);
      console.log(`  ✅ Setting "${setting.key}" seeded.`);
    }
  }
};

const seedLegals = async () => {
  const defaults = [
    {
      type: 'privacy_policy',
      title: 'Privacy Policy',
      content: 'This is the default privacy policy for EduPrime. Please update with your actual policy.',
      version: '1.0',
      isPublished: true,
    },
    {
      type: 'terms_of_service',
      title: 'Terms of Service',
      content: 'These are the default terms of service for EduPrime. Please update with your actual terms.',
      version: '1.0',
      isPublished: true,
    },
    {
      type: 'refund_policy',
      title: 'Refund Policy',
      content: 'This is the default refund policy for EduPrime. Please update with your actual policy.',
      version: '1.0',
      isPublished: true,
    },
  ];

  for (const legal of defaults) {
    const exists = await Legal.findOne({ type: legal.type });
    if (!exists) {
      await Legal.create(legal);
      console.log(`  ✅ Legal "${legal.type}" seeded.`);
    }
  }
};

const seedAll = async () => {
  console.log('\n🌱 Seeding all...\n');
  await seedSuperAdmin();
  await seedSettings();
  await seedLegals();
  console.log('\n✅ All seeded.\n');
};

const showMenu = async () => {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║      🌱 EduPrime Seed CLI        ║');
  console.log('╚══════════════════════════════════╝\n');
  console.log('  1. Seed All');
  console.log('  2. Seed Settings');
  console.log('  3. Seed Legals');
  console.log('  0. Exit\n');

  const choice = await question('  Choose an option: ');

  switch (choice) {
    case '1':
      await seedAll();
      break;
    case '2':
      console.log('\n⚙️  Seeding settings...\n');
      await seedSettings();
      console.log('\n✅ Settings seeded.\n');
      break;
    case '3':
      console.log('\n📜 Seeding legals...\n');
      await seedLegals();
      console.log('\n✅ Legals seeded.\n');
      break;
    case '0':
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
    default:
      console.log('\n⚠️  Invalid option.\n');
  }

  await showMenu();
};

const main = async () => {
  await connectDB();
  await showMenu();
};

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});