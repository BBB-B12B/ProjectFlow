"use client";

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
import { doc, setDoc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";
import { getAnonymousUser } from "@/lib/anonymous-animals";

interface TaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: Task | null;
  projectId: string;
  assignees: string[];
}

const initialFormData = {
    TaskName: '',
    Category: '',
    StartDate: new Date().toISOString().split('T')[0],
    EndDate: new Date().toISOString().split('T')[0],
    Progress: 0,
    Effect: 5,
    Effort: 5,
    Status: 'ยังไม่ได้เริ่ม',
    ProjectType: 'Main' as ProjectType,
    Assignee: '',
    Owner: '',
    Want: '',
};

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
  const [currentUser] = useState(getAnonymousUser());

  const [formData, setFormData] = useState(initialFormData);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  useEffect(() => {
    if (isEditMode && task?.id) {
        const presenceRef = doc(db, 'presence', task.id);
        if (isOpen) {
            const editorData = {
                userName: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                lastSeen: serverTimestamp(),
            };
            setDoc(presenceRef, { editors: { [currentUser.id]: editorData } }, { merge: true })
                .catch(console.error);

            return () => {
                updateDoc(presenceRef, {
                    [`editors.${currentUser.id}`]: deleteField()
                }).catch(console.error);
            };
        }
    }
  }, [isOpen, task, isEditMode, currentUser]);

  const suggestedType = useMemo(() => {
    const isHighEffect = formData.Effect > 5;
    const isHighEffort = formData.Effort > 5;
    if (isHighEffect && isHighEffort) return 'Main';
    if (isHighEffect && !isHighEffort) return 'QuickWin';
    if (!isHighEffect && isHighEffort) return 'Thankless';
    return 'Fillin';
  }, [formData.Effort, formData.Effect]);
  
  // Effect hook for initializing formData when the dialog opens or task changes
  useEffect(() => {
    if (isOpen) {
        setIsDirty(false); // Reset dirty state when opening
        if (task) {
          setFormData({
            TaskName: task.TaskName ?? '',
            Category: task.Category ?? '',
            StartDate: task.StartDate ?? '',
            EndDate: task.EndDate ?? '',
            Progress: task.Progress ?? 0,
            Effect: task.Effect ?? 5,
            Effort: task.Effort ?? 5,
            Status: task.Status ?? 'ยังไม่ได้เริ่ม',
            ProjectType: task.ProjectType ?? 'Main',
            Assignee: task.Assignee?.name ?? '',
            Owner: task.Owner ?? '',
            Want: task.Want ?? '',
          });
        } else {
          setFormData(initialFormData); // Initial state for new tasks
        }
    }
  }, [task, isOpen]);

  // Effect hook for automatically setting ProjectType based on suggestedType for both new and existing tasks
  useEffect(() => {
    if (isOpen) {
        setFormData(prev => ({...prev, ProjectType: suggestedType}));
    }
  }, [suggestedType, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSliderChange = (name: 'Progress' | 'Effect' | 'Effort') => (value: number[]) => {
    setFormData(prev => ({ ...prev, [name]: value[0] }));
    setIsDirty(true);
  };

  const handleSelectChange = (name: 'Status' | 'ProjectType') => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as ProjectType | 'ยังไม่ได้เริ่ม' | 'กำลังดำเนินการ' | 'จบงานแล้ว' | 'หยุดงาน' }));
    setIsDirty(true);
  };
  
  const handleMultiSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, Assignee: value }));
    setIsDirty(true);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setFormData(prev => ({
        ...prev,
        StartDate: newStartDate,
        EndDate: (newStartDate && prev.EndDate && newStartDate > prev.EndDate) ? newStartDate : prev.EndDate,
    }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success!", description: `Task has been ${isEditMode ? 'updated' : 'created'}.` });
      setIsDirty(false);
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

  const handleCloseAttempt = (open: boolean) => {
    if (!open) { // Dialog is attempting to close
      if (isDirty) {
          setIsConfirmCloseOpen(true);
      } else {
          setFormData(initialFormData); // Reset form data when closing without unsaved changes
          onOpenChange(false);
      }
    }
  };

  const confirmClose = () => {
    setIsDirty(false);
    setFormData(initialFormData); // Reset form data when changes are discarded
    onOpenChange(false);
    setIsConfirmCloseOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
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
                <Input id="TaskName" name="TaskName" value={formData.TaskName} onChange={handleInputChange} placeholder="e.g. Design new homepage mockups" required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="Category">Category</Label>
                <Input id="Category" name="Category" value={formData.Category} onChange={handleInputChange} placeholder="e.g. Design" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="StartDate">Start Date</Label>
                      <Input id="StartDate" name="StartDate" type="date" value={formData.StartDate} onChange={handleStartDateChange} required/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="EndDate">End Date</Label>
                      <Input id="EndDate" name="EndDate" type="date" value={formData.EndDate} onChange={handleInputChange} min={formData.StartDate} required/>
                  </div>
              </div>
              <div className="space-y-2">
                  <div className="flex justify-between">
                  <Label htmlFor="Progress">Progress</Label>
                  <span className="text-sm text-muted-foreground">{formData.Progress}%</span>
                  </div>
                  <Slider id="Progress" name="Progress" value={[formData.Progress]} max={100} step={1} onValueChange={handleSliderChange('Progress')} />
              </div>
               <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="Effect">Effect Score</Label>
                  <span className="text-sm text-muted-foreground">{formData.Effect} / 10</span>
                </div>
                <Slider id="Effect" name="Effect" value={[formData.Effect]} max={10} step={1} onValueChange={handleSliderChange('Effect')}/>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="Effort">Effort Score</Label>
                  <span className="text-sm text-muted-foreground">{formData.Effort} / 10</span>
                </div>
                <Slider id="Effort" name="Effort" value={[formData.Effort]} max={10} step={1} onValueChange={handleSliderChange('Effort')}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="Status">Status</Label>
                      <Select name="Status" value={formData.Status} onValueChange={handleSelectChange('Status')}>
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
                      <Label htmlFor="ProjectType">Project Type</Label>
                      <Select name="ProjectType" value={formData.ProjectType} onValueChange={handleSelectChange('ProjectType')}>
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
                          initialValue={formData.Assignee}
                          name="Assignee"
                          onValueChange={handleMultiSelectChange}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="Owner">Owner</Label>
                      <Input 
                          id="Owner" 
                          name="Owner" 
                          value={formData.Owner} 
                          onChange={handleInputChange}
                          placeholder="e.g. Project Manager" 
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') e.preventDefault();
                          }}
                      />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="Want">Description / Want</Label>
                <Textarea id="Want" name="Want" value={formData.Want} onChange={handleInputChange} placeholder="Describe the desired outcome..." />
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
                  <Button type="button" variant="ghost" onClick={() => handleCloseAttempt(false)}>Cancel</Button>
                  <SubmitButton isEditMode={isEditMode} />
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                      You have unsaved changes. Are you sure you want to discard them?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Stay</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmClose}>Discard</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
