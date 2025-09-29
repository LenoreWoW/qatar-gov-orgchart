import type { User } from '../types/api';

export type UserRole = 'admin' | 'planner' | 'hr';

export interface Permission {
  // Organization structure permissions
  canCreatePosition: boolean;
  canEditPosition: boolean;
  canDeletePosition: boolean;
  canViewPosition: boolean;

  // Employee management permissions
  canManageEmployees: boolean;
  canAssignEmployees: boolean;
  canEditEmployeeInfo: boolean;

  // HR-specific permissions
  canManageKeyResponsibilities: boolean;
  canManageContactInfo: boolean;

  // System permissions
  canManageUsers: boolean;
  canAccessCompliance: boolean;
  canExportData: boolean;
  canAccessDashboard: boolean;
}

export const getRolePermissions = (role: UserRole): Permission => {
  switch (role) {
    case 'admin':
      // Admin can do everything
      return {
        canCreatePosition: true,
        canEditPosition: true,
        canDeletePosition: true,
        canViewPosition: true,
        canManageEmployees: true,
        canAssignEmployees: true,
        canEditEmployeeInfo: true,
        canManageKeyResponsibilities: true,
        canManageContactInfo: true,
        canManageUsers: true,
        canAccessCompliance: true,
        canExportData: true,
        canAccessDashboard: true,
      };

    case 'planner':
      // Planner can only add and remove org structure
      return {
        canCreatePosition: true,
        canEditPosition: true,
        canDeletePosition: true,
        canViewPosition: true,
        canManageEmployees: false,
        canAssignEmployees: false,
        canEditEmployeeInfo: false,
        canManageKeyResponsibilities: false,
        canManageContactInfo: false,
        canManageUsers: false,
        canAccessCompliance: false,
        canExportData: false,
        canAccessDashboard: true,
      };

    case 'hr':
      // HR can add employees, their positions, and manage Key Responsibilities and Contact Info
      return {
        canCreatePosition: false,
        canEditPosition: false,
        canDeletePosition: false,
        canViewPosition: true,
        canManageEmployees: true,
        canAssignEmployees: true,
        canEditEmployeeInfo: true,
        canManageKeyResponsibilities: true,
        canManageContactInfo: true,
        canManageUsers: false,
        canAccessCompliance: false,
        canExportData: false,
        canAccessDashboard: true,
      };

    default:
      // Default: no permissions
      return {
        canCreatePosition: false,
        canEditPosition: false,
        canDeletePosition: false,
        canViewPosition: true,
        canManageEmployees: false,
        canAssignEmployees: false,
        canEditEmployeeInfo: false,
        canManageKeyResponsibilities: false,
        canManageContactInfo: false,
        canManageUsers: false,
        canAccessCompliance: false,
        canExportData: false,
        canAccessDashboard: true,
      };
  }
};

export const getUserPermissions = (user: User | null): Permission => {
  if (!user) {
    return getRolePermissions('hr'); // Default fallback
  }
  return getRolePermissions(user.role as UserRole);
};

export const canUserPerform = (user: User | null, action: keyof Permission): boolean => {
  const permissions = getUserPermissions(user);
  return permissions[action];
};

// Convenience functions for common permission checks
export const isAdmin = (user: User | null): boolean => user?.role === 'admin';
export const isPlanner = (user: User | null): boolean => user?.role === 'planner';
export const isHR = (user: User | null): boolean => user?.role === 'hr';

// Role display utilities
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'planner': return 'Organizational Planner';
    case 'hr': return 'Human Resources';
    default: return 'User';
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'text-red-600 bg-red-100';
    case 'planner': return 'text-blue-600 bg-blue-100';
    case 'hr': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};