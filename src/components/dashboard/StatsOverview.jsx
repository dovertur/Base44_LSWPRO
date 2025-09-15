
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users
} from "lucide-react";
import { startOfDay, isBefore } from "date-fns";

export default function StatsOverview({ routines, executions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="border-0 shadow-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Add defensive fallbacks for potentially undefined arrays
  const safeRoutines = routines || [];
  const safeExecutions = executions || [];

  const activeRoutines = safeRoutines.filter(r => r.status === 'active');
  const completedToday = safeExecutions.filter(e =>
    e.execution_date === new Date().toISOString().split('T')[0] &&
    e.status === 'completed'
  ).length;

  const overdueCount = safeRoutines.filter(r =>
    r.status === 'active' &&
    r.next_due_date &&
    isBefore(new Date(r.next_due_date), startOfDay(new Date())) // Fixed overdue calculation
  ).length;

  const avgCompletionRate = safeRoutines.length > 0
    ? safeRoutines.reduce((sum, r) => sum + (r.completion_rate || 0), 0) / safeRoutines.length
    : 0;

  const stats = [
    {
      title: "Active Routines",
      value: activeRoutines.length,
      icon: ClipboardList,
      color: "bg-slate-500",
      trend: "+12% vs last month"
    },
    {
      title: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      color: "bg-emerald-500",
      trend: `${completedToday > 0 ? '+' : ''}${completedToday} tasks`
    },
    {
      title: "Overdue Items",
      value: overdueCount,
      icon: AlertTriangle,
      color: overdueCount > 0 ? "bg-red-500" : "bg-slate-400",
      trend: overdueCount > 0 ? "Needs attention" : "All up to date"
    },
    {
      title: "Avg Completion",
      value: `${Math.round(avgCompletionRate)}%`,
      icon: TrendingUp,
      color: avgCompletionRate >= 80 ? "bg-emerald-500" : avgCompletionRate >= 60 ? "bg-yellow-500" : "bg-red-500",
      trend: avgCompletionRate >= 80 ? "Excellent" : "Room for improvement"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300">
          <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-5 rounded-full transform translate-x-8 -translate-y-8`} />
          <CardHeader className="pb-2 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            <p className="text-xs md:text-sm text-slate-500 leading-tight">
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
