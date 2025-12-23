export function GridBackground() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
            <div className="absolute h-full w-full bg-background [background:radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:[background:radial-gradient(#1f2937_1px,transparent_1px)]"></div>
        </div>
    )
}
