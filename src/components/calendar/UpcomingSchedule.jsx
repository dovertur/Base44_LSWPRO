
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";

export default function UpcomingSchedule({ routines, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const upcomingRoutines = routines
    .filter(routine => 
      routine.status === 'active' && 
      routine.next_due_date && 
      new Date(routine.next_due_date) >= new Date() && // Only show upcoming, not past
      new Date(routine.next_due_date) <= addDays(new Date(), 7)
    )
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date))
    .slice(0, 8);

  const getDaysDiff = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingRoutines.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No upcoming routines</p>
            <p className="text-xs">All caught up for the week!</p>
          </div>
        ) : (
          upcomingRoutines.map((routine) => {
            const config = getIndustryConfig(routine.industry);
            const IconComponent = config.icon;
            const daysDiff = getDaysDiff(routine.next_due_date);
            
            return (
              <div 
                key={routine.id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.color} bg-opacity-10 flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate mb-1">
                      {routine.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        routine.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                        routine.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }>
                        {routine.priority}
                      </Badge>
                      <Badge className={config.lightColor}>
                        {routine.industry}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{routine.estimated_duration || 30} min</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 font-medium ${
                        daysDiff === 'Today' ? 'text-orange-600' : 
                        'text-slate-600'
                      }`}>
                        <span>{daysDiff}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {upcomingRoutines.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Routines scheduled in the next 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
