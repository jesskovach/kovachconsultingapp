import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function SessionForm({ open, onClose, onSubmit, initialData, clients = [], isLoading }) {
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration: 60,
    type: "regular",
    status: "scheduled",
    notes: "",
    outcomes: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? format(new Date(initialData.date), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
    } else {
      setFormData({
        client_id: "",
        client_name: "",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duration: 60,
        type: "regular",
        status: "scheduled",
        notes: "",
        outcomes: ""
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up form data
    const cleanedData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      notes: formData.notes?.trim() || null,
      outcomes: formData.outcomes?.trim() || null
    };
    
    onSubmit(cleanedData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      client_name: client?.name || ""
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold text-slate-800">
            {initialData ? "Edit Session" : "Schedule Session"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Client *</Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="text-slate-700">Date & Time *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Duration (minutes)</Label>
                <Select value={formData.duration.toString()} onValueChange={(v) => handleChange("duration", parseInt(v))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Session Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-700">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-700">Session Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="mt-1.5 min-h-[100px]"
                placeholder="Notes from the session..."
              />
            </div>

            <div>
              <Label htmlFor="outcomes" className="text-slate-700">Outcomes & Action Items</Label>
              <Textarea
                id="outcomes"
                value={formData.outcomes}
                onChange={(e) => handleChange("outcomes", e.target.value)}
                className="mt-1.5 min-h-[100px]"
                placeholder="Key takeaways and next steps..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.client_id}
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {initialData ? "Save Changes" : "Schedule Session"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}