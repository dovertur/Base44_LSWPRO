import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Routine, RoutineExecution } from "@/api/entities";
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Clock,
  Info,
  AlertTriangle,
  Send,
  SkipForward,
  Camera,
  Paperclip,
  Trash2,
  File as FileIcon,
  Loader2,
  UploadCloud,
  CheckCircle2,
  FileText,
  Check,
  X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getIndustryConfig } from '@/components/shared/industryConfig';
import { createPageUrl } from '@/utils';
import { UploadFile } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";
import { auditRoutineExecution } from "@/components/shared/auditLogger";
import { calculateNextDueDate } from "@/components/shared/recurrence";
import { format } from "date-fns";

const ChecklistItem = ({ item, isCompleted, onToggle, onNotesChange, notes, onMediaUpload, capturedMedia, isSubmitting }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 100 * 1024 * 1024;
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
      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    e.target.value = '';

    try {
      const uploadPromises = validFiles.map(async (file) => {
        try {
          const result = await UploadFile({ file });
          return {
            url: result.file_url,
            name: file.name,
            note: '',
            checklist_item_id: item.id
          };
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          toast({
            title: "Upload Failed",
            description: `Failed to upload "${file.name}". Please try again.`,
            variant: "destructive",
          });
          return null;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);

      if (successfulUploads.length > 0) {
        onMediaUpload(item.id, successfulUploads);
        toast({
          title: "File(s) Uploaded",
          description: `${successfulUploads.length} file(s) attached to "${item.title}".`,
        });
      } else if (oversizedFiles.length === 0) {
        toast({
          title: "No Files Uploaded",
          description: "All selected files failed to upload or no files were selected.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Overall file upload process failed:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during file upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const itemMedia = capturedMedia.filter(m => m.checklist_item_id === item.id);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            id={`item-${item.id}`} 
            checked={isCompleted}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="grid gap-1.5 leading-none flex-1">
            <Label 
              htmlFor={`item-${item.id}`} 
              className={`text-base font-medium text-slate-900 cursor-pointer ${isCompleted ? 'line-through text-slate-500' : ''}`}
            >
              {item.title} {item.required && <span className="text-red-500">*</span>}
            </Label>
            {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
            
            <div className="pt-2">
              <Textarea
                id={`notes-${item.id}`}
                placeholder="Add optional notes for this task..."
                value={notes}
                onChange={(e) => onNotesChange(item.id, e.target.value)}
                className="bg-slate-50 text-sm"
                disabled={isSubmitting}
                rows={2}
              />
            </div>
            
            <div className="pt-2">
              <input
                type="file"
                id={`media-${item.id}`} 
                className="hidden"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx" 
                capture="environment" 
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
              />
              <label
                htmlFor={`media-${item.id}`} 
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md font-semibold transition-colors
                  ${(isUploading || isSubmitting) ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'}`
                }
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> 
                    Add Photo/Video 
                  </>
                )}
                {itemMedia.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1">{itemMedia.length}</Badge>
                )}
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Max 100MB per file. Photos, videos, or documents.
              </p>

              {itemMedia.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {itemMedia.map((media, idx) => {
                    const isImage = media.name.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    const isVideo = media.name.match(/\.(mp4|webm|ogg)$/i);

                    return (
                      <a
                        key={`${media.url}-${idx}`}
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block h-24 overflow-hidden rounded-md border border-slate-200 hover:border-slate-400 transition-colors group"
                        title={media.name}
                      >
                        {isImage ? (
                          <img
                            src={media.url}
                            alt={`Attached media for ${item.title}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : isVideo ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 p-2 text-center">
                            <FileIcon className="w-6 h-6 text-slate-500 mb-1" />
                            <p className="text-xs text-slate-600 truncate w-full px-1">{media.name}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isImage ? <Camera className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ExecuteRoutine() {
  const [routine, setRoutine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [itemNotes, setItemNotes] = useState({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [capturedMedia, setCapturedMedia] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const routineId = new URLSearchParams(window.location.search).get('id');
  const { toast } = useToast();

  useEffect(() => {
    if (!routineId) {
      navigate(createPageUrl("MyTasks"));
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [routineData, userData] = await Promise.all([
          Routine.get(routineId),
          User.me()
        ]);
        setRoutine(routineData);
        setCurrentUser(userData);
        setCompletedItems(new Set());
        setIsRunning(true);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error Loading Routine",
          description: "Could not load routine details. Please try again.",
          variant: "destructive",
        });
        navigate(createPageUrl("MyTasks"));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [routineId, navigate, toast]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const toggleItemCompletion = useCallback((itemId) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleNotesChange = useCallback((itemId, value) => {
    setItemNotes(prev => ({ ...prev, [itemId]: value }));
  }, []);

  const handleMediaUpload = useCallback((checklistItemId, mediaFiles) => {
    setCapturedMedia(prev => [...prev, ...mediaFiles]);
  }, []);

  const handleFinishExecution = async (skipped = false) => {
    if (!routine || !currentUser) return;
    if (isFinishing) return;

    setIsFinishing(true);
    setIsRunning(false);

    try {
      const requiredItems = routine.checklist_items?.filter(item => item.required).map(item => item.id) || [];
      const completedRequiredItems = requiredItems.filter(id => completedItems.has(id));
      
      let executionStatus = 'partial';
      if (skipped) {
        executionStatus = 'skipped';
      } else if (requiredItems.length > 0 && completedRequiredItems.length === requiredItems.length) {
        executionStatus = 'completed';
      } else if (requiredItems.length === 0 && completedItems.size > 0) {
        executionStatus = 'completed';
      } else if (completedItems.size === 0 && !skipped) {
        executionStatus = 'incomplete'; 
      }

      const combinedNotes = [
        generalNotes,
        ...Object.entries(itemNotes)
          .filter(([, note]) => note.trim() !== '')
          .map(([itemId, note]) => {
            const itemTitle = routine.checklist_items.find(i => i.id === itemId)?.title || `Item ${itemId}`;
            return `--- ${itemTitle} ---\n${note}`;
          })
      ].filter(Boolean).join('\n\n');

      const execution = await RoutineExecution.create({
        routine_id: routine.id,
        executed_by: currentUser.email,
        execution_date: new Date().toISOString(),
        status: executionStatus,
        completed_items: Array.from(completedItems),
        notes: combinedNotes,
        duration_minutes: Math.round(time / 60),
        captured_media: capturedMedia,
      });

      await auditRoutineExecution(routine, execution);

      let routineUpdateData = {
        last_execution_date: new Date().toISOString(),
      };
      let calculatedNextDueDate = null;

      // Calculate the next due date using the recurrence engine
      if (routine.recurrence && routine.recurrence.type !== 'none') {
        calculatedNextDueDate = calculateNextDueDate(routine);
        if (calculatedNextDueDate) {
          routineUpdateData.next_due_date = calculatedNextDueDate.toISOString();
        } else {
          routineUpdateData.status = 'archived';
        }
      } else {
        if (executionStatus === 'completed') {
          routineUpdateData.status = 'archived';
        }
      }

      // Calculate and update completion rate
      const allExecutions = await RoutineExecution.filter({ routine_id: routine.id });
      const completedExecutions = allExecutions.filter(e => e.status === 'completed');
      const completionRate = allExecutions.length > 0 ? (completedExecutions.length / allExecutions.length) * 100 : 100;
      routineUpdateData.completion_rate = completionRate;

      await Routine.update(routine.id, routineUpdateData);

      // Conditional toast messages and navigation based on outcome
      if (skipped) {
        toast({
          title: "Routine Skipped",
          description: `"${routine.title}" was skipped.`,
        });
        navigate(createPageUrl("MyTasks"));
      } else if (executionStatus === 'completed') {
        toast({
          title: "Routine Completed! 🎉",
          description: calculatedNextDueDate
            ? `Great work! Next occurrence scheduled for ${format(calculatedNextDueDate, 'PPP')}.`
            : "Excellent work completing this routine!",
        });
        setTimeout(() => {
          navigate(createPageUrl("MyTasks"));
        }, 2000);
      } else {
        toast({
          title: "Routine Submitted",
          description: `Execution for "${routine.title}" has been recorded.`,
        });
        navigate(createPageUrl("MyTasks"));
      }

    } catch (error) {
      console.error("Error submitting execution:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your routine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFinishing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!routine) return null;

  const industry = getIndustryConfig(routine.industry);
  const IndustryIcon = industry.icon;
  const requiredCount = routine.checklist_items?.filter(item => item.required).length || 0;
  const completedRequiredCount = Array.from(completedItems).filter(itemId => 
    routine.checklist_items?.find(item => item.id === itemId)?.required
  ).length;

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className={`py-4 px-4 sm:px-6 sticky top-0 z-10 ${industry.color} text-white shadow-md`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("MyTasks"))}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedItems.size}/{routine.checklist_items.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 sm:px-6">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className={`p-6 ${industry.color} text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{routine.title}</h1>
                <p className="opacity-90 mt-1">{routine.description}</p>
              </div>
              <IndustryIcon className="w-8 h-8 opacity-50 flex-shrink-0" />
            </div>
          </div>
          <CardContent className="p-6 bg-white">
            <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4"/>Est. {routine.estimated_duration || 30} min</div>
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Priority: {routine.priority}</div>
              <div className="flex items-center gap-2"><Info className="w-4 h-4"/>{routine.frequency}</div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-slate-800">Checklist</h3>
              {routine.checklist_items && routine.checklist_items.length > 0 ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                  {routine.checklist_items.map(item => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      isCompleted={completedItems.has(item.id)}
                      onToggle={() => toggleItemCompletion(item.id)}
                      onNotesChange={handleNotesChange}
                      notes={itemNotes[item.id] || ''}
                      onMediaUpload={handleMediaUpload}
                      capturedMedia={capturedMedia}
                      isSubmitting={isFinishing}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No checklist items for this routine.</p>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="generalNotes" className="font-semibold text-lg text-slate-800">General Execution Notes</Label>
              <Textarea 
                id="generalNotes"
                placeholder="Add any overall notes, observations, or issues for the entire routine..."
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                className="min-h-[120px]"
                disabled={isFinishing}
              />
            </div>
            
            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" onClick={() => handleFinishExecution(true)} disabled={isFinishing}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Routine
              </Button>
              <Button onClick={() => handleFinishExecution(false)} disabled={isFinishing}>
                {isFinishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    Finish Execution
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}