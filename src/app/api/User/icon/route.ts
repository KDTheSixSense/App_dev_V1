import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(req: NextRequest) {
  const session = await getAppSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('icon') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}-${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'icons', filename);

    console.log(`Attempting to write file to: ${filePath}`);
    await writeFile(filePath, buffer);
    console.log(`File written successfully: ${filePath}`);

    console.log(`Attempting to update user ${session.user.id} with icon path: /uploads/icons/${filename}`);
    const user = await prisma.user.update({
      where: { id: parseInt(session.user.id, 10) },
      data: { icon: `/uploads/icons/${filename}` },
    });
    console.log(`User updated successfully: ${user.id}`);

    return NextResponse.json({ message: 'Icon uploaded successfully', iconPath: user.icon });
  } catch (error) {
    console.error('Error uploading icon:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to upload icon', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Failed to upload icon', details: 'Unknown error' }, { status: 500 });
    }
  }
}
