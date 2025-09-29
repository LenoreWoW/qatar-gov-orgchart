import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Tag,
  Download,
  Upload,
  MoreVertical,
  Shield,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
} from '../hooks/useApi';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Attribute, AttributeFormData } from '../types/api';

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute?: Attribute;
  onSubmit: (data: AttributeFormData) => void;
  isLoading: boolean;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  isOpen,
  onClose,
  attribute,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AttributeFormData>({
    defaultValues: attribute
      ? {
          name: attribute.name,
          description: attribute.description || '',
          type: attribute.type,
          category: attribute.category || '',
          is_active: attribute.is_active,
          metadata: attribute.metadata || {},
        }
      : {
          name: '',
          description: '',
          type: 'skill',
          category: '',
          is_active: true,
          metadata: {},
        },
  });

  React.useEffect(() => {
    if (isOpen && !attribute) {
      reset();
    }
  }, [isOpen, attribute, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {attribute ? 'Edit Attribute' : 'Create New Attribute'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {attribute ? 'Update attribute information' : 'Add a new attribute for positions'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Attribute Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attribute Name *
                  </label>
                  <input
                    {...register('name', { required: 'Attribute name is required' })}
                    type="text"
                    className={`input ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="e.g., Security Clearance, Language Proficiency"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    {...register('type', { required: 'Type is required' })}
                    className={`input ${errors.type ? 'border-red-300' : ''}`}
                  >
                    <option value="">Select Type</option>
                    <option value="skill">Skill</option>
                    <option value="certification">Certification</option>
                    <option value="clearance">Security Clearance</option>
                    <option value="language">Language</option>
                    <option value="education">Education</option>
                    <option value="experience">Experience</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    {...register('category')}
                    type="text"
                    className="input"
                    placeholder="e.g., Technical, Administrative, Leadership"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input"
                    placeholder="Describe the attribute and its requirements..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active attribute (available for assignment)
                  </label>
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
                    {attribute ? 'Updating...' : 'Creating...'}
                  </>
                ) : attribute ? (
                  'Update Attribute'
                ) : (
                  'Create Attribute'
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

export const AttributeManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  // API hooks
  const { data: attributes, isLoading: attributesLoading } = useAttributes({
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    active_only: statusFilter === 'active' ? true : undefined,
  });

  const createMutation = useCreateAttribute();
  const updateMutation = useUpdateAttribute();
  const deleteMutation = useDeleteAttribute();

  // Filter attributes based on search term
  const filteredAttributes =
    attributes?.filter(
      attribute =>
        attribute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attribute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attribute.category?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Get unique categories for filter
  const categories = Array.from(
    new Set(attributes?.map(attr => attr.category).filter(Boolean))
  ) as string[];

  const handleCreateAttribute = async (data: AttributeFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create attribute:', error);
    }
  };

  const handleUpdateAttribute = async (data: AttributeFormData) => {
    if (!editingAttribute) return;

    try {
      await updateMutation.mutateAsync({ id: editingAttribute.id, data });
      setIsModalOpen(false);
      setEditingAttribute(null);
    } catch (error) {
      console.error('Failed to update attribute:', error);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this attribute?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete attribute:', error);
      }
    }
  };

  const handleEditAttribute = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedAttributes.length === 0) return;

    if (
      window.confirm(`Are you sure you want to delete ${selectedAttributes.length} attributes?`)
    ) {
      try {
        await Promise.all(selectedAttributes.map(id => deleteMutation.mutateAsync(id)));
        setSelectedAttributes([]);
      } catch (error) {
        console.error('Failed to delete attributes:', error);
      }
    }
  };

  const toggleAttributeSelection = (id: string) => {
    setSelectedAttributes(prev => (prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]));
  };

  const selectAllAttributes = () => {
    setSelectedAttributes(
      selectedAttributes.length === filteredAttributes.length
        ? []
        : filteredAttributes.map(a => a.id)
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      skill: Tag,
      certification: Award,
      clearance: Shield,
      language: BookOpen,
      education: BookOpen,
      experience: Clock,
      other: Tag,
    };

    const Icon = icons[type as keyof typeof icons] || Tag;
    return <Icon className="h-5 w-5" />;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      skill: 'bg-blue-100 text-blue-800',
      certification: 'bg-green-100 text-green-800',
      clearance: 'bg-red-100 text-red-800',
      language: 'bg-purple-100 text-purple-800',
      education: 'bg-yellow-100 text-yellow-800',
      experience: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type as keyof typeof styles] || styles.other}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attribute Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage position attributes, skills, and requirements
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedAttributes.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-secondary text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedAttributes.length})
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
              setEditingAttribute(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Attribute
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
                placeholder="Search attributes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="skill">Skills</option>
              <option value="certification">Certifications</option>
              <option value="clearance">Security Clearance</option>
              <option value="language">Languages</option>
              <option value="education">Education</option>
              <option value="experience">Experience</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
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
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Tag className="h-8 w-8 text-qatar-maroon" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Attributes</p>
              <p className="text-lg font-semibold text-gray-900">{attributes?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-lg font-semibold text-gray-900">
                {attributes?.filter(a => a.is_active).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Certifications</p>
              <p className="text-lg font-semibold text-gray-900">
                {attributes?.filter(a => a.type === 'certification').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Clearances</p>
              <p className="text-lg font-semibold text-gray-900">
                {attributes?.filter(a => a.type === 'clearance').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Languages</p>
              <p className="text-lg font-semibold text-gray-900">
                {attributes?.filter(a => a.type === 'language').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Attributes ({filteredAttributes.length})
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={
                  selectedAttributes.length === filteredAttributes.length &&
                  filteredAttributes.length > 0
                }
                onChange={selectAllAttributes}
                className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </div>
        </div>

        {attributesLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter || categoryFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating a new attribute.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredAttributes.map(attribute => (
              <div
                key={attribute.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAttributes.includes(attribute.id)}
                      onChange={() => toggleAttributeSelection(attribute.id)}
                      className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                    />
                    <div className="flex-shrink-0">
                      <div className="bg-gray-100 rounded-lg p-2">
                        {getTypeIcon(attribute.type)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditAttribute(attribute)}
                      className="text-qatar-maroon hover:text-qatar-maroon/80"
                      title="Edit Attribute"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttribute(attribute.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Attribute"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-lg font-medium text-gray-900">{attribute.name}</h4>
                  {attribute.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {attribute.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    {getTypeBadge(attribute.type)}
                    {attribute.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {attribute.category}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(attribute.is_active)}
                </div>

                {attribute.metadata && Object.keys(attribute.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Additional metadata available</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attribute Modal */}
      <AttributeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttribute(null);
        }}
        attribute={editingAttribute || undefined}
        onSubmit={editingAttribute ? handleUpdateAttribute : handleCreateAttribute}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
