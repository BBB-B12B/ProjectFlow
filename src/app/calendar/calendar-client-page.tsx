"use client";

import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NewEventDialog } from '@/app/calendar/new-event-dialog';
import type { CalendarEvent } from '@/app/calendar/actions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

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

// Changed to a default export for more reliable dynamic importing
export default function CalendarClientPage({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsNewEventDialogOpen(true);
  };
  
  const handleOpenDialog = () => {
    setSelectedDate(new Date());
    setIsNewEventDialogOpen(true);
  }

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
      />
      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onOpenChange={setIsNewEventDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}
