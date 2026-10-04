const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const User = require('./models/User'); // Adjust path if needed

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const email = 'admin@hsms.com';
    const password = 'adminpassword123';
    
    let admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      console.log('Admin already exists. Updating password...');
      admin.password = password;
      await admin.save();
      console.log(`Admin updated. Email: ${email}, Password: ${password}`);
    } else {
      console.log('Creating new admin...');
      admin = await User.create({
        name: 'System Admin',
        email: email,
        password: password,
        role: 'admin',
        phone: '1234567890'
      });
      console.log(`Admin created. Email: ${email}, Password: ${password}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

setupAdmin();
