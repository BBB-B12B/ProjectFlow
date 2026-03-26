// /home/user/studio/src/app/tracking/tracking-client.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { ProjectTrackingProgress, Task, Project, AssigneeGroup } from '@/lib/types';
import { useLocalStorage } from "@/hooks/use-local-storage";
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
import { TaskAttachmentsDialog } from '@/components/task-attachments-dialog';
import { Paperclip, Loader2 } from 'lucide-react';
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
  increment,
} from 'firebase/firestore';
// @ts-expect-error Types missing for uuid
import { v4 as uuidv4 } from 'uuid';

interface TaskWithProjectName extends Task {
  projectName: string;
}

interface TrackingClientProps {
  initialAssignees?: string[];
  preselectedAssignee?: string;
  preselectedDate?: string;
  isPopup?: boolean;
  onSaveSuccess?: () => void;
}

interface ExtendedProjectTrackingProgress extends Omit<ProjectTrackingProgress, 'createdAt' | 'updatedAt'> {
  createdAt?: any;
  updatedAt?: any;
  editHistory?: {
    editedAt: string;
    editedBy: string;
    previousHours: number;
    previousProgress: number;
    previousAttachments?: string[];
  }[];
  attachments?: string[];
}

interface TaskChange {
  task: TaskWithProjectName;
  hoursWorked: number;
  progressPercentage: number;
  originalHours: number;
  originalProgress: number;
  attachments?: string[];
}

