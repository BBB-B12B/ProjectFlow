import { CalendarLoader } from '@/app/calendar/calendar-loader';

// This is the Page Component. It just loads the client component.
export default function CalendarPage() {
    return <CalendarLoader
        initialEvents={[]}
        members={[]}
        locations={[]}
    />;
}
