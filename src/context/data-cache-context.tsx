'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Customer } from '@/lib/types';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DataCacheContextType {
    customers: Customer[];
    setCustomers: (customers: Customer[]) => void;
    isCustomersLoaded: boolean;
    lastUpdated: Date | null;
    refreshCustomers: (silent?: boolean) => Promise<void>;
    togglePolling: (paused: boolean) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
    const [customers, setCustomersState] = useState<Customer[]>([]);
    const [isCustomersLoaded, setIsCustomersLoaded] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isPollingPaused, setIsPollingPaused] = useState(false);

    const setCustomers = useCallback((data: Customer[]) => {
        setCustomersState(data);
        setIsCustomersLoaded(true);
        setLastUpdated(new Date());
    }, []);

    const refreshCustomers = useCallback(async (silent = false) => {
        if (!silent) setIsCustomersLoaded(false);
        try {
            // Default fetch strategy: Get recent/all customers (aligned with list view default)
            const q = query(collection(db, 'customers'), orderBy('updatedAt', 'desc'), limit(50));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];

            setCustomersState(data);
            setIsCustomersLoaded(true);
            setLastUpdated(new Date());
            if (silent) console.log(`Background Cache Refresh: ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error("Error refreshing customers cache:", error);
        }
    }, []);

    const togglePolling = useCallback((paused: boolean) => {
        setIsPollingPaused(paused);
        if (paused) {
            console.log("Data Polling Paused (Idle)");
        } else {
            console.log("Data Polling Resumed");
            refreshCustomers(true); // Immediate refresh on resume
        }
    }, [refreshCustomers]);

    // Auto-Refresh Effect (Every 5 Minutes)
    useEffect(() => {
        if (!isCustomersLoaded || isPollingPaused) return;

        const intervalId = setInterval(() => {
            refreshCustomers(true);
        }, 300000); // 5 minutes

        return () => clearInterval(intervalId);
    }, [isCustomersLoaded, isPollingPaused, refreshCustomers]);

    return (
        <DataCacheContext.Provider value={{ customers, setCustomers, isCustomersLoaded, refreshCustomers, lastUpdated, togglePolling }}>
            {children}
        </DataCacheContext.Provider>
    );
}

export function useDataCache() {
    const context = useContext(DataCacheContext);
    if (context === undefined) {
        throw new Error('useDataCache must be used within a DataCacheProvider');
    }
    return context;
}
