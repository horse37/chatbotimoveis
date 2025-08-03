import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { scheduleMediaBackup } from '@/lib/media-backup'

// Função para salvar arquivo
async function saveFile(file: File, folder: string): Promise<string> {
  try {
    console.log(`Iniciando salvamento do arquivo: ${file.name}, Tamanho: ${file.size} bytes`)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileExtension = path.extname(file.name)
    const fileName = `${uuidv4()}${fileExtension}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    const filePath = path.join(uploadDir, fileName)
    
    console.log(`Diretório de upload: ${uploadDir}`)
    console.log(`Caminho do arquivo: ${filePath}`)
    
    // Criar diretório se não existir
    await mkdir(uploadDir, { recursive: true })
    
    // Verificar se o diretório foi criado
    const fs = require('fs')
    if (!fs.existsSync(uploadDir)) {
      throw new Error(`Falha ao criar diretório: ${uploadDir}`)
    }
    
    // Salvar arquivo
    await writeFile(filePath, buffer)
    
    // Verificar se o arquivo foi salvo
    if (!fs.existsSync(filePath)) {
      throw new Error(`Falha ao salvar arquivo: ${filePath}`)
    }
    
    console.log(`Arquivo salvo com sucesso: ${fileName}`)
    return `/uploads/${folder}/${fileName}`
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error)
    throw new Error(`Erro ao salvar arquivo: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tipo = searchParams.get('tipo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Construir query dinamicamente
    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (tipo) {
      whereConditions.push(`tipo = $${paramIndex}`)
      queryParams.push(tipo)
      paramIndex++
    }

    if (search) {
      // Verificar se a busca é um número para comparação de código
      const isNumeric = /^\d+$/.test(search.trim())
      
      if (isNumeric) {
        whereConditions.push(`(titulo ILIKE $${paramIndex} OR cidade ILIKE $${paramIndex} OR endereco ILIKE $${paramIndex} OR CAST(codigo AS TEXT) LIKE $${paramIndex} OR codigo = $${paramIndex + 1})`)
        queryParams.push(`%${search}%`)
        queryParams.push(parseInt(search.trim()))
        paramIndex += 2
      } else {
        whereConditions.push(`(titulo ILIKE $${paramIndex} OR cidade ILIKE $${paramIndex} OR endereco ILIKE $${paramIndex} OR CAST(codigo AS TEXT) LIKE $${paramIndex})`)
        queryParams.push(`%${search}%`)
        paramIndex++
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para buscar imóveis
    const imoveisQuery = `
      SELECT 
        id, codigo, titulo, tipo, status, preco, cidade, estado, 
        quartos, banheiros, area_total, created_at
      FROM imoveis 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM imoveis ${whereClause}`
    const countParams = queryParams.slice(0, -2) // Remove limit e offset

    const [imoveisResult, countResult] = await Promise.all([
      query(imoveisQuery, queryParams),
      query(countQuery, countParams)
    ])

    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      imoveis: imoveisResult,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type')
    let data: any
    let fotos: File[] = []
    let videos: File[] = []

    if (contentType?.includes('multipart/form-data')) {
      // Processar FormData (com arquivos)
      const formData = await request.formData()
      

      
      data = {
        titulo: formData.get('titulo') as string,
        descricao: formData.get('descricao') as string || '',
        tipo: formData.get('tipo') as string,
        finalidade: formData.get('finalidade') as string,
        preco: formData.get('preco') ? parseFloat(formData.get('preco') as string) : 0,
        area_total: formData.get('area_total') ? parseFloat(formData.get('area_total') as string) : 0,
        area_construida: formData.get('area_construida') ? parseFloat(formData.get('area_construida') as string) : 0,
        quartos: formData.get('quartos') ? parseInt(formData.get('quartos') as string) : 0,
        banheiros: formData.get('banheiros') ? parseInt(formData.get('banheiros') as string) : 0,
        vagas_garagem: formData.get('vagas_garagem') ? parseInt(formData.get('vagas_garagem') as string) : 0,
        endereco: formData.get('endereco') as string,
        bairro: formData.get('bairro') as string || '',
        cidade: formData.get('cidade') as string,
        estado: formData.get('estado') as string || '',
        cep: formData.get('cep') as string || '',
        proprietario: formData.get('proprietario') as string || '',
        telefone: formData.get('telefone') as string || '',
        email: formData.get('email') as string || '',
        id_angariador: formData.get('id_angariador') ? parseInt(formData.get('id_angariador') as string) : null,
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : 0,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : 0,
        caracteristicas: (() => {
          const caracteristicasValue = formData.get('caracteristicas') as string
          if (!caracteristicasValue || caracteristicasValue.trim() === '') {
            return []
          }
          // Se começar com [ ou {, tenta fazer parse como JSON
          if (caracteristicasValue.trim().startsWith('[') || caracteristicasValue.trim().startsWith('{')) {
            try {
              return JSON.parse(caracteristicasValue)
            } catch (error) {
              console.error('Erro ao fazer parse das características:', error)
              return []
            }
          }
          // Caso contrário, trata como string simples e converte para array
          return caracteristicasValue.split(',').map(item => item.trim()).filter(item => item.length > 0)
        })()
      }
      
      // Processar fotos e vídeos
      fotos = formData.getAll('fotos') as File[]
      videos = formData.getAll('videos') as File[]
    } else {
      // Processar JSON (sem arquivos)
      data = await request.json()
    }

    const {
      titulo,
      descricao,
      tipo,
      finalidade,
      preco,
      area_total,
      area_construida,
      quartos,
      banheiros,
      vagas_garagem,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      caracteristicas = [],
      proprietario,
      telefone,
      email,
      id_angariador,
      latitude,
      longitude,
    } = data

    // Validações básicas
    if (!titulo || !tipo || !finalidade || !endereco || !cidade) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: título, tipo, finalidade, endereço, cidade' },
        { status: 400 }
      )
    }

    // Processar upload de fotos
    const fotosUrls: string[] = []
    for (const foto of fotos) {
      if (foto.size > 0) {
        const fotoUrl = await saveFile(foto, 'imoveis')
        fotosUrls.push(fotoUrl)
      }
    }

    // Processar upload de vídeos
    const videosUrls: string[] = []
    for (const video of videos) {
      if (video.size > 0) {
        const videoUrl = await saveFile(video, 'imoveis/videos')
        videosUrls.push(videoUrl)
      }
    }

    // Inserir imóvel
    const result = await query(
      `INSERT INTO imoveis (
        titulo, descricao, tipo, finalidade, preco, area_total, area_construida,
        quartos, banheiros, vagas_garagem, endereco, bairro, cidade, estado, cep,
        caracteristicas, fotos, videos, latitude, longitude, corretor_id, status,
        proprietario, telefone, email, id_angariador
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *`,
      [
        titulo, descricao, tipo, finalidade, preco, area_total, area_construida,
        quartos, banheiros, vagas_garagem, endereco, bairro, cidade, estado, cep,
        JSON.stringify(caracteristicas), JSON.stringify(fotosUrls), JSON.stringify(videosUrls), latitude, longitude, authResult.userId, 'disponivel',
        proprietario, telefone, email, id_angariador
      ]
    )

    // Agendar backup das mídias
    console.log(`🔍 VERIFICANDO BACKUP CADASTRO - Fotos: ${fotosUrls.length}, Vídeos: ${videosUrls.length}`)
    console.log(`📁 URLs das fotos:`, fotosUrls)
    console.log(`🎥 URLs dos vídeos:`, videosUrls)
    
    if (fotosUrls.length > 0 || videosUrls.length > 0) {
      console.log(`✅ Condição atendida - Agendando backup do cadastro...`)
      try {
        scheduleMediaBackup(result[0].id, fotosUrls, videosUrls)
      } catch (backupError) {
        console.error('❌ Erro ao agendar backup de mídias:', backupError)
      }
    } else {
      console.log(`⚠️ Nenhuma mídia para backup no cadastro`)
    }

    return NextResponse.json({
      message: 'Imóvel cadastrado com sucesso',
      imovel: result[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar imóvel:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}