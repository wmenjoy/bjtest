# Product Overview

## NexTest Platform

An enterprise-grade test management and automation platform that provides comprehensive test lifecycle management with workflow orchestration capabilities.

### Core Value Proposition

- **Test Management**: Hierarchical test case organization with support for multiple test types (HTTP, Command, Workflow, Integration, Performance, Database, Security, gRPC, WebSocket, E2E)
- **Workflow Orchestration**: YAML-based multi-step test workflows with data passing, conditional execution, and error handling
- **Real-time Monitoring**: WebSocket-based live execution tracking with step-by-step data flow visualization
- **Multi-tenancy**: Full tenant and project isolation for enterprise deployments
- **Environment Management**: Multiple environment configurations (Dev/Staging/Prod) with variable injection

### Key Features

- Batch test data import (CSV, Excel, JSON, YAML)
- Lua scripting for custom logic and assertions
- Template system for standardized test creation
- Visual workflow editor and YAML editor
- Database table management for test data preparation
- CI/CD integration support
- Comprehensive test history and reporting

### Target Users

- QA Engineers: Test case creation and execution
- Automation Engineers: Complex workflow orchestration
- Test Managers: Team coordination and quality metrics
- Developers: Quick problem diagnosis and test coverage

### Architecture

- **Backend**: Go-based REST API with Gin framework
- **Frontend**: React + TypeScript with Vite
- **Database**: SQLite/PostgreSQL/MySQL with GORM ORM
- **Real-time**: WebSocket for live updates
