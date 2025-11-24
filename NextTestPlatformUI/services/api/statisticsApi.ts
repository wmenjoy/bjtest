/**
 * Statistics API Service
 * Provides test statistics data from backend
 */

import { apiClient } from './apiClient';

export interface TestStatistics {
  totalTests: number;
  myTests: number;
  p0Tests: number;
  flakyTests: number;
  longRunningTests: number;
  notRunRecently: number;
  tagCloud: Record<string, number>;
}

export const statisticsApi = {
  /**
   * Get aggregated test statistics
   * GET /api/tests/statistics
   */
  async getStatistics(): Promise<TestStatistics> {
    try {
      return await apiClient.get<TestStatistics>('/tests/statistics');
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // Return default values if API fails
      return {
        totalTests: 0,
        myTests: 0,
        p0Tests: 0,
        flakyTests: 0,
        longRunningTests: 0,
        notRunRecently: 0,
        tagCloud: {},
      };
    }
  },
};
