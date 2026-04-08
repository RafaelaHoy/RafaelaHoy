"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Image, Video, Trash2, Plus } from "lucide-react"

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  alt_text?: string
  caption?: string
  sort_order: number
}

interface MediaManagerProps {
  articleId?: string
  mediaItems: MediaItem[]
  onMediaChange: (media: MediaItem[]) => void
}

export function MediaManager({ articleId, mediaItems, onMediaChange }: MediaManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()

  const handleFileUpload = async (files: FileList) => {
    if (!articleId) return

    setUploading(true)
    const newMedia: MediaItem[] = []

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${articleId}/${Date.now()}.${fileExt}`
        const filePath = `article-media/${fileName}`

        // Determine file type
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        // Save to database
        const { data: mediaData, error: dbError } = await supabase
          .from('article_media')
          .insert({
            article_id: articleId,
            type: fileType,
            url: publicUrl,
            alt_text: file.type.startsWith('image/') ? file.name : undefined,
            sort_order: mediaItems.length + newMedia.length
          })
          .select()
          .single()

        if (dbError) throw dbError

        newMedia.push(mediaData)
      }

      onMediaChange([...mediaItems, ...newMedia])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeMedia = async (mediaId: string) => {
    try {
      // Remove from database
      await supabase
        .from('article_media')
        .delete()
        .eq('id', mediaId)

      // Update local state
      onMediaChange(mediaItems.filter(item => item.id !== mediaId))
    } catch (error) {
      console.error('Error removing media:', error)
    }
  }

  const updateMediaCaption = async (mediaId: string, caption: string) => {
    try {
      await supabase
        .from('article_media')
        .update({ caption })
        .eq('id', mediaId)

      // Update local state
      onMediaChange(mediaItems.map(item => 
        item.id === mediaId ? { ...item, caption } : item
      ))
    } catch (error) {
      console.error('Error updating caption:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Galería de Medios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${!articleId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!articleId) return
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*,video/*'
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files
              if (files) handleFileUpload(files)
            }
            input.click()
          }}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            {articleId ? 'Arrastra archivos aquí o haz clic para seleccionar' : 'Guarda el artículo primero para agregar medios'}
          </p>
          <p className="text-sm text-muted-foreground">
            Se aceptan imágenes (JPG, PNG, GIF) y videos (MP4, WebM)
          </p>
          {uploading && (
            <p className="text-sm text-primary mt-2">Subiendo archivos...</p>
          )}
        </div>

        {/* Media Grid */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.alt_text || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Controls */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeMedia(media.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Caption Input */}
                <div className="mt-2">
                  <Input
                    placeholder="Leyenda (opcional)"
                    value={media.caption || ''}
                    onChange={(e) => updateMediaCaption(media.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {mediaItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay archivos multimedia aún</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
