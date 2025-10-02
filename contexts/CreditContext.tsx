'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CreditContextType {
  balance: number
  isLoading: boolean
  refreshBalance: () => Promise<void>
  updateBalance: (newBalance: number) => void
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

export function useCreditBalance() {
  const context = useContext(CreditContext)
  if (context === undefined) {
    throw new Error('useCreditBalance must be used within a CreditProvider')
  }
  return context
}

interface CreditProviderProps {
  children: ReactNode
  initialBalance?: number
}

export function CreditProvider({ children, initialBalance = 0 }: CreditProviderProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [isLoading, setIsLoading] = useState(true) // Start with loading true

  const fetchBalance = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/credits/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBalance = async () => {
    await fetchBalance()
  }

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance)
  }

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance()
  }, [])

  return (
    <CreditContext.Provider value={{
      balance,
      isLoading,
      refreshBalance,
      updateBalance
    }}>
      {children}
    </CreditContext.Provider>
  )
}
