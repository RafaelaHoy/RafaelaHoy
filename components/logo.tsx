import Link from "next/link"

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
    <img 
      src="/images/logo.jpg" 
      alt="Rafaela Hoy" 
      width={s.width}
      height={s.height}
      className="object-contain"
    />
  )

  if (noLink) {
    return <div className={`flex items-center ${className}`}>{logoImage}</div>
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {logoImage}
    </Link>
  )
}
