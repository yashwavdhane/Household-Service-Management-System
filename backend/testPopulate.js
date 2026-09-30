const mongoose = require('mongoose');
require('dotenv').config();
const ProviderProfile = require('./models/ProviderProfile');
const ServiceCategory = require('./models/ServiceCategory');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hsms_db');
  const user = await User.findOne({ role: 'provider' });
  const cat = await ServiceCategory.findOne();
  
  await ProviderProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { serviceCategories: [cat._id.toString()] } },
    { new: true, upsert: true, runValidators: true }
  );

  const populated = await ProviderProfile.findOne({ userId: user._id }).populate('serviceCategories');
  console.log('Populated array:', populated.serviceCategories);
  process.exit();
}
test().catch(console.error);
