import Link from "next/link"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { pin: { width: 24, height: 32 }, text: "text-xl", subtext: "text-sm", line: "w-3" },
    md: { pin: { width: 36, height: 48 }, text: "text-2xl", subtext: "text-lg", line: "w-5" },
    lg: { pin: { width: 48, height: 64 }, text: "text-4xl", subtext: "text-2xl", line: "w-6" },
  }

  const s = sizes[size]

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      {/* Map Pin Icon */}
      <svg
        width={s.pin.width}
        height={s.pin.height}
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 0C13.4315 0 0 13.4315 0 30C0 52.5 30 80 30 80C30 80 60 52.5 60 30C60 13.4315 46.5685 0 30 0Z"
          className="fill-primary"
        />
        <circle cx="30" cy="28" r="12" fill="white" />
      </svg>
      
      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className={`${s.text} font-bold text-white tracking-tight`}>
          Rafaela
        </span>
        <div className="flex items-center gap-1">
          <div className={`h-0.5 ${s.line} bg-primary`} />
          <span className={`${s.subtext} font-bold text-primary`}>hoy</span>
          <div className={`h-0.5 ${s.line} bg-primary`} />
        </div>
      </div>
    </Link>
  )
}
