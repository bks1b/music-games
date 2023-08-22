import { createContext } from 'react';

export const NavigateContext = createContext<null | ((x: string) => void)>(null);

export const renderDuration = (ms: number) => `${Math.floor(ms / 1000 / 60)}:${(Math.floor(ms / 1000) % 60 + '').padStart(2, '0')}`;

export const getCommonEnd = (arr: string[]) => {
    let last = '';
    for (let i = 1;; i++) {
        const mapped = arr.map(x => x.slice(-i));
        if (!mapped.some(x => x)) return last;
        const occurrences = [...new Set(mapped)].map(x => [x, mapped.filter(y => x === y).length] as const).sort((a, b) => b[1] - a[1])[0];
        if (occurrences[1] < arr.length / 2) return last;
        last = occurrences[0];
    }
};