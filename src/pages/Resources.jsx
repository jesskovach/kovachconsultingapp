import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, BookOpen, Video, Book, Wrench, FileText, ExternalLink, Star, Edit2, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResourceForm from "@/components/resources/ResourceForm";
import { toast } from "sonner";
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

export default function Resources() {
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setShowForm(false);
      toast.success("Resource added successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to add resource: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Resource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setShowForm(false);
      setEditingResource(null);
      toast.success("Resource updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setDeleteDialog({ open: false, id: null });
    }
  });

  const handleSubmit = (data) => {
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = 
      resource.title?.toLowerCase().includes(search.toLowerCase()) ||
      resource.description?.toLowerCase().includes(search.toLowerCase()) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'book': return <Book className="w-5 h-5" />;
      case 'tool': return <Wrench className="w-5 h-5" />;
      case 'template': return <FileText className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Resources Library</h1>
            <p className="text-slate-500 mt-1">Manage coaching resources and materials</p>
          </div>
          <Button 
            onClick={() => {
              setEditingResource(null);
              setShowForm(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="book">Books</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredResources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${resource.featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                      {resource.featured ? <Star className="w-5 h-5" /> : getTypeIcon(resource.type)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingResource(resource);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteDialog({ open: true, id: resource.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mb-2">
                    {resource.title}
                  </h4>
                  
                  {resource.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge className={categoryColors[resource.category]}>
                      {resource.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {resource.type}
                    </Badge>
                  </div>

                  {resource.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {resource.url.includes('supabase.co') || resource.url.includes('.pdf') || resource.url.includes('.doc') ? 'Open File' : 'View Resource'}
                    </a>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No resources found</h3>
            <p className="text-slate-500 mb-4">
              {search || typeFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by adding your first resource"}
            </p>
            {!search && typeFilter === "all" && categoryFilter === "all" && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            )}
          </div>
        )}
      </div>

      <ResourceForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingResource(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingResource}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deleteDialog.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}