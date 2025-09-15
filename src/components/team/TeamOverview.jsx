import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Award,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamOverview({ teamMembers, routines, executions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => 
    m.lastActivity && new Date(m.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const avgCompletionRate = teamMembers.length > 0
    ? teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length
    : 0;
  
  const topPerformer = teamMembers.reduce((best, member) => 
    member.completionRate > best.completionRate ? member : best, 
    { completionRate: 0, full_name: 'None' }
  );

  const totalAssignments = routines.reduce((sum, routine) => 
    sum + (routine.assigned_to?.length || 0), 0
  );

  const stats = [
    {
      title: "Total Team Members",
      value: totalMembers,
      icon: Users,
      color: "bg-slate-500",
      trend: `${activeMembers} active this week`,
      trendColor: "text-slate-600"
    },
    {
      title: "Avg Completion Rate",
      value: `${avgCompletionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: avgCompletionRate >= 80 ? "bg-emerald-500" : avgCompletionRate >= 60 ? "bg-yellow-500" : "bg-red-500",
      trend: avgCompletionRate >= 80 ? "Excellent team performance" : "Room for improvement",
      trendColor: avgCompletionRate >= 80 ? "text-emerald-600" : "text-yellow-600"
    },
    {
      title: "Top Performer",
      value: topPerformer.full_name?.split(' ')[0] || 'None',
      icon: Award,
      color: "bg-yellow-500",
      trend: `${topPerformer.completionRate.toFixed(1)}% completion rate`,
      trendColor: "text-yellow-600"
    },
    {
      title: "Active Assignments",
      value: totalAssignments,
      icon: CheckCircle2,
      color: "bg-blue-500",
      trend: `${routines.filter(r => r.status === 'active').length} active routines`,
      trendColor: "text-blue-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300">
          <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-5 rounded-full transform translate-x-8 -translate-y-8`} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            <p className={`text-sm ${stat.trendColor}`}>
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}