import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const scriptPath = path.join(projectRoot, 'sync-script-standalone.js')
    
    console.log('🚀 Iniciando sincronização de imóveis...')
    
    return new Promise((resolve) => {
      let successCount = 0
      let errorCount = 0
      let totalCount = 0
      const errors: string[] = []
      
      // Executar o script de sincronização
      const child = spawn('node', [scriptPath], {
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      })
      
      let output = ''
      
      child.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        const errorMsg = data.toString()
        console.error('Erro no script:', errorMsg)
        errors.push(errorMsg)
      })
      
      child.on('close', (code) => {
        // Analisar o resultado
        const lines = output.split('\n')
        const successLine = lines.find(line => line.includes('✅ Sucesso:'))
        const totalLine = lines.find(line => line.includes('📊 Total:'))
        const errorLine = lines.find(line => line.includes('❌ Erros:'))
        
        if (successLine) {
          const match = successLine.match(/✅ Sucesso: (\d+)/)
          successCount = match ? parseInt(match[1]) : 0
        }
        
        if (totalLine) {
          const match = totalLine.match(/📊 Total: (\d+)/)
          totalCount = match ? parseInt(match[1]) : 0
        }
        
        if (errorLine) {
          const match = errorLine.match(/❌ Erros: (\d+)/)
          errorCount = match ? parseInt(match[1]) : 0
        }
        
        console.log(`✅ Sincronização concluída: ${successCount}/${totalCount} imóveis processados`)
        
        resolve(NextResponse.json({
          success: code === 0,
          successCount,
          totalCount,
          errorCount,
          errors,
          message: `Sincronização concluída: ${successCount}/${totalCount} imóveis processados`,
          output
        }))
      })
      
      child.on('error', (error) => {
        console.error('Erro ao executar script:', error)
        resolve(NextResponse.json({
          success: false,
          error: error.message || 'Erro ao executar script de sincronização'
        }, { status: 500 }))
      })
    })

  } catch (error: any) {
    console.error('Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}