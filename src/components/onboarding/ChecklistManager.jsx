import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, X, GripVertical, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ChecklistManager({ open, onClose, onSave, initialTasks = [] }) {
  const [tasks, setTasks] = useState(
    initialTasks.length > 0
      ? initialTasks
      : [
          {
            id: Date.now().toString(),
            title: "Send welcome email",
            description: "Send personalized welcome email with next steps",
            order: 1
          }
        ]
  );

  const addTask = () => {
    const newTask = {
      id: Date.now().toString(),
      title: "",
      description: "",
      order: tasks.length + 1
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const reordered = items.map((task, index) => ({
      ...task,
      order: index + 1
    }));

    setTasks(reordered);
  };

  const handleSave = () => {
    const validTasks = tasks.filter(t => t.title.trim());
    onSave(validTasks);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold text-slate-800">
            Customize Onboarding Checklist
          </SheetTitle>
        </SheetHeader>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 mb-6"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-slate-50 rounded-lg p-4 border border-slate-200 ${
                          snapshot.isDragging ? "shadow-lg" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-2 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Task title"
                              value={task.title}
                              onChange={(e) => updateTask(task.id, "title", e.target.value)}
                              className="font-medium"
                            />
                            <Textarea
                              placeholder="Task description (optional)"
                              value={task.description}
                              onChange={(e) => updateTask(task.id, "description", e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTask(task.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="outline"
          onClick={addTask}
          className="w-full mb-6 border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-slate-800 hover:bg-slate-700"
          >
            Save Checklist
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}