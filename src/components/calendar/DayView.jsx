
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, getHours, getMinutes, isToday } from "date-fns";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";

export default function DayView({ 
  selectedDate, 
  onRoutineClick,
  isLoading,
  getRoutinesForDate
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60;

  const hasTime = (dateTimeString) => dateTimeString && dateTimeString.includes('T');
  
  const getMinutesFromStart = (dateTime) => {
    const date = parseISO(dateTime);
    return getHours(date) * 60 + getMinutes(date);
  };

  const dayRoutines = getRoutinesForDate(selectedDate);
  const allDayRoutines = dayRoutines.filter(r => !hasTime(r.next_due_date));
  const timedRoutines = dayRoutines.filter(r => hasTime(r.next_due_date));

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-4" />
          <div className="flex">
            <Skeleton className="h-[1440px] w-16 mr-4" />
            <Skeleton className="h-[1440px] flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 p-4">
        <CardTitle className={`text-2xl font-bold ${isToday(selectedDate) ? 'text-slate-900' : 'text-slate-700'}`}>
          {isToday(selectedDate) && <Badge className="mr-3 bg-slate-900 text-white">Today</Badge>}
          {format(selectedDate, 'EEEE, MMMM d')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* All Day Section */}
        <div className="grid grid-cols-[4rem_1fr] border-b border-slate-200 min-h-[4rem]">
          <div className="w-16 flex items-center justify-center text-xs font-medium text-slate-500 p-2">All-day</div>
          <div className="p-2 space-y-2 border-l border-slate-200">
            {allDayRoutines.map((routine) => {
              const config = getIndustryConfig(routine.industry);
              return (
                <div
                  key={routine.id}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${config.lightColor} hover:shadow-md border border-opacity-50`}
                  onClick={() => onRoutineClick(routine)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{routine.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{routine.priority}</Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {routine.estimated_duration || 30}m
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {allDayRoutines.length === 0 && (
              <div className="text-center py-2 text-slate-400 text-sm">
                No all-day routines
              </div>
            )}
          </div>
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[4rem_1fr] relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time Axis */}
          <div className="w-16 bg-slate-50 border-r border-slate-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-slate-200"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <div className="absolute -top-2 left-2 text-xs font-medium text-slate-500">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
              </div>
            ))}
          </div>

          {/* Main Day Column */}
          <div className="relative bg-white">
            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-slate-100"
                style={{ 
                  top: `${hour * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT}px`
                }}
              />
            ))}
            
            {/* Timed Routines */}
            {timedRoutines.map((routine) => {
              const config = getIndustryConfig(routine.industry);
              const minutesFromStart = getMinutesFromStart(routine.next_due_date);
              const topPosition = (minutesFromStart / 60) * HOUR_HEIGHT;
              const duration = routine.estimated_duration || 30;
              const height = Math.max((duration / 60) * HOUR_HEIGHT, 30);
              
              return (
                <div
                  key={routine.id}
                  className={`absolute left-2 right-2 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md ${config.lightColor} border border-opacity-50`}
                  style={{ 
                    top: `${topPosition}px`,
                    height: `${height}px`,
                    zIndex: 10
                  }}
                  onClick={() => onRoutineClick(routine)}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm leading-tight">{routine.title}</p>
                      <p className="text-xs text-slate-600 ml-2">
                        {format(parseISO(routine.next_due_date), 'h:mm a')}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{routine.description}</p>
                    <div className="flex gap-2 mt-auto">
                      <Badge variant="outline" className="text-xs">{routine.priority}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {routine.estimated_duration || 30}m
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state for timed section */}
            {timedRoutines.length === 0 && allDayRoutines.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No routines scheduled for this day</p>
                  <p className="text-xs mt-1">Click on a routine in another view to reschedule it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
