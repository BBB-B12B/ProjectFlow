'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { useRef } from 'react';
import { resizeImage } from '@/lib/image-utils';

interface ImageUploadProps {
    onUploadComplete?: (url: string) => void;
    folder?: string;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
    label?: React.ReactNode;
}

export function ImageUpload({ onUploadComplete, folder = 'uploads', className, variant = "secondary", size = "sm", label = "Browse" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // Resize image before upload
            const resizedBlob = await resizeImage(file, 1024, 0.8);
            const renamedFile = new File([resizedBlob], file.name, { type: file.type });

            const formData = new FormData();
            formData.append('file', renamedFile);
            formData.append('folder', folder);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            if (data.url) {
                toast({
                    title: 'Success',
                    description: 'Image uploaded successfully',
                });
                onUploadComplete?.(data.url);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Error',
                description: 'Failed to upload image',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                ref={fileInputRef}
            />
            <Button
                variant={variant}
                size={size}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
            >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {uploading ? 'Uploading...' : label}
            </Button>
        </div>
    );
}
