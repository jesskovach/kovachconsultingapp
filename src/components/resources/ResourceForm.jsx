import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ResourceForm({ open, onClose, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = useState(initialData || {
    title: "",
    description: "",
    type: "article",
    url: "",
    category: "general",
    tags: [],
    featured: false
  });
  const [tagInput, setTagInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    handleChange("tags", formData.tags.filter(t => t !== tag));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      handleChange("url", response.file_url);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold text-slate-800">
            {initialData ? "Edit Resource" : "Add New Resource"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-700">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="mt-1.5"
                placeholder="Resource title"
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
                placeholder="Brief description of the resource..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="mindset">Mindset</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="url" className="text-slate-700">URL or Upload File</Label>
              <div className="mt-1.5 space-y-2">
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="https://example.com/resource"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-xs text-slate-400">OR</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload File
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.mov,.avi"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags" className="text-slate-700">Tags</Label>
              <div className="mt-1.5 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag and press Enter"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured" className="text-slate-700">Featured Resource</Label>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleChange("featured", checked)}
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
              disabled={isLoading || uploadingFile}
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {initialData ? "Save Changes" : "Add Resource"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}