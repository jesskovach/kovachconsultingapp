<div className="min-h-screen bg-background">
  {/* Header */}
  <div className="bg-card border-b border-border">
    <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {client.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Client Portal
        </p>
      </div>

      <Button variant="outline" onClick={() => base44.auth.logout()}>
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  </div>

  {/* Main */}
  <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

    {/* Primary Actions */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {calendlySettings?.enabled && calendlySettings?.calendly_url && (
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Schedule a Session
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Book your next coaching session.
          </p>
          <Button asChild variant="outline">
            <a
              href={calendlySettings.calendly_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Session
            </a>
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-md p-6">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Intake & Updates
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Complete or update your intake questionnaire.
        </p>
        <Button asChild variant="outline">
          <a href={createPageUrl("CustomIntake")}>
            <FileText className="w-4 h-4 mr-2" />
            Open Form
          </a>
        </Button>
      </div>
    </div>

    {/* Snapshot */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-card border border-border rounded-md p-6">
        <p className="text-sm text-muted-foreground mb-1">Active Goals</p>
        <p className="text-2xl font-semibold text-foreground">
          {goals.length}
        </p>
      </div>

      <div className="bg-card border border-border rounded-md p-6">
        <p className="text-sm text-muted-foreground mb-1">
          Sessions Completed
        </p>
        <p className="text-2xl font-semibold text-foreground">
          {sessions.filter(s => s.status === "completed").length}
        </p>
      </div>

      <div className="bg-card border border-border rounded-md p-6">
        <p className="text-sm text-muted-foreground mb-1">
          Messages
        </p>
        <p className="text-2xl font-semibold text-foreground">
          {messages.length}
        </p>
      </div>
    </div>

    {/* Goals + Upcoming */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">
          Current Goals
        </h3>
        <PortalGoals
          goals={goals.slice(0, 3)}
          onAddGoal={() => {
            setEditingGoal(null);
            setShowGoalForm(true);
          }}
          onEditGoal={(goal) => {
            setEditingGoal(goal);
            setShowGoalForm(true);
          }}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">
          Upcoming Sessions
        </h3>
        <PortalSessions
          sessions={sessions
            .filter(s => s.status === "scheduled")
            .slice(0, 3)}
          onProvideFeedback={setFeedbackSession}
          clientId={client.id}
          clientName={client.name}
        />
      </div>
    </div>

  </div>
</div>