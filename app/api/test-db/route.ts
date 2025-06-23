import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    const { db } = await connectToDatabase();
    
    // Test connection by getting database stats
    const admin = db.admin();
    const result = await admin.ping();
    
    // Get collection names to verify connection
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({ 
      success: true,
      message: 'MongoDB Atlas connection successful',
      ping: result,
      collections: collections.map(col => col.name),
      database: db.databaseName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to connect to MongoDB Atlas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Create a test collection
    const collection = db.collection('caredata');
    const result = await collection.insertOne({
      ...body,
      source: 'PWA',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Data saved to MongoDB Atlas successfully',
      id: result.insertedId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save data to MongoDB Atlas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
