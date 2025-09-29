import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Test translations
const resources = {
  en: {
    translation: {
      auth: {
        welcomeTitle: 'Qatar Government',
        welcomeSubtitle: 'Organization Chart System',
        welcomeDescription: 'Secure access to government organizational structure',
        username: 'Username',
        password: 'Password',
        loginError: 'Login Error',
      },
      navigation: {
        dashboard: 'Dashboard',
        organizationChart: 'Organization Chart',
        positions: 'Positions',
        attributes: 'Attributes',
        users: 'Users',
        compliance: 'Compliance',
        dataRetention: 'Data Retention',
        exports: 'Exports',
        logout: 'Logout',
      },
      validation: {
        required: 'This field is required',
        minLength: 'Minimum length is {{min}} characters',
      },
      language: {
        switchTo: 'Switch to {{language}}',
      },
    },
  },
  ar: {
    translation: {
      auth: {
        welcomeTitle: 'حكومة قطر',
        welcomeSubtitle: 'نظام الهيكل التنظيمي',
        welcomeDescription: 'وصول آمن إلى الهيكل التنظيمي الحكومي',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        loginError: 'خطأ في تسجيل الدخول',
      },
      navigation: {
        dashboard: 'لوحة التحكم',
        organizationChart: 'الهيكل التنظيمي',
        positions: 'المناصب',
        attributes: 'الصفات',
        users: 'المستخدمين',
        compliance: 'الامتثال',
        dataRetention: 'الاحتفاظ بالبيانات',
        exports: 'التصدير',
        logout: 'تسجيل الخروج',
      },
      validation: {
        required: 'هذا الحقل مطلوب',
        minLength: 'الحد الأدنى للطول هو {{min}} أحرف',
      },
      language: {
        switchTo: 'التبديل إلى {{language}}',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;