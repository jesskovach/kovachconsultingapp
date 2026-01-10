import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const FUNCTION_NAME = "submitCustomIntake";

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
      {hint ? (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function TextArea({ id, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      name={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 14,
        resize: "vertical",
      }}
    />
  );
}

function Select({ id, value, onChange, options }) {
  return (
    <select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 14,
        background: "white",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxGroup({ id, values, onChange, options }) {
  const set = new Set(values || []);
  return (
    <div id={id} style={{ display: "grid", gap: 8 }}>
      {options.map((opt) => {
        const checked = set.has(opt.value);
        return (
          <label key={opt.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name={`${id}[]`}
              checked={checked}
              onChange={(e) => {
                const next = new Set(values || []);
                if (e.target.checked) next.add(opt.value);
                else next.delete(opt.value);
                onChange(Array.from(next));
              }}
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function CustomIntake() {
  const [loading, setLoading] = useState(true);
  const [intakeType, setIntakeType] = useState("initial");
  const [previousCoaching, setPreviousCoaching] = useState("No");
  const [previousCoachingDetails, setPreviousCoachingDetails] = useState("");
  const [currentWork, setCurrentWork] = useState("");
  const [specificSituation, setSpecificSituation] = useState("");
  const [pressuresConstraints, setPressuresConstraints] = useState("");
  const [capacity, setCapacity] = useState("Heavy but manageable");
  const [environmentFeel, setEnvironmentFeel] = useState(["High-pressure"]);
  const [outsideControl, setOutsideControl] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [mostImportant, setMostImportant] = useState("");
  const [feelsUnclear, setFeelsUnclear] = useState("");
  const [unhelpfulAdvice, setUnhelpfulAdvice] = useState("");
  const [futureFeeling, setFutureFeeling] = useState("");
  const [impactCost, setImpactCost] = useState("");
  const [worthwhile, setWorthwhile] = useState("");
  const [complexResponse, setComplexResponse] = useState("");
  const [anythingElse, setAnythingElse] = useState("");
  const [reflectionUpdate, setReflectionUpdate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User query must be at top level
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  // Client query must be at top level
  const { data: client } = useQuery({
    queryKey: ["client", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const clients = await base44.entities.Client.filter({ email: user.email });
      return clients[0] || null;
    },
    enabled: !!user?.email
  });

  // Questionnaires query must be at top level
  const { data: myIntakes = [] } = useQuery({
    queryKey: ["myIntakes", client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      return await base44.entities.Questionnaire.filter({ client_id: client.id }, "-created_date", 50);
    },
    enabled: !!client?.id
  });

  // All useMemo at top level
  const cannotSubmitReason = useMemo(() => {
    if (!user?.email) return "We couldn't detect your login email. Please log out and log back in.";
    if (!client?.id) return "This login email doesn't match our records.";
    return "";
  }, [user?.email, client?.id]);

  // All useEffect at top level
  useEffect(() => {
    if (!user && !client) {
      setLoading(false);
    } else if (user && client !== undefined) {
      setLoading(false);
    }
  }, [user, client]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (cannotSubmitReason) {
        throw new Error(cannotSubmitReason);
      }

      const responses = {
        previous_coaching: previousCoaching,
        previous_coaching_details: previousCoaching === "Yes" ? previousCoachingDetails : "",
        current_work: currentWork,
        specific_situation: specificSituation,
        pressures_constraints: pressuresConstraints,
        capacity,
        environment_feel: environmentFeel,
        outside_control: outsideControl,
        decision_reason: decisionReason,
        most_important: mostImportant,
        feels_unclear: feelsUnclear,
        unhelpful_advice: unhelpfulAdvice,
        future_feeling: futureFeeling,
        impact_cost: impactCost,
        worthwhile,
        complex_response: complexResponse,
        anything_else: anythingElse,
      };

      const result = await base44.functions.invoke(FUNCTION_NAME, {
        formData: responses,
        clientId: client.id,
        intakeStage: intakeType
      });

      if (result.data?.success) {
        setSuccess("Submitted! Your intake form has been saved.");
      } else {
        throw new Error(result.data?.error || "Submission failed");
      }
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
      setError(e?.message || "Submission failed.");
      console.error("Intake submit error:", e);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 18 }}>
      <h1 style={{ margin: "8px 0 6px" }}>Client Intake</h1>

      {loading ? <div>Loading…</div> : null}
      {error ? (
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(0,128,0,0.10)" }}>
          {success}
        </div>
      ) : null}

      {!loading && cannotSubmitReason ? (
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,165,0,0.14)", marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Access issue</div>
          <div>{cannotSubmitReason}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 18, padding: 14, borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginTop: 0 }}>Intake milestone</h2>
        <Field label="Which intake is this?">
          <Select
            id="intake_type"
            value={intakeType}
            onChange={setIntakeType}
            options={[
              { value: "initial", label: "Initial intake" },
              { value: "checkin_30_60_90", label: "30/60/90 day check-in" },
              { value: "annual_reset", label: "Annual reset" },
            ]}
          />
        </Field>

        <h2 style={{ marginTop: 18 }}>Questions</h2>

        <Field label="Have you worked with a coach before?">
          <Select
            id="previous_coaching"
            value={previousCoaching}
            onChange={setPreviousCoaching}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
        </Field>

        {previousCoaching === "Yes" ? (
          <Field label="If yes, what was helpful / unhelpful?">
            <TextArea
              id="previous_coaching_details"
              value={previousCoachingDetails}
              onChange={setPreviousCoachingDetails}
              placeholder="Share a little context…"
            />
          </Field>
        ) : null}

        <Field label="What's going on in your work right now?">
          <TextArea id="current_work" value={currentWork} onChange={setCurrentWork} />
        </Field>

        <Field label="Is there a specific situation you want support with?">
          <TextArea id="specific_situation" value={specificSituation} onChange={setSpecificSituation} />
        </Field>

        <Field label="What pressures or constraints are you navigating?">
          <TextArea id="pressures_constraints" value={pressuresConstraints} onChange={setPressuresConstraints} />
        </Field>

        <Field label="How does your current capacity feel?">
          <Select
            id="capacity"
            value={capacity}
            onChange={setCapacity}
            options={[
              { value: "Light", label: "Light" },
              { value: "Moderate", label: "Moderate" },
              { value: "Heavy but manageable", label: "Heavy but manageable" },
              { value: "Overwhelming", label: "Overwhelming" },
            ]}
          />
        </Field>

        <Field label="How would you describe your environment? (select all that apply)">
          <CheckboxGroup
            id="environment_feel"
            values={environmentFeel}
            onChange={setEnvironmentFeel}
            options={[
              { value: "High-pressure", label: "High-pressure" },
              { value: "Supportive", label: "Supportive" },
              { value: "Unclear expectations", label: "Unclear expectations" },
              { value: "Fast-moving", label: "Fast-moving" },
              { value: "Stagnant", label: "Stagnant" },
            ]}
          />
        </Field>

        <Field label="What feels outside of your control right now?">
          <TextArea id="outside_control" value={outsideControl} onChange={setOutsideControl} />
        </Field>

        <Field label="What's driving your decision to seek coaching now?">
          <TextArea id="decision_reason" value={decisionReason} onChange={setDecisionReason} />
        </Field>

        <Field label="What's most important to you to protect or build right now?">
          <TextArea id="most_important" value={mostImportant} onChange={setMostImportant} />
        </Field>

        <Field label="What feels unclear, stuck, or hard to name?">
          <TextArea id="feels_unclear" value={feelsUnclear} onChange={setFeelsUnclear} />
        </Field>

        <Field label="What advice or approaches have NOT helped in the past?">
          <TextArea id="unhelpful_advice" value={unhelpfulAdvice} onChange={setUnhelpfulAdvice} />
        </Field>

        <Field label="In a few months, what do you hope has changed for you—at work or in your life?">
          <TextArea id="future_feeling" value={futureFeeling} onChange={setFutureFeeling} />
        </Field>

        <Field label="What's the cost if nothing changes?">
          <TextArea id="impact_cost" value={impactCost} onChange={setImpactCost} />
        </Field>

        <Field label="What would make coaching feel worthwhile to you?">
          <TextArea id="worthwhile" value={worthwhile} onChange={setWorthwhile} />
        </Field>

        <Field label="Anything complex you want me to understand about your situation?">
          <TextArea id="complex_response" value={complexResponse} onChange={setComplexResponse} />
        </Field>

        <Field label="Anything else you want to share?">
          <TextArea id="anything_else" value={anythingElse} onChange={setAnythingElse} />
        </Field>

        <h2 style={{ marginTop: 18 }}>Reflection / Update (optional)</h2>
        <Field
          label="Use this only for typos or clarifying notes later (does not overwrite your original answers)."
          hint='Example: "I meant X not Y" or "Adding a bit more context…"'
        >
          <TextArea id="reflection_update" value={reflectionUpdate} onChange={setReflectionUpdate} />
        </Field>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!!cannotSubmitReason || submitting}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            fontSize: 15,
            cursor: !!cannotSubmitReason || submitting ? "not-allowed" : "pointer",
            opacity: !!cannotSubmitReason || submitting ? 0.6 : 1,
            background: "black",
            color: "white",
          }}
        >
          {submitting ? "Submitting…" : "Submit Intake Form"}
        </button>
      </div>

      {/* My completed intake forms */}
      {client?.id && myIntakes.length > 0 && (
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
          <h2 style={{ marginTop: 0 }}>My completed intake forms</h2>
          <div className="space-y-3">
            {myIntakes.map((intake) => (
              <div key={intake.id} className="p-3 border rounded-lg">
                <div className="text-sm font-medium">
                  {intake.intake_type || "Initial"} - {intake.created_date ? new Date(intake.created_date).toLocaleDateString() : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}