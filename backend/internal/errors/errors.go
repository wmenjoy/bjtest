package errors

import "errors"

// Common errors that can be checked with errors.Is()
var (
	// ErrNotFound indicates that the requested resource was not found
	ErrNotFound = errors.New("resource not found")

	// ErrAlreadyExists indicates that the resource already exists (UNIQUE constraint violation)
	ErrAlreadyExists = errors.New("resource already exists")

	// ErrConflict indicates a business rule conflict (e.g., cannot delete active environment)
	ErrConflict = errors.New("operation conflicts with current state")

	// ErrInvalidInput indicates invalid input parameters
	ErrInvalidInput = errors.New("invalid input parameters")
)
