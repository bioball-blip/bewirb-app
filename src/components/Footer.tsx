import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="py-4 text-center text-xs text-gray-400">
      <Link to="/impressum" className="underline">
        Impressum
      </Link>
      {' · '}
      <Link to="/datenschutz" className="underline">
        Datenschutz
      </Link>
    </footer>
  )
}
