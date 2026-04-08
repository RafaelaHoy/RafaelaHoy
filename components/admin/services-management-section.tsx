"use client"

import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Edit, Eye, EyeOff } from "lucide-react"

interface Service {
  id: string
  type: string
  content: string
  is_active: boolean
  updated_at: string
}

const serviceTypes = [
  { value: "farmacias", label: "Farmacias de Turno" },
  { value: "necrologicas", label: "Necrológicas" },
  { value: "municipales", label: "Servicios Municipales" },
]

export function ServicesManagementSection() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>("farmacias")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const supabase = createClient()

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("site_services")
      .select("*")
      .order("type")

    if (error) {
      console.error("Error fetching services:", error)
      return
    }

    setServices(data || [])
  }

  const handleSaveService = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("site_services")
        .upsert({
          type: selectedService,
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("type", selectedService)

      if (error) throw error

      await fetchServices()
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving service:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from("site_services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id)

      if (error) throw error

      await fetchServices()
    } catch (error) {
      console.error("Error toggling service:", error)
    }
  }

  const loadServiceContent = async () => {
    const service = services.find(s => s.type === selectedService)
    if (service) {
      setContent(service.content)
      setIsEditing(true)
    }
  }

  React.useEffect(() => {
    fetchServices()
  }, [])

  React.useEffect(() => {
    const service = services.find(s => s.type === selectedService)
    if (service) {
      setContent(service.content)
      setIsEditing(false)
    } else {
      setContent("")
      setIsEditing(true)
    }
  }, [selectedService, services])

  const currentService = services.find(s => s.type === selectedService)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Gestionar Servicios</span>
          <div className="h-px bg-primary flex-1"></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Selector */}
        <div className="space-y-2">
          <Label htmlFor="service-type">Seleccionar Servicio</Label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un servicio" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Status */}
        {currentService && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {serviceTypes.find(t => t.value === currentService.type)?.label}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                currentService.is_active 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {currentService.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleActive(currentService)}
            >
              {currentService.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="service-content">Contenido del Servicio</Label>
            <div className="flex gap-2">
              {!isEditing && currentService && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadServiceContent}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              <Button
                onClick={handleSaveService}
                disabled={isLoading || !content.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
          <Textarea
            id="service-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingresa el contenido del servicio (puedes usar HTML o texto plano)..."
            className="min-h-[200px]"
          />
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
          <p className="font-medium mb-2">Instrucciones:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Selecciona un servicio del menú desplegable</li>
            <li>Usa el botón "Editar" para cargar contenido existente</li>
            <li>Escribe el contenido (puedes usar etiquetas HTML)</li>
            <li>Guarda los cambios</li>
            <li>Activa/desactiva el servicio con el botón del ojo</li>
          </ul>
        </div>

        {/* Last Updated */}
        {currentService && (
          <div className="text-xs text-muted-foreground">
            Última actualización: {new Date(currentService.updated_at).toLocaleString("es-AR")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
