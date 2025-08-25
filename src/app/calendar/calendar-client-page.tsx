"use client";

import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NewEventDialog } from '@/app/calendar/new-event-dialog';
import { EditEventDialog } from '@/app/calendar/edit-event-dialog';
import type { CalendarEvent } from '@/app/calendar/actions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { Presence } from '@/lib/types'; // Import Presence type

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom Event Component
const CustomEvent = ({ event, editingUser }: { event: CalendarEvent, editingUser?: Presence | null }) => {
    const style = {
      borderLeft: editingUser ? '4px solid #3b82f6' : '4px solid transparent', // Blue border if editing
      padding: '2px 5px',
      borderRadius: '4px',
      backgroundColor: editingUser ? 'rgba(59, 130, 246, 0.1)' : 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      opacity: 0.9,
      transition: 'all 0.2s ease-in-out',
    };
  
    return (
      <div style={style}>
        <strong>{event.title}</strong>
        {editingUser && <em className="text-xs block"> ({editingUser.userName} is editing...)</em>}
      </div>
    );
};

interface CalendarClientPageProps {
    initialEvents: CalendarEvent[];
    members: string[];
    locations: string[];
}

export default function CalendarClientPage({ initialEvents, members, locations }: CalendarClientPageProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [editingUsers, setEditingUsers] = useState<Record<string, Presence>>({});
  
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // Listener for events
    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const updatedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end.toDate(),
          allDay: data.allDay || false,
          members: data.members,
          location: data.location,
          description: data.description,
        } as CalendarEvent;
      });
      setEvents(updatedEvents);
    });

    // Listener for presence
    const presenceQuery = query(collection(db, 'presence'));
    const unsubscribePresence = onSnapshot(presenceQuery, (snapshot) => {
        const presences: Record<string, Presence> = {};
        snapshot.forEach((doc) => {
            presences[doc.id] = doc.data() as Presence;
        });
        setEditingUsers(presences);
    });

    // Cleanup function to unsubscribe
    return () => {
        unsubscribeEvents();
        unsubscribePresence();
    };
  }, []);


  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsNewEventDialogOpen(true);
  };
  
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenDialog = () => {
    setSelectedDate(new Date());
    setIsNewEventDialogOpen(true);
  }

  const components = useMemo(() => ({
    event: (props: any) => (
      <CustomEvent
        event={props.event}
        editingUser={editingUsers[props.event.id]}
      />
    ),
  }), [editingUsers]);

  return (
    <div className="h-[calc(100vh-100px)]">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                <p className="text-muted-foreground">
                    Manage your events and schedule.
                </p>
            </div>
            <Button onClick={handleOpenDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Event
            </Button>
        </div>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        components={components}
      />
      
      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onOpenChange={setIsNewEventDialogOpen}
        defaultDate={selectedDate}
        members={members}
        locations={locations}
      />

      <EditEventDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen} 
        event={selectedEvent}
        members={members}
        locations={locations}
      />
    </div>
  );
}
