// This layer handles:

// site-to-database mapping
// creating the correct DB connection
// connection pooling
// choosing the configured SQL provider (ODBC in this project)
// low level query execution helpers

// It should not contain page business logic.