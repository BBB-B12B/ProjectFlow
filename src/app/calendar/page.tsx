import { getEvents } from '@/app/calendar/actions';
import { CalendarLoader } from '@/app/calendar/calendar-loader';

// This is the Server Component. Its only jobs are to fetch data
// and then render the client-side loader component.
export default async function CalendarPage() {
    const events = await getEvents();
    return <CalendarLoader initialEvents={events} />;
}
