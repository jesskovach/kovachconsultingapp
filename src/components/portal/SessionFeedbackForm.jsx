import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SessionFeedbackForm({ open, onClose, session, onSubmit, isLoading }) {
  const [feedback, setFeedback] = useState({
    rating: 0,
    value_rating: 0,
    clarity_rating: 0,
    comments: "",
    key_takeaways: "",
    action_items: ""
  });

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <Label className="text-slate-700 mb-2 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(feedback);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <StarRating
              label="Overall Session Rating"
              value={feedback.rating}
              onChange={(v) => setFeedback({ ...feedback, rating: v })}
            />
            
            <StarRating
              label="Value & Usefulness"
              value={feedback.value_rating}
              onChange={(v) => setFeedback({ ...feedback, value_rating: v })}
            />
            
            <StarRating
              label="Clarity & Understanding"
              value={feedback.clarity_rating}
              onChange={(v) => setFeedback({ ...feedback, clarity_rating: v })}
            />

            <div>
              <Label className="text-slate-700">Key Takeaways</Label>
              <Textarea
                value={feedback.key_takeaways}
                onChange={(e) => setFeedback({ ...feedback, key_takeaways: e.target.value })}
                placeholder="What were your main insights from this session?"
                className="mt-1.5 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-slate-700">Action Items</Label>
              <Textarea
                value={feedback.action_items}
                onChange={(e) => setFeedback({ ...feedback, action_items: e.target.value })}
                placeholder="What actions will you take based on this session?"
                className="mt-1.5 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-slate-700">Additional Comments</Label>
              <Textarea
                value={feedback.comments}
                onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                placeholder="Any other feedback or suggestions?"
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || feedback.rating === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}