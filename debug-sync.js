const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function debugSync() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Buscar um imóvel para debug
    const result = await pool.query('SELECT * FROM imoveis LIMIT 1');
    const imovel = result.rows[0];
    
    console.log('Imóvel original:');
    console.log(JSON.stringify(imovel, null, 2));
    
    // Processar fotos e vídeos
    let fotos = [];
    let videos = [];
    
    try {
      if (imovel.fotos) {
        fotos = typeof imovel.fotos === 'string' ? JSON.parse(imovel.fotos) : imovel.fotos;
      }
    } catch (e) {
      console.log('Erro ao processar fotos:', e.message);
    }
    
    try {
      if (imovel.videos) {
        videos = typeof imovel.videos === 'string' ? JSON.parse(imovel.videos) : imovel.videos;
      }
    } catch (e) {
      console.log('Erro ao processar vídeos:', e.message);
    }
    
    // Montar payload
    const tipologia = [
      imovel.banheiros ? `${imovel.banheiros} banheiros` : '',
      imovel.quartos ? `${imovel.quartos} quartos` : ''
    ].filter(Boolean).join(', ');
    
    const payload = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco) || 0,
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: Boolean(imovel.ativo),
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: tipologia,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: imovel.id,
      images: fotos,
      videos: videos
    };
    
    console.log('\nPayload a ser enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
    console.log('\nFotos processadas:', fotos.length);
    console.log('Vídeos processados:', videos.length);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

debugSync();