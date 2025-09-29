const { Pool } = require('pg')
const logger = require('./logger')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'qatar_gov_orgchart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'qatar_gov_orgchart_api'
}

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig)

// Handle pool events
pool.on('connect', (client) => {
  logger.debug(`Connected to database: ${client.database} on ${client.host}:${client.port}`)
})

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', {
    error: err.message,
    stack: err.stack,
    client: client ? `${client.host}:${client.port}` : 'unknown'
  })
})

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool')
})

pool.on('remove', (client) => {
  logger.debug('Client removed from pool')
})

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version')
    client.release()

    logger.info('Database connection successful', {
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].postgres_version.split(' ')[0],
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database
    })

    return true
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database
    })
    return false
  }
}

// Query helper with error handling and logging
const query = async (text, params = []) => {
  const start = Date.now()
  const client = await pool.connect()

  try {
    logger.debug('Executing query', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      paramCount: params.length
    })

    const result = await client.query(text, params)
    const duration = Date.now() - start

    logger.debug('Query completed', {
      duration: `${duration}ms`,
      rowCount: result.rowCount
    })

    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Query failed', {
      error: error.message,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      paramCount: params.length,
      duration: `${duration}ms`,
      errorCode: error.code,
      errorDetail: error.detail
    })
    throw error
  } finally {
    client.release()
  }
}

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    logger.debug('Transaction started')

    const result = await callback(client)

    await client.query('COMMIT')
    logger.debug('Transaction committed')

    return result
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Transaction rolled back', {
      error: error.message,
      errorCode: error.code
    })
    throw error
  } finally {
    client.release()
  }
}

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end()
    logger.info('Database connection pool closed')
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message })
  }
}

// Health check query
const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as healthy')
    return result.rows[0].healthy === 1
  } catch (error) {
    logger.error('Database health check failed', { error: error.message })
    return false
  }
}

// Get database statistics
const getStats = async () => {
  try {
    const stats = await query(`
      SELECT
        current_database() as database_name,
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
    `)

    return {
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      },
      dbStats: stats.rows[0]
    }
  } catch (error) {
    logger.error('Failed to get database stats', { error: error.message })
    return null
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  healthCheck,
  getStats,
  dbConfig: {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: !!dbConfig.ssl
  }
}