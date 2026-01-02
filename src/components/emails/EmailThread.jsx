import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Mail, Search, Send, Download, Inbox, ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function EmailThread({ clientId }) {
  const [search, setSearch] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails", clientId],
    queryFn: () => base44.entities.Email.filter({ client_id: clientId }, "-sent_date"),
    enabled: !!clientId
  });

  const filteredEmails = emails.filter(email => {
    const searchLower = search.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.body?.toLowerCase().includes(searchLower)
    );
  });

  const statusColors = {
    sent: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Email List */}
      {filteredEmails.length > 0 ? (
        <div className="space-y-3">
          {filteredEmails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    email.direction === "sent" 
                      ? "bg-blue-50 text-blue-600" 
                      : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {email.direction === "sent" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-800">{email.subject}</h4>
                      <Badge className={statusColors[email.status]}>
                        {email.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {email.body}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        {email.direction === "sent" ? (
                          <>
                            <Send className="w-3 h-3" />
                            To: {email.to_email}
                          </>
                        ) : (
                          <>
                            <Inbox className="w-3 h-3" />
                            From: {email.from_email}
                          </>
                        )}
                      </span>
                      {email.sent_date && (
                        <span>{format(new Date(email.sent_date), "MMM d, yyyy 'at' h:mm a")}</span>
                      )}
                    </div>

                    {email.attachments && email.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {email.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 rounded px-2 py-1"
                          >
                            <Download className="w-3 h-3" />
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">
            {search ? "No emails found" : "No email history yet"}
          </p>
        </div>
      )}
    </div>
  );
}