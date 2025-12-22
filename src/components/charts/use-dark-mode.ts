'use client';
import React, { useState, useEffect } from 'react';

// แก้ไข useDarkMode hook เพื่อป้องกัน hydration error
export function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkDarkMode = () => {
                const isDarkMode = document.documentElement.classList.contains('dark');
                setIsDark(isDarkMode);
            };

            checkDarkMode();

            // ตรวจสอบการเปลี่ยนแปลง dark mode
            const observer = new MutationObserver(checkDarkMode);
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });

            return () => observer.disconnect();
        }
    }, []);

    return isDark;
}
