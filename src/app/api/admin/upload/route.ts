import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('=== INÍCIO DO UPLOAD ===');
    
    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      console.log('Falha na autenticação:', authResult.error);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.log('Autenticação bem-sucedida');

    // Processar o upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('Nenhum arquivo encontrado no FormData');
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }
    
    console.log(`Arquivo recebido: ${file.name}, Tipo: ${file.type}, Tamanho: ${file.size} bytes`);

    // Verificar tipo de arquivo (apenas imagens)
    if (!file.type.startsWith('image/')) {
      console.log(`Tipo de arquivo inválido: ${file.type}`);
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 });
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    console.log(`Nome do arquivo gerado: ${fileName}`);

    // Definir diretório para salvar as imagens
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'corretores');

    // Garantir que o diretório existe
    ensureDirectoryExists(uploadDir);
    console.log(`Diretório de upload: ${uploadDir}`);
    console.log(`Diretório existe: ${fs.existsSync(uploadDir)}`);

    // Caminho completo do arquivo
    const filePath = join(uploadDir, fileName);
    console.log(`Salvando arquivo em: ${filePath}`);

    // Converter o arquivo para um buffer e salvar
    console.log('Convertendo arquivo para buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`Buffer criado com ${buffer.length} bytes`);

    // Salvar o arquivo
    console.log('Iniciando escrita do arquivo...');
    await writeFile(filePath, buffer);
    console.log(`Arquivo salvo com sucesso: ${fileName}`);
    
    // Verificar se o arquivo foi realmente salvo
    const fileExists = fs.existsSync(filePath);
    console.log(`Arquivo existe após salvamento: ${fileExists}`);
    if (fileExists) {
      const stats = fs.statSync(filePath);
      console.log(`Tamanho do arquivo salvo: ${stats.size} bytes`);
    }

    // URL relativa para acessar o arquivo
    const fileUrl = `/uploads/corretores/${fileName}`;
    console.log(`URL do arquivo: ${fileUrl}`);
    console.log('=== FIM DO UPLOAD ===');

    return NextResponse.json({
      message: 'Upload realizado com sucesso',
      url: fileUrl
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no upload de arquivo:', error);
    console.error('Stack trace:', error?.stack);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}