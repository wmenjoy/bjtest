/**
 * Test Case Statistics API
 *
 * 提供测试用例统计数据和过滤功能的 API 接口
 * 对应后端 API:
 * - GET /api/tests/statistics - 获取测试用例统计
 * - GET /api/tests/flaky - 获取不稳定测试用例
 */

import { apiClient } from './apiClient';

// ===== 类型定义 =====

/**
 * 测试统计数据
 */
export interface TestStatistics {
  /** 总测试用例数 */
  totalTests: number;
  /** 我的测试用例数 */
  myTests: number;
  /** P0 优先级测试用例数 */
  p0Tests: number;
  /** 不稳定测试用例数 */
  flakyTests: number;
  /** 长时间运行测试用例数 */
  longRunningTests: number;
  /** 最近未运行测试用例数 */
  notRunRecently: number;
  /** 标签云 - 标签名到使用次数的映射 */
  tagCloud: Record<string, number>;
}

/**
 * 不稳定测试用例
 */
export interface FlakyTest {
  /** 测试用例 ID */
  id: string;
  /** 测试用例标题 */
  title: string;
  /** 失败率 (0-1) */
  failureRate: number;
  /** 最近运行次数 */
  recentRuns: number;
  /** 最近失败次数 */
  recentFailures: number;
}

/**
 * 不稳定测试列表响应
 */
export interface FlakyTestsResponse {
  /** 不稳定测试列表 */
  flakyTests: FlakyTest[];
  /** 总数 */
  total: number;
}

// ===== API 接口 =====

/**
 * 测试用例统计 API
 */
export const testCaseStatsApi = {
  /**
   * 获取测试用例统计数据
   * GET /api/tests/statistics
   *
   * @param userId - 用户 ID (可选,默认 'current-user')
   * @returns 测试统计数据
   *
   * @example
   * ```typescript
   * const stats = await testCaseStatsApi.getStatistics();
   * console.log(`Total tests: ${stats.totalTests}`);
   * ```
   */
  async getStatistics(userId: string = 'current-user'): Promise<TestStatistics> {
    return apiClient.get<TestStatistics>('/tests/statistics', { userId });
  },

  /**
   * 获取不稳定测试用例列表
   * GET /api/tests/flaky
   *
   * @param limit - 返回的最大数量 (默认 10)
   * @returns 不稳定测试用例列表
   *
   * @example
   * ```typescript
   * const result = await testCaseStatsApi.getFlakyTests(20);
   * result.flakyTests.forEach(test => {
   *   console.log(`${test.title}: ${test.failureRate * 100}% failure rate`);
   * });
   * ```
   */
  async getFlakyTests(limit: number = 10): Promise<FlakyTestsResponse> {
    return apiClient.get<FlakyTestsResponse>('/tests/flaky', { limit });
  },
};
