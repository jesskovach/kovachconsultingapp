import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formData, intakeStage } = body ?? {};

    if (!formData || typeof formData !== "object") {
      return Response.json({ error: "formData is required" }, { status: 400 });
    }

    const stage =
      intakeStage && typeof intakeStage === "string"
        ? intakeStage
        : "initial";

    // 1) Find client record by logged-in user's email (client portal identity)
    const clients = await base44.entities.Client.filter({ email: user.email });

    // 2) Auto-create if missing (fixes Liz scenario)
    let client = clients?.[0];
    if (!client) {
      const created = await base44.entities.Client.create({
        name: user.name ?? user.email,
        email: user.email,
        status: "active",
        start_date: new Date().toISOString(),
      });
      client = created;
    }

    // 3) Create a NEW Questionnaire record every time (no overwriting)
    const questionnaire = await base44.entities.Questionnaire.create({
      client_id: client.id,
      client_name: client.name ?? user.name ?? user.email,
      type: "CustomIntake",
      status: "completed",
      submitted_date: new Date().toISOString(),

      // NEW expectation fields:
      intake_stage: stage, // initial | checkin_30 | checkin_60 | checkin_90 | annual_reset
      responses: formData,

      // NEW: store reflections as an array (starts empty)
      reflection_updates: [],
    });

    return Response.json({
      success: true,
      questionnaireId: questionnaire.id,
      clientId: client.id,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});