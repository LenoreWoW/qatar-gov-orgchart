import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Download,
  FileText,
  Database,
  Users,
  Calendar,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRTL } from '../components/ui/LanguageSwitcher';
import { useAuditLogger } from '../services/auditService';
import type { ExportJob, ExportOptions, ExportProgress } from '../services/exportService';
import { exportService } from '../services/exportService';

interface ExportFormData {
  reportType: 'audit_logs' | 'compliance_report' | 'retention_report' | 'user_activity';
  format: 'csv' | 'json' | 'pdf' | 'xlsx';
  startDate?: string;
  endDate?: string;
  userId?: string;
  policyId?: string;
  includeHeaders: boolean;
  compression: boolean;
  password?: string;
}

export const ExportManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { logNavigation, logDataAccess } = useAuditLogger();

  // State
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportProgress, setExportProgress] = useState<Map<string, ExportProgress>>(new Map());
  const [statistics, setStatistics] = useState<any>(null);

  // Form for creating exports
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExportFormData>({
    defaultValues: {
      reportType: 'audit_logs',
      format: 'csv',
      includeHeaders: true,
      compression: false,
    },
  });

  const reportType = watch('reportType');
  const selectedFormat = watch('format');

  useEffect(() => {
    logNavigation('export-management');
    loadData();
    loadStatistics();

    // Refresh data every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    try {
      const jobs = exportService.getAllJobs();
      setExportJobs(jobs);

      // Set up progress monitoring for active jobs
      jobs.forEach(job => {
        if (job.status === 'processing') {
          exportService.onProgress(job.id, progress => {
            setExportProgress(prev => new Map(prev.set(job.id, progress)));
          });
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load export jobs');
    }
  };

  const loadStatistics = () => {
    try {
      const stats = exportService.getExportStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to load export statistics:', err);
    }
  };

  const handleCreateExport = async (data: ExportFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const options: ExportOptions = {
        format: data.format,
        includeHeaders: data.includeHeaders,
        compression: data.compression,
        password: data.password,
      };

      let result;

      switch (data.reportType) {
        case 'audit_logs':
          result = await exportService.exportAuditLogs(
            {
              startDate: data.startDate,
              endDate: data.endDate,
              userId: data.userId,
            },
            options
          );
          break;

        case 'compliance_report':
          if (!data.startDate || !data.endDate) {
            throw new Error('Start and end dates are required for compliance reports');
          }
          result = await exportService.exportComplianceReport(
            data.startDate,
            data.endDate,
            options
          );
          break;

        case 'retention_report':
          result = await exportService.exportRetentionReport(data.policyId, options);
          break;

        case 'user_activity':
          result = await exportService.exportUserActivityReport(
            data.userId,
            data.startDate,
            data.endDate,
            options
          );
          break;

        default:
          throw new Error('Invalid report type');
      }

      // If export completed immediately, start download
      if (result.url) {
        window.open(result.url, '_blank');
      }

      setShowCreateModal(false);
      reset();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create export');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      await exportService.downloadFile(jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  };

  const handleCancelJob = (jobId: string) => {
    try {
      const success = exportService.cancelJob(jobId);
      if (success) {
        loadData();
      } else {
        setError('Cannot cancel this job');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RotateCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'audit_logs':
        return <FileText className="h-5 w-5" />;
      case 'compliance_report':
        return <BarChart3 className="h-5 w-5" />;
      case 'retention_report':
        return <Database className="h-5 w-5" />;
      case 'user_activity':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const getAvailableFormats = () => {
    return exportService.getAvailableFormats(reportType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Management</h1>
          <p className="text-gray-600">Create and manage data exports and reports</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Create Export
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exports</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalJobs}</p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statistics.completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.processingJobs}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageExportTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Export Jobs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Jobs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exportJobs.map(job => {
                const progress = exportProgress.get(job.id);
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getReportTypeIcon(job.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {job.type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500 uppercase">{job.format}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{job.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progress
                          ? `${progress.stage} (${progress.recordsProcessed}/${progress.totalRecords})`
                          : `${job.progress}%`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(job.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(job.startTime, job.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.fileSize || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {job.status === 'completed' && job.downloadUrl && (
                          <button
                            onClick={() => handleDownload(job.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        {job.status === 'processing' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {exportJobs.length === 0 && (
            <div className="text-center py-12">
              <Download className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exports</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first export.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Export Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Export</h3>

            <form onSubmit={handleSubmit(handleCreateExport)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  {...register('reportType', { required: 'Report type is required' })}
                  className="input"
                >
                  <option value="audit_logs">Audit Logs</option>
                  <option value="compliance_report">Compliance Report</option>
                  <option value="retention_report">Data Retention Report</option>
                  <option value="user_activity">User Activity</option>
                </select>
                {errors.reportType && (
                  <p className="mt-1 text-sm text-red-600">{errors.reportType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  {...register('format', { required: 'Format is required' })}
                  className="input"
                >
                  {getAvailableFormats().map(format => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.format && (
                  <p className="mt-1 text-sm text-red-600">{errors.format.message}</p>
                )}
              </div>

              {(reportType === 'audit_logs' ||
                reportType === 'compliance_report' ||
                reportType === 'user_activity') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        {...register(
                          'startDate',
                          reportType === 'compliance_report'
                            ? { required: 'Start date is required' }
                            : {}
                        )}
                        type="date"
                        className="input"
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        {...register(
                          'endDate',
                          reportType === 'compliance_report'
                            ? { required: 'End date is required' }
                            : {}
                        )}
                        type="date"
                        className="input"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {(reportType === 'audit_logs' || reportType === 'user_activity') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID (Optional)
                  </label>
                  <input
                    {...register('userId')}
                    type="text"
                    className="input"
                    placeholder="Filter by specific user"
                  />
                </div>
              )}

              {reportType === 'retention_report' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy ID (Optional)
                  </label>
                  <input
                    {...register('policyId')}
                    type="text"
                    className="input"
                    placeholder="Filter by specific policy"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    {...register('includeHeaders')}
                    type="checkbox"
                    className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-900">Include headers in export</label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('compression')}
                    type="checkbox"
                    className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-900">Compress file</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Protection (Optional)
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="input"
                  placeholder="Leave empty for no password"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary">
                  {isSubmitting || isLoading ? 'Creating...' : 'Create Export'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedJob.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Report Type</label>
                <p className="text-sm text-gray-900 capitalize">
                  {selectedJob.type.replace('_', ' ')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Format</label>
                <p className="text-sm text-gray-900 uppercase">{selectedJob.format}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="flex items-center">
                  {getStatusIcon(selectedJob.status)}
                  <span className="ml-2 text-sm text-gray-900 capitalize">
                    {selectedJob.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Progress</label>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${selectedJob.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedJob.progress}%</p>
              </div>

              {selectedJob.error && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Error</label>
                  <p className="text-sm text-red-600">{selectedJob.error}</p>
                </div>
              )}

              {selectedJob.recordCount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Records</label>
                  <p className="text-sm text-gray-900">
                    {selectedJob.recordCount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setSelectedJob(null)} className="btn-secondary">
                Close
              </button>
              {selectedJob.status === 'completed' && selectedJob.downloadUrl && (
                <button onClick={() => handleDownload(selectedJob.id)} className="btn-primary">
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
