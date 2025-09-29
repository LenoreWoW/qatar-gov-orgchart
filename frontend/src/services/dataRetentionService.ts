import { apiService } from './api';
import { auditService } from './auditService';

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionPeriodDays: number;
  dataTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionPolicyFormData {
  name: string;
  description: string;
  retentionPeriodDays: number;
  dataTypes: string[];
  isActive: boolean;
}

export interface RetentionStats {
  totalRecords: number;
  recordsToArchive: number;
  recordsToDelete: number;
  lastCleanupDate: string;
  nextCleanupDate: string;
  storageUsed: string;
  projectedSavings: string;
}

export interface CleanupJob {
  id: string;
  policyId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsArchived: number;
  recordsDeleted: number;
  errorMessage?: string;
}

class DataRetentionService {
  private readonly DEFAULT_POLICIES = [
    {
      name: 'Audit Logs - Standard',
      description: 'Standard retention for general audit logs',
      retentionPeriodDays: 365,
      dataTypes: ['page_view', 'data_access'],
      isActive: true,
    },
    {
      name: 'Security Events - Extended',
      description: 'Extended retention for security-related events',
      retentionPeriodDays: 2555, // 7 years
      dataTypes: ['authentication', 'authorization', 'security'],
      isActive: true,
    },
    {
      name: 'Data Modifications - Compliance',
      description: 'Compliance retention for data modification events',
      retentionPeriodDays: 1825, // 5 years
      dataTypes: ['data_modification', 'configuration_change'],
      isActive: true,
    },
    {
      name: 'System Errors - Short Term',
      description: 'Short term retention for system errors',
      retentionPeriodDays: 90,
      dataTypes: ['system_error'],
      isActive: true,
    },
  ];

