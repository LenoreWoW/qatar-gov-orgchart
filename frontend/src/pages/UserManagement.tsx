import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Download,
  Upload,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  Settings,
} from 'lucide-react';
import { useUsers, useMinistries } from '../hooks/useApi';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import type { User as UserType } from '../types/api';

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'ministry_admin' | 'user';
  ministry_id?: string;
  isActive: boolean;
  password?: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType;
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSubmit, isLoading }) => {
  const { data: ministries } = useMinistries();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    defaultValues: user
      ? {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          ministry_id: user.ministry_id || '',
          isActive: user.isActive,
        }
      : {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          role: 'user',
          ministry_id: '',
          isActive: true,
          password: '',
        },
  });

  const watchedRole = watch('role');

  React.useEffect(() => {
    if (isOpen && !user) {
      reset();
    }
  }, [isOpen, user, reset]);

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
                  {user ? 'Edit User' : 'Create New User'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user
                    ? 'Update user information and permissions'
                    : 'Add a new user to the system'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    })}
                    type="text"
                    className={`input ${errors.username ? 'border-red-300' : ''}`}
                    placeholder="Enter username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className={`input ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className={`input ${errors.firstName ? 'border-red-300' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className={`input ${errors.lastName ? 'border-red-300' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    {...register('role', { required: 'Role is required' })}
                    className={`input ${errors.role ? 'border-red-300' : ''}`}
                  >
                    <option value="user">User</option>
                    <option value="ministry_admin">Ministry Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Ministry (if not super admin) */}
                {watchedRole !== 'super_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ministry {watchedRole === 'ministry_admin' ? '*' : ''}
                    </label>
                    <select
                      {...register('ministry_id', {
                        required:
                          watchedRole === 'ministry_admin'
                            ? 'Ministry is required for ministry admin'
                            : false,
                      })}
                      className={`input ${errors.ministry_id ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select Ministry</option>
                      {ministries?.map(ministry => (
                        <option key={ministry.id} value={ministry.id}>
                          {ministry.name}
                        </option>
                      ))}
                    </select>
                    {errors.ministry_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.ministry_id.message}</p>
                    )}
                  </div>
                )}

                {/* Password (only for new users) */}
                {!user && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      type="password"
                      className={`input ${errors.password ? 'border-red-300' : ''}`}
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}

                {/* Active Status */}
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      {...register('isActive')}
                      type="checkbox"
                      className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active user (can access the system)
                    </label>
                  </div>
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
                    {user ? 'Updating...' : 'Creating...'}
                  </>
                ) : user ? (
                  'Update User'
                ) : (
                  'Create User'
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

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [ministryFilter, setMinistryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // API hooks
  const { data: ministries } = useMinistries();
  const { data: usersData, isLoading: usersLoading } = useUsers({
    role: roleFilter || undefined,
  });

  // Check if current user is super admin
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  // Filter users based on search term
  const filteredUsers =
    usersData?.data?.filter(user => {
      const searchMatch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const ministryMatch = !ministryFilter || user.ministry_id === ministryFilter;
      const statusMatch =
        !statusFilter ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return searchMatch && ministryMatch && statusMatch;
    }) || [];

  const handleCreateUser = async (data: UserFormData) => {
    try {
      // API call would be implemented here
      console.log('Creating user:', data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!editingUser) return;

    try {
      // API call would be implemented here
      console.log('Updating user:', editingUser.id, data);
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // API call would be implemented here
        console.log('Deleting user:', id);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleToggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      // API call would be implemented here
      console.log('Toggling user status:', id, !isActive);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-red-100 text-red-800',
      ministry_admin: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
    };

    const labels = {
      super_admin: 'Super Admin',
      ministry_admin: 'Ministry Admin',
      user: 'User',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.user}`}
      >
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
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
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="ministry_admin">Ministry Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Ministry Filter */}
          <div>
            <select
              value={ministryFilter}
              onChange={e => setMinistryFilter(e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-qatar-maroon" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {usersData?.pagination?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {usersData?.data?.filter(u => u.isActive).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Super Admins</p>
              <p className="text-lg font-semibold text-gray-900">
                {usersData?.data?.filter(u => u.role === 'super_admin').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ministry Admins</p>
              <p className="text-lg font-semibold text-gray-900">
                {usersData?.data?.filter(u => u.role === 'ministry_admin').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Users ({filteredUsers.length})</h3>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter || ministryFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating a new user.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ministry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-qatar-maroon flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.ministry?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.isActive)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          className={`${user.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-qatar-maroon hover:text-qatar-maroon/80"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                          disabled={user.id === currentUser?.id}
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

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser || undefined}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        isLoading={false}
      />
    </div>
  );
};
