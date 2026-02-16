"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { createProject, getTeams, getCustomers, getCategories } from "@/app/projects/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete";
import { Loader2, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { AddCustomerDialog } from "@/components/add-customer-dialog";


const initialState = {
  success: false,
  message: "",
};


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <LoadingButton type="submit" loading={pending}>
      Create Project
    </LoadingButton>
  );
}

import { useTheme } from "next-themes";

// ... (existing imports)

export function NewProjectDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [state, formAction] = useActionState(createProject, initialState);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme(); // Use resolvedTheme to handle 'system' correctly
  const formRef = useRef<HTMLFormElement>(null);
  const [teams, setTeams] = useState<{ value: string; label: string; }[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; }[]>([]);
  const [allCustomers, setAllCustomers] = useState<{ value: string; label: string; isDarkModeOnly: boolean }[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      getTeams().then(setTeams);
      getCategories().then(setCategories);
      getCustomers().then((data) => setAllCustomers(data as any)); // Type assertion just in case, actions ts update propagated
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setLinks([]);
      setIsFormDirty(false);
    }
  }, [isOpen]);

  // Derived state for filtered customers based on theme
  const customers = allCustomers.filter(c => {
    // T-075 Logic: Dark = OS (isDarkModeOnly=true), Light = Standard (isDarkModeOnly=false)
    if (resolvedTheme === 'dark') {
      return c.isDarkModeOnly === true;
    } else {
      // Light (or other) -> Standard
      return !c.isDarkModeOnly;
    }
  });

  const refreshCustomers = async () => {
    const updatedCustomers = await getCustomers();
    setAllCustomers(updatedCustomers as any);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
    setIsFormDirty(true);
  };

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
      });
      onOpenChange(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onOpenChange]);

  const handleCloseDialog = () => {
    if (isFormDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { label: 'GitHub', url: '' }]);
    setIsFormDirty(true);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
    setIsFormDirty(true);
  };

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
    setIsFormDirty(true);
  };

  const formActionWithLinks = async (formData: FormData) => {
    // Append links as JSON string (or however your server allows arrays, but FormData is flat usually)
    // BUT wait, server actions can handle complex data if we invoke it directly or serialize it.
    // Trick: FormData doesn't support arrays natively well for server actions without dot notation or repeated keys.
    // EASIER: Just submit form normally but hijack the action call to modify FormData?
    // OR: Use hidden inputs for the array.

    links.forEach((link, index) => {
      formData.append(`links[${index}][label]`, link.label);
      formData.append(`links[${index}][url]`, link.url);
    });
    // Wait, Zod (formData) parsing usually expects repeated keys or bracket notation.
    // Let's standard Zod way: pass object directly if not using strict formData only.
    // But useActionState expects `(state, formData) => ...`
    // Let's use hidden inputs. It's the cleanest for simple forms without changing action signature deeply.

    // Actually, let's just use the `bind` or manual invoke. 
    // BUT simpler: Iterate and append to a new FormData object or just use hidden fields in the JSX.
    return formAction(formData);
  };

  // Actually, actions.ts expects standardized formData. Zod's .parse(Object.fromEntries(formData)) flattens inputs!
  // Object.fromEntries takes LAST value for same key. It does NOT handle arrays or `links[0][label]`.
  // WE NEED TO MODIFY actions.ts to parse complex index keys OR send JSON string.
  // Plan Modification: Send `links` as a JSON string in a hidden input is safest and easiest.

  console.log("Teams data being passed to SingleSelectAutocomplete:", teams);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        } else {
          onOpenChange(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the details for your new project. Click create when you're done.
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={formAction}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" placeholder="e.g. Website Redesign" required onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="A brief description of the project..." onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <SingleSelectAutocomplete
                  options={categories}
                  placeholder="Select or create a category..."
                  name="category"
                  onValueChange={() => setIsFormDirty(true)}
                />
              </div>
              <div className="space-y-2">
                <Label>External Links</Label>
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center mb-2">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateLink(index, 'label', e.target.value)}
                      className="w-1/3"
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addLink} className="mt-1">
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
                {/* Hidden Input to serialize links for Server Action */}
                {/* We need to modify actions.ts to parsing JSON string for 'links' if we do this. */}
                {/* Let's try the Zod-friendly approach: sending strict valid repeated keys? No, Zod-from-FormData is tricky. */}
                {/* Best approach: Send JSON string "links_json" and parse it in action. */}
                <input type="hidden" name="links" value={JSON.stringify(links)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <SingleSelectAutocomplete
                  options={teams}
                  placeholder="Select or create a team..."
                  name="team"
                  onValueChange={() => setIsFormDirty(true)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner (Customer)</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SingleSelectAutocomplete
                      options={customers}
                      placeholder="Select or create a customer..."
                      name="owner"
                      onValueChange={() => setIsFormDirty(true)}
                    />
                  </div>
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsAddCustomerOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskName">First Task Name</Label>
                <Input id="taskName" name="taskName" placeholder="e.g. Project setup" required onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" value={startDate} onChange={handleStartDateChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setIsFormDirty(true); }} min={startDate} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog >
      <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onSuccess={refreshCustomers}
      />
    </>
  );
}
