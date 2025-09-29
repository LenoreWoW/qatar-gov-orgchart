// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role: 'admin' | 'planner' | 'hr';
  status: 'active' | 'inactive' | 'locked';
  ministry?: {
    id: string;
    name: string;
    nameAr?: string;
    code: string;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

// Ministry Types
export interface Ministry {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  status: 'active' | 'inactive';
  ministerPositionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Department Types
export interface Department {
  id: string;
  ministryId: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  level: number;
  headPositionId?: string;
  status: 'active' | 'inactive';
  ministry: {
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Position Types
export interface Position {
  id: string;
  ministryId: string;
  departmentId?: string;
  parentPositionId?: string;
  code: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  governmentGrade: number;
  salaryScale?: string;
  status: 'active' | 'inactive';
  maxAttributes: number;
  requiresSecurityClearance: boolean;
  isManagementPosition: boolean;
  level: number;
  ministry: {
    name: string;
    code: string;
  };
  departmentName?: string;
  parentPositionTitle?: string;
  currentEmployee?: Employee;
  attributes: Attribute[];
  attributeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositionCreateRequest {
  ministry_id: string;
  department_id?: string;
  parent_position_id?: string;
  code: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  government_grade: number;
  salary_scale?: string;
  max_attributes?: number;
  requires_security_clearance?: boolean;
  is_management_position?: boolean;
  level: number;
}

// Employee Types
export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  jobTitleAr?: string;
  startDate?: string;
  assignmentType?: string;
}

// Attribute Types
export interface Attribute {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: 'security' | 'financial' | 'administrative' | 'technical';
  category?: string;
  isActive: boolean;
  requiresApproval: boolean;
  displayOrder: number;
  usageCount: number;
  assignedDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeCreateRequest {
  code: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  type: 'security' | 'financial' | 'administrative' | 'technical';
  category?: string;
  requires_approval?: boolean;
}

// Organizational Hierarchy Types
export interface HierarchyNode {
  id: string;
  code: string;
  titleEn: string;
  titleAr?: string;
  governmentGrade: number;
  level: number;
  isManagementPosition: boolean;
  status: string;
  department?: {
    id: string;
    nameEn: string;
    nameAr?: string;
  };
  currentEmployee?: Employee;
  attributes: Attribute[];
  children: HierarchyNode[];
  depth: number;
}

// Form Types
export interface PositionFormData {
  ministry_id: string;
  department_id?: string;
  parent_position_id?: string;
  code: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  government_grade: number;
  salary_scale?: string;
  max_attributes: number;
  requires_security_clearance: boolean;
  is_management_position: boolean;
  level: number;
}

export interface AttributeFormData {
  code: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  type: 'security' | 'financial' | 'administrative' | 'technical';
  category?: string;
  requires_approval: boolean;
}
