
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Clock, 
  Users, 
  Calendar,
  CheckSquare,
  Play,
  Pause,
  Edit,
  Trash2,
  AlertTriangle,
  Repeat // Added for recurrence
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Routine } from "@/api/entities";
import RoutineBuilder from "../routines/RoutineBuilder";
import { getIndustryConfig } from "@/components/shared/industryConfig";
import { auditRoutineStatusChange } from "@/components/shared/auditLogger"; // Added import

export default function RoutineDetails({ routine, onClose, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const config = getIndustryConfig(routine.industry);
  const IconComponent = config.icon;
  const isOverdue = isBefore(new Date(routine.next_due_date), startOfDay(new Date())) && routine.status === 'active';

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const oldStatus = routine.status; // Capture old status
      
      await Routine.update(routine.id, { 
        ...routine, 
        status: newStatus 
      });
      
      // Audit the status change
      await auditRoutineStatusChange(routine.id, routine.title, oldStatus, newStatus);
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating routine:', error);
    }
    setIsUpdating(false);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    onUpdate();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${config.color} bg-opacity-10`}>
                  <IconComponent className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    {routine.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={
                      routine.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      routine.status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      {routine.status}
                    </Badge>
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
                    {isOverdue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600 leading-relaxed">
                {routine.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Duration</p>
                    <p className="font-semibold text-slate-900">
                      {routine.estimated_duration || 30} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Repeat className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Frequency</p>
                    <p className="font-semibold text-slate-900 capitalize">
                      {routine.recurrence?.type && routine.recurrence.type !== 'none' ? `${routine.recurrence.type}` : 'Does not repeat'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {routine.next_due_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Next Due Date</p>
                      <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                        {format(new Date(routine.next_due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {routine.assigned_to && routine.assigned_to.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Assigned Team</p>
                      <p className="font-semibold text-slate-900">
                        {routine.assigned_to.length} member{routine.assigned_to.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Rate */}
            {routine.completion_rate !== undefined && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Completion Rate</h3>
                  <span className="text-2xl font-bold text-slate-900">
                    {Math.round(routine.completion_rate)}%
                  </span>
                </div>
                <Progress value={routine.completion_rate} className="h-3" />
              </div>
            )}

            {/* Checklist Items */}
            {routine.checklist_items && routine.checklist_items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">
                    Checklist ({routine.checklist_items.length} items)
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {routine.checklist_items.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded border-2 border-slate-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <span className="text-xs text-slate-500">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                          )}
                          {item.required && (
                            <Badge variant="outline" className="mt-1 text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
              {routine.status === 'active' ? (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange('paused')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause Routine
                </Button>
              ) : (
                <Button 
                  onClick={() => handleStatusChange('active')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Activate Routine
                </Button>
              )}
              
              <Button variant="outline" className="gap-2" onClick={handleEdit}>
                <Edit className="w-4 h-4" />
                Edit Routine
              </Button>
              
              <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <RoutineBuilder 
          editingRoutine={routine}
          onClose={handleEditClose}
        />
      )}
    </>
  );
}
