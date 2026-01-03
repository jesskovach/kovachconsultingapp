import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, X } from "lucide-react";

export default function ClientForm({ open, onClose, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    status: "prospect",
    pipeline_stage: "lead",
    coaching_focus: "",
    notes: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with raw data:', formData);
    
    // Clean up form data: convert empty strings to null for optional fields
    const cleanedData = {
      ...formData,
      phone: formData.phone?.trim() || null,
      company: formData.company?.trim() || null,
      role: formData.role?.trim() || null,
      coaching_focus: formData.coaching_focus?.trim() || null,
      notes: formData.notes?.trim() || null
    };
    
    // Set start_date when status changes to 'active' for the first time
    if (cleanedData.status === 'active' && (!initialData || initialData.status !== 'active') && !initialData?.start_date) {
      cleanedData.start_date = new Date().toISOString().split('T')[0];
    }
    
    console.log('Submitting cleaned data:', cleanedData);
    
    try {
      await onSubmit(cleanedData);
      console.log('onSubmit completed successfully');
    } catch (error) {
      console.error('onSubmit error:', error);
      alert(`Error: ${error.message || error}`);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold text-slate-800">
            {initialData ? "Edit Client" : "Add New Client"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-1.5"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-700">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1.5"
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-1.5"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-slate-700">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="mt-1.5"
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role" className="text-slate-700">Job Title</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="mt-1.5"
                placeholder="CEO, VP of Engineering..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Pipeline Stage</Label>
                <Select value={formData.pipeline_stage} onValueChange={(v) => handleChange("pipeline_stage", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="coaching_focus" className="text-slate-700">Coaching Focus</Label>
              <Textarea
                id="coaching_focus"
                value={formData.coaching_focus}
                onChange={(e) => handleChange("coaching_focus", e.target.value)}
                className="mt-1.5 min-h-[80px]"
                placeholder="Leadership development, communication skills..."
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-700">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="mt-1.5 min-h-[100px]"
                placeholder="Additional notes about this client..."
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
              disabled={isLoading}
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {initialData ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}