import { supabaseAdmin } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Trash2, Copy } from 'lucide-react'
import Image from 'next/image'

export default async function MediaPage() {
  // Get all media
  const { data: media } = await supabaseAdmin
    .from('media')
    .select('*, uploader:users(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage your images and files</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload images</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: JPG, PNG, WebP (Max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Media ({media?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {media && media.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {media.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-lg border">
                  <div className="relative aspect-square">
                    <Image
                      src={item.public_url || '/placeholder.jpg'}
                      alt={item.alt_text || item.file_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2 bg-background">
                    <p className="text-xs font-medium truncate">{item.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No media uploaded yet</p>
              <Button className="mt-4" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload your first image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
