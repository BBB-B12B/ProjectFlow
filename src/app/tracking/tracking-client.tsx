// /home/user/studio/src/app/tracking/tracking-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface TaskWithProjectName extends Task {
  projectName: string;
}

interface TrackingClientProps {
  initialAssignees: string[];
  initialTasks: TaskWithProjectName[];
  initialTrackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number }>;
}

// Extended interface สำหรับ audit trail
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

const TrackingClient = ({ initialAssignees, initialTasks, initialTrackingData }: TrackingClientProps) => {
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TaskWithProjectName[]>(initialTasks);
  const [trackingData, setTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }>
  >(initialTrackingData);
  const [originalTrackingData, setOriginalTrackingData] = useState<
    Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }>
  >(initialTrackingData);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<TaskChange[]>([]);

  const fetchTasksAndTrackingData = useCallback(async (assigneeName: string, forDate: string = new Date().toISOString().split('T')[0]) => {
    setLoading(true);
    try {
      const tasksRef = collection(db, 'tasks');
      const projectsRef = collection(db, 'projects');
      const trackingRef = collection(db, 'projectTrackingProgress');

      // Fetch all tasks first
      const allTasksSnapshot = await getDocs(tasksRef);
      let fetchedTasks: Task[] = [];
      allTasksSnapshot.forEach((doc) => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        task.Assignee = data.Assignee as string; 
        fetchedTasks.push(task);
      });

      // Filter tasks in memory
      let filteredTasks: Task[] = fetchedTasks;
      if (assigneeName) {
        filteredTasks = fetchedTasks.filter(task => 
          task.Assignee?.split(',').map(name => name.trim()).includes(assigneeName)
        );
      }

      const projectIds = new Set<string>();
      filteredTasks.forEach(task => {
        projectIds.add(task.projectId);
      });

      const projectsMap = new Map<string, string>();
      if (projectIds.size > 0) {
        const allProjectsSnapshot = await getDocs(projectsRef);
        allProjectsSnapshot.forEach((doc) => {
          if (projectIds.has(doc.id)) {
            const project = doc.data() as Project;
            projectsMap.set(doc.id, project.name);
          }
        });
      }

      const tasksWithProjectName: TaskWithProjectName[] = filteredTasks.map((task) => ({
        ...task,
        projectName: projectsMap.get(task.projectId) || 'Unknown Project',
      }));
      setTasks(tasksWithProjectName);

      // Fetch tracking data สำหรับวันที่เลือก
      const currentInitialTrackingData: Record<string, { hoursWorked: number; progressPercentage: number; totalHoursWorked: number; isBackdated?: boolean }> = {};
      
      for (const task of tasksWithProjectName) {
        // Query tracking data สำหรับ task นี้ทั้งหมด
        const q = query(trackingRef, where('taskId', '==', task.id));
        const trackingSnapshot = await getDocs(q);
        let totalHoursWorkedForTask = 0;
        let latestProgress = task.Progress || 0;
        let specificDateData = null;

        trackingSnapshot.forEach((doc) => {
          const track = doc.data() as ExtendedProjectTrackingProgress;
          totalHoursWorkedForTask += track.hoursWorked;
          
          // เช็คข้อมูลสำหรับวันที่เลือก
          if (track.date === forDate) {
            specificDateData = track;
          }
          
          latestProgress = Math.max(latestProgress, track.progressPercentage);
        });

        if (specificDateData) {
          // มีข้อมูลสำหรับวันที่เลือกแล้ว
          const today = new Date().toISOString().split('T')[0];
          currentInitialTrackingData[task.id] = {
            hoursWorked: specificDateData.hoursWorked,
            progressPercentage: specificDateData.progressPercentage,
            totalHoursWorked: totalHoursWorkedForTask,
            isBackdated: forDate !== today
          };
        } else {
          // ไม่มีข้อมูลสำหรับวันที่เลือก - ใช้ค่าเริ่มต้น
          const today = new Date().toISOString().split('T')[0];
          currentInitialTrackingData[task.id] = {
            hoursWorked: 0,
            progressPercentage: latestProgress,
            totalHoursWorked: totalHoursWorkedForTask,
            isBackdated: forDate !== today
          };
        }
      }
      setTrackingData(currentInitialTrackingData);
      setOriginalTrackingData({ ...currentInitialTrackingData });
    } catch (error) {
      console.error('Error fetching tasks and tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks or tracking data. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch เมื่อ assignee หรือวันที่เปลี่ยน
  useEffect(() => {
    if (selectedAssignee) {
      fetchTasksAndTrackingData(selectedAssignee, selectedDate);
    } else {
      setTasks(initialTasks);
      setTrackingData(initialTrackingData);
      setOriginalTrackingData(initialTrackingData);
    }
  }, [selectedAssignee, selectedDate, fetchTasksAndTrackingData, initialTasks, initialTrackingData]);

  const handleInputChange = useCallback(
    (
      taskId: string,
      field: 'hoursWorked' | 'progressPercentage',
      value: string,
    ) => {
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

  // ตรวจสอบการเปลี่ยนแปลงและเตรียมข้อมูลสำหรับบันทึก
  const getChangedTasks = useCallback((): TaskChange[] => {
    const changes: TaskChange[] = [];
    
    Object.keys(trackingData).forEach(taskId => {
      const current = trackingData[taskId];
      const original = originalTrackingData[taskId];
      
      // ตรวจสอบว่ามีการเปลี่ยนแปลงและมีค่ามากกว่า 0
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

    const changes = getChangedTasks();
    
    if (changes.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes detected to save.',
        variant: 'default',
      });
      return;
    }

    setPendingChanges(changes);
    setShowConfirmDialog(true);
  }, [selectedAssignee, getChangedTasks]);

  const confirmSave = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const isBackdated = selectedDate !== today;

    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const trackingRef = collection(db, 'projectTrackingProgress');
      
      for (const change of pendingChanges) {
        const { task, hoursWorked, progressPercentage } = change;
        
        // ตรวจสอบข้อมูลเดิมในฐานข้อมูล
        const q = query(
          trackingRef,
          where('taskId', '==', task.id),
          where('date', '==', selectedDate),
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // สร้างข้อมูลใหม่
          const newTracking: ExtendedProjectTrackingProgress = {
            id: uuidv4(),
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
          await setDoc(doc(db, 'projectTrackingProgress', newTracking.id), newTracking);
        } else {
          // อัปเดตข้อมูลเดิม และเก็บ audit trail
          const existingDoc = querySnapshot.docs[0];
          const existingData = existingDoc.data() as ExtendedProjectTrackingProgress;
          
          // สร้าง edit history entry
          const editEntry = {
            editedAt: new Date().toISOString(),
            editedBy: selectedAssignee,
            previousHours: existingData.hoursWorked,
            previousProgress: existingData.progressPercentage
          };

          // อัปเดตข้อมูล
          const updatedEditHistory = [...(existingData.editHistory || []), editEntry];
          
          await updateDoc(doc(db, 'projectTrackingProgress', existingDoc.id), {
            hoursWorked: hoursWorked,
            progressPercentage: progressPercentage,
            updatedAt: serverTimestamp(),
            editHistory: updatedEditHistory
          });
        }

        // อัปเดต task progress เฉพาะกรณีที่ลงข้อมูลวันปัจจุบัน
        // หรือกรณีที่ progress ใหม่สูงกว่าค่าเดิม
        if (!isBackdated || progressPercentage > (task.Progress || 0)) {
          const taskRef = doc(db, 'tasks', task.id);
          await updateDoc(taskRef, {
            Progress: progressPercentage,
          });
        }
      }

      toast({
        title: 'Success',
        description: `Successfully saved ${pendingChanges.length} task updates ${isBackdated ? `(Backdated: ${selectedDate})` : ''}!`,
      });
      
      // รีเฟรชข้อมูล
      await fetchTasksAndTrackingData(selectedAssignee, selectedDate);
      setPendingChanges([]);
      
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
  }, [pendingChanges, selectedAssignee, selectedDate, fetchTasksAndTrackingData]);

  const cancelSave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingChanges([]);
  }, []);

  // คำนวณจำนวน tasks ที่มีการเปลี่ยนแปลง
  const changedTasksCount = getChangedTasks().length;
  const totalHoursToSave = getChangedTasks().reduce((total, change) => total + change.hoursWorked, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Daily Tracking</h1>
      
      {!loading && selectedAssignee && tasks.length > 0 && (
        <div className="fixed top-24 right-4 z-10"> 
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Summary" : `Summary for ${selectedDate}`}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                <span className="font-medium">
                  {Object.values(trackingData).reduce((total, data) => total + (data.hoursWorked || 0), 0).toFixed(2)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tasks Updated:</span>
                <span className="font-medium">
                  {Object.values(trackingData).filter(data => data.hoursWorked > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              {changedTasksCount > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="text-xs">Unsaved Changes:</span>
                    <span className="text-xs font-medium">{changedTasksCount}</span>
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
              {assignees.map((assignee) => (
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

      {loading && <p>Loading tasks...</p>}

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
          
          {/* ปุ่ม Save ล่างสุด */}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveAll} 
              disabled={loading || changedTasksCount === 0}
              className="px-8 py-2"
            >
              {loading ? 'Saving...' : `Save All Changes ${changedTasksCount > 0 ? `(${changedTasksCount})` : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
              <span className="font-medium">{totalHoursToSave.toFixed(2)}h</span>
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