import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = formData.get('phoneNumber') as string;

    if (!phoneNumber) {
      return NextResponse.json({ status: 'error', message: 'Phone number is required' }, { status: 400 });
    }

    const updateData: { [key: string]: any } = {};

    // Iterate over form fields and add them to updateData
    formData.forEach((value, key) => {
      if (key !== 'phoneNumber' && key !== 'profileImg') {
        if (key === 'age') {
          updateData[key] = Number(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    const profileImgFile = formData.get('profileImg') as File | null;
    if (profileImgFile) {
      const fileExtension = profileImgFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, profileImgFile);

      if (error) {
        console.error('Supabase Storage Error:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to upload image.' }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(fileName);
      updateData.profileImageUrl = publicUrl;
    }

    const updatedUser = await prisma.patient.update({
      where: { phoneNumber },
      data: updateData,
    });

    return NextResponse.json({ status: 'success', data: updatedUser });
  } catch (error) {
    console.error('Update Error:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { status: 'error', message: `Patient not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: 'error', message: 'An error occurred during update.' }, { status: 500 });
  }
}
