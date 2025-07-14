import { HealthStatus, ServiceMetrics } from './types.js';
import { vectorStore } from './vector-store.js';

class MetricsService {
  private startTime: Date = new Date();
  private requestCount: number = 0;
  private activeSessions: number = 0;

  /**
   * Increment request counter
   */
  incrementRequests(): void {
    this.requestCount++;
  }

  /**
   * Set active sessions count
   */
  setActiveSessions(count: number): void {
    this.activeSessions = count;
  }

  /**
   * Get service health status
   */
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'docusaurus-mcp-server',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): ServiceMetrics {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    return {
      uptime: uptimeSeconds,
      total_requests: this.requestCount,
      active_sessions: this.activeSessions,
      documents_count: vectorStore.size(),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.startTime = new Date();
    this.requestCount = 0;
    this.activeSessions = 0;
  }
}

// Export singleton instance
export const metricsService = new MetricsService(); 