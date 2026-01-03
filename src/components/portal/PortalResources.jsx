import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Video, Book, Wrench, FileText, ExternalLink, Star, Search, Filter, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PortalResources({ resources, clientId }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["resource-assignments", clientId],
    queryFn: () => base44.entities.ResourceAssignment.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const markViewedMutation = useMutation({
    mutationFn: (assignmentId) => 
      base44.entities.ResourceAssignment.update(assignmentId, {
        viewed: true,
        viewed_date: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
    }
  });

  const handleResourceClick = (resourceId) => {
    const assignment = assignments.find(a => a.resource_id === resourceId);
    if (assignment && !assignment.viewed) {
      markViewedMutation.mutate(assignment.id);
    }
  };

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

  // Get all unique tags from resources
  const allTags = [...new Set(resources.flatMap(r => r.tags || []))];

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title?.toLowerCase().includes(search.toLowerCase()) ||
      resource.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    const matchesTag = !tagFilter || resource.tags?.includes(tagFilter);
    return matchesSearch && matchesCategory && matchesType && matchesTag;
  });

  // Group resources by required vs optional
  const requiredResources = filteredResources.filter(r => {
    const assignment = assignments.find(a => a.resource_id === r.id);
    return assignment?.required;
  });
  const optionalResources = filteredResources.filter(r => {
    const assignment = assignments.find(a => a.resource_id === r.id);
    return !assignment?.required;
  });

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-6">Curated Resources</h3>

      {/* Search and Filters */}
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
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="template">Template</SelectItem>
              </SelectContent>
            </Select>
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Required Resources */}
      {requiredResources.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-slate-800">Required Resources</h4>
            <Badge className="bg-red-100 text-red-700">
              {requiredResources.filter(r => {
                const assignment = assignments.find(a => a.resource_id === r.id);
                return !assignment?.viewed;
              }).length} Pending
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredResources.map((resource, index) => {
              const assignment = assignments.find(a => a.resource_id === resource.id);
              return (
                <ResourceCard 
                  key={resource.id}
                  resource={resource}
                  assignment={assignment}
                  index={index}
                  categoryColors={categoryColors}
                  getTypeIcon={getTypeIcon}
                  handleResourceClick={handleResourceClick}
                  isRequired
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Resources */}
      {optionalResources.length > 0 ? (
        <div>
          {requiredResources.length > 0 && (
            <h4 className="font-semibold text-slate-800 mb-4">Additional Resources</h4>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalResources.map((resource, index) => {
              const assignment = assignments.find(a => a.resource_id === resource.id);
              return (
                <ResourceCard 
                  key={resource.id}
                  resource={resource}
                  assignment={assignment}
                  index={index + requiredResources.length}
                  categoryColors={categoryColors}
                  getTypeIcon={getTypeIcon}
                  handleResourceClick={handleResourceClick}
                />
              );
            })}
          </div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No resources match your filters</p>
        </div>
      ) : null}

      {resources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No resources available yet</p>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource, assignment, index, categoryColors, getTypeIcon, handleResourceClick, isRequired }) {
  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => handleResourceClick(resource.id)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`block bg-white rounded-xl border p-5 hover:shadow-lg transition-all group relative ${
        isRequired 
          ? assignment?.viewed 
            ? 'border-emerald-200 bg-emerald-50/30' 
            : 'border-red-200 bg-red-50/30'
          : 'border-slate-100'
      }`}
    >
      {isRequired && (
        <div className="absolute top-3 right-3">
          <Badge className={assignment?.viewed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
            {assignment?.viewed ? "Completed" : "Required"}
          </Badge>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${resource.featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
          {resource.featured ? <Star className="w-5 h-5" /> : getTypeIcon(resource.type)}
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
      
      <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors pr-20">
        {resource.title}
      </h4>
      
      {resource.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
      )}
      
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={categoryColors[resource.category]}>
          {resource.category}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {resource.type}
        </Badge>
        {resource.tags?.slice(0, 2).map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {resource.tags?.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{resource.tags.length - 2} more
          </Badge>
        )}
      </div>

      {assignment?.onboarding_stage && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 capitalize">
            📋 {assignment.onboarding_stage.replace('_', ' ')} stage
          </span>
        </div>
      )}
    </motion.a>
  );
}