
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, addDays, startOfDay, isBefore } from "date-fns";
import { Clock, AlertTriangle, CheckCircle2, ArrowRight, MoreHorizontal, Play, Pause, Edit, Trash2, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getIndustryConfig } from "@/components/shared/industryConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Routine } from "@/api/entities";
import { User } from "@/api/entities";
import { AuditLog } from "@/api/entities";
import { canEditRoutine } from "@/components/shared/teamHelpers";
import RoutineBuilder from "../routines/RoutineBuilder";
import { useToast } from "@/components/ui/use-toast";

export default function UpcomingRoutines({ routines, isLoading, onUpdate }) {
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Add comprehensive array safety
  const safeRoutines = Array.isArray(routines) ? routines : [];
  
  const upcomingRoutines = safeRoutines
    .filter(routine => 
      routine && 
      routine.status === 'active' && 
      routine.next_due_date && 
      new Date(routine.next_due_date) <= addDays(new Date(), 7)
    )
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date))
    .slice(0, 5);

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getUrgencyColor = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    // FIXED: Use proper overdue check
    if (isBefore(date, startOfDay(now))) return "bg-red-100 text-red-700 border-red-200";
    if (isToday(date)) return "bg-orange-100 text-orange-700 border-orange-200";
    if (isTomorrow(date)) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleStatusChange = async (routine, newStatus) => {
    if (!currentUser) return;
    
    const hasPermission = await canEditRoutine(currentUser, routine);
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this routine.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingIds(prev => new Set([...prev, routine.id]));
    try {
      await Routine.update(routine.id, { status: newStatus });

      toast({
        title: "Status Updated",
        description: `Routine "${routine.title}" has been set to ${newStatus}.`,
      });

      if (currentUser?.tier === 'pro_plus') {
        const details = `Changed status of routine "${routine.title}" to ${newStatus} from dashboard.`;
        await AuditLog.create({
          actor_email: currentUser.email,
          action: `routine.status.${newStatus}`,
          entity_type: "Routine",
          entity_id: routine.id,
          details: details,
          payload: { title: routine.title, newStatus: newStatus }
        });
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating routine status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the routine's status.",
        variant: "destructive",
      });
    }
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(routine.id);
      return newSet;
    });
  };

  const handleEdit = async (routine) => {
    if (!currentUser) return;
    
    const hasPermission = await canEditRoutine(currentUser, routine);
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this routine.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingRoutine(routine);
  };

  const handleEditClose = () => {
    setEditingRoutine(null);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Upcoming Routines
            </CardTitle>
            <Link to={createPageUrl("Routines")}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingRoutines.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">All routines are up to date!</p>
              <p className="text-slate-400 text-sm">Great work keeping everything on track.</p>
            </div>
          ) : (
            upcomingRoutines.map((routine) => {
              const config = getIndustryConfig(routine.industry);
              const IconComponent = config.icon;
              const isUpdating = updatingIds.has(routine.id);
              
              // FIXED: Properly calculate overdue status
              const isOverdue = isBefore(new Date(routine.next_due_date), startOfDay(new Date()));
              
              // Add safety for routine arrays
              const assignedTo = Array.isArray(routine.assigned_to) ? routine.assigned_to : [];
              
              return (
                <div 
                  key={routine.id}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                      <div className={`p-2 rounded-lg ${config.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1 sm:line-clamp-2">
                          {routine.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1 sm:line-clamp-2">
                          {routine.description}
                        </p>
                        {/* Badges - Allow wrapping on mobile, keep inline on desktop */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                          <Badge className={`${config.lightColor} text-xs`}>
                            {routine.industry}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">{routine.estimated_duration || 30} min</span>
                            <span className="sm:hidden">{routine.estimated_duration || 30}m</span>
                            {assignedTo.length > 0 && 
                              <>
                                <Users className="w-3 h-3 ml-1" />
                                {assignedTo.length}
                              </>
                            }
                          </div>
                          {routine.priority === 'critical' && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Protected from shrinking */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right space-y-1 sm:space-y-2">
                        <Badge className={`${getUrgencyColor(routine.next_due_date)} text-xs whitespace-nowrap`}>
                          {getDateLabel(routine.next_due_date)}
                        </Badge>
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">Overdue</span>
                            <span className="sm:hidden">!</span>
                          </div>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-8 h-8"
                            disabled={isUpdating}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(routine)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Routine
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {routine.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(routine, 'paused')}
                              className="text-slate-600"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleStatusChange(routine, 'archived')}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`Routines?query=${encodeURIComponent(routine.title)}`)}>
                              <Search className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingRoutine && (
        <RoutineBuilder
          editingRoutine={editingRoutine}
          onClose={handleEditClose}
          mode="edit"
        />
      )}
    </>
  );
}
