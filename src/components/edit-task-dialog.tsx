"use client";

import { useEffect, useState, useMemo } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Task, ProjectType } from "@/lib/types";
import { updateTask } from "@/app/project/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { MultiSelectAutocomplete } from "./ui/multi-select-autocomplete";

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  assignees: string[];
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>;
}

export function EditTaskDialog({ isOpen, onOpenChange, task, assignees }: EditTaskDialogProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateTask, { success: false, message: "" });
  
  const [effort, setEffort] = useState(task?.Effort || 10);
  const [effect, setEffect] = useState(task?.Effect || 10);
  const [projectType, setProjectType] = useState<ProjectType>(task?.ProjectType || 'Main');

  const suggestedType = useMemo(() => {
    const isHighEffect = effect > 10;
    const isHighEffort = effort > 10;
    if (isHighEffect && isHighEffort) return 'Main';
    if (isHighEffect && !isHighEffort) return 'QuickWin';
    if (!isHighEffect && isHighEffort) return 'Thankless';
    return 'Fillin';
  }, [effort, effect]);
  
  useEffect(() => {
    if (task) {
      setEffort(task.Effort || 10);
      setEffect(task.Effect || 10);
      setProjectType(task.ProjectType || 'Main');
    }
  }, [task]);

  useEffect(() => {
    setProjectType(suggestedType);
  }, [suggestedType]);

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success!", description: "Task has been updated." });
      onOpenChange(false);
    } else if (state.message) {
      toast({ variant: "destructive", title: "Update Failed", description: state.message });
    }
  }, [state, onOpenChange, toast]);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details of your task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="TaskName">Task Name</Label>
              <Input id="TaskName" name="TaskName" defaultValue={task.TaskName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Category">Category</Label>
              <Input id="Category" name="Category" defaultValue={task.Category} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="StartDate">Start Date</Label>
                    <Input id="StartDate" name="StartDate" type="date" defaultValue={task.StartDate} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="EndDate">End Date</Label>
                    <Input id="EndDate" name="EndDate" type="date" defaultValue={task.EndDate} />
                </div>
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
                    <Select name="Status" defaultValue={task.Status}>
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
                        initialValue={task.Assignee}
                        name="Assignee"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="Owner">Owner</Label>
                    <Input id="Owner" name="Owner" defaultValue={task.Owner} />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Want">Description / Want</Label>
              <Textarea id="Want" name="Want" defaultValue={task.Want} placeholder="Describe the desired outcome..." />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
