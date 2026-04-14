import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = {
  title: "Panel de Administración - Rafaela hoy",
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch articles for the dashboard
  const { data: articles } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      is_published,
      is_featured,
      published_at,
      created_at,
      sort_order,
      categories (
        name,
        slug
      )
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("display_order", { ascending: true })

  return (
    <AdminDashboard
      articles={articles || []}
      categories={categories || []}
    />
  )
}
