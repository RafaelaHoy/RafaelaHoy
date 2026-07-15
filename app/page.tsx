"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomeContent } from "@/components/home-content"
import { AdModal } from "@/components/ad-modal"
import { AdStickyBottom } from "@/components/ad-sticky-bottom"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  const handleLoadingComplete = () => {
    setIsLoading(false)
    setTimeout(() => {
      setShowContent(true)
    }, 100)
  }

  useEffect(() => {
    // Check if user has already seen loading screen
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading")
    console.log('hasSeenLoading:', hasSeenLoading)
    
    if (hasSeenLoading === "true") {
      console.log('Skipping loading screen - user already saw it')
      setIsLoading(false)
      setShowContent(true)
      // Los banners de publicidad aparecerán automáticamente con su propio timer
    } else {
      console.log('Showing loading screen for first time')
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem("hasSeenLoading", "true")
      console.log('Set hasSeenLoading to true')
    }
  }, [isLoading])

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <AdModal />
      <AdStickyBottom />
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
