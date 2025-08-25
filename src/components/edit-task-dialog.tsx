"use client";

// --- (1) IMPORT firebase/firestore and other hooks ---
import { useEffect, useState, useMemo, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Task, ProjectType } from "@/lib/types";
import { updateTask, createTask, deleteTask } from "@/app/project/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { MultiSelectAutocomplete } from "./ui/multi-select-autocomplete";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface TaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: Task | null;
  projectId: string;
  assignees: string[];
}

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save changes" : "Create Task")}</Button>;
}

export function EditTaskDialog({ isOpen, onOpenChange, task, projectId, assignees }: TaskDialogProps) {
  const isEditMode = !!task;
  const { toast } = useToast();
  const action = isEditMode ? updateTask : createTask;
  const [state, formAction] = useActionState(action, { success: false, message: "" });
  const [isDeletePending, startDeleteTransition] = useTransition();
  
  // --- (2) MOCK USER DATA (replace with real auth data later) ---
  const [currentUser] = useState({ id: `user_${Date.now()}`, name: "Kan" });
  
  const [effort, setEffort] = useState(10);
  const [effect, setEffect] = useState(10);
  const [progress, setProgress] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType>('Main');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- (3) MANAGE PRESENCE IN FIRESTORE ---
  useEffect(() => {
    // Only track presence if we are in edit mode and have a task id
    if (isEditMode && task?.id) {
        const presenceRef = doc(db, 'presence', task.id);

        if (isOpen) {
            // User opened the dialog, set their presence
            setDoc(presenceRef, {
                userId: currentUser.id,
                userName: currentUser.name,
                lastSeen: serverTimestamp(),
            }).catch(console.error);

            // Return a cleanup function to be run when the component unmounts or dependencies change
            return () => {
                deleteDoc(presenceRef).catch(console.error);
            };
        }
    }
  }, [isOpen, task, isEditMode, currentUser]);


  const suggestedType = useMemo(() => {
    const isHighEffect = effect > 10;
    const isHighEffort = effort > 10;
    if (isHighEffect && isHighEffort) return 'Main';
    if (isHighEffect && !isHighEffort) return 'QuickWin';
    if (!isHighEffect && isHighEffort) return 'Thankless';
    return 'Fillin';
  }, [effort, effect]);
  
  useEffect(() => {
    if (isOpen) {
        if (task) {
          setEffort(task.Effort || 10);
          setEffect(task.Effect || 10);
          setProgress(task.Progress || 0);
          setProjectType(task.ProjectType || 'Main');
          setStartDate(task.StartDate || '');
          setEndDate(task.EndDate || '');
        } else {
          const today = new Date().toISOString().split('T')[0];
          setEffort(10);
          setEffect(10);
          setProgress(0);
          setProjectType('Main');
          setStartDate(today);
          setEndDate(today);
        }
    }
  }, [task, isOpen]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  useEffect(() => {
    if (isOpen) {
        setProjectType(suggestedType);
    }
  }, [suggestedType, isOpen]);

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success!", description: `Task has been ${isEditMode ? 'updated' : 'created'}.` });
      onOpenChange(false);
    } else if (state.message) {
      toast({ variant: "destructive", title: "Operation Failed", description: state.message });
    }
  }, [state, onOpenChange, toast, isEditMode]);

  const handleDelete = async () => {
    if (!task) return;
    startDeleteTransition(async () => {
        const result = await deleteTask(task.id, projectId);
        if (result.success) {
            toast({ title: "Success!", description: result.message });
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: result.message });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your task. Click save when you're done." : "Fill in the details for the new task."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          {isEditMode && task && <input type="hidden" name="taskId" value={task.id} />}
          {!isEditMode && <input type="hidden" name="projectId" value={projectId} />}
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="TaskName">Task Name</Label>
              <Input id="TaskName" name="TaskName" defaultValue={task?.TaskName || ''} placeholder="e.g. Design new homepage mockups" required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Category">Category</Label>
              <Input id="Category" name="Category" defaultValue={task?.Category || ''} placeholder="e.g. Design" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="StartDate">Start Date</Label>
                    <Input id="StartDate" name="StartDate" type="date" value={startDate} onChange={handleStartDateChange} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="EndDate">End Date</Label>
                    <Input id="EndDate" name="EndDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} required/>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                <Label htmlFor="Progress">Progress</Label>
                <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Slider id="Progress" name="Progress" defaultValue={[progress]} max={100} step={1} onValueChange={(value) => setProgress(value[0])} />
            </div>
             <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="Effect">Effect Score</Label>
                <span className="text-sm text-muted-foreground">{effect} / 20</span>
              </div>
              <Slider id="Effect" name="Effect" defaultValue={[effect]} max={20} step={1} onValueChange={(value) => setEffect(value[0])}/>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="Effort">Effort Score</Label>
                <span className="text-sm text-muted-foreground">{effort} / 20</span>
              </div>
              <Slider id="Effort" name="Effort" defaultValue={[effort]} max={20} step={1} onValueChange={(value) => setEffort(value[0])}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="Status">Status</Label>
                    <Select name="Status" defaultValue={task?.Status || 'ยังไม่ได้เริ่ม'}>
                        <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ยังไม่ได้เริ่ม">To Do</SelectItem>
                            <SelectItem value="กำลังดำเนินการ">In Progress</SelectItem>
                            <SelectItem value="จบงานแล้ว">Done</SelectItem>
                            <SelectItem value="หยุดงาน">Blocked</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ProjectType">Project Type <span className="text-xs text-muted-foreground">(Suggested: {suggestedType})</span></Label>
                    <Select name="ProjectType" value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                        <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Main">Main</SelectItem>
                            <SelectItem value="QuickWin">Quick Win</SelectItem>
                            <SelectItem value="Fillin">Fill-in</SelectItem>
                            <SelectItem value="Thankless">Thankless</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Assignee</Label>
                    <MultiSelectAutocomplete 
                        options={assignees} 
                        initialValue={task?.Assignee}
                        name="Assignee"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="Owner">Owner</Label>
                    <Input 
                        id="Owner" 
                        name="Owner" 
                        defaultValue={task?.Owner || ''} 
                        placeholder="e.g. Project Manager" 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                        }}
                    />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Want">Description / Want</Label>
              <Textarea id="Want" name="Want" defaultValue={task?.Want || ''} placeholder="Describe the desired outcome..." />
            </div>
          </div>
          <DialogFooter className="mt-4 sm:justify-between">
            <div>
                {isEditMode && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" size="icon" disabled={isDeletePending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this task.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeletePending}>
                                {isDeletePending ? "Deleting..." : "Continue"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <SubmitButton isEditMode={isEditMode} />
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
