import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { path } = await params
    
    if (!path || path.length === 0) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Construir o caminho do arquivo
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    
    // Verificar se o arquivo existe
    if (!existsSync(filePath)) {
      console.log(`Arquivo não encontrado: ${filePath}`)
      return new NextResponse('File not found', { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = await readFile(filePath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const extension = path[path.length - 1].split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'mp4':
        contentType = 'video/mp4'
        break
      case 'webm':
        contentType = 'video/webm'
        break
    }

    // Retornar o arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}