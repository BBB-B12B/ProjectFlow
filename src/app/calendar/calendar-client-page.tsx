"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, addWeeks, addMonths, addYears, isAfter, isBefore } from 'date-fns';
import { enUS } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NewEventDialog } from '@/app/calendar/new-event-dialog';
import { EditEventDialog } from '@/app/calendar/edit-event-dialog';
import type { CalendarEvent } from '@/app/calendar/actions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import type { Presence, Editor, AssigneeGroup } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { normalizeAssigneeName } from '@/lib/utils';

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

const CustomEvent = ({ event, editors, groups }: { event: CalendarEvent, editors?: { [userId: string]: Editor } | null, groups: AssigneeGroup[] }) => {
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

  const formatTimeRange = (start: Date, end: Date) => {
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  // Group Logic (Subset Coverage)

  // Group Logic (Subset Coverage)
  const renderParticipants = () => {
    if (!event.members || event.members.length === 0) return null;

    // Normalize event members for comparison
    const eventMemberMap = new Map<string, string>(); // Normalized -> Original
    event.members.forEach(m => eventMemberMap.set(normalizeAssigneeName(m), m));

    const groupsToDisplay: AssigneeGroup[] = [];
    const consumedMembers = new Set<string>(); // Normalized names

    // Check for Groups
    groups.forEach(group => {
      const groupMembersNorm = group.members.map(normalizeAssigneeName);

      if (groupMembersNorm.length > 0 && groupMembersNorm.every(m => eventMemberMap.has(m))) {
        groupsToDisplay.push(group);
        groupMembersNorm.forEach(m => consumedMembers.add(m));
      }
    });

    return (
      <div className="flex flex-wrap gap-1">
        {groupsToDisplay.map(group => (
          <TooltipProvider key={group.id}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-[10px] px-1.5 py-0.5 rounded-full cursor-help font-medium">
                  {group.name} 👥
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-semibold mb-1">{group.name} Members:</div>
                <ul className="list-disc pl-3">
                  {group.members.map(m => <li key={m}>{m}</li>)}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {Array.from(eventMemberMap.entries()).map(([norm, original], i) => {
          if (consumedMembers.has(norm)) return null;
          return (
            <span key={i} className="inline-block bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {original}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <HoverCard openDelay={100} closeDelay={400}>
      <HoverCardTrigger asChild>
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
      </HoverCardTrigger>
      <HoverCardContent className="max-w-xs p-3 space-y-2 pointer-events-auto">
        <div className="font-semibold text-lg">{event.title}</div>

        <div className="text-sm">
          <span className="font-medium">Time: </span>
          {formatTimeRange(event.start, event.end)}
        </div>

        {event.relatedTask && (
          <div className="text-sm">
            <span className="font-medium">Task: </span>
            {event.relatedTask.name}
            {event.isDarkModeOnly && (
              <span className="text-xs text-muted-foreground ml-1">(Dark Mode Project)</span>
            )}
          </div>
        )}

        {event.description && (
          <div className="text-sm border-t pt-2 mt-2">
            <span className="font-medium block mb-1">Details:</span>
            <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {event.members && event.members.length > 0 && (
          <div className="text-sm pt-1">
            <span className="font-medium block mb-1">Participants:</span>
            {renderParticipants()}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

interface CalendarClientPageProps {
  initialEvents: CalendarEvent[];
  members: string[];
  locations: string[];
}

export default function CalendarClientPage({ initialEvents, members, locations }: CalendarClientPageProps) {
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // End of current month
  });

  // Split state for merging
  const [rangeEvents, setRangeEvents] = useState<CalendarEvent[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<CalendarEvent[]>([]);
  // We use useMemo to merge them to avoid flicker, or just merge in effect. 
  // Better to use state for final 'events' derived from these two?
  // No, let's derive 'events' directly.

  const events = useMemo(() => {
    // Merge and Deduplicate by ID
    const map = new Map<string, CalendarEvent>();
    rangeEvents.forEach(e => map.set(e.id, e));
    recurringEvents.forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  }, [rangeEvents, recurringEvents]);
  const [presenceData, setPresenceData] = useState<Record<string, Presence>>({});

  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [duplicateEventData, setDuplicateEventData] = useState<Partial<CalendarEvent> | null>(null);
  const { theme } = useTheme();

  // Local state for members and locations (since server props might be empty)
  // We utilize the structure from data-fetcher strictly
  const [localMembers, setLocalMembers] = useState<{ name: string, type: 'Employee' | 'Customer', isDarkModeOnly?: boolean }[]>([]);
  const [localLocations, setLocalLocations] = useState<string[]>(locations);
  const [localGroups, setLocalGroups] = useState<AssigneeGroup[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch members and locations on client mount to bypass server-side permission issues
    import('@/app/calendar/data-fetcher').then(({ fetchMembersAndLocations }) => {
      fetchMembersAndLocations().then(data => {
        setLocalMembers(data.members);
        setLocalLocations(data.locations);
        setLocalGroups(data.groups);
        setIsDataLoaded(true); // Signal readiness
      }).catch(err => {
        console.error("Failed to load calendar meta data", err);
        setIsDataLoaded(true); // Load anyway to at least show events
      });
    });
  }, []);

  const filteredMemberNames = useMemo(() => {
    return localMembers
      .filter(member => {
        if (member.type === 'Customer' && member.isDarkModeOnly) {
          // Show "OS" (Dark Mode Only) customers ONLY in Dark Mode
          return theme === 'dark';
        }
        return true;
      })
      .map(member => member.name); // Just return the name, no suffixes
  }, [localMembers, theme]);

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
    if (!db) return; // Skip if db is missing

    // Query 1: Normal Events in Range
    const rangeQ = query(
      collection(db, 'events'),
      where('start', '>=', currentRange.start),
      where('start', '<=', currentRange.end),
      // We exclude recurring from here? No, let them be duplicated. Map handles it.
      // But we can try to filter 'recurrence' == null if we want optimization.
      // Firestore limitation: Cant combine Start Range + Recurrence != null easily.
      orderBy('start', 'asc'),
      limit(500)
    );

    const unsubscribeRange = onSnapshot(rangeQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
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
          recurrence: data.recurrence || undefined,
        } as CalendarEvent;
      });
      setRangeEvents(docs);
    });

    return () => {
      unsubscribeRange();
    };
  }, [currentRange]);

  useEffect(() => {
    if (!db) return;

    // Query 2: ALL Recurring Events (that might overlap)
    // Runs ONCE on mount (cached until manual refresh or page reload)
    const recurQ = query(
      collection(db, 'events'),
      where('recurrence.frequency', 'in', ['daily', 'weekly', 'monthly', 'yearly'])
    );

    const unsubscribeRecur = onSnapshot(recurQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
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
          recurrence: data.recurrence || undefined,
        } as CalendarEvent;
      });
      setRecurringEvents(docs);
    });

    return () => {
      unsubscribeRecur();
    };
  }, []); // Empty dependency = Run Once

  /* Recurrence Expansion Logic */
  const expandedEvents = useMemo(() => {
    const rangeStart = currentRange.start;
    const rangeEnd = currentRange.end;
    const expanded: CalendarEvent[] = [];

    events.forEach(event => {
      try {
        // Filter by Theme Mode first
        if (theme === 'dark') {
          if (!event.isDarkModeOnly) return;
        } else {
          if (event.isDarkModeOnly) return;
        }

        if (!event.recurrence) {
          expanded.push(event); // Normal event
          return;
        }

        // Expand Recurring Event
        const { frequency, interval, endDate: recurEndDateStr } = event.recurrence;
        const recurEndDate = recurEndDateStr ? new Date(recurEndDateStr) : null;

        if (!event.start || isNaN(new Date(event.start).getTime())) return;

        let currentStart = new Date(event.start);
        let currentEnd = new Date(event.end);

        // Validate dates
        if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) return;

        const duration = currentEnd.getTime() - currentStart.getTime();

        // Safety Valve: Max 365 instances to prevent infinite loops
        let count = 0;
        const maxInstances = 365;

        while (count < maxInstances) {
          // Check if current instance is beyond the recurrence end date
          if (recurEndDate && isAfter(currentStart, recurEndDate)) break;
          // Check if current instance is beyond the stored range (optimization)
          if (isAfter(currentStart, rangeEnd)) break;

          const currentStartISO = currentStart.toISOString();

          // Check if this date is an exception (skipped)
          // Ensure exceptions is treated as array safely
          const exceptions = Array.isArray(event.recurrence.exceptions) ? event.recurrence.exceptions : [];
          const isException = exceptions.includes(currentStartISO);

          // If instance intersects with view range AND is not an exception, add it
          if (!isException && !isBefore(currentEnd, rangeStart)) {
            expanded.push({
              ...event,
              id: count === 0 ? event.id : `${event.id}_recur_${currentStartISO}`,
              start: new Date(currentStart),
              end: new Date(currentEnd),
            });
          }

          // Advance
          switch (frequency) {
            case 'daily':
              currentStart = addDays(currentStart, interval);
              break;
            case 'weekly':
              currentStart = addWeeks(currentStart, interval);
              break;
            case 'monthly':
              currentStart = addMonths(currentStart, interval);
              break;
            case 'yearly':
              currentStart = addYears(currentStart, interval);
              break;
            default:
              count = maxInstances; // Break loop if frequency is unknown
              break;
          }
          currentEnd = new Date(currentStart.getTime() + duration);
          count++;
        }
      } catch (err) {
        console.error("Error expanding event:", event.id, err);
        // Continue to next event
      }
    });

    return expanded;
  }, [events, theme, currentRange]);

  /* 
    DEPRECATED: filteredEvents was replaced by expandedEvents 
    const filteredEvents = useMemo(...) 
  */


  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsNewEventDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // If it's a virtual event, we still pass it to the dialog.
    // The dialog will parse the ID to determine if it's an instance.
    // We do NOT strip the ID here, because we need the date from the ID for "Instance" mutations.
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setSelectedDate(new Date());
    setDuplicateEventData(null); // Ensure clean state
    setIsNewEventDialogOpen(true);
  }

  const handleDuplicate = (event: CalendarEvent) => {
    setDuplicateEventData(event);
    setSelectedDate(new Date()); // Default to today for new duplicated event
    setIsEditDialogOpen(false);
    setIsNewEventDialogOpen(true);
  };

  const components = useMemo(() => ({
    event: (props: any) => (
      <CustomEvent
        event={props.event}
        editors={presenceData[props.event.id]?.editors}
        groups={localGroups}
      />
    ),
  }), [presenceData, localGroups]);

  return (
    <div className="h-[calc(100vh-100px)]">
      {!db ? (
        <div className="p-8 flex flex-col items-center justify-center h-full">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              Cannot connect to the database. This usually means environment variables (API Keys) are missing in the deployment.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
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

          {mounted && isDataLoaded ? (
            <BigCalendar
              localizer={localizer}
              events={expandedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onRangeChange={handleRangeChange}
              components={components}
              tooltipAccessor={null} // Disable native tooltip
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="loading loading-spinner loading-lg">Loading Calendar...</span>
            </div>
          )}

          <NewEventDialog
            isOpen={isNewEventDialogOpen}
            onOpenChange={setIsNewEventDialogOpen}
            defaultDate={selectedDate}
            members={filteredMemberNames}
            locations={localLocations}
            groups={localGroups}
            initialData={duplicateEventData}
          />

          <EditEventDialog
            key={selectedEvent ? selectedEvent.id : `new-event-${isEditDialogOpen}`}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            event={selectedEvent}
            members={filteredMemberNames}
            locations={localLocations}
            groups={localGroups}
            onDuplicate={handleDuplicate}
          />
        </>
      )}
    </div>
  );
}
