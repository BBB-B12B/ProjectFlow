import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadFileToR2(buffer, file.name, file.type, folder);

        return NextResponse.json({ url: result, key: result }); // Adjust return based on your needs
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
