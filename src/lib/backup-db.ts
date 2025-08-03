import { Pool } from 'pg'

if (!process.env.BACKUP_DATABASE_URL) {
  console.warn('BACKUP_DATABASE_URL environment variable is not set. Media backup will be disabled.')
}

// Configuração do pool para o banco de backup
const backupPool = process.env.BACKUP_DATABASE_URL ? new Pool({
  connectionString: process.env.BACKUP_DATABASE_URL,
  ssl: false, // Configurado para o servidor específico
  max: 5, // Menor pool para operações de backup
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
}) : null

// Event listeners para o pool de backup
if (backupPool) {
  backupPool.on('error', (err) => {
    console.error('Erro inesperado no pool de conexões de backup:', err)
  })

  backupPool.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Nova conexão estabelecida com o banco de backup')
    }
  })
}

export async function backupQuery(text: string, params?: any[]) {
  if (!backupPool) {
    console.warn('Backup database not configured. Skipping backup operation.')
    return []
  }

  const start = Date.now()
  let client
  
  try {
    client = await backupPool.connect()
    const res = await client.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed backup query', { text, duration, rows: res.rowCount })
    }
    
    return res.rows
  } catch (error: any) {
    console.error('Backup database query error:', {
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

export default backupPool