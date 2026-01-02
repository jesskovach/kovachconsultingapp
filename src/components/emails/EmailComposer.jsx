import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function EmailComposer({ open, onClose, client }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData) => {
      const response = await base44.functions.invoke("sendClientEmail", emailData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["client-history"] });
      toast.success("Email sent successfully");
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send email");
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, name: file.name };
        })
      );
      setAttachments([...attachments, ...uploadedFiles]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setAttachments([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!client) return;

    sendEmailMutation.mutate({
      clientId: client.id,
      clientName: client.name,
      toEmail: client.email,
      subject,
      body,
      attachments
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Compose Email</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="to" className="text-slate-700">To</Label>
            <Input
              id="to"
              value={client?.email || ""}
              disabled
              className="bg-slate-50 mt-2"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-slate-700">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="body" className="text-slate-700">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[300px] mt-2"
              required
            />
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments
            </Label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              multiple
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                disabled={uploading}
                onClick={() => document.getElementById('file-upload').click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </>
                )}
              </Button>
            </label>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                    <span className="text-sm text-slate-600 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={sendEmailMutation.isPending}
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}