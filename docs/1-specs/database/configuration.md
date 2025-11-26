# Database Configuration Guide

The workflow database action supports SQLite, MySQL, and PostgreSQL.

## DSN Formats

### SQLite
```json
{
  "driver": "sqlite3",
  "dsn": "./data/test.db"
}
```

Or with options:
```json
{
  "dsn": "file:./data/test.db?cache=shared&mode=rwc"
}
```

### MySQL
```json
{
  "driver": "mysql",
  "dsn": "user:password@tcp(localhost:3306)/dbname?parseTime=true"
}
```

Connection options:
- `parseTime=true` - Parse DATE/DATETIME to time.Time
- `charset=utf8mb4` - Character set
- `timeout=30s` - Connection timeout

### PostgreSQL
```json
{
  "driver": "postgres",
  "dsn": "postgres://user:password@localhost:5432/dbname?sslmode=disable"
}
```

Or DSN style:
```json
{
  "dsn": "host=localhost port=5432 user=postgres password=secret dbname=testdb sslmode=disable"
}
```

## Complete Examples

### SQLite Workflow Step
```json
{
  "id": "queryDB",
  "name": "Query Database",
  "type": "database",
  "config": {
    "driver": "sqlite3",
    "dsn": "./data/test_management.db",
    "queryType": "select",
    "query": "SELECT * FROM test_cases WHERE test_id = ?",
    "args": ["{{testId}}"]
  }
}
```

### MySQL Workflow Step
```json
{
  "id": "insertData",
  "name": "Insert Data",
  "type": "database",
  "config": {
    "driver": "mysql",
    "dsn": "root:password@tcp(127.0.0.1:3306)/testdb?parseTime=true",
    "queryType": "exec",
    "query": "INSERT INTO logs (message, created_at) VALUES (?, NOW())",
    "args": ["{{logMessage}}"]
  }
}
```

### PostgreSQL Workflow Step
```json
{
  "id": "countRecords",
  "name": "Count Records",
  "type": "database",
  "config": {
    "driver": "postgres",
    "dsn": "postgres://admin:secret@localhost:5432/analytics?sslmode=disable",
    "queryType": "select",
    "query": "SELECT COUNT(*) as total FROM events WHERE date >= $1",
    "args": ["{{startDate}}"]
  }
}
```

## Query Types

| Type | Description | Returns |
|------|-------------|---------|
| `select` / `query` | Read data | `{rows: [...], rowCount: n, success: true}` |
| `exec` / `insert` / `update` / `delete` | Write data | `{affected: n, success: true}` |

## Using Results in Assertions

```json
{
  "type": "assert",
  "config": {
    "assertions": [
      {
        "type": "equals",
        "actual": "{{queryDB.rowCount}}",
        "expected": 1,
        "message": "Should find 1 record"
      },
      {
        "type": "equals",
        "actual": "{{queryDB.rows[0].name}}",
        "expected": "Test Case",
        "message": "Name should match"
      }
    ]
  }
}
```
