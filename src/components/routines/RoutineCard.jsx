
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2,
  Building2,
  Heart,
  Wrench,
  Building,
  HardHat,
  Truck,
  Search,
  Shield,
  Archive
} from "lucide-react";
import { format, isToday, isTomorrow, addDays, isBefore, startOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Routine } from "@/api/entities";
import RoutineBuilder from "./RoutineBuilder";
import { getIndustryConfig } from "@/components/shared/industryConfig";
import { getRoutineTypeConfig } from "@/components/shared/routineTypeConfig";
import { canEditRoutine } from "@/components/shared/teamHelpers";
import { User } from "@/api/entities";
import { AuditLog } from "@/api/entities";
import { Team } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from '../shared/ConfirmationDialog';

export default function RoutineCard({ routine, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const { toast } = useToast();

  // Add defensive fallbacks for routine arrays and ensure other properties are consistent
  const safeRoutine = {
    ...routine,
    assigned_to: routine.assigned_to || [],
    assigned_team_ids: routine.assigned_team_ids || [],
    checklist_items: routine.checklist_items || [],
    attached_files: routine.attached_files || [],
    // Description, estimated_duration, completion_rate are not arrays,
    // but using safeRoutine for them makes display consistent.
    // Their existing checks (`!== undefined`, `|| 0`) still apply.
  };

  const loadUserAndPermissions = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Check if user can edit this routine using the original routine object
      const hasEditPermission = await canEditRoutine(user, routine);
      setCanEdit(hasEditPermission);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      setCurrentUser(null);
      setCanEdit(false);
    }
  }, [routine]);

  useEffect(() => {
    loadUserAndPermissions();
  }, [loadUserAndPermissions]);

  const getStatusColor = () => {
    switch (routine.status) { // Uses original routine.status
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paused':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'archived':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = () => {
    switch (routine.priority) { // Uses original routine.priority
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDueDateDisplay = () => {
    if (!routine.next_due_date) return null; // Uses original routine.next_due_date

    const dueDate = new Date(routine.next_due_date);
    const now = new Date();
    // Normalize dates to start of day for accurate day difference
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isOverdue = isBefore(dueDate, startOfDay(now));
    const daysDiff = Math.ceil((dueDateStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));

    let text = format(dueDate, 'MMM d');
    if (daysDiff === 0) text = 'Today';
    else if (daysDiff === 1) text = 'Tomorrow';
    else if (daysDiff === -1) text = 'Yesterday';
    else if (daysDiff < -1) text = `${Math.abs(daysDiff)} days overdue`;

    return {
      text,
      isOverdue,
      className: isOverdue ? 'text-red-600' : daysDiff <= 1 ? 'text-orange-600' : 'text-slate-600'
    };
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this routine.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await Routine.update(routine.id, { status: newStatus }); // Uses original routine.id and title for backend ops

      toast({
        title: "Status Updated",
        description: `Routine "${routine.title}" has been set to ${newStatus}.`,
      });

      if (currentUser?.tier === 'pro_plus') {
        const details = `Changed status of routine "${routine.title}" to ${newStatus}.`;
        await AuditLog.create({
          actor_email: currentUser.email,
          action: `routine.status.${newStatus}`,
          entity_type: "Routine",
          entity_id: routine.id,
          details: details,
          payload: { title: routine.title, newStatus: newStatus }
        });
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating routine status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the routine status. Please try again.",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete this routine.",
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
      return;
    }

    setIsUpdating(true);
    try {
      await Routine.delete(routine.id); // Uses original routine.id and title for backend ops

      toast({
        title: "Routine Deleted",
        description: `Routine "${routine.title}" has been permanently deleted.`,
      });

      if (currentUser?.tier === 'pro_plus') {
        const details = `Permanently deleted routine: "${routine.title}".`;
        await AuditLog.create({
          actor_email: currentUser.email,
          action: 'routine.delete',
          entity_type: "Routine",
          entity_id: routine.id,
          details: details,
          payload: { title: routine.title }
        });
      }

      onUpdate();
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the routine. Please try again.",
        variant: "destructive",
      });
    }
    setShowDeleteConfirm(false);
    setIsUpdating(false);
  };

  const handleEdit = () => {
    if (!canEdit) {
       toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this routine.",
        variant: "destructive",
      });
      return;
    }
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    onUpdate();
  };

  // Get the config and icon with safe access
  const config = getIndustryConfig(routine.industry); // Uses original routine.industry
  const routineTypeConfig = getRoutineTypeConfig(routine.routine_type || 'routine'); // Uses original routine.routine_type
  const IconComponent = config.icon;
  const TypeIconComponent = routineTypeConfig.icon;
  const dueDateInfo = getDueDateDisplay();

  return (
    <>
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        {/* Industry accent bar */}
        <div className={`absolute top-0 right-0 w-2 h-full ${
          routine.status === 'active' ? 'bg-emerald-500' : // Uses original routine.status
          routine.status === 'draft' ? 'bg-yellow-500' :
          routine.status === 'paused' ? 'bg-slate-500' : 'bg-red-500'
        }`} />

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 pr-2">
              <div className={`p-3 rounded-xl ${config.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors flex-shrink-0`}>
                <IconComponent className={`w-5 h-5 ${config.color.replace('bg-', 'text-')}`} />
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2">
                  {safeRoutine.title} {/* Changed to safeRoutine for consistency */}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={getStatusColor()}>
                    {routine.status} {/* Uses original routine.status */}
                  </Badge>
                  <Badge className={getPriorityColor()}>
                    {routine.priority} {/* Uses original routine.priority */}
                  </Badge>
                  <Badge className={routineTypeConfig.lightColor}>
                    <TypeIconComponent className="w-3 h-3 mr-1" />
                    {routineTypeConfig.shortName}
                  </Badge>
                  <Badge className={config.lightColor || 'bg-blue-100 text-blue-700'}>
                    {routine.frequency} {/* Uses original routine.frequency */}
                  </Badge>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  disabled={isUpdating}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={handleEdit} disabled={isUpdating}>
                      <Edit className="w-4 h-4 mr-2" />
                      <span>Edit Routine</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {routine.status !== 'active' && canEdit && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('active')}
                    className="text-emerald-600"
                    disabled={isUpdating}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    <span>Activate</span>
                  </DropdownMenuItem>
                )}

                {routine.status === 'active' && canEdit && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('paused')}
                    className="text-slate-600"
                    disabled={isUpdating}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    <span>Pause</span>
                  </DropdownMenuItem>
                )}
                
                {routine.status !== 'archived' && canEdit && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('archived')}
                    disabled={isUpdating}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    <span>Archive</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl(`Routines?query=${encodeURIComponent(routine.title)}`)}> {/* Uses original routine.title */}
                    <Search className="w-4 h-4 mr-2" />
                    <span>View Details</span>
                  </Link>
                </DropdownMenuItem>

                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isUpdating}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="text-slate-600 text-sm line-clamp-2">
            {safeRoutine.description}
          </p>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              {safeRoutine.estimated_duration !== undefined && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{safeRoutine.estimated_duration || 0} min</span>
                </div>
              )}
              {(safeRoutine.assigned_to.length > 0 || safeRoutine.assigned_team_ids.length > 0) && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>
                    {safeRoutine.assigned_to.length} users, {safeRoutine.assigned_team_ids.length} teams
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {dueDateInfo && (
                <div className={`flex items-center gap-2 text-sm ${dueDateInfo.className}`}>
                  {dueDateInfo.isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{dueDateInfo.text}</span>
                </div>
              )}
              {safeRoutine.completion_rate !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-medium">{Math.round(safeRoutine.completion_rate)}%</span>
                  </div>
                  <Progress value={safeRoutine.completion_rate} className="h-1" />
                </div>
              )}
            </div>
          </div>

          {/* Checklist Preview */}
          {safeRoutine.checklist_items.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="text-slate-500">Checklist items</span>
                <span className="font-medium">{safeRoutine.checklist_items.length} tasks</span>
              </div>
              <div className="space-y-1">
                {safeRoutine.checklist_items.slice(0, 2).map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {safeRoutine.checklist_items.length > 2 && (
                  <div className="text-xs text-slate-500 pl-5">
                    +{safeRoutine.checklist_items.length - 2} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permission indicator */}
          {!canEdit && currentUser && routine.created_by !== currentUser.email && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                View only - managed by {routine.owning_team_id ? 'team' : 'creator'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showEditModal && (
        <RoutineBuilder
          editingRoutine={routine} // Pass original routine to builder, it should handle its own defensive programming internally
          onClose={handleEditClose}
          mode="edit"
        />
      )}

      <ConfirmationDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Are you sure you want to delete this routine?"
        description="This action cannot be undone. This will permanently delete the routine and all of its associated execution history."
        confirmText="Yes, Delete Routine"
        isDestructive={true}
      />
    </>
  );
}
