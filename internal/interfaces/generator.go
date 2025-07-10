package interfaces

// Generator defines the interface for code generation
type Generator interface {
	// WriteFile writes content to a file at the specified path
	WriteFile(path string, content []byte) error
	
	// EnsureDir ensures that a directory exists
	EnsureDir(path string) error
}