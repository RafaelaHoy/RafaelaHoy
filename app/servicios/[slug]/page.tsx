import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Service {
  id: string
  type: string
  content: string
  is_active: boolean
  updated_at: string
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const serviceNames: Record<string, string> = {
    farmacias: "Farmacias de Turno",
    necrologicas: "Necrológicas", 
    municipales: "Servicios Municipales"
  }

  const serviceName = serviceNames[slug] || "Servicio"

  return {
    title: `${serviceName} - Rafaela hoy`,
    description: `Información sobre ${serviceName.toLowerCase()} en Rafaela.`,
  }
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: service, error } = await supabase
    .from("site_services")
    .select("*")
    .eq("type", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching service:", error)
    notFound()
  }

  const serviceNames: Record<string, string> = {
    farmacias: "Farmacias de Turno",
    necrologicas: "Necrológicas",
    municipales: "Servicios Municipales"
  }

  const serviceName = serviceNames[slug] || "Servicio"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {serviceName}
            </h1>
            <div className="h-1 w-20 bg-primary"></div>
          </div>

          {/* Content */}
          {service && service.content ? (
            <div className="prose prose-lg max-w-none">
              {service.content.startsWith('<') ? (
                <div dangerouslySetInnerHTML={{ __html: service.content }} />
              ) : (
                <div className="whitespace-pre-wrap">{service.content}</div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Próximamente
                </h2>
                <p className="text-gray-600 mb-6">
                  Estamos trabajando para traerte la información más actualizada sobre {serviceName.toLowerCase()}.
                </p>
                <p className="text-sm text-gray-500">
                  Por favor, vuelve a visitar esta página en los próximos días.
                </p>
              </div>
            </div>
          )}

          {/* Last Updated */}
          {service && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Última actualización: {new Date(service.updated_at).toLocaleDateString("es-AR", {
                  weekday: "long",
                  year: "numeric", 
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
