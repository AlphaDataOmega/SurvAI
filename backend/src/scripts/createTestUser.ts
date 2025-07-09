/**
 * Script to create a test admin user for testing authentication
 */

import { PrismaClient } from '@prisma/client';
import { authService } from '../services/authService';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    const name = 'Test Admin';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User ${email} already exists`);
      return;
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log(`Test admin user created successfully:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();