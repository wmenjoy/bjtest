#!/bin/bash

# Code Structure Compliance Checker
# Verifies that code follows naming conventions and architecture standards

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "========================================="
echo "Code Structure Compliance Check"
echo "========================================="
echo ""

# Change to project root
cd "$(dirname "$0")/../.."

# ===== Backend Repository Layer Checks =====
echo "Checking Backend Repository Layer..."

# Check for xxxRepo naming (should be xxxRepository)
if grep -r "type [a-z]*Repo struct" backend/internal/repository/ 2>/dev/null; then
    echo -e "${RED}✗ FAIL: Found repository structs using 'Repo' abbreviation (should be 'Repository')${NC}"
    grep -rn "type [a-z]*Repo struct" backend/internal/repository/ || true
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: All repository structs use 'Repository' suffix${NC}"
fi

# Check for public repository implementation structs
if grep -r "^type [A-Z][a-zA-Z]*Repository struct" backend/internal/repository/ --include="*_repo*.go" 2>/dev/null; then
    echo -e "${YELLOW}⚠ WARNING: Found public repository implementation structs (should be private)${NC}"
    grep -rn "^type [A-Z][a-zA-Z]*Repository struct" backend/internal/repository/ --include="*_repo*.go" || true
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ PASS: All repository implementations are private${NC}"
fi

echo ""

# ===== Backend Service Layer Checks =====
echo "Checking Backend Service Layer..."

# Check for xxxServiceImpl naming (should be xxxService in Go)
if grep -r "type [a-z]*ServiceImpl struct" backend/internal/service/ 2>/dev/null; then
    echo -e "${RED}✗ FAIL: Found service structs using 'Impl' suffix (Go style: use lowercase without suffix)${NC}"
    grep -rn "type [a-z]*ServiceImpl struct" backend/internal/service/ || true
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: No service implementations use 'Impl' suffix${NC}"
fi

echo ""

# ===== Backend Handler Layer Checks =====
echo "Checking Backend Handler Layer Architecture..."

# Check for Handler directly accessing Repository (violation of layered architecture)
if grep -r "type [A-Z][a-zA-Z]*Handler struct" backend/internal/handler/ --include="*.go" | \
   xargs -I {} sh -c 'grep -A 20 "{}" | grep -E "[a-z]+Repo[^s]" >/dev/null 2>&1' 2>/dev/null; then
    echo -e "${RED}✗ FAIL: Found handlers directly accessing repositories (should use service layer)${NC}"
    grep -rn "[a-z]*Repo[[:space:]].*repository\\..*Repository" backend/internal/handler/ --include="*.go" || true
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: Handlers follow layered architecture (Handler → Service → Repository)${NC}"
fi

echo ""

# ===== Frontend File Extension Checks =====
echo "Checking Frontend File Extensions..."

# Check for .tsx files with no JSX (should be .ts)
tsx_no_jsx_count=0
for file in $(find front/components -name "*.tsx" 2>/dev/null); do
    # Check if file contains JSX patterns (React.createElement, <, />)
    if ! grep -qE '(<[A-Z][a-zA-Z]*|<\/|React\.createElement|\{.*<)' "$file" 2>/dev/null; then
        if [ $tsx_no_jsx_count -eq 0 ]; then
            echo -e "${YELLOW}⚠ WARNING: Found .tsx files without JSX (should use .ts extension):${NC}"
        fi
        echo "  - $file"
        ((tsx_no_jsx_count++))
        ((WARNINGS++))
    fi
done

if [ $tsx_no_jsx_count -eq 0 ]; then
    echo -e "${GREEN}✓ PASS: All .tsx files contain JSX${NC}"
fi

# Check for lowercase component files (should be PascalCase)
lowercase_components=$(find front/components -name "*.tsx" -o -name "*.ts" | grep -v "/utils" | grep -E "/[a-z][a-z0-9_-]+\.(tsx|ts)$" 2>/dev/null || true)
if [ -n "$lowercase_components" ]; then
    echo -e "${YELLOW}⚠ WARNING: Found component files not using PascalCase:${NC}"
    echo "$lowercase_components"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ PASS: Component files follow PascalCase convention${NC}"
fi

echo ""

# ===== Frontend Documentation Location Checks =====
echo "Checking Frontend Documentation Location..."

# Check for markdown files in front/components (should be in docs/)
md_in_components=$(find front/components -name "*.md" 2>/dev/null || true)
if [ -n "$md_in_components" ]; then
    echo -e "${RED}✗ FAIL: Found markdown files in front/components/ (should be in docs/):${NC}"
    echo "$md_in_components"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: No markdown files in front/components/${NC}"
fi

echo ""

# ===== Interface-Based Design Checks =====
echo "Checking Interface-Based Design..."

# Verify Repository interfaces exist
repo_interfaces=$(grep -r "^type [A-Z][a-zA-Z]*Repository interface" backend/internal/repository/ --include="*.go" | wc -l || echo "0")
if [ "$repo_interfaces" -lt 5 ]; then
    echo -e "${RED}✗ FAIL: Expected at least 5 repository interfaces, found $repo_interfaces${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: Found $repo_interfaces repository interfaces${NC}"
fi

# Verify Service interfaces exist
service_interfaces=$(grep -r "^type [A-Z][a-zA-Z]*Service interface" backend/internal/service/ --include="*.go" | wc -l || echo "0")
if [ "$service_interfaces" -lt 5 ]; then
    echo -e "${RED}✗ FAIL: Expected at least 5 service interfaces, found $service_interfaces${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ PASS: Found $service_interfaces service interfaces${NC}"
fi

echo ""

# ===== Summary =====
echo "========================================="
echo "Compliance Check Summary"
echo "========================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ COMPLIANCE CHECK FAILED${NC}"
    echo "Please fix the errors above before committing."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ COMPLIANCE CHECK PASSED WITH WARNINGS${NC}"
    echo "Consider addressing the warnings above."
    exit 0
else
    echo -e "${GREEN}✓ ALL COMPLIANCE CHECKS PASSED${NC}"
    exit 0
fi
