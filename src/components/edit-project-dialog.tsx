"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { updateProject, getTeams, getCustomers, getCategories } from "@/app/projects/actions";
import type { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete";
import { Plus, Trash2 } from "lucide-react";
import { AddCustomerDialog } from "@/components/add-customer-dialog";
const initialState = {
  success: false,
  message: "",
};


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <LoadingButton type="submit" loading={pending}>
      Save Changes
    </LoadingButton>
  );
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
}) {
  const [state, formAction] = useActionState(updateProject, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [teams, setTeams] = useState<{ value: string; label: string; }[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string; }[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [startDate, setStartDate] = useState(project?.startDate || "");
  const [endDate, setEndDate] = useState(project?.endDate || "");
  const [links, setLinks] = useState<{ label: string; url: string }[]>(
    project?.links && project.links.length > 0
      ? project.links
      : project?.githubLink
        ? [{ label: 'GitHub', url: project.githubLink }]
        : []
  );
  // --- Presence Logic ---
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
      });
      onOpenChange(false);
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, onOpenChange, toast]);

  useEffect(() => {
    if (isOpen) {
      getTeams().then(setTeams);
      getCategories().then(setCategories);
      getCustomers().then(setCustomers);

      if (project) {
        setStartDate(project.startDate);
        setEndDate(project.endDate);
        setLinks(
          project.links && project.links.length > 0
            ? project.links
            : project.githubLink
              ? [{ label: 'GitHub', url: project.githubLink }]
              : []
        );
      }
    }
  }, [isOpen, project]);

  const refreshCustomers = async () => {
    const updatedCustomers = await getCustomers();
    setCustomers(updatedCustomers);
  };
  const [isLockedByOther, setIsLockedByOther] = useState<{ isLocked: boolean; user?: string }>({ isLocked: false });

  // 1. Get Current User
  useEffect(() => {
    // Dynamically import firebase to ensure it's client-side ONLY
    import("@/lib/firebase").then(({ app }) => {
      if (app) {
        import("firebase/auth").then(({ getAuth, onAuthStateChanged }) => {
          const auth = getAuth(app);
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
          });
          // Note: Cleaner might be tricky with async import in useEffect, but this is okay for now.
        });
      }
    });
  }, []);

  // 2. Handle Locking (Read & Write)
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const handlePresence = async () => {
      if (!isOpen || !project || !currentUser) return;

      const { db } = await import("@/lib/firebase"); // Lazy load db
      if (!db) return;

      const { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");
      const presenceRef = doc(db, "presence", project.id);

      // Listen for Lock Status
      unsubscribeSnapshot = onSnapshot(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.userId !== currentUser.uid) {
            // Locked by someone else
            setIsLockedByOther({ isLocked: true, user: data.userName });
          } else {
            // Locked by me (safe)
            setIsLockedByOther({ isLocked: false });
          }
        } else {
          // No lock exists -> Claim it!
          setIsLockedByOther({ isLocked: false });
          setDoc(presenceRef, {
            projectId: project.id,
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email || "Anonymous",
            photoURL: currentUser.photoURL,
            lastSeen: serverTimestamp(),
          }).catch(console.error);
        }
      });
    };

    handlePresence();

    // Cleanup: Remove lock if I own it
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();

      // Optimistic Cleanup (Fire & Forget)
      if (project && currentUser && !isLockedByOther.isLocked) {
        import("@/lib/firebase").then(async ({ db }) => {
          if (db) {
            const { doc, deleteDoc, getDoc } = await import("firebase/firestore");
            const presenceRef = doc(db, "presence", project.id);
            // Verify ownership before delete to be safe (optional but good)
            // Here we just try delete based on assumption we owned it if !isLockedByOther
            try {
              const snap = await getDoc(presenceRef);
              if (snap.exists() && snap.data().userId === currentUser.uid) {
                await deleteDoc(presenceRef);
              }
            } catch (e) { console.error("Error releasing lock", e); }
          }
        });
      }
    };
  }, [isOpen, project, currentUser]); // Removing isLockedByOther from partial dependency to avoid loops

  const addLink = () => {
    setLinks([...links, { label: 'GitHub', url: '' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              {isLockedByOther.isLocked ? (
                <span className="text-red-500 font-bold flex items-center gap-2">
                  Locked by {isLockedByOther.user} (Read Only)
                </span>
              ) : (
                "Make changes to your project here. Click save when you're done."
              )}
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={isLockedByOther.isLocked} className="group">
            <form ref={formRef} action={formAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <div className="grid gap-4 py-4 group-disabled:opacity-50">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" defaultValue={project.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={project.description} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <SingleSelectAutocomplete
                    key={`cat-${project.id}`}
                    options={categories}
                    placeholder="Select or create a category..."
                    name="category"
                    initialValue={project.category}
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
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} disabled={isLockedByOther.isLocked}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addLink} className="mt-1" disabled={isLockedByOther.isLocked}>
                    <Plus className="h-4 w-4 mr-1" /> Add Link
                  </Button>
                  <input type="hidden" name="links" value={JSON.stringify(links)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <SingleSelectAutocomplete
                    key={project.id}
                    options={teams}
                    placeholder="Select or create a team..."
                    name="team"
                    initialValue={project.team}
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
                        initialValue={(project as any).customerId || project.owner}
                      />
                    </div>
                    <Button type="button" size="icon" variant="outline" onClick={() => setIsAddCustomerOpen(true)} disabled={isLockedByOther.isLocked}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date
                    <span className="ml-2 text-xs text-muted-foreground font-normal">(Derived from Tasks)</span>
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate}
                    disabled={true}
                    className="bg-muted text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date
                    <span className="ml-2 text-xs text-muted-foreground font-normal">(Derived from Tasks)</span>
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={endDate}
                    disabled={true}
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              </div >
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                {!isLockedByOther.isLocked && <SubmitButton />}
              </DialogFooter>
            </form >
          </fieldset >
        </DialogContent >
      </Dialog >
      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onSuccess={refreshCustomers}
      />
    </>
  );
}
