"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface AdContextType {
  isModalClosed: boolean
  setIsModalClosed: (closed: boolean) => void
  shouldShowSticky: boolean
  setShouldShowSticky: (show: boolean) => void
}

const AdContext = createContext<AdContextType | undefined>(undefined)

export function AdProvider({ children }: { children: ReactNode }) {
  const [isModalClosed, setIsModalClosed] = useState(false)
  const [shouldShowSticky, setShouldShowSticky] = useState(false)

  return (
    <AdContext.Provider
      value={{
        isModalClosed,
        setIsModalClosed,
        shouldShowSticky,
        setShouldShowSticky,
      }}
    >
      {children}
    </AdContext.Provider>
  )
}

export function useAdContext() {
  const context = useContext(AdContext)
  if (context === undefined) {
    throw new Error('useAdContext must be used within an AdProvider')
  }
  return context
}
