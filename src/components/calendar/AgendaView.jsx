
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, isToday, isTomorrow, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { Clock, AlertTriangle, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";

export default function AgendaView({ 
  currentDate,
  routines, 
  executions, 
  onRoutineClick,
  isLoading,
  getRoutinesForDate // New prop for fetching routines for a specific date
}) {
  // Helper function to check if a routine has a specific time
  const hasSpecificTime = (dateTimeString) => {
    return dateTimeString && dateTimeString.includes('T');
  };

  // Helper function to get time from datetime string
  const getTimeFromDateTime = (dateTimeString) => {
    if (!hasSpecificTime(dateTimeString)) return null;
    try {
      return format(parseISO(dateTimeString), 'h:mm a');
    } catch {
      return null;
    }
  };

  // Helper function to sort routines by time within a day
  const sortRoutinesByTime = (routines) => {
    return routines.sort((a, b) => {
      const aHasTime = hasSpecificTime(a.next_due_date);
      const bHasTime = hasSpecificTime(b.next_due_date);
      
      // All-day routines (no specific time) go first
      if (!aHasTime && bHasTime) return -1;
      if (aHasTime && !bHasTime) return 1;
      if (!aHasTime && !bHasTime) {
        // Both all-day, sort by priority
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      }
      
      // Both have times, sort chronologically
      return new Date(a.next_due_date) - new Date(b.next_due_date);
    });
  };

  // Get routines for the next 30 days with filters applied and proper sorting
  const getUpcomingRoutines = () => {
    const upcoming = [];
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(currentDate, i);
      // Delegate the logic of finding, filtering, and recurring routines for this date to the prop function
      const dayRoutines = getRoutinesForDate(date);

      if (dayRoutines.length > 0) {
        upcoming.push({
          date,
          routines: sortRoutinesByTime(dayRoutines) // Apply time-based sorting
        });
      }
    }
    
    return upcoming;
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, 'EEEE, MMM d');
  };

  const upcomingDays = getUpcomingRoutines();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Agenda View
        </CardTitle>
        <p className="text-slate-600">
          Your upcoming routines for the next 30 days
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {upcomingDays.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Upcoming Routines</h3>
            <p className="text-slate-500">All clear for the next 30 days!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingDays.map((day, dayIndex) => {
              const overdue = day.routines.filter(r => 
                isBefore(new Date(r.next_due_date), startOfDay(new Date())) && r.status === 'active'
              ).length;
              
              return (
                <div key={dayIndex} className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-bold ${
                        isToday(day.date) ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {getDateLabel(day.date)}
                      </h3>
                      {isToday(day.date) && (
                        <Badge className="bg-slate-900 text-white">Today</Badge>
                      )}
                      {overdue > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {overdue} Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {day.routines.length} routine{day.routines.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Routines for this day */}
                  <div className="space-y-3 pl-4">
                    {day.routines.map((routine) => {
                      const config = getIndustryConfig(routine.industry);
                      const IconComponent = config.icon;
                      const isOverdue = isBefore(new Date(routine.next_due_date), startOfDay(new Date())) && routine.status === 'active';
                      
                      return (
                        <div
                          key={routine.id}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all duration-200 border
                            ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}
                            hover:shadow-sm
                          `}
                          onClick={() => onRoutineClick(routine)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.color} bg-opacity-10 flex-shrink-0`}>
                              <IconComponent className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-900">
                                    {routine.title}
                                  </h4>
                                  {/* Display scheduled time */}
                                  {hasSpecificTime(routine.next_due_date) ? (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {getTimeFromDateTime(routine.next_due_date)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-slate-500">
                                      All Day
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      Overdue
                                    </Badge>
                                  )}
                                  <Badge className={
                                    routine.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                    routine.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }>
                                    {routine.priority}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                {routine.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{routine.estimated_duration}m</span>
                                </div>
                                
                                {routine.assigned_to && routine.assigned_to.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{routine.assigned_to.length}</span>
                                  </div>
                                )}
                                
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {config.name}
                                </Badge>
                                
                                <span className="capitalize">{routine.frequency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
