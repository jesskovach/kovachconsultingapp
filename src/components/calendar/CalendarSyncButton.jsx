import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSyncButton({ session, variant = "outline", size = "sm" }) {
  const [syncing, setSyncing] = useState(false);

  const syncGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncGoogleCalendar', {
        sessionId: session.id,
        action: 'create'
      });
      
      // Check if the response contains an error
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Session added to Google Calendar!", {
        action: data?.eventLink ? {
          label: "View Event",
          onClick: () => window.open(data.eventLink, '_blank')
        } : undefined
      });
    },
    onError: (error) => {
      console.error("Calendar sync error:", error);
      toast.error(error.message || "Failed to sync with Google Calendar");
    }
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncGoogleMutation.mutateAsync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={syncing}
    >
      {syncing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Calendar className="w-4 h-4 mr-2" />
      )}
      Add to Calendar
    </Button>
  );
}