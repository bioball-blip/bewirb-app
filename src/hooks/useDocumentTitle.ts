import { useEffect } from 'react'

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `Crewwerk – ${pageTitle}` : 'Crewwerk'
  }, [pageTitle])
}
