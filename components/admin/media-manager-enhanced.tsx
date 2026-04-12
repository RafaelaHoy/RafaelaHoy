"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon, Video, Trash2, Plus } from "lucide-react"

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
    if (!articleId) {
      alert('Primero guarda el artículo para poder subir imágenes')
      return
    }

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

        if (uploadError) {
          console.error('Error subiendo archivo:', uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        // Insert into database
        const { data: mediaData, error: insertError } = await supabase
          .from('article_media')
          .insert({
            article_id: articleId,
            type: fileType,
            url: publicUrl,
            alt_text: file.name,
            sort_order: mediaItems.length + newMedia.length
          })
          .select()
          .single()

        if (!insertError && mediaData) {
          newMedia.push(mediaData)
        }
      }

      // Update media items
      onMediaChange([...mediaItems, ...newMedia])

    } catch (error) {
      console.error('Error en la subida:', error)
      alert('Error al subir los archivos')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este medio?')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Delete from database
      const { error } = await supabase
        .from('article_media')
        .delete()
        .eq('id', mediaId)

      if (!error) {
        // Update local state
        onMediaChange(mediaItems.filter(item => item.id !== mediaId))
      }
    } catch (error) {
      console.error('Error eliminando medio:', error)
      alert('Error al eliminar el medio')
    }
  }

  if (!articleId) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            El gestor de medios estará disponible después de crear el artículo
          </p>
          <p className="text-sm text-muted-foreground">
            Primero guarda el artículo, luego podrás subir imágenes desde la edición
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <Input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <Label 
          htmlFor="file-upload" 
          className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
        </Label>
      </div>

      {/* Media List */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Archivos subidos</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {mediaItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.alt_text || ''}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.alt_text || item.caption || 'Sin título'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === 'image' ? 'Imagen' : 'Video'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMedia(item.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
