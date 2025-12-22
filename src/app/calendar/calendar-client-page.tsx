"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
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
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Presence, Editor } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const CustomEvent = ({ event, editors }: { event: CalendarEvent, editors?: { [userId: string]: Editor } | null }) => {
  const activeEditors = editors ? Object.values(editors) : [];
  const isBeingEdited = activeEditors.length > 0;
  const firstEditor = isBeingEdited ? activeEditors[0] : null;

  const style: React.CSSProperties = {
    borderLeft: isBeingEdited ? '4px solid #3b82f6' : '4px solid transparent',
    padding: '2px 5px',
    borderRadius: '4px',
    backgroundColor: event.isDarkModeOnly ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
    color: event.isDarkModeOnly ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary-foreground))',
    opacity: 0.9,
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div style={style}>
            <strong>{event.title}</strong>
            {event.relatedTask && (
              <em className="text-xs block text-opacity-80">Task: {event.relatedTask.name}</em>
            )}
            {isBeingEdited && firstEditor && (
              <em className="text-xs block">
                ({firstEditor.userName}
                {activeEditors.length > 1 ? ` and ${activeEditors.length - 1} others` : ''} editing...)
              </em>
            )}
          </div>
        </TooltipTrigger>
        {event.relatedTask && (
          <TooltipContent>
            <p>Related Task: {event.relatedTask.name}</p>
            {event.isDarkModeOnly && (
              <p className="text-sm text-muted-foreground"> (Dark Mode Only Project)</p>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

interface CalendarClientPageProps {
  initialEvents: CalendarEvent[];
  members: string[];
  locations: string[];
}

export default function CalendarClientPage({ initialEvents, members, locations }: CalendarClientPageProps) {
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date()),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // End of current month
  });

  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [presenceData, setPresenceData] = useState<Record<string, Presence>>({});

  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { theme } = useTheme();

  // Handle Range Change from Calendar
  const handleRangeChange = (range: Date[] | { start: Date; end: Date }) => {
    let start: Date, end: Date;
    if (Array.isArray(range)) {
      // Week/Day View (array of dates)
      start = range[0];
      end = range[range.length - 1];
    } else {
      // Month View (object)
      start = range.start;
      end = range.end;
    }
    // Buffer the range slightly to ensuring we catch edge events
    const startBuffer = new Date(start); startBuffer.setDate(start.getDate() - 7);
    const endBuffer = new Date(end); endBuffer.setDate(end.getDate() + 7);
    setCurrentRange({ start: startBuffer, end: endBuffer });
  };

  useEffect(() => {
    // Optimized Query: Fetch only events in current range
    const q = query(
      collection(db, 'events'),
      where('start', '>=', currentRange.start),
      where('start', '<=', currentRange.end)
    );

    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
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
          relatedTask: data.relatedTask || undefined,
          isDarkModeOnly: data.isDarkModeOnly || false,
        } as CalendarEvent;
      });
      setEvents(updatedEvents);
    }, (error) => {
      console.error("Error fetching events:", error);
    });

    const presenceQuery = query(collection(db, 'presence'));
    const unsubscribePresence = onSnapshot(presenceQuery, (snapshot) => {
      const presences: Record<string, Presence> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as Presence;
        if (data.editors && Object.keys(data.editors).length > 0) {
          presences[doc.id] = data;
        }
      });
      setPresenceData(presences);
    });

    return () => {
      unsubscribeEvents();
      unsubscribePresence();
    };
  }, [currentRange]); // Re-subscribe when range changes

  const filteredEvents = useMemo(() => {
    if (theme === 'dark') {
      return events.filter(event => event.isDarkModeOnly);
    }
    return events.filter(event => !event.isDarkModeOnly);
  }, [events, theme]);


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
        editors={presenceData[props.event.id]?.editors}
      />
    ),
  }), [presenceData]);

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
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onRangeChange={handleRangeChange}
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
