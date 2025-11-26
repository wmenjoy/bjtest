#!/bin/bash
# 文档自动清理脚本
# 版本: 1.0
# 用途: 自动识别和归档临时文档

set -e

DOCS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_ROOT="$DOCS_ROOT/7-archive"
CURRENT_MONTH=$(date +%Y-%m)

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_detail() {
    echo -e "${BLUE}  →${NC} $1"
}

# 1. 扫描临时文件
scan_temp_files() {
    log_info "扫描临时文件..."

    find "$DOCS_ROOT" -maxdepth 1 -type f -name "*.md" | while read file; do
        filename=$(basename "$file")

        # 跳过永久文件
        if [[ "$filename" == "README.md" ]] || [[ "$filename" == "directory-standards.md" ]]; then
            continue
        fi

        # 检查临时文件模式
        if [[ "$filename" =~ ^(temp-|todo-|analysis-|migration-|compliance-) ]] || \
           [[ "$filename" =~ -(plan|report|todo)\.md$ ]]; then
            echo "$file"
        fi
    done
}

# 2. 检查文件状态
check_file_status() {
    local file=$1

    # 检查是否标记为"已完成"
    if grep -q "状态.*已完成" "$file" 2>/dev/null || grep -q "状态.*✅.*完成" "$file" 2>/dev/null; then
        echo "completed"
        return 0
    fi

    # 检查文件年龄（30天）
    if [[ $(uname) == "Darwin" ]]; then
        file_age=$(( ($(date +%s) - $(stat -f %m "$file")) / 86400 ))
    else
        file_age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
    fi

    if [[ $file_age -gt 30 ]]; then
        echo "old:$file_age"
        return 0
    fi

    echo "keep"
    return 1
}

# 3. 归档文件
archive_file() {
    local file=$1
    local filename=$(basename "$file")

    # 根据文件名确定归档分类
    local category=""
    if [[ "$filename" =~ ^migration- ]] || [[ "$filename" =~ -migration- ]]; then
        category="migration-records"
    elif [[ "$filename" =~ ^analysis- ]] || [[ "$filename" =~ -analysis- ]] || [[ "$filename" =~ -report\.md$ ]]; then
        category="analysis-reports"
    elif [[ "$filename" =~ ^todo- ]] || [[ "$filename" =~ -plan\.md$ ]] || [[ "$filename" =~ -todo\.md$ ]]; then
        category="planning-archives"
    else
        category="misc"
    fi

    # 创建归档目录
    local archive_dir="$ARCHIVE_ROOT/$category/$CURRENT_MONTH"
    mkdir -p "$archive_dir"

    # 移动文件
    mv "$file" "$archive_dir/"
    log_detail "归档: $filename → $category/$CURRENT_MONTH/"
}

# 4. 主函数
main() {
    local mode=${1:-check}  # check | archive | delete

    log_info "文档清理工具 v1.0"
    log_info "模式: $mode"
    log_info "========================================="

    local temp_files=($(scan_temp_files))

    if [[ ${#temp_files[@]} -eq 0 ]]; then
        log_info "✅ 未发现需要清理的临时文件"
        return
    fi

    log_info "发现 ${#temp_files[@]} 个临时文件"
    echo ""

    local count_completed=0
    local count_old=0
    local count_keep=0

    for file in "${temp_files[@]}"; do
        local status=$(check_file_status "$file")
        local filename=$(basename "$file")

        case "$status" in
            completed)
                if [[ "$mode" == "archive" ]]; then
                    archive_file "$file"
                    ((count_completed++))
                elif [[ "$mode" == "delete" ]]; then
                    rm "$file"
                    log_warn "删除: $filename (已完成)"
                    ((count_completed++))
                else
                    log_detail "可清理: $filename (已完成)"
                    ((count_completed++))
                fi
                ;;
            old:*)
                local age=${status#old:}
                if [[ "$mode" == "archive" ]]; then
                    archive_file "$file"
                    ((count_old++))
                elif [[ "$mode" == "delete" ]]; then
                    rm "$file"
                    log_warn "删除: $filename (${age}天前创建)"
                    ((count_old++))
                else
                    log_detail "可清理: $filename (${age}天前创建)"
                    ((count_old++))
                fi
                ;;
            keep)
                log_detail "保留: $filename (进行中)"
                ((count_keep++))
                ;;
        esac
    done

    echo ""
    log_info "========================================="
    log_info "统计信息:"
    log_detail "已完成文件: $count_completed"
    log_detail "超期文件: $count_old"
    log_detail "保留文件: $count_keep"
    log_info "========================================="

    if [[ "$mode" == "check" ]]; then
        log_info "💡 提示: 运行 '$0 archive' 归档临时文件"
    fi
}

# 使用说明
usage() {
    cat << 'EOF'
文档清理脚本 v1.0

用法:
    ./cleanup-docs.sh [模式]

模式:
    check    - 检查可清理文件（默认）
    archive  - 归档临时文件到7-archive/
    delete   - 直接删除临时文件（谨慎使用）

临时文件识别规则:
    1. 文件名前缀: temp-, todo-, analysis-, migration-, compliance-
    2. 文件名后缀: -plan.md, -report.md, -todo.md
    3. 文件状态: 标记为"已完成"
    4. 文件年龄: 超过30天

归档目录结构:
    docs/7-archive/
    ├── migration-records/  # 迁移记录
    ├── analysis-reports/   # 分析报告
    ├── planning-archives/  # 计划归档
    └── misc/              # 其他

示例:
    ./cleanup-docs.sh              # 检查模式
    ./cleanup-docs.sh check        # 检查模式
    ./cleanup-docs.sh archive      # 归档模式
    ./cleanup-docs.sh delete       # 删除模式

EOF
}

# 参数检查
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
fi

if [[ "$1" == "delete" ]]; then
    read -p "⚠️  确认要删除临时文件吗？这是不可逆操作 (y/N): " confirm
    if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
        log_warn "已取消删除操作"
        exit 0
    fi
fi

# 执行主函数
main "$1"
