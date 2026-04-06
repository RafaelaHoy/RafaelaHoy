"use client"

import { useState, useEffect, useCallback } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomeContent } from "@/components/home-content"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
    setTimeout(() => setShowContent(true), 100)
  }, [])

  useEffect(() => {
    // Check if the user has already seen the loading screen in this session
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading")
    if (hasSeenLoading) {
      setIsLoading(false)
      setShowContent(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem("hasSeenLoading", "true")
    }
  }, [isLoading])

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <div
        className={`min-h-screen transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        <Header />
        <main>
          <HomeContent />
        </main>
        <Footer />
      </div>
    </>
  )
}
