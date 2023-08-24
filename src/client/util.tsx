import { createContext } from 'react';

export const NavigateContext = createContext<null | ((x: string) => void)>(null);

export const renderDuration = (ms: number) => `${Math.floor(ms / 1000 / 60)}:${(Math.floor(ms / 1000) % 60 + '').padStart(2, '0')}`;