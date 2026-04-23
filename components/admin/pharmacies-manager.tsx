"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, MapPin, Phone, Building } from "lucide-react"

interface Pharmacy {
  id: string
  name: string
  address: string
  phone?: string
  is_on_duty?: boolean
  created_at: string
  updated_at: string
}

export function PharmaciesManager() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: ""
  })
  const [saving, setSaving] = useState(false)

  // Cargar farmacias
  useEffect(() => {
    loadPharmacies()
  }, [])

  const loadPharmacies = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name')

      if (error) throw error
      setPharmacies(data || [])
    } catch (error) {
      console.error('Error al cargar farmacias:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "" })
    setEditingPharmacy(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy)
    setFormData({
      name: pharmacy.name,
      address: pharmacy.address,
      phone: pharmacy.phone || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta farmacia?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('pharmacies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPharmacies()
    } catch (error) {
      console.error('Error al eliminar farmacia:', error)
      alert('Error al eliminar la farmacia')
    }
  }

  const handleToggleDuty = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('pharmacies')
        .update({ 
          is_on_duty: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      // Actualizar estado local
      setPharmacies(prev => 
        prev.map(pharmacy => 
          pharmacy.id === id 
            ? { ...pharmacy, is_on_duty: !currentStatus }
            : pharmacy
        )
      )
    } catch (error) {
      console.error('Error al actualizar estado de turno:', error)
      alert('Error al actualizar estado de turno')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Por favor completa el nombre y la dirección')
      return
    }

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      if (editingPharmacy) {
        // Actualizar
        const { error } = await supabase
          .from('pharmacies')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPharmacy.id)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('pharmacies')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim() || null
          })

        if (error) throw error
      }

      setIsDialogOpen(false)
      resetForm()
      await loadPharmacies()
    } catch (error) {
      console.error('Error al guardar farmacia:', error)
      alert('Error al guardar la farmacia')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando farmacias...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Farmacias Registradas</h3>
          <Badge variant="secondary">{pharmacies.length}</Badge>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Farmacia
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {pharmacies.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay farmacias registradas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza agregando tu primera farmacia
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Farmacia
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Nombre</TableHead>
                  <TableHead className="w-[35%]">Dirección</TableHead>
                  <TableHead className="w-[15%]">Teléfono</TableHead>
                  <TableHead className="w-[10%]">Turno</TableHead>
                  <TableHead className="text-right w-[10%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{pharmacy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground">{pharmacy.address}</div>
                    </TableCell>
                    <TableCell>
                      {pharmacy.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{pharmacy.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDuty(pharmacy.id, pharmacy.is_on_duty || false)}
                        className={`h-8 px-3 ${
                          pharmacy.is_on_duty 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pharmacy.is_on_duty ? "De turno" : "No está"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pharmacy)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pharmacy.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPharmacy ? 'Editar Farmacia' : 'Nueva Farmacia'}
            </DialogTitle>
            <DialogDescription>
              {editingPharmacy 
                ? 'Edita los datos de la farmacia seleccionada.'
                : 'Agrega una nueva farmacia al sistema.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Farmacia del Sol"
                required
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="address">Dirección <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Belgrano 123, Rafaela, Santa Fe"
                rows={2}
                required
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: (03492) 123456"
                disabled={saving}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingPharmacy ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
