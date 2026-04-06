"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Search, Cloud, Pill, Film, Star, FileText, ChevronDown } from "lucide-react"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mainNavItems = [
  { name: "Inicio", slug: "", isHome: true },
  { name: "Locales", slug: "locales" },
  { name: "Policiales", slug: "policiales" },
  { name: "Deportes", slug: "deportes" },
  { name: "Política", slug: "politica" },
  { name: "Economía", slug: "economia" },
]

const masDropdownItems = [
  { name: "Economía", slug: "economia" },
  { name: "Nacionales", slug: "nacionales" },
  { name: "Internacionales", slug: "internacionales" },
  { name: "Gremiales", slug: "gremiales" },
  { name: "Educación", slug: "educacion" },
  { name: "Cultura y Espectáculos", slug: "espectaculos" },
  { name: "Judiciales", slug: "judiciales" },
  { name: "Tecnología", slug: "tecnologia" },
  { name: "Salud", slug: "salud" },
  { name: "Agroindustria", slug: "campo" },
]

const serviciosDropdownItems = [
  { name: "Clima", slug: "clima" },
  { name: "Necrológicas", slug: "obituario" },
  { name: "Farmacias de Turno", slug: "farmacias" },
  { name: "Servicios Municipales", slug: "municipales" },
]

const serviceItems = [
  { name: "Farmacias", slug: "farmacias", icon: Pill },
  { name: "Clima", slug: "clima", icon: Cloud },
  { name: "Cines", slug: "cines", icon: Film },
  { name: "Horóscopo", slug: "horoscopo", icon: Star },
  { name: "Obituario", slug: "obituario", icon: FileText },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar with services */}
      <div className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="hidden md:flex items-center gap-4">
              {serviceItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/servicios/${item.slug}`}
                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-white/60 text-xs">
                {new Date().toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-secondary border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.slug}
                  href={item.isHome ? "/" : `/categoria/${item.slug}`}
                  className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Más dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                    Más
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {masDropdownItems.map((item) => (
                    <DropdownMenuItem key={item.slug} asChild>
                      <Link href={`/categoria/${item.slug}`}>
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Servicios dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                    Servicios
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {serviciosDropdownItems.map((item) => (
                    <DropdownMenuItem key={item.slug} asChild>
                      <Link href={`/servicios/${item.slug}`}>
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Search and mobile menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Menú</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-secondary border-b border-white/10">
          <nav className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              {mainNavItems.filter(item => !item.isHome).map((item) => (
                <Link
                  key={item.slug}
                  href={`/categoria/${item.slug}`}
                  className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">Más secciones</p>
              <div className="grid grid-cols-2 gap-2">
                {masDropdownItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/categoria/${item.slug}`}
                    className="px-2 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">Servicios</p>
              <div className="grid grid-cols-3 gap-2">
                {serviceItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/servicios/${item.slug}`}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-3 w-3" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
