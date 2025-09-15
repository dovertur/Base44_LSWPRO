import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Zap,
  Target
} from "lucide-react";

export default function PerformanceOverview({ routines, executions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="border-0 shadow-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalExecutions = executions.length;
  const completedExecutions = executions.filter(e => e.status === 'completed').length;
  const completionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

  const totalDuration = executions.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const avgDuration = completedExecutions > 0 ? totalDuration / completedExecutions : 0;
  
  const overdueRoutines = routines.filter(r => 
    r.status === 'active' && 
    r.next_due_date && 
    new Date(r.next_due_date) < new Date()
  ).length;
  
  const totalRoutines = routines.length;

  const stats = [
    {
      title: "Overall Completion",
      value: `${completionRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: `${completedExecutions} of ${totalExecutions} routines completed`,
    },
    {
      title: "Avg. Duration",
      value: `${avgDuration.toFixed(0)} min`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Average time to complete a routine",
    },
    {
      title: "Active Routines",
      value: totalRoutines,
      icon: Target,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      description: "Total number of active routines",
    },
    {
      title: "Overdue Routines",
      value: overdueRoutines,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Routines that have passed their due date",
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-slate-500">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}