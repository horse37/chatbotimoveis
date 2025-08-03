import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configuração do pool com tratamento específico para SSL
const isExternalDB = process.env.DATABASE_URL?.includes('50.114.32.196')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalDB ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
  max: 10,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
})

// Event listeners para o pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err)
})

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Nova conexão estabelecida com o banco de dados')
  }
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  let client
  
  try {
    client = await pool.connect()
    const res = await client.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount })
    }
    
    return res.rows
  } catch (error: any) {
    console.error('Database query error:', {
      error: error.message,
      code: error.code,
      query: text,
      params
    })
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

export default pool