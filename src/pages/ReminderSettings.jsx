import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, X, Save, Loader2, Clock, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ReminderSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["reminderSettings"],
    queryFn: async () => {
      const result = await base44.entities.ReminderSettings.list();
      return result.length > 0 ? result[0] : null;
    }
  });

  const [formData, setFormData] = useState({
    reminder_times: [24, 1],
    email_subject: "Reminder: Upcoming Coaching Session",
    email_template: "Hi {client_name},\n\nThis is a friendly reminder about your upcoming coaching session scheduled for {session_date} at {session_time}.\n\nSession Details:\n- Duration: {duration} minutes\n- Type: {type}\n\nLooking forward to our session!\n\nBest regards",
    enabled: true
  });

  const [newReminderTime, setNewReminderTime] = useState("");

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.ReminderSettings.update(settings.id, data);
      } else {
        return base44.entities.ReminderSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminderSettings"] });
      toast.success("Reminder settings saved");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    }
  });

  const testMutation = useMutation({
    mutationFn: () => base44.functions.invoke("sendSessionReminders"),
    onSuccess: (response) => {
      if (response.data.sent > 0) {
        toast.success(`Sent ${response.data.sent} reminder${response.data.sent !== 1 ? 's' : ''}`);
      } else {
        toast.info("No sessions to send reminders for");
      }
    },
    onError: (error) => {
      toast.error("Failed to send reminders: " + error.message);
    }
  });

  const handleAddReminderTime = () => {
    const hours = parseInt(newReminderTime);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Please enter a valid number of hours");
      return;
    }
    if (formData.reminder_times.includes(hours)) {
      toast.error("This reminder time already exists");
      return;
    }
    setFormData({
      ...formData,
      reminder_times: [...formData.reminder_times, hours].sort((a, b) => b - a)
    });
    setNewReminderTime("");
  };

  const handleRemoveReminderTime = (hours) => {
    setFormData({
      ...formData,
      reminder_times: formData.reminder_times.filter(h => h !== hours)
    });
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Session Reminders</h1>
          </div>
          <p className="text-slate-500">Configure automated email reminders for upcoming sessions</p>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Enable Reminders</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Automatically send email reminders to clients before their sessions
                </p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </motion.div>

          {/* Reminder Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Reminder Times</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Set when to send reminders before the session (in hours)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {formData.reminder_times.map((hours) => (
                <Badge
                  key={hours}
                  variant="outline"
                  className="px-3 py-1.5 bg-blue-50 border-blue-200 text-blue-700"
                >
                  {hours} hour{hours !== 1 ? 's' : ''} before
                  <button
                    onClick={() => handleRemoveReminderTime(hours)}
                    className="ml-2 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Hours before session"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddReminderTime()}
                className="max-w-xs"
              />
              <Button onClick={handleAddReminderTime} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </motion.div>

          {/* Email Template */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Email Template</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" className="text-slate-700">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.email_subject}
                  onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="template" className="text-slate-700">Email Body</Label>
                <Textarea
                  id="template"
                  value={formData.email_template}
                  onChange={(e) => setFormData({ ...formData, email_template: e.target.value })}
                  className="mt-1.5 min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Available placeholders: {"{client_name}"}, {"{session_date}"}, {"{session_time}"}, {"{duration}"}, {"{type}"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Test Reminders Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}