.PHONY: help install dev build test clean docker-up docker-down

# Default target
help:
	@echo "AuZap - Available Commands:"
	@echo ""
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development (API + Worker + Frontend)"
	@echo "  make build        - Build all projects"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linting"
	@echo "  make format       - Format code with Prettier"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make clean        - Clean node_modules and build artifacts"
	@echo "  make reset        - Clean + install"
	@echo ""

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

docker-up:
	docker-compose up -d
	@echo "✅ Docker services started!"
	@echo "   Redis:        localhost:6379"
	@echo "   PostgreSQL:   localhost:5432"
	@echo "   RedisInsight: http://localhost:8001"
	@echo "   Adminer:      http://localhost:8080"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

clean:
	rm -rf node_modules backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist

reset: clean install
	@echo "✅ Project reset complete!"
