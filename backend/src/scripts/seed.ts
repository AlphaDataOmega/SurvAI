/**
 * @fileoverview Main database seeding script
 * 
 * Entry point for database seeding operations.
 * Imports and executes all seeding functions.
 */

import { PrismaClient } from '@prisma/client';
import { seedCTAData } from './seedCTAData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Run CTA data seeding
    await seedCTAData();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
main().catch((error) => {
  console.error('❌ Seeding process failed:', error);
  process.exit(1);
});