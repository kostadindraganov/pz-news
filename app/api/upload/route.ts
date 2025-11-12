import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { r2Client } from '@/lib/storage/r2-client'
import { supabaseAdmin } from '@/lib/supabase/client'
import sharp from 'sharp'
import { PutObjectCommand } from '@aws-sdk/client-s3'

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image with Sharp
    const processedImage = await sharp(buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomString}.webp`
    const fileKey = `uploads/${fileName}`

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileKey,
        Body: processedImage,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )

    // Construct public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`

    // Get image metadata
    const metadata = await sharp(processedImage).metadata()

    // Save to database
    const { data: mediaRecord, error: dbError } = await supabaseAdmin
      .from('media')
      // @ts-ignore - Supabase types need regeneration
      .insert({
        file_name: fileName,
        file_path: fileKey,
        file_size: processedImage.length,
        mime_type: 'image/webp',
        public_url: publicUrl,
        width: metadata.width,
        height: metadata.height,
        uploaded_by: session.user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save media record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      media: mediaRecord,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Optional: Handle multiple file uploads
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process each file
    const uploadedMedia = []
    const errors = []

    for (const file of files) {
      try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push({ file: file.name, error: 'Invalid file type' })
          continue
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({ file: file.name, error: 'File too large' })
          continue
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Process image with Sharp
        const processedImage = await sharp(buffer)
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer()

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileName = `${timestamp}-${randomString}.webp`
        const fileKey = `uploads/${fileName}`

        // Upload to R2
        await r2Client.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: fileKey,
            Body: processedImage,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        )

        // Construct public URL
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`

        // Get image metadata
        const metadata = await sharp(processedImage).metadata()

        // Save to database
        const { data: mediaRecord } = await supabaseAdmin
          .from('media')
          // @ts-ignore - Supabase types need regeneration
          .insert({
            file_name: fileName,
            file_path: fileKey,
            file_size: processedImage.length,
            mime_type: 'image/webp',
            public_url: publicUrl,
            width: metadata.width,
            height: metadata.height,
            uploaded_by: session.user.id,
          })
          .select()
          .single()

        uploadedMedia.push(mediaRecord)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        errors.push({ file: file.name, error: 'Upload failed' })
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedMedia.length,
      total: files.length,
      media: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Batch upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
