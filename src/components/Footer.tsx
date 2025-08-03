import { readFileSync } from 'fs'
import { join } from 'path'

function getVersion(): string {
  try {
    // Em produção, a versão será lida do package.json durante o build
    if (typeof window === 'undefined') {
      const packagePath = join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
      return packageJson.version || '1.0.2'
    }
    // No cliente, retorna uma versão padrão
    return '1.0.2'
  } catch (error) {
    return '1.0.2'
  }
}

export default function Footer() {
  const version = getVersion()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-4 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-300">
          © {currentYear} Infopower System (Versão {version}). Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}