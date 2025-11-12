import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize Cloudflare R2 client
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pz-news-images'
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  )
}

/**
 * Generate a unique file key for R2 storage
 */
export function generateR2Key(originalName: string, prefix: string = 'images'): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const ext = originalName.split('.').pop()
  return `${prefix}/${timestamp}-${randomStr}.${ext}`
}
