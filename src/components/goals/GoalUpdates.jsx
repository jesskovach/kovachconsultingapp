import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Send, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function GoalUpdates({ goal }) {
  const [comment, setComment] = useState("");
  const [progressUpdate, setProgressUpdate] = useState(goal.progress.toString());
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const addUpdateMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      const newUpdate = {
        date: new Date().toISOString(),
        author: user.email,
        author_name: user.full_name,
        comment,
        progress_snapshot: parseInt(progressUpdate)
      };

      const updates = [...(goal.updates || []), newUpdate];
      
      const response = await base44.functions.invoke('updateGoalProgress', {
        goalId: goal.id,
        progress: parseInt(progressUpdate),
        updates
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setComment("");
      setProgressUpdate(goal.progress.toString());
      setShowForm(false);
      toast.success("Update added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add update");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    addUpdateMutation.mutate();
  };

  const updates = goal.updates || [];

  return (
    <div className="space-y-4">
      {/* Updates List */}
      {updates.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {updates
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((update, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                        {update.author_name?.charAt(0) || update.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{update.author_name}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(update.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {update.progress_snapshot !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md">
                        <TrendingUp className="w-3 h-3 text-blue-700" />
                        <span className="text-xs font-semibold text-blue-700">
                          {update.progress_snapshot}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{update.comment}</p>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Update Form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div>
            <Label htmlFor="progress">Update Progress</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your progress, achievements, or challenges..."
              className="mt-2 min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={addUpdateMutation.isPending || !comment.trim()}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {addUpdateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post Update
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setComment("");
                setProgressUpdate(goal.progress.toString());
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Progress Update
        </Button>
      )}
    </div>
  );
}