import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function CustomIntake() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    current_work: "",
    environment_feel: [],
    capacity: "",
    decision_reason: "",
    specific_situation: "",
    most_important: "",
    feels_unclear: "",
    pressures_constraints: "",
    outside_control: "",
    complex_response: "",
    unhelpful_advice: "",
    impact_cost: "",
    future_feeling: "",
    worthwhile: "",
    previous_coaching: "",
    previous_coaching_details: "",
    anything_else: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(v => v !== value)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Form submission started", formData);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring");
      return;
    }
    
    // Basic validation
    if (!formData.current_work || !formData.capacity || !formData.decision_reason) {
      console.log("Validation failed", {
        current_work: formData.current_work,
        capacity: formData.capacity,
        decision_reason: formData.decision_reason
      });
      toast.error("Please fill in the required fields");
      return;
    }

    setIsSubmitting(true);
    console.log("Starting submission...");
    
    try {
      console.log("Fetching user...");
      const user = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('User fetch timeout')), 10000))
      ]);
      console.log("User fetched:", user?.email);
      
      if (!user) {
        toast.error("Please log in to submit the form");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Fetching clients...");
      const clients = await Promise.race([
        base44.entities.Client.filter({ email: user.email }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Client fetch timeout')), 10000))
      ]);
      console.log("Clients found:", clients.length);
      
      if (clients.length === 0) {
        toast.error("Client profile not found. Please contact your coach.");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Invoking backend function...");
      const response = await Promise.race([
        base44.functions.invoke('submitCustomIntake', {
          formData,
          clientId: clients[0].id
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Submission timeout')), 30000))
      ]);
      console.log("Backend response:", response.data);
      
      if (response.data?.success) {
        console.log("Success! Setting submitted state...");
        setSubmitted(true);
        toast.success("Intake form submitted successfully!");
      } else {
        throw new Error(response.data?.error || "Submission failed");
      }
    } catch (error) {
      console.error("Intake submission error:", error);
      toast.error(error.message || "Failed to submit intake form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
              <h1 className="text-3xl font-bold">A Starting Point</h1>
            </div>
            <p className="text-violet-100">
              This isn't a test or a checklist. It's simply a way for me to get oriented before we talk. Short answers are more than enough.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* A bit of context */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">A bit of context</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What kind of work are you doing right now?
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">(Role, field, or whatever feels most relevant.)</p>
                  <Textarea
                    value={formData.current_work}
                    onChange={(e) => handleChange("current_work", e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-3 block">
                    How does your current environment feel?
                  </Label>
                  <div className="space-y-2">
                    {["Steady", "In flux", "High-pressure", "Uncertain", "Transitioning", "A mix"].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`environment-${option}`}
                          checked={formData.environment_feel.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange("environment_feel", option, checked)}
                        />
                        <Label htmlFor={`environment-${option}`} className="text-slate-600 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-3 block">
                    How's your capacity at the moment?
                  </Label>
                  <RadioGroup value={formData.capacity} onValueChange={(value) => handleChange("capacity", value)}>
                    {["Sustainable", "Heavy but manageable", "At or near the edge", "Actively unsustainable"].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`capacity-${option}`} />
                        <Label htmlFor={`capacity-${option}`} className="text-slate-600 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* What brings you here */}
            <div className="mb-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">What brings you here</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What made you decide to book this conversation now?
                  </Label>
                  <Textarea
                    value={formData.decision_reason}
                    onChange={(e) => handleChange("decision_reason", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Is there a specific situation, decision, or pattern that's been on your mind?
                  </Label>
                  <Textarea
                    value={formData.specific_situation}
                    onChange={(e) => handleChange("specific_situation", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    If so, what feels most important about it?
                  </Label>
                  <Textarea
                    value={formData.most_important}
                    onChange={(e) => handleChange("most_important", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What feels unclear, stuck, or hard to name right now?
                  </Label>
                  <Textarea
                    value={formData.feels_unclear}
                    onChange={(e) => handleChange("feels_unclear", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>
              </div>
            </div>

            {/* The reality you're navigating */}
            <div className="mb-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">The reality you're navigating</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What pressures or constraints feel most present for you lately?
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    (For example: time, expectations, authority, money, burnout, politics, uncertainty.)
                  </p>
                  <Textarea
                    value={formData.pressures_constraints}
                    onChange={(e) => handleChange("pressures_constraints", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Are there parts of this situation that feel outside your control, at least for now?
                  </Label>
                  <Textarea
                    value={formData.outside_control}
                    onChange={(e) => handleChange("outside_control", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>
              </div>
            </div>

            {/* How you tend to operate */}
            <div className="mb-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">How you tend to operate</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    When things get complex or high-stakes, what do you usually do?
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    (Think it through, act quickly, seek input, carry it alone, wait for clarity, something else?)
                  </p>
                  <Textarea
                    value={formData.complex_response}
                    onChange={(e) => handleChange("complex_response", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What kinds of advice or support have not been helpful for you in the past?
                  </Label>
                  <Textarea
                    value={formData.unhelpful_advice}
                    onChange={(e) => handleChange("unhelpful_advice", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>
              </div>
            </div>

            {/* Impact and direction */}
            <div className="mb-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Impact and direction</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    If this situation has been costing you something — energy, clarity, confidence, momentum — what has that looked like?
                  </Label>
                  <Textarea
                    value={formData.impact_cost}
                    onChange={(e) => handleChange("impact_cost", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    In a few months, what do you hope has changed for you—at work or in your life?
                  </Label>
                  <Textarea
                    value={formData.future_feeling}
                    onChange={(e) => handleChange("future_feeling", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>
              </div>
            </div>

            {/* For our time together */}
            <div className="mb-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">For our time together</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    What would make this conversation feel worthwhile to you?
                  </Label>
                  <Textarea
                    value={formData.worthwhile}
                    onChange={(e) => handleChange("worthwhile", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-3 block">
                    Have you worked with a coach or advisor before?
                  </Label>
                  <RadioGroup value={formData.previous_coaching} onValueChange={(value) => handleChange("previous_coaching", value)}>
                    {["Yes", "No", "Not sure how I'd define that"].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`previous-${option}`} />
                        <Label htmlFor={`previous-${option}`} className="text-slate-600 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {formData.previous_coaching === "Yes" && (
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">
                      (Optional: anything you want me to know about that experience?)
                    </Label>
                    <Textarea
                      value={formData.previous_coaching_details}
                      onChange={(e) => handleChange("previous_coaching_details", e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Your response..."
                    />
                  </div>
                )}

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Is there anything else you want me to know before we meet?
                  </Label>
                  <Textarea
                    value={formData.anything_else}
                    onChange={(e) => handleChange("anything_else", e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your response..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 py-6 text-lg h-auto"
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}