import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Sparkles, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientIntake() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("clientId");
  const verificationToken = urlParams.get("token");

  const [submitted, setSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [formData, setFormData] = useState({
    current_challenges: "",
    coaching_goals: "",
    leadership_style: "",
    previous_coaching: "",
    success_metrics: "",
    time_commitment: "",
    preferred_communication: "",
    additional_info: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (responses) => {
      return base44.functions.invoke("submitIntakeForm", {
        clientId,
        responses,
        verificationToken
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600">Invalid intake form link</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated and no token, prompt to login
  if (!isAuthenticated && !verificationToken) {
    const currentUrl = window.location.href;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-600 mb-6">
            Please log in to your account to complete the intake form. If you haven't created an account yet, check your email for the invitation.
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin(currentUrl)}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login to Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
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
            Your intake form has been submitted successfully. We'll review your responses and be in touch soon to schedule your first coaching session.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              <strong>Next Steps:</strong>
              <br />
              We'll contact you within 24-48 hours to schedule your discovery session.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Welcome to Your Coaching Journey</h1>
            </div>
            <p className="text-slate-200">
              Please take a few minutes to tell us about yourself, your goals, and what you hope to achieve through coaching.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <Label htmlFor="current_challenges" className="text-slate-700 text-base">
                What are your biggest leadership challenges right now? *
              </Label>
              <Textarea
                id="current_challenges"
                value={formData.current_challenges}
                onChange={(e) => handleChange("current_challenges", e.target.value)}
                className="mt-2 min-h-[120px]"
                placeholder="Describe the key challenges you're facing..."
                required
              />
            </div>

            <div>
              <Label htmlFor="coaching_goals" className="text-slate-700 text-base">
                What do you hope to achieve through coaching? *
              </Label>
              <Textarea
                id="coaching_goals"
                value={formData.coaching_goals}
                onChange={(e) => handleChange("coaching_goals", e.target.value)}
                className="mt-2 min-h-[120px]"
                placeholder="Share your goals and desired outcomes..."
                required
              />
            </div>

            <div>
              <Label htmlFor="leadership_style" className="text-slate-700 text-base">
                How would you describe your leadership style? *
              </Label>
              <Textarea
                id="leadership_style"
                value={formData.leadership_style}
                onChange={(e) => handleChange("leadership_style", e.target.value)}
                className="mt-2 min-h-[100px]"
                placeholder="Describe your approach to leadership..."
                required
              />
            </div>

            <div>
              <Label htmlFor="previous_coaching" className="text-slate-700 text-base">
                Have you worked with a coach before?
              </Label>
              <Textarea
                id="previous_coaching"
                value={formData.previous_coaching}
                onChange={(e) => handleChange("previous_coaching", e.target.value)}
                className="mt-2 min-h-[80px]"
                placeholder="Share any previous coaching experience..."
              />
            </div>

            <div>
              <Label htmlFor="success_metrics" className="text-slate-700 text-base">
                How will you measure success in our coaching engagement? *
              </Label>
              <Textarea
                id="success_metrics"
                value={formData.success_metrics}
                onChange={(e) => handleChange("success_metrics", e.target.value)}
                className="mt-2 min-h-[100px]"
                placeholder="What would success look like for you?..."
                required
              />
            </div>

            <div>
              <Label htmlFor="time_commitment" className="text-slate-700 text-base">
                What time commitment can you make to coaching?
              </Label>
              <Input
                id="time_commitment"
                value={formData.time_commitment}
                onChange={(e) => handleChange("time_commitment", e.target.value)}
                className="mt-2"
                placeholder="e.g., 1 hour per week, biweekly sessions..."
              />
            </div>

            <div>
              <Label htmlFor="preferred_communication" className="text-slate-700 text-base">
                Preferred communication style and frequency?
              </Label>
              <Input
                id="preferred_communication"
                value={formData.preferred_communication}
                onChange={(e) => handleChange("preferred_communication", e.target.value)}
                className="mt-2"
                placeholder="e.g., Email weekly, phone for urgent matters..."
              />
            </div>

            <div>
              <Label htmlFor="additional_info" className="text-slate-700 text-base">
                Anything else you'd like us to know?
              </Label>
              <Textarea
                id="additional_info"
                value={formData.additional_info}
                onChange={(e) => handleChange("additional_info", e.target.value)}
                className="mt-2 min-h-[100px]"
                placeholder="Share any additional information..."
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-slate-800 hover:bg-slate-700 py-6 text-lg"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Intake Form"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}