import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Users, ChevronRight, Mail, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ClientForm from "@/components/clients/ClientForm";

const stages = [
  { id: "lead", label: "Lead", color: "bg-slate-100 border-slate-200" },
  { id: "discovery", label: "Discovery", color: "bg-blue-50 border-blue-200" },
  { id: "proposal", label: "Proposal", color: "bg-violet-50 border-violet-200" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-50 border-amber-200" },
  { id: "won", label: "Won", color: "bg-emerald-50 border-emerald-200" },
  { id: "lost", label: "Lost", color: "bg-red-50 border-red-200" }
];

export default function Pipeline() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowForm(false);
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const clientId = result.draggableId;
    const newStage = result.destination.droppableId;
    
    updateMutation.mutate({
      id: clientId,
      data: { pipeline_stage: newStage }
    });
  };

  const getClientsByStage = (stageId) => {
    return clients.filter((c) => c.pipeline_stage === stageId);
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Sales Pipeline</h1>
            <p className="text-slate-500 mt-1">Track prospects through your coaching pipeline</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Prospect
          </Button>
        </motion.div>

        {/* Pipeline Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className={`rounded-xl ${stage.color} border p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">{stage.label}</h3>
                    <span className="text-sm text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {getClientsByStage(stage.id).length}
                    </span>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-white/50" : ""
                        }`}
                      >
                        {getClientsByStage(stage.id).map((client, index) => (
                          <Draggable key={client.id} draggableId={client.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg p-3 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-grab ${
                                  snapshot.isDragging ? "shadow-lg rotate-2" : ""
                                }`}
                              >
                                <Link 
                                  to={createPageUrl("ClientDetail") + `?id=${client.id}`}
                                  className="block group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                      {getInitials(client.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-slate-800 truncate group-hover:text-slate-600">
                                        {client.name}
                                      </h4>
                                      {client.role && (
                                        <p className="text-xs text-slate-500 truncate">{client.role}</p>
                                      )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-3 text-xs text-slate-400">
                                    {client.company && (
                                      <span className="flex items-center gap-1 truncate">
                                        <Building2 className="w-3 h-3" />
                                        {client.company}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Empty State */}
        {!isLoading && clients.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No prospects yet</h3>
            <p className="text-slate-500 mb-4">Start building your pipeline by adding prospects</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Prospect
            </Button>
          </div>
        )}
      </div>

      <ClientForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}