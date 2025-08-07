import { NextRequest, NextResponse } from 'next/server'
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
    
    console.log('🚀 Iniciando sincronização de imóveis...')
    
    try {
      // Importar e executar a função de sincronização diretamente
      const { execSync } = require('child_process')
      const projectRoot = process.cwd()
      const scriptPath = require('path').join(projectRoot, 'scripts', 'sync-script-standalone.js')
      
      // Executar o script e capturar a saída
      const output = execSync(`node "${scriptPath}"`, {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      })
      
      console.log('📊 Saída do script:', output)
      
      // Analisar a saída para extrair os números
      let successCount = 0
      let errorCount = 0
      let totalCount = 0
      const errors: string[] = []
      
      // Analisar o resultado
      const lines = output.split('\n')
      const successLine = lines.find((line: string) => line.includes('[EASYPANEL-LOG] Processados com sucesso:'))
      const totalLine = lines.find((line: string) => line.includes('[EASYPANEL-LOG] Total processado:'))
      const errorLine = lines.find((line: string) => line.includes('[EASYPANEL-LOG] Erros encontrados:'))
      
      if (successLine) {
        const match = successLine.match(/Processados com sucesso: (\d+)/)
        successCount = match ? parseInt(match[1]) : 0
      }
      
      if (totalLine) {
        const match = totalLine.match(/Total processado: (\d+)/)
        totalCount = match ? parseInt(match[1]) : 0
      }
      
      if (errorLine) {
        const match = errorLine.match(/Erros encontrados: (\d+)/)
        errorCount = match ? parseInt(match[1]) : 0
      }
      
      console.log(`✅ Sincronização concluída: ${successCount}/${totalCount} imóveis processados`)
      
      return NextResponse.json({
        success: true,
        successCount,
        totalCount,
        errorCount,
        errors,
        message: `Sincronização concluída: ${successCount}/${totalCount} imóveis processados`,
        output
      })
      
    } catch (error: any) {
      console.error('Erro na sincronização:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}