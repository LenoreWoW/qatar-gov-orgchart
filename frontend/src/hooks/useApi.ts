import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { apiService } from '../services/api';
import type {
  User,
  Ministry,
  Department,
  Position,
  Attribute,
  HierarchyNode,
  PaginatedResponse,
  PositionFormData,
  AttributeFormData,
} from '../types/api';

// Query Keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  ministries: ['ministries'] as const,
  ministry: (id: string) => ['ministries', id] as const,
  departments: (ministryId?: string) => ['departments', ministryId] as const,
  department: (id: string) => ['departments', id] as const,
  positions: (params?: any) => ['positions', params] as const,
  position: (id: string) => ['positions', id] as const,
  attributes: (params?: any) => ['attributes', params] as const,
  attribute: (id: string) => ['attributes', id] as const,
  hierarchy: (ministryId: string) => ['hierarchy', ministryId] as const,
};

// User Hooks
export const useUsers = (params?: { role?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => apiService.getUser(id),
    enabled: !!id,
  });
};

// Ministry Hooks
export const useMinistries = () => {
  return useQuery({
    queryKey: queryKeys.ministries,
    queryFn: () => apiService.getMinistries(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMinistry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.ministry(id),
    queryFn: () => apiService.getMinistry(id),
    enabled: !!id,
  });
};

// Department Hooks
export const useDepartments = (ministryId?: string) => {
  return useQuery({
    queryKey: queryKeys.departments(ministryId),
    queryFn: () => apiService.getDepartments(ministryId ? { ministry_id: ministryId } : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDepartment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.department(id),
    queryFn: () => apiService.getDepartment(id),
    enabled: !!id,
  });
};

// Position Hooks
export const usePositions = (params?: {
  ministry_id?: string;
  department_id?: string;
  status?: string;
  grade_min?: number;
  grade_max?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.positions(params),
    queryFn: () => apiService.getPositions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePosition = (id: string) => {
  return useQuery({
    queryKey: queryKeys.position(id),
    queryFn: () => apiService.getPosition(id),
    enabled: !!id,
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PositionFormData) => apiService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchy('') });
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PositionFormData> }) =>
      apiService.updatePosition(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.position(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchy('') });
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchy('') });
    },
  });
};

// Attribute Hooks
export const useAttributes = (params?: {
  type?: string;
  category?: string;
  active_only?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.attributes(params),
    queryFn: () => apiService.getAttributes(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAttribute = (id: string) => {
  return useQuery({
    queryKey: queryKeys.attribute(id),
    queryFn: () => apiService.getAttribute(id),
    enabled: !!id,
  });
};

export const useCreateAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AttributeFormData) => apiService.createAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes() });
    },
  });
};

export const useUpdateAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttributeFormData> }) =>
      apiService.updateAttribute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attribute(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes() });
    },
  });
};

export const useDeleteAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes() });
    },
  });
};

// Position Attribute Hooks
export const useAssignAttributeToPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      data,
    }: {
      positionId: string;
      data: {
        attribute_id: string;
        assigned_date?: string;
        expiry_date?: string;
        notes?: string;
      };
    }) => apiService.assignAttributeToPosition(positionId, data),
    onSuccess: (_, { positionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.position(positionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchy('') });
    },
  });
};

export const useRemoveAttributeFromPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ positionId, attributeId }: { positionId: string; attributeId: string }) =>
      apiService.removeAttributeFromPosition(positionId, attributeId),
    onSuccess: (_, { positionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.position(positionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchy('') });
    },
  });
};

// Hierarchy Hooks
export const useOrganizationHierarchy = (ministryId: string) => {
  return useQuery({
    queryKey: queryKeys.hierarchy(ministryId),
    queryFn: () => apiService.getOrganizationHierarchy(ministryId),
    enabled: !!ministryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
