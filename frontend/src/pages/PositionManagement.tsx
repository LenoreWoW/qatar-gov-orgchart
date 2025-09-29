import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MoreVertical,
  Building2,
  Users,
  Tag,
  Calendar,
  MapPin,
  Briefcase,
} from 'lucide-react';
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  useMinistries,
  useDepartments,
  useAttributes,
} from '../hooks/useApi';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Position, PositionFormData } from '../types/api';

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: Position;
  onSubmit: (data: PositionFormData) => void;
  isLoading: boolean;
}

const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  position,
  onSubmit,
  isLoading,
}) => {
  const { data: ministries } = useMinistries();
  const [selectedMinistry, setSelectedMinistry] = useState(position?.department?.ministry_id || '');
  const { data: departments } = useDepartments(selectedMinistry);
  const { data: attributes } = useAttributes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PositionFormData>({
    defaultValues: position
      ? {
          title: position.title,
          description: position.description || '',
          department_id: position.department_id,
          grade: position.grade,
          status: position.status,
          reporting_to: position.reporting_to || '',
          location: position.location || '',
          requirements: position.requirements || '',
        }
      : {
          title: '',
          description: '',
          department_id: '',
          grade: 1,
          status: 'active',
          reporting_to: '',
          location: '',
          requirements: '',
        },
  });

  React.useEffect(() => {
    if (position) {
      setSelectedMinistry(position.department?.ministry_id || '');
    }
  }, [position]);

  React.useEffect(() => {
    if (isOpen && !position) {
      reset();
      setSelectedMinistry('');
    }
  }, [isOpen, position, reset]);

  const watchedDepartmentId = watch('department_id');

  React.useEffect(() => {
    const selectedDept = departments?.find(d => d.id === watchedDepartmentId);
    if (selectedDept) {
      setSelectedMinistry(selectedDept.ministry_id);
    }
  }, [watchedDepartmentId, departments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {position ? 'Edit Position' : 'Create New Position'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {position
                    ? 'Update position information'
                    : 'Add a new position to the organization'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Title *
                  </label>
                  <input
                    {...register('title', { required: 'Position title is required' })}
                    type="text"
                    className={`input ${errors.title ? 'border-red-300' : ''}`}
                    placeholder="e.g., Director of Information Technology"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Ministry Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ministry</label>
                  <select
                    value={selectedMinistry}
                    onChange={e => {
                      setSelectedMinistry(e.target.value);
                      setValue('department_id', '');
                    }}
                    className="input"
                  >
                    <option value="">Select Ministry</option>
                    {ministries?.map(ministry => (
                      <option key={ministry.id} value={ministry.id}>
                        {ministry.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    {...register('department_id', { required: 'Department is required' })}
                    className={`input ${errors.department_id ? 'border-red-300' : ''}`}
                    disabled={!selectedMinistry}
                  >
                    <option value="">Select Department</option>
                    {departments?.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>
                  )}
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <input
                    {...register('grade', {
                      required: 'Grade is required',
                      min: { value: 1, message: 'Grade must be at least 1' },
                      max: { value: 20, message: 'Grade cannot exceed 20' },
                    })}
                    type="number"
                    min="1"
                    max="20"
                    className={`input ${errors.grade ? 'border-red-300' : ''}`}
                  />
                  {errors.grade && (
                    <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    {...register('location')}
                    type="text"
                    className="input"
                    placeholder="e.g., Doha, Building A, Floor 3"
                  />
                </div>

                {/* Reporting To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                  <input
                    {...register('reporting_to')}
                    type="text"
                    className="input"
                    placeholder="e.g., Chief Technology Officer"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input"
                    placeholder="Describe the position responsibilities and duties..."
                  />
                </div>

                {/* Requirements */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="input"
                    placeholder="List qualifications, experience, and skills required..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full inline-flex justify-center sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {position ? 'Updating...' : 'Creating...'}
                  </>
                ) : position ? (
                  'Update Position'
                ) : (
                  'Create Position'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary mt-3 w-full inline-flex justify-center sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const PositionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  // API hooks
  const { data: ministries } = useMinistries();
  const { data: departments } = useDepartments(selectedMinistry);
  const { data: positionsData, isLoading: positionsLoading } = usePositions({
    ministry_id: selectedMinistry || undefined,
    department_id: selectedDepartment || undefined,
    status: statusFilter || undefined,
  });

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  // Filter positions based on search term
  const filteredPositions =
    positionsData?.data?.filter(
      position =>
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleCreatePosition = async (data: PositionFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  };

  const handleUpdatePosition = async (data: PositionFormData) => {
    if (!editingPosition) return;

    try {
      await updateMutation.mutateAsync({ id: editingPosition.id, data });
      setIsModalOpen(false);
      setEditingPosition(null);
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete position:', error);
      }
    }
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedPositions.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedPositions.length} positions?`)) {
      try {
        await Promise.all(selectedPositions.map(id => deleteMutation.mutateAsync(id)));
        setSelectedPositions([]);
      } catch (error) {
        console.error('Failed to delete positions:', error);
      }
    }
  };

  const togglePositionSelection = (id: string) => {
    setSelectedPositions(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const selectAllPositions = () => {
    setSelectedPositions(
      selectedPositions.length === filteredPositions.length ? [] : filteredPositions.map(p => p.id)
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Position Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational positions and their details
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedPositions.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-secondary text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedPositions.length})
            </button>
          )}
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              setEditingPosition(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search positions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Ministry Filter */}
          <div>
            <select
              value={selectedMinistry}
              onChange={e => {
                setSelectedMinistry(e.target.value);
                setSelectedDepartment('');
              }}
              className="input"
            >
              <option value="">All Ministries</option>
              {ministries?.map(ministry => (
                <option key={ministry.id} value={ministry.id}>
                  {ministry.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="input"
              disabled={!selectedMinistry}
            >
              <option value="">All Departments</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-qatar-maroon" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Positions</p>
              <p className="text-lg font-semibold text-gray-900">
                {positionsData?.pagination?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Positions</p>
              <p className="text-lg font-semibold text-gray-900">
                {positionsData?.data?.filter(p => p.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Set(positionsData?.data?.map(p => p.department_id)).size || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Tag className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Grade</p>
              <p className="text-lg font-semibold text-gray-900">
                {positionsData?.data?.length
                  ? (
                      positionsData.data.reduce((acc, p) => acc + p.grade, 0) /
                      positionsData.data.length
                    ).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Positions ({filteredPositions.length})
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={
                  selectedPositions.length === filteredPositions.length &&
                  filteredPositions.length > 0
                }
                onChange={selectAllPositions}
                className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </div>
        </div>

        {positionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No positions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedMinistry || selectedDepartment || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating a new position.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedPositions.length === filteredPositions.length &&
                        filteredPositions.length > 0
                      }
                      onChange={selectAllPositions}
                      className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPositions.map(position => (
                  <tr key={position.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPositions.includes(position.id)}
                        onChange={() => togglePositionSelection(position.id)}
                        className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{position.title}</div>
                        {position.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {position.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{position.department?.name}</div>
                      <div className="text-sm text-gray-500">
                        {position.department?.ministry?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Grade {position.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(position.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{position.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPosition(position)}
                          className="text-qatar-maroon hover:text-qatar-maroon/80"
                          title="Edit Position"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Position"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Position Modal */}
      <PositionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPosition(null);
        }}
        position={editingPosition || undefined}
        onSubmit={editingPosition ? handleUpdatePosition : handleCreatePosition}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
