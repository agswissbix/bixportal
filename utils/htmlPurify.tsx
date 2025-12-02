import { useMemo } from 'react';
import DOMPurify from 'dompurify';


export const sanitizeHtml = (content: string): string => {
  const clean = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true }, 
  });

  return clean as string;
};