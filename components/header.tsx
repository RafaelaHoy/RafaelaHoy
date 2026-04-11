"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, Search, ChevronDown, Instagram, Facebook } from "lucide-react"
import { Logo } from "./logo"
import { WeatherWidget } from "./weather-widget"
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
  { name: "Regionales", slug: "regionales" },
  { name: "Provinciales", slug: "provinciales" },
  { name: "Policiales", slug: "policiales" },
  { name: "Deportes", slug: "deportes" },
]

const masDropdownItems = [
  { name: "Política", slug: "politica" },
  { name: "Economía", slug: "economia" },
  { name: "Educación", slug: "educacion" },
  { name: "Judiciales", slug: "judiciales" },
  { name: "Cultura y Espectáculos", slug: "cultura-y-espectaculos" },
  { name: "Salud", slug: "salud" },
  { name: "Agroindustria", slug: "agroindustria" },
  { name: "Interés general", slug: "interes-general" },
  { name: "Tecnología", slug: "tecnologia" },
  { name: "Virales", slug: "virales" },
  { name: "Internacionales", slug: "internacionales" },
]

const serviciosDropdownItems = [
  { name: "Farmacias de Turno", slug: "farmacias" },
  { name: "Necrológicas", slug: "necrologicas" },
  { name: "Clima", slug: "clima" },
]


export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar with services */}
      <div className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-10 md:h-10 text-sm">
            {/* Left spacer */}
            <div className="flex-1"></div>
            
            {/* Center section with weather - only on desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Weather Widget */}
              <div className="flex items-center">
                <WeatherWidget />
              </div>
              
              {/* Date */}
              <div className="flex items-center">
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
            
            {/* Right section - Weather on mobile, Social on desktop */}
            <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
              {/* Weather and Date on mobile */}
              <div className="md:hidden flex items-center gap-2">
                <WeatherWidget />
                <span className="text-white/60 text-xs">
                  {new Date().toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              
              {/* Social media on desktop */}
              <div className="hidden md:flex items-center gap-4">
                <a
                  href="#"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E21F1D] hover:bg-red-700 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E21F1D] hover:bg-red-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-secondary border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-start -mt-9 -ml-4">
              <Logo size="md" />
            </div>

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
              {/* Search Input */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Buscar</span>
                </Button>
                
                {isSearchOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
                            setIsSearchOpen(false)
                            setSearchQuery("")
                          }
                        }}
                        placeholder="Buscar noticias..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        autoFocus
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (searchQuery.trim()) {
                              router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
                              setIsSearchOpen(false)
                              setSearchQuery("")
                            }
                          }}
                          disabled={!searchQuery.trim()}
                        >
                          Buscar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
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
            
            {/* Más Section */}
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
            
            {/* Services Section */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">Servicios</p>
              <div className="grid grid-cols-1 gap-2">
                {serviciosDropdownItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/servicios/${item.slug}`}
                    className="px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
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
