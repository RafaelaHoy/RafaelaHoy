import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  noLink?: boolean
}

export function Logo({ className = "", size = "md", noLink = false }: LogoProps) {
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  }

  const s = sizes[size]

  const logoImage = (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: s.width, height: s.height }}>
      <Image
        src="/images/logo.png" 
        alt="Rafaela Hoy" 
        width={s.width}
        height={s.height}
        className="object-contain transition-opacity duration-300"
        style={{
          backgroundColor: 'transparent',
          borderRadius: '0'
        }}
        priority
        unoptimized={false}
        onError={(e: any) => {
          console.error('Error loading logo:', e)
          const target = e.target as HTMLImageElement
          // Ocultar imagen rota pero mantener el espacio
          target.style.opacity = '0'
          target.style.visibility = 'hidden'
        }}
        onLoad={(e: any) => {
          console.log('Logo loaded successfully')
          const target = e.target as HTMLImageElement
          // Asegurar que sea visible al cargar
          target.style.opacity = '1'
          target.style.visibility = 'visible'
        }}
      />
    </div>
  )

  if (noLink) {
    return logoImage
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {logoImage}
    </Link>
  )
}
