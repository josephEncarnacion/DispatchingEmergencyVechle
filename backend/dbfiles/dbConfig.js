// Database configuration
// Uses environment variables with sane local defaults for SQL Server
// Set the following env vars for non-local setups: DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME, DB_PORT

const config = {
  user: 'sa',
  password: '123',
  server: '127.0.0.1',
  database: 'DispatchingDB',
  // Use a fixed TCP port; remove instanceName to avoid SQL Browser dependency
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  connectionTimeout: 45000,
  requestTimeout: 45000,
};

module.exports = config;