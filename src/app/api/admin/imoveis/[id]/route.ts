import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { unlink, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { scheduleMediaBackup } from '@/lib/media-backup'

// Função para salvar arquivo
async function saveFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  const filePath = path.join(uploadDir, fileName)
  
  // Criar diretório se não existir
  await mkdir(uploadDir, { recursive: true })
  
  // Salvar arquivo
  await writeFile(filePath, buffer)
  
  return `/uploads/${folder}/${fileName}`
}

// GET - Buscar imóvel por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const paramsResolved = await params
    const imovelId = paramsResolved.id
    if (!imovelId) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT * FROM imoveis WHERE id = $1',
      [imovelId]
    )

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Imóvel não encontrado' },
        { status: 404 }
      )
    }

    const imovel = result[0]
    
    // Parse JSON fields
    try {
      if (imovel.caracteristicas && typeof imovel.caracteristicas === 'string') {
        imovel.caracteristicas = JSON.parse(imovel.caracteristicas)
      } else if (!imovel.caracteristicas) {
        imovel.caracteristicas = []
      }
      
      if (imovel.fotos && typeof imovel.fotos === 'string') {
        imovel.fotos = JSON.parse(imovel.fotos)
      } else if (!imovel.fotos) {
        imovel.fotos = []
      }
    } catch (error) {
      console.error('Erro ao fazer parse dos campos JSON:', error)
      // Em caso de erro no parse, inicializa com arrays vazios
      if (!Array.isArray(imovel.caracteristicas)) imovel.caracteristicas = []
      if (!Array.isArray(imovel.fotos)) imovel.fotos = []
    }

    return NextResponse.json({ imovel })
  } catch (error) {
    console.error('Erro ao buscar imóvel:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar imóvel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const paramsResolved = await params
    const imovelId = paramsResolved.id
    if (!imovelId) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar se o imóvel existe
    const existingResult = await query(
      'SELECT * FROM imoveis WHERE id = $1',
      [imovelId]
    )

    if (existingResult.length === 0) {
      return NextResponse.json(
        { message: 'Imóvel não encontrado' },
        { status: 404 }
      )
    }

    const contentType = request.headers.get('content-type')
    let data: any
    let fotos: File[] = []
    let videos: File[] = []
    let fotosExistentes: string[] = []
    let videosExistentes: string[] = []

    if (contentType?.includes('multipart/form-data')) {
      // Processar FormData (com arquivos)
      const formData = await request.formData()
      
      data = {
        titulo: formData.get('titulo') as string,
        descricao: formData.get('descricao') as string,
        tipo: formData.get('tipo') as string,
        finalidade: formData.get('finalidade') as string,
        status: formData.get('status') as string,
        preco: formData.get('preco') as string,
        area_total: formData.get('area_total') as string,
        area_construida: formData.get('area_construida') as string,
        quartos: formData.get('quartos') as string,
        banheiros: formData.get('banheiros') as string,
        vagas_garagem: formData.get('vagas_garagem') as string,
        endereco: formData.get('endereco') as string,
        bairro: formData.get('bairro') as string,
        cidade: formData.get('cidade') as string,
        estado: formData.get('estado') as string,
        cep: formData.get('cep') as string,
        caracteristicas: formData.get('caracteristicas') as string,
        proprietario: formData.get('proprietario') as string,
        telefone: formData.get('telefone') as string,
        email: formData.get('email') as string,
        id_angariador: formData.get('id_angariador') as string,
        latitude: formData.get('latitude') as string,
        longitude: formData.get('longitude') as string
      }
      
      // Processar fotos e vídeos
      fotos = formData.getAll('fotos') as File[]
      videos = formData.getAll('videos') as File[]
      
      // Processar fotos e vídeos existentes
      const fotosExistentesStr = formData.get('fotosExistentes') as string
      const videosExistentesStr = formData.get('videosExistentes') as string
      
      fotosExistentes = fotosExistentesStr ? JSON.parse(fotosExistentesStr) : []
      videosExistentes = videosExistentesStr ? JSON.parse(videosExistentesStr) : []
    } else {
      // Processar JSON (sem arquivos)
      data = await request.json()
    }

    const {
      titulo,
      descricao,
      tipo,
      finalidade,
      status,
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
      caracteristicas,
      proprietario,
      telefone,
      email,
      id_angariador,
      latitude,
      longitude,
    } = data

    // Validações básicas
    if (!titulo || !tipo || !finalidade || !preco || !endereco || !cidade) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: título, tipo, finalidade, preço, endereço, cidade' },
        { status: 400 }
      )
    }

    // Converter campos numéricos vazios para null
    const parseNumericField = (value: any) => {
      if (value === '' || value === null || value === undefined) return null
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }

    const parseIntegerField = (value: any) => {
      if (value === '' || value === null || value === undefined) return null
      const parsed = parseInt(value)
      return isNaN(parsed) ? null : parsed
    }

    // Processar upload de novas fotos
    const novasFotosUrls: string[] = []
    for (const foto of fotos) {
      if (foto.size > 0) {
        const fotoUrl = await saveFile(foto, 'imoveis')
        novasFotosUrls.push(fotoUrl)
      }
    }

    // Processar upload de novos vídeos
    const novosVideosUrls: string[] = []
    for (const video of videos) {
      if (video.size > 0) {
        const videoUrl = await saveFile(video, 'imoveis/videos')
        novosVideosUrls.push(videoUrl)
      }
    }

    // Combinar fotos existentes com novas fotos
    const todasFotos = [...fotosExistentes, ...novasFotosUrls]
    
    // Combinar vídeos existentes com novos vídeos
    const todosVideos = [...videosExistentes, ...novosVideosUrls]

    // Atualizar imóvel
    const result = await query(
      `UPDATE imoveis SET 
        titulo = $1, descricao = $2, tipo = $3, finalidade = $4, status = $5,
        preco = $6, area_total = $7, area_construida = $8, quartos = $9,
        banheiros = $10, vagas_garagem = $11, endereco = $12, bairro = $13,
        cidade = $14, estado = $15, cep = $16, caracteristicas = $17,
        fotos = $18, videos = $19, latitude = $20, longitude = $21,
        proprietario = $22, telefone = $23, email = $24, id_angariador = $25, updated_at = NOW()
      WHERE id = $26
      RETURNING *`,
      [
        titulo, descricao, tipo, finalidade, status || 'disponivel',
        parseNumericField(preco), parseNumericField(area_total), parseNumericField(area_construida), 
        parseIntegerField(quartos), parseIntegerField(banheiros), parseIntegerField(vagas_garagem), 
        endereco, bairro, cidade, estado, cep,
        JSON.stringify(caracteristicas || []), JSON.stringify(todasFotos), JSON.stringify(todosVideos),
        parseNumericField(latitude), parseNumericField(longitude),
        proprietario, telefone, email, parseIntegerField(id_angariador),
        imovelId
      ]
    )

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Imóvel não encontrado ou você não tem permissão para editá-lo' },
        { status: 404 }
      )
    }

    // Agendar backup de TODAS as mídias (existentes + novas)
    console.log(`🔍 VERIFICANDO BACKUP - Total fotos: ${todasFotos.length}, Total vídeos: ${todosVideos.length}`)
    console.log(`📁 Novas fotos: ${novasFotosUrls.length}, Fotos existentes: ${fotosExistentes.length}`)
    console.log(`🎥 Novos vídeos: ${novosVideosUrls.length}, Vídeos existentes: ${videosExistentes.length}`)
    console.log(`📋 Todas as fotos:`, todasFotos)
    console.log(`📋 Todos os vídeos:`, todosVideos)
    
    if (todasFotos.length > 0 || todosVideos.length > 0) {
      console.log(`✅ Condição atendida - Agendando backup de TODAS as mídias...`)
      try {
        scheduleMediaBackup(imovelId, todasFotos, todosVideos)
      } catch (backupError) {
        console.error('❌ Erro ao agendar backup de mídias:', backupError)
      }
    } else {
      console.log(`⚠️ Nenhuma mídia para backup`)
    }

    return NextResponse.json({
      message: 'Imóvel atualizado com sucesso',
      imovel: result[0],
    })
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir imóvel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const paramsResolved = await params
    const imovelId = paramsResolved.id
    if (!imovelId) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      )
    }

    // Buscar o imóvel para obter as fotos antes de excluir
    const fotosResult = await query(
      'SELECT fotos FROM imoveis WHERE id = $1',
      [imovelId]
    )

    if (fotosResult.length === 0) {
      return NextResponse.json(
        { message: 'Imóvel não encontrado' },
        { status: 404 }
      )
    }

    const imovel = fotosResult[0]
    
    // Excluir fotos do sistema de arquivos
    if (imovel.fotos) {
      try {
        const fotos = JSON.parse(imovel.fotos)
        for (const fotoUrl of fotos) {
          if (fotoUrl.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', fotoUrl)
            try {
              await unlink(filePath)
            } catch (err) {
              console.warn(`Erro ao excluir arquivo ${filePath}:`, err)
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao processar fotos para exclusão:', err)
      }
    }

    // Excluir imóvel do banco de dados
 const result = await query(
      'DELETE FROM imoveis WHERE id = $1',
      [imovelId]
    )

    return NextResponse.json({
      message: 'Imóvel excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir imóvel:', error)
    
    // Verificar se é erro de chave estrangeira
    if (error.code === '23503' && error.constraint === 'contatos_imovel_id_fkey') {
      return NextResponse.json(
        { 
          message: 'Não é possível excluir este imóvel pois existem contatos associados a ele. Exclua primeiro os contatos relacionados.' 
        },
        { status: 400 }
      )
    }
    
    // Outros erros de chave estrangeira
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          message: 'Não é possível excluir este imóvel pois existem registros relacionados a ele no sistema.' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}