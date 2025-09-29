import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇶🇦',
  },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
  showFlag?: boolean;
  showText?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = React.memo(({
  className,
  variant = 'dropdown',
  showFlag = true,
  showText = true,
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = useCallback((languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);

    // Update document direction for RTL support
    const isRTL = languageCode === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;

    // Update body class for styling
    document.body.classList.toggle('rtl', isRTL);
  }, [i18n]);

  // Toggle variant for simple switch between two languages
  if (variant === 'toggle') {
    const otherLanguage = languages.find(lang => lang.code !== i18n.language) || languages[1];

    return (
      <button
        onClick={() => changeLanguage(otherLanguage.code)}
        className={clsx(
          'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          'border border-gray-300 hover:border-gray-400',
          'transition-colors duration-200',
          className
        )}
        title={t('language.switchTo', { language: otherLanguage.nativeName })}
      >
        {showFlag && <span className="mr-2">{otherLanguage.flag}</span>}
        {showText && (
          <span className={clsx('truncate', !showFlag && 'mr-1')}>{otherLanguage.nativeName}</span>
        )}
        <Languages className="h-4 w-4 ml-2" />
      </button>
    );
  }

  // Dropdown variant for multiple languages
  return (
    <div className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          'border border-gray-300 hover:border-gray-400',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-qatar-maroon',
          isOpen && 'bg-gray-100 border-gray-400'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {showFlag && <span className="mr-2">{currentLanguage.flag}</span>}
        {showText && (
          <span className={clsx('truncate', !showFlag && 'mr-1')}>
            {currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown
          className={clsx(
            'h-4 w-4 ml-2 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div
            className={clsx(
              'absolute z-20 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5',
              i18n.language === 'ar' ? 'left-0' : 'right-0'
            )}
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              {languages.map(language => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={clsx(
                    'group flex items-center w-full px-4 py-2 text-sm',
                    'hover:bg-gray-100 hover:text-gray-900',
                    'focus:outline-none focus:bg-gray-100',
                    language.code === i18n.language ? 'bg-qatar-maroon text-white' : 'text-gray-700'
                  )}
                  role="menuitem"
                >
                  <span className="mr-3">{language.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{language.nativeName}</span>
                    {language.name !== language.nativeName && (
                      <span
                        className={clsx(
                          'text-xs',
                          language.code === i18n.language ? 'text-white/80' : 'text-gray-500'
                        )}
                      >
                        {language.name}
                      </span>
                    )}
                  </div>
                  {language.code === i18n.language && (
                    <span className="ml-auto">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

// Hook for managing RTL layout
export const useRTL = () => {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    document.body.classList.toggle('rtl', isRTL);
  }, [i18n.language]);

  return {
    isRTL: i18n.language === 'ar',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  };
};
