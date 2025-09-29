import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Database,
  Clock,
  Trash2,
  Archive,
  Play,
  Pause,
  Download,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Settings,
  BarChart3,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRTL } from '../components/ui/LanguageSwitcher';
import { useAuditLogger } from '../services/auditService';
import type {
  RetentionPolicy,
  RetentionPolicyFormData,
  RetentionStats,
  CleanupJob,
} from '../services/dataRetentionService';
import { dataRetentionService } from '../services/dataRetentionService';

interface DataRetentionManagementProps {}

export const DataRetentionManagement: React.FC<DataRetentionManagementProps> = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { logNavigation, logDataAccess, logDataModification, logConfiguration } = useAuditLogger();

  // State
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [cleanupJobs, setCleanupJobs] = useState<CleanupJob[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<RetentionPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form for creating/editing policies
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RetentionPolicyFormData>({
    defaultValues: {
      name: '',
      description: '',
      retentionPeriodDays: 365,
      dataTypes: [],
      isActive: true,
    },
  });

  const retentionPeriodDays = watch('retentionPeriodDays');

  useEffect(() => {
    logNavigation('data-retention-management');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [policiesData, statsData, jobsData] = await Promise.all([
        dataRetentionService.getRetentionPolicies(),
        dataRetentionService.getRetentionStats(),
        dataRetentionService.getCleanupJobs(),
      ]);

      setPolicies(policiesData);
      setRetentionStats(statsData);
      setCleanupJobs(jobsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data retention information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async (data: RetentionPolicyFormData) => {
    try {
      await dataRetentionService.createRetentionPolicy(data);
      await loadData();
      setShowCreateModal(false);
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to create retention policy');
    }
  };

  const handleStartCleanup = async (policyId?: string) => {
    try {
      const { jobId } = await dataRetentionService.startCleanupJob(policyId);
      await loadData();
      logConfiguration('data_retention', 'cleanup_started', 'success', { jobId, policyId });
    } catch (err: any) {
      setError(err.message || 'Failed to start cleanup job');
    }
  };

  const handlePreviewCleanup = async (policyId: string) => {
    try {
      const preview = await dataRetentionService.previewCleanup(policyId);
      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to preview cleanup');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (days: number): string => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <RotateCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2">Loading data retention management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dataRetention.title')}</h1>
          <p className="text-gray-600">{t('dataRetention.description')}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          {t('dataRetention.createPolicy')}
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
      {retentionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {retentionStats.totalRecords.toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">To Archive</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {retentionStats.recordsToArchive.toLocaleString()}
                </p>
              </div>
              <Archive className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">To Delete</p>
                <p className="text-2xl font-bold text-red-600">
                  {retentionStats.recordsToDelete.toLocaleString()}
                </p>
              </div>
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{retentionStats.storageUsed}</p>
                <p className="text-sm text-green-600">Save {retentionStats.projectedSavings}</p>
              </div>
              <HardDrive className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Retention Policies */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('dataRetention.policies')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retention Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map(policy => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                      <div className="text-sm text-gray-500">{policy.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(policy.retentionPeriodDays)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {policy.dataTypes.slice(0, 2).map(type => (
                        <span
                          key={type}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                      {policy.dataTypes.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{policy.dataTypes.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        policy.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreviewCleanup(policy.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview cleanup"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStartCleanup(policy.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Run cleanup"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedPolicy(policy)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit policy"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleanup Jobs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('dataRetention.cleanupJobs')}</h2>
          <button onClick={() => handleStartCleanup()} className="btn-secondary flex items-center">
            <Play className="h-4 w-4 mr-2" />
            Run Full Cleanup
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cleanupJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{job.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Processed: {job.recordsProcessed.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        Archived: {job.recordsArchived.toLocaleString()} | Deleted:{' '}
                        {job.recordsDeleted.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(job.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.endTime
                      ? `${Math.round(
                          (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) /
                            1000 /
                            60
                        )} min`
                      : 'Running...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Retention Policy</h3>

            <form onSubmit={handleSubmit(handleCreatePolicy)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                <input
                  {...register('name', { required: 'Policy name is required' })}
                  type="text"
                  className="input"
                  placeholder="Enter policy name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  className="input h-20"
                  placeholder="Enter policy description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retention Period (Days)
                </label>
                <input
                  {...register('retentionPeriodDays', {
                    required: 'Retention period is required',
                    min: { value: 1, message: 'Must be at least 1 day' },
                    max: { value: 3650, message: 'Cannot exceed 10 years' },
                  })}
                  type="number"
                  className="input"
                  placeholder="365"
                />
                {retentionPeriodDays && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDuration(retentionPeriodDays)}
                  </p>
                )}
                {errors.retentionPeriodDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.retentionPeriodDays.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Types</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dataRetentionService.getAvailableDataTypes().map(dataType => (
                    <label key={dataType} className="flex items-center">
                      <input
                        {...register('dataTypes')}
                        type="checkbox"
                        value={dataType}
                        className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {dataType.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Enable policy immediately</label>
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
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cleanup Preview</h3>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">Records to be processed</h4>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Archive: {previewData.recordsToArchive.toLocaleString()} records</p>
                      <p>Delete: {previewData.recordsToDelete.toLocaleString()} records</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oldest Record</label>
                  <p className="text-sm text-gray-900">
                    {new Date(previewData.oldestRecord).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Newest Record</label>
                  <p className="text-sm text-gray-900">
                    {new Date(previewData.newestRecord).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affected Data Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {previewData.affectedDataTypes.map((type: string) => (
                    <span
                      key={type}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  // handleStartCleanup would be called here
                }}
                className="btn-danger"
              >
                Proceed with Cleanup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
