import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Delegate from './models/delegate.js';
import Volunteer from './models/Volunteer.js';
import Oc from './models/Oc.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await Promise.all([Delegate.deleteMany({}), Volunteer.deleteMany({}), Oc.deleteMany({})]);
    const password = process.env.SEED_ADMIN_PASSWORD;
    const email = process.env.SEED_ADMIN_EMAIL;
    if (!password || !email) throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the admin account');
    await Admin.findOneAndUpdate(
      { email },
      { name: 'ParivartanSoc', email, passwordHash: await bcrypt.hash(password, 12), role: 'Super Admin' },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    console.log('Database cleared. Admin account is ready.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();