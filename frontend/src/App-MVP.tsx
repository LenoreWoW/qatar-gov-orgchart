import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { Shield, Home, Network, Users, Settings, LogOut, Globe, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Building2, Plus, Edit3, Trash2, Search, X, Sparkles, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import EnhancedOrgChart from './components/EnhancedOrgChart';
import { AuthProvider, useAuth } from './context/AuthContext';

// Language Context and Translations
interface LanguageContextType {
  language: 'en' | 'ar';
  isRTL: boolean;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

// Global Data Context
interface DataContextType {
  employees: Employee[];
  departments: Department[];
  subdepartments: Subdepartment[];
  units: Unit[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployeesByDepartment: (departmentId: string) => Employee[];
  getEmployeesBySubdepartment: (subdepartmentId: string) => Employee[];
  getEmployeesByUnit: (unitId: string) => Employee[];
  getDepartmentName: (departmentId: string) => string;
  getSubdepartmentName: (subdepartmentId: string) => string;
  getUnitName: (unitId: string) => string;
  getSubdepartmentsByDepartment: (departmentId: string) => Subdepartment[];
  getUnitsBySubdepartment: (subdepartmentId: string) => Unit[];
  // New nested hierarchy functions
  getChildDepartments: (parentDepartmentId?: string) => Department[];
  getChildSubdepartments: (parentSubdepartmentId?: string) => Subdepartment[];
  getChildUnits: (parentUnitId?: string) => Unit[];
  getRootDepartments: () => Department[];
  getRootSubdepartments: (departmentId: string) => Subdepartment[];
  getRootUnits: (subdepartmentId: string) => Unit[];
  // Transfer functions
  transferEmployee: (employeeId: string, targetDepartmentId?: string, targetSubdepartmentId?: string, targetUnitId?: string) => void;
  transferDepartment: (departmentId: string, targetMinistryId: string, targetParentDepartmentId?: string) => void;
  transferSubdepartment: (subdepartmentId: string, targetDepartmentId: string, targetParentSubdepartmentId?: string) => void;
  transferUnit: (unitId: string, targetSubdepartmentId: string, targetParentUnitId?: string) => void;
}

const translations = {
  en: {
    // Auth
    'auth.title': 'Qatar Government',
    'auth.subtitle': 'Organization Chart System',
    'auth.description': 'Secure access to government organizational structure',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.login': 'Sign In',
    'auth.demo': 'Demo credentials: admin / admin123',
    'auth.usernamePlaceholder': 'Enter username (admin)',
    'auth.passwordPlaceholder': 'Enter password (admin)',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.orgChart': 'Organization Chart',
    'nav.ministries': 'Ministries',
    'nav.departments': 'Departments',
    'nav.logout': 'Logout',
    'nav.user': 'Admin User',
    'nav.role': 'super_admin',

    // Dashboard
    'dashboard.totalPositions': 'Total Positions',
    'dashboard.ministries': 'Ministries',
    'dashboard.activeUsers': 'Active Users',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.activity1': 'New position added: Director of IT',
    'dashboard.activity2': 'Ministry structure updated: Ministry of Finance',
    'dashboard.activity3': 'User access granted: john.doe@gov.qa',
    'dashboard.timeAgo1': '2 hours ago',
    'dashboard.timeAgo2': '5 hours ago',
    'dashboard.timeAgo3': '1 day ago',

    // Organization Chart
    'orgChart.title': 'Interactive Organization Chart',
    'orgChart.addPosition': 'Add New Position',
    'orgChart.editPosition': 'Edit Position',
    'orgChart.under': 'under',
    'orgChart.positionTitleEn': 'Position Title (English)',
    'orgChart.positionTitleAr': 'Position Title (Arabic)',
    'orgChart.currentHolder': 'Current Holder',
    'orgChart.department': 'Department/Ministry',
    'orgChart.addBtn': 'Add Position',
    'orgChart.updateBtn': 'Update Position',
    'orgChart.cancel': 'Cancel',
    'orgChart.fullScreen': 'Full Screen View',
    'orgChart.exitFullScreen': 'Exit Full Screen',
    'orgChart.zoomIn': 'Zoom In',
    'orgChart.zoomOut': 'Zoom Out',
    'orgChart.resetView': 'Reset View',
    'orgChart.legend': 'Hierarchy Legend',
    'orgChart.legendPrimeMinister': 'Prime Minister & Ministers',
    'orgChart.legendDirector': 'Directors',
    'orgChart.legendDepartment': 'Departments',
    'orgChart.legendSubdepartment': 'Subdepartments',
    'orgChart.legendUnit': 'Units',
    'orgChart.legendNesting': 'Darker colors indicate deeper nesting levels',
    'orgChart.search': 'Search',
    'orgChart.searchPlaceholder': 'Search by name, position, department...',
    'orgChart.searchResults': 'Search Results',
    'orgChart.noResults': 'No results found',
    'orgChart.searchEmployee': 'Employee',
    'orgChart.searchPosition': 'Position',
    'orgChart.searchDepartment': 'Department',
    'orgChart.clearSearch': 'Clear Search',

    // Tooltips
    'tooltip.position': 'Position',
    'tooltip.holder': 'Current Holder',
    'tooltip.department': 'Department',
    'tooltip.employeeCount': 'Employees',
    'tooltip.level': 'Hierarchy Level',
    'tooltip.type': 'Type',
    'tooltip.ministry': 'Ministry',
    'tooltip.directReports': 'Direct Reports',
    'tooltip.clickToView': 'Click to view details',
    'tooltip.clickToEdit': 'Click to edit',
    'tooltip.dragToMove': 'Drag to reorganize',

    // Transfer
    'transfer.employee': 'Transfer Employee',
    'transfer.structure': 'Transfer Structure',
    'transfer.selectDestination': 'Select Destination',
    'transfer.confirm': 'Confirm Transfer',
    'transfer.cancel': 'Cancel Transfer',
    'transfer.success': 'Transfer completed successfully',
    'transfer.to': 'Transfer to',
    'transfer.selectDepartment': 'Select Department',
    'transfer.selectSubdepartment': 'Select Subdepartment',
    'transfer.selectUnit': 'Select Unit',

    // Ministries
    'ministries.title': 'Government Ministries',
    'ministries.viewDetails': 'View Details',
    'ministries.interior': 'Ministry of Interior',
    'ministries.finance': 'Ministry of Finance',
    'ministries.education': 'Ministry of Education',
    'ministries.interiorDesc': 'Ministry responsible for internal security and civil affairs',
    'ministries.financeDesc': 'Ministry responsible for financial affairs and budget',
    'ministries.educationDesc': 'Ministry responsible for education and higher learning',

    // Departments
    'departments.title': 'Government Departments',
    'departments.addEmployee': 'Add New Employee',
    'departments.editEmployee': 'Edit Employee',
    'departments.employeeName': 'Full Name',
    'departments.employeeNameAr': 'Full Name (Arabic)',
    'departments.rank': 'Rank/Grade',
    'departments.position': 'Position Title',
    'departments.positionAr': 'Position Title (Arabic)',
    'departments.department': 'Department',
    'departments.save': 'Save Employee',
    'departments.update': 'Update Employee',
    'departments.cancel': 'Cancel',
    'departments.confirmDelete': 'Are you sure you want to delete this employee?',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error'
  },
  ar: {
    // Auth
    'auth.title': 'حكومة قطر',
    'auth.subtitle': 'نظام المخطط التنظيمي',
    'auth.description': 'وصول آمن إلى الهيكل التنظيمي الحكومي',
    'auth.username': 'اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.login': 'تسجيل الدخول',
    'auth.demo': 'بيانات تجريبية: admin / admin',
    'auth.usernamePlaceholder': 'أدخل اسم المستخدم (admin)',
    'auth.passwordPlaceholder': 'أدخل كلمة المرور (admin)',

    // Navigation
    'nav.dashboard': 'لوحة المعلومات',
    'nav.orgChart': 'المخطط التنظيمي',
    'nav.ministries': 'الوزارات',
    'nav.departments': 'الإدارات',
    'nav.logout': 'تسجيل الخروج',
    'nav.user': 'مستخدم إداري',
    'nav.role': 'مدير عام',

    // Dashboard
    'dashboard.totalPositions': 'إجمالي المناصب',
    'dashboard.ministries': 'الوزارات',
    'dashboard.activeUsers': 'المستخدمون النشطون',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.activity1': 'تمت إضافة منصب جديد: مدير تقنية المعلومات',
    'dashboard.activity2': 'تم تحديث هيكل الوزارة: وزارة المالية',
    'dashboard.activity3': 'تم منح وصول المستخدم: john.doe@gov.qa',
    'dashboard.timeAgo1': 'منذ ساعتين',
    'dashboard.timeAgo2': 'منذ 5 ساعات',
    'dashboard.timeAgo3': 'منذ يوم واحد',

    // Organization Chart
    'orgChart.title': 'المخطط التنظيمي التفاعلي',
    'orgChart.addPosition': 'إضافة منصب جديد',
    'orgChart.editPosition': 'تعديل المنصب',
    'orgChart.under': 'تحت',
    'orgChart.positionTitleEn': 'عنوان المنصب (إنجليزي)',
    'orgChart.positionTitleAr': 'عنوان المنصب (عربي)',
    'orgChart.currentHolder': 'الشاغل الحالي',
    'orgChart.department': 'الإدارة/الوزارة',
    'orgChart.addBtn': 'إضافة منصب',
    'orgChart.updateBtn': 'تحديث المنصب',
    'orgChart.cancel': 'إلغاء',
    'orgChart.fullScreen': 'عرض ملء الشاشة',
    'orgChart.exitFullScreen': 'إغلاق ملء الشاشة',
    'orgChart.zoomIn': 'تكبير',
    'orgChart.zoomOut': 'تصغير',
    'orgChart.resetView': 'إعادة تعيين العرض',
    'orgChart.legend': 'دليل التسلسل الهرمي',
    'orgChart.legendPrimeMinister': 'رئيس الوزراء والوزراء',
    'orgChart.legendDirector': 'المديرون',
    'orgChart.legendDepartment': 'الإدارات',
    'orgChart.legendSubdepartment': 'الإدارات الفرعية',
    'orgChart.legendUnit': 'الوحدات',
    'orgChart.legendNesting': 'الألوان الداكنة تشير إلى مستويات تداخل أعمق',
    'orgChart.search': 'البحث',
    'orgChart.searchPlaceholder': 'البحث بالاسم، المنصب، الإدارة...',
    'orgChart.searchResults': 'نتائج البحث',
    'orgChart.noResults': 'لا توجد نتائج',
    'orgChart.searchEmployee': 'موظف',
    'orgChart.searchPosition': 'منصب',
    'orgChart.searchDepartment': 'إدارة',
    'orgChart.clearSearch': 'مسح البحث',

    // Tooltips
    'tooltip.position': 'المنصب',
    'tooltip.holder': 'الشاغل الحالي',
    'tooltip.department': 'القسم',
    'tooltip.employeeCount': 'الموظفون',
    'tooltip.level': 'المستوى الهرمي',
    'tooltip.type': 'النوع',
    'tooltip.ministry': 'الوزارة',
    'tooltip.directReports': 'التقارير المباشرة',
    'tooltip.clickToView': 'انقر لعرض التفاصيل',
    'tooltip.clickToEdit': 'انقر للتحرير',
    'tooltip.dragToMove': 'اسحب لإعادة التنظيم',

    // Transfer
    'transfer.employee': 'نقل موظف',
    'transfer.structure': 'نقل هيكل',
    'transfer.selectDestination': 'اختر الوجهة',
    'transfer.confirm': 'تأكيد النقل',
    'transfer.cancel': 'إلغاء النقل',
    'transfer.success': 'تم النقل بنجاح',
    'transfer.to': 'النقل إلى',
    'transfer.selectDepartment': 'اختر القسم',
    'transfer.selectSubdepartment': 'اختر القسم الفرعي',
    'transfer.selectUnit': 'اختر الوحدة',

    // Ministries
    'ministries.title': 'الوزارات الحكومية',
    'ministries.viewDetails': 'عرض التفاصيل',
    'ministries.interior': 'وزارة الداخلية',
    'ministries.finance': 'وزارة المالية',
    'ministries.education': 'وزارة التعليم',
    'ministries.interiorDesc': 'الوزارة المسؤولة عن الأمن الداخلي والشؤون المدنية',
    'ministries.financeDesc': 'الوزارة المسؤولة عن الشؤون المالية والميزانية',
    'ministries.educationDesc': 'الوزارة المسؤولة عن التعليم والتعليم العالي',

    // Departments
    'departments.title': 'الإدارات الحكومية',
    'departments.addEmployee': 'إضافة موظف جديد',
    'departments.editEmployee': 'تعديل الموظف',
    'departments.employeeName': 'الاسم الكامل',
    'departments.employeeNameAr': 'الاسم الكامل (عربي)',
    'departments.rank': 'الرتبة/الدرجة',
    'departments.position': 'المسمى الوظيفي',
    'departments.positionAr': 'المسمى الوظيفي (عربي)',
    'departments.department': 'الإدارة',
    'departments.save': 'حفظ الموظف',
    'departments.update': 'تحديث الموظف',
    'departments.cancel': 'إلغاء',
    'departments.confirmDelete': 'هل أنت متأكد من حذف هذا الموظف؟',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.confirm': 'تأكيد',
    'common.success': 'نجح',
    'common.error': 'خطأ'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const DataContext = createContext<DataContextType | undefined>(undefined);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, isRTL, toggleLanguage, t }}>
      <div className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [departments] = useState<Department[]>(mockDepartments);
  const [subdepartments] = useState<Subdepartment[]>(mockSubdepartments);
  const [units] = useState<Unit[]>(mockUnits);

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === id ? { ...emp, ...employeeData } : emp
    ));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const getEmployeesByDepartment = (departmentId: string) => {
    return employees.filter(emp => emp.departmentId === departmentId);
  };

  const getEmployeesBySubdepartment = (subdepartmentId: string) => {
    return employees.filter(emp => emp.subdepartmentId === subdepartmentId);
  };

  const getEmployeesByUnit = (unitId: string) => {
    return employees.filter(emp => emp.unitId === unitId);
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown Department';
  };

  const getSubdepartmentName = (subdepartmentId: string) => {
    const subdept = subdepartments.find(s => s.id === subdepartmentId);
    return subdept ? subdept.name : 'Unknown Subdepartment';
  };

  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'Unknown Unit';
  };

  const getSubdepartmentsByDepartment = (departmentId: string) => {
    return subdepartments.filter(sub => sub.departmentId === departmentId);
  };

  const getUnitsBySubdepartment = (subdepartmentId: string) => {
    return units.filter(unit => unit.subdepartmentId === subdepartmentId);
  };

  // New nested hierarchy functions
  const getChildDepartments = (parentDepartmentId?: string) => {
    return departments.filter(dept => dept.parentDepartmentId === parentDepartmentId);
  };

  const getChildSubdepartments = (parentSubdepartmentId?: string) => {
    return subdepartments.filter(sub => sub.parentSubdepartmentId === parentSubdepartmentId);
  };

  const getChildUnits = (parentUnitId?: string) => {
    return units.filter(unit => unit.parentUnitId === parentUnitId);
  };

  const getRootDepartments = () => {
    return departments.filter(dept => !dept.parentDepartmentId);
  };

  const getRootSubdepartments = (departmentId: string) => {
    return subdepartments.filter(sub => sub.departmentId === departmentId && !sub.parentSubdepartmentId);
  };

  const getRootUnits = (subdepartmentId: string) => {
    return units.filter(unit => unit.subdepartmentId === subdepartmentId && !unit.parentUnitId);
  };

  // Transfer functions
  const transferEmployee = (employeeId: string, targetDepartmentId?: string, targetSubdepartmentId?: string, targetUnitId?: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          departmentId: targetDepartmentId || emp.departmentId,
          subdepartmentId: targetSubdepartmentId || emp.subdepartmentId,
          unitId: targetUnitId || emp.unitId
        };
      }
      return emp;
    }));
  };

  const transferDepartment = (departmentId: string, targetMinistryId: string, targetParentDepartmentId?: string) => {
    // Note: This would require updating the departments state which is currently read-only
    // In a real app, this would update the departments array
    console.log(`Transferring department ${departmentId} to ministry ${targetMinistryId}, parent: ${targetParentDepartmentId}`);
  };

  const transferSubdepartment = (subdepartmentId: string, targetDepartmentId: string, targetParentSubdepartmentId?: string) => {
    // Note: This would require updating the subdepartments state which is currently read-only
    // In a real app, this would update the subdepartments array
    console.log(`Transferring subdepartment ${subdepartmentId} to department ${targetDepartmentId}, parent: ${targetParentSubdepartmentId}`);
  };

  const transferUnit = (unitId: string, targetSubdepartmentId: string, targetParentUnitId?: string) => {
    // Note: This would require updating the units state which is currently read-only
    // In a real app, this would update the units array
    console.log(`Transferring unit ${unitId} to subdepartment ${targetSubdepartmentId}, parent: ${targetParentUnitId}`);
  };

  return (
    <DataContext.Provider value={{
      employees,
      departments,
      subdepartments,
      units,
      setEmployees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      getEmployeesByDepartment,
      getEmployeesBySubdepartment,
      getEmployeesByUnit,
      getDepartmentName,
      getSubdepartmentName,
      getUnitName,
      getSubdepartmentsByDepartment,
      getUnitsBySubdepartment,
      // New nested hierarchy functions
      getChildDepartments,
      getChildSubdepartments,
      getChildUnits,
      getRootDepartments,
      getRootSubdepartments,
      getRootUnits,
      // Transfer functions
      transferEmployee,
      transferDepartment,
      transferSubdepartment,
      transferUnit
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Types
interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Ministry {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  ministerName: string;
  ministerNameAr: string;
}

interface Department {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  ministryId: string;
  parentDepartmentId?: string; // For department nesting
  directorName: string;
  directorNameAr: string;
}

interface Subdepartment {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  departmentId: string;
  parentSubdepartmentId?: string; // For subdepartment nesting
  headName: string;
  headNameAr: string;
}

interface Unit {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  subdepartmentId: string;
  parentUnitId?: string; // For unit nesting
  supervisorName: string;
  supervisorNameAr: string;
}

interface Employee {
  id: string;
  name: string;
  nameAr: string;
  rank: string;
  position: string;
  positionAr: string;
  departmentId: string;
  subdepartmentId?: string;
  unitId?: string;
  email?: string;
  phone?: string;
}

interface OrgPosition {
  id: string;
  title: string;
  titleAr: string;
  holder?: string;
  department?: string;
  children?: OrgPosition[];
  isExpanded?: boolean;
  isDepartment?: boolean; // Flag to identify department nodes
  isSubdepartment?: boolean; // Flag to identify subdepartment nodes
  isUnit?: boolean; // Flag to identify unit nodes
}

// Components
const LoginForm: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({
        username,
        password,
        remember_me: false
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-qatar-maroon/95 via-qatar-maroon to-red-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+Cjwvc3ZnPg==')] opacity-20"></div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-qatar-maroon to-red-800 rounded-2xl p-4 shadow-lg">
                  <Shield className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Sparkles className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.title')}
            </h1>
            <p className="text-lg font-medium text-qatar-maroon mb-1">
              {t('auth.subtitle')}
            </p>
            <p className="text-sm text-gray-600">
              {t('auth.description')}
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Authentication Failed</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className={`block text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('auth.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`
                    block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent
                    bg-gray-50/50 placeholder-gray-400 text-gray-900
                    transition-all duration-200 ease-in-out
                    ${isRTL ? 'text-right pr-10 pl-3' : 'text-left'}
                  `}
                  placeholder="Enter username (admin)"
                  required
                  disabled={isLoading}
                />
                {isRTL && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className={`block text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`
                    block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent
                    bg-gray-50/50 placeholder-gray-400 text-gray-900
                    transition-all duration-200 ease-in-out
                    ${isRTL ? 'text-right pr-10 pl-12' : 'text-left'}
                  `}
                  placeholder="Enter password (admin123)"
                  required
                  disabled={isLoading}
                />
                {isRTL && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  className={`
                    absolute inset-y-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors
                    ${isRTL ? 'left-0' : 'right-0'}
                  `}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-qatar-maroon to-red-800 hover:from-qatar-maroon/90 hover:to-red-800/90
                         text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                         focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         transition-all duration-200 ease-in-out"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  {t('auth.login')}
                </>
              )}
            </button>

            {/* Demo Credentials */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Demo Access</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    Username: <span className="font-mono font-semibold bg-blue-100 px-2 py-0.5 rounded">admin</span> |
                    Password: <span className="font-mono font-semibold bg-blue-100 px-2 py-0.5 rounded">admin</span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              🔒 This is a secure government system. All activities are monitored and logged.
            </p>
          </div>
        </div>

        {/* Footer Credits */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm font-medium">
            Qatar Government Organization Chart System v2.0
          </p>
          <p className="text-white/60 text-xs mt-1">
            Enhanced UI · Secure Access · Real-time Updates
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const { t, isRTL } = useLanguage();

  const stats = [
    {
      title: t('dashboard.totalPositions'),
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: t('dashboard.ministries'),
      value: '23',
      change: '+2',
      trend: 'up',
      icon: Building2,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: t('dashboard.activeUsers'),
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: Network,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const activities = [
    {
      type: 'create',
      title: 'New position added: Director of IT',
      description: 'Ministry of Communications and Information Technology',
      time: '2 hours ago',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      type: 'update',
      title: 'Ministry structure updated',
      description: 'Ministry of Finance organizational changes approved',
      time: '5 hours ago',
      icon: Edit3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      type: 'access',
      title: 'User access granted',
      description: 'john.doe@gov.qa added to HR administrators',
      time: '1 day ago',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      type: 'review',
      title: 'Quarterly review completed',
      description: 'Q3 organizational efficiency metrics published',
      time: '2 days ago',
      icon: Sparkles,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-4xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('nav.dashboard')}
          </h1>
          <p className={`text-gray-600 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            Welcome back to your organization management hub
          </p>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="bg-white rounded-lg border p-2">
            <Globe className="h-5 w-5 text-qatar-maroon" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">Qatar Government</p>
            <p className="text-xs text-gray-500">Organization System</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>

            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="mr-1">↗</span>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} rounded-xl p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-full overflow-hidden">
        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.recentActivity')}
                </h2>
                <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-qatar-maroon bg-qatar-maroon/10 rounded-lg hover:bg-qatar-maroon/20 transition-colors">
                  View All
                  <span className="ml-1">→</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {activities.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`${activity.bgColor} rounded-lg p-2 flex-shrink-0`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <time className="text-xs text-gray-500 flex-shrink-0">
                          {activity.time}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate?.('orgChart')}
                className="w-full flex items-center justify-between p-3 text-left bg-gradient-to-r from-qatar-maroon to-red-800 text-white rounded-xl hover:from-qatar-maroon/90 hover:to-red-800/90 transition-all transform hover:scale-[1.02]">
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-3" />
                  <span className="font-medium">Add New Position</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={() => onNavigate?.('orgChart')}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Network className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="font-medium text-gray-900">View Org Chart</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => onNavigate?.('ministries')}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="font-medium text-gray-900">Manage Users</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">API Services</span>
                </div>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Backup Status</span>
                </div>
                <span className="text-sm font-medium text-amber-600">Scheduled</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Security</span>
                </div>
                <span className="text-sm font-medium text-green-600">Secure</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gradient-to-br from-qatar-maroon/5 to-red-800/5 rounded-2xl border border-qatar-maroon/10 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">System Efficiency</span>
                  <span className="font-medium text-gray-900">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Data Accuracy</span>
                  <span className="font-medium text-gray-900">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '98%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">User Satisfaction</span>
                  <span className="font-medium text-gray-900">91%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{width: '91%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveOrgChart: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const {
    employees,
    departments,
    subdepartments,
    units,
    getEmployeesByDepartment,
    getEmployeesBySubdepartment,
    getEmployeesByUnit,
    getDepartmentName,
    getSubdepartmentName,
    getUnitName,
    getSubdepartmentsByDepartment,
    getUnitsBySubdepartment,
    // New nested hierarchy functions
    getChildDepartments,
    getChildSubdepartments,
    getChildUnits,
    getRootDepartments,
    getRootSubdepartments,
    getRootUnits
  } = useData();
  const [chartData, setChartData] = useState<OrgPosition>(orgChartData);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  // Build complete organization chart with recursive nesting: Minister → Department(s) → Subdepartment(s) → Unit(s)
  const buildDynamicOrgChart = React.useCallback((): OrgPosition => {
    const baseChart = JSON.parse(JSON.stringify(orgChartData)); // Deep clone

    // Recursive function to build units with nesting
    const buildUnitsRecursively = (parentUnitId: string | undefined, subdepartmentId: string): OrgPosition[] => {
      const units = parentUnitId ? getChildUnits(parentUnitId) : getRootUnits(subdepartmentId);

      return units.map(unit => {
        const childUnits = buildUnitsRecursively(unit.id, subdepartmentId);
        const unitEmployeeCount = getEmployeesByUnit(unit.id).length;
        const totalEmployees = unitEmployeeCount + childUnits.reduce((acc, child) => {
          const childCount = parseInt(child.department.split(' ')[0]) || 0;
          return acc + childCount;
        }, 0);

        return {
          id: `${unit.id}-unit`,
          title: unit.name,
          titleAr: unit.nameAr,
          holder: unit.supervisorName,
          department: `${totalEmployees} employees`,
          children: childUnits,
          isExpanded: false,
          isDepartment: true, // Flag for click handling to show employees
          isUnit: true
        };
      });
    };

    // Recursive function to build subdepartments with nesting
    const buildSubdepartmentsRecursively = (parentSubdepartmentId: string | undefined, departmentId: string): OrgPosition[] => {
      const subdepartments = parentSubdepartmentId ? getChildSubdepartments(parentSubdepartmentId) : getRootSubdepartments(departmentId);

      return subdepartments.map(subdept => {
        const childSubdepartments = buildSubdepartmentsRecursively(subdept.id, departmentId);
        const units = buildUnitsRecursively(undefined, subdept.id);
        const allChildren = [...childSubdepartments, ...units];

        return {
          id: `${subdept.id}-subdept`,
          title: subdept.name,
          titleAr: subdept.nameAr,
          holder: subdept.headName,
          department: subdept.description,
          children: allChildren,
          isExpanded: false,
          isDepartment: false,
          isSubdepartment: true
        };
      });
    };

    // Recursive function to build departments with nesting
    const buildDepartmentsRecursively = (parentDepartmentId: string | undefined, ministryId: string): OrgPosition[] => {
      const departments = parentDepartmentId ? getChildDepartments(parentDepartmentId) : getRootDepartments().filter(dept => dept.ministryId === ministryId);

      return departments.map(dept => {
        const childDepartments = buildDepartmentsRecursively(dept.id, ministryId);
        const subdepartments = buildSubdepartmentsRecursively(undefined, dept.id);
        const allChildren = [...childDepartments, ...subdepartments];

        // Create department node
        const departmentNode: OrgPosition = {
          id: `${dept.id}-dept`,
          title: dept.name,
          titleAr: dept.nameAr,
          holder: `${allChildren.length} ${allChildren.length === 1 ? 'division' : 'divisions'}`,
          department: dept.description,
          children: allChildren,
          isExpanded: false,
          isDepartment: false
        };

        // Create director node with department as child
        return {
          id: `${dept.id}-director`,
          title: `Director of ${dept.name.replace(' Department', '')}`,
          titleAr: `مدير ${dept.nameAr}`,
          holder: dept.directorName,
          department: dept.name,
          children: [departmentNode],
          isExpanded: false,
          isDepartment: false
        };
      });
    };

    // Add complete hierarchy to ministers
    const addCompleteHierarchy = (position: OrgPosition): OrgPosition => {
      if (position.id === 'minister-interior' || position.id === 'minister-finance' || position.id === 'minister-education') {
        const ministryId = position.id === 'minister-interior' ? 'ministry-1' :
                          position.id === 'minister-finance' ? 'ministry-2' : 'ministry-3';

        const directorChildren = buildDepartmentsRecursively(undefined, ministryId);

        return {
          ...position,
          children: [...(position.children || []), ...directorChildren]
        };
      }

      if (position.children) {
        return {
          ...position,
          children: position.children.map(addCompleteHierarchy)
        };
      }

      return position;
    };

    return addCompleteHierarchy(baseChart);
  }, [employees, departments, subdepartments, units, getChildDepartments, getChildSubdepartments, getChildUnits, getRootDepartments, getRootSubdepartments, getRootUnits, getEmployeesByUnit]);

  // Update chart data when employees or departments change
  React.useEffect(() => {
    const newChartData = buildDynamicOrgChart();
    setChartData(newChartData);
  }, [buildDynamicOrgChart]);

  // Comprehensive search functionality
  const performSearch = React.useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{
      type: 'employee' | 'position' | 'department';
      id: string;
      name: string;
      nameAr?: string;
      position?: string;
      positionAr?: string;
      department?: string;
      ministry?: string;
      path: string[];
    }> = [];

    // Search through employees
    employees.forEach(employee => {
      const matchesName = employee.firstName.toLowerCase().includes(normalizedQuery) ||
                         employee.lastName.toLowerCase().includes(normalizedQuery) ||
                         employee.firstNameAr?.toLowerCase().includes(normalizedQuery) ||
                         employee.lastNameAr?.toLowerCase().includes(normalizedQuery);

      const matchesPosition = employee.jobTitle.toLowerCase().includes(normalizedQuery) ||
                             employee.jobTitleAr?.toLowerCase().includes(normalizedQuery);

      const matchesId = employee.id.toLowerCase().includes(normalizedQuery) ||
                       employee.email.toLowerCase().includes(normalizedQuery);

      if (matchesName || matchesPosition || matchesId) {
        const departmentName = employee.departmentId ? getDepartmentName(employee.departmentId) : '';
        const subdepartmentName = employee.subdepartmentId ? getSubdepartmentName(employee.subdepartmentId) : '';
        const unitName = employee.unitId ? getUnitName(employee.unitId) : '';

        const path = [departmentName, subdepartmentName, unitName].filter(Boolean);

        results.push({
          type: 'employee',
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          nameAr: employee.firstNameAr && employee.lastNameAr ? `${employee.firstNameAr} ${employee.lastNameAr}` : undefined,
          position: employee.jobTitle,
          positionAr: employee.jobTitleAr,
          department: departmentName,
          ministry: 'Qatar Government',
          path
        });
      }
    });

    // Search through departments
    departments.forEach(department => {
      const matchesName = department.name.toLowerCase().includes(normalizedQuery) ||
                         department.nameAr?.toLowerCase().includes(normalizedQuery);

      const matchesDescription = department.description?.toLowerCase().includes(normalizedQuery) ||
                                department.descriptionAr?.toLowerCase().includes(normalizedQuery);

      if (matchesName || matchesDescription) {
        results.push({
          type: 'department',
          id: department.id,
          name: department.name,
          nameAr: department.nameAr,
          department: department.name,
          ministry: 'Qatar Government',
          path: [department.name]
        });
      }
    });

    // Search through subdepartments
    subdepartments.forEach(subdepartment => {
      const matchesName = subdepartment.name.toLowerCase().includes(normalizedQuery) ||
                         subdepartment.nameAr?.toLowerCase().includes(normalizedQuery);

      if (matchesName) {
        const departmentName = getDepartmentName(subdepartment.departmentId);
        results.push({
          type: 'department',
          id: subdepartment.id,
          name: subdepartment.name,
          nameAr: subdepartment.nameAr,
          department: departmentName,
          ministry: 'Qatar Government',
          path: [departmentName, subdepartment.name]
        });
      }
    });

    // Search through units
    units.forEach(unit => {
      const matchesName = unit.name.toLowerCase().includes(normalizedQuery) ||
                         unit.nameAr?.toLowerCase().includes(normalizedQuery);

      if (matchesName) {
        const subdepartmentName = getSubdepartmentName(unit.subdepartmentId);
        const subdept = subdepartments.find(s => s.id === unit.subdepartmentId);
        const departmentName = subdept ? getDepartmentName(subdept.departmentId) : '';

        results.push({
          type: 'department',
          id: unit.id,
          name: unit.name,
          nameAr: unit.nameAr,
          department: departmentName,
          ministry: 'Qatar Government',
          path: [departmentName, subdepartmentName, unit.name].filter(Boolean)
        });
      }
    });

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === normalizedQuery;
      const bExact = b.name.toLowerCase() === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setSearchResults(results);
    setShowSearchResults(true);
  }, [employees, departments, subdepartments, units, getDepartmentName, getSubdepartmentName, getUnitName]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [isAddingChild, setIsAddingChild] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', titleAr: '', holder: '', department: '' });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dialogPosition, setDialogPosition] = useState<{x: number, y: number} | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{position: OrgPosition, x: number, y: number, level: number} | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    type: 'employee' | 'position' | 'department';
    id: string;
    name: string;
    nameAr?: string;
    position?: string;
    positionAr?: string;
    department?: string;
    ministry?: string;
    path: string[];
  }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Handle window resize to reposition dialog if needed
  React.useEffect(() => {
    const handleResize = () => {
      if (dialogPosition && (editingPosition || isAddingChild)) {
        // Validate current dialog position is still on screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dialogWidth = 384;
        const dialogHeight = 400;
        const padding = 20;

        const currentX = dialogPosition.x;
        const currentY = dialogPosition.y;

        // Check if dialog is now off-screen and reposition if needed
        if (currentX + dialogWidth > viewportWidth - padding ||
            currentY + dialogHeight > viewportHeight - padding ||
            currentX < padding || currentY < padding) {

          // Center the dialog if it's off-screen
          const centerX = Math.max(padding, (viewportWidth - dialogWidth) / 2);
          const centerY = Math.max(padding, (viewportHeight - dialogHeight) / 2);

          setDialogPosition({ x: centerX, y: centerY });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dialogPosition, editingPosition, isAddingChild]);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart dialog positioning that ensures dialog stays on-screen
  const calculateOptimalDialogPosition = (event: React.MouseEvent): {x: number, y: number} => {
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Dialog dimensions (w-96 = 384px, estimated height ~400px)
    const dialogWidth = 384;
    const dialogHeight = 400;
    const padding = 20; // Safe padding from edges

    // Start with preferred position (below the element)
    let x = rect.left;
    let y = rect.bottom + 10;

    // Adjust horizontal position if dialog would go off-screen
    if (x + dialogWidth > viewportWidth - padding) {
      // Try positioning to the left of the right edge
      x = viewportWidth - dialogWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position if dialog would go off-screen
    if (y + dialogHeight > viewportHeight - padding) {
      // Try positioning above the element
      y = rect.top - dialogHeight - 10;

      // If still off-screen, position it in the center vertically
      if (y < padding) {
        y = (viewportHeight - dialogHeight) / 2;
        if (y < padding) y = padding;
      }
    }

    // Ensure minimum padding from top
    if (y < padding) {
      y = padding;
    }

    // In full screen mode, account for potential zoom and pan offset
    if (isFullScreen) {
      // Additional adjustments for full screen mode
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;

      // If the calculated position is too far from center, move it closer
      if (Math.abs(x - centerX) > centerX * 0.7) {
        x = centerX - dialogWidth / 2;
      }
      if (Math.abs(y - centerY) > centerY * 0.7) {
        y = centerY - dialogHeight / 2;
      }
    }

    return { x: Math.max(padding, Math.min(x, viewportWidth - dialogWidth - padding)),
             y: Math.max(padding, Math.min(y, viewportHeight - dialogHeight - padding)) };
  };

  // Dynamic spacing calculator for infinite hierarchy levels (supports 10+ levels)
  const calculateDynamicSpacing = (level: number): { gap: string; minWidth: number } => {
    // Enhanced logarithmic scaling for very deep hierarchies
    const levelFactor = Math.log(level + 1) / Math.log(2); // Logarithmic scaling

    // Vertical gap: starts high, decreases more gradually for deep levels
    const baseVerticalGap = Math.max(3.5 - (levelFactor * 0.4), 1.2);

    // Horizontal gap: maintains better spacing for wide hierarchies
    const baseHorizontalGap = Math.max(2.2 - (levelFactor * 0.2), 0.8);

    // Card width: progressive reduction but ensures readability even at level 15+
    const baseWidth = Math.max(320 - (level * 12), 180);

    // Special handling for extremely deep levels (10+)
    if (level >= 10) {
      return {
        gap: `1.2rem 0.8rem`, // Fixed minimal spacing for very deep levels
        minWidth: 180 // Compact but readable
      };
    }

    return {
      gap: `${baseVerticalGap}rem ${baseHorizontalGap}rem`,
      minWidth: baseWidth
    };
  };

  // Cleanup tooltip timeout on unmount and when tooltip should be hidden
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Force tooltip cleanup when component state changes
  useEffect(() => {
    if (showEmployeeDialog) {
      setHoveredPosition(null);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  }, [showEmployeeDialog]);

  // Global mouse leave handler to ensure tooltips are cleared
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (hoveredPosition) {
        const target = e.target as HTMLElement;
        const card = target.closest('[data-org-card]');
        if (!card) {
          setHoveredPosition(null);
          if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = null;
          }
        }
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [hoveredPosition]);
  const [transferMode, setTransferMode] = useState<{type: 'employee' | 'structure', sourceId: string} | null>(null);

  const toggleExpansion = (positionId: string) => {
    const updatePosition = (position: OrgPosition): OrgPosition => {
      if (position.id === positionId) {
        return { ...position, isExpanded: !position.isExpanded };
      }
      if (position.children) {
        return { ...position, children: position.children.map(updatePosition) };
      }
      return position;
    };
    setChartData(updatePosition(chartData));
  };

  const selectPosition = (positionId: string) => {
    setSelectedPosition(selectedPosition === positionId ? null : positionId);
  };

  const handleDepartmentClick = (departmentId: string) => {
    console.log('handleDepartmentClick called with:', departmentId);
    // Handle department, subdepartment, and unit clicks
    let originalId = departmentId;

    if (departmentId.includes('-unit')) {
      // Extract original unit ID (e.g., "unit-1-unit" -> "unit-1")
      originalId = departmentId.replace('-unit', '');
    } else if (departmentId.includes('-subdept')) {
      // Extract original subdepartment ID (e.g., "subdept-1-subdept" -> "subdept-1")
      originalId = departmentId.replace('-subdept', '');
    } else if (departmentId.includes('-dept')) {
      // Extract original department ID (e.g., "dept-1-dept" -> "dept-1")
      originalId = departmentId.replace('-dept', '');
    }

    console.log('Setting selectedDepartment to:', originalId);
    console.log('Setting showEmployeeDialog to: true');
    setSelectedDepartment(originalId);
    setShowEmployeeDialog(true);
  };

  const closeEmployeeDialog = () => {
    setShowEmployeeDialog(false);
    setSelectedDepartment(null);
  };

  const addChildPosition = (parentId: string) => {
    const newPosition: OrgPosition = {
      id: `new-${Date.now()}`,
      title: editForm.title || 'New Position',
      titleAr: editForm.titleAr || 'منصب جديد',
      holder: editForm.holder,
      department: editForm.department,
      children: [],
      isExpanded: false
    };

    const updatePosition = (position: OrgPosition): OrgPosition => {
      if (position.id === parentId) {
        return {
          ...position,
          children: [...(position.children || []), newPosition],
          isExpanded: true
        };
      }
      if (position.children) {
        return { ...position, children: position.children.map(updatePosition) };
      }
      return position;
    };

    setChartData(updatePosition(chartData));
    setIsAddingChild(null);
    setEditForm({ title: '', titleAr: '', holder: '', department: '' });
  };

  const editPosition = (positionId: string) => {
    const updatePosition = (position: OrgPosition): OrgPosition => {
      if (position.id === positionId) {
        return {
          ...position,
          title: editForm.title || position.title,
          titleAr: editForm.titleAr || position.titleAr,
          holder: editForm.holder || position.holder,
          department: editForm.department || position.department
        };
      }
      if (position.children) {
        return { ...position, children: position.children.map(updatePosition) };
      }
      return position;
    };

    setChartData(updatePosition(chartData));
    setEditingPosition(null);
    setEditForm({ title: '', titleAr: '', holder: '', department: '' });
  };

  const deletePosition = (positionId: string) => {
    if (positionId === 'pm') {
      alert('Cannot delete the Prime Minister position!');
      return;
    }

    const updatePosition = (position: OrgPosition): OrgPosition => {
      if (position.children) {
        return {
          ...position,
          children: position.children.filter(child => child.id !== positionId).map(updatePosition)
        };
      }
      return position;
    };

    setChartData(updatePosition(chartData));
    setSelectedPosition(null);
  };

  const startEdit = (position: OrgPosition, event: React.MouseEvent) => {
    const optimalPosition = calculateOptimalDialogPosition(event);
    setDialogPosition(optimalPosition);
    setEditingPosition(position.id);
    setEditForm({
      title: position.title,
      titleAr: position.titleAr,
      holder: position.holder || '',
      department: position.department || ''
    });
  };

  const startAddChild = (parentId: string, event: React.MouseEvent) => {
    const optimalPosition = calculateOptimalDialogPosition(event);
    setDialogPosition(optimalPosition);
    setIsAddingChild(parentId);
    setEditForm({ title: '', titleAr: '', holder: '', department: '' });
  };

  const cancelEdit = () => {
    setEditingPosition(null);
    setIsAddingChild(null);
    setDialogPosition(null);
    setEditForm({ title: '', titleAr: '', holder: '', department: '' });
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const resetView = () => {
    setZoomLevel(1);
  };

  // Tooltip Component
  const Tooltip: React.FC<{
    position: OrgPosition;
    x: number;
    y: number;
    level: number;
  }> = ({ position, x, y, level }) => {
    const getPositionType = () => {
      if (position.isUnit) return t('tooltip.type') + ': ' + t('orgChart.legendUnit');
      if (position.isSubdepartment) return t('tooltip.type') + ': ' + t('orgChart.legendSubdepartment');
      if (position.isDepartment === false && !position.isSubdepartment && !position.isUnit) {
        return t('tooltip.type') + ': ' + t('orgChart.legendDepartment');
      }
      if (level === 0) return t('tooltip.type') + ': ' + t('orgChart.legendPrimeMinister');
      return t('tooltip.type') + ': ' + t('orgChart.legendDirector');
    };

    const getEmployeeCount = () => {
      if (position.isUnit && position.id.includes('-unit')) {
        const unitId = position.id.replace('-unit', '');
        return getEmployeesByUnit(unitId).length;
      }
      if (position.isSubdepartment && position.id.includes('-subdept')) {
        const subdeptId = position.id.replace('-subdept', '');
        return getEmployeesBySubdepartment(subdeptId).length;
      }
      if (position.isDepartment && position.id.includes('-dept')) {
        const deptId = position.id.replace('-dept', '');
        return getEmployeesByDepartment(deptId).length;
      }
      return 0;
    };

    return (
      <div
        className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs pointer-events-none
          ${isRTL ? 'text-right' : 'text-left'}`}
        style={{
          left: isRTL ? 'auto' : x + 10,
          right: isRTL ? window.innerWidth - x + 10 : 'auto',
          top: y - 20,
          transform: 'translateY(-100%)'
        }}
      >
        <div className="text-sm font-semibold text-qatar-maroon mb-2">
          {position.title}
        </div>
        {position.titleAr && (
          <div className="text-xs text-gray-600 mb-2" dir="rtl">
            {position.titleAr}
          </div>
        )}
        {position.holder && (
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">{t('tooltip.holder')}:</span> {position.holder}
          </div>
        )}
        <div className="text-xs text-gray-700 mb-1">
          {getPositionType()}
        </div>
        <div className="text-xs text-gray-700 mb-1">
          <span className="font-medium">{t('tooltip.level')}:</span> {level + 1}
        </div>
        {getEmployeeCount() > 0 && (
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">{t('tooltip.employeeCount')}:</span> {getEmployeeCount()}
          </div>
        )}
        {(position.children && position.children.length > 0) && (
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">{t('tooltip.directReports')}:</span> {position.children.length}
          </div>
        )}
        <div className="text-xs text-blue-600 mt-2 border-t pt-2">
          {t('tooltip.clickToView')}
        </div>
      </div>
    );
  };

  const OrgNode: React.FC<{
    position: OrgPosition;
    level: number;
    isLast?: boolean;
  }> = ({ position, level, isLast = false }) => {
    const hasChildren = position.children && position.children.length > 0;
    const isSelected = selectedPosition === position.id;
    const isRoot = level === 0;

    // Enhanced styling for nested levels
    const getNestedStyling = (position: OrgPosition, level: number) => {
      // Calculate nesting depth within the same type
      const baseLevel = 3; // Minister -> Director -> Department is level 3
      const nestingDepth = Math.max(0, level - baseLevel);

      if (position.isUnit) {
        switch (nestingDepth) {
          case 0: return 'bg-green-50 border-green-300 hover:border-green-500 hover:bg-green-100';
          case 1: return 'bg-green-100 border-green-400 hover:border-green-600 hover:bg-green-200 border-dashed';
          case 2: return 'bg-green-200 border-green-500 hover:border-green-700 hover:bg-green-300 border-dotted';
          default: return 'bg-green-300 border-green-600 hover:border-green-800 hover:bg-green-400 border-double';
        }
      } else if (position.isSubdepartment) {
        switch (nestingDepth) {
          case 0: return 'bg-yellow-50 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-100';
          case 1: return 'bg-yellow-100 border-yellow-400 hover:border-yellow-600 hover:bg-yellow-200 border-dashed';
          case 2: return 'bg-yellow-200 border-yellow-500 hover:border-yellow-700 hover:bg-yellow-300 border-dotted';
          default: return 'bg-yellow-300 border-yellow-600 hover:border-yellow-800 hover:bg-yellow-400 border-double';
        }
      } else if (position.isDepartment === false && !position.isSubdepartment && !position.isUnit) {
        // This is a department
        switch (nestingDepth) {
          case 0: return 'bg-blue-50 border-blue-300 hover:border-blue-500 hover:bg-blue-100';
          case 1: return 'bg-blue-100 border-blue-400 hover:border-blue-600 hover:bg-blue-200 border-dashed';
          case 2: return 'bg-blue-200 border-blue-500 hover:border-blue-700 hover:bg-blue-300 border-dotted';
          default: return 'bg-blue-300 border-blue-600 hover:border-blue-800 hover:bg-blue-400 border-double';
        }
      }
      return 'bg-white border-gray-300 hover:border-qatar-maroon';
    };

    return (
      <div className="flex flex-col items-center">
        <div
          onClick={(e) => {
            console.log('Card clicked:', position.id, position.title);

            // Check if click is on a button - if so, let button handle it
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
              console.log('Button click detected, skipping card click');
              return;
            }

            // Prevent event propagation for card clicks
            e.stopPropagation();
            e.preventDefault();

            // Check if this position has viewable employees (department, subdepartment, or unit)
            const isDepartmentLevel = position.isDepartment === false && !position.isSubdepartment && !position.isUnit;
            if (position.isDepartment || position.isSubdepartment || position.isUnit || isDepartmentLevel) {
              console.log('Triggering handleDepartmentClick for:', position.id, {
                isDepartment: position.isDepartment,
                isSubdepartment: position.isSubdepartment,
                isUnit: position.isUnit,
                isDepartmentLevel
              });
              handleDepartmentClick(position.id);
            } else {
              console.log('Triggering selectPosition for:', position.id);
              selectPosition(position.id);
            }
          }}
          onMouseEnter={(e) => {
            // Don't show tooltip if hovering over a button
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
              return;
            }

            // Clear any existing timeout immediately
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredPosition({
              position,
              x: rect.left + rect.width / 2,
              y: rect.top,
              level
            });
          }}
          onMouseLeave={(e) => {
            // Completely clear tooltip state immediately
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }

            // Force immediate tooltip removal
            setHoveredPosition(null);

            // Additional cleanup to prevent stale state
            setTimeout(() => {
              setHoveredPosition(null);
            }, 0);
          }}
          data-org-card
          data-level={level}
          className={`org-level-deep
            relative cursor-pointer transition-all duration-200 p-4 rounded-lg border-2 shadow-lg
            ${isRoot
              ? 'bg-qatar-maroon text-white border-qatar-maroon min-w-[300px]'
              : `${getNestedStyling(position, level)} ${
                  level === 1 ? 'min-w-[280px] max-w-[320px]' :
                  level === 2 ? 'min-w-[260px] max-w-[300px]' :
                  level === 3 ? 'min-w-[240px] max-w-[280px]' :
                  level >= 4 ? 'min-w-[220px] max-w-[260px]' :
                  position.isUnit
                    ? 'min-w-[220px] max-w-[260px]'
                    : position.isSubdepartment
                      ? 'min-w-[240px] max-w-[280px]'
                      : 'min-w-[260px] max-w-[300px]'
                }`
            }
            ${isSelected ? 'ring-4 ring-qatar-maroon ring-opacity-50 scale-105' : ''}
            ${!isRoot ? 'hover:shadow-xl' : ''}
          `}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleExpansion(position.id);
              }}
              onMouseEnter={(e) => e.stopPropagation()}
              onMouseLeave={(e) => e.stopPropagation()}
              className={`
                absolute left-1/2 transform -translate-x-1/2 rounded-full border-2
                flex items-center justify-center text-xs font-bold transition-colors
                ${level === 0 ? '-bottom-4 w-7 h-7' :
                  level === 1 ? '-bottom-3.5 w-6 h-6' :
                  level === 2 ? '-bottom-3 w-5 h-5' : '-bottom-2.5 w-4 h-4'}
                ${isRoot
                  ? 'bg-white text-qatar-maroon border-white hover:bg-gray-50'
                  : 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                }
              `}
            >
              {position.isExpanded ? '−' : '+'}
            </button>
          )}

          <div className="text-center">
            <h3 className={`font-bold text-lg ${isRoot ? 'text-white' : 'text-qatar-maroon'}`}>
              {position.title}
            </h3>
            <p className={`text-sm mt-1 ${isRoot ? 'text-qatar-maroon/20' : 'text-gray-600'}`} dir="rtl">
              {position.titleAr}
            </p>
            {position.holder && (
              <p className={`text-xs mt-2 font-medium ${
                isRoot ? 'text-white/90' :
                position.isDepartment ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {position.holder}
              </p>
            )}
            {(() => {
              const isDepartmentLevel = position.isDepartment === false && !position.isSubdepartment && !position.isUnit;
              const isClickable = position.isDepartment || position.isSubdepartment || position.isUnit || isDepartmentLevel;
              return isClickable && (
                <p className={`text-xs mt-1 font-medium ${
                  position.isUnit ? 'text-green-600' :
                  position.isSubdepartment ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  👥 Click to view employees
                </p>
              );
            })()}
            {position.department && !isRoot && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {position.department}
              </p>
            )}

            <div className="flex justify-center gap-1 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  startEdit(position, e);
                }}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                className={`px-2 py-1 text-xs rounded transition-colors
                  ${isRoot
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
              >
                ✏️
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  startAddChild(position.id, e);
                }}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                className={`px-2 py-1 text-xs rounded transition-colors
                  ${isRoot
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
              >
                ➕
              </button>

              {!isRoot && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (confirm(`Are you sure you want to delete ${position.title}?`)) {
                      deletePosition(position.id);
                    }
                  }}
                  onMouseEnter={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>

        {hasChildren && position.isExpanded && (
          <div className={`${level === 0 ? 'mt-8' : level === 1 ? 'mt-7' : level === 2 ? 'mt-6' : 'mt-5'}`}>
            {/* Dynamic spacing connector system */}
            <div className="flex flex-col items-center">
              {/* Main vertical connector from parent - height adapts to level */}
              <div className={`w-1 bg-qatar-maroon rounded ${
                level === 0 ? 'h-8' : level === 1 ? 'h-7' : 'h-6'
              }`}></div>

              {/* Central junction - size adapts to level */}
              <div className={`bg-qatar-maroon rounded-full border-2 border-white shadow-md ${
                level === 0 ? 'w-4 h-4' : level === 1 ? 'w-3.5 h-3.5' : 'w-3 h-3'
              }`}></div>

              {/* Horizontal distribution with dynamic width */}
              <div className="relative w-full flex flex-col items-center">
                {/* Horizontal line for multiple children - width adapts to children count and level */}
                {position.children!.length > 1 && (
                  <div className={`flex items-center justify-center relative w-full ${
                    level === 0 ? 'h-8' : level === 1 ? 'h-7' : 'h-6'
                  }`}>
                    <div className="h-1 bg-qatar-maroon rounded"
                         style={{
                           width: position.children!.length <= 2 ? '150px' :
                                  position.children!.length <= 4 ? `${Math.min(70, position.children!.length * 18)}%` :
                                  `${Math.min(85, position.children!.length * 15)}%`,
                           minWidth: level <= 1 ? '120px' : '100px'
                         }}></div>
                  </div>
                )}

                {/* Dynamic children grid with adaptive spacing */}
                <div className="w-full">
                  <div className="grid justify-items-center"
                       style={{
                         gap: calculateDynamicSpacing(level).gap,
                         gridTemplateColumns: (() => {
                           const childCount = position.children!.length;
                           const { minWidth } = calculateDynamicSpacing(level);

                           if (childCount === 1) return '1fr';
                           if (childCount === 2) return `repeat(2, minmax(${minWidth}px, 1fr))`;
                           if (childCount <= 4) {
                             return `repeat(${childCount}, minmax(${minWidth - (level * 10)}px, 1fr))`;
                           }
                           return `repeat(auto-fit, minmax(${minWidth - (level * 15)}px, 1fr))`;
                         })(),
                         width: '100%',
                         maxWidth: level === 0 ? '100%' :
                                  level === 1 ? '95%' :
                                  level === 2 ? '90%' : '85%'
                       }}>
                    {position.children!.map((child, index) => (
                      <div key={child.id} className="flex flex-col items-center w-full">
                        {/* Vertical connector to child - adaptive height */}
                        <div className={`w-1 bg-qatar-maroon rounded mb-2 ${
                          level === 0 ? 'h-8' : level === 1 ? 'h-7' : level === 2 ? 'h-6' : 'h-5'
                        }`}></div>

                        {/* Child node */}
                        <OrgNode
                          position={child}
                          level={level + 1}
                          isLast={index === position.children!.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Enhanced Organization Chart with fixes */}
      <EnhancedOrgChart isRTL={isRTL} />

      {/* Legend Toggle Button */}
      <div className={`fixed bottom-6 ${isRTL ? 'right-6' : 'left-6'} z-[10000]`}>
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="bg-qatar-maroon text-white p-3 rounded-lg shadow-lg hover:bg-qatar-maroon/90 transition-colors mb-4 flex items-center gap-2"
            title={isRTL ? "إظهار دليل الألوان" : "Show Color Legend"}
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
            {isRTL ? "دليل الألوان" : "Legend"}
          </button>
        )}
      </div>

      {/* Color Legend */}
      {showLegend && (
        <div className={`fixed bottom-6 ${isRTL ? 'right-6' : 'left-6'} bg-white rounded-lg shadow-lg border border-qatar-maroon/20 p-4 max-w-xs z-[9999]`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-qatar-maroon flex items-center gap-2">
              <div className="w-3 h-3 bg-qatar-maroon rounded-full"></div>
              {isRTL ? "دليل الألوان" : "Color Legend"}
            </h3>
            <button
              onClick={() => setShowLegend(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isRTL ? "إخفاء دليل الألوان" : "Hide Legend"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        <div className="space-y-3">
          {/* Organization Types */}
          <div>
            <h4 className="text-xs font-semibold text-qatar-maroon mb-2">{isRTL ? "أنواع المنظمات" : "Organization Types"}</h4>
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-qatar-maroon rounded"></div>
                <span>{isRTL ? "الوزارات" : "Ministry"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-blue-600 rounded"></div>
                <span>{isRTL ? "الإدارات" : "Department"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-green-600 rounded"></div>
                <span>{isRTL ? "الإدارات الفرعية" : "Sub-Department"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-purple-600 rounded"></div>
                <span>{isRTL ? "الوحدات" : "Unit"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-orange-500 rounded"></div>
                <span>{isRTL ? "الأقسام" : "Section"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-teal-500 rounded"></div>
                <span>{isRTL ? "الفرق" : "Team"}</span>
              </div>
            </div>
          </div>

          {/* Employee Position Levels */}
          <div>
            <h4 className="text-xs font-semibold text-qatar-maroon mb-2">{isRTL ? "مستويات المناصب" : "Position Levels"}</h4>
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-amber-300 rounded"></div>
                <span>{isRTL ? "رئيس الوزراء" : "Prime Minister"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-yellow-200 rounded"></div>
                <span>{isRTL ? "وزير" : "Minister"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-blue-200 rounded"></div>
                <span>{isRTL ? "نائب وزير" : "Deputy Minister"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-green-200 rounded"></div>
                <span>{isRTL ? "وكيل" : "Undersecretary"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-purple-200 rounded"></div>
                <span>{isRTL ? "مساعد وكيل" : "Assistant Under."}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-orange-200 rounded"></div>
                <span>{isRTL ? "مدير" : "Director"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-teal-200 rounded"></div>
                <span>{isRTL ? "نائب مدير" : "Deputy Director"}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-3 bg-gray-200 rounded"></div>
                <span>{isRTL ? "مدير/ضابط" : "Manager/Officer"}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
const Ministries: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('ministries.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockMinistries.map((ministry) => (
          <div key={ministry.id} className="card p-6">
            <h3 className={`text-xl font-semibold text-qatar-maroon mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {ministry.name}
            </h3>
            <p className="text-gray-600 mb-4" dir="rtl">
              {ministry.nameAr}
            </p>
            <p className={`text-sm text-gray-700 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {ministry.description}
            </p>
            <button className="btn-secondary w-full">
              {t('ministries.viewDetails')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Departments: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { employees, departments, subdepartments, units, addEmployee, updateEmployee, deleteEmployee, getEmployeesByDepartment, transferEmployee } = useData();
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    nameAr: '',
    rank: '',
    position: '',
    positionAr: '',
    departmentId: '',
    email: '',
    phone: ''
  });
  const [transferringEmployee, setTransferringEmployee] = useState<Employee | null>(null);
  const [transferForm, setTransferForm] = useState({
    targetDepartmentId: '',
    targetSubdepartmentId: '',
    targetUnitId: ''
  });

  const handleAddEmployee = () => {
    if (!employeeForm.name || !employeeForm.position || !employeeForm.departmentId) return;

    addEmployee({
      name: employeeForm.name,
      nameAr: employeeForm.nameAr,
      rank: employeeForm.rank,
      position: employeeForm.position,
      positionAr: employeeForm.positionAr,
      departmentId: employeeForm.departmentId,
      email: employeeForm.email,
      phone: employeeForm.phone
    });
    resetForm();
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, employeeForm);
    resetForm();
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm(t('departments.confirmDelete'))) {
      deleteEmployee(employeeId);
    }
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      nameAr: employee.nameAr,
      rank: employee.rank,
      position: employee.position,
      positionAr: employee.positionAr,
      departmentId: employee.departmentId,
      email: employee.email || '',
      phone: employee.phone || ''
    });
  };

  const resetForm = () => {
    setIsAddingEmployee(false);
    setEditingEmployee(null);
    setEmployeeForm({
      name: '',
      nameAr: '',
      rank: '',
      position: '',
      positionAr: '',
      departmentId: '',
      email: '',
      phone: ''
    });
  };

  // Transfer functions
  const startTransfer = (employee: Employee) => {
    setTransferringEmployee(employee);
    setTransferForm({
      targetDepartmentId: employee.departmentId || '',
      targetSubdepartmentId: employee.subdepartmentId || '',
      targetUnitId: employee.unitId || ''
    });
  };

  const handleTransfer = () => {
    if (!transferringEmployee) return;

    transferEmployee(
      transferringEmployee.id,
      transferForm.targetDepartmentId || undefined,
      transferForm.targetSubdepartmentId || undefined,
      transferForm.targetUnitId || undefined
    );

    setTransferringEmployee(null);
    setTransferForm({
      targetDepartmentId: '',
      targetSubdepartmentId: '',
      targetUnitId: ''
    });
  };

  const cancelTransfer = () => {
    setTransferringEmployee(null);
    setTransferForm({
      targetDepartmentId: '',
      targetSubdepartmentId: '',
      targetUnitId: ''
    });
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown Department';
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className={`text-3xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('departments.title')}
        </h1>
        <button
          onClick={() => setIsAddingEmployee(true)}
          className={`btn-primary flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="h-4 w-4" />
          {t('departments.addEmployee')}
        </button>
      </div>

      {/* Employee Form Modal */}
      {(isAddingEmployee || editingEmployee) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className={`text-xl font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {editingEmployee ? t('departments.editEmployee') : t('departments.addEmployee')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.employeeName')}
                </label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  placeholder={t('departments.employeeName')}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.employeeNameAr')}
                </label>
                <input
                  type="text"
                  value={employeeForm.nameAr}
                  onChange={(e) => setEmployeeForm({...employeeForm, nameAr: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  placeholder={t('departments.employeeNameAr')}
                  dir="rtl"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.rank')}
                </label>
                <select
                  value={employeeForm.rank}
                  onChange={(e) => setEmployeeForm({...employeeForm, rank: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                >
                  <option value="">Select Rank</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Senior">Senior</option>
                  <option value="Principal">Principal</option>
                  <option value="Director">Director</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.position')}
                </label>
                <input
                  type="text"
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  placeholder={t('departments.position')}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.positionAr')}
                </label>
                <input
                  type="text"
                  value={employeeForm.positionAr}
                  onChange={(e) => setEmployeeForm({...employeeForm, positionAr: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  placeholder={t('departments.positionAr')}
                  dir="rtl"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('departments.department')}
                </label>
                <select
                  value={employeeForm.departmentId}
                  onChange={(e) => setEmployeeForm({...employeeForm, departmentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                  className="btn-primary flex-1"
                >
                  {editingEmployee ? t('departments.update') : t('departments.save')}
                </button>
                <button
                  onClick={resetForm}
                  className="btn-secondary flex-1"
                >
                  {t('departments.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Employee Modal */}
      {transferringEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className={`text-xl font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('transfer.employee')} - {transferringEmployee.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('transfer.selectDepartment')}
                </label>
                <select
                  value={transferForm.targetDepartmentId}
                  onChange={(e) => setTransferForm(prev => ({
                    ...prev,
                    targetDepartmentId: e.target.value,
                    targetSubdepartmentId: '', // Reset subdepartment when department changes
                    targetUnitId: '' // Reset unit when department changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                >
                  <option value="">{t('transfer.selectDepartment')}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {transferForm.targetDepartmentId && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('transfer.selectSubdepartment')} (Optional)
                  </label>
                  <select
                    value={transferForm.targetSubdepartmentId}
                    onChange={(e) => setTransferForm(prev => ({
                      ...prev,
                      targetSubdepartmentId: e.target.value,
                      targetUnitId: '' // Reset unit when subdepartment changes
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  >
                    <option value="">{t('transfer.selectSubdepartment')}</option>
                    {subdepartments
                      .filter(sub => sub.departmentId === transferForm.targetDepartmentId)
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {transferForm.targetSubdepartmentId && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('transfer.selectUnit')} (Optional)
                  </label>
                  <select
                    value={transferForm.targetUnitId}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, targetUnitId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-qatar-maroon focus:border-qatar-maroon"
                  >
                    <option value="">{t('transfer.selectUnit')}</option>
                    {units
                      .filter(unit => unit.subdepartmentId === transferForm.targetSubdepartmentId)
                      .map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                  </select>
                </div>
              )}

              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={handleTransfer}
                  className="btn-primary flex-1"
                  disabled={!transferForm.targetDepartmentId}
                >
                  {t('transfer.confirm')}
                </button>
                <button
                  onClick={cancelTransfer}
                  className="btn-secondary flex-1"
                >
                  {t('transfer.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments and Employees Grid */}
      <div className="space-y-8">
        {departments.map(department => {
          const deptEmployees = employees.filter(emp => emp.departmentId === department.id);

          return (
            <div key={department.id} className="card p-6">
              <div className={`mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h2 className="text-2xl font-bold text-qatar-maroon">{department.name}</h2>
                <p className="text-gray-600 text-sm" dir="rtl">{department.nameAr}</p>
                <div className="bg-qatar-maroon/5 p-2 rounded-lg border border-qatar-maroon/20 mt-2 mb-2">
                  <p className="text-xs font-semibold text-qatar-maroon">Director</p>
                  <p className="text-sm font-medium text-gray-800">{department.directorName}</p>
                  <p className="text-xs text-gray-600" dir="rtl">{department.directorNameAr}</p>
                </div>
                <p className={`text-gray-700 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {department.description}
                </p>
              </div>

              {deptEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptEmployees.map(employee => (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        <h4 className="font-semibold text-qatar-maroon">{employee.name}</h4>
                        <p className="text-sm text-gray-600" dir="rtl">{employee.nameAr}</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">{employee.position}</p>
                        <p className="text-sm text-gray-600" dir="rtl">{employee.positionAr}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-qatar-maroon/10 text-qatar-maroon text-xs rounded">
                          {employee.rank}
                        </span>
                      </div>

                      <div className={`flex gap-2 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => startEdit(employee)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => startTransfer(employee)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          {t('transfer.employee')}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-gray-500 text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                  No employees in this department yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Layout: React.FC<{ user: User; onLogout: () => void; children: React.ReactNode }> = ({
  user,
  onLogout,
  children
}) => {
  const { t, isRTL, toggleLanguage } = useLanguage();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: t('nav.dashboard'), icon: Home },
    { id: 'orgChart', name: t('nav.orgChart'), icon: Network },
    { id: 'ministries', name: t('nav.ministries'), icon: Users },
    { id: 'departments', name: t('nav.departments'), icon: Building2 },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'orgChart':
        return <InteractiveOrgChart />;
      case 'ministries':
        return <Ministries />;
      case 'departments':
        return <Departments />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <nav className="bg-white shadow-lg">
        <div className="w-full px-4">
          <div className={`flex justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Shield className="h-8 w-8 text-qatar-maroon" />
              <span className={`text-xl font-bold text-qatar-maroon ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('auth.title')}
              </span>
            </div>

            <div className={`hidden md:flex items-center space-x-8 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'text-qatar-maroon bg-qatar-maroon/10'
                        : 'text-gray-600 hover:text-qatar-maroon'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Icon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {item.name}
                  </button>
                );
              })}
            </div>

            <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <button
                onClick={toggleLanguage}
                className="p-2 text-gray-600 hover:text-qatar-maroon transition-colors"
              >
                <Globe className="h-5 w-5" />
              </button>

              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`text-sm text-gray-700 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full py-6 px-4">
        {renderPage()}
      </main>
    </div>
  );
};

// Mock data
const mockUser: User = {
  id: 'user-1',
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin'
};

const mockMinistries: Ministry[] = [
  {
    id: 'ministry-1',
    name: 'Ministry of Interior',
    nameAr: 'وزارة الداخلية',
    description: 'Ministry responsible for internal security and civil affairs',
    descriptionAr: 'الوزارة المسؤولة عن الأمن الداخلي والشؤون المدنية',
    ministerName: 'H.E. Sheikh Khalid bin Khalifa bin Abdulaziz Al Thani',
    ministerNameAr: 'معالي الشيخ خالد بن خليفة بن عبدالعزيز آل ثاني'
  },
  {
    id: 'ministry-2',
    name: 'Ministry of Finance',
    nameAr: 'وزارة المالية',
    description: 'Ministry responsible for financial affairs and budget',
    descriptionAr: 'الوزارة المسؤولة عن الشؤون المالية والميزانية',
    ministerName: 'H.E. Ali bin Ahmed Al Kuwari',
    ministerNameAr: 'معالي علي بن أحمد الكواري'
  },
  {
    id: 'ministry-3',
    name: 'Ministry of Education',
    nameAr: 'وزارة التعليم',
    description: 'Ministry responsible for education and higher learning',
    descriptionAr: 'الوزارة المسؤولة عن التعليم والتعليم العالي',
    ministerName: 'H.E. Buthaina bint Ali Al Jabir Al Nuaimi',
    ministerNameAr: 'معالي بثينة بنت علي الجابر النعيمي'
  }
];

const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'Information Technology Department',
    nameAr: 'إدارة تقنية المعلومات',
    description: 'Responsible for government IT infrastructure and digital transformation',
    descriptionAr: 'مسؤولة عن البنية التحتية لتقنية المعلومات الحكومية والتحول الرقمي',
    ministryId: 'ministry-1',
    directorName: 'Ahmed Al Mahmoud',
    directorNameAr: 'أحمد المحمود'
  },
  {
    id: 'dept-2',
    name: 'Human Resources Department',
    nameAr: 'إدارة الموارد البشرية',
    description: 'Manages government employee affairs and development',
    descriptionAr: 'تدير شؤون الموظفين الحكوميين وتطويرهم',
    ministryId: 'ministry-1',
    directorName: 'Aisha Al Mannai',
    directorNameAr: 'عائشة المناعي'
  },
  {
    id: 'dept-3',
    name: 'Budget and Financial Planning',
    nameAr: 'إدارة الميزانية والتخطيط المالي',
    description: 'Handles budget planning and financial analysis',
    descriptionAr: 'تتولى تخطيط الميزانية والتحليل المالي',
    ministryId: 'ministry-2',
    directorName: 'Dr. Ahmed Al Mannai',
    directorNameAr: 'د. أحمد المناعي'
  },
  {
    id: 'dept-4',
    name: 'Curriculum Development',
    nameAr: 'إدارة تطوير المناهج',
    description: 'Develops and updates educational curricula',
    descriptionAr: 'تطور وتحدث المناهج التعليمية',
    ministryId: 'ministry-3',
    directorName: 'Dr. Maryam Al Dosari',
    directorNameAr: 'د. مريم الدوسري'
  },
  // Nested departments under IT Department
  {
    id: 'dept-5',
    name: 'Cloud Computing Division',
    nameAr: 'قسم الحوسبة السحابية',
    description: 'Sub-department under IT focusing on cloud infrastructure',
    descriptionAr: 'قسم فرعي تحت تقنية المعلومات يركز على البنية التحتية السحابية',
    ministryId: 'ministry-1',
    parentDepartmentId: 'dept-1', // Nested under IT Department
    directorName: 'Sara Al Kuwari',
    directorNameAr: 'سارة الكواري'
  },
  {
    id: 'dept-6',
    name: 'AI & Innovation Lab',
    nameAr: 'مختبر الذكاء الاصطناعي والابتكار',
    description: 'Research and development division under Cloud Computing',
    descriptionAr: 'قسم البحث والتطوير تحت الحوسبة السحابية',
    ministryId: 'ministry-1',
    parentDepartmentId: 'dept-5', // Nested under Cloud Computing Division
    directorName: 'Dr. Ali Al Hajri',
    directorNameAr: 'د. علي الهاجري'
  }
];

const mockSubdepartments: Subdepartment[] = [
  // IT Department Subdepartments
  {
    id: 'subdept-1',
    name: 'Infrastructure & Networks',
    nameAr: 'البنية التحتية والشبكات',
    description: 'Manages government IT infrastructure and network operations',
    descriptionAr: 'تدير البنية التحتية لتقنية المعلومات الحكومية وعمليات الشبكة',
    departmentId: 'dept-1',
    headName: 'Omar Al Rashid',
    headNameAr: 'عمر الراشد'
  },
  {
    id: 'subdept-2',
    name: 'Cybersecurity & Data Protection',
    nameAr: 'الأمن السيبراني وحماية البيانات',
    description: 'Handles cybersecurity, data protection, and information security',
    descriptionAr: 'تتولى الأمن السيبراني وحماية البيانات وأمن المعلومات',
    departmentId: 'dept-1',
    headName: 'Layla Al Ansari',
    headNameAr: 'ليلى الأنصاري'
  },
  // HR Department Subdepartments
  {
    id: 'subdept-3',
    name: 'Recruitment & Selection',
    nameAr: 'التوظيف والاختيار',
    description: 'Manages recruitment, hiring, and employee selection processes',
    descriptionAr: 'تدير عمليات التوظيف والتعيين واختيار الموظفين',
    departmentId: 'dept-2',
    headName: 'Khalid Al Nasr',
    headNameAr: 'خالد النصر'
  },
  {
    id: 'subdept-4',
    name: 'Training & Development',
    nameAr: 'التدريب والتطوير',
    description: 'Handles employee training, development, and capacity building',
    descriptionAr: 'تتولى تدريب الموظفين والتطوير وبناء القدرات',
    departmentId: 'dept-2',
    headName: 'Maryam Al Thani',
    headNameAr: 'مريم آل ثاني'
  },
  // Budget Department Subdepartments
  {
    id: 'subdept-5',
    name: 'Financial Planning & Analysis',
    nameAr: 'التخطيط المالي والتحليل',
    description: 'Conducts financial planning, analysis, and budget forecasting',
    descriptionAr: 'تقوم بالتخطيط المالي والتحليل وتوقعات الميزانية',
    departmentId: 'dept-3',
    headName: 'Nora Al Sulaiti',
    headNameAr: 'نورا السليطي'
  },
  {
    id: 'subdept-6',
    name: 'Budget Monitoring & Control',
    nameAr: 'مراقبة الميزانية والتحكم',
    description: 'Monitors budget execution and financial controls',
    descriptionAr: 'تراقب تنفيذ الميزانية والضوابط المالية',
    departmentId: 'dept-3',
    headName: 'Omar Al Hashemi',
    headNameAr: 'عمر الهاشمي'
  },
  // Curriculum Department Subdepartments
  {
    id: 'subdept-7',
    name: 'Primary Education Curriculum',
    nameAr: 'مناهج التعليم الابتدائي',
    description: 'Develops curriculum for primary education levels',
    descriptionAr: 'تطور المناهج لمستويات التعليم الابتدائي',
    departmentId: 'dept-4',
    headName: 'Saad Al Marri',
    headNameAr: 'سعد المري'
  },
  {
    id: 'subdept-8',
    name: 'Secondary Education Curriculum',
    nameAr: 'مناهج التعليم الثانوي',
    description: 'Develops curriculum for secondary education levels',
    descriptionAr: 'تطور المناهج لمستويات التعليم الثانوي',
    departmentId: 'dept-4',
    headName: 'Fatima Al Kuwari',
    headNameAr: 'فاطمة الكواري'
  },
  // Nested subdepartments
  {
    id: 'subdept-9',
    name: 'Cloud Security Team',
    nameAr: 'فريق أمن السحابة',
    description: 'Specialized security team under Cybersecurity subdepartment',
    descriptionAr: 'فريق أمن متخصص تحت قسم الأمن السيبراني',
    departmentId: 'dept-1',
    parentSubdepartmentId: 'subdept-2', // Nested under Cybersecurity
    headName: 'Ahmed Al Zahra',
    headNameAr: 'أحمد الزهرة'
  },
  {
    id: 'subdept-10',
    name: 'Advanced Training Programs',
    nameAr: 'برامج التدريب المتقدمة',
    description: 'Advanced training division under Training & Development',
    descriptionAr: 'قسم التدريب المتقدم تحت التدريب والتطوير',
    departmentId: 'dept-2',
    parentSubdepartmentId: 'subdept-4', // Nested under Training & Development
    headName: 'Nadia Al Farisi',
    headNameAr: 'نادية الفارسي'
  }
];

const mockUnits: Unit[] = [
  // Infrastructure & Networks Units
  {
    id: 'unit-1',
    name: 'Server Management Unit',
    nameAr: 'وحدة إدارة الخوادم',
    description: 'Manages government servers and data centers',
    descriptionAr: 'تدير الخوادم الحكومية ومراكز البيانات',
    subdepartmentId: 'subdept-1',
    supervisorName: 'Ahmed Al Mahmoud',
    supervisorNameAr: 'أحمد المحمود'
  },
  {
    id: 'unit-2',
    name: 'Network Operations Unit',
    nameAr: 'وحدة عمليات الشبكة',
    description: 'Monitors and maintains network infrastructure',
    descriptionAr: 'تراقب وتحافظ على البنية التحتية للشبكة',
    subdepartmentId: 'subdept-1',
    supervisorName: 'Fatima Al Thani',
    supervisorNameAr: 'فاطمة آل ثاني'
  },
  // Cybersecurity Units
  {
    id: 'unit-3',
    name: 'Threat Analysis Unit',
    nameAr: 'وحدة تحليل التهديدات',
    description: 'Analyzes and responds to cybersecurity threats',
    descriptionAr: 'تحلل وتستجيب للتهديدات السيبرانية',
    subdepartmentId: 'subdept-2',
    supervisorName: 'Mohammed Al Kuwari',
    supervisorNameAr: 'محمد الكواري'
  },
  {
    id: 'unit-4',
    name: 'Data Protection Unit',
    nameAr: 'وحدة حماية البيانات',
    description: 'Ensures data privacy and protection compliance',
    descriptionAr: 'تضمن خصوصية البيانات والامتثال للحماية',
    subdepartmentId: 'subdept-2',
    supervisorName: 'Aisha Al Mannai',
    supervisorNameAr: 'عائشة المناعي'
  },
  // Recruitment Units
  {
    id: 'unit-5',
    name: 'Candidate Assessment Unit',
    nameAr: 'وحدة تقييم المرشحين',
    description: 'Conducts candidate evaluations and assessments',
    descriptionAr: 'تقوم بتقييمات وتقييم المرشحين',
    subdepartmentId: 'subdept-3',
    supervisorName: 'Khalid Al Nasr',
    supervisorNameAr: 'خالد النصر'
  },
  {
    id: 'unit-6',
    name: 'Onboarding Unit',
    nameAr: 'وحدة الإدماج',
    description: 'Manages new employee onboarding processes',
    descriptionAr: 'تدير عمليات إدماج الموظفين الجدد',
    subdepartmentId: 'subdept-3',
    supervisorName: 'Nora Al Sulaiti',
    supervisorNameAr: 'نورا السليطي'
  },
  // Nested units
  {
    id: 'unit-7',
    name: 'Network Operations Center Level 2',
    nameAr: 'مركز عمليات الشبكة المستوى الثاني',
    description: 'Advanced NOC operations under Network Operations Center',
    descriptionAr: 'عمليات مركز الشبكة المتقدمة تحت مركز عمليات الشبكة',
    subdepartmentId: 'subdept-1',
    parentUnitId: 'unit-1', // Nested under Network Operations Center
    supervisorName: 'Yousef Al Mannai',
    supervisorNameAr: 'يوسف المناعي'
  },
  {
    id: 'unit-8',
    name: 'Incident Response Specialists',
    nameAr: 'متخصصي الاستجابة للحوادث',
    description: 'Specialized incident response team under Threat Intelligence',
    descriptionAr: 'فريق الاستجابة للحوادث المتخصص تحت استخبارات التهديدات',
    subdepartmentId: 'subdept-2',
    parentUnitId: 'unit-2', // Nested under Threat Intelligence Unit
    supervisorName: 'Reem Al Dosari',
    supervisorNameAr: 'ريم الدوسري'
  }
];

const mockEmployees: Employee[] = [
  // IT Department - Infrastructure & Networks - Server Management Unit
  {
    id: 'emp-1',
    name: 'Ahmed Al Mahmoud',
    nameAr: 'أحمد المحمود',
    rank: 'Senior',
    position: 'Server Administrator',
    positionAr: 'مدير الخوادم',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-1',
    unitId: 'unit-1',
    email: 'ahmed.mahmoud@gov.qa',
    phone: '+974 4444 1234'
  },
  {
    id: 'emp-2',
    name: 'Ali Al Marri',
    nameAr: 'علي المري',
    rank: 'Grade 3',
    position: 'Database Administrator',
    positionAr: 'مدير قاعدة البيانات',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-1',
    unitId: 'unit-1',
    email: 'ali.marri@gov.qa',
    phone: '+974 4444 1234'
  },
  // IT Department - Infrastructure & Networks - Network Operations Unit
  {
    id: 'emp-3',
    name: 'Fatima Al Thani',
    nameAr: 'فاطمة آل ثاني',
    rank: 'Senior',
    position: 'Network Engineer',
    positionAr: 'مهندسة الشبكات',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-1',
    unitId: 'unit-2',
    email: 'fatima.thani@gov.qa',
    phone: '+974 4444 1235'
  },
  {
    id: 'emp-4',
    name: 'Hamad Al Kuwari',
    nameAr: 'حمد الكواري',
    rank: 'Grade 2',
    position: 'Network Technician',
    positionAr: 'فني الشبكات',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-1',
    unitId: 'unit-2',
    email: 'hamad.kuwari@gov.qa',
    phone: '+974 4444 1236'
  },
  // IT Department - Cybersecurity - Threat Analysis Unit
  {
    id: 'emp-5',
    name: 'Mohammed Al Kuwari',
    nameAr: 'محمد الكواري',
    rank: 'Principal',
    position: 'Cybersecurity Analyst',
    positionAr: 'محلل الأمن السيبراني',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-2',
    unitId: 'unit-3',
    email: 'mohammed.kuwari@gov.qa',
    phone: '+974 4444 1237'
  },
  {
    id: 'emp-6',
    name: 'Nora Al Mannai',
    nameAr: 'نورا المناعي',
    rank: 'Senior',
    position: 'Security Specialist',
    positionAr: 'أخصائية الأمن',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-2',
    unitId: 'unit-3',
    email: 'nora.mannai@gov.qa',
    phone: '+974 4444 1238'
  },
  // IT Department - Cybersecurity - Data Protection Unit
  {
    id: 'emp-7',
    name: 'Aisha Al Mannai',
    nameAr: 'عائشة المناعي',
    rank: 'Senior',
    position: 'Data Protection Officer',
    positionAr: 'مسؤولة حماية البيانات',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-2',
    unitId: 'unit-4',
    email: 'aisha.mannai@gov.qa',
    phone: '+974 4444 1239'
  },
  {
    id: 'emp-8',
    name: 'Layla Al Ansari',
    nameAr: 'ليلى الأنصاري',
    rank: 'Grade 3',
    position: 'Privacy Analyst',
    positionAr: 'محللة الخصوصية',
    departmentId: 'dept-1',
    subdepartmentId: 'subdept-2',
    unitId: 'unit-4',
    email: 'layla.ansari@gov.qa',
    phone: '+974 4444 1240'
  },
  // HR Department - Recruitment - Candidate Assessment Unit
  {
    id: 'emp-9',
    name: 'Khalid Al Nasr',
    nameAr: 'خالد النصر',
    rank: 'Senior',
    position: 'Recruitment Specialist',
    positionAr: 'أخصائي التوظيف',
    departmentId: 'dept-2',
    subdepartmentId: 'subdept-3',
    unitId: 'unit-5',
    email: 'khalid.nasr@gov.qa',
    phone: '+974 4444 1241'
  },
  {
    id: 'emp-10',
    name: 'Sara Al Thani',
    nameAr: 'سارة آل ثاني',
    rank: 'Grade 2',
    position: 'HR Assistant',
    positionAr: 'مساعدة الموارد البشرية',
    departmentId: 'dept-2',
    subdepartmentId: 'subdept-3',
    unitId: 'unit-5',
    email: 'sara.thani@gov.qa',
    phone: '+974 4444 1242'
  },
  // HR Department - Recruitment - Onboarding Unit
  {
    id: 'emp-11',
    name: 'Nora Al Sulaiti',
    nameAr: 'نورا السليطي',
    rank: 'Principal',
    position: 'Onboarding Coordinator',
    positionAr: 'منسقة الإدماج',
    departmentId: 'dept-2',
    subdepartmentId: 'subdept-3',
    unitId: 'unit-6',
    email: 'nora.sulaiti@gov.qa',
    phone: '+974 4444 1243'
  },
  {
    id: 'emp-12',
    name: 'Rashid Al Dosari',
    nameAr: 'راشد الدوسري',
    rank: 'Grade 3',
    position: 'Training Coordinator',
    positionAr: 'منسق التدريب',
    departmentId: 'dept-2',
    subdepartmentId: 'subdept-3',
    unitId: 'unit-6',
    email: 'rashid.dosari@gov.qa',
    phone: '+974 4444 1244'
  },
  // Some employees still at department level (not assigned to units)
  {
    id: 'emp-13',
    name: 'Omar Al Hashemi',
    nameAr: 'عمر الهاشمي',
    rank: 'Senior',
    position: 'Budget Coordinator',
    positionAr: 'منسق الميزانية',
    departmentId: 'dept-3',
    email: 'omar.hashemi@gov.qa',
    phone: '+974 4444 1245'
  },
  {
    id: 'emp-14',
    name: 'Maryam Al Dosari',
    nameAr: 'مريم الدوسري',
    rank: 'Director',
    position: 'Curriculum Director',
    positionAr: 'مديرة المناهج',
    departmentId: 'dept-4',
    email: 'maryam.dosari@gov.qa',
    phone: '+974 4444 1246'
  },
  {
    id: 'emp-15',
    name: 'Saad Al Marri',
    nameAr: 'سعد المري',
    rank: 'Principal',
    position: 'Education Specialist',
    positionAr: 'أخصائي التعليم',
    departmentId: 'dept-4',
    email: 'saad.marri@gov.qa',
    phone: '+974 4444 1247'
  }
];

const orgChartData: OrgPosition = {
  id: 'pm',
  title: 'Prime Minister',
  titleAr: 'رئيس مجلس الوزراء',
  holder: 'H.E. Sheikh Mohammed bin Abdulrahman Al Thani',
  department: 'Prime Minister Office',
  isExpanded: true,
  children: [
    {
      id: 'deputy-pm',
      title: 'Deputy Prime Minister',
      titleAr: 'نائب رئيس مجلس الوزراء',
      holder: 'H.E. Sheikh Mohammed bin Abdulrahman Al Thani',
      department: 'Prime Minister Office',
      isExpanded: true,
      children: [
        {
          id: 'minister-interior',
          title: 'Minister of Interior',
          titleAr: 'وزير الداخلية',
          holder: 'H.E. Sheikh Khalid bin Khalifa bin Abdulaziz Al Thani',
          department: 'Ministry of Interior',
          isExpanded: false,
          children: []
        },
        {
          id: 'minister-finance',
          title: 'Minister of Finance',
          titleAr: 'وزير المالية',
          holder: 'H.E. Ali bin Ahmed Al Kuwari',
          department: 'Ministry of Finance',
          isExpanded: false,
          children: []
        },
        {
          id: 'minister-education',
          title: 'Minister of Education',
          titleAr: 'وزير التعليم',
          holder: 'H.E. Buthaina bint Ali Al Jabir Al Nuaimi',
          department: 'Ministry of Education',
          isExpanded: false,
          children: []
        }
      ]
    }
  ]
};


// Main App Content Component
const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-qatar-maroon/95 via-qatar-maroon to-red-900 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-qatar-maroon border-t-transparent"></div>
            <span className="text-lg font-medium text-gray-900">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <DataProvider>
        {isAuthenticated && user ? (
          <Layout user={user} onLogout={logout}>
            <div>Main Content</div>
          </Layout>
        ) : (
          <LoginForm />
        )}
      </DataProvider>
    </LanguageProvider>
  );
};

// Main App Component with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;