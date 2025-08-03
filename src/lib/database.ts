import { Pool, QueryResult } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 15000, // tempo limite para estabelecer conexão (aumentado para evitar timeouts)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // SSL apenas em produção
  allowExitOnIdle: true, // permite que o processo termine quando não há conexões ativas
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

// Função para executar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  let client
  
  try {
    client = await pool.connect()
    const result = await client.query(text, params)
    const duration = Date.now() - start
    
    // Log da query em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query:', { text, duration, rows: result.rowCount })
    }
    
    return result
  } catch (error: any) {
    console.error('Database connection error:', {
      error: error.message,
      code: error.code,
      query: text,
      params
    })
    
    // Mensagens de erro mais específicas
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Não foi possível conectar ao banco de dados. Verifique se o PostgreSQL está rodando na porta 5432.')
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Host do banco de dados não encontrado. Verifique a configuração DATABASE_URL.')
    } else if (error.code === '28P01') {
      throw new Error('Falha na autenticação do banco de dados. Verifique usuário e senha.')
    } else if (error.code === '3D000') {
      throw new Error('Banco de dados não existe. Verifique se o banco "imobiliaria_db" foi criado.')
    }
    
    console.error('Database query error:', error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Função para executar transações
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Transaction error:', error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Função para verificar a conexão
export async function checkConnection() {
  try {
    const result = await query('SELECT NOW()')
    return { success: true, timestamp: result.rows[0].now }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Cleanup do pool ao encerrar a aplicação
process.on('SIGINT', () => {
  pool.end()
})

process.on('SIGTERM', () => {
  pool.end()
})

export default pool