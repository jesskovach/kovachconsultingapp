// pages/CustomIntake.jsx
// Drop-in replacement for your Custom Intake page.
// What it does:
// 1) Uses the logged-in user's email (required) as the identity.
// 2) Looks up a Client record by that email.
//    - If none exists, it blocks submission with: “This login email doesn’t match our records.”
// 3) Saves the intake as a Questionnaire record (client_id + client_email + intake_type + submitted_at + responses).
// 4) Upserts a UserAuthProfile record (user_email + last_login_provider + last_login_at + optional UA/device).
// 5) Shows a reminder banner: “You last signed in with X (email). Please use the same method next time…”
//
// Paste this whole file into Base44 → Code → pages → CustomIntake (or wherever your CustomIntake page lives).

import React, { useEffect, useMemo, useState } from "react";

// ✅ IMPORTANT: set this to your app id (already in your logs)
const APP_ID = "6957e3518343d5240794ce38";

// --- tiny helpers ---
async function safeUserMe() {
  // Base44 often exposes User.me() in the app runtime.
  // If it's unavailable, we fall back to decoding the JWT `sub` from localStorage (best-effort).
  try {
    // eslint-disable-next-line no-undef
    if (typeof User !== "undefined" && User?.me) {
      // eslint-disable-next-line no-undef
      return await User.me();
    }
  } catch (_) {}

  // Fallback: try to read token from storage and decode `sub`
  // (If this fails, we simply return null and the UI will instruct the user.)
  try {
    const token =
      localStorage.getItem("base44_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("base44_token") ||
      sessionStorage.getItem("token");

    if (!token) return null;

    const [, payload] = token.split(".");
    if (!payload) return null;

    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const email = json?.sub || json?.email;
    if (!email) return null;

    return { email };
  } catch (_) {
    return null;
  }
}

function guessLoginProvider() {
  // We can't reliably know provider from the browser in Base44 without a platform hint.
  // If you later add a server-side hook, you can overwrite this.
  return "unknown"; // enum: password, google, microsoft, facebook, unknown
}

function nowIso() {
  return new Date().toISOString();
}

async function apiFetch(path, options = {}) {
  // Always include credentials so session auth works cross-browser.
  const res = await fetch(path, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // Base44 returns JSON for most entity endpoints.
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      (typeof data === "string" ? data : null) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function findOneEntity(entityName, queryObj) {
  // Base44 entity read w/ query string `q=<json>`
  const q = encodeURIComponent(JSON.stringify(queryObj));
  const url = `/api/apps/${APP_ID}/entities/${entityName}?q=${q}`;
  const data = await apiFetch(url, { method: "GET" });

  // Base44 sometimes returns { data: [...] } or just [...]
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list[0] || null;
}

async function listEntities(entityName, queryObj, sortObj, limit = 50) {
  const params = new URLSearchParams();
  if (queryObj) params.set("q", JSON.stringify(queryObj));
  if (sortObj) params.set("sort", JSON.stringify(sortObj));
  if (limit) params.set("limit", String(limit));

  const url = `/api/apps/${APP_ID}/entities/${entityName}?${params.toString()}`;
  const data = await apiFetch(url, { method: "GET" });
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

async function createEntity(entityName, payload) {
  const url = `/api/apps/${APP_ID}/entities/${entityName}`;
  return apiFetch(url, { method: "POST", body: JSON.stringify(payload) });
}

async function updateEntity(entityName, id, payload) {
  const url = `/api/apps/${APP_ID}/entities/${entityName}/${id}`;
  return apiFetch(url, { method: "PUT", body: JSON.stringify(payload) });
}

async function upsertUserAuthProfile(userEmail) {
  const provider = guessLoginProvider();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const existing = await findOneEntity("UserAuthProfile", { user_email: userEmail });
  const payload = {
    user_email: userEmail,
    last_login_provider: provider, // password/google/microsoft/facebook/unknown
    last_login_at: nowIso(),
    last_login_user_agent: ua,
  };

  if (existing?.id) {
    return updateEntity("UserAuthProfile", existing.id, payload);
  }
  return createEntity("UserAuthProfile", payload);
}

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

function TextInput({ id, value, onChange, placeholder }) {
  return (
    <input
      id={id}
      name={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 14,
      }}
    />
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
  const [userEmail, setUserEmail] = useState("");
  const [client, setClient] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);

  // intake “milestone” selector (initial / 30-60-90 / annual reset)
  const [intakeType, setIntakeType] = useState("initial");

  // form fields (match what you were logging)
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
  const [reflectionUpdate, setReflectionUpdate] = useState(""); // “Reflection / Update” field (does not overwrite originals)

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cannotSubmitReason = useMemo(() => {
    if (!userEmail) return "We couldn’t detect your login email. Please log out and log back in.";
    if (!client?.id) return "This login email doesn’t match our records.";
    return "";
  }, [userEmail, client]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const me = await safeUserMe();
        const email = me?.email || "";
        setUserEmail(email);

        if (!email) {
          setLoading(false);
          return;
        }

        // Upsert auth profile (reminder banner uses this)
        try {
          await upsertUserAuthProfile(email);
        } catch (_) {
          // non-fatal
        }

        // Fetch latest auth profile
        const profile = await findOneEntity("UserAuthProfile", { user_email: email });
        setAuthProfile(profile);

        // Find client by email
        const foundClient = await findOneEntity("Client", { email });
        setClient(foundClient || null);

        setLoading(false);
      } catch (e) {
        setLoading(false);
        setError(e?.message || "Unable to load intake.");
      }
    })();
  }, []);

  useEffect(() => {
    if (client?.id) {
      (async () => {
        try {
          const list = await listEntities(
            "Questionnaire",
            { client_id: client.id },
            { submitted_at: -1 },
            50
          );
          setMyIntakes(list);
          if (!selectedIntakeId && list[0]?.id) setSelectedIntakeId(list[0].id);
        } catch (_) {
          // non-fatal
        }
      })();
    }
  }, [client?.id, selectedIntakeId]);

  async function loadMyIntakes() {
    if (!client?.id) return;
    try {
      const list = await listEntities(
        "Questionnaire",
        { client_id: client.id },
        { submitted_at: -1 },
        50
      );
      setMyIntakes(list);
      if (!selectedIntakeId && list[0]?.id) setSelectedIntakeId(list[0].id);
    } catch (_) {
      // non-fatal
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (cannotSubmitReason) {
        throw new Error(cannotSubmitReason);
      }

      // Build responses object (this is what you want to preserve as original answers)
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

      // Create Questionnaire record
      const created = await createEntity("Questionnaire", {
        client_id: client.id,
        client_email: userEmail,
        intake_type: intakeType, // initial | checkin_30_60_90 | annual_reset
        submitted_at: nowIso(),
        responses,
        reflection_update: reflectionUpdate || "", // safe “typos/clarifying notes” channel
        created_by_email: userEmail,
      });

      // Refresh auth profile “last login” (optional)
      try {
        await upsertUserAuthProfile(userEmail);
        const profile = await findOneEntity("UserAuthProfile", { user_email: userEmail });
        setAuthProfile(profile);
      } catch (_) {}

      setSuccess("Submitted! Your intake form has been saved.");
      setSubmitting(false);

      // Optional: you can redirect back to portal home if you want:
      // window.location.href = "/ClientPortal";
      console.log("Intake saved:", created);
    } catch (e) {
      setSubmitting(false);
      setError(e?.message || "Submission failed.");
      console.error("Intake submit error:", e);
    }
  }

  // “Quick access to completed forms” (client-side dropdown)
  // This shows THEIR own questionnaires in the intake page immediately after submission, too.
  const [myIntakes, setMyIntakes] = useState([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");

  async function loadMyIntakes() {
    if (!client?.id) return;
    try {
      const list = await listEntities(
        "Questionnaire",
        { client_id: client.id },
        { submitted_at: -1 },
        50
      );
      setMyIntakes(list);
      if (!selectedIntakeId && list[0]?.id) setSelectedIntakeId(list[0].id);
    } catch (_) {
      // non-fatal
    }
  }

  useEffect(() => {
    if (client?.id) loadMyIntakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  const selectedIntake = useMemo(() => {
    return myIntakes.find((x) => x.id === selectedIntakeId) || null;
  }, [myIntakes, selectedIntakeId]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 18 }}>
      <h1 style={{ margin: "8px 0 6px" }}>Client Intake</h1>

      {authProfile?.last_login_provider ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.04)",
            marginBottom: 14,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Sign-in reminder</div>
          <div>
            You last signed in with{" "}
            <b>{String(authProfile.last_login_provider).toUpperCase()}</b> ({userEmail || "—"}).
            Please use the same method next time to access your forms.
          </div>
        </div>
      ) : null}

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

        <Field label="What’s going on in your work right now?">
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

        <Field label="What’s driving your decision to seek coaching now?">
          <TextArea id="decision_reason" value={decisionReason} onChange={setDecisionReason} />
        </Field>

        <Field label="What’s most important to you to protect or build right now?">
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

        <Field label="What’s the cost if nothing changes?">
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
          hint="Example: “I meant X not Y” or “Adding a bit more context…”"
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

      {/* Quick access dropdown for completed forms */}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginTop: 0 }}>My completed intake forms</h2>

        {!client?.id ? (
          <div style={{ opacity: 0.8 }}>
            Once your account is linked to a client record, your completed intake forms will appear here.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 260, flex: "1 1 260px" }}>
                <Select
                  id="intake_selector"
                  value={selectedIntakeId}
                  onChange={setSelectedIntakeId}
                  options={[
                    ...(myIntakes.length
                      ? myIntakes.map((x) => ({
                          value: x.id,
                          label: `${(x.intake_type || "intake").replaceAll("_", " ")} — ${
                            x.submitted_at ? new Date(x.submitted_at).toLocaleDateString() : "date"
                          }`,
                        }))
                      : [{ value: "", label: "No completed intakes yet" }]),
                  ]}
                />
              </div>

              <button
                type="button"
                onClick={loadMyIntakes}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Refresh
              </button>
            </div>

            {selectedIntake ? (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Preview</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
                  This is read-only. If you need to add a clarifying note, use “Reflection / Update” above.
                </div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13 }}>
                  {JSON.stringify(selectedIntake.responses || {}, null, 2)}
                </pre>
                {selectedIntake.reflection_update ? (
                  <>
                    <div style={{ fontWeight: 800, marginTop: 12, marginBottom: 6 }}>Reflection / Update</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{selectedIntake.reflection_update}</div>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}