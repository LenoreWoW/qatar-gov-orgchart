import { apiService } from './api';
import type { AuditFilter } from './auditService';
import { auditService, AuditLog } from './auditService';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'xlsx';
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'local' | 'custom';
  customDateFormat?: string;
  delimiter?: string; // For CSV
  compression?: boolean;
  password?: string; // For password-protected exports
}

export interface ExportProgress {
  percentage: number;
  stage: string;
  recordsProcessed: number;
  totalRecords: number;
  estimatedTimeRemaining?: number;
}

export interface ExportJob {
  id: string;
  type: 'audit_logs' | 'compliance_report' | 'retention_report' | 'user_activity';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  downloadUrl?: string;
  fileSize?: string;
  recordCount?: number;
  error?: string;
  options: ExportOptions;
  filter?: any;
}

class ExportService {
  private activeJobs: Map<string, ExportJob> = new Map();
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> = new Map();

  /**
   * Export audit logs with various format options
   */
  async exportAuditLogs(
    filter?: AuditFilter,
    options: ExportOptions = { format: 'csv' }
  ): Promise<{ jobId: string; url?: string }> {
    try {
      const jobId = this.generateJobId();

      // Create export job
      const job: ExportJob = {
        id: jobId,
        type: 'audit_logs',
        format: options.format,
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        options,
        filter,
      };

      this.activeJobs.set(jobId, job);

      // Log export activity
      auditService.logDataAccess('audit_logs', 'export', 'success', {
        jobId,
        format: options.format,
        filter,
      });

      // For small datasets, export immediately
      if (this.isSmallDataset(filter)) {
        const url = await this.performImmediateExport(job);
        job.status = 'completed';
        job.progress = 100;
        job.endTime = new Date().toISOString();
        job.downloadUrl = url;

        return { jobId, url };
      }

      // For large datasets, start background job
      this.startBackgroundExport(job);
      return { jobId };
    } catch (error) {
      auditService.logDataAccess('audit_logs', 'export', 'failure', {
        error: (error as Error).message,
        filter,
        options,
      });
      throw error;
    }
  }

