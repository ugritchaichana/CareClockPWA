import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'careclock';

console.log('🔗 MongoDB URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
console.log('🗄️ Database name:', dbName);

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  console.log('🔌 Attempting to connect to MongoDB...');
  
  if (cachedClient && cachedDb) {
    console.log('✅ Using cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const db = client.db(dbName);
    console.log('🗄️ Database selected:', dbName);
    
    // Test the connection
    await db.admin().ping();
    console.log('🏓 MongoDB ping successful');
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('🔌 MongoDB connection closed');
  }
}
