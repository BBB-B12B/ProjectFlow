"use client";

import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NewEventDialog } from '@/app/calendar/new-event-dialog';
import { EditEventDialog } from '@/app/calendar/edit-event-dialog'; // Step 1: Import
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

interface CalendarClientPageProps {
    initialEvents: CalendarEvent[];
    members: string[];
    locations: string[];
}

export default function CalendarClientPage({ initialEvents, members, locations }: CalendarClientPageProps) {
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Step 2: Add state for edit dialog
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null); // State for the clicked event

  // Handler for creating a new event
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsNewEventDialogOpen(true);
  };
  
  // Handler for editing an existing event
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
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
        events={initialEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent} // Step 3: Connect the handler
      />
      
      {/* Dialog for creating a new event */}
      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onOpenChange={setIsNewEventDialogOpen}
        defaultDate={selectedDate}
        members={members}
        locations={locations}
      />

      {/* Dialog for editing an existing event */}
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
