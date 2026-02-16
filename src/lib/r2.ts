import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // Optional: Custom domain or R2.dev URL

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.warn('R2 environment variables are missing. File uploads may fail.');
}

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
});

export async function uploadFileToR2(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
) {
    const key = `${folder}/${Date.now()}-${fileName}`;

    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            // ACL: 'public-read', // R2 doesn't support ACLs the same way S3 does usually, usually set via bucket policy or public access
        });

        await r2Client.send(command);

        // Return the public URL
        // If R2_PUBLIC_URL is set (e.g., custom domain), use it.
        // Otherwise, you might need to construct it or use a worker.
        // Default R2 dev URL format: https://pub-<hash>.r2.dev/<key>
        if (R2_PUBLIC_URL) {
            return `${R2_PUBLIC_URL}/${key}`;
        }

        // Fallback: If no public URL is configured, we can't really guess the public endpoint easily without it.
        // Returning the key might be enough if we use a proxy route to fetch it.
        return key;
    } catch (error) {
        console.error('Error uploading to R2:', error);
        throw error;
    }
}

export async function deleteFileFromR2(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });
        await r2Client.send(command);
    } catch (error) {
        console.error('Error deleting from R2:', error);
        throw error;
    }
}
