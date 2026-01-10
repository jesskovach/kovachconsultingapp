import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/hooks/useAuth";
import { base44 } from "@/lib/base44";

/**
 * Custom Intake Page
 * - Milestone selector (Initial / 30 / 60 / 90 / Annual)
 * - Mobile-safe submission (native button, no <form> submit reliance)
 * - Double-submit prevention + timeout + clear user feedback
 * - Console logs that help debug iOS / user-mapping issues
 *
 * IMPORTANT:
 * Update FUNCTION_NAME to match your Base44 function name exactly.
 * In the builder, your function is likely called something like:
 *  - "submit Custom Intake" (with spaces) OR
 *  - "submitCustomIntake"
 */
const FUNCTION_NAME = "submit Custom Intake"; // <-- change if needed

const STAGE_OPTIONS = [
  { value: "initial", label: "Initial Intake" },
  { value: "checkin_30", label: "30-Day Check-in" },
  { value: "checkin_60", label: "60-Day Check-in" },
  { value: "checkin_90", label: "90-Day Check-in" },
  { value: "annual_reset", label: "Annual Reset" },
];

const ENVIRONMENT_FEEL_OPTIONS = [
  "High-pressure",
  "Supportive",
  "Unclear expectations",
  "Chaotic / reactive",
  "Stable / predictable",
  "High autonomy",
  "Low autonomy",
  "Values-aligned",
  "Misaligned",
];

function withTimeout(promise, ms, message = "Request timed out") {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : v;
}

