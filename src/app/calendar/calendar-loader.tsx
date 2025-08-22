"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@/app/calendar/actions';

const CalendarClientPage = dynamic(
  () => import('@/app/calendar/calendar-client-page'),
  {
    ssr: false,
    loading: () => (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[calc(100vh-180px)] w-full" />
        </div>
    ),
  }
);

interface CalendarLoaderProps {
    initialEvents: CalendarEvent[];
    members: string[]; // Changed from assignees
    locations: string[];
}

export function CalendarLoader({ initialEvents, members, locations }: CalendarLoaderProps) {
    return <CalendarClientPage 
        initialEvents={initialEvents} 
        members={members} // Pass down members
        locations={locations}
    />;
}
