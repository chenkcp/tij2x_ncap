// This layer handles:

// site-to-database mapping
// creating the correct DB connection
// connection pooling
// choosing MSSQL / PostgreSQL / Oracle provider
// low level query execution helpers

// It should not contain page business logic.