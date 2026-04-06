import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CategoryContent } from "@/components/category-content"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .single()

  if (!category) {
    return { title: "Categoria no encontrada - Rafaela Hoy" }
  }

  return {
    title: `${category.name} - Rafaela Hoy`,
    description: `Ultimas noticias de ${category.name} en Rafaela y la region.`,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CategoryContent category={category} />
      </main>
      <Footer />
    </div>
  )
}
