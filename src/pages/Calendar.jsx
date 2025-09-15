
import React, { useState, useEffect } from "react";
import { Routine, RoutineExecution } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  AlertTriangle,
  Grid3X3,
  List,
  Eye
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CalendarGrid from "../components/calendar/CalendarGrid";
import WeekView from "../components/calendar/WeekView";
import DayView from "../components/calendar/DayView";
import AgendaView from "../components/calendar/AgendaView";
import RoutineDetails from "../components/calendar/RoutineDetails";
import UpcomingSchedule from "../components/calendar/UpcomingSchedule";
import CalendarFilters from "../components/calendar/CalendarFilters";
import { calculateNextDueDate } from "@/components/shared/recurrence"; // Add this import
import { normalizeRoutineRecurrence } from "@/components/shared/recurrenceHelpers"; // Add this

export default function Calendar() {
  const [routines, setRoutines] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [view, setView] = useState("week");
  const [filters, setFilters] = useState({
    industry: "all",
    routine_type: "all",
    priority: "all",
    status: "all"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [routineData, executionData] = await Promise.all([
        Routine.list('-created_date'),
        RoutineExecution.list('-execution_date', 50)
      ]);
      setRoutines(routineData);
      setExecutions(executionData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
    setIsLoading(false);
  };

  const getRoutinesForDate = (date) => {
    const targetDate = startOfDay(date);
    const routinesForDate = [];

    routines.forEach((routine) => {
      if (routine.status !== 'active') return;

      // Apply filters first
      if (filters.industry !== "all" && routine.industry !== filters.industry) return;
      if (filters.routine_type !== "all" && (routine.routine_type || 'routine') !== filters.routine_type) return;
      if (filters.priority !== "all" && routine.priority !== filters.priority) return;

      // Normalize routine for backward compatibility
      const normalizedRoutine = normalizeRoutineRecurrence(routine);

      // Check if routine is due on this specific date
      if (normalizedRoutine.next_due_date) {
        const routineDueDate = startOfDay(new Date(normalizedRoutine.next_due_date));
        
        // Exact match: routine's next_due_date is exactly this date
        if (routineDueDate.getTime() === targetDate.getTime()) {
          routinesForDate.push(normalizedRoutine);
          return;
        }

        // For recurring routines, project future occurrences ONLY if current instance is not overdue
        if (normalizedRoutine.recurrence && normalizedRoutine.recurrence.type !== 'none') {
          const isCurrentlyOverdue = isBefore(routineDueDate, startOfDay(new Date()));
          
          // Only project future instances if the routine is not currently overdue
          if (!isCurrentlyOverdue && targetDate > routineDueDate) {
            // Calculate if this target date would be a valid occurrence
            let tempRoutine = { ...normalizedRoutine };
            let projectedDate = routineDueDate;
            let iterations = 0;
            const maxIterations = 100; // Safety limit

            while (projectedDate < targetDate && iterations < maxIterations) {
              const nextDate = calculateNextDueDate(tempRoutine);
              if (!nextDate) break; // Recurrence ended
              
              projectedDate = startOfDay(nextDate);
              tempRoutine.next_due_date = nextDate.toISOString();
              iterations++;

              if (projectedDate.getTime() === targetDate.getTime()) {
                // Create a projected instance for display
                const projectedRoutine = {
                  ...normalizedRoutine,
                  next_due_date: nextDate.toISOString(),
                  _isProjected: true // Mark as projected for UI purposes
                };
                routinesForDate.push(projectedRoutine);
                break;
              }
            }
          }
        }
      }
    });

    return routinesForDate;
  };

  const navigateDate = (direction) => {
    const isNext = direction === 'next';

    switch (view) {
      case 'month':
        setCurrentDate(isNext ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(isNext ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(isNext ? addDays(currentDate, 1) : subDays(currentDate, 1));
        setSelectedDate(isNext ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
        break;
      case 'agenda':
        setCurrentDate(isNext ? addWeeks(currentDate, 2) : subWeeks(currentDate, 2));
        break;
      default:
        setCurrentDate(isNext ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
    }
  };

  const handlePrev = () => navigateDate('prev');
  const handleNext = () => navigateDate('next');
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setSelectedRoutine(null);
    setView("day");
  };

  const handleRoutineClick = (routine) => {
    setSelectedRoutine(routine);
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'agenda':
        return 'Upcoming Schedule';
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const overdueCount = routines.filter((r) => {
    const normalized = normalizeRoutineRecurrence(r);
    return normalized.status === 'active' &&
      normalized.next_due_date &&
      isBefore(new Date(normalized.next_due_date), startOfDay(new Date()));
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-slate-700" />
              Routine Calendar
            </h1>
            <p className="text-lg text-slate-600">Schedule and track your routine execution.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl("Templates")}>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Routine
              </Button>
            </Link>
            {overdueCount > 0 &&
              <Link to={createPageUrl("Routines?status=overdue")}>
                <Button variant="destructive" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {overdueCount} Overdue
                </Button>
              </Link>
            }
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <h2 className="text-2xl font-bold text-slate-900 min-w-[250px] text-center">
                {getViewTitle()}
              </h2>

              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" onClick={handleToday} className="text-sm">
              Today
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <CalendarFilters filters={filters} onFilterChange={setFilters} />

            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className="text-xs">
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="text-xs">
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
                className="text-xs">
                Day
              </Button>
              <Button
                variant={view === 'agenda' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('agenda')}
                className="text-xs">
                Agenda
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className={view === 'day' || view === 'agenda' ? 'space-y-8' : 'grid lg:grid-cols-4 gap-8'}>
          <div className={view === 'day' || view === 'agenda' ? 'w-full' : 'lg:col-span-3'}>
            {view === 'month' &&
              <CalendarGrid
                currentDate={currentDate}
                onDateClick={handleDateClick}
                onRoutineClick={handleRoutineClick}
                selectedDate={selectedDate}
                isLoading={isLoading}
                getRoutinesForDate={getRoutinesForDate} />
            }
            {view === 'week' &&
              <WeekView
                currentDate={currentDate}
                onRoutineClick={handleRoutineClick}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
                isLoading={isLoading}
                getRoutinesForDate={getRoutinesForDate} />
            }
            {view === 'day' &&
              <DayView
                selectedDate={selectedDate}
                onRoutineClick={handleRoutineClick}
                isLoading={isLoading}
                getRoutinesForDate={getRoutinesForDate} />
            }
            {view === 'agenda' &&
              <AgendaView
                currentDate={currentDate}
                executions={executions}
                onRoutineClick={handleRoutineClick}
                isLoading={isLoading}
                getRoutinesForDate={getRoutinesForDate} />
            }
          </div>

          {(view === 'month' || view === 'week') &&
            <div className="space-y-6">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
                  <p className="text-slate-600">
                    {getRoutinesForDate(selectedDate).length} routine{getRoutinesForDate(selectedDate).length !== 1 ? 's' : ''} scheduled
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getRoutinesForDate(selectedDate).length === 0 ?
                    <div className="text-center py-6 text-slate-500">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No routines scheduled</p>
                    </div> :
                    getRoutinesForDate(selectedDate).map((routine) => {
                      const isOverdue = isBefore(new Date(routine.next_due_date), startOfDay(new Date())) && routine.status === 'active'; // Fixed overdue calculation

                      return (
                        <div
                          key={routine.id + (routine._isProjected ? '_proj_' + routine.next_due_date : '')} // Unique key for projected routines
                          className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
                          onClick={() => handleRoutineClick(routine)}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm truncate">
                                {routine.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={
                                  routine.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                    routine.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                }>
                                  {routine.priority}
                                </Badge>
                                {isOverdue &&
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                }
                                {routine._isProjected &&
                                  <Badge variant="outline" className="text-xs border-dashed text-slate-500 bg-slate-50">
                                    Projected
                                  </Badge>
                                }
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {routine.estimated_duration || 30} min
                                {routine.assigned_to && routine.assigned_to.length > 0 &&
                                  <>
                                    <Users className="w-3 h-3 ml-1" />
                                    {routine.assigned_to.length}
                                  </>
                                }
                              </div>
                            </div>
                          </div>
                        </div>);
                    })
                  }
                </CardContent>
              </Card>

              <UpcomingSchedule
                routines={routines}
                isLoading={isLoading} />
            </div>
          }
        </div>

        {selectedRoutine &&
          <RoutineDetails
            routine={selectedRoutine}
            onClose={() => setSelectedRoutine(null)}
            onUpdate={loadData} />
        }
      </div>
    </div>);
}
