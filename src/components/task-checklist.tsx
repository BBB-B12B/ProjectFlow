"use client";

import { useState, useTransition, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Loader2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task, ChecklistItem } from '@/lib/types';
import { saveChecklist } from '@/app/project/[id]/actions';
import { Badge } from '@/components/ui/badge';

interface TaskChecklistProps {
    task: Task;
}

export function TaskChecklist({ task }: TaskChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(task.checklist || []);
    const [newItemText, setNewItemText] = useState("");
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    // Sync state with props (Important for Real-time)
    useEffect(() => {
        setItems(task.checklist || []);
    }, [task.checklist]);

    // Calculate progress
    const total = items.length;
    const completed = items.filter(i => i.isCompleted).length;

    const handleSave = (newItems: ChecklistItem[]) => {
        setItems(newItems); // Optimistic update
        startTransition(async () => {
            const result = await saveChecklist(task.id, newItems);
            if (!result.success) {
                console.error("Failed to save checklist:", result.message);
                // Revert optimistic update? Or just warn?
                // For now, let's warn. Ideally revert or retry.
                alert(`Failed to save: ${result.message}`); // Simple alert for now to ensure visibility
            }
        });
    };

    const addItem = () => {
        if (!newItemText.trim()) return;
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: newItemText.trim(),
            isCompleted: false
        };
        const newItems = [...items, newItem];
        setNewItemText("");
        handleSave(newItems);
    };

    const toggleItem = (id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        );
        handleSave(newItems);
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        handleSave(newItems);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
                    <ListTodo className="w-3.5 h-3.5" />
                    {total > 0 ? (
                        <span>{completed}/{total}</span>
                    ) : (
                        <span>Checklist</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start" onPointerDownOutside={(e) => e.stopPropagation()} onInteractOutside={(e) => e.stopPropagation()}>
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Checklist</h4>
                        <span className="text-xs text-muted-foreground">{completed}/{total} Completed</span>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {items.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-2">No items yet.</p>
                        )}
                        {items.map((item) => (
                            <div key={item.id} className="flex items-start gap-2 group">
                                <Checkbox
                                    id={item.id}
                                    checked={item.isCompleted}
                                    onCheckedChange={() => toggleItem(item.id)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <label
                                        htmlFor={item.id}
                                        className={`text-sm leading-tight cursor-pointer ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                                    >
                                        {item.text}
                                    </label>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteItem(item.id)}
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                        <Input
                            placeholder="Add item..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            className="h-8 text-sm"
                        />
                        <Button size="icon" className="h-8 w-8" onClick={addItem} disabled={!newItemText.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {isPending && (
                        <div className="flex items-center justify-center pt-1">
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
