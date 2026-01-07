import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Linkedin, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LinkedInProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["linkedinProfile"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getLinkedInProfile");
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            LinkedIn Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            LinkedIn Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to load LinkedIn profile</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profile = data?.profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            LinkedIn Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {profile?.picture && (
              <img
                src={profile.picture}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 text-lg mb-2">
                {profile?.name}
              </h3>
              <Badge variant="outline" className="text-xs">
                <Linkedin className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}