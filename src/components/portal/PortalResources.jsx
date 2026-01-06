import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Video, Book, Wrench, FileText, ExternalLink, Star, Search, Filter, AlertCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DocumentViewer from "@/components/resources/DocumentViewer";

export default function PortalResources({ resources, clientId }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [viewingResource, setViewingResource] = useState(null);
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
      {/* How I Work Section */}
      <div className="mb-8 bg-white rounded-xl border border-slate-100 overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-i-work" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">How I Work</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6 text-slate-700">
                <p className="leading-relaxed">
                  My work centers people who are navigating complexity from the margins—including those who are queer, neurodivergent, disabled, chronically burned out, or operating within systems that do not account for their full humanity.
                </p>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">In our work together, I commit to:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Treating your lived experience as valid data, not something to be minimized or corrected</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Working at the level of systems, power, and patterns rather than personal blame</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Naming misalignment and harm honestly, even when it is uncomfortable</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Respecting capacity, access needs, and constraints as real and non-negotiable</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Creating space for clarity without urgency or forced optimism</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Being transparent about what I can and cannot offer</span></li>
                  </ul>
                </div>

                <p className="font-medium text-slate-800">
                  This work is not about fixing people. It is about helping people understand the environments they are in—and reclaim agency where it is possible.
                </p>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Who This Work Is For</h4>
                  <p className="mb-3">This work is especially supportive for people who:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Feel chronically out of step with institutional expectations</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Are carrying disproportionate responsibility or emotional labor</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Have been labeled "too much," "too sensitive," or "not a fit"</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Are navigating leadership, professional, or civic roles without adequate structural support</span></li>
                    <li className="flex gap-2"><span className="text-violet-600 font-bold">•</span><span>Want clarity without being flattened or coached into compliance</span></li>
                  </ul>
                  <p className="mt-3 italic">You do not need to justify why something feels hard here.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Terms of Engagement</h4>
                  <p className="text-sm">
                    Kovach Consulting Group provides coaching, advisory, and sense-making services. This work is not legal, medical, mental health, or financial advice, and it does not replace services provided by licensed professionals. Clients remain responsible for their own decisions, actions, and outcomes. Sessions are collaborative and exploratory—the goal is not to resolve everything at once, but to create conditions for understanding, interpretation, and thoughtful action.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Confidentiality & Boundaries</h4>
                  <p className="text-sm">
                    Information shared during sessions is treated as confidential to the extent reasonably possible. This work is professional and bounded. While it may touch on personal experience and systemic harm, it is not therapy and does not include crisis or emergency support.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">What to Expect</h4>
                  <p className="text-sm mb-2 font-medium">This work prioritizes clarity over speed.</p>
                  <p className="text-sm">
                    Sessions may involve reflection, reframing, pattern recognition, and naming constraints rather than advice or instruction. You are not expected to arrive with polished answers or a plan. Curiosity, honesty, and a willingness to slow down are enough.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Medical & Mental Health Boundaries</h4>
                  <p className="text-sm">
                    Kovach Consulting Group does not provide medical, mental health, or clinical services. I do not diagnose conditions, assess medical risk, or offer treatment recommendations. If a situation arises that appears medically or psychologically concerning, I will name that boundary clearly and encourage the client to seek support from an appropriately licensed professional. Responsibility for seeking and receiving such care rests solely with the client.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

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
                  setViewingResource={setViewingResource}
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
                  setViewingResource={setViewingResource}
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

      <DocumentViewer
        open={!!viewingResource}
        onClose={() => setViewingResource(null)}
        resource={viewingResource}
      />
    </div>
  );
}

function ResourceCard({ resource, assignment, index, categoryColors, getTypeIcon, handleResourceClick, setViewingResource, isRequired }) {
  const isFile = resource.url?.includes('supabase.co') || 
                resource.url?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i);

  const handleClick = (e) => {
    handleResourceClick(resource.id);
    if (isFile) {
      e.preventDefault();
      setViewingResource(resource);
    }
  };

  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
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