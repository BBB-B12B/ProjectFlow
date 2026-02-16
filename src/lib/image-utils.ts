/**
 * Resizes an image file to a maximum width while maintaining aspect ratio.
 * Reference: F-015 Image Optimization
 */
export async function resizeImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<Blob> {
    // Dynamic import to avoid SSR issues if used in non-browser context (though this is a client util)
    // and to ensure it only loads when needed.

    // Check for HEIC/HEIF
    let sourceFile: Blob | File = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
            console.log("Detected HEIC image, converting...");
            const heic2any = (await import('heic2any')).default;
            const converted = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9 // High quality conversion before resize
            });

            // heic2any can return a single Blob or an array of Blobs
            sourceFile = Array.isArray(converted) ? converted[0] : converted;
            console.log("HEIC conversion successful.");
        } catch (error) {
            console.error("HEIC conversion failed:", error);
            // Fallback: try to process original file, though it likely won't work in standard <img>
        }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(sourceFile);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    },
                    'image/jpeg', // Force JPEG for consistency after resize
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
