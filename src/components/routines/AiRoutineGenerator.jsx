
import React, { useState, useEffect, useCallback } from 'react';
import { InvokeLLM } from "@/api/integrations";
import { Routine } from "@/api/entities";
import { User } from "@/api/entities";
import { TierLimit } from "@/api/entities";
import { checkAndUpdateAIUsage, getAIUsage } from "@/components/shared/usageHelpers";
import { auditAIGeneration } from "@/components/shared/auditLogger";

import UpgradeModal from "@/components/shared/UpgradeModal";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function AiRoutineGenerator({ onClose }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [tierLimits, setTierLimits] = useState(null);
  const [aiUsage, setAiUsage] = useState({ used: 0, remaining: null, limit: null });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { toast } = useToast();

  const loadUserData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.tier) {
        const limits = await TierLimit.filter({ tier: user.tier });
        if (limits.length > 0) {
          setTierLimits(limits[0]);
          const currentUsage = await getAIUsage(user, limits[0]);
          setAiUsage(currentUsage);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error loading user data",
        description: "Could not fetch user information or tier limits.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please describe the routine you want to generate.",
        variant: "destructive",
      });
      return;
    }

    // Pre-flight check for tier and usage BEFORE attempting to generate
    // Note: checkAndUpdateAIUsage increments usage if canUse is true.
    // If the user is then blocked by the modal, the increment has already happened.
    // This is the current design of usageHelpers and is preserved.
    const usageCheck = await checkAndUpdateAIUsage(currentUser, tierLimits);
    if (!usageCheck.canUse) {
      if (currentUser?.tier === 'free' || (currentUser?.tier === 'pro' && aiUsage.remaining <= 0)) {
        setShowUpgradeModal(true);
      } else {
        // Fallback for other non-canUse scenarios, though UpgradeModal should cover most
        toast({
          title: "Generation Blocked",
          description: usageCheck.message || "You've reached your monthly limit of AI generations.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsGenerating(true);
    setGeneratedRoutine(null); // Clear previous generated routine
    toast({
      title: "Generating Routine...",
      description: "Our AI is crafting your routine. This may take a moment.",
    });

    try {
      const response = await InvokeLLM({
        prompt: `Create a detailed operational routine based on this request: "${prompt}". 
        
        Please provide a comprehensive routine with the following structure:
        - A clear, actionable title
        - A detailed description
        - An appropriate industry category (choose from: manufacturing, healthcare, industrial_maintenance, facilities_maintenance, construction, logistics_supply_chain)
        - A routine type based on the request:
          * "routine" for standard operational procedures and checklists
          * "gemba" for observation-based walks, floor visits, and frontline engagement activities
          * "layered_audit" for systematic verification processes, compliance checks, and multi-level audits
        - A suitable frequency (daily, weekly, monthly, quarterly)
        - A priority level (critical, high, medium, low)
        - An estimated duration in minutes
        - A realistic default time when this routine should typically be performed (in HH:mm format, 24-hour)
          * Consider industry context (e.g., manufacturing safety checks at shift start 07:00, healthcare rounds at 08:00)
          * GEMBA walks should typically be mid-morning when operations are active (09:00-10:00)
          * Audits often work best in afternoons (13:00-15:00) 
          * Safety briefings should be before work starts (07:00-07:30)
        - A comprehensive checklist of 5-8 specific tasks/items that need to be completed
        
        Make sure the routine is practical, industry-appropriate, and follows operational best practices. Choose the routine_type and default_time carefully based on the nature of the request.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            industry: {
              type: "string",
              enum: ["manufacturing", "healthcare", "industrial_maintenance", "facilities_maintenance", "construction", "logistics_supply_chain"]
            },
            routine_type: {
              type: "string",
              enum: ["routine", "gemba", "layered_audit"]
            },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly", "quarterly"]
            },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium", "low"]
            },
            estimated_duration: { type: "number" },
            default_time: { 
              type: "string",
              pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
              description: "Default time in HH:mm format (24-hour)"
            },
            checklist_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  required: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      // Add IDs to checklist items and set default 'completed' status
      const processedRoutine = {
        ...response,
        checklist_items: response.checklist_items.map((item, index) => ({
          id: `item_${index + 1}`,
          title: item.title,
          description: item.description,
          required: item.required !== false, // Default to true if not explicitly false
          completed: false
        })),
        // Convert default_time to scheduled_time for the form
        scheduled_time: response.default_time || "09:00"
      };

      setGeneratedRoutine(processedRoutine);
      
      // Audit the AI generation
      await auditAIGeneration(prompt, processedRoutine);

      // Update usage display after successful generation
      const newUsage = await getAIUsage(currentUser, tierLimits);
      setAiUsage(newUsage);

      toast({
        title: "Routine Generated!",
        description: "Review the generated routine below and customize it.",
      });

    } catch (error) {
      console.error('Error generating routine:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the routine. Please try again or refine your prompt.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedRoutine) {
      toast({
        title: "No Routine to Save",
        description: "Please generate a routine first before trying to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get tomorrow's date as default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDate = tomorrow.toISOString().split('T')[0];

      await Routine.create({
        ...generatedRoutine,
        status: 'draft',
        next_due_date: defaultDate,
        // Remove default_time as it's now handled by scheduled_time
        default_time: undefined
      });

      toast({
        title: "Routine Saved!",
        description: "Your new routine has been successfully added.",
        variant: "success",
      });
      onClose(); // Close the modal after successful save
    } catch (error) {
      console.error('Error saving routine:', error);
      toast({
        title: "Failed to Save Routine",
        description: "There was an error saving the routine. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-violet-600" />
              AI Routine Generator
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                {currentUser?.tier === 'pro_plus' ? 'Unlimited' : 'Pro Feature'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Describe what kind of routine you need, and AI will generate a comprehensive operational checklist for you.
              {aiUsage.limit !== null && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Monthly Usage: </span>
                  <span className={aiUsage.remaining <= 5 && aiUsage.remaining > 0 ? 'text-orange-600' : (aiUsage.remaining === 0 ? 'text-red-600' : 'text-slate-600')}>
                    {aiUsage.used}/{aiUsage.limit} generations used
                  </span>
                  {aiUsage.remaining <= 5 && aiUsage.remaining > 0 && (
                    <span className="text-orange-600 ml-2">({aiUsage.remaining} remaining)</span>
                  )}
                   {aiUsage.remaining === 0 && (
                    <span className="text-red-600 ml-2">(Limit Reached)</span>
                  )}
                </div>
              )}
              {currentUser?.tier === 'pro_plus' && (
                <div className="mt-2 text-xs text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
                  Unlimited generations are subject to our fair use policy to ensure service quality for all users.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {!generatedRoutine ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Describe the routine you need</Label>
                <Textarea
                  id="prompt"
                  placeholder="Example: Daily safety inspection checklist for manufacturing floor, including equipment checks and hazard identification..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for better results:</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                  <li>Be specific about your industry and context</li>
                  <li>Mention frequency (daily, weekly, monthly)</li>
                  <li>Include any safety or compliance requirements</li>
                  <li>Specify the type of equipment or processes involved</li>
                  <li>Mention if it's a "GEMBA walk" or "Layered Audit" for specific routine types</li>
                </ul>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || (aiUsage.remaining !== null && aiUsage.remaining <= 0 && currentUser?.tier !== 'pro_plus')}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Routine
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Generated routine display */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Routine Generated Successfully!</h3>
                </div>
                <p className="text-sm text-emerald-700">
                  Review the generated routine below and click "Save Routine" to add it to your templates.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{generatedRoutine.title}</h3>
                  <p className="text-slate-600 mt-1">{generatedRoutine.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                    {generatedRoutine.industry?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge className={`${
                    generatedRoutine.routine_type === 'gemba' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    generatedRoutine.routine_type === 'layered_audit' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {generatedRoutine.routine_type === 'gemba' ? 'GEMBA Walk' :
                     generatedRoutine.routine_type === 'layered_audit' ? 'Layered Audit' :
                     'Standard Routine'}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {generatedRoutine.frequency}
                  </Badge>
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                    {generatedRoutine.priority} priority
                  </Badge>
                  <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                    ~{generatedRoutine.estimated_duration} minutes @ {generatedRoutine.default_time || generatedRoutine.scheduled_time}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Checklist Items:</h4>
                  <div className="space-y-2">
                    {generatedRoutine.checklist_items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                        <div className="w-5 h-5 border-2 border-slate-300 rounded mt-0.5 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-slate-900">{item.title}</span>
                          {item.description && (
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setGeneratedRoutine(null)}>
                  Generate Another
                </Button>
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Routine
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="AI Generation Limit Reached"
          message={`You've reached your monthly limit of ${tierLimits?.ai_generations_monthly} AI generations. Upgrade to Pro+ for unlimited access.`}
        />
      )}
    </>
  );
}
