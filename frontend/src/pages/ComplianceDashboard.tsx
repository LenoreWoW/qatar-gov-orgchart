import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  FileText,
  Database,
  Lock,
} from 'lucide-react';
import type { AuditFilter, AuditLog } from '../services/auditService';
import { auditService, AuditStats } from '../services/auditService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

interface ComplianceMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
}

interface SecurityAlert {
  id: string;
  type: 'security' | 'compliance' | 'data' | 'access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
}

export const ComplianceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [auditFilter, setAuditFilter] = useState<AuditFilter>({
    page: 1,
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Check permissions
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the compliance dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (selectedTimeRange) {
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch audit statistics
  const { data: auditStats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats', startDate, endDate],
    queryFn: () => auditService.getAuditStats(startDate, endDate),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', auditFilter, startDate, endDate],
    queryFn: () =>
      auditService.getAuditLogs({
        ...auditFilter,
        startDate,
        endDate,
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate compliance metrics
  const complianceMetrics: ComplianceMetric[] = [
    {
      id: 'total-events',
      title: 'Total Audit Events',
      value: auditStats?.totalEvents || 0,
      change: 12,
      trend: 'up',
      status: 'good',
      icon: Activity,
    },
    {
      id: 'success-rate',
      title: 'Success Rate',
      value: auditStats?.totalEvents
        ? Math.round((auditStats.successfulActions / auditStats.totalEvents) * 100)
        : 0,
      change: -2,
      trend: 'down',
      status: auditStats?.successfulActions / auditStats?.totalEvents > 0.95 ? 'good' : 'warning',
      icon: CheckCircle2,
    },
    {
      id: 'failed-actions',
      title: 'Failed Actions',
      value: auditStats?.failedActions || 0,
      change: 8,
      trend: 'up',
      status: (auditStats?.failedActions || 0) > 10 ? 'critical' : 'good',
      icon: AlertTriangle,
    },
    {
      id: 'unique-users',
      title: 'Active Users',
      value: auditStats?.uniqueUsers || 0,
      change: 5,
      trend: 'up',
      status: 'good',
      icon: Users,
    },
  ];

  // Mock security alerts (in real implementation, these would come from audit analysis)
  const securityAlerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'security',
      severity: 'high',
      title: 'Multiple Failed Login Attempts',
      description: 'User admin has 5 failed login attempts in the last hour',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'investigating',
    },
    {
      id: '2',
      type: 'access',
      severity: 'medium',
      title: 'Unauthorized Access Attempt',
      description: 'Attempt to access restricted endpoint from unknown IP',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'open',
    },
    {
      id: '3',
      type: 'data',
      severity: 'low',
      title: 'Large Data Export',
      description: 'User exported 1000+ audit records',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'resolved',
    },
  ];

  const handleExportLogs = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const blob = await auditService.exportAuditLogs(auditFilter, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatEventType = (event: string) => {
    return event
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor audit logs, security events, and compliance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={e => setSelectedTimeRange(e.target.value)}
            className="input w-auto"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Export Options */}
          <div className="relative">
            <select
              onChange={e => e.target.value && handleExportLogs(e.target.value as any)}
              className="btn-secondary"
              value=""
            >
              <option value="">Export Logs</option>
              <option value="csv">Export as CSV</option>
              <option value="json">Export as JSON</option>
              <option value="pdf">Export as PDF</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceMetrics.map(metric => (
          <div key={metric.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div
                className={clsx(
                  'flex-shrink-0 p-3 rounded-md',
                  getStatusColor(metric.status) === 'text-green-600' && 'bg-green-100',
                  getStatusColor(metric.status) === 'text-yellow-600' && 'bg-yellow-100',
                  getStatusColor(metric.status) === 'text-red-600' && 'bg-red-100'
                )}
              >
                <metric.icon className={clsx('h-6 w-6', getStatusColor(metric.status))} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{metric.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metric.value.toLocaleString()}
                      {metric.id === 'success-rate' && '%'}
                    </div>
                    <div
                      className={clsx(
                        'ml-2 flex items-baseline text-sm font-semibold',
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {metric.trend === 'up' ? (
                        <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      <span className="ml-1">{Math.abs(metric.change)}%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Alerts */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Security Alerts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Real-time security events and compliance violations
          </p>
        </div>
        <div className="p-6">
          {securityAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Security Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">All systems are operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={clsx('border rounded-lg p-4', getSeverityColor(alert.severity))}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="mt-1 text-sm">{alert.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs">
                        <span>Severity: {alert.severity.toUpperCase()}</span>
                        <span>Status: {alert.status}</span>
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Audit Logs</h2>
              <p className="mt-1 text-sm text-gray-500">
                Detailed audit trail of system activities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={auditFilter.event || ''}
                    onChange={e =>
                      setAuditFilter({ ...auditFilter, event: e.target.value || undefined })
                    }
                    className="input"
                  >
                    <option value="">All Events</option>
                    <option value="authentication">Authentication</option>
                    <option value="authorization">Authorization</option>
                    <option value="data_access">Data Access</option>
                    <option value="data_modification">Data Modification</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={auditFilter.outcome || ''}
                    onChange={e =>
                      setAuditFilter({
                        ...auditFilter,
                        outcome: (e.target.value as any) || undefined,
                      })
                    }
                    className="input"
                  >
                    <option value="">All Outcomes</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <input
                    type="text"
                    placeholder="e.g., positions, users"
                    value={auditFilter.resource || ''}
                    onChange={e =>
                      setAuditFilter({ ...auditFilter, resource: e.target.value || undefined })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    placeholder="Filter by user"
                    value={auditFilter.userId || ''}
                    onChange={e =>
                      setAuditFilter({ ...auditFilter, userId: e.target.value || undefined })
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : auditLogs?.data?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Audit Logs</h3>
            <p className="mt-1 text-sm text-gray-500">No logs found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs?.data?.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatEventType(log.event)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          log.outcome === 'success' && 'bg-green-100 text-green-800',
                          log.outcome === 'failure' && 'bg-red-100 text-red-800',
                          log.outcome === 'partial' && 'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <button
                        className="text-qatar-maroon hover:text-qatar-maroon/80"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
