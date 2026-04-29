/**
 * Seed script to create default admin user and categories
 * Run: node server/utils/seed.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AasaiPet';

const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: { type: String, default: 'user' }, isBlocked: { type: Boolean, default: false } }, { timestamps: true });
const CategorySchema = new mongoose.Schema({ name: String, slug: String, description: String, image: String, isActive: { type: Boolean, default: true } }, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);

const categories = [
  { name: 'Live Fish', slug: 'fish', description: 'Freshwater and saltwater fish' },
  { name: 'Fish Food', slug: 'food', description: 'Premium fish food and nutrition' },
  { name: 'Motors & Pumps', slug: 'motors', description: 'Aquarium pumps and filters' },
  { name: 'Accessories', slug: 'accessories', description: 'Decorations, gravel, plants and more' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin
    const adminExists = await User.findOne({ email: 'admin@AasaiPet.com' });
    if (!adminExists) {
      const hashedPwd = await bcrypt.hash('Admin@123', 12);
      await User.create({ name: 'Admin', email: 'admin@AasaiPet.com', password: hashedPwd, role: 'admin' });
      console.log('✅ Admin user created: admin@AasaiPet.com / Admin@123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create categories
    let created = 0;
    for (const cat of categories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) { await Category.create(cat); created++; }
    }
    console.log(`✅ ${created} categories created`);

    await mongoose.disconnect();
    console.log('\n🎉 Seed complete!');
    console.log('   Admin login: admin@AasaiPet.com / Admin@123');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
