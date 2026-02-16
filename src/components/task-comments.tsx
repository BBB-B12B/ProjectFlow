"use client";

import { useState, useTransition, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, TaskComment } from '@/lib/types';
import { saveComment } from '@/app/project/[id]/actions';
import { formatDistanceToNow } from 'date-fns';
import { getAnonymousUser } from '@/lib/anonymous-animals';

interface TaskCommentsProps {
    task: Task;
}

export function TaskComments({ task }: TaskCommentsProps) {
    // Local state for optimistic updates
    const [comments, setComments] = useState<TaskComment[]>(task.comments || []);
    const [newCommentText, setNewCommentText] = useState("");
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync with props when they change (e.g. real-time update or refresh)
    useEffect(() => {
        setComments(task.comments || []);
    }, [task.comments]);

    const handleSend = () => {
        if (!newCommentText.trim()) return;

        const currentUser = getAnonymousUser();

        const optimisitcComment: TaskComment = {
            id: crypto.randomUUID(),
            text: newCommentText.trim(),
            createdAt: new Date().toISOString(),
            createdBy: {
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl
            }
        };

        const newComments = [...comments, optimisitcComment];
        setComments(newComments);
        setNewCommentText("");

        // Scroll to bottom
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);

        startTransition(async () => {
            await saveComment(task.id, {
                text: optimisitcComment.text,
                createdBy: optimisitcComment.createdBy
            });
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {comments.length > 0 ? (
                        <span>{comments.length}</span>
                    ) : (
                        <span>Comment</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start" onPointerDownOutside={(e) => e.stopPropagation()} onInteractOutside={(e) => e.stopPropagation()}>
                <div className="flex flex-col h-[300px]" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b flex items-center justify-between">
                        <h4 className="font-medium leading-none">Comments</h4>
                        <span className="text-xs text-muted-foreground">{comments.length} messages</span>
                    </div>

                    <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                        {comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-8">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No comments yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-2 text-sm">
                                        <Avatar className="w-6 h-6 border">
                                            <AvatarImage src={comment.createdBy.avatarUrl} />
                                            <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-xs">{comment.createdBy.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-foreground/90 leading-relaxed bg-muted/50 p-2 rounded-md rounded-tl-none">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-3 border-t bg-muted/10">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Write a comment..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="h-8 text-sm"
                            />
                            <Button
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={handleSend}
                                disabled={!newCommentText.trim() || isPending}
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
