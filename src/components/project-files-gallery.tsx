import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Image, Upload, Eye, Download, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ProjectTrackingProgress } from '@/lib/types';
import { format } from 'date-fns';
import { ImageUpload } from '@/components/ui/image-upload';
import { resizeImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { deleteProjectFile } from '@/app/actions/file-actions';

interface ProjectFilesGalleryProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
}

interface FileItem {
    url: string;
    date: string;
    taskId: string;
    trackerName: string; // The person who uploaded it
    docId: string; // Added document ID for deletion
    taskName?: string; // Optional, fetched separately if needed, or we just show date/uploader
}

export function ProjectFilesGallery({
    isOpen,
    onOpenChange,
    projectId,
    projectName,
}: ProjectFilesGalleryProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            // Query tracking logs for this project
            // Note: We might need a composite index for this query: projectId + date desc
            // For now, let's fetch basic logs.
            const q = query(
                collection(db, 'projectTrackingProgress'),
                where('projectId', '==', projectId)
                // orderBy('date', 'desc') // Requires index, add if needed later
            );

            const snapshot = await getDocs(q);
            const loadedFiles: FileItem[] = [];

            snapshot.forEach(doc => {
                const data = doc.data() as ProjectTrackingProgress;
                if (data.attachments && data.attachments.length > 0) {
                    data.attachments.forEach(url => {
                        loadedFiles.push({
                            url,
                            date: data.date,
                            taskId: data.taskId,
                            trackerName: data.trackerName || 'Unknown',
                            docId: doc.id, // Capture document ID
                        });
                    });
                }
            });

            // Sort in memory by date descending since we didn't index
            loadedFiles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setFiles(loadedFiles);
        } catch (error) {
            console.error("Error fetching project files:", error);
            toast({
                title: "Error",
                description: "Failed to load project files.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && projectId) {
            fetchFiles();
        }
    }, [isOpen, projectId]);

    const handleGalleryUpload = async (url: string, skipRefresh = false) => {
        try {
            await addDoc(collection(db, 'projectTrackingProgress'), {
                projectId,
                taskId: 'PROJECT_GALLERY_UPLOAD',
                date: new Date().toISOString().split('T')[0],
                hoursWorked: 0,
                progressPercentage: 0,
                attachments: [url],
                trackerName: 'Gallery Upload',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Increment project totalFiles
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                totalFiles: increment(1)
            });

            if (!skipRefresh) {
                toast({
                    title: "Success",
                    description: "Image uploaded to gallery.",
                });
                // Refresh list
                fetchFiles();
            }

        } catch (error) {
            console.error("Error saving gallery upload:", error);
            toast({
                title: "Error",
                description: "Failed to save upload info.",
                variant: "destructive",
            });
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank'); // Fallback
        }
    };

    const handleDelete = async (file: FileItem) => {
        if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;

        try {
            const result = await deleteProjectFile(projectId, file.url, file.docId);
            if (result.success) {
                toast({
                    title: "Deleted",
                    description: "Image deleted successfully.",
                });
                // Remove from local state
                setFiles(prev => prev.filter(f => f.url !== file.url));
                // Close preview if it was the deleted image
                if (previewImage === file.url) {
                    setPreviewImage(null);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            toast({
                title: "Error",
                description: "Failed to delete image.",
                variant: "destructive",
            });
        }
    };

    // Use a ref to track drag enter/leave events to prevent flickering
    const dragCounter = useRef(0);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Necessary to allow dropping
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return;

        // Process only images
        const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast({
                title: "Invalid file type",
                description: "Please drop image files only.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        // Parallel processing
        const uploadPromises = imageFiles.map(async (file) => {
            try {
                // Resize image
                const resizedBlob = await resizeImage(file, 1024, 0.8);
                const renamedFile = new File([resizedBlob], file.name, { type: file.type });

                const formData = new FormData();
                formData.append('file', renamedFile);
                formData.append('folder', 'project-files/gallery');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Upload failed');

                const data = await response.json();
                if (data.url) {
                    // Pass true to skip refresh for each item
                    await handleGalleryUpload(data.url, true);
                    return true; // Success
                }
                return false;
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                return false; // Failed
            }
        });

        const results = await Promise.all(uploadPromises);
        successCount = results.filter(r => r === true).length;
        failCount = results.length - successCount;

        setUploading(false);
        fetchFiles(); // Refresh once at the end

        if (successCount > 0) {
            toast({
                title: "Batch Upload Complete",
                description: `Successfully uploaded ${successCount} image(s).${failCount > 0 ? ` Failed: ${failCount}` : ''}`,
            });
        } else {
            toast({
                title: "Upload Failed",
                description: "Failed to upload dropped images.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag Overlay - Root Level */}
                {isDragging && (
                    <div className="absolute inset-0 z-[100] bg-primary/20 border-4 border-dashed border-primary/80 m-2 rounded-lg flex items-center justify-center backdrop-blur-sm pointer-events-none transition-all duration-200">
                        <div className="flex flex-col items-center text-primary animate-bounce bg-background/90 p-8 rounded-2xl shadow-2xl border border-primary/20">
                            <Upload className="h-16 w-16 mb-4" />
                            <span className="text-2xl font-bold">Drop files to Upload</span>
                            <span className="text-base text-muted-foreground mt-2">Supports multiple JPG, PNG, HEIC</span>
                        </div>
                    </div>
                )}

                {/* Batch Uploading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 z-[100] bg-background/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center bg-background p-6 rounded-xl shadow-lg border">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                            <span className="font-semibold">Uploading images...</span>
                            <span className="text-sm text-muted-foreground">Please wait</span>
                        </div>
                    </div>
                )}

                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Project Gallery: {projectName}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({files.length} images)
                        </span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Gallery for {projectName}
                    </DialogDescription>
                    <div className="flex items-center gap-2">
                        {uploading && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</span>}
                        <ImageUpload
                            onUploadComplete={handleGalleryUpload}
                            folder="project-files/gallery"
                            variant="outline"
                            label={
                                <span className="flex items-center gap-1">
                                    <Upload className="h-4 w-4" /> Upload
                                </span>
                            }
                        />
                    </div>
                </DialogHeader>

                <div className="flex-grow relative flex flex-col min-h-0">

                    <ScrollArea className="flex-grow p-6 pt-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <span className="loading loading-spinner text-primary">Loading...</span>
                            </div>
                        ) : files.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                                {files.map((file, index) => (
                                    <div key={index} className="group relative border rounded-lg overflow-hidden aspect-square bg-muted">
                                        <img
                                            src={file.url}
                                            alt={`Uploaded on ${file.date}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Overlay Info */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white text-xs font-medium truncate">{file.trackerName}</p>
                                            <p className="text-white/80 text-[10px] mb-2">{format(new Date(file.date), 'MMM d, yyyy')}</p>

                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
                                                    onClick={() => setPreviewImage(file.url)}
                                                    title="View Full Size"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
                                                    onClick={() => handleDownload(file.url, `image-${file.date}.jpg`)}
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-8 w-8 bg-red-600/60 hover:bg-red-700/80 text-white backdrop-blur-sm"
                                                    onClick={() => handleDelete(file)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Image className="h-12 w-12 mb-4 opacity-20" />
                                <p>No images uploaded for this project yet.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>

            {/* Lightbox Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center focus:outline-none" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    {previewImage && (
                        <div className="relative w-full h-full flex items-center justify-center">

                            {/* Navigation Buttons */}
                            {files.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const currentIndex = files.findIndex(f => f.url === previewImage);
                                            const prevIndex = (currentIndex - 1 + files.length) % files.length;
                                            setPreviewImage(files[prevIndex].url);
                                        }}
                                    >
                                        <ChevronLeft className="h-8 w-8" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const currentIndex = files.findIndex(f => f.url === previewImage);
                                            const nextIndex = (currentIndex + 1) % files.length;
                                            setPreviewImage(files[nextIndex].url);
                                        }}
                                    >
                                        <ChevronRight className="h-8 w-8" />
                                    </Button>
                                </>
                            )}

                            {/* Image Container */}
                            <div className="relative group" onClick={(e) => e.stopPropagation()}>
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />

                                {/* Download Button Overlay */}
                                <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md rounded-full"
                                        onClick={() => {
                                            const currentFile = files.find(f => f.url === previewImage);
                                            if (currentFile) {
                                                handleDownload(currentFile.url, `image-${currentFile.date}.jpg`);
                                            }
                                        }}
                                        title="Download"
                                    >
                                        <Download className="h-5 w-5" />
                                    </Button>

                                    {/* Delete Button */}
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-10 w-10 bg-red-600/80 hover:bg-red-700 text-white backdrop-blur-md rounded-full"
                                        onClick={() => {
                                            const currentFile = files.find(f => f.url === previewImage);
                                            if (currentFile) {
                                                handleDelete(currentFile);
                                            }
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Close Overlay (Click outside image) */}
                            <div className="absolute inset-0 -z-10" onClick={() => setPreviewImage(null)} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
