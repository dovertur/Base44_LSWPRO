
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, isBefore, parseISO, startOfWeek, endOfWeek, startOfDay } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";

export default function CalendarGrid({ 
  currentDate,
  routines, // This prop is now redundant for calendarData generation but might be used elsewhere or passed down, keep it for now as per instructions.
  onDateClick, 
  onRoutineClick, 
  selectedDate, 
  isLoading,
  getRoutinesForDate // New prop
}) {
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar data inside the component
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const dateRange = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const calendarData = dateRange.map(date => {
    // Use the new getRoutinesForDate prop to fetch routines for the specific date
    const dayRoutines = getRoutinesForDate(date); 
    return {
      date,
      routines: dayRoutines,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      isSelected: isSameDay(date, selectedDate),
    };
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDayNames.map(day => (
              <div key={day} className="p-3 text-center font-semibold text-slate-600 text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array(35).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardContent className="p-6">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDayNames.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-slate-600 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((day, index) => {
            const hasRoutines = day.routines.length > 0;
            const hasOverdue = day.routines.some(r => 
              r.next_due_date && isBefore(parseISO(r.next_due_date), startOfDay(new Date())) && r.status === 'active' 
            );
            
            return (
              <div
                key={index}
                className={`
                  min-h-24 p-2 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                  ${day.isToday ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}
                  ${day.isSelected ? 'border-blue-500 bg-blue-50' : ''}
                  ${hasRoutines ? 'hover:border-slate-300' : 'hover:border-slate-200'}
                  hover:shadow-sm
                `}
                onClick={() => onDateClick(day.date)}
              >
                {/* Date Number */}
                <div className={`
                  text-sm font-semibold mb-2
                  ${day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                  ${day.isToday ? 'text-slate-900' : ''}
                `}>
                  {format(day.date, 'd')}
                  {hasOverdue && (
                    <AlertTriangle className="w-3 h-3 text-red-500 float-right mt-0.5" />
                  )}
                </div>

                {/* Routines */}
                <div className="space-y-1">
                  {day.routines.slice(0, 3).map((routine) => {
                    const config = getIndustryConfig(routine.industry);
                    const isOverdue = routine.next_due_date && isBefore(parseISO(routine.next_due_date), startOfDay(new Date())) && routine.status === 'active'; 
                    
                    return (
                      <div
                        key={routine.id}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer transition-colors
                          ${config.lightColor}
                          ${isOverdue ? 'border border-red-300' : ''}
                          hover:opacity-80
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRoutineClick(routine);
                        }}
                        title={routine.title}
                      >
                        <div className="flex items-center gap-1">
                          {isOverdue && <AlertTriangle className="w-2 h-2 text-red-600" />}
                          <span className="truncate">{routine.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {day.routines.length > 3 && (
                    <div className="text-xs text-slate-500 font-medium">
                      +{day.routines.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
