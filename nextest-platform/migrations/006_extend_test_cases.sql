-- Migration 006: Extend Test Cases for Value Scoring and Statistics
-- This migration adds columns needed for test case value assessment and execution statistics

-- Add value scoring columns
ALTER TABLE test_cases ADD COLUMN coverage_score INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN stability_score INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN efficiency_score INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN maintainability_score INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN overall_score INTEGER DEFAULT 0;

-- Add execution statistics columns
ALTER TABLE test_cases ADD COLUMN execution_count INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN success_count INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN failure_count INTEGER DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN avg_duration INTEGER DEFAULT 0;  -- in milliseconds
ALTER TABLE test_cases ADD COLUMN success_rate INTEGER DEFAULT 0;  -- percentage 0-100
ALTER TABLE test_cases ADD COLUMN last_run_at DATETIME;
ALTER TABLE test_cases ADD COLUMN last_success_at DATETIME;
ALTER TABLE test_cases ADD COLUMN last_failure_at DATETIME;

-- Add flaky test detection columns
ALTER TABLE test_cases ADD COLUMN is_flaky BOOLEAN DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN flaky_score INTEGER DEFAULT 0;  -- 0-100, higher = more flaky
ALTER TABLE test_cases ADD COLUMN consecutive_failures INTEGER DEFAULT 0;

-- Add ownership and maintenance columns
ALTER TABLE test_cases ADD COLUMN owner_id VARCHAR(100);
ALTER TABLE test_cases ADD COLUMN last_modified_by VARCHAR(100);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_test_cases_owner_id ON test_cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_flaky ON test_cases(is_flaky);
CREATE INDEX IF NOT EXISTS idx_test_cases_success_rate ON test_cases(success_rate);
CREATE INDEX IF NOT EXISTS idx_test_cases_last_run_at ON test_cases(last_run_at);
CREATE INDEX IF NOT EXISTS idx_test_cases_overall_score ON test_cases(overall_score);
CREATE INDEX IF NOT EXISTS idx_test_cases_execution_count ON test_cases(execution_count);
CREATE INDEX IF NOT EXISTS idx_test_cases_coverage_score ON test_cases(coverage_score);
CREATE INDEX IF NOT EXISTS idx_test_cases_stability_score ON test_cases(stability_score);
