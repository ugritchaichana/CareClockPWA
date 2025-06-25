// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Try to connect to database with timeout
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✓ Database connection successful!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Database query successful:', result);
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('✓ Disconnected from database');
  }
}

testConnection();
