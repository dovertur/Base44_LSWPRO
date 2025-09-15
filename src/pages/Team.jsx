
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { Routine, RoutineExecution } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Target,
  Plus,
  ClipboardList,
  Crown,
  Settings,
  MessageCircle,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Team as TeamEntity } from "@/api/entities";
import { AuditLog } from "@/api/entities";
import UpgradeModal from "../components/shared/UpgradeModal";
import { SendEmail } from "@/api/integrations";
import { toast, useToast } from "@/components/ui/use-toast";
import { isToday, isTomorrow, isPast, format as formatDate } from 'date-fns';

// Import Team components
import TeamOverview from "../components/team/TeamOverview";
import TeamPerformanceChart from "../components/team/TeamPerformanceChart";
import WorkloadDistribution from "../components/team/WorkloadDistribution";
import TeamAssignments from "../components/team/TeamAssignments";
import InviteMemberDialog from "../components/team/InviteMemberDialog";
import SendMessageDialog from "../components/team/SendMessageDialog";

// Enhanced imports for permission helpers
import { canManageTeamMembers, getUserLeaderTeams, isTeamLeader as checkIsTeamLeader } from "@/components/shared/teamHelpers";


// New component for managing teams
const TeamManagement = ({ teams, routines, members, onUpdate, currentUser, onSendReport, userLeaderTeams }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamNameError, setTeamNameError] = useState('');

  const { toast } = useToast();

  const isAdmin = currentUser?.role === 'admin';

  const handleOpenForm = (team = null) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can create or edit teams.",
        variant: "destructive",
      });
      return;
    }
    setEditingTeam(team);
    setTeamName(team ? team.name : "");
    setTeamDescription(team ? team.description : "");
    setTeamNameError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
    setTeamName("");
    setTeamDescription("");
    setTeamNameError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can create or edit teams.",
        variant: "destructive",
      });
      return;
    }

    if (!teamName.trim()) {
      setTeamNameError('Team name is required.');
      return;
    }

    try {
      const currentUserData = await User.me();
      let action = '';
      let details = '';
      let teamId;
      let successMessage = '';
      let teamToastsName = teamName;

      if (editingTeam) {
        const updatedTeam = await TeamEntity.update(editingTeam.id, { name: teamName, description: teamDescription });
        action = 'team.update';
        details = `Updated team: "${teamName}"`;
        teamId = editingTeam.id;
        teamToastsName = updatedTeam.name;
        successMessage = `The team "${teamToastsName}" has been successfully updated.`
      } else {
        const newTeam = await TeamEntity.create({ name: teamName, description: teamDescription, leader_ids: [] });
        action = 'team.create';
        details = `Created new team: "${teamName}"`;
        teamId = newTeam.id;
        teamToastsName = newTeam.name;
        successMessage = `The team "${teamToastsName}" has been successfully created.`
      }

      if (currentUserData && currentUserData.tier === 'pro_plus') {
        await AuditLog.create({
            actor_email: currentUserData.email,
            action: action,
            entity_type: "Team",
            entity_id: teamId,
            details: details,
            payload: { name: teamName, description: teamDescription }
        });
      }

      toast({
        title: editingTeam ? "Team Updated" : "Team Created",
        description: successMessage,
      });

      onUpdate();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving team:", error);
      toast({
        title: "Error",
        description: "Failed to save team. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Teams Overview
        </CardTitle>
        {isAdmin && (
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No teams created yet. Click "Create Team" to get started.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
              const teamMembers = members.filter(m => (m.team_ids || []).includes(team.id));
              const assignedRoutines = routines.filter(r => (r.assigned_team_ids || []).includes(team.id) && r.status === 'active');
              const teamLeaders = teamMembers.filter(m => (team.leader_ids || []).includes(m.id));
              const isLeader = checkIsTeamLeader(currentUser, team, userLeaderTeams);

              return (
                <Card key={team.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="text-xl">{team.name}</span>
                      {isAdmin && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(team)}>
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-500 pt-1">{team.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Members</span>
                      <span className="font-bold text-slate-800">{teamMembers.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Active Routines</span>
                      <span className="font-bold text-slate-800">{assignedRoutines.length}</span>
                    </div>
                    {teamLeaders.length > 0 && (
                      <div className="pt-3 border-t">
                        <h4 className="text-xs text-slate-500 font-semibold mb-2">LEADERS</h4>
                        <div className="flex flex-wrap gap-2">
                          {teamLeaders.map(leader => (
                             <Badge key={leader.id} variant="secondary" className="gap-1 text-xs">
                               <Crown className="w-3 h-3 text-yellow-600" />
                               {leader.full_name || leader.email.split('@')[0]}
                             </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  {(isAdmin || isLeader) && (
                     <CardFooter className="bg-slate-50 p-4 border-t">
                        <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => onSendReport(team)}>
                          <Mail className="w-4 h-4" />
                          Send Team Performance Report
                        </Button>
                      </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
            <DialogDescription>
              {editingTeam ? "Modify the details of this team." : "Create a new team to organize your members and routines."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Marketing Team"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (teamNameError) setTeamNameError('');
                }}
                className={teamNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required
              />
              {teamNameError && <p className="text-red-500 text-sm mt-1">{teamNameError}</p>}
            </div>
            <div>
              <Label htmlFor="team-desc">Description (Optional)</Label>
              <Input
                id="team-desc"
                placeholder="Brief description of the team's purpose"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button type="submit">{editingTeam ? "Save Changes" : "Create Team"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Enhanced TeamMemberCard with nudge email option - Definition now included here
const TeamMemberCard = ({ member, onUpdate, currentUser, teams, userLeaderTeams, onSendNudge, onOpenMessageModal }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [memberTeams, setMemberTeams] = useState(member.team_ids || []);

  const { toast } = useToast();

  const teamBadges = teams.filter(team => memberTeams.includes(team.id));

  const isAdmin = currentUser?.role === 'admin';
  const isSelf = currentUser?.id === member.id;
  const isLeaderOfMemberTeam = (member.team_ids || []).some(teamId =>
    userLeaderTeams.some(leaderTeam => leaderTeam.id === teamId)
  );

  // User can edit if admin, or if they are a leader of one of the member's teams, or if it's themselves.
  const canEdit = isAdmin || isLeaderOfMemberTeam || isSelf;
  // User can manage teams for the member if admin or a leader of one of the member's teams
  const canManageTeamsForMember = isAdmin || isLeaderOfMemberTeam;


  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!canManageTeamsForMember && !isSelf) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to manage this member's team assignments.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await User.update(member.id, { team_ids: memberTeams });
      toast({
        title: "Member Updated",
        description: `${member.full_name || member.email}'s team assignments have been updated.`,
      });
      onUpdate(); // Reload data to reflect changes
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTeam = (teamId) => {
    setMemberTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSendMessageClick = () => {
    onOpenMessageModal(member); // Parent will handle permission check
  };

  const handleSendNudgeClick = () => {
    onSendNudge(member); // Parent will handle permission check
  };

  return (
    <>
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                {member.full_name || member.email.split('@')[0]}
                {member.role === 'admin' && (
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-200 bg-purple-50">
                    <span>Admin</span>
                  </Badge>
                )}
                {isSelf && (
                  <Badge variant="outline" className="text-xs text-slate-600 border-slate-200 bg-slate-50">You</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">{member.email}</p>
              {member.job_title && (
                <p className="text-sm font-medium text-slate-600 mt-1">{member.job_title}</p>
              )}
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
                  <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canManageTeamsForMember && ( // Only allow managing if admin or leader of member's team
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Member
                    </DropdownMenuItem>
                  )}
                  {(isAdmin || isLeaderOfMemberTeam) && ( // Nudge and message are for management
                    <>
                      <DropdownMenuItem onClick={handleSendNudgeClick}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Task Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSendMessageClick}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {member.canViewDetails ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Target className="w-4 h-4" /> Assigned Routines</span>
                <span className="font-bold text-slate-800">{member.assignedRoutinesCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Award className="w-4 h-4" /> Completion Rate</span>
                <span className={`font-bold ${(member.completionRate || 0) >= 80 ? 'text-green-600' : (member.completionRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(member.completionRate || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Avg. Duration</span>
                <span className="font-bold text-slate-800">{(member.avgDuration || 0).toFixed(0)} min</span>
              </div>
              {member.lastActivity && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Last Activity</span>
                  <span className="font-bold text-slate-800">
                    {new Date(member.lastActivity).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-500 py-4">
              <Lock className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">No detailed performance data available for this member.</p>
              <p className="text-xs">You must be an admin or a leader of one of their teams to view.</p>
            </div>
          )}
          {teamBadges.length > 0 && (
            <div className="pt-3 border-t">
              <h4 className="text-xs text-slate-500 font-semibold mb-2">TEAMS</h4>
              <div className="flex flex-wrap gap-2">
                {teamBadges.map(team => (
                  <Badge key={team.id} variant="secondary" className="text-xs">{team.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {member.full_name || member.email}</DialogTitle>
            <DialogDescription>
              Adjust team assignments and other member settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMember} className="space-y-4 py-4">
            <div>
              <Label htmlFor="member-teams">Assigned Teams</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`team-${team.id}`}
                      checked={memberTeams.includes(team.id)}
                      onChange={() => handleToggleTeam(team.id)}
                      className="form-checkbox h-4 w-4 text-slate-600 transition duration-150 ease-in-out"
                      disabled={!canManageTeamsForMember && !isSelf} // Disable if no permission
                    />
                    <label htmlFor={`team-${team.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {team.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {/* Add other member settings here in the future */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating || (!canManageTeamsForMember && !isSelf)}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};


export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]); // Raw user list
  const [routines, setRoutines] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedPerformance, setSelectedPerformance] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]); // Renamed from allTeams to teams for consistency with outline
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isSendingNudge, setIsSendingNudge] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModal] = useState(false);
  const [selectedMemberForMessage, setSelectedMemberForMessage] = useState(null);

  const [teamStats, setTeamStats] = useState([]); // New state for calculated member stats
  const [canManageMembers, setCanManageMembers] = useState(false); // New state for overall permission
  const [userLeaderTeams, setUserLeaderTeams] = useState([]); // New state for teams current user leads

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, usersData, teamsData, routinesData, executionsData] = await Promise.all([
        User.me(),
        User.list(),
        TeamEntity.list(),
        Routine.list(),
        RoutineExecution.list('-execution_date', 100),
      ]);

      setCurrentUser(user);
      setTeamMembers(usersData || []);
      setTeams(teamsData || []);
      setRoutines(routinesData);
      setExecutions(executionsData);

      // Check permissions
      const canManage = await canManageTeamMembers(user);
      setCanManageMembers(canManage);

      // Get teams where user is leader
      const leaderTeams = await getUserLeaderTeams(user, teamsData);
      setUserLeaderTeams(leaderTeams);

      // Calculate team stats with permission filtering
      const statsWithMetrics = (usersData || []).map(member => {
        const memberTeams = (teamsData || []).filter(team =>
          (member.team_ids || []).includes(team.id)
        );

        const canViewDetails = user.role === 'admin' ||
          memberTeams.some(team => leaderTeams.some(lt => lt.id === team.id)) ||
          user.id === member.id; // User can always view their own details

        let assignedRoutinesCount = 0;
        let completionRate = 0;
        let avgDuration = 0;
        let lastActivity = null;
        let totalExecutions = 0;
        let completedExecutions = 0;

        if (canViewDetails) {
          const memberExecutions = executionsData.filter(e => e.executed_by === member.email);
          const assignedRoutines = routinesData.filter(r =>
            ((r.assigned_to || []).includes(member.email)) ||
            ((r.assigned_team_ids || []).some(teamId =>
              (member.team_ids || []).includes(teamId)
            ))
          );

          assignedRoutinesCount = assignedRoutines.length;
          totalExecutions = memberExecutions.length;
          completedExecutions = memberExecutions.filter(e => e.status === 'completed').length;
          completionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
          avgDuration = totalExecutions > 0
            ? memberExecutions.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / totalExecutions
            : 0;
          lastActivity = memberExecutions.length > 0
            ? Math.max(...memberExecutions.map(e => new Date(e.execution_date).getTime()))
            : null;
        }

        return {
          ...member,
          teams: memberTeams,
          assignedRoutinesCount,
          totalExecutions,
          completedExecutions,
          completionRate,
          avgDuration,
          lastActivity,
          canViewDetails,
        };
      });

      setTeamStats(statsWithMetrics);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast({
        title: "Error Loading Data",
        description: "There was an error loading team information. Please refresh the page.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    return teamStats.filter(member => {
      const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === "all" || member.role === selectedRole;

      // Only filter by performance if details are viewable or if the filter is "all"
      const matchesPerformance = selectedPerformance === "all" ||
        (member.canViewDetails &&
          ((selectedPerformance === "high" && (member.completionRate || 0) >= 80) ||
           (selectedPerformance === "medium" && (member.completionRate || 0) >= 60 && (member.completionRate || 0) < 80) ||
           (selectedPerformance === "low" && (member.completionRate || 0) < 60))
        );

      return matchesSearch && matchesRole && matchesPerformance;
    });
  }, [teamStats, searchQuery, selectedRole, selectedPerformance]);

  const handleInviteMember = () => {
    if (!canManageMembers) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to invite team members.",
        variant: "destructive",
      });
      return;
    }

    if (currentUser?.tier === 'free') {
      const proTierUsersLimit = 3; // Example limit for free tier
      if (teamMembers.length >= proTierUsersLimit) {
        setShowUpgradeModal(true);
        return;
      }
    }
    setIsInviteModalOpen(true);
  };

  const sendTeamReport = async (team) => {
    if (!currentUser || isSendingReport) return;

    const isAdmin = currentUser?.role === 'admin';
    const isLeaderOfThisTeam = checkIsTeamLeader(currentUser, team, userLeaderTeams);

    if (!isAdmin && !isLeaderOfThisTeam) {
      toast({
        title: "Permission Denied",
        description: "You must be an admin or a leader of this team to send a performance report.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReport(true);

    // Add defensive fallbacks for team member data
    const membersOfTeam = teamStats.filter(m => 
      (m.team_ids || []).includes(team.id) && m.canViewDetails
    );
    
    const totalExecutions = membersOfTeam.reduce((sum, m) => sum + (m.totalExecutions || 0), 0);
    const completedExecutions = membersOfTeam.reduce((sum, m) => sum + (m.completedExecutions || 0), 0);
    const teamCompletionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
    const activeRoutinesCount = routines.filter(r => 
      (r.assigned_team_ids || []).includes(team.id) && r.status === 'active'
    ).length;
    const topPerformers = [...membersOfTeam]
      .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
      .slice(0, 3);

    const performersHtml = topPerformers.map(p =>
      `<li style="margin-bottom: 5px;">${p.full_name || p.email}: <strong>${(p.completionRate || 0).toFixed(1)}%</strong> completion</li>`
    ).join('');

    const body = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h1 style="color: #333;">Performance Summary for Team: ${team.name}</h1>
        <p>Hi ${currentUser.full_name || currentUser.email.split('@')[0]},</p>
        <p>Here's the latest performance snapshot for your team:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><strong>Overall Completion Rate:</strong></td><td style="padding: 10px; text-align: right; font-weight: bold; font-size: 1.2em; color: #10b981;">${teamCompletionRate.toFixed(1)}%</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><strong>Total Tasks Executed:</strong></td><td style="padding: 10px; text-align: right; font-weight: bold;">${totalExecutions}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><strong>Active Routines Assigned:</strong></td><td style="padding: 10px; text-align: right; font-weight: bold;">${activeRoutinesCount}</td></tr>
        </table>
        <h3 style="color: #444;">Top Performers:</h3>
        <ul style="padding-left: 20px;">${performersHtml || '<li>No performance data available.</li>'}</ul>
        <p>You can view more detailed insights on the <a href="${window.location.origin}/analytics" style="color: #0891b2; text-decoration: none;">Analytics Dashboard</a>.</p>
        <p><em>- The RoutinePro Team</em></p>
      </div>
    `;

    try {
      await SendEmail({
        to: currentUser.email,
        subject: `RoutinePro Performance Report: ${team.name}`,
        body: body,
      });
      toast({
        title: "Report Sent!",
        description: `The performance summary for ${team.name} has been sent to your email.`,
      });
    } catch (error) {
      console.error("Failed to send team report", error);
      toast({
        title: "Error",
        description: "Failed to send the team report. Please try again.",
        variant: "destructive"
      });
    }
    setIsSendingReport(false);
  };

  const sendNudgeEmail = async (member) => {
    if (!currentUser || isSendingNudge) return;

    const isAdmin = currentUser?.role === 'admin';
    const isLeaderOfMemberTeam = (member.team_ids || []).some(teamId =>
      userLeaderTeams.some(leaderTeam => leaderTeam.id === teamId)
    );

    if (!isAdmin && !isLeaderOfMemberTeam) {
      toast({
        title: "Permission Denied",
        description: "You can only send nudges to members of teams you lead or if you are an admin.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingNudge(true);

    try {
      // Get member's assigned routines with defensive fallbacks
      const userTeamIds = new Set(member.team_ids || []);
      const assignedRoutines = routines.filter(r => {
        const assignedTo = r.assigned_to || [];
        const assignedTeamIds = r.assigned_team_ids || [];
        return (
          (assignedTo.includes(member.email) || assignedTeamIds.some(teamId => userTeamIds.has(teamId))) && 
          r.status === 'active'
        );
      });

      // Categorize tasks
      const todayTasks = assignedRoutines.filter(r => r.next_due_date && isToday(new Date(r.next_due_date)));
      const tomorrowTasks = assignedRoutines.filter(r => r.next_due_date && isTomorrow(new Date(r.next_due_date)));
      const overdueTasks = assignedRoutines.filter(r => r.next_due_date && isPast(new Date(r.next_due_date)) && !isToday(new Date(r.next_due_date)));

      const memberName = member.full_name || member.email.split('@')[0];
      const hasUrgentTasks = overdueTasks.length > 0 || todayTasks.length > 0;

      const createTaskList = (tasks, includeDetails = true) => {
        if (tasks.length === 0) return '<p style="color: #10b981; font-style: italic;">None - great job!</p>';
        return `
          <ul style="padding-left: 20px; margin: 10px 0;">
            ${tasks.map(task => `
              <li style="margin-bottom: 8px; line-height: 1.4;">
                <strong>${task.title}</strong>
                ${includeDetails ? `<br><small style="color: #666;">Due: ${formatDate(new Date(task.next_due_date), 'MMM d, yyyy')} • ${task.estimated_duration || 30} min • ${task.priority} priority</small>` : ''}
              </li>
            `).join('')}
          </ul>
        `;
      };

      const body = `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px;">
          <h1 style="color: #333;">${hasUrgentTasks ? '⏰' : '📋'} Task Reminder from Your Manager</h1>
          <p>Hi ${memberName},</p>
          <p>This is a friendly reminder from <strong>${currentUser.full_name || currentUser.email}</strong> about your upcoming tasks in RoutinePro:</p>

          ${overdueTasks.length > 0 ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚨 Overdue Tasks - Need Immediate Attention</h3>
              ${createTaskList(overdueTasks)}
            </div>
          ` : ''}

          ${todayTasks.length > 0 ? `
            <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #ea580c; margin: 0 0 10px 0;">🎯 Due Today</h3>
              ${createTaskList(todayTasks)}
            </div>
          ` : ''}

          ${tomorrowTasks.length > 0 ? `
            <div style="background: #f0f9ff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #0891b2; margin: 0 0 10px 0;">📅 Due Tomorrow</h3>
              ${createTaskList(tomorrowTasks)}
            </div>
          ` : ''}

          ${overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 ? `
            <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #16a34a;">🎉 You're All Caught Up!</h3>
              <p style="color: #15803d;">No urgent tasks at the moment. Keep up the great work!</p>
            </div>
          ` : `
            <div style="margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>🎯 Next Steps:</strong> Please log into RoutinePro to complete these tasks.
                If you have any questions or need support, don't hesitate to reach out.
              </p>
            </div>
          `}

          <div style="margin-top: 25px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0;"><strong>Quick Links:</strong></p>
            <p style="margin: 0;">
              📋 <a href="${window.location.origin}/mytasks" style="color: #0891b2; text-decoration: none;">View My Tasks</a><br>
              📊 <a href="${window.location.origin}/myprofile" style="color: #0891b2; text-decoration: none;">Check My Performance</a>
            </p>
          </div>

          <p style="margin-top: 20px; color: #666;">
            Thanks for your attention to these tasks!<br>
            <strong>${currentUser.full_name || currentUser.email}</strong>
          </p>
        </div>
      `;

      const subject = hasUrgentTasks
        ? `⏰ Urgent: Task Reminder - Action Needed Today`
        : `📋 Friendly Task Reminder - RoutinePro`;

      await SendEmail({
        to: member.email,
        subject: subject,
        body: body,
      });

      // Show success feedback
      toast({
        title: "Reminder Sent!",
        description: `Task reminder sent to ${memberName}.`,
      });

    } catch (error) {
      console.error("Failed to send nudge email", error);
      toast({
        title: "Error",
        description: "Failed to send task reminder. Please try again.",
        variant: "destructive"
      });
    }

    setIsSendingNudge(false);
  };

  const handleOpenMessageModal = useCallback((member) => {
    const isAdmin = currentUser?.role === 'admin';
    const isLeaderOfMemberTeam = (member.team_ids || []).some(teamId =>
      userLeaderTeams.some(leaderTeam => leaderTeam.id === teamId)
    );

    if (!isAdmin && !isLeaderOfMemberTeam) {
      toast({
        title: "Permission Denied",
        description: "You can only send messages to members of teams you lead or if you are an admin.",
        variant: "destructive",
      });
      return;
    }

    setSelectedMemberForMessage(member);
    setIsMessageModal(true);
  }, [currentUser, userLeaderTeams, toast]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header - Standardized */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-10 h-10 text-slate-700" />
              Team Management
            </h1>
            <p className="text-lg text-slate-600">Invite members, create teams, and monitor performance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          </div>
        </div>

        {/* Team Overview Stats */}
        <TeamOverview
          teamMembers={teamStats}
          routines={routines}
          executions={executions}
          isLoading={isLoading}
        />

        {currentUser && currentUser.role === 'admin' && currentUser.tier !== 'free' && (
          <TeamManagement
            teams={teams}
            routines={routines}
            members={teamStats}
            onUpdate={loadData}
            currentUser={currentUser}
            onSendReport={sendTeamReport}
            userLeaderTeams={userLeaderTeams}
          />
        )}

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="workload" className="gap-2">
              <Target className="w-4 h-4" />
              Workload
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Calendar className="w-4 h-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search team members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-300"
                />
              </div>

              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Role: {selectedRole === "all" ? "All" : selectedRole}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedRole("all")}>
                      All Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedRole("admin")}>
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedRole("user")}>
                      User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Performance: {selectedPerformance === "all" ? "All" : selectedPerformance}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedPerformance("all")}>
                      All Performance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPerformance("high")}>
                      High (≥80%)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPerformance("medium")}>
                      Medium (60-79%)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPerformance("low")}>
                      Low (&lt;60%)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPerformance("nodata")}>
                      No Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 rounded-xl h-64"></div>
                  </div>
                ))
              ) : filteredMembers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No team members found</h3>
                  <p className="text-slate-500 mb-6">
                    {searchQuery || selectedRole !== "all" || selectedPerformance !== "all"
                      ? "Try adjusting your search or filters"
                      : "Invite team members to get started"}
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onUpdate={loadData}
                    currentUser={currentUser}
                    teams={teams}
                    userLeaderTeams={userLeaderTeams}
                    onSendNudge={sendNudgeEmail}
                    onOpenMessageModal={handleOpenMessageModal}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <TeamPerformanceChart
              teamMembers={teamStats.filter(m => m.canViewDetails)} // Only pass members for whom details are viewable
              executions={executions}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="workload">
            <WorkloadDistribution
              teamMembers={teamStats.filter(m => m.canViewDetails)} // Only pass members for whom details are viewable
              routines={routines}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <TeamAssignments
              teamMembers={teamStats}
              routines={routines}
              onUpdate={loadData}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="Team Members"
        />
        <InviteMemberDialog
          open={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onMemberAdded={loadData}
          currentUser={currentUser}
        />
        <SendMessageDialog
          open={isMessageModalOpen}
          onClose={() => {
            setIsMessageModal(false);
            setSelectedMemberForMessage(null);
          }}
          recipient={selectedMemberForMessage}
          sender={currentUser}
        />
      </div>
    </div>
  );
}
