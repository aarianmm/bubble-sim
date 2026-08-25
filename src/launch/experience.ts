import { createContext, useContext } from 'react';

export interface ExperienceNavigation {
  returnToLibrary(): void;
}

export const ExperienceNavigationContext = createContext<ExperienceNavigation | null>(null);

/** The period simulation can be rendered directly in tests, so this context is
 * intentionally optional. The production App supplies it to connect the final
 * report back to the modern decade library. */
export function useExperienceNavigation(): ExperienceNavigation | null {
  return useContext(ExperienceNavigationContext);
}
