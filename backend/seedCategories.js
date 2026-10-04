const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const ServiceCategory = require('./models/ServiceCategory'); // Adjust path if needed

const categoriesToSeed = [
  { name: 'Plumbing', description: 'Expert plumbing solutions for your home', image: '🔧' },
  { name: 'Electrical Services', description: 'Safe and reliable electrical repairs and installations', image: '🔌' },
  { name: 'Home Cleaning', description: 'Professional deep cleaning services', image: '🧹' },
  { name: 'Carpentry', description: 'Custom furniture and woodwork repairs', image: '🪚' },
  { name: 'Appliance Repair', description: 'Repair services for household appliances', image: '📺' },
  { name: 'Painting', description: 'Interior and exterior home painting', image: '🎨' },
  { name: 'Pest Control', description: 'Effective pest management and eradication', image: '🐛' },
  { name: 'AC and Refrigerator Repair', description: 'Cooling appliance maintenance and repair', image: '❄️' },
  { name: 'Gardening', description: 'Lawn care and landscaping services', image: '🌱' },
  { name: 'Home Shifting', description: 'Hassle-free packing and moving services', image: '🚚' },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    for (const cat of categoriesToSeed) {
      const exists = await ServiceCategory.findOne({ name: cat.name });
      if (!exists) {
        await ServiceCategory.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }
    
    console.log('Finished seeding categories.');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    process.exit(0);
  }
}

seedCategories();
