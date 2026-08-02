require('./dnsSet');
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const readline = require('readline');
const SuperAdmin = require('../models/admin/SuperAdmin');
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

const listAdmins = async () => {
  const admins = await SuperAdmin.find().select('-password');
  if (admins.length === 0) {
    console.log('\n⚠️  No super admins found.\n');
    return;
  }
  console.log('\n📋 Super Admins:\n');
  admins.forEach((admin, i) => {
    console.log(`  ${i + 1}. ${admin.name} (${admin.email}) — ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
  });
  console.log('');
};

const createAdmin = async () => {
  console.log('\n➕ Create Super Admin\n');
  const name = await question('  Name: ');
  const email = await question('  Email: ');
  const password = await question('  Password: ');

  const exists = await SuperAdmin.findOne({ email });
  if (exists) {
    console.log('\n⚠️  Admin with this email already exists.\n');
    return;
  }

  const hashed = await hashPassword(password);
  await SuperAdmin.create({ name, email, password: hashed });
  console.log(`\n✅ Super Admin "${name}" created.\n`);
};

const manageAdmin = async () => {
  console.log('\n🔧 Manage Super Admin\n');
  const email = await question('  Enter admin email: ');
  const admin = await SuperAdmin.findOne({ email });

  if (!admin) {
    console.log('\n⚠️  Admin not found.\n');
    return;
  }

  console.log(`\n  Name: ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Status: ${admin.isActive ? 'Active' : 'Inactive'}\n`);
  console.log('  1. Toggle Active/Inactive');
  console.log('  2. Reset Password');
  console.log('  3. Back');

  const choice = await question('\n  Choose: ');

  if (choice === '1') {
    admin.isActive = !admin.isActive;
    await admin.save();
    console.log(`\n✅ Admin ${admin.isActive ? 'activated' : 'deactivated'}.\n`);
  } else if (choice === '2') {
    const newPass = await question('  New password: ');
    admin.password = await hashPassword(newPass);
    await admin.save();
    console.log('\n✅ Password reset.\n');
  }
};

const deleteAdmin = async () => {
  console.log('\n🗑️  Delete Super Admin\n');
  const email = await question('  Enter admin email: ');
  const admin = await SuperAdmin.findOne({ email });

  if (!admin) {
    console.log('\n⚠️  Admin not found.\n');
    return;
  }

  const confirm = await question(`\n  Delete "${admin.name}"? (yes/no): `);
  if (confirm.toLowerCase() === 'yes') {
    await SuperAdmin.findByIdAndDelete(admin._id);
    console.log('\n✅ Admin deleted.\n');
  } else {
    console.log('\n❌ Cancelled.\n');
  }
};

const listCollections = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📦 Database Collections:\n');
  collections.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col.name}`);
  });
  console.log('');
};

const dropCollection = async () => {
  console.log('\n🗑️  Drop Collection\n');
  const name = await question('  Collection name: ');
  const confirm = await question(`\n  Drop "${name}"? This cannot be undone! (yes/no): `);

  if (confirm.toLowerCase() === 'yes') {
    await mongoose.connection.db.dropCollection(name);
    console.log(`\n✅ Collection "${name}" dropped.\n`);
  } else {
    console.log('\n❌ Cancelled.\n');
  }
};

const dropEntireDB = async () => {
  console.log('\n⚠️  DROP ENTIRE DATABASE\n');
  const confirm = await question('  Type "DELETE ALL" to confirm: ');

  if (confirm === 'DELETE ALL') {
    await mongoose.connection.db.dropDatabase();
    console.log('\n✅ Entire database dropped.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Cancelled.\n');
  }
};

const showMenu = async () => {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║    🛡️  EduPrime Admin CLI        ║');
  console.log('╚══════════════════════════════════╝\n');
  console.log('  1. List Super Admins');
  console.log('  2. Create Super Admin');
  console.log('  3. Manage Super Admin');
  console.log('  4. Delete Super Admin');
  console.log('  5. List DB Collections');
  console.log('  6. Drop DB Collection');
  console.log('  7. Drop Entire Database');
  console.log('  0. Exit\n');

  const choice = await question('  Choose an option: ');

  switch (choice) {
    case '1': await listAdmins(); break;
    case '2': await createAdmin(); break;
    case '3': await manageAdmin(); break;
    case '4': await deleteAdmin(); break;
    case '5': await listCollections(); break;
    case '6': await dropCollection(); break;
    case '7': await dropEntireDB(); break;
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