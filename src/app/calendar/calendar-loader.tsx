"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@/app/calendar/actions';

// This component is the "Client Bridge". It's responsible for dynamically importing
// the actual calendar page, which contains client-only code.
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

export function CalendarLoader({ initialEvents }: { initialEvents: CalendarEvent[] }) {
    return <CalendarClientPage initialEvents={initialEvents} />;
}
