#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { seedDatabase, seedMinimal, seedFull } from '../utils/seedDatabase';

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    // throw if not provided
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get seeding option from command line arguments
    const seedType = process.argv[2] || 'default';

    switch (seedType) {
      case 'minimal':
        console.log('Running minimal seed (platforms + user only)...\n');
        await seedMinimal();
        break;
      case 'full':
        console.log(
          'Running full seed (platforms + user + templates + providers)...\n'
        );
        await seedFull();
        break;
      default:
        console.log('Running default seed (platforms + user + templates)...\n');
        await seedDatabase();
        break;
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

main();
