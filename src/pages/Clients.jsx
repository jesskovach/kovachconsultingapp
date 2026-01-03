import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, Users, Grid, List, Archive, Trash2, ArchiveRestore, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ClientForm from "@/components/clients/ClientForm";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating client with data:', data);
      
      try {
        const client = await base44.entities.Client.create(data);
        console.log('Client created successfully:', client.id);
        
        // Try to invite user, but don't fail if user already exists
        try {
          await base44.users.inviteUser(client.email, "user");
          console.log('User invited successfully');
        } catch (error) {
          console.log('User invitation skipped:', error.message);
        }
        
        // Try to send welcome email, but don't fail the entire operation
        try {
          await base44.functions.invoke("sendWelcomeEmail", { clientId: client.id });
          console.log('Welcome email sent successfully');
        } catch (error) {
          console.log('Welcome email failed:', error.message);
        }
        
        return client;
      } catch (error) {
        console.error('Client creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowForm(false);
      console.log('Client creation completed');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      alert(`Failed to create client: ${error.message || error}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowForm(false);
      setEditingClient(null);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.update(id, { status: "archived", archived_date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.update(id, { status: "active", archived_date: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteDialog({ open: false, id: null });
    }
  });

  const handleSubmit = async (data) => {
    try {
      console.log('handleSubmit called with:', data);
      
      if (editingClient) {
        await updateMutation.mutateAsync({ id: editingClient.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      console.log('Mutation completed successfully');
    } catch (error) {
      console.error('handleSubmit error:', error);
      alert(`Failed to save client: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.company?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    prospect: clients.filter((c) => c.status === "prospect").length,
    paused: clients.filter((c) => c.status === "paused").length,
    completed: clients.filter((c) => c.status === "completed").length,
    archived: clients.filter((c) => c.status === "archived").length
  };

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-slate-100 text-slate-700",
    prospect: "bg-blue-100 text-blue-700",
    archived: "bg-slate-100 text-slate-500"
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Clients</h1>
            <p className="text-slate-500 mt-1">Manage your coaching clients</p>
          </div>
          <Button 
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                  <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                  <SelectItem value="prospect">Prospect ({statusCounts.prospect})</SelectItem>
                  <SelectItem value="paused">Paused ({statusCounts.paused})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                  <SelectItem value="archived">Archived ({statusCounts.archived})</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            <AnimatePresence>
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg hover:border-slate-200 transition-all group relative"
                >
                  <Link to={createPageUrl("ClientDetail") + `?id=${client.id}`} className="block">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          getInitials(client.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{client.name}</h3>
                        <p className="text-sm text-slate-500 truncate">{client.email}</p>
                        {client.company && (
                          <p className="text-xs text-slate-400 truncate mt-1">{client.company}</p>
                        )}
                        <Badge className={`${statusColors[client.status]} mt-2`}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingClient(client);
                          setShowForm(true);
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {client.status === 'archived' ? (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            unarchiveMutation.mutate(client.id);
                          }}>
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Unarchive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            archiveMutation.mutate(client.id);
                          }}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, id: client.id });
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No clients found</h3>
            <p className="text-slate-500 mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by adding your first client"}
            </p>
            {!search && statusFilter === "all" && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            )}
          </div>
        )}
      </div>

      <ClientForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingClient}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client and all associated data (sessions, goals, messages, documents, etc.). 
              This action cannot be undone. Consider archiving instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteClientMutation.mutate(deleteDialog.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}