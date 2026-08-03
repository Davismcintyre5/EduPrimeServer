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

const seedLanding = async () => {
  const defaults = [
    { key: 'landing_hero_title', value: 'Manage Your School with Ease', description: 'Landing page hero title' },
    { key: 'landing_hero_subtitle', value: 'The all-in-one school management system for modern institutions.', description: 'Landing page hero subtitle' },
    { key: 'landing_hero_cta_text', value: 'Get Started Free', description: 'Landing CTA button text' },
    { key: 'landing_hero_cta_link', value: '/register', description: 'Landing CTA button link' },
    { key: 'landing_hero_image', value: '', description: 'Landing hero background image URL' },
    { key: 'landing_stats_schools', value: 500, description: 'Landing stats: schools served' },
    { key: 'landing_stats_students', value: 100000, description: 'Landing stats: students managed' },
    { key: 'landing_stats_staff', value: 15000, description: 'Landing stats: staff managed' },
    {
      key: 'landing_features',
      value: JSON.stringify([
        { id: 'f1', icon: '👩‍🎓', title: 'Student Management', description: 'Complete student records, admissions, parent portal, and academic tracking.', order: 1, isActive: true },
        { id: 'f2', icon: '📊', title: 'Exams & Results', description: 'CBC-aligned grading, marks entry, report cards with class rankings.', order: 2, isActive: true },
        { id: 'f3', icon: '💰', title: 'Finance & Fees', description: 'Fee structures, invoicing, payments, expenses, budgets, and reports.', order: 3, isActive: true },
        { id: 'f4', icon: '📅', title: 'Attendance Tracking', description: 'Daily attendance marking, reports, and individual student history.', order: 4, isActive: true },
        { id: 'f5', icon: '📚', title: 'Library Management', description: 'Book catalog, issue/return tracking, and automated fine calculation.', order: 5, isActive: true },
        { id: 'f6', icon: '👥', title: 'Staff & HR', description: 'Staff records, payroll generation, salary structures, and leave management.', order: 6, isActive: true },
      ]),
      description: 'Landing page features list (JSON)'
    },
    {
      key: 'landing_downloads',
      value: JSON.stringify([
        { id: 'd1', platform: 'win', name: 'Windows Desktop App', version: '1.0.0', url: '#', size: '150 MB', isActive: true, requirements: 'Windows 10 or later' },
        { id: 'd2', platform: 'mac', name: 'macOS Desktop App', version: '1.0.0', url: '#', size: '160 MB', isActive: false, requirements: 'macOS 12 or later' },
        { id: 'd3', platform: 'linux', name: 'Linux AppImage', version: '1.0.0', url: '#', size: '155 MB', isActive: false, requirements: 'Ubuntu 20.04+' },
      ]),
      description: 'Landing page downloads list (JSON)'
    },
    {
      key: 'landing_testimonials',
      value: JSON.stringify([
        { id: 't1', name: 'Jane Muthoni', school: 'Sunrise Academy', quote: 'EduPrime transformed how we manage our school. Attendance, fees, and exams are now effortless!', image: '' },
        { id: 't2', name: 'Peter Okello', school: 'Hilltop Secondary', quote: 'The parent portal is a game changer. Parents love seeing results and fee balances instantly.', image: '' },
        { id: 't3', name: 'Grace Wanjiku', school: 'Mountain View Primary', quote: 'Best decision we made. Their support team is incredibly responsive and helpful.', image: '' },
      ]),
      description: 'Landing page testimonials list (JSON)'
    },
  ];

  for (const setting of defaults) {
    const exists = await Setting.findOne({ key: setting.key });
    if (!exists) {
      await Setting.create(setting);
      console.log(`  ✅ Setting "${setting.key}" seeded.`);
    }
  }
};

const seedAll = async () => {
  console.log('\n🌱 Seeding all...\n');
  await seedSuperAdmin();
  await seedSettings();
  await seedLegals();
  await seedLanding();
  console.log('\n✅ All seeded.\n');
};

const showMenu = async () => {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║      🌱 EduPrime Seed CLI        ║');
  console.log('╚══════════════════════════════════╝\n');
  console.log('  1. Seed All');
  console.log('  2. Seed Settings');
  console.log('  3. Seed Legals');
  console.log('  4. Seed Landing Page');
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
    case '4':
      console.log('\n🛬 Seeding landing page...\n');
      await seedLanding();
      console.log('\n✅ Landing page seeded.\n');
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