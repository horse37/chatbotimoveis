import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configuração do pool com tratamento específico para SSL
const isExternalDB = process.env.DATABASE_URL?.includes('50.114.32.196')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalDB ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
  max: 10, // Reduzido para evitar sobrecarga
  min: 2,
  idleTimeoutMillis: 600000, // 10 minutos
  connectionTimeoutMillis: 30000, // 30 segundos
  statement_timeout: 30000, // 30 segundos para queries
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

export async function query(text: string, params?: any[], retries = 3): Promise<any[]> {
  const start = Date.now()
  let client
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      client = await pool.connect()
      const res = await client.query(text, params)
      const duration = Date.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount, attempt })
      }
      
      return res.rows
    } catch (error: any) {
      if (client) {
        client.release(true) // Force release on error
        client = null
      }
      
      const isConnectionError = error.message?.includes('Connection terminated') || 
                               error.message?.includes('connection') ||
                               error.code === 'ECONNRESET' ||
                               error.code === 'ENOTFOUND'
      
      if (attempt < retries && isConnectionError) {
        console.warn(`Database connection error on attempt ${attempt}/${retries}, retrying...`, {
          error: error.message,
          code: error.code
        })
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        continue
      }
      
      console.error('Database query error:', {
        error: error.message,
        code: error.code,
        query: text,
        params,
        attempt,
        retries
      })
      throw error
    } finally {
      if (client) {
        client.release()
      }
    }
  }
  
  // Se chegou aqui, todos os retries falharam
  throw new Error('All database connection retries failed')
}

export default pool