const TrackingClient = ({ initialAssignees = [], preselectedAssignee, preselectedDate, isPopup, onSaveSuccess }: TrackingClientProps) => {
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [assigneeGroups, setAssigneeGroups] = useState<AssigneeGroup[]>([]); // Store fetched groups
  const [showCompleted, setShowCompleted] = useState<boolean>(true); // Default to true

  const [localAssignee, setLocalAssignee] = useLocalStorage<string>('tracking_assignee', '');
  const [localProjectId, setLocalProjectId] = useLocalStorage<string>('tracking_project', 'all');
  const [localDate, setLocalDate] = useLocalStorage<string>('tracking_date', new Date().toISOString().split('T')[0]);

  const selectedAssignee = isPopup ? preselectedAssignee || '' : localAssignee;
  const setSelectedAssignee = isPopup ? () => {} : setLocalAssignee;

  const selectedProjectId = localProjectId;
  const setSelectedProjectId = isPopup ? () => {} : setLocalProjectId;

  const selectedDate = isPopup ? preselectedDate || '' : localDate;
  const setSelectedDate = isPopup ? () => {} : setLocalDate;

  const [tasks, setTasks] = useState<TaskWithProjectName[]>([]);
  const [trackingData, setTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean; attachments?: string[]; minAllowedProgress?: number; maxAllowedProgress?: number; latestProgressAtDate?: number }>
  >({});
  const [originalTrackingData, setOriginalTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean; attachments?: string[]; minAllowedProgress?: number; maxAllowedProgress?: number; latestProgressAtDate?: number }>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<TaskChange[]>([]);
  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
  const [activeAttachmentTaskId, setActiveAttachmentTaskId] = useState<string | null>(null);

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
      allTasksSnapshot.forEach((doc: any) => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        task.Assignee = data.Assignee as string;
        fetchedTasks.push(task);
      });
      setAllTasksCache(fetchedTasks);

      // Cache projects
      const projectsMap = new Map<string, Project>();
      allProjectsSnapshot.forEach((doc: any) => {
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
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);

  // Fetch assignees and customers on mount
  useEffect(() => {
    const fetchAssigneesAndCustomers = async () => {
      try {
        const tasksRef = collection(db, 'tasks');
        const customersRef = collection(db, 'customers');

        const [tasksSnapshot, customersSnapshot, groupsSnapshot] = await Promise.all([
          getDocs(tasksRef),
          getDocs(customersRef),
          getDocs(collection(db, 'assignee_groups'))
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

        // Process Groups
        const groups: AssigneeGroup[] = [];
        groupsSnapshot.forEach(doc => {
          groups.push({ id: doc.id, ...doc.data() } as AssigneeGroup);
        });
        setAssigneeGroups(groups);

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
        setDependenciesLoaded(true);

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
  const processTrackingDataFromCache = useCallback((taskIds: string[], forDate: string, tasksSource: Task[], trackingSource: Map<string, ExtendedProjectTrackingProgress[]>, assigneeName: string) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTrackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean; attachments?: string[]; minAllowedProgress: number; maxAllowedProgress: number; latestProgressAtDate: number }> = {};

    taskIds.forEach(taskId => {
      const taskTracking = (trackingSource.get(taskId) || []) as ExtendedProjectTrackingProgress[];
      let totalHoursWorkedForTask = 0;
      let specificDateData: any = null;
      let minAllowedProgress = 0;
      let maxAllowedProgress = 100;
      let latestProgressAtDate = 0;

      taskTracking.forEach(track => {
        // 1. Assignee specific data (Hours and specific date entry)
        if (track.trackerName === assigneeName) {
          totalHoursWorkedForTask += track.hoursWorked;
          if (track.date === forDate) {
            specificDateData = track;
          }
        }

        // 2. Global data calculation for Progress (Any Assignee)
        if (track.date < forDate) {
          minAllowedProgress = Math.max(minAllowedProgress, track.progressPercentage);
        }
        if (track.date > forDate) {
          maxAllowedProgress = Math.min(maxAllowedProgress, track.progressPercentage);
        }
        if (track.date <= forDate) {
          latestProgressAtDate = Math.max(latestProgressAtDate, track.progressPercentage);
        }
      });

      let activeProgress = specificDateData?.progressPercentage;
      if (activeProgress === undefined) {
        activeProgress = latestProgressAtDate;
      }

      currentTrackingData[taskId] = {
        hoursWorked: specificDateData?.hoursWorked || 0,
        progressPercentage: activeProgress,
        totalHoursWorked: totalHoursWorkedForTask,
        isBackdated: forDate !== today,
        attachments: specificDateData?.attachments || [],
        minAllowedProgress,
        maxAllowedProgress,
        latestProgressAtDate
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

        // 🚀 Optimized: Fetch ALL tracking data globally to calculate accurate min/max progress
        const trackingRef = collection(db, 'projectTrackingProgress');
        const trackingSnapshot = await getDocs(trackingRef); // NO FILTER

        const newTrackingSource = new Map<string, ExtendedProjectTrackingProgress[]>(); // Fresh map, ignoring old cache
        const assigneeTasksWithHoursOnDate = new Set<string>();

        trackingSnapshot.forEach(doc => {
          const track = doc.data() as ExtendedProjectTrackingProgress;
          if (!newTrackingSource.has(track.taskId)) {
            newTrackingSource.set(track.taskId, []);
          }
          const existing = newTrackingSource.get(track.taskId) || [];
          if (!existing.some(e => e.id === track.id)) {
            existing.push(track);
          }
          newTrackingSource.set(track.taskId, existing);

          if (track.trackerName === assigneeName && track.date === forDate && (track.hoursWorked || 0) > 0) {
            assigneeTasksWithHoursOnDate.add(track.taskId);
          }
        });

        // Filter tasks using local variables (not stale state)
        const tasksWithProjectName = tasksSource
          .filter(task => {
            if (!task.Assignee) return false;
            const assignees = task.Assignee.split(',').map(name => name.trim());

            // 1. Assignee Filter (Direct OR Group)
            const isDirectlyAssigned = assignees.includes(assigneeName);

            // Find groups this user belongs to
            const userGroups = assigneeGroups.filter(g => g.members.includes(assigneeName)).map(g => g.name);
            const isGroupAssigned = assignees.some(assigned => userGroups.includes(assigned));

            if (!isDirectlyAssigned && !isGroupAssigned) return false;

            // Compute historical completion status
            const taskTracking = (newTrackingSource.get(task.id) || []) as ExtendedProjectTrackingProgress[];
            let maxProgressUpToDate = 0;
            taskTracking.forEach(track => {
              if (track.date <= forDate) {
                maxProgressUpToDate = Math.max(maxProgressUpToDate, track.progressPercentage);
              }
            });

            const hasHoursOnDate = assigneeTasksWithHoursOnDate.has(task.id);
            const today = new Date().toISOString().split('T')[0];
            const isCompletedAsOfDate = (forDate === today) 
              ? (task.Status === 'จบงานแล้ว' || task.Progress === 100)
              : (maxProgressUpToDate >= 100);

            const project = projectsSource.get(task.projectId);
            const isContinuousProject = project?.name === 'พิธีกรรม (เฉพาะแผนก DBD)';

            // 🚀 Filter logic: Visibility Base Rules
            const isCurrentlyInProgress = task.Status === 'กำลังดำเนินการ';
            const isCurrentlyCompleted = task.Status === 'จบงานแล้ว';
            
            const isEligibleStatus = hasHoursOnDate || isCurrentlyInProgress || (isCurrentlyCompleted && !isCompletedAsOfDate);

            // Bypass status checks entirely if it's a continuous project
            if (!isContinuousProject) {
              if (!isEligibleStatus) return false;

              // Failsafe: Hide tasks that were completed as of this date AND have no logged hours today
              if (isCompletedAsOfDate && !hasHoursOnDate) return false;
            }

            // 2. OS Project Logic Filter (Optimized)
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

        const taskIds = tasksWithProjectName.map(task => task.id);
        const currentTrackingData = processTrackingDataFromCache(taskIds, forDate, tasksSource, newTrackingSource, assigneeName);

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
        setIsInitialLoading(false);
      }
    }, 150); // 150ms debounce
  }, [initializeCache, allTasksCache, projectsCache, trackingCache, processTrackingDataFromCache, assigneeGroups]);

  // Effect for assignee/date changes
  useEffect(() => {
    if (!dependenciesLoaded) return;
    debouncedFetchData(selectedAssignee, selectedDate);
    // Reset project filter when assignee changes to avoid "invisible tasks"
    if (selectedAssignee) {
      setSelectedProjectId('all');
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedAssignee, selectedDate, debouncedFetchData, dependenciesLoaded]);

  const handleInputChange = useCallback(
    (taskId: string, field: 'hoursWorked' | 'progressPercentage' | 'attachments', value: any) => {
      setTrackingData((prev) => {
        const prevData = prev[taskId];
        let finalValue = value;

        if (field === 'progressPercentage') {
          finalValue = value === '' ? '' : parseFloat(value);
          if (isNaN(finalValue as number)) finalValue = 0;
        } else if (field === 'hoursWorked') {
          finalValue = value === '' ? '' : parseFloat(value);
          if (isNaN(finalValue as number)) finalValue = 0;
        }

        return {
          ...prev,
          [taskId]: {
            ...prevData,
            [field]: finalValue,
          },
        };
      });
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
      const hasAttachmentsChanged = JSON.stringify(current.attachments || []) !== JSON.stringify(original.attachments || []);

      if (hasHoursChanged || hasProgressChanged || hasAttachmentsChanged) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          changes.push({
            task,
            hoursWorked: current.hoursWorked,
            progressPercentage: current.progressPercentage,
            originalHours: original.hoursWorked,
            originalProgress: original.progressPercentage,
            attachments: current.attachments
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
          getDocs(query(trackingRef, where('taskId', '==', change.task.id), where('date', '==', selectedDate), where('trackerName', '==', selectedAssignee)))
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
            attachments: change.attachments || [],
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
            previousProgress: existingData.progressPercentage,
            previousAttachments: existingData.attachments
          };

          const updatedEditHistory = [...(existingData.editHistory || []), editEntry];

          batch.update(doc(db, 'projectTrackingProgress', existingDoc.id), {
            hoursWorked: hoursWorked,
            progressPercentage: progressPercentage,
            attachments: change.attachments || [],
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
              cachedItem.attachments = change.attachments || [];
              cachedItem.editHistory = updatedEditHistory;
            }
          }
        }

        if (!isBackdated || progressPercentage >= (task.Progress || 0)) {
          const taskRef = doc(db, 'tasks', task.id);
          const updateData: any = { Progress: progressPercentage };
          if (progressPercentage === 100) {
            updateData.Status = 'จบงานแล้ว';
          }
          batch.update(taskRef, updateData);
          updatedTaskIds.add(task.id);
        } else if (progressPercentage === 100) {
          const taskRef = doc(db, 'tasks', task.id);
          batch.update(taskRef, {
            Progress: 100,
            Status: 'จบงานแล้ว'
          });
          updatedTaskIds.add(task.id);
        }

        // Increment project totalFiles if attachments are added
        const newAttachments = change.attachments || [];
        const oldAttachments = originalTrackingData[task.id]?.attachments || [];
        const addedCount = newAttachments.length - oldAttachments.length;

        if (addedCount > 0) {
          const projectRef = doc(db, 'projects', task.projectId);
          batch.update(projectRef, {
            totalFiles: increment(addedCount)
          });
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
      if (onSaveSuccess) onSaveSuccess();
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
    totalHoursToSave: changedTasks.reduce((total, change) => total + change.hoursWorked, 0),
    uniqueProjects: Array.from(new Set(tasks.filter(t => (t.Progress || 0) < 100).map(t => t.projectId))).map(id => projectsCache.get(id)).filter(Boolean) as Project[]
  }), [trackingData, tasks, changedTasks, projectsCache]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      // 100% Completed tasks filtering is now handled robustly inside debouncedFetchData

      // 1. Filter by Project
      if (selectedProjectId && selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false;

      return true;
    });

    // 3. Sort by Project Name (Ascending) then by Progress (Descending)
    return filtered.sort((a, b) => {
      if (a.projectName < b.projectName) return -1;
      if (a.projectName > b.projectName) return 1;

      const progA = trackingData[a.id]?.progressPercentage || a.Progress || 0;
      const progB = trackingData[b.id]?.progressPercentage || b.Progress || 0;
      return progB - progA;
    });
  }, [tasks, selectedProjectId, trackingData]);

  return (
    <div className={isPopup ? "" : "container mx-auto p-4"}>
      {!isPopup && <h1 className="text-3xl font-bold mb-6">Daily Tracking</h1>}

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

      {(isInitialLoading || !dependenciesLoaded) && (
        <div className="flex flex-col h-64 items-center justify-center gap-4 mt-8 bg-muted/20 border border-muted/30 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Synchronizing Tracking Data...</span>
        </div>
      )}

      {!(isInitialLoading || !dependenciesLoaded) && (
        <>
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

      {isPopup ? (
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-xl font-bold">Tracking: {selectedAssignee}</h2>
          <div className="text-sm text-muted-foreground mb-4">Date: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
          <div>
            <Label htmlFor="project-select-popup" className="mb-2 block">
              Filter by Project:
            </Label>
            <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
              <SelectTrigger id="project-select-popup" className="w-[280px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {summary.uniqueProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
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
            <Label htmlFor="project-select" className="mb-2 block">
              Filter by Project:
            </Label>
            <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {summary.uniqueProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
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
      )}

      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity duration-200 min-h-[400px]' : 'transition-opacity duration-200 min-h-[400px]'}>
        {selectedAssignee && tasks.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-lg font-medium">No tasks found for {selectedAssignee}.</p>
          <div className="text-sm text-muted-foreground mt-2 text-left bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto max-h-60">
            <p className="font-bold">Debug Info:</p>
            <ul className="list-disc list-inside">
              <li>Project Filter: {selectedProjectId === 'all' ? 'All Projects' : selectedProjectId}</li>
              <li>Show Completed: {showCompleted ? 'Yes' : 'No'}</li>
              <li>Visible Tasks: {filteredTasks.length}</li>
              <li>Total Fetched Tasks: {tasks.length}</li>
              <li>Direct Match: {allTasksCache.some(t => t.Assignee === selectedAssignee) ? 'Yes' : 'No'}</li>
              <li><strong>All Assignees in Database:</strong> {Array.from(new Set(allTasksCache.map(t => t.Assignee))).sort().join(', ')}</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProjectId('all')}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedAssignee && tasks.length > 0 && (
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
                <TableHead className="w-[50px]">Files</TableHead>
                <TableHead>Latest Progress (%)</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Total Hours Worked</TableHead>
                <TableHead>Update Progress (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No active tasks found (100% completed tasks are hidden).
                  </TableCell>
                </TableRow>
              )}
              {filteredTasks.map((task) => {
                const currentTracking = trackingData[task.id] || {
                  hoursWorked: 0,
                  progressPercentage: task.Progress || 0,
                  totalHoursWorked: 0,
                  isBackdated: false
                };

                const originalTracking = originalTrackingData[task.id] || currentTracking;
                const hasChanges = currentTracking.hoursWorked !== originalTracking.hoursWorked ||
                  currentTracking.progressPercentage !== originalTracking.progressPercentage;

                const minAllowed = currentTracking.minAllowedProgress || 0;
                const maxAllowed = currentTracking.maxAllowedProgress !== undefined ? currentTracking.maxAllowedProgress : 100;
                const latestProgressAtDate = currentTracking.latestProgressAtDate || 0;
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
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{task.TaskName}</span>
                        {currentTracking.attachments && currentTracking.attachments.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Paperclip className="h-3 w-3" /> {currentTracking.attachments.length} files
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setActiveAttachmentTaskId(task.id);
                          setIsAttachmentsDialogOpen(true);
                        }}
                      >
                        <Paperclip className={`h-4 w-4 ${currentTracking.attachments && currentTracking.attachments.length > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
                      </Button>
                    </TableCell>
                    <TableCell>{latestProgressAtDate}%</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={currentTracking.hoursWorked}
                        onChange={(e) =>
                          handleInputChange(task.id, 'hoursWorked', e.target.value)
                        }
                        onBlur={(e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val)) val = 0;
                          val = Math.max(0, val); // Must be non-negative
                          handleInputChange(task.id, 'hoursWorked', val);
                        }}
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
                      {task.projectName === 'พิธีกรรม (เฉพาะแผนก DBD)' ? (
                         <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                           Continuous
                         </span>
                      ) : (
                        <Input
                          type="number"
                          value={updateProgress}
                          onChange={(e) =>
                            handleInputChange(task.id, 'progressPercentage', e.target.value)
                          }
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) val = 0;
                            val = Math.max(minAllowed, Math.min(val, maxAllowed));
                            handleInputChange(task.id, 'progressPercentage', val);
                          }}
                          onFocus={(e) => {
                            if (e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          className={`w-24 ${hasChanges ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                          min={minAllowed}
                          max={maxAllowed}
                        />
                      )}
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
      {activeAttachmentTaskId && (
        <TaskAttachmentsDialog
          isOpen={isAttachmentsDialogOpen}
          onOpenChange={(open) => {
            setIsAttachmentsDialogOpen(open);
            if (!open) setActiveAttachmentTaskId(null);
          }}
          taskName={tasks.find(t => t.id === activeAttachmentTaskId)?.TaskName || 'Unknown Task'}
          attachments={trackingData[activeAttachmentTaskId]?.attachments || []}
          onAttachmentsChange={(newAttachments) => handleInputChange(activeAttachmentTaskId, 'attachments', newAttachments)}
        />
      )}
        </>
      )}
    </div>
  );
};

export default TrackingClient;