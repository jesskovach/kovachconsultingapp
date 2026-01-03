import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Video, Book, Wrench, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ResourceAssignmentDialog({ open, onClose, clientId, clientName }) {
  const [selectedResources, setSelectedResources] = useState([]);
  const [notes, setNotes] = useState("");
  const [requiredResources, setRequiredResources] = useState([]);
  const [onboardingStages, setOnboardingStages] = useState({});
  
  const queryClient = useQueryClient();

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-created_date"),
    enabled: open
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["resource-assignments", clientId],
    queryFn: () => base44.entities.ResourceAssignment.filter({ client_id: clientId }),
    enabled: open && !!clientId
  });

  const assignMutation = useMutation({
    mutationFn: async (resourceIds) => {
      const user = await base44.auth.me();
      const promises = resourceIds.map(resourceId =>
        base44.entities.ResourceAssignment.create({
          resource_id: resourceId,
          client_id: clientId,
          assigned_by: user.email,
          notes: notes
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
      toast.success("Resources assigned successfully");
      setSelectedResources([]);
      setNotes("");
      onClose();
    },
    onError: () => {
      toast.error("Failed to assign resources");
    }
  });

  const assignedResourceIds = assignments.map(a => a.resource_id);

  const toggleResource = (resourceId) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const toggleRequired = (resourceId) => {
    setRequiredResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const setOnboardingStage = (resourceId, stage) => {
    setOnboardingStages(prev => ({
      ...prev,
      [resourceId]: stage
    }));
  };

  const handleAssign = () => {
    if (selectedResources.length === 0) {
      toast.error("Please select at least one resource");
      return;
    }
    assignMutation.mutate(selectedResources);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'book': return <Book className="w-4 h-4" />;
      case 'tool': return <Wrench className="w-4 h-4" />;
      case 'template': return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const categoryColors = {
    leadership: "bg-violet-100 text-violet-700",
    communication: "bg-blue-100 text-blue-700",
    productivity: "bg-emerald-100 text-emerald-700",
    mindset: "bg-amber-100 text-amber-700",
    strategy: "bg-rose-100 text-rose-700",
    general: "bg-slate-100 text-slate-700"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Resources to {clientName}</DialogTitle>
          <DialogDescription>
            Select resources to assign to this client. They will be able to access them in their portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resources.map((resource) => {
              const isAssigned = assignedResourceIds.includes(resource.id);
              const isSelected = selectedResources.includes(resource.id);
              
              return (
                <div
                  key={resource.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isAssigned 
                      ? "bg-slate-50 border-slate-200 opacity-50" 
                      : isSelected
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <Checkbox
                    id={resource.id}
                    checked={isSelected}
                    onCheckedChange={() => !isAssigned && toggleResource(resource.id)}
                    disabled={isAssigned}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={resource.id}
                      className={`flex items-center gap-2 mb-1 ${isAssigned ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {getTypeIcon(resource.type)}
                      <span className="font-medium text-slate-800">{resource.title}</span>
                      {isAssigned && (
                        <Badge variant="outline" className="ml-auto">Already Assigned</Badge>
                      )}
                    </label>
                    {resource.description && (
                      <p className="text-sm text-slate-600 mb-2">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[resource.category]} variant="secondary">
                        {resource.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedResources.length > 0 && (
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note about why you're assigning these resources..."
                className="mt-1.5"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedResources.length === 0 || assignMutation.isPending}
            className="bg-slate-800 hover:bg-slate-700"
          >
            {assignMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Assign {selectedResources.length > 0 && `(${selectedResources.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}