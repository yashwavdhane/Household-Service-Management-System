const mongoose = require('mongoose');
require('dotenv').config();
const ProviderProfile = require('./models/ProviderProfile');
const ServiceCategory = require('./models/ServiceCategory');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hsms_db');
  console.log('Connected');
  
  const cat = await ServiceCategory.findOne() || await ServiceCategory.create({ name: 'TestCat' });
  const user = await User.findOne({ role: 'provider' });
  if (!user) {
    console.log('No provider found');
    process.exit();
  }
  
  let profile = await ProviderProfile.findOne({ userId: user._id });
  if (!profile) {
     profile = await ProviderProfile.create({ userId: user._id, serviceCategories: [] });
  }
  
  console.log('Before update:', profile.serviceCategories);
  
  const updated = await ProviderProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { serviceCategories: [cat._id.toString()] } },
    { new: true, upsert: true, runValidators: true }
  );
  
  console.log('After update:', updated.serviceCategories);
  process.exit();
}
test().catch(console.error);
