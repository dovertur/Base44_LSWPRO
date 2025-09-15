
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Routine } from "@/api/entities";
import RoutineBuilder from "./RoutineBuilder"; // New import
import { getIndustryConfig } from "@/components/shared/industryConfig"; // Updated import path

export default function RoutinesList({ routines, isLoading, industryConfig, onUpdate }) {
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [editingRoutine, setEditingRoutine] = useState(null); // New state

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paused':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDueDateDisplay = (routine) => {
    if (!routine.next_due_date) return null;

    const dueDate = new Date(routine.next_due_date);
    const isOverdue = isPast(dueDate) && routine.status === 'active';

    let label = format(dueDate, 'MMM d, yyyy');
    if (isToday(dueDate)) label = 'Today';
    if (isTomorrow(dueDate)) label = 'Tomorrow';

    return {
      label,
      isOverdue,
      color: isOverdue ? 'text-red-600' :
             isToday(dueDate) ? 'text-orange-600' :
             'text-slate-600'
    };
  };

  const handleStatusChange = async (routine, newStatus) => {
    setUpdatingIds(prev => new Set([...prev, routine.id]));
    try {
      await Routine.update(routine.id, {
        ...routine,
        status: newStatus,
        next_due_date: newStatus === 'active' && !routine.next_due_date
          ? new Date().toISOString().split('T')[0]
          : routine.next_due_date
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating routine status:', error);
    }
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(routine.id);
      return newSet;
    });
  };

  const handleEdit = (routine) => { // New function
    setEditingRoutine(routine);
  };

  const handleEditClose = () => { // New function
    setEditingRoutine(null);
    onUpdate(); // Refresh the data after editing
  };

  return (
    <> {/* Wrap with fragment */}
      <div className="space-y-4">
        {routines.map((routine) => {
          const config = getIndustryConfig(routine.industry); // Use helper function
          const IconComponent = config.icon;
          const dueDateInfo = getDueDateDisplay(routine);
          const isUpdating = updatingIds.has(routine.id);

          return (
            <Card key={routine.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              {/* Industry accent bar */}
              <div className={`h-1 ${config.color}`} />

              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Main Content */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Industry Icon */}
                    <div className={`p-3 rounded-xl ${config.color} bg-opacity-10 flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Title and Badges */}
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {routine.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(routine.status)}>
                            {routine.status}
                          </Badge>
                          <Badge className={getPriorityColor(routine.priority)}>
                            {routine.priority}
                          </Badge>
                          <Badge className={config.lightColor}>
                            {routine.industry}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {routine.frequency}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 leading-relaxed line-clamp-2">
                        {routine.description}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                        {routine.estimated_duration && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{routine.estimated_duration} min</span>
                          </div>
                        )}

                        {routine.assigned_to && routine.assigned_to.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{routine.assigned_to.length} assigned</span>
                          </div>
                        )}

                        {routine.checklist_items && (
                          <div className="flex items-center gap-2">
                            <span>{routine.checklist_items.length} checklist items</span>
                          </div>
                        )}

                        {dueDateInfo && (
                          <div className={`flex items-center gap-2 ${dueDateInfo.color}`}>
                            {dueDateInfo.isOverdue && <AlertTriangle className="w-4 h-4" />}
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              Due: {dueDateInfo.label}
                              {dueDateInfo.isOverdue && " (Overdue)"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Completion Progress */}
                      {routine.completion_rate !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Completion Rate</span>
                            <span className="font-semibold text-slate-900">
                              {Math.round(routine.completion_rate)}%
                            </span>
                          </div>
                          <Progress
                            value={routine.completion_rate}
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isUpdating}
                        className="flex-shrink-0"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {routine.status === 'active' ? (
                        <DropdownMenuItem onClick={() => handleStatusChange(routine, 'paused')}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Routine
                        </DropdownMenuItem>
                      ) : routine.status === 'paused' || routine.status === 'draft' ? (
                        <DropdownMenuItem onClick={() => handleStatusChange(routine, 'active')}>
                          <Play className="w-4 h-4 mr-2" />
                          Activate Routine
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(routine)}> {/* Updated onClick */}
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Routine
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Routine
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingRoutine && (
        <RoutineBuilder
          editingRoutine={editingRoutine}
          onClose={handleEditClose}
        />
      )}
    </>
  );
}
