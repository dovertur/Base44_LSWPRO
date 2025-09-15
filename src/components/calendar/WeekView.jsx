
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO, getHours, getMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";

export default function WeekView({ 
  currentDate, 
  onRoutineClick, 
  selectedDate,
  onDateClick,
  isLoading,
  getRoutinesForDate 
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60;

  // Helper functions
  const hasTime = (dateTimeString) => dateTimeString && dateTimeString.includes('T');
  
  const getMinutesFromStart = (dateTime) => {
    const date = parseISO(dateTime);
    return getHours(date) * 60 + getMinutes(date);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full mb-4" />
          <div className="flex">
            <Skeleton className="h-[1440px] w-16 mr-4" />
            <div className="flex-1 grid grid-cols-7 gap-4">
              {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-[1440px]" />)}
            </div>
          </div >
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Week Header */}
        <div className="grid grid-cols-[4rem_1fr] border-b border-slate-200">
          <div className="w-16 p-2"></div>
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="bg-white p-3 text-center">
                <div className="text-xs font-medium text-slate-500 uppercase">
                  {format(day, 'E')}
                </div>
                <div
                  className={`text-lg font-bold cursor-pointer rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1 transition-colors ${
                    isToday(day) ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-slate-100'
                  } ${isSameDay(day, selectedDate) ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => onDateClick(day)}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* All Day Event Section */}
        <div className="grid grid-cols-[4rem_1fr] border-b border-slate-200 min-h-[4rem]">
          <div className="w-16 flex items-center justify-center text-xs font-medium text-slate-500 p-2">All-day</div>
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {weekDays.map((day, dayIndex) => {
              const dayRoutines = getRoutinesForDate(day);
              const allDayRoutines = dayRoutines.filter(r => !hasTime(r.next_due_date));
              
              return (
                <div key={dayIndex} className="bg-white p-1 space-y-1 min-h-[3rem]">
                  {allDayRoutines.map((routine) => {
                    const config = getIndustryConfig(routine.industry);
                    return (
                      <div
                        key={routine.id}
                        className={`p-1 rounded-md text-xs cursor-pointer transition-all ${config.lightColor} hover:shadow-md`}
                        onClick={() => onRoutineClick(routine)}
                        title={routine.title}
                      >
                        <p className="font-semibold truncate">{routine.title}</p>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">{routine.priority}</Badge>
                          <Badge variant="outline" className="text-xs">{`${routine.estimated_duration || 30}m`}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Time Grid */}
        <div className="grid grid-cols-[4rem_1fr] overflow-x-auto" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time Axis */}
          <div className="w-16 bg-slate-50">
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

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 relative">
            {weekDays.map((day, dayIndex) => {
              const dayRoutines = getRoutinesForDate(day);
              const timedRoutines = dayRoutines.filter(r => hasTime(r.next_due_date));
              
              return (
                <div key={dayIndex} className="bg-white relative">
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
                    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);
                    
                    return (
                      <div
                        key={routine.id}
                        className={`absolute left-1 right-1 rounded-md cursor-pointer transition-all shadow-sm hover:shadow-md ${config.lightColor} border border-opacity-50`}
                        style={{ 
                          top: `${topPosition}px`,
                          height: `${height}px`,
                          zIndex: 10
                        }}
                        onClick={() => onRoutineClick(routine)}
                        title={`${routine.title} - ${format(parseISO(routine.next_due_date), 'h:mm a')}`}
                      >
                        <div className="p-1 h-full flex flex-col justify-center">
                          <p className="text-xs font-semibold truncate leading-tight">{routine.title}</p>
                          <p className="text-xs opacity-75 truncate">
                            {format(parseISO(routine.next_due_date), 'h:mm a')}
                          </p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs h-4 px-1">{routine.priority}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
