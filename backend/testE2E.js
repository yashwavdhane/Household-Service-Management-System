const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const ProviderProfile = require('./models/ProviderProfile');
const ServiceCategory = require('./models/ServiceCategory');
const Booking = require('./models/Booking');

async function testE2E() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hsms_db');
  
  // 1. Admin creates category
  let cat = await ServiceCategory.findOne({ name: 'Plumbing' });
  if (!cat) cat = await ServiceCategory.create({ name: 'Plumbing' });

  // 2. Provider signs up
  let pUser = await User.findOne({ email: 'prov1@test.com' });
  if (!pUser) pUser = await User.create({ name: 'Prov 1', email: 'prov1@test.com', password: 'password', role: 'provider' });

  // 3. Provider accesses profile (auto-create)
  let pProfile = await ProviderProfile.findOne({ userId: pUser._id });
  if (!pProfile) pProfile = await ProviderProfile.create({ userId: pUser._id });

  // 4. Provider updates categories
  pProfile = await ProviderProfile.findOneAndUpdate(
    { userId: pUser._id },
    { $set: { serviceCategories: [cat._id] } },
    { new: true }
  );

  // 5. Customer signs up
  let cUser = await User.findOne({ email: 'cust1@test.com' });
  if (!cUser) cUser = await User.create({ name: 'Cust 1', email: 'cust1@test.com', password: 'password', role: 'customer' });

  // 6. Customer searches for provider by category
  const providers = await ProviderProfile.find({ serviceCategories: cat._id });
  console.log('Found providers:', providers.length);
  
  if (providers.length === 0) {
    console.log('FAILED TO FIND PROVIDER');
    process.exit(1);
  }

  // 7. Customer books provider
  try {
    const booking = await Booking.create({
      customerId: cUser._id,
      providerId: pUser._id,
      serviceCategoryId: cat._id,
      bookingDate: '2026-10-10',
      bookingTime: '10:00',
      address: 'Test Address'
    });
    console.log('Booking successful:', booking._id);
  } catch (err) {
    console.error('Booking failed:', err.message);
  }
  process.exit(0);
}

testE2E().catch(console.error);
