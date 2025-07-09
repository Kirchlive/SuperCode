# Build stage
FROM golang:1.21-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o supercode ./cmd/supercode

# Final stage
FROM alpine:latest

# Install ca-certificates and git
RUN apk --no-cache add ca-certificates git

# Create non-root user
RUN addgroup -g 1000 supercode && \
    adduser -D -u 1000 -G supercode supercode

# Copy binary from builder
COPY --from=builder /app/supercode /usr/local/bin/supercode

# Set ownership
RUN chown -R supercode:supercode /usr/local/bin/supercode

# Create working directory
WORKDIR /workspace
RUN chown -R supercode:supercode /workspace

# Switch to non-root user
USER supercode

# Entry point
ENTRYPOINT ["supercode"]