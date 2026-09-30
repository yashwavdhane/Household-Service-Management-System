const mongoose = require('mongoose');
require('dotenv').config();
const ProviderProfile = require('./models/ProviderProfile');
const ServiceCategory = require('./models/ServiceCategory');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hsms_db');
  const cat = await ServiceCategory.findOne();
  
  // Create a profile using Mongoose findOneAndUpdate explicitly simulating the frontend string
  const user = await User.findOne({ role: 'provider' });
  await ProviderProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { serviceCategories: [cat._id.toString()] } },
    { new: true, upsert: true, runValidators: true }
  );

  // Now use Mongoose find
  const profiles = await ProviderProfile.find({ serviceCategories: cat._id.toString() });
  console.log('Mongoose found with string query:', profiles.length);
  
  const rawProfiles = await mongoose.connection.collection('providerprofiles').find({ serviceCategories: cat._id }).toArray();
  console.log('Raw DB found with ObjectId query:', rawProfiles.length);
  
  const rawProfiles2 = await mongoose.connection.collection('providerprofiles').find({ serviceCategories: cat._id.toString() }).toArray();
  console.log('Raw DB found with String query:', rawProfiles2.length);

  process.exit();
}
test().catch(console.error);
