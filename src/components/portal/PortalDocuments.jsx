import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PortalDocuments({ documents, clientId, currentUser }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
    }
  });

  const handleUpload = async () => {
    if (!file || !title) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Document.create({
        client_id: clientId,
        title,
        description,
        file_url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: currentUser.email
      });

      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
      setUploadOpen(false);
      setFile(null);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-800">Your Documents</h3>
        <Button onClick={() => setUploadOpen(true)} size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{doc.title}</h4>
                    {doc.description && (
                      <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                    )}
                    <div className="flex gap-4 text-xs text-slate-500 mt-2">
                      <span>{doc.file_name}</span>
                      {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      <span>{format(new Date(doc.created_date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {doc.uploaded_by === currentUser.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No documents uploaded yet</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setUploadOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !title || uploading}
                className="flex-1"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}