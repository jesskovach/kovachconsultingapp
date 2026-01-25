import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Save, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function CalendlySettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["calendlySettings"],
    queryFn: async () => {
      const list = await base44.entities.CalendlySettings.list();
      return list[0];
    }
  });

  const [formData, setFormData] = useState({
    calendly_url: settings?.calendly_url || "",
    enabled: settings?.enabled ?? true
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.CalendlySettings.update(settings.id, data);
      } else {
        return base44.entities.CalendlySettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendlySettings"] });
      toast.success("Calendly settings saved");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Calendly Integration</h1>
          <p className="text-slate-500 mt-1">Let clients book sessions directly through Calendly</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Calendly Settings</h2>
              <p className="text-sm text-slate-500">Configure your Calendly booking link</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="calendly_url">Calendly URL</Label>
              <Input
                id="calendly_url"
                type="url"
                placeholder="https://calendly.com/your-username"
                value={formData.calendly_url}
                onChange={(e) => setFormData({ ...formData, calendly_url: e.target.value })}
              />
              <p className="text-sm text-slate-500">
                Your Calendly scheduling page URL. Clients will see this in their portal.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="enabled" className="font-medium">Enable Calendly Booking</Label>
                <p className="text-sm text-slate-500 mt-1">
                  Show the Calendly booking button to clients
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
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
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">How to get your Calendly URL:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="underline">calendly.com</a> and log in</li>
              <li>Copy your scheduling page URL (e.g., https://calendly.com/your-username)</li>
              <li>Paste it in the field above</li>
            </ol>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-100 p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">WhatsApp Support</h2>
              <p className="text-sm text-slate-500">Connect with our QA testing agent on WhatsApp</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Get instant help and support through WhatsApp. Our AI agent can assist with testing workflows and reporting issues.
          </p>

          <a
            href={base44.agents.getWhatsAppConnectURL('qa_tester')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Connect WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}