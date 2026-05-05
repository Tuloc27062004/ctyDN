'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PROTECTED_SELECTOR = '[data-protect-content="true"]';

export default function ContentProtection() {
  const pathname = usePathname();

  const shouldProtectRoute =
    pathname?.startsWith('/products') || pathname === '/inquiry';

  useEffect(() => {
    if (!shouldProtectRoute) return;

    const isProtectedTarget = (target: EventTarget | null) => {
      return (
        target instanceof HTMLElement &&
        Boolean(target.closest(PROTECTED_SELECTOR))
      );
    };

    const preventIfProtected = (event: Event) => {
      if (isProtectedTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.ctrlKey || event.metaKey;

      // Block save / print / view source
      if (isCmdOrCtrl && (key === 's' || key === 'p' || key === 'u')) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Block F12
      if (key === 'f12') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Block common DevTools shortcuts:
      // Ctrl/Cmd + Shift + I
      // Ctrl/Cmd + Shift + J
      // Ctrl/Cmd + Shift + C
      // Ctrl/Cmd + Shift + S
      if (isCmdOrCtrl && event.shiftKey && ['i', 'j', 'c', 's'].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (isProtectedTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', preventIfProtected);
    document.addEventListener('dragstart', preventIfProtected);
    document.addEventListener('selectstart', preventIfProtected);
    document.addEventListener('copy', preventIfProtected);
    document.addEventListener('cut', preventIfProtected);
    document.addEventListener('paste', preventIfProtected);
    document.addEventListener('dragover', handleDragOver);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', preventIfProtected);
      document.removeEventListener('dragstart', preventIfProtected);
      document.removeEventListener('selectstart', preventIfProtected);
      document.removeEventListener('copy', preventIfProtected);
      document.removeEventListener('cut', preventIfProtected);
      document.removeEventListener('paste', preventIfProtected);
      document.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [shouldProtectRoute]);

  return null;
}
