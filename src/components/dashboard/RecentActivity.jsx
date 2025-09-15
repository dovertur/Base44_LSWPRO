
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig"; // Import helper

export default function RecentActivity({ executions, routines, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Add defensive fallbacks
  const safeExecutions = executions || [];
  const safeRoutines = routines || [];

  const getRoutineById = (id) => safeRoutines.find(r => r.id === id);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'skipped':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'skipped':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeExecutions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent activity</p>
          </div>
        ) : (
          safeExecutions.slice(0, 5).map((execution) => {
            const routine = getRoutineById(execution.routine_id);
            if (!routine) return null;
            
            const config = getIndustryConfig(routine.industry);
            const IconComponent = config.icon;

            return (
              <div 
                key={execution.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 bg-slate-50/50"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(execution.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {routine.title}
                    </h4>
                    <Badge className={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {execution.executed_by.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1">
                      <IconComponent className="w-3 h-3" />
                      {config.name}
                    </div>
                    <span>
                      {format(new Date(execution.execution_date), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  {execution.notes && (
                    <p className="text-sm text-slate-600 bg-white rounded-lg px-3 py-2 border">
                      {execution.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
