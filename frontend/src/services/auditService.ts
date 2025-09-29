import { apiService } from './api';

export interface AuditEvent {
  event: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  outcome?: 'success' | 'failure' | 'partial';
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  event: string;
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  event?: string;
  resource?: string;
  action?: string;
  outcome?: 'success' | 'failure' | 'partial';
  page?: number;
  limit?: number;
}

export interface AuditStats {
  totalEvents: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  topEvents: Array<{
    event: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    username: string;
    actionCount: number;
  }>;
  activityByHour: Array<{
    hour: number;
    count: number;
  }>;
}

class AuditService {
  private sessionId: string;
  private queue: AuditEvent[] = [];
  private isProcessing = false;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchProcessing();
    this.setupPageUnloadHandler();
  }

  /**
   * Log an audit event
   */
  logEvent(event: AuditEvent): void {
    const enrichedEvent: AuditEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
      },
    };

    this.queue.push(enrichedEvent);

    // Process immediately for critical events
    if (this.isCriticalEvent(event.event)) {
      this.flush();
    }
  }

  /**
   * Log user authentication events
   */
  logAuthentication(
    action: 'login' | 'logout' | 'session_expired',
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      event: 'authentication',
      action,
      outcome,
      details: {
        ...details,
        authMethod: 'credentials',
      },
    });
  }

  /**
   * Log user navigation events
   */
  logNavigation(page: string, details?: Record<string, any>): void {
    this.logEvent({
      event: 'page_view',
      resource: 'page',
      action: 'view',
      outcome: 'success',
      details: {
        page,
        ...details,
      },
    });
  }

  /**
   * Log data access events
   */
  logDataAccess(
    resource: string,
    action: string,
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      event: 'data_access',
      resource,
      action,
      outcome,
      details,
    });
  }

  /**
   * Log data modification events
   */
  logDataModification(
    resource: string,
    action: 'create' | 'update' | 'delete',
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      event: 'data_modification',
      resource,
      action,
      outcome,
      details,
    });
  }

  /**
   * Log permission/authorization events
   */
  logAuthorization(
    resource: string,
    action: string,
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      event: 'authorization',
      resource,
      action,
      outcome,
      details,
    });
  }

  /**
   * Log security events
   */
  logSecurity(action: string, outcome: 'success' | 'failure', details?: Record<string, any>): void {
    this.logEvent({
      event: 'security',
      action,
      outcome,
      details,
    });
  }

  /**
   * Log system errors
   */
  logError(error: Error, context?: Record<string, any>): void {
    this.logEvent({
      event: 'system_error',
      action: 'error_occurred',
      outcome: 'failure',
      details: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        ...context,
      },
    });
  }

  /**
   * Log user configuration changes
   */
  logConfiguration(
    resource: string,
    action: string,
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      event: 'configuration_change',
      resource,
      action,
      outcome,
      details,
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter?: AuditFilter): Promise<{ data: AuditLog[]; pagination: any }> {
    try {
      return await apiService.getAuditLogs(filter);
    } catch (error) {
      this.logError(error as Error, { context: 'getAuditLogs', filter });
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(startDate?: string, endDate?: string): Promise<AuditStats> {
    try {
      return await apiService.getAuditStats(startDate, endDate);
    } catch (error) {
      this.logError(error as Error, { context: 'getAuditStats', startDate, endDate });
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    filter?: AuditFilter,
    format: 'csv' | 'json' | 'pdf' = 'csv'
  ): Promise<Blob> {
    try {
      this.logDataAccess('audit_logs', 'export', 'success', { format, filter });
      return await apiService.exportAuditLogs(filter, format);
    } catch (error) {
      this.logDataAccess('audit_logs', 'export', 'failure', {
        format,
        filter,
        error: (error as Error).message,
      });
      this.logError(error as Error, { context: 'exportAuditLogs', filter, format });
      throw error;
    }
  }

  /**
   * Flush all queued events immediately
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      await apiService.batchAuditLogs(events);
    } catch (error) {
      // Re-queue failed events
      this.queue.unshift(...events);
      console.error('Failed to send audit logs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if an event is critical and should be sent immediately
   */
  private isCriticalEvent(event: string): boolean {
    const criticalEvents = [
      'authentication',
      'authorization',
      'security',
      'system_error',
      'data_modification',
    ];
    return criticalEvents.includes(event);
  }

  /**
   * Start batch processing of queued events
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      if (this.queue.length >= this.batchSize) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Setup page unload handler to flush remaining events
   */
  private setupPageUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        // Use sendBeacon for reliability during page unload
        try {
          const data = JSON.stringify({ events: this.queue });
          navigator.sendBeacon('/api/v1/audit/batch', data);
        } catch (error) {
          console.error('Failed to send audit logs on page unload:', error);
        }
      }
    });

    // Also flush on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.queue.length > 0) {
        this.flush();
      }
    });
  }
}

// Create singleton instance
export const auditService = new AuditService();

// React hook for audit logging
export const useAuditLogger = () => {
  return {
    logEvent: auditService.logEvent.bind(auditService),
    logAuthentication: auditService.logAuthentication.bind(auditService),
    logNavigation: auditService.logNavigation.bind(auditService),
    logDataAccess: auditService.logDataAccess.bind(auditService),
    logDataModification: auditService.logDataModification.bind(auditService),
    logAuthorization: auditService.logAuthorization.bind(auditService),
    logSecurity: auditService.logSecurity.bind(auditService),
    logError: auditService.logError.bind(auditService),
    logConfiguration: auditService.logConfiguration.bind(auditService),
  };
};

// Export for use in other modules
export default auditService;
