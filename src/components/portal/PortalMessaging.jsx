import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PortalMessaging({ messages, clientId, currentUser }) {
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      
      // Create notification for the other party
      if (currentUser.role !== 'admin') {
        // Client is sending - notify coach
        const clients = await base44.entities.Client.filter({ id: clientId });
        const client = clients[0];
        
        if (client?.created_by) {
          await base44.entities.Notification.create({
            type: "new_message",
            recipient_email: client.created_by,
            recipient_name: "Coach",
            client_id: clientId,
            status: "pending",
            scheduled_date: new Date().toISOString(),
            subject: "New Message from " + currentUser.full_name,
            message: `${currentUser.full_name} sent you a message: "${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}"`
          });
        }
      } else {
        // Admin/Coach is sending - notify client
        const clients = await base44.entities.Client.filter({ id: clientId });
        const client = clients[0];
        
        if (client?.email) {
          await base44.entities.Notification.create({
            type: "new_message",
            recipient_email: client.email,
            recipient_name: client.name,
            client_id: clientId,
            status: "pending",
            scheduled_date: new Date().toISOString(),
            subject: "New Message from Your Coach",
            message: `You have a new message: "${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}"`
          });
        }
      }
      
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", clientId] });
      setNewMessage("");
    }
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      client_id: clientId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      content: newMessage,
      read: false
    });
  };

  // Mark messages as read when viewing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Mark unread messages from others as read
    const unreadMessages = messages.filter(m => !m.read && m.sender_email !== currentUser.email);
    unreadMessages.forEach(msg => {
      base44.entities.Message.update(msg.id, { read: true });
    });
  }, [messages, currentUser]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-100">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_email === currentUser.email;
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  isOwn 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {message.sender_name} · {format(new Date(message.created_date), "MMM d, h:mm a")}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}