import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, GripVertical, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TemplateForm({ open, onClose, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    description: "",
    is_default: false,
    tasks: [
      { title: "Send welcome email", description: "", order: 1 },
      { title: "Send initial questionnaire", description: "", order: 2 },
      { title: "Schedule discovery session", description: "", order: 3 }
    ]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTask = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { title: "", description: "", order: prev.tasks.length + 1, depends_on: [] }]
    }));
  };

  const removeTask = (index) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold text-slate-800">
            {initialData ? "Edit Template" : "Create New Template"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-1.5"
                placeholder="Standard Onboarding"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="mt-1.5 min-h-[80px]"
                placeholder="Describe this template..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleChange("is_default", checked)}
              />
              <Label htmlFor="is_default" className="text-sm text-slate-700 cursor-pointer">
                Set as default template for new clients
              </Label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-slate-700">Tasks *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-5 h-5 text-slate-400 mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded px-2 py-1">
                            #{task.order}
                          </span>
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(index, "title", e.target.value)}
                            placeholder="Task title"
                            required
                            className="flex-1"
                          />
                        </div>
                        <Textarea
                          value={task.description}
                          onChange={(e) => updateTask(index, "description", e.target.value)}
                          placeholder="Task description (optional)"
                          className="min-h-[60px]"
                        />
                        {index > 0 && (
                          <div>
                            <Label className="text-xs text-slate-600 flex items-center gap-1 mb-2">
                              <Link2 className="w-3 h-3" />
                              Depends on (blocks until complete)
                            </Label>
                            <Select
                              value={task.depends_on?.length > 0 ? task.depends_on.join(",") : "none"}
                              onValueChange={(value) => {
                                const deps = value === "none" ? [] : value.split(",").map(Number);
                                updateTask(index, "depends_on", deps);
                              }}
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="No dependencies" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No dependencies</SelectItem>
                                {formData.tasks.slice(0, index).map((t, i) => (
                                  <SelectItem key={i} value={(i + 1).toString()}>
                                    Task #{i + 1}: {t.title || "Untitled"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              {initialData ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}