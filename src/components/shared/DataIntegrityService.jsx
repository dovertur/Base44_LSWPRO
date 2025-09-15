import { User } from "@/api/entities";
import { Team } from "@/api/entities";
import { Routine } from "@/api/entities";
import { RoutineExecution } from "@/api/entities";
import { AuditLog } from "@/api/entities";

export class DataIntegrityService {
  
  // Check for orphaned routine assignments (users that no longer exist)
  static async findOrphanedUserAssignments() {
    try {
      const [routines, users] = await Promise.all([
        Routine.list(),
        User.list()
      ]);
      
      const existingEmails = new Set(users.map(u => u.email));
      const issues = [];
      
      for (const routine of routines) {
        if (routine.assigned_to) {
          const orphanedEmails = routine.assigned_to.filter(email => !existingEmails.has(email));
          if (orphanedEmails.length > 0) {
            issues.push({
              type: 'orphaned_user_assignment',
              routineId: routine.id,
              routineTitle: routine.title,
              orphanedEmails
            });
          }
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error finding orphaned user assignments:', error);
      return [];
    }
  }
  
  // Check for orphaned team assignments (teams that no longer exist)
  static async findOrphanedTeamAssignments() {
    try {
      const [routines, users, teams] = await Promise.all([
        Routine.list(),
        User.list(), 
        Team.list()
      ]);
      
      const existingTeamIds = new Set(teams.map(t => t.id));
      const issues = [];
      
      // Check routine team assignments
      for (const routine of routines) {
        if (routine.assigned_team_ids) {
          const orphanedTeamIds = routine.assigned_team_ids.filter(teamId => !existingTeamIds.has(teamId));
          if (orphanedTeamIds.length > 0) {
            issues.push({
              type: 'orphaned_team_assignment_routine',
              routineId: routine.id,
              routineTitle: routine.title,
              orphanedTeamIds
            });
          }
        }
        
        if (routine.owning_team_id && !existingTeamIds.has(routine.owning_team_id)) {
          issues.push({
            type: 'orphaned_owning_team',
            routineId: routine.id,
            routineTitle: routine.title,
            orphanedTeamId: routine.owning_team_id
          });
        }
      }
      
      // Check user team memberships
      for (const user of users) {
        if (user.team_ids) {
          const orphanedTeamIds = user.team_ids.filter(teamId => !existingTeamIds.has(teamId));
          if (orphanedTeamIds.length > 0) {
            issues.push({
              type: 'orphaned_team_assignment_user',
              userId: user.id,
              userEmail: user.email,
              orphanedTeamIds
            });
          }
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error finding orphaned team assignments:', error);
      return [];
    }
  }
  
  // Check for invalid team leader assignments
  static async findInvalidTeamLeaders() {
    try {
      const [teams, users] = await Promise.all([
        Team.list(),
        User.list()
      ]);
      
      const existingUserIds = new Set(users.map(u => u.id));
      const issues = [];
      
      for (const team of teams) {
        if (team.leader_ids) {
          const orphanedLeaderIds = team.leader_ids.filter(leaderId => !existingUserIds.has(leaderId));
          if (orphanedLeaderIds.length > 0) {
            issues.push({
              type: 'orphaned_team_leader',
              teamId: team.id,
              teamName: team.name,
              orphanedLeaderIds
            });
          }
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error finding invalid team leaders:', error);
      return [];
    }
  }
  
  // Check for executions referencing non-existent routines
  static async findOrphanedExecutions() {
    try {
      const [executions, routines] = await Promise.all([
        RoutineExecution.list('-execution_date', 1000),
        Routine.list()
      ]);
      
      const existingRoutineIds = new Set(routines.map(r => r.id));
      const issues = [];
      
      for (const execution of executions) {
        if (!existingRoutineIds.has(execution.routine_id)) {
          issues.push({
            type: 'orphaned_execution',
            executionId: execution.id,
            routineId: execution.routine_id,
            executedBy: execution.executed_by,
            executionDate: execution.execution_date
          });
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error finding orphaned executions:', error);
      return [];
    }
  }
  
  // Run all consistency checks
  static async runAllChecks() {
    const results = {
      orphanedUserAssignments: [],
      orphanedTeamAssignments: [],
      invalidTeamLeaders: [],
      orphanedExecutions: [],
      summary: { totalIssues: 0, checksPassed: 0 }
    };
    
    try {
      const [
        orphanedUsers,
        orphanedTeams,
        invalidLeaders,
        orphanedExecs
      ] = await Promise.all([
        this.findOrphanedUserAssignments(),
        this.findOrphanedTeamAssignments(),
        this.findInvalidTeamLeaders(),
        this.findOrphanedExecutions()
      ]);
      
      results.orphanedUserAssignments = orphanedUsers;
      results.orphanedTeamAssignments = orphanedTeams;
      results.invalidTeamLeaders = invalidLeaders;
      results.orphanedExecutions = orphanedExecs;
      
      const totalIssues = orphanedUsers.length + orphanedTeams.length + 
                         invalidLeaders.length + orphanedExecs.length;
      
      results.summary = {
        totalIssues,
        checksPassed: totalIssues === 0 ? 4 : 4 - (totalIssues > 0 ? 1 : 0),
        lastChecked: new Date().toISOString()
      };
      
      return results;
    } catch (error) {
      console.error('Error running consistency checks:', error);
      throw error;
    }
  }
  
  // Repair orphaned user assignments
  static async repairOrphanedUserAssignments(issues) {
    const repairResults = [];
    
    for (const issue of issues) {
      try {
        const routine = await Routine.list().then(routines => 
          routines.find(r => r.id === issue.routineId)
        );
        
        if (routine) {
          const cleanedAssignments = routine.assigned_to.filter(email => 
            !issue.orphanedEmails.includes(email)
          );
          
          await Routine.update(issue.routineId, {
            assigned_to: cleanedAssignments
          });
          
          repairResults.push({
            type: 'user_assignment_cleaned',
            routineId: issue.routineId,
            removedEmails: issue.orphanedEmails,
            success: true
          });
        }
      } catch (error) {
        repairResults.push({
          type: 'user_assignment_cleaned',
          routineId: issue.routineId,
          removedEmails: issue.orphanedEmails,
          success: false,
          error: error.message
        });
      }
    }
    
    return repairResults;
  }
  
  // Repair orphaned team assignments
  static async repairOrphanedTeamAssignments(issues) {
    const repairResults = [];
    
    for (const issue of issues) {
      try {
        if (issue.type === 'orphaned_team_assignment_routine') {
          const routine = await Routine.list().then(routines => 
            routines.find(r => r.id === issue.routineId)
          );
          
          if (routine) {
            const cleanedTeamIds = routine.assigned_team_ids.filter(teamId => 
              !issue.orphanedTeamIds.includes(teamId)
            );
            
            await Routine.update(issue.routineId, {
              assigned_team_ids: cleanedTeamIds
            });
            
            repairResults.push({
              type: 'routine_team_assignment_cleaned',
              routineId: issue.routineId,
              removedTeamIds: issue.orphanedTeamIds,
              success: true
            });
          }
        } else if (issue.type === 'orphaned_team_assignment_user') {
          const cleanedTeamIds = await User.list().then(users => {
            const user = users.find(u => u.id === issue.userId);
            if (user && user.team_ids) {
              return user.team_ids.filter(teamId => 
                !issue.orphanedTeamIds.includes(teamId)
              );
            }
            return [];
          });
          
          await User.update(issue.userId, {
            team_ids: cleanedTeamIds
          });
          
          repairResults.push({
            type: 'user_team_assignment_cleaned',
            userId: issue.userId,
            removedTeamIds: issue.orphanedTeamIds,
            success: true
          });
        }
      } catch (error) {
        repairResults.push({
          type: 'team_assignment_cleaned',
          entityId: issue.routineId || issue.userId,
          removedTeamIds: issue.orphanedTeamIds,
          success: false,
          error: error.message
        });
      }
    }
    
    return repairResults;
  }
  
  // Log data integrity actions for audit trail
  static async logIntegrityAction(action, details, currentUser) {
    if (currentUser?.tier === 'pro_plus') {
      try {
        await AuditLog.create({
          actor_email: currentUser.email,
          action: `data_integrity.${action}`,
          entity_type: 'System',
          entity_id: 'data_integrity_service',
          details,
          payload: { action, timestamp: new Date().toISOString() }
        });
      } catch (error) {
        console.error('Error logging integrity action:', error);
      }
    }
  }
}

export default DataIntegrityService;