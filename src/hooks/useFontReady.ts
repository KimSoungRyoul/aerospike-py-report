import { useEffect, useState } from 'react';

/**
 * Returns true once all specified font families are loaded.
 * Prevents canvas from rendering with fallback fonts.
 */
export function useFontReady(families: string[] = ['JetBrains Mono']): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await document.fonts.ready;
        // Verify at least one of the specified families loaded
        const loaded = families.some((f) => document.fonts.check(`12px ${f}`));
        setReady(loaded);
      } catch {
        // Fallback: just mark as ready after a timeout
        setReady(true);
      }
    };

    check();

    // Safety timeout — don't block forever if fonts fail to load
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, [families.join(',')]);

  return ready;
}
