
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { Routine } from "@/api/entities";
import { AuditLog } from "@/api/entities";
import { User } from "@/api/entities";
import { Team } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CheckCircle,
  Plus,
  Trash2,
  Building2,
  Heart,
  Wrench,
  Calendar as CalendarIcon, // Renamed Calendar from lucide-react to CalendarIcon to avoid conflict
  Clock,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Paperclip,
  UploadCloud,
  File as FileIcon,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar"; // Calendar Component
import { format, addDays } from "date-fns";
import { UploadFile } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";
import { validateRoutineAssignment, canAssignRoutines } from "@/components/shared/teamHelpers";
import { auditRoutineCreate, auditRoutineUpdate, auditTemplateUse } from "@/components/shared/auditLogger";
import { calculateNextDueDate } from "@/components/shared/recurrence";

// Multi-select component for teams
const MultiSelectTeams = ({ availableTeams, selectedTeamIds, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (teamId) => {
    const newSelectedIds = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter(id => id !== teamId)
      : [...selectedTeamIds, teamId];
    onChange(newSelectedIds);
  };

  const selectedTeams = availableTeams.filter(team => selectedTeamIds.includes(team.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] flex-wrap px-3 py-2 text-left"
        >
          <div className="flex gap-1 flex-wrap items-center">
            {selectedTeams.length > 0 ? selectedTeams.map(team => (
              <Badge key={team.id} variant="secondary" className="gap-1 pr-1">
                {team.name}
                <X className="h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelect(team.id); }} />
              </Badge>
            )) : <span className="text-muted-foreground">Select teams...</span>}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandEmpty>No teams found.</CommandEmpty>
          <CommandGroup>
            {availableTeams.map((team) => (
              <CommandItem
                key={team.id}
                onSelect={() => handleSelect(team.id)}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${selectedTeamIds.includes(team.id) ? "opacity-100" : "opacity-0"}`}
                />
                {team.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Multi-select component for users (created based on MultiSelectTeams)
const MultiSelectUsers = ({ availableUsers, selectedEmails, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (userEmail) => {
    const newSelectedEmails = selectedEmails.includes(userEmail)
      ? selectedEmails.filter(email => email !== userEmail)
      : [...selectedEmails, userEmail];
    onChange(newSelectedEmails);
  };

  const selectedUsers = availableUsers.filter(user => selectedEmails.includes(user.email));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] flex-wrap px-3 py-2 text-left"
        >
          <div className="flex gap-1 flex-wrap items-center">
            {selectedUsers.length > 0 ? selectedUsers.map(user => (
              <Badge key={user.email} variant="secondary" className="gap-1 pr-1">
                {user.first_name} {user.last_name}
                <X className="h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelect(user.email); }} />
              </Badge>
            )) : <span className="text-muted-foreground">Select users...</span>}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup>
            {availableUsers.map((user) => (
              <CommandItem
                key={user.email}
                onSelect={() => handleSelect(user.email)}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${selectedEmails.includes(user.email) ? "opacity-100" : "opacity-0"}`}
                />
                {user.first_name} {user.last_name} ({user.email})
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


const industryConfig = {
  manufacturing: {
    icon: Building2,
    color: 'bg-orange-500',
    name: 'Manufacturing'
  },
  healthcare: {
    icon: Heart,
    color: 'bg-emerald-500',
    name: 'Healthcare'
  },
  maintenance: {
    icon: Wrench,
    color: 'bg-violet-500',
    name: 'Maintenance'
  }
};

export default function RoutineBuilder({ editingRoutine = null, onClose, mode = "create", teamId = null }) {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Normalize the editingRoutine to prevent errors with legacy data
  const normalizedEditingRoutine = editingRoutine ? {
    ...editingRoutine,
    assigned_to: editingRoutine.assigned_to || [],
    assigned_team_ids: editingRoutine.assigned_team_ids || [],
    checklist_items: editingRoutine.checklist_items || [],
    attached_files: editingRoutine.attached_files || [],
    // Provide default recurrence object if missing or incomplete
    recurrence_type: editingRoutine.recurrence_type || editingRoutine.frequency || 'none',
    recurrence_interval: editingRoutine.recurrence_interval || 1,
    recurrence_days_of_week: editingRoutine.recurrence_days_of_week || [],
    recurrence_day_of_month: editingRoutine.recurrence_day_of_month || null,
    recurrence_end_date: editingRoutine.recurrence_end_date || null,
  } : null;

  // Helper to safely parse dates to ISO string
  const parseDateTimeToISO = (dateTimeStr) => {
    try {
      if (dateTimeStr) {
        const date = new Date(dateTimeStr);
        // Ensure date is valid, otherwise return current time or default
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    } catch (e) {
      console.warn("Failed to parse date string:", dateTimeStr, e);
    }
    return new Date().toISOString(); // Default to current time
  };

  const initialState = (() => {
    if (normalizedEditingRoutine) {
      // Map existing backend frequency to recurrence type for UI if not explicitly set
      let recurrenceType = normalizedEditingRoutine.recurrence_type;
      if (!['daily', 'weekly', 'monthly', 'none'].includes(recurrenceType)) {
        recurrenceType = 'none'; // Fallback for invalid frequency
      }

      return {
        title: normalizedEditingRoutine.title || '',
        description: normalizedEditingRoutine.description || '',
        industry: normalizedEditingRoutine.industry || 'manufacturing',
        routine_type: normalizedEditingRoutine.routine_type || 'routine',
        frequency: normalizedEditingRoutine.frequency || 'none', // Keep original frequency for saving, but UI is driven by recurrence.type
        priority: normalizedEditingRoutine.priority || 'medium',
        estimated_duration: normalizedEditingRoutine.estimated_duration || 30,
        assigned_to: normalizedEditingRoutine.assigned_to,
        assigned_team_ids: normalizedEditingRoutine.assigned_team_ids,
        status: normalizedEditingRoutine.status || 'draft',
        owning_team_id: normalizedEditingRoutine.owning_team_id || null,
        next_due_date: parseDateTimeToISO(normalizedEditingRoutine.next_due_date), // Full ISO string
        attached_files: normalizedEditingRoutine.attached_files,
        recurrence: {
          type: recurrenceType,
          interval: normalizedEditingRoutine.recurrence_interval,
          daysOfWeek: normalizedEditingRoutine.recurrence_days_of_week,
          dayOfMonth: normalizedEditingRoutine.recurrence_day_of_month,
          endDate: normalizedEditingRoutine.recurrence_end_date,
        },
      };
    } else {
      return {
        title: '',
        description: '',
        industry: 'manufacturing',
        routine_type: 'routine',
        frequency: 'none', // Default for new routine
        priority: 'medium',
        estimated_duration: 30,
        assigned_to: [],
        assigned_team_ids: teamId ? [teamId] : [], // Use teamId prop if provided
        status: 'draft',
        owning_team_id: teamId || null, // Set owning_team_id if teamId is provided
        next_due_date: new Date().toISOString(), // Default to current time
        attached_files: [],
        recurrence: {
          type: 'none',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          endDate: null,
        },
      };
    }
  })();

  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [routine, setRoutine] = useState(initialState);

  const [checklistItems, setChecklistItems] = useState(
    normalizedEditingRoutine?.checklist_items && normalizedEditingRoutine.checklist_items.length > 0
      ? normalizedEditingRoutine.checklist_items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }))
      : [{ id: crypto.randomUUID(), title: '', description: '', required: true }]
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleRecurrenceChange = (field, value) => {
    const newRecurrence = { ...routine.recurrence, [field]: value };
    
    // Reset specific fields when changing recurrence type
    if (field === 'type') {
      if (value !== 'weekly') {
        newRecurrence.daysOfWeek = [];
      }
      if (value !== 'monthly') {
        newRecurrence.dayOfMonth = null; // Use null instead of delete for consistency
      }
      if (value === 'none') {
        newRecurrence.interval = 1;
        newRecurrence.daysOfWeek = [];
        newRecurrence.dayOfMonth = null;
        newRecurrence.endDate = null;
      }
    }
    
    setRoutine({ ...routine, recurrence: newRecurrence });
  };
  
  const toggleWeekDay = (day) => {
    const daysOfWeek = routine.recurrence.daysOfWeek || [];
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter(d => d !== day)
      : [...daysOfWeek, day].sort((a, b) => a - b);
    handleRecurrenceChange('daysOfWeek', newDays);
  };

  const getRecurrencePreview = () => {
    if (!routine.recurrence || routine.recurrence.type === 'none') {
      return "This routine does not repeat";
    }

    const { type, interval = 1, daysOfWeek = [], dayOfMonth } = routine.recurrence;
    
    switch (type) {
      case 'daily':
        return interval === 1 ? "Repeats daily" : `Repeats every ${interval} days`;
      case 'weekly':
        if (daysOfWeek.length === 0) {
          return interval === 1 ? "Repeats weekly" : `Repeats every ${interval} weeks`;
        }
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = daysOfWeek.map(d => dayNames[d]).join(', ');
        const weekText = interval === 1 ? "weekly" : `every ${interval} weeks`;
        return `Repeats ${weekText} on ${selectedDays}`;
      case 'monthly':
        const dayText = dayOfMonth ? `on day ${dayOfMonth}` : 'on the same day';
        const monthText = interval === 1 ? "monthly" : `every ${interval} months`;
        return `Repeats ${monthText} ${dayText}`;
      default:
        return "";
    }
  };

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const [user, users, teams] = await Promise.all([User.me(), User.list(), Team.list()]);
      setCurrentUser(user);
      setAllUsers(users);
      setAllTeams(teams);
    } catch (err) {
      console.error("Error loading data for routine builder:", err);
      toast({
        title: "Loading Failed",
        description: "Failed to load required data. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]); // `editingRoutine` is no longer a dependency as initial state is handled by `initialState`

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  const validateRoutine = async () => {
    const newErrors = {};
    if (!routine.title?.trim()) {
        newErrors.title = "Title is required.";
    }
    if (!routine.description?.trim()) {
      newErrors.description = "Description is required.";
    }
    if (!routine.industry) {
        newErrors.industry = "Industry is required.";
    }
    if (checklistItems.filter(item => item.title.trim()).length === 0) {
        newErrors.checklist = "At least one checklist item with a title is required.";
    }

    // Recurrence validation
    if (!routine.recurrence.type) {
      newErrors.recurrence = "Recurrence type is required.";
    } else if (routine.recurrence.type !== 'none') {
      if (!routine.next_due_date) { // This is the 'First Due Date'
        newErrors.next_due_date = "First Due Date is required for recurring routines.";
      }
      if (!routine.recurrence.interval || routine.recurrence.interval < 1) {
        newErrors.recurrence_interval = "Recurrence interval must be at least 1.";
      }
      if (routine.recurrence.type === 'weekly' && (!routine.recurrence.daysOfWeek || routine.recurrence.daysOfWeek.length === 0)) {
        newErrors.recurrence_daysOfWeek = "At least one day of the week must be selected for weekly recurrence.";
      }
      if (routine.recurrence.type === 'monthly' && (routine.recurrence.dayOfMonth !== null && (routine.recurrence.dayOfMonth < 1 || routine.recurrence.dayOfMonth > 31))) {
        newErrors.recurrence_dayOfMonth = "Day of month must be between 1 and 31 for monthly recurrence.";
      }

      // Validate end date if set
      if (routine.recurrence.endDate) {
          const firstDueDate = new Date(routine.next_due_date);
          const endDate = new Date(routine.recurrence.endDate);
          if (isNaN(firstDueDate.getTime()) || isNaN(endDate.getTime())) {
              newErrors.recurrence_endDate = "Invalid start or end date.";
          } else if (endDate <= firstDueDate) { // End date should be strictly after the first due date to allow at least one recurrence
              newErrors.recurrence_endDate = "End date must be after the first due date.";
          }
      }

    } else { // Recurrence type is 'none' (one-off routine)
        if (!routine.next_due_date) {
            newErrors.next_due_date = "Due Date is required for one-off routines.";
        }
    }


    // Assignment validation
    if (routine.assigned_to?.length > 0 || routine.assigned_team_ids?.length > 0) {
      const assignmentValidation = await validateRoutineAssignment(
        currentUser,
        routine.assigned_to || [],
        routine.assigned_team_ids || []
      );

      if (!assignmentValidation.isValid) {
        newErrors.assignment = assignmentValidation.errors.join(' ');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate each file before uploading
    const maxSize = 100 * 1024 * 1024; // 100MB limit for routine attachments
    const oversizedFiles = [];
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files Too Large",
        description: `The following files exceed the 100MB limit: ${oversizedFiles.join(', ')}. Please choose smaller files.`,
        variant: "destructive",
      });
      
      // If all files are too large, return early
      if (validFiles.length === 0) {
        e.target.value = null; // Clear the input field
        return;
      }
    }

    if (validFiles.length === 0) {
      e.target.value = null; // Clear the input field if no valid files
      return;
    }

    setIsUploading(true);
    setErrors(prev => ({ ...prev, upload: null }));

    const uploadPromises = validFiles.map(async (file) => {
      try {
        const result = await UploadFile({ file });
        return { url: result.file_url, name: file.name };
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r !== null);

    if (successfulUploads.length > 0) {
      setRoutine(prev => ({ ...prev, attached_files: [...(prev.attached_files || []), ...successfulUploads] }));
      toast({
        title: "File(s) Uploaded",
        description: `${successfulUploads.length} file(s) have been attached to the routine.`,
      });
    }

    if (successfulUploads.length < validFiles.length) {
      toast({
        title: "Upload Failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
      });
    }
    setIsUploading(false);
    e.target.value = null; // Clear the input field after upload attempt
  };

  const removeAttachedFile = (fileUrl) => {
    setRoutine(prev => ({
      ...prev,
      attached_files: prev.attached_files.filter(file => file.url !== fileUrl)
    }));
  };

  const addChecklistItem = () => {
    setChecklistItems(prev => ([
      ...prev,
      { id: crypto.randomUUID(), title: '', description: '', required: true }
    ]));
  };

  const updateChecklistItem = (id, field, value) => {
    setChecklistItems(prev => (
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    ));
    if (errors.checklist) {
      const newItems = checklistItems.map(item => item.id === id ? { ...item, [field]: value } : item);
      if (newItems.filter(item => item.title.trim()).length > 0) {
        setErrors(prev => ({ ...prev, checklist: null }));
      }
    }
  };

  const removeChecklistItem = (id) => {
    if (checklistItems.length > 1) {
      setChecklistItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();

    if (!(await validateRoutine())) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      const finalChecklistItems = checklistItems.filter(item => item.title.trim());

      // Prepare routine data for saving
      const routineData = {
        ...routine,
        checklist_items: finalChecklistItems,
        // The UI's next_due_date is the "first_due_date" for recurrence calculation
        // Backend's next_due_date will be calculated using recurrence logic
        // Also ensure frequency field is set based on recurrence type for backend
        frequency: routine.recurrence.type, // Map recurrence type to backend frequency
        recurrence_type: routine.recurrence.type,
        recurrence_interval: routine.recurrence.interval,
        recurrence_days_of_week: routine.recurrence.daysOfWeek,
        recurrence_day_of_month: routine.recurrence.dayOfMonth,
        recurrence_end_date: routine.recurrence.endDate, // New: Add recurrence end date
        completion_rate: normalizedEditingRoutine?.completion_rate || 0, // Use normalizedEditingRoutine
      };

      // Calculate the actual next_due_date for the backend using the utility
      routineData.next_due_date = calculateNextDueDate(
        routine.next_due_date, // This is the first due date from UI (ISO string)
        routine.recurrence.type,
        routine.recurrence.interval,
        routine.recurrence.daysOfWeek,
        routine.recurrence.dayOfMonth
      );

      let savedRoutine;

      if (mode === 'edit' && normalizedEditingRoutine?.id) { // Use normalizedEditingRoutine
        // When editing, `normalizedEditingRoutine` contains the original data
        const originalRoutineData = {
          ...normalizedEditingRoutine, // Use normalizedEditingRoutine
          checklist_items: normalizedEditingRoutine.checklist_items || [],
          // Need to ensure original data has recurrence fields for accurate audit logging
          recurrence_type: normalizedEditingRoutine.frequency, // Or a proper mapping if backend field names differ
          recurrence_interval: normalizedEditingRoutine.recurrence_interval || 1,
          recurrence_days_of_week: normalizedEditingRoutine.recurrence_days_of_week || [],
          recurrence_day_of_month: normalizedEditingRoutine.recurrence_day_of_month || null,
          recurrence_end_date: normalizedEditingRoutine.recurrence_end_date || null, // New: Include original end date
        };
        // The `next_due_date` in original data needs to be an ISO string for comparison
        originalRoutineData.next_due_date = parseDateTimeToISO(originalRoutineData.next_due_date);

        await Routine.update(normalizedEditingRoutine.id, routineData); // Use normalizedEditingRoutine
        savedRoutine = { ...routineData, id: normalizedEditingRoutine.id }; // Use normalizedEditingRoutine

        // Audit routine update
        if (currentUser) {
            await auditRoutineUpdate(normalizedEditingRoutine.id, originalRoutineData, savedRoutine, currentUser.email); // Use normalizedEditingRoutine
        }
      } else {
        const created = await Routine.create(routineData);
        savedRoutine = created;

        // Audit routine creation
        if (currentUser) {
            await auditRoutineCreate(savedRoutine, currentUser.email);
            // If there was a concept of `templateUsed` in the future, it would be logged here:
            // if (routine.templateUsed) {
            //    await auditTemplateUse(routine.templateUsed.name, routine.industry, currentUser.email);
            // }
        }
      }

      toast({
        title: mode === 'edit' ? "Routine Updated!" : "Routine Created!",
        description: `"${savedRoutine.title}" has been successfully saved.`,
      });

      onClose();
    } catch (err) {
      console.error(`Error ${editingRoutine ? 'updating' : 'creating'} routine:`, err);
      toast({
        title: "Save Failed",
        description: `There was an error saving the routine. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit Routine' : 'Create New Routine'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === 'edit' ? 'Edit Routine' : 'Create New Routine'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1 pr-4 -mr-4">
          <form onSubmit={handleSaveRoutine} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
              <p className="text-slate-600">Let's start with the basics of your routine</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                    Routine Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={routine.title}
                    onChange={(e) => {
                      setRoutine({...routine, title: e.target.value});
                      if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                    }}
                    placeholder="Enter routine title"
                    className={`text-lg ${errors.title ? 'border-red-500' : ''}`}
                    autoComplete="off"
                    autoFocus
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_basic" className="text-sm font-semibold text-slate-700">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="estimated_duration_basic"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={routine.estimated_duration}
                    onChange={(e) => setRoutine({...routine, estimated_duration: parseInt(e.target.value) || 1})}
                    placeholder="30"
                    min="1"
                    max="480"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this routine accomplishes and its purpose..."
                  value={routine.description}
                  onChange={(e) => {
                    setRoutine({...routine, description: e.target.value});
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  className="h-32"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* Schedule & Priority */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Schedule & Priority</h2>
              <p className="text-slate-600">Configure when and how often this routine runs</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-semibold text-slate-700">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Select value={routine.industry} onValueChange={(value) => {
                    setRoutine({...routine, industry: value});
                    if (errors.industry) setErrors(prev => ({ ...prev, industry: null }));
                  }}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(industryConfig).map(([key, config]) => {
                        const IconComponent = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {config.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routine_type" className="text-sm font-semibold text-slate-700">
                    Routine Type
                  </Label>
                  <Select value={routine.routine_type} onValueChange={(value) => setRoutine({...routine, routine_type: value})}>
                    <SelectTrigger id="routine_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="safety_check">Safety Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">
                    Priority <span className="text-red-500">*</span>
                  </Label>
                  <Select value={routine.priority} onValueChange={(value) => setRoutine({...routine, priority: value})}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Critical Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Scheduling & Assignment Section - Updated */}
            <div className="space-y-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Scheduling & Assignment
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="next_due_date">First Due Date & Time <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          id="next_due_date"
                          variant={"outline"} 
                          className={`w-full justify-start text-left font-normal mt-1 ${errors.next_due_date ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {routine.next_due_date 
                            ? format(new Date(routine.next_due_date), 'PPP')
                            : <span>Pick a date</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={routine.next_due_date ? new Date(routine.next_due_date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const currentTime = routine.next_due_date 
                                ? new Date(routine.next_due_date) 
                                : new Date();
                              const newDateTime = new Date(date);
                              newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
                              setRoutine({ 
                                ...routine, 
                                next_due_date: newDateTime.toISOString() 
                              });
                              if (errors.next_due_date) setErrors(prev => ({ ...prev, next_due_date: null }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={routine.next_due_date 
                        ? format(new Date(routine.next_due_date), 'HH:mm')
                        : '09:00'
                      }
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const currentDate = routine.next_due_date 
                          ? new Date(routine.next_due_date)
                          : new Date();
                        currentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                        setRoutine({ 
                          ...routine, 
                          next_due_date: currentDate.toISOString() 
                        });
                      }}
                      className="w-32 mt-1"
                    />
                  </div>
                  {errors.next_due_date && <p className="text-red-500 text-sm mt-1">{errors.next_due_date}</p>}
                </div>
                <div>
                  <Label>Recurrence Pattern <span className="text-red-500">*</span></Label>
                  <Select
                    value={routine.recurrence?.type || 'none'}
                    onValueChange={(value) => {
                      handleRecurrenceChange('type', value);
                      if (errors.recurrence) setErrors(prev => ({ ...prev, recurrence: null }));
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.recurrence ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.recurrence && <p className="text-red-500 text-sm mt-1">{errors.recurrence}</p>}
                </div>
              </div>

              {/* Recurrence Configuration */}
              {routine.recurrence?.type && routine.recurrence.type !== 'none' && (
                <div className="space-y-4 p-4 bg-slate-100 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap">Repeat every <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={routine.recurrence.interval || 1}
                      onChange={(e) => {
                        handleRecurrenceChange('interval', parseInt(e.target.value, 10));
                        if (errors.recurrence_interval) setErrors(prev => ({ ...prev, recurrence_interval: null }));
                      }}
                      className={`w-20 ${errors.recurrence_interval ? 'border-red-500' : ''}`}
                    />
                    <span className="text-sm text-slate-600">
                      {routine.recurrence.type === 'daily' && 'day(s)'}
                      {routine.recurrence.type === 'weekly' && 'week(s)'}
                      {routine.recurrence.type === 'monthly' && 'month(s)'}
                    </span>
                  </div>
                  {errors.recurrence_interval && <p className="text-red-500 text-sm mt-1">{errors.recurrence_interval}</p>}

                  {/* Weekly Configuration */}
                  {routine.recurrence.type === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Repeat on <span className="text-red-500">*</span></Label>
                      <div className={`flex gap-1 flex-wrap ${errors.recurrence_daysOfWeek ? 'border-red-500 rounded-md p-1' : ''}`}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <Button
                            key={day}
                            type="button"
                            variant={routine.recurrence.daysOfWeek?.includes(index) ? 'default' : 'outline'}
                            size="sm"
                            className="w-12 h-8 text-xs"
                            onClick={() => {
                              toggleWeekDay(index);
                              if (errors.recurrence_daysOfWeek) setErrors(prev => ({ ...prev, recurrence_daysOfWeek: null }));
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {errors.recurrence_daysOfWeek && <p className="text-red-500 text-sm mt-1">{errors.recurrence_daysOfWeek}</p>}
                    </div>
                  )}

                  {/* Monthly Configuration */}
                  {routine.recurrence.type === 'monthly' && (
                    <div className="space-y-2">
                      <Label>Monthly on day <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={routine.recurrence.dayOfMonth || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          handleRecurrenceChange('dayOfMonth', val);
                          if (errors.recurrence_dayOfMonth) setErrors(prev => ({ ...prev, recurrence_dayOfMonth: null }));
                        }}
                        placeholder="Same day as start date"
                        className={`w-32 ${errors.recurrence_dayOfMonth ? 'border-red-500' : ''}`}
                      />
                      <p className="text-xs text-slate-500">
                        Leave empty to use the same day as the initial due date
                      </p>
                      {errors.recurrence_dayOfMonth && <p className="text-red-500 text-sm mt-1">{errors.recurrence_dayOfMonth}</p>}
                    </div>
                  )}

                  {/* End Date Configuration */}
                  <div className="space-y-2">
                    <Label>End recurrence (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={`justify-start text-left font-normal w-full ${errors.recurrence_endDate ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {routine.recurrence.endDate 
                            ? format(new Date(routine.recurrence.endDate), 'PPP')
                            : 'No end date'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={routine.recurrence.endDate ? new Date(routine.recurrence.endDate) : undefined}
                          onSelect={(date) => {
                            handleRecurrenceChange('endDate', date ? date.toISOString().split('T')[0] : null); // Store as YYYY-MM-DD
                            if (errors.recurrence_endDate) setErrors(prev => ({ ...prev, recurrence_endDate: null }));
                          }}
                          disabled={(date) => {
                            const firstDueDate = routine.next_due_date ? new Date(routine.next_due_date) : new Date();
                            // End date must be at least one day after the first due date to ensure at least one recurrence beyond the first
                            return date < addDays(firstDueDate, 1);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {routine.recurrence.endDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleRecurrenceChange('endDate', null);
                          if (errors.recurrence_endDate) setErrors(prev => ({ ...prev, recurrence_endDate: null }));
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear end date
                      </Button>
                    )}
                    {errors.recurrence_endDate && <p className="text-red-500 text-sm mt-1">{errors.recurrence_endDate}</p>}
                  </div>

                  {/* Recurrence Preview */}
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-900">Recurrence Summary</p>
                    <p className="text-sm text-blue-700">{getRecurrencePreview()}</p>
                    {routine.recurrence.endDate && (
                      <p className="text-xs text-blue-600 mt-1">
                        Ends on {format(new Date(routine.recurrence.endDate), 'PPP')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            

              {/* Assignments Sub-section */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900">Assignments</h4>
                <p className="text-slate-600 text-sm">Assign this routine to specific individuals or teams.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="assigned_to">Assign to Individuals</Label>
                    <MultiSelectUsers
                      availableUsers={allUsers}
                      selectedEmails={routine.assigned_to}
                      onChange={(selected) => setRoutine({...routine, assigned_to: selected})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assigned_team_ids">Assign to Teams</Label>
                    <MultiSelectTeams
                      availableTeams={allTeams}
                      selectedTeamIds={routine.assigned_team_ids}
                      onChange={(selected) => setRoutine({...routine, assigned_team_ids: selected})}
                    />
                  </div>
                </div>
              </div>
              {errors.assignment && (
                <p className="text-red-500 text-sm mt-2">{errors.assignment}</p>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-6 h-6"/>
                File Attachments
              </h2>
              <p className="text-slate-600">Attach SOPs, schematics, or reference photos to this routine definition.</p>

              <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white transition-colors
                    ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'}`
                  }
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Attach Files
                    </>
                  )}
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Select multiple files (max 100MB each). Supported: PDF, DOC, images, videos.
                </p>
              </div>

              {routine.attached_files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800">Attached Files:</h3>
                  <ul className="space-y-2">
                    {routine.attached_files.map((file) => (
                      <li key={file.url} className="flex items-center justify-between p-2 bg-slate-100 rounded-md border">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate" title={file.name}>
                            {file.name}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachedFile(file.url)}
                          disabled={isUploading}
                          className="text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Checklist Items</h2>
              <p className="text-slate-600">Define the specific tasks for this routine</p>
              {errors.checklist && <p className="text-red-500 text-sm mt-1">{errors.checklist}</p>}


              <div className="space-y-4">
                {checklistItems.map((item, index) => (
                  <Card key={item.id} className="border-2 border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Task {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.required}
                              onCheckedChange={(checked) => updateChecklistItem(item.id, 'required', checked)}
                            />
                            <span className="text-sm text-slate-600">
                              {item.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                        </div>
                        {checklistItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChecklistItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Task title (e.g., Check emergency exits)"
                        value={item.title}
                        onChange={(e) => updateChecklistItem(item.id, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Additional details or instructions (optional)"
                        value={item.description}
                        onChange={(e) => updateChecklistItem(item.id, 'description', e.target.value)}
                        className="h-20"
                      />
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addChecklistItem}
                  className="w-full border-dashed border-2 border-slate-300 hover:border-slate-400 py-8"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Another Task
                </Button>
              </div>
            </div>

            {/* Review Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Review & Summary</h2>
              <p className="text-slate-600">A quick look at your routine details</p>

              <Card className="border-2 border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    {industryConfig[routine.industry]?.icon && (
                      <div className={`p-3 rounded-xl ${industryConfig[routine.industry]?.color} bg-opacity-10`}>
                        {React.createElement(industryConfig[routine.industry].icon, { className: `w-6 h-6 ${industryConfig[routine.industry]?.color.replace('bg-', 'text-')}` })}
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                        {routine.title || 'Untitled Routine'}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={
                          routine.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                          routine.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          routine.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-green-100 text-green-700 border-green-200'
                        }>
                          {routine.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {routine.recurrence.type === 'none' ? 'One-time' : routine.recurrence.type}
                        </Badge>
                        <Badge variant="outline">
                          {industryConfig[routine.industry]?.name || 'N/A'}
                        </Badge>
                        {routine.assigned_team_ids.length > 0 && (
                            <Badge variant="secondary">
                                {routine.assigned_team_ids.length} Teams
                            </Badge>
                        )}
                        {routine.assigned_to.length > 0 && (
                            <Badge variant="secondary">
                                {routine.assigned_to.length} Users
                            </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    {routine.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {routine.estimated_duration} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {checklistItems.filter(item => item.title.trim()).length} tasks
                    </div>
                  </div>

                  {routine.attached_files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900">Attached Files:</h4>
                      <ul className="space-y-1">
                        {routine.attached_files.map((file) => (
                          <li key={file.url} className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-slate-500" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Checklist Items:</h4>
                    <div className="space-y-2">
                      {checklistItems
                        .filter(item => item.title.trim())
                        .map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {item.title}
                              {!item.required && (
                                <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                              )}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {checklistItems.filter(item => item.title.trim()).length === 0 && (
                        <p className="text-sm text-slate-500">No checklist items defined.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              onClick={handleSaveRoutine}
              disabled={isSaving || isUploading}
              className="gap-2"
            >
              {isSaving || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isUploading ? 'Uploading Files...' : (mode === 'edit' ? 'Updating...' : 'Creating...')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {mode === 'edit' ? 'Update Routine' : 'Create Routine'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
