import { getEvents, getMembersList, getLocations } from '@/app/calendar/actions';
import { CalendarLoader } from '@/app/calendar/calendar-loader';
import { unstable_noStore as noStore } from 'next/cache';

// This is the Server Component. It fetches all necessary data.
export default async function CalendarPage() {
    noStore(); // Opt out of caching for the entire page to ensure fresh data
    
    // Fetch all data in parallel
    const [events, members, locations] = await Promise.all([
        getEvents(),
        getMembersList(),
        getLocations(),
    ]);
    
    // Pass the data down to the client-side loader
    return <CalendarLoader 
        initialEvents={events} 
        members={members}
        locations={locations}
    />;
}
