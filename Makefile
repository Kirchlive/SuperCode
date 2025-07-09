# SuperCode Makefile
# Development automation for the SuperCode merger tool

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Variables
BINARY_NAME := supercode
BUILD_DIR := ./bin
GO_FILES := $(shell find . -name '*.go' -type f)
COVERAGE_FILE := coverage.out

# Go parameters
GOCMD := go
GOBUILD := $(GOCMD) build
GOCLEAN := $(GOCMD) clean
GOTEST := $(GOCMD) test
GOGET := $(GOCMD) get
GOMOD := $(GOCMD) mod
GOVET := $(GOCMD) vet
GOFMT := gofmt

# Build flags
LDFLAGS := -ldflags "-s -w -X main.Version=$$(git describe --tags --always --dirty) -X main.BuildTime=$$(date -u +%Y-%m-%d_%H:%M:%S)"

.PHONY: all
all: clean lint test build ## Run all steps

.PHONY: setup
setup: ## Setup development environment
	@echo "🔧 Setting up development environment..."
	$(GOMOD) download
	$(GOMOD) tidy
	go install github.com/spf13/cobra-cli@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install gotest.tools/gotestsum@latest
	@echo "✅ Setup complete"

.PHONY: build
build: ## Build the binary
	@echo "🔨 Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/supercode
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@gotestsum --format=testname -- -v -race -cover -coverprofile=$(COVERAGE_FILE) ./...

.PHONY: test-unit
test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	@$(GOTEST) -v -short -race -cover ./internal/...

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "🧪 Running integration tests..."
	@$(GOTEST) -v -run Integration -race ./tests/...

.PHONY: test-e2e
test-e2e: build ## Run end-to-end tests
	@echo "🧪 Running E2E tests..."
	@$(GOTEST) -v -tags=e2e ./tests/e2e/...

.PHONY: benchmark
benchmark: ## Run benchmarks
	@echo "📊 Running benchmarks..."
	@$(GOTEST) -bench=. -benchmem ./...

.PHONY: coverage
coverage: test ## Generate and show coverage report
	@echo "📊 Generating coverage report..."
	@$(GOCMD) tool cover -html=$(COVERAGE_FILE) -o coverage.html
	@echo "✅ Coverage report: coverage.html"

.PHONY: lint
lint: ## Run linters
	@echo "🔍 Running linters..."
	@golangci-lint run --timeout=5m
	@$(GOVET) ./...
	@$(GOFMT) -d -s $(GO_FILES)

.PHONY: fmt
fmt: ## Format code
	@echo "✨ Formatting code..."
	@$(GOFMT) -s -w $(GO_FILES)
	@$(GOMOD) tidy

.PHONY: clean
clean: ## Clean build artifacts
	@echo "🧹 Cleaning..."
	@$(GOCLEAN)
	@rm -rf $(BUILD_DIR)
	@rm -f $(COVERAGE_FILE) coverage.html
	@echo "✅ Clean complete"

.PHONY: install
install: build ## Install binary to $GOPATH/bin
	@echo "📦 Installing $(BINARY_NAME)..."
	@cp $(BUILD_DIR)/$(BINARY_NAME) $(GOPATH)/bin/
	@echo "✅ Installed to $(GOPATH)/bin/$(BINARY_NAME)"

.PHONY: dev
dev: ## Run in development mode with hot reload
	@echo "🔄 Starting development mode..."
	@watchexec -r -e go,tmpl,yaml -- make build run

.PHONY: run
run: ## Run the binary
	@$(BUILD_DIR)/$(BINARY_NAME)

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t $(BINARY_NAME):latest .

.PHONY: mock-repos
mock-repos: ## Setup mock repositories for testing
	@echo "📁 Setting up mock repositories..."
	@mkdir -p testdata/superclaude/personas
	@mkdir -p testdata/superclaude/commands
	@mkdir -p testdata/opencode/internal
	@echo "✅ Mock repos created in testdata/"

.PHONY: generate
generate: ## Generate code from templates
	@echo "🏗️ Generating code..."
	@go generate ./...

.PHONY: deps
deps: ## Show and verify dependencies
	@echo "📦 Dependencies:"
	@$(GOMOD) graph
	@echo "\n🔍 Verifying..."
	@$(GOMOD) verify

.PHONY: update
update: ## Update dependencies
	@echo "⬆️ Updating dependencies..."
	@$(GOGET) -u ./...
	@$(GOMOD) tidy

.PHONY: release
release: clean lint test ## Create release build
	@echo "🚀 Building release..."
	@goreleaser release --snapshot --skip-publish --clean

# Development shortcuts
.PHONY: t
t: test ## Shortcut for test

.PHONY: b
b: build ## Shortcut for build

.PHONY: r
r: build run ## Shortcut for build and run

# CI/CD targets
.PHONY: ci
ci: lint test build ## Run CI pipeline

.PHONY: check
check: lint test ## Pre-commit checks