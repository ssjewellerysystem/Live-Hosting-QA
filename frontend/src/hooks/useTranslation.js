import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const locales = { en, hi };

export const useTranslation = () => {
  const { language, changeLanguage } = useContext(AuthContext);

  const t = (keyPath, options = {}) => {
    const keys = keyPath.split('.');
    let translation = locales[language];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }

    if (translation === undefined) {
      // Fallback to English
      translation = locales['en'];
      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          translation = undefined;
          break;
        }
      }
    }

    if (translation === undefined) {
      if (options.defaultValue !== undefined) {
        translation = options.defaultValue;
      } else {
        const lastKey = keys[keys.length - 1];
        translation = lastKey
          .split(/[_-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    let result = String(translation);
    Object.keys(options).forEach((optKey) => {
      if (optKey !== 'defaultValue') {
        result = result.replace(`{${optKey}}`, options[optKey]);
      }
    });

    return result;
  };

  const localize = (obj, fieldName) => {
    if (!obj) return '';
    if (language === 'hi') {
      const hiField = `${fieldName}_hi`;
      if (obj[hiField]) return obj[hiField];
    }
    const enField = `${fieldName}_en`;
    if (obj[enField]) return obj[enField];
    return obj[fieldName] || '';
  };

  return { t, localize, language, changeLanguage };
};
