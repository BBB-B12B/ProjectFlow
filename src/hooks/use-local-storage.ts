import { useState, useEffect } from 'react';

/**
 * A custom hook to persist state in localStorage with synchronization across tabs.
 * @param key The key to store the value under in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @returns [storedValue, setValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // Get from local storage then parse stored json or return initialValue
    const readValue = () => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    };

    // State to store our value
    // Initialize with initialValue to ensure Server/Client match on first render (Hydration Safe)
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));

                // Dispatch a custom event so other components in the same tab can update
                // (Optional: useful if multiple components rely on the same key)
                window.dispatchEvent(new Event("local-storage"));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    };

    useEffect(() => {
        setStoredValue(readValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            setStoredValue(readValue());
        };

        // Listen for changes from other tabs
        window.addEventListener('storage', handleStorageChange);

        // Listen for changes from the same tab (if we dispatch custom events)
        window.addEventListener('local-storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage', handleStorageChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [storedValue, setValue] as const;
}
