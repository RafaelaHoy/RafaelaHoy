"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PharmaciesOnDuty } from "@/components/pharmacies-on-duty"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Heart, MapPin, Stethoscope } from "lucide-react"
import Link from "next/link"

export default function ServiciosPage() {
  const services = [
    {
      title: "Farmacias de Turno",
      description: "Consultá las farmacias de guardia hoy",
      icon: <MapPin className="h-8 w-8" />,
      href: "/servicios/farmacias",
      color: "text-blue-600"
    },
    {
      title: "Clima",
      description: "Pronóstico del tiempo para Rafaela",
      icon: <Cloud className="h-8 w-8" />,
      href: "/servicios/clima",
      color: "text-sky-600"
    },
    {
      title: "Necrológicas",
      description: "Avisos fúnebres de la región",
      icon: <Heart className="h-8 w-8" />,
      href: "/servicios/necrologicas",
      color: "text-red-600"
    }
  ]

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Stethoscope className="h-10 w-10 text-blue-600" />
              Servicios
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Accedé a todos los servicios y herramientas que ofrecemos para la comunidad de Rafaela
            </p>
          </div>

          {/* Farmacias de Turno Widget */}
          <div className="mb-12">
            <PharmaciesOnDuty />
          </div>

          {/* Other Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link key={service.title} href={service.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="text-center">
                    <div className={`mx-auto mb-4 ${service.color} group-hover:scale-110 transition-transform`}>
                      {service.icon}
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
