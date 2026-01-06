import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CustomIntake() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    experience_level: "",
    team_size: "",
    biggest_challenge: "",
    coaching_frequency: "",
    preferred_time: "",
    communication_style: "",
    commitment_level: ""
  });

  const questions = [
    {
      id: "experience_level",
      question: "What is your current leadership experience level?",
      options: [
        { value: "new", label: "New to leadership (0-2 years)" },
        { value: "intermediate", label: "Intermediate (3-5 years)" },
        { value: "experienced", label: "Experienced (6-10 years)" },
        { value: "senior", label: "Senior leader (10+ years)" }
      ]
    },
    {
      id: "team_size",
      question: "How large is your team?",
      options: [
        { value: "individual", label: "Individual contributor" },
        { value: "small", label: "Small team (1-5 people)" },
        { value: "medium", label: "Medium team (6-20 people)" },
        { value: "large", label: "Large team (20+ people)" }
      ]
    },
    {
      id: "biggest_challenge",
      question: "What's your biggest leadership challenge right now?",
      options: [
        { value: "time", label: "Time management and priorities" },
        { value: "communication", label: "Communication and feedback" },
        { value: "delegation", label: "Delegation and trust" },
        { value: "strategy", label: "Strategic thinking and vision" },
        { value: "conflict", label: "Conflict resolution" },
        { value: "change", label: "Leading through change" }
      ]
    },
    {
      id: "coaching_frequency",
      question: "How often would you like coaching sessions?",
      options: [
        { value: "weekly", label: "Weekly sessions" },
        { value: "biweekly", label: "Every two weeks" },
        { value: "monthly", label: "Monthly sessions" },
        { value: "flexible", label: "Flexible schedule" }
      ]
    },
    {
      id: "preferred_time",
      question: "What's your preferred session time?",
      options: [
        { value: "morning", label: "Morning (8am - 12pm)" },
        { value: "afternoon", label: "Afternoon (12pm - 4pm)" },
        { value: "evening", label: "Evening (4pm - 7pm)" },
        { value: "flexible", label: "Flexible" }
      ]
    },
    {
      id: "communication_style",
      question: "How do you prefer to communicate between sessions?",
      options: [
        { value: "email", label: "Email only" },
        { value: "messaging", label: "Quick messaging/chat" },
        { value: "calls", label: "Phone or video calls" },
        { value: "minimal", label: "Minimal contact between sessions" }
      ]
    },
    {
      id: "commitment_level",
      question: "What's your commitment level for this coaching engagement?",
      options: [
        { value: "trial", label: "Trial period (1-2 months)" },
        { value: "short", label: "Short term (3-6 months)" },
        { value: "standard", label: "Standard engagement (6-12 months)" },
        { value: "long", label: "Long term partnership (12+ months)" }
      ]
    }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all questions are answered
    const unanswered = questions.filter(q => !formData[q.id]);
    if (unanswered.length > 0) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Intake form submitted successfully!");
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
          <p className="text-slate-600 mb-6">
            Your custom intake form has been submitted successfully. We'll use this information to personalize your coaching experience.
          </p>
          <div className="bg-violet-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600">
              <strong>Next Steps:</strong>
              <br />
              • Review your responses in your dashboard
              <br />
              • Schedule your first coaching session
              <br />
              • We'll contact you within 24 hours
            </p>
          </div>
          <Button
            onClick={() => window.location.href = "/"}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-500 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Custom Intake Assessment</h1>
            </div>
            <p className="text-violet-100">
              Help us understand your leadership journey and coaching needs by answering a few quick questions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="pb-8 border-b border-slate-100 last:border-0"
                >
                  <Label className="text-slate-800 text-lg font-semibold mb-4 block">
                    {index + 1}. {question.question}
                  </Label>
                  <RadioGroup
                    value={formData[question.id]}
                    onValueChange={(value) => handleChange(question.id, value)}
                    className="space-y-3 mt-4"
                  >
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-violet-50 ${
                          formData[question.id] === option.value
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-200"
                        }`}
                        onClick={() => handleChange(question.id, option.value)}
                      >
                        <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                        <Label
                          htmlFor={`${question.id}-${option.value}`}
                          className="flex-1 cursor-pointer text-slate-700"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit Intake Form
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}