import { AuditLog } from "@/api/entities";
import { User } from "@/api/entities";

// Helper function to create audit log entries
export const logAuditEvent = async (action, entityType, entityId, details, payload = {}) => {
  try {
    const user = await User.me();
    
    await AuditLog.create({
      actor_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      payload,
      details
    });
  } catch (error) {
    // Don't throw errors for audit logging failures to avoid breaking user workflows
    console.error('Failed to create audit log:', error);
  }
};

// Specific audit event types for common actions
export const auditEvents = {
  // Routine events
  ROUTINE_CREATE: 'routine.create',
  ROUTINE_UPDATE: 'routine.update', 
  ROUTINE_DELETE: 'routine.delete',
  ROUTINE_EXECUTE: 'routine.execute',
  ROUTINE_STATUS_CHANGE: 'routine.status_change',
  
  // Team events
  USER_INVITE: 'user.invite',
  USER_DEACTIVATE: 'user.deactivate',
  USER_REACTIVATE: 'user.reactivate',
  
  // Profile events
  PROFILE_UPDATE: 'profile.update',
  
  // Settings events
  SETTINGS_UPDATE: 'settings.update',
  
  // Authentication events
  USER_LOGIN: 'auth.login',
  USER_LOGOUT: 'auth.logout',
  
  // Template events
  TEMPLATE_USE: 'template.use',
  
  // AI events
  AI_GENERATION: 'ai.generation'
};

// Helper functions for specific audit events
export const auditRoutineCreate = async (routine) => {
  await logAuditEvent(
    auditEvents.ROUTINE_CREATE,
    'Routine',
    routine.id,
    `Created routine "${routine.title}" in ${routine.industry}`,
    {
      title: routine.title,
      industry: routine.industry,
      frequency: routine.frequency,
      priority: routine.priority
    }
  );
};

export const auditRoutineUpdate = async (routineId, oldData, newData) => {
  const changes = {};
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = { from: oldData[key], to: newData[key] };
    }
  });

  await logAuditEvent(
    auditEvents.ROUTINE_UPDATE,
    'Routine',
    routineId,
    `Updated routine "${newData.title || oldData.title}"`,
    { changes }
  );
};

export const auditRoutineStatusChange = async (routineId, routineTitle, oldStatus, newStatus) => {
  await logAuditEvent(
    auditEvents.ROUTINE_STATUS_CHANGE,
    'Routine',
    routineId,
    `Changed routine "${routineTitle}" status from ${oldStatus} to ${newStatus}`,
    { oldStatus, newStatus }
  );
};

export const auditRoutineExecution = async (routine, execution) => {
  await logAuditEvent(
    auditEvents.ROUTINE_EXECUTE,
    'RoutineExecution',
    execution.id,
    `Executed routine "${routine.title}" with status: ${execution.status}`,
    {
      routineId: routine.id,
      routineTitle: routine.title,
      status: execution.status,
      completedItems: execution.completed_items?.length || 0,
      totalItems: routine.checklist_items?.length || 0
    }
  );
};

export const auditUserInvite = async (email) => {
  await logAuditEvent(
    auditEvents.USER_INVITE,
    'User',
    email,
    `Invited user: ${email}`,
    { email }
  );
};

export const auditUserStatusChange = async (userId, userEmail, action) => {
  const eventType = action === 'deactivate' ? auditEvents.USER_DEACTIVATE : auditEvents.USER_REACTIVATE;
  const actionText = action === 'deactivate' ? 'Deactivated' : 'Reactivated';
  
  await logAuditEvent(
    eventType,
    'User',
    userId,
    `${actionText} user: ${userEmail}`,
    { userEmail, action }
  );
};

export const auditProfileUpdate = async (userId, changes) => {
  await logAuditEvent(
    auditEvents.PROFILE_UPDATE,
    'User',
    userId,
    'Updated profile information',
    { changes }
  );
};

export const auditTemplateUse = async (templateName, industry) => {
  await logAuditEvent(
    auditEvents.TEMPLATE_USE,
    'Template',
    `${industry}-${templateName}`,
    `Used template "${templateName}" from ${industry} industry`,
    { templateName, industry }
  );
};

export const auditAIGeneration = async (prompt, result) => {
  await logAuditEvent(
    auditEvents.AI_GENERATION,
    'AIGeneration',
    Date.now().toString(),
    'Generated routine using AI',
    {
      promptLength: prompt.length,
      generatedTitle: result.title || 'Unknown',
      generatedIndustry: result.industry || 'Unknown'
    }
  );
};