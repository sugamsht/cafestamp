import React from 'react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'toggle' | 'header';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'toggle') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border border-black/10 bg-white/80 p-0.5 text-xs font-semibold backdrop-blur-sm shadow-sm',
          className
        )}
      >
        <button
          type="button"
          onClick={() => setLanguage('es')}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 transition-all',
            language === 'es'
              ? 'bg-[#1d1d1f] text-white shadow-xs'
              : 'text-[#6e6e73] hover:text-[#1d1d1f]'
          )}
          aria-label="Cambiar a Español"
        >
          <span>ES</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 transition-all',
            language === 'en'
              ? 'bg-[#1d1d1f] text-white shadow-xs'
              : 'text-[#6e6e73] hover:text-[#1d1d1f]'
          )}
          aria-label="Switch to English"
        >
          <span>EN</span>
        </button>
      </div>
    );
  }

  // Pill variant with globe icon
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-xs backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95',
        className
      )}
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe size={13} className="text-[#6e6e73] transition-colors group-hover:text-[#1d1d1f]" />
      <span className="uppercase tracking-wide font-bold">{language}</span>
      <span className="text-[10px] text-[#8e8e93] font-normal">
        {language === 'es' ? '→ EN' : '→ ES'}
      </span>
    </button>
  );
};