  /**
   * Get all retention policies
   */
  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      // For now, return default policies. In production, this would fetch from backend
      const policies: RetentionPolicy[] = this.DEFAULT_POLICIES.map((policy, index) => ({
        id: `policy-${index + 1}`,
        ...policy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      auditService.logDataAccess('retention_policies', 'view', 'success');
      return policies;
    } catch (error) {
      auditService.logDataAccess('retention_policies', 'view', 'failure', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create a new retention policy
   */
  async createRetentionPolicy(data: RetentionPolicyFormData): Promise<{ id: string }> {
    try {
      // Validate retention period
      if (data.retentionPeriodDays < 1) {
        throw new Error('Retention period must be at least 1 day');
      }

      if (data.retentionPeriodDays > 3650) {
        throw new Error('Retention period cannot exceed 10 years');
      }

      // In production, this would call the backend API
      const id = `policy-${Date.now()}`;

      auditService.logDataModification('retention_policies', 'create', 'success', {
        policyId: id,
        retentionPeriodDays: data.retentionPeriodDays,
        dataTypes: data.dataTypes,
      });

      return { id };
    } catch (error) {
      auditService.logDataModification('retention_policies', 'create', 'failure', {
        error: (error as Error).message,
        data,
      });
      throw error;
    }
  }

  /**
   * Update an existing retention policy
   */
  async updateRetentionPolicy(id: string, data: Partial<RetentionPolicyFormData>): Promise<void> {
    try {
      if (data.retentionPeriodDays && data.retentionPeriodDays < 1) {
        throw new Error('Retention period must be at least 1 day');
      }

      if (data.retentionPeriodDays && data.retentionPeriodDays > 3650) {
        throw new Error('Retention period cannot exceed 10 years');
      }

      // In production, this would call the backend API

      auditService.logDataModification('retention_policies', 'update', 'success', {
        policyId: id,
        changes: data,
      });
    } catch (error) {
      auditService.logDataModification('retention_policies', 'update', 'failure', {
        policyId: id,
        error: (error as Error).message,
        data,
      });
      throw error;
    }
  }

  /**
   * Delete a retention policy
   */
  async deleteRetentionPolicy(id: string): Promise<void> {
    try {
      // In production, this would call the backend API

      auditService.logDataModification('retention_policies', 'delete', 'success', {
        policyId: id,
      });
    } catch (error) {
      auditService.logDataModification('retention_policies', 'delete', 'failure', {
        policyId: id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(): Promise<RetentionStats> {
    try {
      // In production, this would fetch real statistics from the backend
      const stats: RetentionStats = {
        totalRecords: 156780,
        recordsToArchive: 12450,
        recordsToDelete: 3200,
        lastCleanupDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextCleanupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        storageUsed: '2.4 GB',
        projectedSavings: '340 MB',
      };

      auditService.logDataAccess('retention_stats', 'view', 'success');
      return stats;
    } catch (error) {
      auditService.logDataAccess('retention_stats', 'view', 'failure', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Start a cleanup job
   */
  async startCleanupJob(policyId?: string): Promise<{ jobId: string }> {
    try {
      const jobId = `job-${Date.now()}`;

      // In production, this would trigger a backend cleanup job

      auditService.logConfiguration('data_retention', 'cleanup_started', 'success', {
        jobId,
        policyId,
      });

      return { jobId };
    } catch (error) {
      auditService.logConfiguration('data_retention', 'cleanup_started', 'failure', {
        policyId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get cleanup job history
   */
  async getCleanupJobs(limit = 20): Promise<CleanupJob[]> {
    try {
      // In production, this would fetch from backend
      const jobs: CleanupJob[] = [
        {
          id: 'job-1',
          policyId: 'policy-1',
          status: 'completed',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
          recordsProcessed: 5000,
          recordsArchived: 3000,
          recordsDeleted: 2000,
        },
        {
          id: 'job-2',
          policyId: 'policy-2',
          status: 'running',
          startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          recordsProcessed: 1500,
          recordsArchived: 900,
          recordsDeleted: 600,
        },
      ];

      auditService.logDataAccess('cleanup_jobs', 'view', 'success');
      return jobs;
    } catch (error) {
      auditService.logDataAccess('cleanup_jobs', 'view', 'failure', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get cleanup job status
   */
  async getCleanupJobStatus(jobId: string): Promise<CleanupJob> {
    try {
      // In production, this would fetch from backend
      const job: CleanupJob = {
        id: jobId,
        policyId: 'policy-1',
        status: 'running',
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        recordsProcessed: 1500,
        recordsArchived: 900,
        recordsDeleted: 600,
      };

      auditService.logDataAccess('cleanup_jobs', 'view', 'success', { jobId });
      return job;
    } catch (error) {
      auditService.logDataAccess('cleanup_jobs', 'view', 'failure', {
        jobId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cancel a running cleanup job
   */
  async cancelCleanupJob(jobId: string): Promise<void> {
    try {
      // In production, this would call the backend API

      auditService.logConfiguration('data_retention', 'cleanup_cancelled', 'success', {
        jobId,
      });
    } catch (error) {
      auditService.logConfiguration('data_retention', 'cleanup_cancelled', 'failure', {
        jobId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Preview what would be affected by a cleanup job
   */
  async previewCleanup(policyId: string): Promise<{
    recordsToArchive: number;
    recordsToDelete: number;
    oldestRecord: string;
    newestRecord: string;
    affectedDataTypes: string[];
  }> {
    try {
      // In production, this would call the backend API
      const preview = {
        recordsToArchive: 1200,
        recordsToDelete: 800,
        oldestRecord: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        newestRecord: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        affectedDataTypes: ['page_view', 'data_access'],
      };

      auditService.logDataAccess('cleanup_preview', 'view', 'success', { policyId });
      return preview;
    } catch (error) {
      auditService.logDataAccess('cleanup_preview', 'view', 'failure', {
        policyId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get available data types for retention policies
   */
  getAvailableDataTypes(): string[] {
    return [
      'authentication',
      'authorization',
      'page_view',
      'data_access',
      'data_modification',
      'configuration_change',
      'security',
      'system_error',
    ];
  }

  /**
   * Validate retention policy data
   */
  validateRetentionPolicy(data: RetentionPolicyFormData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push('Policy name must be at least 3 characters long');
    }

    if (data.retentionPeriodDays < 1) {
      errors.push('Retention period must be at least 1 day');
    }

    if (data.retentionPeriodDays > 3650) {
      errors.push('Retention period cannot exceed 10 years');
    }

    if (!data.dataTypes || data.dataTypes.length === 0) {
      errors.push('At least one data type must be selected');
    }

    const availableDataTypes = this.getAvailableDataTypes();
    const invalidDataTypes = data.dataTypes.filter(type => !availableDataTypes.includes(type));
    if (invalidDataTypes.length > 0) {
      errors.push(`Invalid data types: ${invalidDataTypes.join(', ')}`);
    }

    return errors;
  }

  /**
   * Calculate storage savings from retention policies
   */
  calculateStorageSavings(
    retentionPeriodDays: number,
    currentRecords: number
  ): {
    recordsToDelete: number;
    estimatedSavings: string;
  } {
    const averageRecordSize = 2048; // 2KB average
    const cutoffDate = new Date(Date.now() - retentionPeriodDays * 24 * 60 * 60 * 1000);

    // Simulate calculation based on retention period
    const recordsToDelete = Math.floor(currentRecords * 0.1 * (365 / retentionPeriodDays));
    const bytesToSave = recordsToDelete * averageRecordSize;

    let estimatedSavings: string;
    if (bytesToSave < 1024 * 1024) {
      estimatedSavings = `${Math.round(bytesToSave / 1024)} KB`;
    } else if (bytesToSave < 1024 * 1024 * 1024) {
      estimatedSavings = `${Math.round(bytesToSave / (1024 * 1024))} MB`;
    } else {
      estimatedSavings = `${Math.round(bytesToSave / (1024 * 1024 * 1024))} GB`;
    }

    return {
      recordsToDelete,
      estimatedSavings,
    };
  }
}

// Create singleton instance
export const dataRetentionService = new DataRetentionService();

// Export for use in other modules
export default dataRetentionService;
