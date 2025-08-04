import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { requireAuth } from '@/lib/auth'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await requireAuth(request)
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
    }
    
    // Verificar se é admin
    if (auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }
    
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'sync-script.js')
    
    console.log('🚀 Iniciando sincronização de imóveis...')
    
    // Executar o script de sincronização
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    })
    
    // Analisar o resultado
    const lines = stdout.split('\n')
    const successLine = lines.find(line => line.includes('✅ Sucesso:'))
    const totalLine = lines.find(line => line.includes('📊 Total:'))
    
    let successCount = 0
    let totalCount = 0
    
    if (successLine) {
      const match = successLine.match(/✅ Sucesso: (\d+)/)
      successCount = match ? parseInt(match[1]) : 0
    }
    
    if (totalLine) {
      const match = totalLine.match(/📊 Total: (\d+)/)
      totalCount = match ? parseInt(match[1]) : 0
    }
    
    console.log('✅ Sincronização concluída:', stdout)
    
    if (stderr) {
      console.error('⚠️ Erros durante sincronização:', stderr)
    }
    
    return NextResponse.json({
      success: true,
      successCount,
      totalCount,
      output: stdout,
      errors: stderr
    })
    
  } catch (error) {
    console.error('❌ Erro ao executar sincronização:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}