  /**
   * Export compliance report
   */
  async exportComplianceReport(
    startDate: string,
    endDate: string,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<{ jobId: string; url?: string }> {
    try {
      const jobId = this.generateJobId();

      const job: ExportJob = {
        id: jobId,
        type: 'compliance_report',
        format: options.format,
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        options,
        filter: { startDate, endDate },
      };

      this.activeJobs.set(jobId, job);

      auditService.logDataAccess('compliance_report', 'export', 'success', {
        jobId,
        format: options.format,
        startDate,
        endDate,
      });

      // Generate compliance report
      const url = await this.generateComplianceReport(job);
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date().toISOString();
      job.downloadUrl = url;

      return { jobId, url };
    } catch (error) {
      auditService.logDataAccess('compliance_report', 'export', 'failure', {
        error: (error as Error).message,
        startDate,
        endDate,
        options,
      });
      throw error;
    }
  }

  /**
   * Export data retention report
   */
  async exportRetentionReport(
    policyId?: string,
    options: ExportOptions = { format: 'xlsx' }
  ): Promise<{ jobId: string; url?: string }> {
    try {
      const jobId = this.generateJobId();

      const job: ExportJob = {
        id: jobId,
        type: 'retention_report',
        format: options.format,
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        options,
        filter: { policyId },
      };

      this.activeJobs.set(jobId, job);

      auditService.logDataAccess('retention_report', 'export', 'success', {
        jobId,
        format: options.format,
        policyId,
      });

      const url = await this.generateRetentionReport(job);
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date().toISOString();
      job.downloadUrl = url;

      return { jobId, url };
    } catch (error) {
      auditService.logDataAccess('retention_report', 'export', 'failure', {
        error: (error as Error).message,
        policyId,
        options,
      });
      throw error;
    }
  }

  /**
   * Export user activity report
   */
  async exportUserActivityReport(
    userId?: string,
    startDate?: string,
    endDate?: string,
    options: ExportOptions = { format: 'csv' }
  ): Promise<{ jobId: string; url?: string }> {
    try {
      const jobId = this.generateJobId();

      const job: ExportJob = {
        id: jobId,
        type: 'user_activity',
        format: options.format,
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        options,
        filter: { userId, startDate, endDate },
      };

      this.activeJobs.set(jobId, job);

      auditService.logDataAccess('user_activity', 'export', 'success', {
        jobId,
        format: options.format,
        userId,
        startDate,
        endDate,
      });

      const url = await this.generateUserActivityReport(job);
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date().toISOString();
      job.downloadUrl = url;

      return { jobId, url };
    } catch (error) {
      auditService.logDataAccess('user_activity', 'export', 'failure', {
        error: (error as Error).message,
        userId,
        startDate,
        endDate,
        options,
      });
      throw error;
    }
  }

  /**
   * Get export job status
   */
  getJobStatus(jobId: string): ExportJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all export jobs
   */
  getAllJobs(): ExportJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel an export job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.endTime = new Date().toISOString();

      auditService.logConfiguration('export_job', 'cancelled', 'success', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Register progress callback for a job
   */
  onProgress(jobId: string, callback: (progress: ExportProgress) => void): void {
    this.progressCallbacks.set(jobId, callback);
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(jobId: string): void {
    this.progressCallbacks.delete(jobId);
  }

  /**
   * Download exported file
   */
  async downloadFile(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job || !job.downloadUrl) {
      throw new Error('Export job not found or file not ready');
    }

    try {
      // In a real implementation, this would fetch the file from the server
      const response = await fetch(job.downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFilename(job);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      auditService.logDataAccess('export_file', 'download', 'success', {
        jobId,
        filename: this.generateFilename(job),
      });
    } catch (error) {
      auditService.logDataAccess('export_file', 'download', 'failure', {
        jobId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Clean up old export jobs
   */
  cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [jobId, job] of this.activeJobs.entries()) {
      const jobAge = now - new Date(job.startTime).getTime();
      if (jobAge > maxAge) {
        this.activeJobs.delete(jobId);
        this.progressCallbacks.delete(jobId);
      }
    }
  }

  // Private methods

  private generateJobId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSmallDataset(filter?: AuditFilter): boolean {
    // Simple heuristic - in production, this would check actual record count
    return !filter || (!filter.startDate && !filter.endDate);
  }

  private async performImmediateExport(job: ExportJob): Promise<string> {
    // Simulate export process
    this.updateProgress(job.id, {
      percentage: 25,
      stage: 'Fetching data',
      recordsProcessed: 0,
      totalRecords: 1000,
    });

    await this.delay(500);
    this.updateProgress(job.id, {
      percentage: 50,
      stage: 'Processing data',
      recordsProcessed: 500,
      totalRecords: 1000,
    });

    await this.delay(500);
    this.updateProgress(job.id, {
      percentage: 75,
      stage: 'Generating file',
      recordsProcessed: 750,
      totalRecords: 1000,
    });

    await this.delay(500);
    this.updateProgress(job.id, {
      percentage: 100,
      stage: 'Complete',
      recordsProcessed: 1000,
      totalRecords: 1000,
    });

    // In production, this would return actual file URL
    return `https://api.example.com/exports/${job.id}/download`;
  }

  private async startBackgroundExport(job: ExportJob): Promise<void> {
    job.status = 'processing';

    // Simulate long-running export
    const totalSteps = 10;
    for (let i = 0; i <= totalSteps; i++) {
      await this.delay(1000);
      const progress = (i / totalSteps) * 100;
      this.updateProgress(job.id, {
        percentage: progress,
        stage: i === totalSteps ? 'Complete' : `Processing step ${i + 1}/${totalSteps}`,
        recordsProcessed: Math.floor((i / totalSteps) * 10000),
        totalRecords: 10000,
      });
    }

    job.status = 'completed';
    job.progress = 100;
    job.endTime = new Date().toISOString();
    job.downloadUrl = `https://api.example.com/exports/${job.id}/download`;
  }

  private async generateComplianceReport(job: ExportJob): Promise<string> {
    // Simulate compliance report generation
    this.updateProgress(job.id, {
      percentage: 25,
      stage: 'Collecting audit data',
      recordsProcessed: 0,
      totalRecords: 100,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 50,
      stage: 'Analyzing compliance metrics',
      recordsProcessed: 50,
      totalRecords: 100,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 75,
      stage: 'Generating report',
      recordsProcessed: 75,
      totalRecords: 100,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 100,
      stage: 'Complete',
      recordsProcessed: 100,
      totalRecords: 100,
    });

    return `https://api.example.com/exports/${job.id}/compliance-report.pdf`;
  }

  private async generateRetentionReport(job: ExportJob): Promise<string> {
    // Simulate retention report generation
    this.updateProgress(job.id, {
      percentage: 33,
      stage: 'Analyzing retention policies',
      recordsProcessed: 0,
      totalRecords: 50,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 66,
      stage: 'Calculating storage metrics',
      recordsProcessed: 25,
      totalRecords: 50,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 100,
      stage: 'Complete',
      recordsProcessed: 50,
      totalRecords: 50,
    });

    return `https://api.example.com/exports/${job.id}/retention-report.xlsx`;
  }

  private async generateUserActivityReport(job: ExportJob): Promise<string> {
    // Simulate user activity report generation
    this.updateProgress(job.id, {
      percentage: 50,
      stage: 'Collecting user activity data',
      recordsProcessed: 0,
      totalRecords: 500,
    });
    await this.delay(500);

    this.updateProgress(job.id, {
      percentage: 100,
      stage: 'Complete',
      recordsProcessed: 500,
      totalRecords: 500,
    });

    return `https://api.example.com/exports/${job.id}/user-activity.csv`;
  }

  private updateProgress(jobId: string, progress: ExportProgress): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.progress = progress.percentage;
    }

    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(progress);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateFilename(job: ExportJob): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getFileExtension(job.format);
    return `${job.type}_${timestamp}_${job.id.substr(-8)}.${extension}`;
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'pdf':
        return 'pdf';
      case 'xlsx':
        return 'xlsx';
      default:
        return 'txt';
    }
  }

  /**
   * Get available export formats for a given report type
   */
  getAvailableFormats(reportType: string): string[] {
    switch (reportType) {
      case 'audit_logs':
        return ['csv', 'json', 'xlsx'];
      case 'compliance_report':
        return ['pdf', 'xlsx'];
      case 'retention_report':
        return ['xlsx', 'csv'];
      case 'user_activity':
        return ['csv', 'json'];
      default:
        return ['csv'];
    }
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    if (!['csv', 'json', 'pdf', 'xlsx'].includes(options.format)) {
      errors.push('Invalid export format');
    }

    if (options.format === 'csv' && options.delimiter && options.delimiter.length !== 1) {
      errors.push('CSV delimiter must be a single character');
    }

    if (options.password && options.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return errors;
  }

  /**
   * Get export statistics
   */
  getExportStatistics(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    processingJobs: number;
    averageExportTime: number;
  } {
    const jobs = Array.from(this.activeJobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');
    const processingJobs = jobs.filter(job => job.status === 'processing');

    const averageExportTime =
      completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            if (job.endTime) {
              return sum + (new Date(job.endTime).getTime() - new Date(job.startTime).getTime());
            }
            return sum;
          }, 0) / completedJobs.length
        : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      processingJobs: processingJobs.length,
      averageExportTime: Math.round(averageExportTime / 1000), // Convert to seconds
    };
  }
}

// Create singleton instance
export const exportService = new ExportService();

// Start cleanup interval
setInterval(
  () => {
    exportService.cleanupOldJobs();
  },
  60 * 60 * 1000
); // Clean up every hour

// Export for use in other modules
export default exportService;
