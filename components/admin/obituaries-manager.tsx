'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { fetchObituaries, createObituary, updateObituary, deleteObituary, type Obituary } from '@/lib/api'
import { Plus, Edit, Trash2, Calendar, User } from 'lucide-react'

export function ObituariesManager() {
  const [obituaries, setObituaries] = useState<Obituary[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingObituary, setEditingObituary] = useState<Obituary | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    service_info: ''
  })

  useEffect(() => {
    loadObituaries()
  }, [])

  const loadObituaries = async () => {
    try {
      setLoading(true)
      const data = await fetchObituaries()
      setObituaries(data)
    } catch (error) {
      console.error('Error loading obituaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingObituary) {
        await updateObituary(editingObituary.id, {
          full_name: formData.full_name,
          age: parseInt(formData.age),
          service_info: formData.service_info
        })
      } else {
        await createObituary({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          service_info: formData.service_info,
          date: new Date().toISOString()
        })
      }
      
      resetForm()
      setIsDialogOpen(false)
      loadObituaries()
    } catch (error) {
      console.error('Error saving obituary:', error)
    }
  }

  const handleEdit = (obituary: Obituary) => {
    setEditingObituary(obituary)
    setFormData({
      full_name: obituary.full_name,
      age: obituary.age.toString(),
      service_info: obituary.service_info
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta necrológica?')) {
      try {
        await deleteObituary(id)
        loadObituaries()
      } catch (error) {
        console.error('Error deleting obituary:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      age: '',
      service_info: ''
    })
    setEditingObituary(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Necrológicas</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Necrológicas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Necrológica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingObituary ? 'Editar Necrológica' : 'Agregar Necrológica'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ej: María Gómez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Ej: 78"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_info">Información del Servicio</Label>
                <Textarea
                  id="service_info"
                  value={formData.service_info}
                  onChange={(e) => setFormData({ ...formData, service_info: e.target.value })}
                  placeholder="Ej: Servicio mañana 10:00 en Iglesia San Rafael"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingObituary ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {obituaries.map((obituary) => (
          <Card key={obituary.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{obituary.full_name}</h3>
                    <Badge variant="secondary">{obituary.age} años</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(obituary.date).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <p className="text-sm">{obituary.service_info}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(obituary)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(obituary.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {obituaries.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay necrológicas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando la primera necrológica usando el botón de arriba.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
