
import { Team } from "@/api/entities";
import { User } from "@/api/entities"; // New import that was missing

// Check if user is a team leader of any team
export const isTeamLeader = async (user, teams = null) => {
  if (!user || user.role === 'admin') {
    return true; // Admins have all permissions
  }

  try {
    // Use provided teams or fetch all teams
    const allTeams = teams || await Team.list();
    
    // Check if user is a leader of any team
    return allTeams.some(team => team.leader_ids?.includes(user.id));
  } catch (error) {
    console.error('Error checking team leader status:', error);
    return false;
  }
};

// Check if user is a leader of a specific team
export const isLeaderOfTeam = async (user, teamId, teams = null) => {
  if (!user || !teamId) return false;
  
  if (user.role === 'admin') return true; // Admins have all permissions

  try {
    // Use provided teams or fetch all teams
    const allTeams = teams || await Team.list();
    const team = allTeams.find(t => t.id === teamId);
    
    return team?.leader_ids?.includes(user.id) || false;
  } catch (error) {
    console.error('Error checking team leadership:', error);
    return false;
  }
};

// Check if user can edit a routine (owner, team leader, or admin)
export const canEditRoutine = async (user, routine, teams = null) => {
  if (!user || !routine) return false;
  
  // Admin can edit anything
  if (user.role === 'admin') return true;
  
  // Creator can edit their own routines
  if (routine.created_by === user.email) return true;
  
  // Team leader can edit team routines
  if (routine.owning_team_id) {
    return await isLeaderOfTeam(user, routine.owning_team_id, teams);
  }
  
  return false;
};

// Check if user can manage team members (invite, remove, etc.)
export const canManageTeamMembers = async (user, targetUser = null, teams = null) => {
  if (!user) return false;
  
  // Admin can manage anyone
  if (user.role === 'admin') return true;
  
  // Team leaders can manage members of their teams
  const userLeaderTeams = await getUserLeaderTeams(user, teams);
  if (userLeaderTeams.length === 0) return false;
  
  // If no specific target user, check if user can manage any team
  if (!targetUser) return true;
  
  // Check if target user is in any of the teams the current user leads
  const targetUserTeamIds = new Set(targetUser.team_ids || []);
  return userLeaderTeams.some(team => targetUserTeamIds.has(team.id));
};

// Check if user can assign routines to specific teams/users
export const canAssignRoutines = async (user, targetTeamIds = [], targetUserEmails = [], teams = null) => {
  if (!user) return false;
  
  // Admin can assign to anyone
  if (user.role === 'admin') return true;
  
  const userLeaderTeams = await getUserLeaderTeams(user, teams);
  const userLeaderTeamIds = new Set(userLeaderTeams.map(t => t.id));
  
  // Check if user can assign to all target teams
  const canAssignToTeams = targetTeamIds.every(teamId => userLeaderTeamIds.has(teamId));
  
  // For individual user assignments, check if those users belong to teams the current user leads
  let canAssignToUsers = true;
  if (targetUserEmails.length > 0) {
    try {
      const allUsers = await User.list();
      const targetUsers = allUsers.filter(u => targetUserEmails.includes(u.email));
      
      canAssignToUsers = targetUsers.every(targetUser => {
        const targetUserTeamIds = new Set(targetUser.team_ids || []);
        // User can assign to individuals if they share at least one team where current user is leader
        return Array.from(userLeaderTeamIds).some(leaderTeamId => targetUserTeamIds.has(leaderTeamId));
      });
    } catch (error) {
      console.error('Error checking user assignment permissions:', error);
      return false;
    }
  }
  
  return canAssignToTeams && canAssignToUsers;
};

// Get teams where user is a leader
export const getUserLeaderTeams = async (user, teams = null) => {
  if (!user) return [];
  
  try {
    const allTeams = teams || await Team.list();
    return allTeams.filter(team => team.leader_ids?.includes(user.id));
  } catch (error) {
    console.error('Error getting user leader teams:', error);
    return [];
  }
};

// Get teams where user is a member (not necessarily leader)
export const getUserMemberTeams = async (user, teams = null) => {
  if (!user) return [];
  
  try {
    const allTeams = teams || await Team.list();
    const userTeamIds = new Set(user.team_ids || []);
    return allTeams.filter(team => userTeamIds.has(team.id));
  } catch (error) {
    console.error('Error getting user member teams:', error);
    return [];
  }
};

// Validate if a routine assignment is valid (all assigned users/teams exist and are accessible)
export const validateRoutineAssignment = async (user, assignedEmails = [], assignedTeamIds = []) => {
  const errors = [];
  
  try {
    // Check if user has permission to assign to these targets
    const canAssign = await canAssignRoutines(user, assignedTeamIds, assignedEmails);
    if (!canAssign) {
      errors.push("You don't have permission to assign routines to some of the selected users or teams.");
    }
    
    // Validate that all assigned users exist
    if (assignedEmails.length > 0) {
      const allUsers = await User.list();
      const existingEmails = new Set(allUsers.map(u => u.email));
      const missingEmails = assignedEmails.filter(email => !existingEmails.has(email));
      
      if (missingEmails.length > 0) {
        errors.push(`The following assigned users were not found: ${missingEmails.join(', ')}`);
      }
    }
    
    // Validate that all assigned teams exist
    if (assignedTeamIds.length > 0) {
      const allTeams = await Team.list();
      const existingTeamIds = new Set(allTeams.map(t => t.id));
      const missingTeamIds = assignedTeamIds.filter(id => !existingTeamIds.has(id));
      
      if (missingTeamIds.length > 0) {
        errors.push(`Some assigned teams were not found or are no longer available.`);
      }
    }
    
  } catch (error) {
    console.error('Error validating routine assignment:', error);
    errors.push('Unable to validate assignment. Please try again.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
