/**
 * Seed Script — Initial Service Categories
 * Run once: node utils/seedCategories.js
 * Safe to re-run — uses upsert so it won't create duplicates.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const ServiceCategory = require("../models/ServiceCategory");

const CATEGORIES = [
  {
    name: "Plumbing",
    description: "Pipe fitting, leak repairs, tap installation, bathroom fitting, and all water-related household plumbing needs.",
    image: "💧",
  },
  {
    name: "Electrical Services",
    description: "Wiring, switch/socket installation, circuit breaker repairs, fan and light fitting, and electrical safety checks.",
    image: "⚡",
  },
  {
    name: "Carpentry",
    description: "Furniture assembly, wood repairs, door/window fitting, shelving installation, and custom woodwork.",
    image: "🪵",
  },
  {
    name: "House Cleaning",
    description: "Full home deep cleaning, kitchen and bathroom scrubbing, floor mopping, and move-in/move-out cleaning.",
    image: "🧹",
  },
  {
    name: "Painting",
    description: "Interior and exterior wall painting, texture work, waterproofing, and surface preparation.",
    image: "🎨",
  },
  {
    name: "AC Repair and Service",
    description: "AC installation, gas refilling, filter cleaning, compressor repair, and annual maintenance contracts.",
    image: "❄️",
  },
  {
    name: "Appliance Repair",
    description: "Washing machine, refrigerator, microwave, dishwasher, and other home appliance diagnostics and repair.",
    image: "🔧",
  },
  {
    name: "Pest Control",
    description: "Cockroach, termite, mosquito, rat, and bed bug treatment using safe, certified pesticides.",
    image: "🐜",
  },
  {
    name: "Home Cleaning",
    description: "Sofa cleaning, carpet shampooing, curtain washing, mattress cleaning, and post-renovation cleanup.",
    image: "🏠",
  },
  {
    name: "Gardening",
    description: "Lawn mowing, plant trimming, garden design, pot arrangement, soil treatment, and seasonal planting.",
    image: "🌿",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    for (const cat of CATEGORIES) {
      await ServiceCategory.findOneAndUpdate(
        { name: cat.name },
        { $set: cat },
        { upsert: true, new: true }
      );
      console.log(`  ✔ ${cat.name}`);
    }

    console.log(`\n🎉 Seeded ${CATEGORIES.length} categories successfully.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
