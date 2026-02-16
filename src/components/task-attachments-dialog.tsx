import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { X, ExternalLink, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskAttachmentsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    taskName: string;
    attachments: string[]; // List of URLs
    onAttachmentsChange: (newAttachments: string[]) => void;
    readOnly?: boolean;
}

export function TaskAttachmentsDialog({
    isOpen,
    onOpenChange,
    taskName,
    attachments,
    onAttachmentsChange,
    readOnly = false,
}: TaskAttachmentsDialogProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadComplete = (url: string) => {
        onAttachmentsChange([...attachments, url]);
        setIsUploading(false);
    };

    const handleDelete = (indexToRemove: number) => {
        onAttachmentsChange(attachments.filter((_, index) => index !== indexToRemove));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Attachments: {taskName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* List of Attachments */}
                    {attachments.length > 0 ? (
                        <ScrollArea className="h-[300px] w-full border rounded-md p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {attachments.map((url, index) => (
                                    <div key={index} className="relative group border rounded-lg overflow-hidden aspect-video bg-muted flex items-center justify-center">
                                        {/* Preview (Image) */}
                                        <img
                                            src={url}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback for non-image files if we support them later
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=File';
                                            }}
                                        />

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => window.open(url, '_blank')}
                                                title="View"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            {!readOnly && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDelete(index)}
                                                    title="Delete"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Paperclip className="h-8 w-8 mb-2 opacity-50" />
                            <p>No attachments yet.</p>
                        </div>
                    )}

                    {/* Upload Section */}
                    {!readOnly && (
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-3">Add New Attachment</h4>
                            <ImageUpload
                                onUploadComplete={handleUploadComplete}
                                folder="project-files/tasks"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
