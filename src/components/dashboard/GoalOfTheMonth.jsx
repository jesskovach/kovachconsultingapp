import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, Award, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function GoalOfTheMonth() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: featuredGoals = [], isLoading } = useQuery({
    queryKey: ["featured-goals", currentMonth],
    queryFn: async () => {
      const response = await base44.functions.invoke('getClientGoals', { clientId: null });
      const allGoals = response.data.goals || [];
      return allGoals.filter(g => g.featured_month === currentMonth);
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const featureGoalMutation = useMutation({
    mutationFn: async ({ goalId, clientId }) => {
      await base44.asServiceRole.entities.Goal.update(goalId, {
        featured_month: currentMonth
      });
      return { goalId, clientId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-goals"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal featured for this month!");
    }
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-amber-100 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (featuredGoals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-700" />
          </div>
          <h3 className="font-semibold text-amber-900">Goal of the Month</h3>
        </div>
        <p className="text-sm text-amber-700 mb-4">
          Highlight outstanding client achievements this month
        </p>
        <p className="text-xs text-amber-600">
          Feature completed or high-progress goals to celebrate client success
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Crown className="w-5 h-5 text-amber-700" />
        </div>
        <h3 className="font-semibold text-amber-900">Goal of the Month</h3>
        <Badge className="bg-amber-100 text-amber-700 ml-auto">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>

      <div className="space-y-3">
        {featuredGoals.map((goal, index) => {
          const client = clients.find(c => c.id === goal.client_id);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 border-2 border-amber-300 shadow-md"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={createPageUrl("ClientDetail") + `?id=${goal.client_id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 block truncate"
                  >
                    {client?.name || 'Client'}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{goal.category}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-md flex-shrink-0">
                  <TrendingUp className="w-3 h-3 text-emerald-700" />
                  <span className="text-xs font-semibold text-emerald-700">{goal.progress}%</span>
                </div>
              </div>
              
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {goal.title}
              </h4>
              
              {goal.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {goal.description}
                </p>
              )}

              {goal.updates && goal.updates.length > 0 && (
                <div className="bg-slate-50 rounded-md p-2">
                  <p className="text-xs text-slate-500 mb-1">Latest Update:</p>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {goal.updates[goal.updates.length - 1].comment}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}