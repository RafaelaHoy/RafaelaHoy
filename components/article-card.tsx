import Image from "next/image"
import Link from "next/link"

interface ArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    image_url: string | null
    image_caption: string | null
    published_at: string | null
    categories?: {
      name: string
      slug: string
    } | null
  }
  variant?: "default" | "featured" | "compact" | "horizontal"
}

// Función para formatear fecha a solo día y mes
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Sin fecha'
  
  const date = new Date(dateString)
  
  // Validar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'Fecha inválida'
  }
  
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short'
  })
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const formattedDate = formatDate(article.published_at)

  if (variant === "featured") {
    return (
      <Link href={`/noticia/${article.slug}`} className="group block">
        <article className="rounded-lg overflow-hidden bg-card border border-border">
          {article.image_url ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
              />
              {/* Pie de imagen */}
              {article.image_caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs text-center line-clamp-2">
                    {article.image_caption}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/10] bg-muted" />
          )}
          <div className="p-5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 text-muted-foreground line-clamp-2 max-w-2xl">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              {article.categories && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-sm">
                  {article.categories.name}
                </span>
              )}
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === "compact") {
    return (
      <Link href={`/noticia/${article.slug}`} className="group block">
        <article className="flex gap-3">
          {article.image_url && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                sizes="80px"
              />
              {/* Pie de imagen */}
              {article.image_caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                  <p className="text-white text-xs text-center line-clamp-1">
                    {article.image_caption}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
              {article.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === "horizontal") {
    return (
      <Link href={`/noticia/${article.slug}`} className="group block">
        <article className="flex gap-4">
          {article.image_url && (
            <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="160px"
              />
              {/* Pie de imagen */}
              {article.image_caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                  <p className="text-white text-xs text-center line-clamp-1">
                    {article.image_caption}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0 py-1">
            {article.categories && (
              <span className="text-xs font-medium text-primary">
                {article.categories.name}
              </span>
            )}
            <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
              {article.title}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </article>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/noticia/${article.slug}`} className="group block">
      <article className="h-full">
        {article.image_url && (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Pie de imagen */}
            {article.image_caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <p className="text-white text-xs text-center line-clamp-2">
                  {article.image_caption}
                </p>
              </div>
            )}
          </div>
        )}
        <div>
          {article.categories && (
            <span className="text-xs font-medium text-primary">
              {article.categories.name}
            </span>
          )}
          <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </article>
    </Link>
  )
}
