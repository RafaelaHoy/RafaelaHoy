import Link from "next/link"
import { Twitter, Instagram, Mail } from "lucide-react"
import { Logo } from "./logo"

const categories = [
  { name: "Locales", slug: "locales" },
  { name: "Policiales", slug: "policiales" },
  { name: "Deportes", slug: "deportes" },
  { name: "Política", slug: "politica" },
  { name: "Economía", slug: "economia" },
  { name: "Espectáculos", slug: "espectaculos" },
  { name: "Campo", slug: "campo" },
  { name: "Internacionales", slug: "internacionales" },
]

const services = [
  { name: "Farmacias de Turno", slug: "farmacias" },
  { name: "Clima", slug: "clima" },
  { name: "Cartelera de Cines", slug: "cines" },
  { name: "Horóscopo", slug: "horoscopo" },
  { name: "Obituario", slug: "obituario" },
]

export function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and slogan */}
          <div className="lg:col-span-1">
            <Logo size="md" />
            <p className="mt-3 text-lg font-light text-white/90 italic">
              &quot;Donde la noticia ocurre&quot;
            </p>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              El portal de noticias líder de Rafaela y la región. Información actualizada las 24 horas sobre lo que pasa en tu ciudad.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Secciones</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Servicios</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact and Social */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <a href="mailto:contacto@rafaelahoy.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                  contacto@rafaelahoy.com
                </a>
              </li>
              <li className="pt-2">
                <p className="text-white/50">Rafaela, Santa Fe, Argentina</p>
              </li>
            </ul>

            <h3 className="font-semibold text-white mt-6 mb-4">Redes Sociales</h3>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 bg-primary/20 rounded-full hover:bg-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-primary" />
              </a>
              <a
                href="#"
                className="p-2 bg-primary/20 rounded-full hover:bg-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} Rafaela Hoy. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacidad" className="hover:text-white transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-white transition-colors">
                Términos de Uso
              </Link>
            </div>
          </div>
          {/* Admin access - discreet at bottom corner */}
          <div className="mt-4 text-right">
            <Link 
              href="/admin/login" 
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Acceso Administrador
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