export default function CustomIntake() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [intakeStage, setIntakeStage] = useState("initial");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fields observed from your console logs
  const [formData, setFormData] = useState({
    current_work: "",
    capacity: "",
    decision_reason: "",
    environment_feel: [],
    feels_unclear: "",
    future_feeling: "",
    pressures_constraints: "",
    outside_control: "",
    most_important: "",
    specific_situation: "",
    unhelpful_advice: "",
    complex_response: "",
    worthwhile: "",
    impact_cost: "",
    previous_coaching: "No",
    previous_coaching_details: "",
    anything_else: "",
  });

  const canSubmit = useMemo(() => {
    // Keep validation light so it never blocks you from testing.
    // If you want required fields, tell me which ones.
    return !isSubmitting;
  }, [isSubmitting]);

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key, option) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const next = current.includes(option)
        ? current.filter((x) => x !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };

  const normalizePayload = (data) => {
    // Keep payload clean / stable across devices
    const cleaned = {};
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) cleaned[k] = v;
      else cleaned[k] = safeTrim(v);
    }

    // If previous_coaching is No, clear details
    if (cleaned.previous_coaching !== "Yes") {
      cleaned.previous_coaching_details = "";
    }

    return cleaned;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitError("");
    setSubmitSuccess(false);

    try {
      setIsSubmitting(true);

      const payload = {
        formData: normalizePayload(formData),
        intakeStage,
      };

      // Debug logs (helpful for iOS)
      console.log("Form submission started");
      console.log(payload.formData);
      console.log("Starting submission...");
      console.log("Fetching user...");
      console.log("User fetched:", user?.email || "(no email)");

      // 25s is a reasonable ceiling for mobile networks; adjust if you want.
      const res = await withTimeout(
        base44.functions.invoke(FUNCTION_NAME, payload),
        25000,
        "Submission timed out. If this is iOS, check the Network tab for a 400/403 on related requests."
      );

      console.log("Submission response:", res);

      // Common Base44 patterns: res.success or res.data.success
      const success =
        res?.success === true ||
        res?.data?.success === true ||
        res?.data?.ok === true;

      if (!success) {
        // Try to extract a useful message
        const msg =
          res?.error ||
          res?.data?.error ||
          "Submission failed. Check console + Network for the failing request.";
        throw new Error(msg);
      }

      setSubmitSuccess(true);

      // Optional: send the user back to the dashboard/portal
      // nav(createPageUrl("Dashboard"));
      // or: nav(createPageUrl("ClientPortal"));

    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err?.message || "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    nav(createPageUrl("ClientPortal"));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Client Intake</div>
            <div className="text-sm text-gray-600">
              Please answer honestly—this helps shape our work together.
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border bg-gray-50 hover:bg-gray-100"
            onClick={handleCancel}
          >
            Back
          </button>
        </div>

        {/* Milestone selector */}
        <div className="mt-4">
          <label className="text-sm font-medium" htmlFor="intakeStage">
            Intake type
          </label>
          <select
            id="intakeStage"
            name="intakeStage"
            className="mt-1 border rounded-xl px-3 py-2 w-full"
            value={intakeStage}
            onChange={(e) => setIntakeStage(e.target.value)}
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        {/* Current work */}
        <div>
          <label className="text-sm font-medium" htmlFor="current_work">
            What’s happening in your work right now?
          </label>
          <textarea
            id="current_work"
            name="current_work"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.current_work}
            onChange={(e) => setField("current_work", e.target.value)}
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-medium" htmlFor="capacity">
            How does your capacity feel right now?
          </label>
          <select
            id="capacity"
            name="capacity"
            className="mt-1 border rounded-xl px-3 py-2 w-full"
            value={formData.capacity}
            onChange={(e) => setField("capacity", e.target.value)}
          >
            <option value="">Select one…</option>
            <option value="Light / plenty of room">Light / plenty of room</option>
            <option value="Moderate">Moderate</option>
            <option value="Heavy but manageable">Heavy but manageable</option>
            <option value="Over capacity">Over capacity</option>
          </select>
        </div>

        {/* Decision reason */}
        <div>
          <label className="text-sm font-medium" htmlFor="decision_reason">
            What made you decide now is the time to start coaching?
          </label>
          <textarea
            id="decision_reason"
            name="decision_reason"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.decision_reason}
            onChange={(e) => setField("decision_reason", e.target.value)}
          />
        </div>

        {/* Environment feel (multi-select) */}
        <div>
          <div className="text-sm font-medium">How does your environment feel?</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ENVIRONMENT_FEEL_OPTIONS.map((opt) => {
              const checked = (formData.environment_feel || []).includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 border rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="environment_feel"
                    checked={checked}
                    onChange={() => toggleMulti("environment_feel", opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Feels unclear */}
        <div>
          <label className="text-sm font-medium" htmlFor="feels_unclear">
            What feels unclear or stuck right now?
          </label>
          <textarea
            id="feels_unclear"
            name="feels_unclear"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.feels_unclear}
            onChange={(e) => setField("feels_unclear", e.target.value)}
          />
        </div>

        {/* Future feeling */}
        <div>
          <label className="text-sm font-medium" htmlFor="future_feeling">
            In a few months, what do you hope has changed for you—at work or in your life?
          </label>
          <textarea
            id="future_feeling"
            name="future_feeling"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.future_feeling}
            onChange={(e) => setField("future_feeling", e.target.value)}
          />
        </div>

        {/* Pressures */}
        <div>
          <label className="text-sm font-medium" htmlFor="pressures_constraints">
            What pressures or constraints are shaping your situation?
          </label>
          <textarea
            id="pressures_constraints"
            name="pressures_constraints"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.pressures_constraints}
            onChange={(e) => setField("pressures_constraints", e.target.value)}
          />
        </div>

        {/* Outside control */}
        <div>
          <label className="text-sm font-medium" htmlFor="outside_control">
            What’s outside your control that you’re still carrying?
          </label>
          <textarea
            id="outside_control"
            name="outside_control"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.outside_control}
            onChange={(e) => setField("outside_control", e.target.value)}
          />
        </div>

        {/* Most important */}
        <div>
          <label className="text-sm font-medium" htmlFor="most_important">
            What’s most important to protect or prioritize right now?
          </label>
          <textarea
            id="most_important"
            name="most_important"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.most_important}
            onChange={(e) => setField("most_important", e.target.value)}
          />
        </div>

        {/* Specific situation */}
        <div>
          <label className="text-sm font-medium" htmlFor="specific_situation">
            Is there a specific situation you want to work through first?
          </label>
          <textarea
            id="specific_situation"
            name="specific_situation"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.specific_situation}
            onChange={(e) => setField("specific_situation", e.target.value)}
          />
        </div>

        {/* Unhelpful advice */}
        <div>
          <label className="text-sm font-medium" htmlFor="unhelpful_advice">
            What advice have you received that wasn’t helpful?
          </label>
          <textarea
            id="unhelpful_advice"
            name="unhelpful_advice"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.unhelpful_advice}
            onChange={(e) => setField("unhelpful_advice", e.target.value)}
          />
        </div>

        {/* Complex response */}
        <div>
          <label className="text-sm font-medium" htmlFor="complex_response">
            If your situation is complex, what nuance do you want me to understand?
          </label>
          <textarea
            id="complex_response"
            name="complex_response"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.complex_response}
            onChange={(e) => setField("complex_response", e.target.value)}
          />
        </div>

        {/* Worthwhile */}
        <div>
          <label className="text-sm font-medium" htmlFor="worthwhile">
            What would make coaching feel worthwhile to you?
          </label>
          <textarea
            id="worthwhile"
            name="worthwhile"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.worthwhile}
            onChange={(e) => setField("worthwhile", e.target.value)}
          />
        </div>

        {/* Impact / cost */}
        <div>
          <label className="text-sm font-medium" htmlFor="impact_cost">
            What is this costing you (time, energy, confidence, relationships, etc.)?
          </label>
          <textarea
            id="impact_cost"
            name="impact_cost"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.impact_cost}
            onChange={(e) => setField("impact_cost", e.target.value)}
          />
        </div>

        {/* Previous coaching */}
        <div>
          <label className="text-sm font-medium" htmlFor="previous_coaching">
            Have you worked with a coach before?
          </label>
          <select
            id="previous_coaching"
            name="previous_coaching"
            className="mt-1 border rounded-xl px-3 py-2 w-full"
            value={formData.previous_coaching}
            onChange={(e) => setField("previous_coaching", e.target.value)}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>

          {formData.previous_coaching === "Yes" && (
            <div className="mt-2">
              <label className="text-sm font-medium" htmlFor="previous_coaching_details">
                If yes, what worked / didn’t work?
              </label>
              <textarea
                id="previous_coaching_details"
                name="previous_coaching_details"
                className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[80px]"
                value={formData.previous_coaching_details}
                onChange={(e) => setField("previous_coaching_details", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Anything else */}
        <div>
          <label className="text-sm font-medium" htmlFor="anything_else">
            Anything else you want me to know?
          </label>
          <textarea
            id="anything_else"
            name="anything_else"
            className="mt-1 border rounded-xl px-3 py-2 w-full min-h-[90px]"
            value={formData.anything_else}
            onChange={(e) => setField("anything_else", e.target.value)}
          />
        </div>

        {/* Alerts */}
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Intake submitted successfully.
          </div>
        )}

        {/* Submit button (mobile-safe) */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-100"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="px-4 py-3 rounded-2xl border bg-black text-white hover:opacity-90 disabled:opacity-60"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit Intake Form"}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Debug tip: if a submission fails for a specific user (like Liz), check console logs for
          “Clients found: 0” and confirm that user has a matching Client record by email.
        </div>
      </div>
    </div>
  );
}