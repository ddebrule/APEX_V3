'use client';

import { useEffect } from 'react';
import { useMissionControlStore } from '@/stores/missionControlStore';

export default function UIScaleProvider({ children }: { children: React.ReactNode }) {
    const uiScale = useMissionControlStore((state) => state.uiScale);

    useEffect(() => {
        const s = uiScale / 100;
        if (uiScale === 100) {
            document.body.style.removeProperty('transform');
            document.body.style.removeProperty('transform-origin');
            document.body.style.removeProperty('width');
            document.body.style.removeProperty('height');
        } else {
            document.body.style.transform = `scale(${s})`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = `${100 / s}%`;
            document.body.style.height = `${100 / s}%`;
        }

        return () => {
            document.body.style.removeProperty('transform');
            document.body.style.removeProperty('transform-origin');
            document.body.style.removeProperty('width');
            document.body.style.removeProperty('height');
        };
    }, [uiScale]);

    return <>{children}</>;
}
