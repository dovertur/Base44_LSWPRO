
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Search, 
  Users, 
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Heart,
  Wrench,
  UserPlus,
  UserMinus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Routine } from "@/api/entities";
import { AuditLog } from "@/api/entities";
import { User } from "@/api/entities";

const industryConfig = {
  manufacturing: { 
    color: 'bg-orange-500', 
    lightColor: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Building2 
  },
  healthcare: { 
    color: 'bg-emerald-500', 
    lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Heart 
  },
  maintenance: { 
    color: 'bg-violet-500', 
    lightColor: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: Wrench 
  }
};

export default function TeamAssignments({ teamMembers, routines, onUpdate, isLoading }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedRoutines = routines.filter(r => r.assigned_to && r.assigned_to.length > 0);
  const unassignedRoutines = routines.filter(r => !r.assigned_to || r.assigned_to.length === 0);

  const handleAssignMember = async (routineId, memberEmail) => {
    setIsAssigning(true);
    try {
      const routine = routines.find(r => r.id === routineId);
      const currentAssignees = routine.assigned_to || [];
      
      if (!currentAssignees.includes(memberEmail)) {
        await Routine.update(routineId, {
          ...routine,
          assigned_to: [...currentAssignees, memberEmail]
        });

        const currentUser = await User.me();
        if (currentUser.tier === 'pro_plus') {
          const memberName = teamMembers.find(m => m.email === memberEmail)?.full_name || memberEmail;
          await AuditLog.create({
            actor_email: currentUser.email,
            action: 'routine.member.assign',
            entity_type: 'Routine',
            entity_id: routineId,
            details: `Assigned ${memberName} to routine: "${routine.title}"`,
            payload: { routineId, memberEmail }
          });
        }
        onUpdate();
      }
    } catch (error) {
      console.error('Error assigning member:', error);
    }
    setIsAssigning(false);
  };

  const handleUnassignMember = async (routineId, memberEmail) => {
    setIsAssigning(true);
    try {
      const routine = routines.find(r => r.id === routineId);
      const updatedAssignees = (routine.assigned_to || []).filter(email => email !== memberEmail);
      
      await Routine.update(routineId, {
        ...routine,
        assigned_to: updatedAssignees
      });
      
      const currentUser = await User.me();
      if (currentUser.tier === 'pro_plus') {
        const memberName = teamMembers.find(m => m.email === memberEmail)?.full_name || memberEmail;
        await AuditLog.create({
          actor_email: currentUser.email,
          action: 'routine.member.unassign',
          entity_type: 'Routine',
          entity_id: routineId,
          details: `Unassigned ${memberName} from routine: "${routine.title}"`,
          payload: { routineId, memberEmail }
        });
      }

      onUpdate();
    } catch (error) {
      console.error('Error unassigning member:', error);
    }
    setIsAssigning(false);
  };

  const filteredRoutines = routines.filter(routine => 
    routine.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssignmentStats = () => {
    const totalAssignments = routines.reduce((sum, r) => sum + (r.assigned_to?.length || 0), 0);
    const activeAssignments = assignedRoutines.filter(r => r.status === 'active').length;
    const criticalAssignments = assignedRoutines.filter(r => r.priority === 'critical').length;
    
    return { totalAssignments, activeAssignments, criticalAssignments };
  };

  const { totalAssignments, activeAssignments, criticalAssignments } = getAssignmentStats();

  return (
    <div className="space-y-6">
      {/* Assignment Summary */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalAssignments}</div>
                <div className="text-sm text-slate-500">Total Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{activeAssignments}</div>
                <div className="text-sm text-slate-500">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{criticalAssignments}</div>
                <div className="text-sm text-slate-500">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{unassignedRoutines.length}</div>
                <div className="text-sm text-slate-500">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Quick Assign */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search routines to assign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-300"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.email} value={member.email}>
                  {member.full_name || member.email.split('@')[0]} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            disabled={!selectedMember || isAssigning}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Bulk Assign
          </Button>
        </div>
      </div>

      {/* Routines List with Assignments */}
      <div className="space-y-4">
        {filteredRoutines.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No routines found</h3>
              <p className="text-slate-500">Try adjusting your search terms</p>
            </CardContent>
          </Card>
        ) : (
          filteredRoutines.map((routine) => {
            const config = industryConfig[routine.industry];
            const IconComponent = config.icon;
            const assignedMembers = routine.assigned_to || [];
            
            return (
              <Card key={routine.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                <div className={`h-1 ${config.color}`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${config.color} bg-opacity-10`}>
                        <IconComponent className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {routine.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={routine.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
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
                          </div>
                          <p className="text-slate-600 line-clamp-2">{routine.description}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {routine.estimated_duration || 30} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {routine.frequency}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {assignedMembers.length} assigned
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Section */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">Team Assignments</h4>
                      <Select
                        onValueChange={(memberEmail) => handleAssignMember(routine.id, memberEmail)}
                        disabled={isAssigning}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Assign member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers
                            .filter(member => !assignedMembers.includes(member.email))
                            .map((member) => (
                            <SelectItem key={member.email} value={member.email}>
                              {member.full_name || member.email.split('@')[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {assignedMembers.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <UserPlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No team members assigned</p>
                        <p className="text-slate-400 text-xs">Select a member from the dropdown above</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {assignedMembers.map((memberEmail) => {
                          const member = teamMembers.find(m => m.email === memberEmail);
                          if (!member) return null;
                          
                          return (
                            <div key={memberEmail} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {(member.full_name?.[0] || member.email[0]).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {member.full_name || member.email.split('@')[0]}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignMember(routine.id, memberEmail)}
                                disabled={isAssigning}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <UserMinus className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
