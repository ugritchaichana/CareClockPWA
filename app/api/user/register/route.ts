import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const profileImgFile = formData.get('profileImg') as File | null;

    let profileImgUrl = '';
    if (profileImgFile) {
      const fileExtension = profileImgFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const { data, error } = await supabase.storage
        .from('profile-images') // Make sure this bucket exists in your Supabase project
        .upload(fileName, profileImgFile);

      if (error) {
        console.error('Supabase Storage Error:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to upload image.' }, { status: 500 });
      }
      
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(fileName);
      profileImgUrl = publicUrl;
    }

    const phoneNumber = formData.get('phoneNumber') as string;
    if (!phoneNumber) {
      return NextResponse.json({ status: 'error', message: 'Phone number is required' }, { status: 400 });
    }

    const newUser = await prisma.patient.create({
      data: {
        phoneNumber,
        prefix: formData.get('prefix') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        age: Number(formData.get('age') as string),
        medicalRight: formData.get('medicalRight') as string,
        chronicDiseases: formData.get('chronicDiseases') as string,
        drugAllergy: formData.get('drugAllergy') as string,
        profileImageUrl: profileImgUrl,
      },
    });

    return NextResponse.json({ status: 'success', data: newUser });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ status: 'error', message: 'An error occurred during registration.' }, { status: 500 });
  }
}
