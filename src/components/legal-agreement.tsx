"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LegalAgreementProps {
    title: string
    content: string
    isChecked: boolean
    onAccept: (checked: boolean) => void
    id: string
}

export function LegalAgreement({
    title,
    content,
    isChecked,
    onAccept,
    id,
}: LegalAgreementProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/50">
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                        {content}
                    </div>
                </ScrollArea>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={id}
                        checked={isChecked}
                        onCheckedChange={(checked) => onAccept(checked as boolean)}
                    />
                    <Label
                        htmlFor={id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                    >
                        I have read and agree to the {title}
                    </Label>
                </div>
            </CardContent>
        </Card>
    )
}
