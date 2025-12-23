// /home/user/studio/src/app/tracking/tracking-client.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { ProjectTrackingProgress, Task, Project } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface TaskWithProjectName extends Task {
  projectName: string;
}

interface TrackingClientProps {
  initialAssignees?: string[]; // Made optional for backward compatibility
}

interface ExtendedProjectTrackingProgress extends ProjectTrackingProgress {
  createdAt?: any;
  updatedAt?: any;
  editHistory?: {
    editedAt: string;
    editedBy: string;
    previousHours: number;
    previousProgress: number;
  }[];
}

interface TaskChange {
  task: TaskWithProjectName;
  hoursWorked: number;
  progressPercentage: number;
  originalHours: number;
  originalProgress: number;
}

const TrackingClient = ({ initialAssignees = [] }: TrackingClientProps) => {
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TaskWithProjectName[]>([]);
  const [trackingData, setTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }>
  >({});
  const [originalTrackingData, setOriginalTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<TaskChange[]>([]);

  // 🚀 Enhanced caching with better structure
  const [projectsCache, setProjectsCache] = useState<Map<string, Project>>(new Map());
  const [allTasksCache, setAllTasksCache] = useState<Task[]>([]);
  const [trackingCache, setTrackingCache] = useState<Map<string, ExtendedProjectTrackingProgress[]>>(new Map());
  const [cacheInitialized, setCacheInitialized] = useState<boolean>(false);

  // 🚀 Add debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // 🚀 Optimized: Initialize all cache at once
  // 🚀 Optimized: Initialize all cache at once
  const initializeCache = useCallback(async () => {
    if (cacheInitialized) return null;

    try {
      console.time('Cache initialization');

      const tasksRef = collection(db, 'tasks');
      const projectsRef = collection(db, 'projects');
      // Fetch tasks and projects (Tracking is now fetched on demand)
      const results = await Promise.allSettled([
        getDocs(tasksRef),
        getDocs(projectsRef)
      ]);

      const [tasksResult, projectsResult] = results;

      if (tasksResult.status === 'rejected') console.error('Error fetching tasks for cache:', tasksResult.reason);
      if (projectsResult.status === 'rejected') console.error('Error fetching projects for cache:', projectsResult.reason);

      const allTasksSnapshot = tasksResult.status === 'fulfilled' ? tasksResult.value : (({ forEach: () => { } }) as any);
      const allProjectsSnapshot = projectsResult.status === 'fulfilled' ? projectsResult.value : (({ forEach: () => { } }) as any);

      // Cache tasks
      const fetchedTasks: Task[] = [];
      allTasksSnapshot.forEach((doc) => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        task.Assignee = data.Assignee as string;
        fetchedTasks.push(task);
      });
      setAllTasksCache(fetchedTasks);

      // Cache projects
      const projectsMap = new Map<string, Project>();
      allProjectsSnapshot.forEach((doc) => {
        const data = doc.data();
        const project = { id: doc.id, ...data } as Project;
        projectsMap.set(doc.id, project);
      });
      setProjectsCache(projectsMap);

      // Tracking cache initialized as empty map, will be populated on demand
      const trackingMap = new Map<string, ExtendedProjectTrackingProgress[]>();
      setTrackingCache(trackingMap);

      setCacheInitialized(true);
      console.timeEnd('Cache initialization');

      return {
        tasks: fetchedTasks,
        projects: projectsMap,
        tracking: trackingMap
      };
    } catch (error) {
      console.error('Error initializing cache:', error);
      return null;
    }
  }, [cacheInitialized]);

  // 🚀 Added: OS Customer Filtering
  const { theme } = useTheme();
  const [osCustomers, setOsCustomers] = useState<Set<string>>(new Set());

  // Fetch assignees and customers on mount
  useEffect(() => {
    const fetchAssigneesAndCustomers = async () => {
      try {
        const tasksRef = collection(db, 'tasks');
        const customersRef = collection(db, 'customers');

        const [tasksSnapshot, customersSnapshot] = await Promise.all([
          getDocs(tasksRef),
          getDocs(customersRef)
        ]);

        // Process Customers to find OS ones
        const osSet = new Set<string>();
        customersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.isDarkModeOnly && data.name) {
            osSet.add(data.name.trim());
          }
        });
        setOsCustomers(osSet);

        const uniqueAssignees = new Set<string>();
        tasksSnapshot.forEach((doc) => {
          const data = doc.data();
          const assigneeString = data.Assignee as string;
          if (assigneeString) {
            assigneeString.split(',').forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName.length > 0) {
                uniqueAssignees.add(trimmedName);
              }
            });
          }
        });

        setAssignees(Array.from(uniqueAssignees).sort());

        // Also initialize main cache if not already done
        if (!cacheInitialized) {
          initializeCache();
        }
      } catch (error) {
        console.error('Error fetching assignees/customers:', error);
      }
    };

    fetchAssigneesAndCustomers();
  }, [initializeCache, cacheInitialized]);

  // Filter Assignees based on Theme (OS Logic)
  const filteredAssignees = useMemo(() => {
    return assignees.filter(name => {
      if (osCustomers.has(name)) {
        // If name is an OS customer:
        // - Light Mode: Hide
        // - Dark Mode: Show
        return theme === 'dark';
      }
      // Standard Employees/Customers: Always show
      return true;
    });
  }, [assignees, osCustomers, theme]);

  // 🚀 Lightning fast tracking data processing from cache
  const processTrackingDataFromCache = useCallback((taskIds: string[], forDate: string, tasksSource: Task[], trackingSource: Map<string, ExtendedProjectTrackingProgress[]>) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTrackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }> = {};

    taskIds.forEach(taskId => {
      const taskTracking = trackingSource.get(taskId) || [];
      let totalHoursWorkedForTask = 0;
      let latestProgress = 0;
      let specificDateData = null;

      // Find task progress from tasksSource
      const task = tasksSource.find(t => t.id === taskId);
      latestProgress = task?.Progress || 0;

      taskTracking.forEach(track => {
        totalHoursWorkedForTask += track.hoursWorked;
        if (track.date === forDate) {
          specificDateData = track;
        }
        latestProgress = Math.max(latestProgress, track.progressPercentage);
      });

      currentTrackingData[taskId] = {
        hoursWorked: specificDateData?.hoursWorked || 0,
        progressPercentage: specificDateData?.progressPercentage || latestProgress,
        totalHoursWorked: totalHoursWorkedForTask,
        isBackdated: forDate !== today
      };
    });

    return currentTrackingData;
  }, []);

  // 🚀 Debounced fetch function
  const debouncedFetchData = useCallback(async (assigneeName: string, forDate: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!assigneeName) {
        setTasks([]);
        setTrackingData({});
        setOriginalTrackingData({});
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        console.time(`Fetch data for ${assigneeName}`);

        // Initialize cache if needed and get fresh data
        const freshData = await initializeCache();

        // Use fresh data if available, otherwise use state
        const tasksSource = freshData?.tasks || allTasksCache;
        const projectsSource = freshData?.projects || projectsCache;
        const trackingSource = freshData?.tracking || trackingCache;

        // Filter tasks using local variables (not stale state)
        const tasksWithProjectName = tasksSource
          .filter(task => {
            if (!task.Assignee) return false;
            const assignees = task.Assignee.split(',').map(name => name.trim());

            // 1. Assignee Filter
            if (!assignees.includes(assigneeName)) return false;

            // 2. OS Project Logic Filter
            const project = projectsSource.get(task.projectId);
            if (!project) return true; // Keep tasks with missing projects (safe default)

            if (theme === 'dark') {
              // Dark Mode: Show Only OS Projects
              return !!project.isDarkModeOnly;
            } else {
              // Light Mode: Show Only Standard Projects
              return !project.isDarkModeOnly;
            }
          })
          .map(task => ({
            ...task,
            projectName: projectsSource.get(task.projectId)?.name || 'Unknown Project',
          }));

        setTasks(tasksWithProjectName);

        if (tasksWithProjectName.length === 0) {
          setTrackingData({});
          setOriginalTrackingData({});
          return;
        }

        // Process tracking data
        const taskIds = tasksWithProjectName.map(task => task.id);

        // 🚀 Optimized: Fetch ALL tracking data for this assignee
        // This is more efficient than fetching by task chunks (avoids 'in' query limits and index issues)
        // and allows us to calculate "Total Hours" correctly for this user.
        const trackingRef = collection(db, 'projectTrackingProgress');

        // Single simple query - cleaner and likely satisfies security rules better
        const trackingSnapshot = await getDocs(query(
          trackingRef,
          where('trackerName', '==', assigneeName)
        ));

        // Update local tracking source map
        // We create a fresh map for this user because we have their FULL history now.
        // Merging isn't strictly necessary if strict 'trackerName' filter is used, 
        // but let's be safe and just map what we got.
        const newTrackingSource = new Map(trackingSource);

        trackingSnapshot.forEach(doc => {
          const track = doc.data() as ExtendedProjectTrackingProgress;
          // Only add if it relates to one of our relevant projects/tasks? 
          // Creating a map by TaskID effectively filters it to relevant tasks later.

          if (!newTrackingSource.has(track.taskId)) {
            newTrackingSource.set(track.taskId, []);
          }

          const existing = newTrackingSource.get(track.taskId) || [];
          if (!existing.some(e => e.id === track.id)) {
            existing.push(track);
          }
          newTrackingSource.set(track.taskId, existing);
        });


        const currentTrackingData = processTrackingDataFromCache(taskIds, forDate, tasksSource, newTrackingSource);

        setTrackingData(currentTrackingData);
        setOriginalTrackingData({ ...currentTrackingData });

        console.timeEnd(`Fetch data for ${assigneeName}`);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching data:', error);
          toast({
            title: 'Error Fetching Data',
            description: error.message || 'Failed to fetch tasks or tracking data.',
            variant: 'destructive',
            duration: 5000
          });
        }
      } finally {
        setLoading(false);
      }
    }, 150); // 150ms debounce
  }, [initializeCache, allTasksCache, projectsCache, trackingCache, processTrackingDataFromCache]);

  // Effect for assignee/date changes
  useEffect(() => {
    debouncedFetchData(selectedAssignee, selectedDate);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedAssignee, selectedDate, debouncedFetchData]);

  const handleInputChange = useCallback(
    (taskId: string, field: 'hoursWorked' | 'progressPercentage', value: string) => {
      setTrackingData((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [field]: value === '' ? 0 : parseFloat(value) || 0,
        },
      }));
    },
    [],
  );

  const changedTasks = useMemo((): TaskChange[] => {
    const changes: TaskChange[] = [];

    Object.keys(trackingData).forEach(taskId => {
      const current = trackingData[taskId];
      const original = originalTrackingData[taskId];

      if (!current || !original) return;

      const hasHoursChanged = current.hoursWorked !== original.hoursWorked && current.hoursWorked > 0;
      const hasProgressChanged = current.progressPercentage !== original.progressPercentage;

      if (hasHoursChanged || hasProgressChanged) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          changes.push({
            task,
            hoursWorked: current.hoursWorked,
            progressPercentage: current.progressPercentage,
            originalHours: original.hoursWorked,
            originalProgress: original.progressPercentage
          });
        }
      }
    });

    return changes;
  }, [trackingData, originalTrackingData, tasks]);

  const handleSaveAll = useCallback(() => {
    if (!selectedAssignee) {
      toast({
        title: 'Error',
        description: 'Please select an assignee first.',
        variant: 'destructive',
      });
      return;
    }

    if (changedTasks.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes detected to save.',
        variant: 'default',
      });
      return;
    }

    setPendingChanges(changedTasks);
    setShowConfirmDialog(true);
  }, [selectedAssignee, changedTasks]);

  // 🚀 Enhanced save with cache updates
  const confirmSave = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const isBackdated = selectedDate !== today;

    setLoading(true);
    setShowConfirmDialog(false);

    try {
      console.time('Save operation');
      const batch = writeBatch(db);
      const trackingRef = collection(db, 'projectTrackingProgress');
      const updatedTaskIds = new Set<string>();

      // Batch all operations for better performance
      const existingTrackingQueries = await Promise.all(
        pendingChanges.map(change =>
          getDocs(query(trackingRef, where('taskId', '==', change.task.id), where('date', '==', selectedDate)))
        )
      );

      pendingChanges.forEach((change, index) => {
        const { task, hoursWorked, progressPercentage } = change;
        const querySnapshot = existingTrackingQueries[index];

        if (querySnapshot.empty) {
          const newId = uuidv4();
          const newTracking: ExtendedProjectTrackingProgress = {
            id: newId,
            taskId: task.id,
            projectId: task.projectId,
            trackerName: selectedAssignee,
            date: selectedDate,
            hoursWorked: hoursWorked,
            progressPercentage: progressPercentage,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            editHistory: []
          };
          batch.set(doc(db, 'projectTrackingProgress', newId), newTracking);

          // Update cache
          if (!trackingCache.has(task.id)) {
            trackingCache.set(task.id, []);
          }
          trackingCache.get(task.id)!.push(newTracking);
        } else {
          const existingDoc = querySnapshot.docs[0];
          const existingData = existingDoc.data() as ExtendedProjectTrackingProgress;

          const editEntry = {
            editedAt: new Date().toISOString(),
            editedBy: selectedAssignee,
            previousHours: existingData.hoursWorked,
            previousProgress: existingData.progressPercentage
          };

          const updatedEditHistory = [...(existingData.editHistory || []), editEntry];

          batch.update(doc(db, 'projectTrackingProgress', existingDoc.id), {
            hoursWorked: hoursWorked,
            progressPercentage: progressPercentage,
            updatedAt: serverTimestamp(),
            editHistory: updatedEditHistory
          });

          // Update cache
          const cached = trackingCache.get(task.id);
          if (cached) {
            const cachedItem = cached.find(t => t.id === existingDoc.id);
            if (cachedItem) {
              cachedItem.hoursWorked = hoursWorked;
              cachedItem.progressPercentage = progressPercentage;
              cachedItem.editHistory = updatedEditHistory;
            }
          }
        }

        if (!isBackdated || progressPercentage > (task.Progress || 0)) {
          batch.update(doc(db, 'tasks', task.id), {
            Progress: progressPercentage,
          });
          updatedTaskIds.add(task.id);
        }
      });

      await batch.commit();

      // Update caches
      if (updatedTaskIds.size > 0) {
        const newAllTasksCache = allTasksCache.map(task =>
          updatedTaskIds.has(task.id)
            ? { ...task, Progress: pendingChanges.find(c => c.task.id === task.id)?.progressPercentage || task.Progress }
            : task
        );
        setAllTasksCache(newAllTasksCache);

        setTasks(prevTasks =>
          prevTasks.map(task =>
            updatedTaskIds.has(task.id)
              ? { ...task, Progress: pendingChanges.find(c => c.task.id === task.id)?.progressPercentage || task.Progress }
              : task
          )
        );
      }

      setOriginalTrackingData({ ...trackingData });

      toast({
        title: 'Success',
        description: `Successfully saved ${pendingChanges.length} task updates ${isBackdated ? `(Backdated: ${selectedDate})` : ''}!`,
      });

      setPendingChanges([]);
      console.timeEnd('Save operation');
    } catch (error) {
      console.error('Error saving tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tracking data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pendingChanges, selectedAssignee, selectedDate, trackingData, trackingCache, allTasksCache]);

  const cancelSave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingChanges([]);
  }, []);

  const summary = useMemo(() => ({
    totalHours: Object.values(trackingData).reduce((total, data) => total + (data.hoursWorked || 0), 0),
    tasksWithHours: Object.values(trackingData).filter(data => data.hoursWorked > 0).length,
    totalTasks: tasks.length,
    changedTasksCount: changedTasks.length,
    totalHoursToSave: changedTasks.reduce((total, change) => total + change.hoursWorked, 0)
  }), [trackingData, tasks.length, changedTasks]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Daily Tracking</h1>

      {/* Loading indicator */}
      {loading && !cacheInitialized && (
        <div className="fixed top-24 right-4 z-20">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 shadow-lg border border-blue-200 dark:border-blue-700">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Loading data...
            </div>
          </div>
        </div>
      )}

      {/* Summary Panel */}
      {!loading && selectedAssignee && tasks.length > 0 && (
        <div className="fixed top-24 right-4 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Summary" : `Summary for ${selectedDate}`}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                <span className="font-medium">{summary.totalHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tasks Updated:</span>
                <span className="font-medium">{summary.tasksWithHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
                <span className="font-medium">{summary.totalTasks}</span>
              </div>
              {summary.changedTasksCount > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="text-xs">Unsaved Changes:</span>
                    <span className="text-xs font-medium">{summary.changedTasksCount}</span>
                  </div>
                </div>
              )}
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <div className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                  ⚠️ Backdated Entry
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <Label htmlFor="assignee-select" className="mb-2 block">
            Select Tracking Person:
          </Label>
          <Select onValueChange={setSelectedAssignee} value={selectedAssignee}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an assignee" />
            </SelectTrigger>
            <SelectContent>
              {filteredAssignees.map((assignee) => (
                <SelectItem key={assignee} value={assignee}>
                  {assignee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date-select" className="mb-2 block">
            Date to Track:
          </Label>
          <Input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {selectedDate !== new Date().toISOString().split('T')[0] && (
          <div className="px-3 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-sm">
            📅 Backdated Entry
          </div>
        )}
      </div>

      {loading && cacheInitialized && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">Processing...</div>
        </div>
      )}

      {!loading && selectedAssignee && tasks.length === 0 && (
        <p>No tasks assigned to {selectedAssignee}.</p>
      )}

      {!loading && selectedAssignee && tasks.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Tasks for {selectedAssignee}
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <span className="text-lg text-amber-600 dark:text-amber-400 ml-2">
                (Date: {new Date(selectedDate).toLocaleDateString()})
              </span>
            )}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Task Name</TableHead>
                <TableHead>Latest Progress (%)</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Total Hours Worked</TableHead>
                <TableHead>Update Progress (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const currentTracking = trackingData[task.id] || {
                  hoursWorked: 0,
                  progressPercentage: task.Progress || 0,
                  totalHoursWorked: 0,
                  isBackdated: false
                };

                const originalTracking = originalTrackingData[task.id] || currentTracking;
                const hasChanges = currentTracking.hoursWorked !== originalTracking.hoursWorked ||
                  currentTracking.progressPercentage !== originalTracking.progressPercentage;

                const latestProgress = task.Progress || 0;
                const updateProgress = currentTracking.progressPercentage;

                return (
                  <TableRow
                    key={task.id}
                    className={`
                      ${currentTracking.isBackdated ? "bg-amber-50 dark:bg-amber-900/10" : ""}
                      ${hasChanges ? "bg-green-50 dark:bg-green-900/10 border-l-4 border-l-green-500" : ""}
                    `}
                  >
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>{task.TaskName}</TableCell>
                    <TableCell>{latestProgress}%</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={currentTracking.hoursWorked}
                        onChange={(e) =>
                          handleInputChange(task.id, 'hoursWorked', e.target.value)
                        }
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        className={`w-24 ${hasChanges ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                        min="0"
                        step="0.5"
                      />
                    </TableCell>
                    <TableCell>{currentTracking.totalHoursWorked.toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={updateProgress}
                        onChange={(e) =>
                          handleInputChange(task.id, 'progressPercentage', e.target.value)
                        }
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        className={`w-24 ${hasChanges ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                        min="0"
                        max="100"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={loading || summary.changedTasksCount === 0}
              className="px-8 py-2"
            >
              {loading ? 'Saving...' : `Save All Changes ${summary.changedTasksCount > 0 ? `(${summary.changedTasksCount})` : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog - Same as before */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Save Changes</DialogTitle>
            <DialogDescription>
              Please review the changes before saving:
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <span className="block text-amber-600 font-medium mt-1">
                  ⚠️ This is a backdated entry for {new Date(selectedDate).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingChanges.map((change, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{change.task.TaskName}</div>
                        <div className="text-sm text-gray-500">{change.task.projectName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {change.originalHours} → <span className="font-medium text-green-600">{change.hoursWorked}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {change.originalProgress}% → <span className="font-medium text-blue-600">{change.progressPercentage}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {change.hoursWorked !== change.originalHours && (
                          <div>Hours: +{(change.hoursWorked - change.originalHours).toFixed(2)}</div>
                        )}
                        {change.progressPercentage !== change.originalProgress && (
                          <div>Progress: {change.progressPercentage > change.originalProgress ? '+' : ''}{change.progressPercentage - change.originalProgress}%</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Total Tasks to Update:</span>
              <span className="font-medium">{pendingChanges.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Hours to Add:</span>
              <span className="font-medium">{summary.totalHoursToSave.toFixed(2)}h</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelSave}>
              Cancel
            </Button>
            <Button onClick={confirmSave} disabled={loading}>
              {loading ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackingClient;