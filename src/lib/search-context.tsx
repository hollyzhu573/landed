'use client'

import { createContext, useContext, useState } from 'react'

type SearchContextType = {
  open: boolean
  setOpen: (v: boolean) => void
}

const SearchContext = createContext<SearchContextType>({ open: false, setOpen: () => {} })

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => useContext(SearchContext)
