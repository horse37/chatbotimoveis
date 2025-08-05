import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se estamos em ambiente de produção
  const isProd = process.env.NODE_ENV === 'production'
  
  // Permitir acesso direto aos arquivos de upload sem processamento
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next()
  }
  
  // Lidar com a rota raiz em produção (para EasyPanel)
  if (isProd && request.nextUrl.pathname === '/') {
    // Verificar se a requisição já tem o cabeçalho X-Forwarded-Host (indicando que passou pelo proxy)
    const hasForwardedHost = request.headers.get('x-forwarded-host')
    const hasForwardedProto = request.headers.get('x-forwarded-proto')
    
    // Verificar se estamos usando a porta correta
    const host = request.headers.get('host') || ''
    const isCorrectPort = host.includes(':4000') || !host.includes(':')
    
    // Se estamos em produção e na rota raiz, garantir que a navegação funcione corretamente
    // e que estamos usando a porta correta
    if (!isCorrectPort && hasForwardedHost) {
      // Redirecionar para a porta correta se necessário
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${hasForwardedHost}`
      return NextResponse.redirect(new URL('/', baseUrl))
    }
    
    return NextResponse.next()
  }

  // Para outras rotas, continuar normalmente
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (upload files) - tratados pela API route
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}