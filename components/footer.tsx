import Link from "next/link"
import { Instagram, Facebook, Mail, Lock } from "lucide-react"
import { Logo } from "./logo"

const categories = [
  { name: "Locales", slug: "locales" },
  { name: "Provinciales", slug: "provinciales" },
  { name: "Policiales", slug: "policiales" },
  { name: "Deportes", slug: "deportes" },
  { name: "Política", slug: "politica" },
  { name: "Economía", slug: "economia" },
  { name: "Espectáculos", slug: "cultura-y-espectaculos" },
  { name: "Agroindustria", slug: "agroindustria" },
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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo and slogan */}
          <div className="md:col-span-1">
            <img 
              src="/images/logo2.jpg" 
              alt="Rafaela Hoy" 
              width={140}
              height={50}
              className="object-contain mb-3"
            />
            <p className="text-lg font-light text-white/90 italic">
              &quot;Donde la noticia ocurre&quot;
            </p>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              El portal de noticias líder de Rafaela y la región. Información actualizada las 24 horas sobre lo que pasa en tu ciudad.
            </p>
          </div>

          {/* Contact and Social */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-base">Contacto</h3>
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

            <h3 className="font-semibold text-white mt-6 mb-4 text-base">Redes Sociales</h3>
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
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} Rafaela Hoy. Todos los derechos reservados.</p>
            {/* Admin access - discreet lock icon */}
            <Link 
              href="/admin/login" 
              className="inline-flex items-center justify-center w-5 h-5 text-white/20 hover:text-white/40 transition-colors"
              title="Acceso Administrador"
            >
              <Lock className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
