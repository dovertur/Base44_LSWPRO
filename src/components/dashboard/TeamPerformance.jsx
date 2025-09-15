
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPerformance({ executions, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Add defensive fallback
  const safeExecutions = executions || [];

  const getTeamStats = () => {
    const teamMap = {};
    
    safeExecutions.forEach(execution => {
      const email = execution.executed_by;
      const name = email.split('@')[0];
      
      if (!teamMap[email]) {
        teamMap[email] = {
          name,
          email,
          completed: 0,
          partial: 0,
          skipped: 0,
          total: 0
        };
      }
      
      teamMap[email][execution.status] += 1;
      teamMap[email].total += 1;
    });

    return Object.values(teamMap)
      .map(member => ({
        ...member,
        completionRate: member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  };

  const teamStats = getTeamStats();

  const getPerformanceBadge = (rate) => {
    if (rate >= 90) return { variant: "default", className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: TrendingUp };
    if (rate >= 75) return { variant: "default", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: TrendingUp };
    return { variant: "default", className: "bg-red-100 text-red-800 border-red-200", icon: TrendingDown };
  };

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamStats.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No team activity yet</p>
          </div>
        ) : (
          teamStats.map((member) => {
            const badge = getPerformanceBadge(member.completionRate);
            const BadgeIcon = badge.icon;
            
            return (
              <div key={member.email} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {member.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 capitalize">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.total} tasks this week
                    </p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <Badge className={badge.className}>
                    <BadgeIcon className="w-3 h-3 mr-1" />
                    {member.completionRate}%
                  </Badge>
                  <div className="text-xs text-slate-500">
                    {member.completed}C / {member.partial}P / {member.skipped}S
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
