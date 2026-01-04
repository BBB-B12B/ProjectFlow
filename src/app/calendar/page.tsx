import { CalendarLoader } from '@/app/calendar/calendar-loader';

export const runtime = 'edge';

// This is the Page Component. It just loads the client component.
export default function CalendarPage() {
    // We pass empty arrays initially. The client component will fetch data.
    return <CalendarLoader
        initialEvents={[]}
        members={[]}
        locations={[]}
    />;
}
