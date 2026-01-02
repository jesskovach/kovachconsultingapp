import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, TrendingUp, AlertCircle, Target, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AINotesAssistant({ clientId, sessionType, currentNote, onInsertSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);

  const suggestionsMutation = useMutation({
    mutationFn: () => base44.functions.invoke("generateNoteSuggestions", {
      clientId,
      sessionType,
      currentNote
    }),
    onSuccess: (response) => {
      setSuggestions(response.data.suggestions);
      toast.success("AI suggestions generated");
    },
    onError: (error) => {
      toast.error("Failed to generate suggestions");
    }
  });

  const summaryMutation = useMutation({
    mutationFn: () => base44.functions.invoke("summarizeClientNotes", { clientId }),
    onSuccess: (response) => {
      setSummary(response.data.summary);
      toast.success("Summary generated");
    },
    onError: (error) => {
      toast.error("Failed to generate summary");
    }
  });

  const handleInsertSuggestion = (suggestion) => {
    if (onInsertSuggestion) {
      onInsertSuggestion(suggestion);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => suggestionsMutation.mutate()}
          disabled={suggestionsMutation.isPending}
          className="flex-1"
        >
          {suggestionsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Get AI Suggestions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => summaryMutation.mutate()}
          disabled={summaryMutation.isPending}
          className="flex-1"
        >
          {summaryMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Summary
        </Button>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-slate-800 text-sm">AI Suggestions</h4>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleInsertSuggestion(suggestion)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-slate-700 group"
                >
                  <span className="group-hover:text-blue-700">{suggestion}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h4 className="font-semibold text-slate-800">AI Client Summary</h4>
            </div>
            
            <div className="space-y-4 text-sm">
              {summary.overview && (
                <div>
                  <p className="text-slate-600 leading-relaxed">{summary.overview}</p>
                </div>
              )}

              {summary.key_points?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <h5 className="font-medium text-slate-700">Key Discussion Points</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {summary.key_points.map((point, i) => (
                      <li key={i} className="text-slate-600 list-disc">{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.progress?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-medium text-slate-700">Progress & Achievements</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {summary.progress.map((item, i) => (
                      <li key={i} className="text-slate-600 list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.challenges?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h5 className="font-medium text-slate-700">Ongoing Challenges</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {summary.challenges.map((challenge, i) => (
                      <li key={i} className="text-slate-600 list-disc">{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.action_items?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-violet-600" />
                    <h5 className="font-medium text-slate-700">Action Items</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {summary.action_items.map((item, i) => (
                      <li key={i} className="text-slate-600 list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.recommendations?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <h5 className="font-medium text-slate-700">Recommendations</h5>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {summary.recommendations.map((rec, i) => (
                      <li key={i} className="text-slate-600 list-disc">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}