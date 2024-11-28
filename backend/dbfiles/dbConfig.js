const config ={
    user: 'sa',
    password: '123',
    server: 'localhost',
    database: 'application',
    options: {
        trustServerCertificate: true,
        trustedConnection: false,
        enableArithAbort: true,
        instancename: 'SQLEXPRESS'
    },
    port: 1433
}
module.exports = config;
