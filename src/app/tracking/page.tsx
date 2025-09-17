// /home/user/studio/src/app/tracking/page.tsx
import { collection, getDocs, query, where, FieldPath } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectTrackingProgress, Task, Project } from '@/lib/types';
import TrackingClient from './tracking-client';

interface TaskWithProjectName extends Task {
  projectName: string;
}

// Function to fetch all unique assignees (from multi-choice strings)
async function getAssignees(): Promise<string[]> {
  console.log('Server: getAssignees - db object:', db); // Debugging db
  try {
    const tasksRef = collection(db, 'tasks');
    console.log('Server: getAssignees - tasksRef:', tasksRef); // Debugging tasksRef
    const querySnapshot = await getDocs(tasksRef); // Fetch all tasks

    const uniqueAssignees = new Set<string>();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const assigneeString = data.Assignee as string; 
      if (assigneeString) {
        // Split the multi-choice string by comma, trim spaces, and add to set
        assigneeString.split(',').forEach(name => {
          const trimmedName = name.trim();
          if (trimmedName !== '') {
            uniqueAssignees.add(trimmedName);
          }
        });
      }
    });
    console.log('Server: Unique Assignees fetched in getAssignees:', Array.from(uniqueAssignees));
    return Array.from(uniqueAssignees);
  } catch (error) {
    console.error('Server: Error fetching assignees in server component:', error);
    return [];
  }
}

// Function to fetch initial tasks and tracking data for the first assignee (if any)
async function getInitialTrackingData(assigneeName?: string): Promise<{
  tasks: TaskWithProjectName[];
  trackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number }>;
}> {
  console.log('Server: getInitialTrackingData - db object:', db); // Debugging db
  try {
    const tasksRef = collection(db, 'tasks');
    const projectsRef = collection(db, 'projects');
    const trackingRef = collection(db, 'projectTrackingProgress');

    console.log('Server: getInitialTrackingData - tasksRef:', tasksRef); // Debugging collection refs
    console.log('Server: getInitialTrackingData - projectsRef:', projectsRef);
    console.log('Server: getInitialTrackingData - trackingRef:', trackingRef);

    // Fetch all tasks first
    const allTasksSnapshot = await getDocs(tasksRef);
    let fetchedTasks: Task[] = [];
    allTasksSnapshot.forEach((doc) => {
      const data = doc.data();
      const task = { id: doc.id, ...data } as Task;
      task.Assignee = data.Assignee as string; 
      fetchedTasks.push(task);
    });
    console.log('Server: Fetched tasks (before filtering by assignee):', fetchedTasks);

    // Filter tasks in memory if an assigneeName is provided
    if (assigneeName) {
      fetchedTasks = fetchedTasks.filter(task => 
        task.Assignee?.split(',').map(name => name.trim()).includes(assigneeName)
      );
    }
    console.log('Server: Fetched tasks (after filtering by assignee):', fetchedTasks);

    const projectIds = new Set<string>();
    fetchedTasks.forEach(task => {
      if (task.projectId) {
        projectIds.add(task.projectId);
      }
    });
    console.log('Server: Project IDs extracted from tasks:', Array.from(projectIds));

    const projectsMap = new Map<string, string>();
    if (projectIds.size > 0) {
      // *** MODIFIED: Fetch all projects and then filter in memory ***
      console.log('Server: Fetching ALL projects to filter in memory...');
      const allProjectsSnapshot = await getDocs(projectsRef);
      console.log('Server: All projects snapshot (raw data):', allProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      allProjectsSnapshot.forEach((doc) => {
        if (projectIds.has(doc.id)) { // Filter projects by ID in memory
          const project = doc.data() as Project;
          projectsMap.set(doc.id, project.name);
        }
      });
    }
    console.log('Server: Projects Map created:', Object.fromEntries(projectsMap));

    const tasksWithProjectName: TaskWithProjectName[] = fetchedTasks.map((task) => ({
      ...task,
      projectName: projectsMap.get(task.projectId) || 'Unknown Project',
    }));
    console.log('Server: Tasks with project names:', tasksWithProjectName);

    const today = new Date().toISOString().slice(0, 10);
    const initialTrackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number }> = {};
    for (const task of tasksWithProjectName) {
      const q = query(trackingRef, where('taskId', '==', task.id));
      const trackingSnapshot = await getDocs(q);
      let totalHoursWorkedForTask = 0;
      let latestProgress = task.Progress || 0;
      trackingSnapshot.forEach((doc) => {
        const track = doc.data() as ProjectTrackingProgress;
        totalHoursWorkedForTask += track.hoursWorked;
        if (track.date === today) {
          initialTrackingData[task.id] = {
            hoursWorked: track.hoursWorked,
            progressPercentage: track.progressPercentage,
            totalHoursWorked: totalHoursWorkedForTask,
          };
        }
        latestProgress = Math.max(latestProgress, track.progressPercentage);
      });

      if (!initialTrackingData[task.id]) {
        initialTrackingData[task.id] = {
          hoursWorked: 0,
          progressPercentage: latestProgress,
          totalHoursWorked: totalHoursWorkedForTask,
        };
      }
    }
    console.log('Server: Initial Tracking Data prepared:', initialTrackingData);

    return { tasks: tasksWithProjectName, trackingData: initialTrackingData };
  } catch (error) {
    console.error('Server: Error fetching initial tasks and tracking data in server component:', error);
    return { tasks: [], trackingData: {} };
  }
}

export default async function TrackingPage() {
  console.log('Server: TrackingPage component rendering...');
  const initialAssignees = await getAssignees();
  console.log('Server: initialAssignees for TrackingClient props:', initialAssignees);

  const firstAssignee = initialAssignees.length > 0 ? initialAssignees[0] : undefined;
  console.log('Server: firstAssignee for initial data fetch:', firstAssignee);

  const { tasks: initialTasks, trackingData: initialTrackingData } = await getInitialTrackingData(firstAssignee);
  console.log('Server: initialTasks for TrackingClient props:', initialTasks);
  console.log('Server: initialTrackingData for TrackingClient props:', initialTrackingData);

  return (
    <TrackingClient
      initialAssignees={initialAssignees}
      initialTasks={initialTasks}
      initialTrackingData={initialTrackingData}
    />
  );
}
