import { motion } from "framer-motion";
import { BookOpen, Video, Book, Wrench, FileText, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PortalResources({ resources }) {
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
    <div>
      <h3 className="font-semibold text-slate-800 mb-6">Curated Resources</h3>
      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <motion.a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="block bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${resource.featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                  {resource.featured ? <Star className="w-5 h-5" /> : getTypeIcon(resource.type)}
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              
              <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                {resource.title}
              </h4>
              
              {resource.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
              )}
              
              <div className="flex items-center gap-2">
                <Badge className={categoryColors[resource.category]}>
                  {resource.category}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {resource.type}
                </Badge>
              </div>
            </motion.a>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No resources available yet</p>
        </div>
      )}
    </div>
  );
}