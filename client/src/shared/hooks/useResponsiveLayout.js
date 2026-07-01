// src/hooks/useResponsiveLayout.js
import { useState, useEffect } from 'react';

export const useResponsiveLayout = () => {
    const [isLandscape, setIsLandscape] = useState(true);
    const [isTablet, setIsTablet] = useState(false);
    const [touchEnabled, setTouchEnabled] = useState(false);

    useEffect(() => {
        const checkLayout = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setIsLandscape(w > h && w >= 768);
            setIsTablet(w >= 600 && w <= 1200);
            setTouchEnabled('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkLayout();
        window.addEventListener('resize', checkLayout);
        window.addEventListener('orientationchange', checkLayout);

        return () => {
            window.removeEventListener('resize', checkLayout);
            window.removeEventListener('orientationchange', checkLayout);
        };
    }, []);

    return { isLandscape, isTablet, touchEnabled };
};

export default useResponsiveLayout;