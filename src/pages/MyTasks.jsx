
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Routine } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertTriangle, Clock, Play, ArrowRight, ClipboardList } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/components/shared/industryConfig";
import { getRoutineTypeConfig } from "@/components/shared/routineTypeConfig"; // New import

export default function MyTasks() {
  const [assignedRoutines, setAssignedRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('today'); // New state for managing active tab

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user) {
          const allRoutines = await Routine.list();
          // Correctly filter for routines assigned to the user OR their team
          const userRoutines = allRoutines.filter(r => {
            const isAssignedToUser = (r.assigned_to || []).includes(user.email); // FIX: Added fallback
            const userTeamIds = new Set(user.team_ids || []); // Use Set for efficient lookup
            const isAssignedToTeam = (r.assigned_team_ids || []).some(teamId => userTeamIds.has(teamId)); // FIX: Added fallback
            return (isAssignedToUser || isAssignedToTeam) && r.status === 'active';
          });
          
          userRoutines.sort((a, b) => {
            if (!a.next_due_date) return 1;
            if (!b.next_due_date) return -1;
            return new Date(a.next_due_date) - new Date(b.next_due_date);
          });
          
          setAssignedRoutines(userRoutines); // Set the sorted userRoutines
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getDueDateInfo = (dateStr) => {
    if (!dateStr) {
      return { text: "No due date", color: "bg-slate-100 text-slate-700" };
    }
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) {
      return { text: `Overdue - ${format(date, "MMM d")}`, color: "bg-red-100 text-red-700" };
    }
    if (isToday(date)) {
      return { text: "Today", color: "bg-orange-100 text-orange-700" };
    }
    if (isTomorrow(date)) {
      return { text: "Tomorrow", color: "bg-yellow-100 text-yellow-700" };
    }
    return { text: format(date, "MMM d, yyyy"), color: "bg-slate-100 text-slate-700" };
  };

  // Memoized filtering logic for tasks based on the current tab
  const filteredTasks = useMemo(() => {
    if (!assignedRoutines.length) return [];
    
    switch (currentTab) {
      case 'today':
        return assignedRoutines.filter(r => r.next_due_date && isToday(new Date(r.next_due_date)));
      case 'upcoming':
        // Upcoming tasks are those that are not today and not in the past
        return assignedRoutines.filter(r => r.next_due_date && !isToday(new Date(r.next_due_date)) && !isPast(new Date(r.next_due_date)));
      case 'completed':
        // For 'active' routines, 'completed' is interpreted as tasks that are past their due date (overdue)
        return assignedRoutines.filter(r => r.next_due_date && isPast(new Date(r.next_due_date)) && !isToday(new Date(r.next_due_date)));
      default:
        return assignedRoutines;
    }
  }, [assignedRoutines, currentTab]);

  const TaskCard = ({ routine }) => {
    const industry = getIndustryConfig(routine.industry);
    const routineTypeConfig = getRoutineTypeConfig(routine.routine_type || 'routine');
    const dueDate = getDueDateInfo(routine.next_due_date);
    const TypeIconComponent = routineTypeConfig.icon;

    return (
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white group">
        <div className="h-2" style={{ backgroundColor: industry.color.replace('bg-', '') }} />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-slate-700">
                {routine.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={dueDate.color}>{dueDate.text}</Badge>
                <Badge className={routineTypeConfig.lightColor}>
                  <TypeIconComponent className="w-3 h-3 mr-1" />
                  {routineTypeConfig.shortName}
                </Badge>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${industry.color} bg-opacity-10`}>
                <industry.icon className={`w-6 h-6 ${industry.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 line-clamp-3">{routine.description}</p>
          <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {routine.estimated_duration || 30} min
              </div>
              <Badge variant="outline">{routine.priority}</Badge>
            </div>
            <Link to={createPageUrl(`ExecuteRoutine?id=${routine.id}`)}>
              <Button size="sm" className="gap-2">
                Start <Play className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6"> {/* Updated skeleton wrapper classes */}
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6"> {/* Updated top-level div classes */}

        {/* Header - Standardized */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <CheckSquare className="w-10 h-10 text-slate-700" />
              My Tasks
            </h1>
            <p className="text-lg text-slate-600">Manage and execute all your assigned routines.</p> {/* Updated description text */}
          </div>
        </div>

        {/* New secondary header for tab-like information */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            {currentTab === 'today' ? "Due Today" : currentTab === 'upcoming' ? "Upcoming" : "Overdue (Active)"} ({filteredTasks.length})
          </h2>
          {/*
            Tab navigation buttons (e.g., for "Today", "Upcoming", "Overdue") would typically go here.
            These are not included in the outline but would be necessary to change the `currentTab` state.
            Example:
            <div className="flex gap-2">
              <Button variant={currentTab === 'today' ? 'default' : 'outline'} onClick={() => setCurrentTab('today')}>Today</Button>
              <Button variant={currentTab === 'upcoming' ? 'default' : 'outline'} onClick={() => setCurrentTab('upcoming')}>Upcoming</Button>
              <Button variant={currentTab === 'completed' ? 'default' : 'outline'} onClick={() => setCurrentTab('completed')}>Overdue</Button>
            </div>
          */}
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredTasks.map((routine) => (
              <TaskCard key={routine.id} routine={routine} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border">
            <ClipboardList className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-800">
              {currentTab === 'today' ? "No tasks due today!" :
               currentTab === 'upcoming' ? "No upcoming tasks!" :
               currentTab === 'completed' ? "No overdue tasks!" :
               "All clear!"}
            </h2>
            <p className="text-slate-500 mt-2">
              {currentTab === 'today' ? "Enjoy your day, or check upcoming tasks." :
               currentTab === 'upcoming' ? "No routines are scheduled for the near future." :
               currentTab === 'completed' ? "No active tasks are currently overdue." :
               "You have no active routines assigned to you or your team."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
