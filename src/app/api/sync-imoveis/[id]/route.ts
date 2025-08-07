import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('Sincronização individual - ID recebido:', id, 'tipo:', typeof id)
  
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log('Erro: ID não é um UUID válido -', id)
      return NextResponse.json({ error: 'ID do imóvel inválido' }, { status: 400 })
    }

    console.log('UUID válido recebido:', id)

    // Verificar se o imóvel existe usando a API interna
    const imovelResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:4000'}/api/admin/imoveis/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!imovelResponse.ok) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    }

    // Executar o script de sincronização para o imóvel específico
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-script-standalone.js')
    const command = `node "${scriptPath}" --imovel-id=${id}`

    console.log(`Executando sincronização individual para imóvel ${id}:`, command)

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 1 minuto de timeout
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_TOKEN: token
      }
    })

    if (stderr && !stderr.includes('Warning')) {
      console.error('Erro na sincronização:', stderr)
      return NextResponse.json({ 
        error: 'Erro durante a sincronização', 
        details: stderr 
      }, { status: 500 })
    }

    console.log('Sincronização concluída:', stdout)

    return NextResponse.json({ 
      success: true, 
      message: `Imóvel ${id} sincronizado com sucesso`,
      output: stdout
    })

  } catch (error: any) {
    console.error('Erro na sincronização individual:', error)
    
    if (error.code === 'TIMEOUT') {
      return NextResponse.json({ 
        error: 'Timeout na sincronização - processo demorou mais que o esperado' 
      }, { status: 408 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 })
  }
}