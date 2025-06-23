import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const type = searchParams.get('type');
    
    const { db } = await connectToDatabase();
    
    if (type === 'patient-data' && phoneNumber) {
      // Get specific patient data by phone number
      const collection = db.collection('patients');
      const patient = await collection.findOne({ phoneNumber });
      
      if (patient) {
        return NextResponse.json({
          message: 'Patient data found',
          data: patient,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }
    }
    
    // Test connection (default behavior)
    const collection = db.collection('test');
    const result = await collection.findOne({});
    
    return NextResponse.json({ 
      message: 'MongoDB connection successful',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API POST endpoint called')
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    const { db } = await connectToDatabase();
    console.log('✅ Database connected successfully')
    
    const collection = db.collection('patients');
    
    if (body.type === 'patient-data') {
      console.log('👤 Processing patient data...')
      const { action, phoneNumber, data } = body;
      
      console.log('📋 Action:', action)
      console.log('📞 Phone number:', phoneNumber)
      console.log('🏥 Patient data:', JSON.stringify(data, null, 2))
      
      if (action === 'update') {
        console.log('🔄 Updating existing patient...')
        // Update existing patient data
        const result = await collection.updateOne(
          { phoneNumber },
          { 
            $set: {
              ...data,
              updatedAt: new Date()
            }
          },
          { upsert: true } // Create if doesn't exist
        );
        
        console.log('✅ Update result:', result)
        
        return NextResponse.json({
          message: result.matchedCount > 0 ? 'Patient data updated successfully' : 'Patient data created successfully',
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('➕ Creating new patient...')
        // Create new patient data
        const existingPatient = await collection.findOne({ phoneNumber });
        console.log('🔍 Existing patient check:', existingPatient ? 'Found' : 'Not found')
        
        if (existingPatient) {
          console.log('⚠️ Patient already exists')
          return NextResponse.json(
            { error: 'Patient with this phone number already exists' },
            { status: 409 }
          );
        }
        
        const result = await collection.insertOne({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('✅ Insert result:', result)
        
        return NextResponse.json({
          message: 'Patient data saved successfully',
          id: result.insertedId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Generic data saving (backward compatibility)
    console.log('📝 Saving to caredata collection...')
    const collection2 = db.collection('caredata');
    const result = await collection2.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Generic insert result:', result)
    
    return NextResponse.json({
      message: 'Data saved successfully',
      id: result.insertedId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ API DELETE endpoint called')
  
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const type = searchParams.get('type');
    
    if (type === 'patient-data' && phoneNumber) {
      console.log('📞 Deleting patient with phone:', phoneNumber)
      
      const { db } = await connectToDatabase();
      console.log('✅ Database connected successfully')
      
      const collection = db.collection('patients');
      
      const result = await collection.deleteOne({ phoneNumber });
      console.log('🗑️ Delete result:', result)
      
      if (result.deletedCount > 0) {
        return NextResponse.json({
          message: 'Patient data deleted successfully',
          deletedCount: result.deletedCount,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ API Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
