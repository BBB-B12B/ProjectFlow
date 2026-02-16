import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number
}

export function Spinner({ className, size = 24, ...props }: SpinnerProps) {
    return (
        <div
            className={cn("animate-spin text-primary", className)}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    )
}
