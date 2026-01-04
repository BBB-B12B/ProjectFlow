"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LegalAgreement } from "@/components/legal-agreement"
import { useToast } from "@/hooks/use-toast"

export function ApplicationForm() {
    const [isTransportAccepted, setIsTransportAccepted] = useState(false)
    const [isGuarantorAccepted, setIsGuarantorAccepted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async () => {
        if (!isTransportAccepted || !isGuarantorAccepted) {
            return
        }

        setIsSubmitting(true)

        try {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1500))

            toast({
                title: "Application Submitted",
                description: "Both agreements have been accepted and recorded.",
            })

            // Reset form (optional)
            setIsTransportAccepted(false)
            setIsGuarantorAccepted(false)

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Please try again later.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const transportContent = `TRANSPORT SERVICE AGREEMENT

1. DEFINITIONS
"Carrier" means the transport service provider.
"Shipper" means the entity requesting transport.

2. SCOPE OF SERVICE
The Carrier agrees to transport goods as specified in the service order. The Shipper guarantees that goods are packed suitably for transport.

3. LIABILITY
The Carrier shall not be liable for loss or damage arising from force majeure, inherent vice of the goods, or insufficient packing.

4. PAYMENT TERMS
Payment is due within 30 days of invoice date unless otherwise agreed in writing.

5. GOVERNING LAW
This agreement shall be governed by the laws of the local jurisdiction.
`

    const guarantorContent = `GUARANTOR AGREEMENT

1. GUARANTEE
The Guarantor hereby irrevocably and unconditionally guarantees the prompt and complete payment of all obligations due by the Principal Debtor.

2. NATURE OF GUARANTEE
This is a continuing guarantee and shall remain in full force until all obligations are satisfied.

3. WAIVER
The Guarantor waives presentment, demand, protest, and notice of non-payment.

4. INDEMNITY
The Guarantor shall indemnify the Creditor against all losses, costs, and expenses arising from the Principal Debtor's default.
`

    return (
        <div className="space-y-8 max-w-3xl mx-auto p-6 bg-card rounded-lg shadow-sm border">
            <div className="space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Driver Application</h1>
                <p className="text-muted-foreground text-lg">
                    Please review and accept the required legal agreements below to proceed with your application.
                </p>
            </div>

            <div className="grid gap-6">
                <LegalAgreement
                    id="transport-agreement"
                    title="Transport Agreement"
                    content={transportContent}
                    isChecked={isTransportAccepted}
                    onAccept={setIsTransportAccepted}
                />

                <LegalAgreement
                    id="guarantor-agreement"
                    title="Guarantor Agreement"
                    content={guarantorContent}
                    isChecked={isGuarantorAccepted}
                    onAccept={setIsGuarantorAccepted}
                />
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
                <Button
                    onClick={handleSubmit}
                    disabled={!isTransportAccepted || !isGuarantorAccepted || isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                </Button>
            </div>
        </div>
    )
}
