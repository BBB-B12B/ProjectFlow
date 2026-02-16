import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2">
                <Spinner size={48} className="text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
