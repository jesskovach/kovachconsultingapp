import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DocumentViewer({ open, onClose, resource }) {
  if (!resource) return null;

  const isPDF = resource.url?.toLowerCase().includes('.pdf') || resource.url?.includes('supabase.co');
  const isDoc = resource.url?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{resource.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={resource.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-slate-50">
          {isPDF ? (
            <iframe
              src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(resource.url)}`}
              className="w-full h-full border-0"
              title={resource.title}
            />
          ) : isDoc ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-slate-600 mb-4">
                This document type requires download to view
              </p>
              <Button asChild>
                <a href={resource.url} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download {resource.title}
                </a>
              </Button>
            </div>
          ) : (
            <iframe
              src={resource.url}
              className="w-full h-full border-0"
              title={resource.title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}