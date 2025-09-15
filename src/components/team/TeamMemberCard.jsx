
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  MoreHorizontal,
  UserCheck,
  Settings,
  MessageCircle,
  Crown // Add Crown icon for leaders
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserEntity } from '@/api/entities'; // Renamed to UserEntity to avoid conflict with lucide-react User
import { Team } from '@/api/entities'; // Import Team
import { AuditLog } from '@/api/entities'; // Import AuditLog
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { auditUserStatusChange } from "@/components/shared/auditLogger"; // Import for audit logging

const EditMemberModal = ({ member, allTeams, onClose, onUpdate, currentUser }) => { // Add currentUser
  const [selectedTeams, setSelectedTeams] = useState(new Set(member.team_ids || []));
  const [initialSelectedTeams] = useState(new Set(member.team_ids || [])); // Keep initial state

  const [leaderTeams, setLeaderTeams] = useState(new Set());
  const [initialLeaderTeams, setInitialLeaderTeams] = useState(new Set()); // Keep initial state

  useEffect(() => {
    // Initialize leader teams - teams where this member is a leader
    const memberLeaderTeams = allTeams
      .filter(team => team.leader_ids?.includes(member.id))
      .map(team => team.id);
    setLeaderTeams(new Set(memberLeaderTeams));
    setInitialLeaderTeams(new Set(memberLeaderTeams)); // Set initial leader teams
  }, [member, allTeams]);

  const handleTeamToggle = (teamId) => {
    const newSelection = new Set(selectedTeams);
    if (newSelection.has(teamId)) {
      newSelection.delete(teamId);
      // If removing team membership, also remove leadership for that specific team
      const newLeaderTeams = new Set(leaderTeams);
      newLeaderTeams.delete(teamId);
      setLeaderTeams(newLeaderTeams);
    } else {
      newSelection.add(teamId);
    }
    setSelectedTeams(newSelection);
  };

  const handleLeaderToggle = (teamId) => {
    const newLeaderTeams = new Set(leaderTeams);
    if (newLeaderTeams.has(teamId)) {
      newLeaderTeams.delete(teamId);
    } else {
      newLeaderTeams.add(teamId);
      // Auto-add team membership if making them a leader for this team
      const newSelection = new Set(selectedTeams);
      newSelection.add(teamId);
      setSelectedTeams(newSelection);
    }
    setLeaderTeams(newLeaderTeams);
  };

  const handleSave = async () => {
    try {
      // Update user team membership
      await UserEntity.update(member.id, { team_ids: Array.from(selectedTeams) });
      
      // Update team leadership for each team
      for (const team of allTeams) {
        const currentLeaders = team.leader_ids || [];
        const isCurrentlyLeader = currentLeaders.includes(member.id);
        const shouldBeLeader = leaderTeams.has(team.id);
        
        if (isCurrentlyLeader && !shouldBeLeader) {
          // Remove as leader
          const newLeaders = currentLeaders.filter(id => id !== member.id);
          await Team.update(team.id, { leader_ids: newLeaders });
        } else if (!isCurrentlyLeader && shouldBeLeader) {
          // Add as leader
          await Team.update(team.id, { leader_ids: [...currentLeaders, member.id] });
        }
      }

      // --- Enhanced Audit Logging ---
      if (currentUser.tier === 'pro_plus') {
        const memberName = member.full_name || member.email;
        
        // Log team assignment changes
        for (const teamId of allTeams.map(t => t.id)) {
          const teamName = allTeams.find(t => t.id === teamId)?.name;
          if (initialSelectedTeams.has(teamId) && !selectedTeams.has(teamId)) {
            await AuditLog.create({
              actor_email: currentUser.email,
              action: 'team.member.remove',
              entity_type: 'User',
              entity_id: member.id,
              details: `Removed ${memberName} from team: "${teamName}"`,
              payload: { teamId, userId: member.id, teamName, memberName }
            });
          }
          if (!initialSelectedTeams.has(teamId) && selectedTeams.has(teamId)) {
            await AuditLog.create({
              actor_email: currentUser.email,
              action: 'team.member.add',
              entity_type: 'User',
              entity_id: member.id,
              details: `Added ${memberName} to team: "${teamName}"`,
              payload: { teamId, userId: member.id, teamName, memberName }
            });
          }
        }
        
        // Log leadership changes
        for (const teamId of allTeams.map(t => t.id)) {
          const teamName = allTeams.find(t => t.id === teamId)?.name;
          if (initialLeaderTeams.has(teamId) && !leaderTeams.has(teamId)) {
            await AuditLog.create({
              actor_email: currentUser.email,
              action: 'team.leader.demote',
              entity_type: 'User',
              entity_id: member.id,
              details: `Removed ${memberName} as leader from team: "${teamName}"`,
              payload: { teamId, userId: member.id, teamName, memberName }
            });
          }
          if (!initialLeaderTeams.has(teamId) && leaderTeams.has(teamId)) {
            await AuditLog.create({
              actor_email: currentUser.email,
              action: 'team.leader.promote',
              entity_type: 'User',
              entity_id: member.id,
              details: `Promoted ${memberName} to leader of team: "${teamName}"`,
              payload: { teamId, userId: member.id, teamName, memberName }
            });
          }
        }
      }
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
      // Optionally, provide user feedback about the error
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member: {member.full_name || member.email.split('@')[0]}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold">Team Assignment & Leadership</h4>
            {allTeams.length > 0 ? allTeams.map(team => (
              <div key={team.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${team.id}`}
                    checked={selectedTeams.has(team.id)}
                    onCheckedChange={() => handleTeamToggle(team.id)}
                  />
                  <Label htmlFor={`team-${team.id}`} className="font-medium">{team.name}</Label>
                </div>
                {selectedTeams.has(team.id) && (
                  <div className="ml-6 flex items-center space-x-2">
                    <Checkbox
                      id={`leader-${team.id}`}
                      checked={leaderTeams.has(team.id)}
                      onCheckedChange={() => handleLeaderToggle(team.id)}
                    />
                    <Label htmlFor={`leader-${team.id}`} className="text-sm flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Team Leader
                    </Label>
                  </div>
                )}
              </div>
            )) : <p className="text-sm text-gray-500">No teams available.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function TeamMemberCard({ member, routines, onUpdate, currentUser, allTeams, onSendMessage, onDeactivate, onReactivate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if member is a leader of any team
  const isLeader = allTeams.some(team => team.leader_ids?.includes(member.id));

  const getRoleColor = () => {
    switch (member.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPerformanceBadge = () => {
    if (member.completionRate >= 90) return { text: "Excellent", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (member.completionRate >= 75) return { text: "Good", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    if (member.completionRate >= 50) return { text: "Fair", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { text: "Needs Help", color: "bg-red-100 text-red-700 border-red-200" };
  };

  const performanceBadge = getPerformanceBadge();

  const getInitials = () => {
    return member.full_name
      ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
      : member.email[0].toUpperCase();
  };

  const handleSendMessage = () => {
    // In a real implementation, this would open a messaging interface
    console.log(`Send message to ${member.email}`);
    onSendMessage?.(member); // Call the prop if provided
  };

  const handleDeactivate = async () => {
    try {
      setIsUpdating(true);
      await UserEntity.update(member.id, { is_suspended: true });
      
      // Audit the deactivation
      if (currentUser.tier === 'pro_plus') {
        await auditUserStatusChange(currentUser.email, member.id, member.email, 'deactivate');
      }
      
      onDeactivate?.(member);
      onUpdate(); // Trigger a re-fetch or state update in parent
    } catch (error) {
      console.error('Error deactivating user:', error);
      // Optionally, provide user feedback about the error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setIsUpdating(true);
      await UserEntity.update(member.id, { is_suspended: false });
      
      // Audit the reactivation
      if (currentUser.tier === 'pro_plus') {
        await auditUserStatusChange(currentUser.email, member.id, member.email, 'reactivate');
      }
      
      onReactivate?.(member);
      onUpdate(); // Trigger a re-fetch or state update in parent
    } catch (error) {
      console.error('Error reactivating user:', error);
      // Optionally, provide user feedback about the error
    } finally {
      setIsUpdating(false);
    }
  };


  const canEdit = currentUser && currentUser.role === 'admin' && currentUser.tier !== 'free';

  return (
    <>
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar with lazy loading */}
              <Avatar className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-slate-800 transition-colors">
                <AvatarImage 
                  src={member.custom_picture_url || ''} 
                  alt={member.full_name || "Member avatar"} 
                  loading="lazy" 
                />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  {member.full_name || member.email.split('@')[0]}
                  {member.is_suspended && (
                    <Badge variant="destructive" className="ml-2 text-xs">Suspended</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleColor()}>
                    {member.role}
                  </Badge>
                  {isLeader && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      <Crown className="w-3 h-3 mr-1" />
                      Leader
                    </Badge>
                  )}
                  {member.totalExecutions > 0 && (
                    <Badge className={performanceBadge.color}>
                      {performanceBadge.text}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isUpdating}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowEditModal(true)} disabled={isUpdating}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendMessage} disabled={isUpdating}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {member.is_suspended ? (
                    <DropdownMenuItem onClick={handleReactivate} disabled={isUpdating}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Reactivate User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleDeactivate} disabled={isUpdating}>
                      <User className="w-4 h-4 mr-2" />
                      Deactivate User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{member.email}</span>
          </div>

          {/* Team Membership */}
          {member.team_ids && member.team_ids.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500 uppercase">Teams</div>
              <div className="flex flex-wrap gap-1">
                {member.team_ids.map(teamId => {
                  const team = allTeams.find(t => t.id === teamId);
                  const isTeamLeader = team?.leader_ids?.includes(member.id);
                  
                  return team ? (
                    <Badge key={teamId} variant="outline" className="text-xs">
                      {isTeamLeader && <Crown className="w-2 h-2 mr-1" />}
                      {team.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {member.totalExecutions > 0 ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completion Rate</span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(member.completionRate)}%
                  </span>
                </div>
                <Progress
                  value={member.completionRate}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{member.assignedRoutines} assigned</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span>{member.completedExecutions} completed</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{member.avgDuration.toFixed(0)} min avg</span>
                  </div>

                  <div className="text-sm text-slate-600">
                    <span className="text-emerald-600 font-medium">{member.thisWeekExecutions}</span>
                    <span> this week</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs">Assign routines to get started</p>
            </div>
          )}

          {/* Last Activity */}
          {member.lastActivity && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Last active: {format(new Date(member.lastActivity), 'MMM d, yyyy')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showEditModal && (
        <EditMemberModal
          member={member}
          allTeams={allTeams}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdate}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
