package actions

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/mattn/go-sqlite3"
	_ "github.com/lib/pq"
)

// DatabaseAction performs database operations
type DatabaseAction struct {
	Driver    string                 `json:"driver"`    // sqlite, mysql, postgres
	DSN       string                 `json:"dsn"`       // connection string
	Query     string                 `json:"query"`     // SQL query
	QueryType string                 `json:"queryType"` // select, exec
	Args      []interface{}          `json:"args"`      // query arguments
	Output    map[string]interface{} `json:"output"`    // output mapping
}

// DatabaseActionContext wraps action execution context
type DatabaseActionContext struct {
	Variables   map[string]interface{}
	StepOutputs map[string]interface{}
	Logger      interface{}
}

// Execute executes the database action
func (a *DatabaseAction) Execute(ctx *DatabaseActionContext) (map[string]interface{}, error) {
	// Open database connection
	db, err := sql.Open(a.Driver, a.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	result := make(map[string]interface{})

	switch strings.ToLower(a.QueryType) {
	case "select", "query":
		rows, err := a.executeQuery(db)
		if err != nil {
			return nil, err
		}
		result["rows"] = rows
		result["rowCount"] = len(rows)

	case "exec", "insert", "update", "delete":
		execResult, err := a.executeExec(db)
		if err != nil {
			return nil, err
		}
		result["affected"] = execResult

	default:
		return nil, fmt.Errorf("unsupported query type: %s", a.QueryType)
	}

	result["success"] = true
	return result, nil
}

// executeQuery executes a SELECT query
func (a *DatabaseAction) executeQuery(db *sql.DB) ([]map[string]interface{}, error) {
	rows, err := db.Query(a.Query, a.Args...)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	// Prepare result slice
	var results []map[string]interface{}

	// Iterate through rows
	for rows.Next() {
		// Create a slice of interface{}'s to represent each column
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		// Scan the row
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		// Create map for this row
		rowMap := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// Convert []byte to string
			if b, ok := val.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = val
			}
		}
		results = append(results, rowMap)
	}

	return results, rows.Err()
}

// executeExec executes an INSERT/UPDATE/DELETE query
func (a *DatabaseAction) executeExec(db *sql.DB) (int64, error) {
	result, err := db.Exec(a.Query, a.Args...)
	if err != nil {
		return 0, fmt.Errorf("exec failed: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return affected, nil
}

// Validate validates the action configuration
func (a *DatabaseAction) Validate() error {
	if a.Driver == "" {
		return fmt.Errorf("driver is required")
	}
	if a.DSN == "" {
		return fmt.Errorf("dsn is required")
	}
	if a.Query == "" {
		return fmt.Errorf("query is required")
	}

	// Validate driver
	supportedDrivers := []string{"sqlite3", "mysql", "postgres"}
	found := false
	for _, d := range supportedDrivers {
		if a.Driver == d {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("unsupported driver: %s (supported: %v)", a.Driver, supportedDrivers)
	}

	return nil
}

// ToJSON converts action to JSON
func (a *DatabaseAction) ToJSON() ([]byte, error) {
	return json.Marshal(a)
}

// FromJSON creates action from JSON
func (a *DatabaseAction) FromJSON(data []byte) error {
	return json.Unmarshal(data, a)
}
