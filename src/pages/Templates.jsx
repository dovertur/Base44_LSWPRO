
import React, { useState } from "react";
import { Routine } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Heart,
  Wrench,
  Clock,
  Users,
  Plus,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Building,
  HardHat,
  Truck,
  BookTemplate // Added BookTemplate import
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AiRoutineGenerator from "../components/routines/AiRoutineGenerator";
import RoutineBuilder from "../components/routines/RoutineBuilder";

const industryTemplates = {
  manufacturing: {
    icon: Building2,
    color: "bg-orange-500",
    lightColor: "bg-orange-50 text-orange-700 border-orange-200",
    name: "Manufacturing",
    templates: [
    {
      title: "Daily Production Safety Check",
      description: "Comprehensive safety inspection routine for production floor including equipment status, safety protocols, and emergency preparedness.",
      duration: 45,
      priority: "critical",
      routine_type: "routine",
      default_time: "07:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Inspect emergency exits and lighting", required: true },
      { id: "2", title: "Check fire suppression systems", required: true },
      { id: "3", title: "Verify PPE compliance at all stations", required: true },
      { id: "4", title: "Test emergency shutdown procedures", required: true },
      { id: "5", title: "Review safety incident reports", required: true }]

    },
    {
      title: "Weekly Equipment Maintenance",
      description: "Preventive maintenance routine for critical manufacturing equipment to ensure optimal performance and minimize downtime.",
      duration: 90,
      priority: "high",
      routine_type: "routine",
      default_time: "08:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Lubricate moving parts", required: true },
      { id: "2", title: "Check belt tension and alignment", required: true },
      { id: "3", title: "Inspect hydraulic fluid levels", required: true },
      { id: "4", title: "Test backup systems", required: true },
      { id: "5", title: "Update maintenance logs", required: true }]

    },
    {
      title: "Quality Control Audit",
      description: "Monthly quality assurance routine covering product testing, process validation, and compliance verification.",
      duration: 120,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "10:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Review quality metrics and trends", required: true },
      { id: "2", title: "Conduct product sampling and testing", required: true },
      { id: "3", title: "Verify calibration of measurement tools", required: true },
      { id: "4", title: "Audit documentation compliance", required: true }]

    },
    {
      title: "Daily GEMBA Walk - Production Line",
      description: "Observe shop floor operations, engage with team members, identify deviations and opportunities for continuous improvement.",
      duration: 30,
      priority: "high",
      routine_type: "gemba",
      default_time: "09:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Observe 5S in designated area", required: true },
      { id: "2", title: "Engage with 3 operators on standard work procedures", required: true },
      { id: "3", title: "Check visual management boards for current performance data", required: true },
      { id: "4", title: "Identify any safety hazards or 'good catches'", required: true },
      { id: "5", title: "Confirm current production status against plan", required: true },
      { id: "6", title: "Identify 1 opportunity for waste reduction", required: false }]

    },
    {
      title: "Weekly Layered Process Audit - Critical Process",
      description: "Systematic verification of adherence to critical process controls and procedures across different organizational layers.",
      duration: 60,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "14:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Verify operator adherence to work instructions", required: true },
      { id: "2", title: "Confirm proper PPE usage for designated tasks", required: true },
      { id: "3", title: "Check machine setup parameters against control plan", required: true },
      { id: "4", title: "Review last 5 production quality records", required: true },
      { id: "5", title: "Discuss corrective actions for recent non-conformances", required: true },
      { id: "6", title: "Audit raw material handling and storage", required: true },
      { id: "7", title: "Interview team member on safety procedure understanding", required: true }]

    },
    {
      title: "Machine Changeover Verification",
      description: "Standard operating procedure for verifying machine setup after product changeovers to ensure quality and safety.",
      duration: 25,
      priority: "high",
      routine_type: "routine",
      default_time: "06:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Verify correct tooling installation", required: true },
      { id: "2", title: "Check material specifications match work order", required: true },
      { id: "3", title: "Run first article inspection", required: true },
      { id: "4", title: "Confirm process parameters in specification", required: true },
      { id: "5", title: "Document changeover completion time", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Warehouse Operations",
      description: "Observe material handling, inventory management, and logistics processes to identify improvement opportunities.",
      duration: 40,
      priority: "medium",
      routine_type: "gemba",
      default_time: "11:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Observe material flow and identify bottlenecks", required: true },
      { id: "2", title: "Check inventory accuracy in sample locations", required: true },
      { id: "3", title: "Engage with warehouse staff on daily challenges", required: true },
      { id: "4", title: "Review safety compliance in material handling", required: true },
      { id: "5", title: "Identify opportunities for space optimization", required: false }]

    },
    {
      title: "Monthly Environmental Compliance Audit",
      description: "Comprehensive audit of environmental controls, waste management, and regulatory compliance requirements.",
      duration: 90,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "13:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Review waste disposal records and permits", required: true },
      { id: "2", title: "Inspect air emission control systems", required: true },
      { id: "3", title: "Verify chemical storage and labeling compliance", required: true },
      { id: "4", title: "Check spill prevention and response equipment", required: true },
      { id: "5", title: "Update environmental incident tracking", required: true }]

    },
    {
      title: "Shift Handoff Communication Check",
      description: "Daily routine to ensure effective communication and knowledge transfer between production shifts.",
      duration: 15,
      priority: "medium",
      routine_type: "routine",
      default_time: "15:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Review production metrics from previous shift", required: true },
      { id: "2", title: "Communicate quality issues and corrective actions", required: true },
      { id: "3", title: "Update maintenance requests and status", required: true },
      { id: "4", title: "Brief on safety incidents or near misses", required: true },
      { id: "5", title: "Confirm material availability for upcoming production", required: true }]

    },
    {
      title: "Supplier Receiving GEMBA Walk",
      description: "Weekly observation of incoming material receiving process to ensure quality standards and identify process improvements.",
      duration: 35,
      priority: "medium",
      routine_type: "gemba",
      default_time: "10:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [4] }, // Default to Thursday
      checklist_items: [
      { id: "1", title: "Observe incoming inspection procedures", required: true },
      { id: "2", title: "Check supplier packaging and labeling accuracy", required: true },
      { id: "3", title: "Review receiving documentation completeness", required: true },
      { id: "4", title: "Engage with receiving staff on supplier performance", required: true },
      { id: "5", title: "Identify opportunities to reduce receiving time", required: false }]

    }]

  },
  healthcare: {
    icon: Heart,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    name: "Healthcare",
    templates: [
    {
      title: "Patient Care Round Protocol",
      description: "Standardized patient assessment routine ensuring comprehensive care delivery and documentation across all units.",
      duration: 60,
      priority: "critical",
      routine_type: "routine",
      default_time: "08:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Review patient vital signs and charts", required: true },
      { id: "2", title: "Assess medication administration records", required: true },
      { id: "3", title: "Evaluate patient comfort and needs", required: true },
      { id: "4", title: "Update care plans as needed", required: true },
      { id: "5", title: "Document patient interactions", required: true }]

    },
    {
      title: "Infection Control Inspection",
      description: "Weekly infection prevention routine covering sanitation protocols, PPE compliance, and contamination prevention measures.",
      duration: 75,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "11:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Inspect hand hygiene stations", required: true },
      { id: "2", title: "Verify PPE stock and compliance", required: true },
      { id: "3", title: "Check isolation room protocols", required: true },
      { id: "4", title: "Review waste disposal procedures", required: true },
      { id: "5", title: "Test sterilization equipment", required: true }]

    },
    {
      title: "Staff Competency Review",
      description: "Monthly evaluation of staff skills, training compliance, and professional development needs assessment.",
      duration: 90,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "15:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Review certification expiration dates", required: true },
      { id: "2", title: "Assess skill demonstration requirements", required: true },
      { id: "3", title: "Plan continuing education programs", required: true },
      { id: "4", title: "Update staff competency records", required: true }]

    },
    {
      title: "Daily GEMBA Walk - Emergency Department",
      description: "Observe emergency department operations to identify patient flow issues and opportunities for improvement.",
      duration: 45,
      priority: "high",
      routine_type: "gemba",
      default_time: "10:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Observe patient triage and waiting areas", required: true },
      { id: "2", title: "Check equipment availability and functionality", required: true },
      { id: "3", title: "Engage with staff about workflow challenges", required: true },
      { id: "4", title: "Review current patient volumes and acuity", required: true },
      { id: "5", title: "Identify bottlenecks in patient flow", required: true }]

    },
    {
      title: "Medication Administration Audit",
      description: "Weekly audit of medication preparation, documentation, and administration practices across nursing units.",
      duration: 60,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "14:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Review medication reconciliation accuracy", required: true },
      { id: "2", title: "Observe 5 rights of medication administration", required: true },
      { id: "3", title: "Check controlled substance documentation", required: true },
      { id: "4", title: "Verify high-alert medication protocols", required: true },
      { id: "5", title: "Review medication error reporting", required: true }]

    },
    {
      title: "Patient Room Safety Check",
      description: "Daily routine inspection of patient rooms to ensure safety, cleanliness, and equipment functionality.",
      duration: 30,
      priority: "high",
      routine_type: "routine",
      default_time: "07:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check call light and communication systems", required: true },
      { id: "2", title: "Inspect bed safety rails and positioning", required: true },
      { id: "3", title: "Verify emergency equipment accessibility", required: true },
      { id: "4", title: "Assess room cleanliness and supply levels", required: true },
      { id: "5", title: "Document any maintenance needs", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Surgical Suite",
      description: "Observe surgical preparation, turnover processes, and team communication to identify improvement opportunities.",
      duration: 50,
      priority: "high",
      routine_type: "gemba",
      default_time: "09:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Observe surgical prep and timeout procedures", required: true },
      { id: "2", title: "Check instrument sterilization and tracking", required: true },
      { id: "3", title: "Review room turnover efficiency", required: true },
      { id: "4", title: "Engage with surgical team about challenges", required: true },
      { id: "5", title: "Identify opportunities to reduce delays", required: false }]

    },
    {
      title: "Patient Satisfaction Follow-up",
      description: "Weekly routine to review patient feedback, address concerns, and improve service delivery quality.",
      duration: 40,
      priority: "medium",
      routine_type: "routine",
      default_time: "16:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [4] }, // Default to Thursday
      checklist_items: [
      { id: "1", title: "Review recent patient satisfaction scores", required: true },
      { id: "2", title: "Follow up on specific patient complaints", required: true },
      { id: "3", title: "Identify common themes in feedback", required: true },
      { id: "4", title: "Plan improvement actions based on feedback", required: true },
      { id: "5", title: "Communicate findings to relevant departments", required: true }]

    },
    {
      title: "Emergency Response Drill Audit",
      description: "Monthly assessment of emergency response preparedness, equipment, and staff readiness.",
      duration: 75,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "12:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Test emergency communication systems", required: true },
      { id: "2", title: "Verify crash cart and defibrillator functionality", required: true },
      { id: "3", title: "Review staff response times to codes", required: true },
      { id: "4", title: "Check emergency medication expiration dates", required: true },
      { id: "5", title: "Update emergency contact information", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Patient Discharge Process",
      description: "Observe patient discharge coordination to identify delays and improve patient experience.",
      duration: 35,
      priority: "medium",
      routine_type: "gemba",
      default_time: "13:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [5] }, // Default to Friday
      checklist_items: [
      { id: "1", title: "Observe discharge planning and coordination", required: true },
      { id: "2", title: "Check medication reconciliation accuracy", required: true },
      { id: "3", title: "Review patient education effectiveness", required: true },
      { id: "4", title: "Engage with discharge coordinators about barriers", required: true },
      { id: "5", title: "Identify opportunities to reduce discharge delays", required: false }]

    }]

  },
  industrial_maintenance: {
    icon: Wrench,
    color: "bg-violet-500",
    lightColor: "bg-violet-50 text-violet-700 border-violet-200",
    name: "Industrial Maintenance",
    templates: [
    {
      title: "Daily Equipment Status Check",
      description: "Comprehensive inspection of critical industrial equipment to prevent breakdowns and ensure operational efficiency.",
      duration: 50,
      priority: "high",
      routine_type: "routine",
      default_time: "06:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check motor temperatures and vibrations", required: true },
      { id: "2", title: "Inspect belt tensions and alignments", required: true },
      { id: "3", title: "Verify lubrication levels and schedules", required: true },
      { id: "4", title: "Test safety shutdown systems", required: true },
      { id: "5", title: "Document equipment performance metrics", required: true }]

    },
    {
      title: "Weekly Preventive Maintenance Rounds",
      description: "Systematic preventive maintenance routine targeting critical infrastructure and equipment longevity.",
      duration: 120,
      priority: "high",
      routine_type: "routine",
      default_time: "13:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Lubricate mechanical components per schedule", required: true },
      { id: "2", title: "Check electrical connections and panels", required: true },
      { id: "3", title: "Inspect structural integrity points", required: true },
      { id: "4", title: "Test backup power systems", required: true },
      { id: "5", title: "Update maintenance schedules and records", required: true }]

    },
    {
      title: "Monthly Safety Compliance Audit",
      description: "Comprehensive audit ensuring regulatory compliance, safety standards, and risk mitigation protocols.",
      duration: 150,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "09:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Review safety incident reports and trends", required: true },
      { id: "2", title: "Inspect fire safety and suppression equipment", required: true },
      { id: "3", title: "Verify regulatory compliance documentation", required: true },
      { id: "4", title: "Conduct risk assessment updates", required: true },
      { id: "5", title: "Audit lockout/tagout procedures", required: true }]

    },
    {
      title: "Daily GEMBA Walk - Maintenance Workshop",
      description: "Observe maintenance work practices, tool organization, and identify opportunities for process improvement.",
      duration: 30,
      priority: "medium",
      routine_type: "gemba",
      default_time: "10:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Observe 5S implementation in workshop areas", required: true },
      { id: "2", title: "Check tool availability and organization", required: true },
      { id: "3", title: "Engage with technicians about work challenges", required: true },
      { id: "4", title: "Review current work order priorities", required: true },
      { id: "5", title: "Identify waste in maintenance processes", required: false }]

    },
    {
      title: "Weekly Condition Monitoring Audit",
      description: "Systematic review of predictive maintenance data and condition monitoring systems performance.",
      duration: 80,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "11:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Review vibration analysis trending data", required: true },
      { id: "2", title: "Check thermal imaging results and alerts", required: true },
      { id: "3", title: "Verify oil analysis reports and recommendations", required: true },
      { id: "4", title: "Update predictive maintenance schedules", required: true },
      { id: "5", title: "Document condition monitoring findings", required: true }]

    },
    {
      title: "Steam System Inspection",
      description: "Daily inspection of steam generation and distribution systems for safety and efficiency.",
      duration: 40,
      priority: "critical",
      routine_type: "routine",
      default_time: "07:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check boiler pressure and temperature readings", required: true },
      { id: "2", title: "Inspect steam traps for proper operation", required: true },
      { id: "3", title: "Verify safety valve functionality", required: true },
      { id: "4", title: "Check condensate return system", required: true },
      { id: "5", title: "Document any leaks or anomalies", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Equipment Reliability",
      description: "Walk through production areas to observe equipment performance and maintenance practices.",
      duration: 45,
      priority: "high",
      routine_type: "gemba",
      default_time: "14:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Observe operator equipment care practices", required: true },
      { id: "2", title: "Check autonomous maintenance implementation", required: true },
      { id: "3", title: "Review equipment cleaning standards", required: true },
      { id: "4", title: "Engage with operators about equipment issues", required: true },
      { id: "5", title: "Identify reliability improvement opportunities", required: false }]

    },
    {
      title: "Compressed Air System Check",
      description: "Weekly inspection of compressed air generation and distribution for energy efficiency and reliability.",
      duration: 35,
      priority: "medium",
      routine_type: "routine",
      default_time: "08:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [4] }, // Default to Thursday
      checklist_items: [
      { id: "1", title: "Check compressor loading and efficiency", required: true },
      { id: "2", title: "Inspect air dryer and filter systems", required: true },
      { id: "3", title: "Test condensate drainage systems", required: true },
      { id: "4", title: "Check for air leaks in distribution", required: true },
      { id: "5", title: "Review system pressure optimization", required: true }]

    },
    {
      title: "Monthly Electrical System Audit",
      description: "Comprehensive electrical system inspection focusing on safety, compliance, and preventive maintenance.",
      duration: 100,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "12:30",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Thermally scan electrical panels and connections", required: true },
      { id: "2", title: "Test ground fault protection systems", required: true },
      { id: "3", title: "Verify arc flash labeling and boundaries", required: true },
      { id: "4", title: "Review electrical maintenance records", required: true },
      { id: "5", title: "Update electrical safety procedures", required: true }]

    },
    {
      title: "Spare Parts Inventory GEMBA Walk",
      description: "Weekly observation of spare parts management to optimize inventory levels and organization.",
      duration: 25,
      priority: "low",
      routine_type: "gemba",
      default_time: "16:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [5] }, // Default to Friday
      checklist_items: [
      { id: "1", title: "Review critical spare parts availability", required: true },
      { id: "2", title: "Check parts storage organization and labeling", required: true },
      { id: "3", title: "Engage with storeroom staff about usage patterns", required: true },
      { id: "4", title: "Identify slow-moving or obsolete inventory", required: true },
      { id: "5", title: "Assess opportunities for inventory optimization", required: false }]

    }]

  },
  facilities_maintenance: {
    icon: Building,
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200",
    name: "Facilities Maintenance",
    templates: [
    {
      title: "Daily Building Opening Checklist",
      description: "Ensures the facility is safe, clean, and ready for operations at the start of the day.",
      duration: 30,
      priority: "high",
      routine_type: "routine",
      default_time: "07:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Inspect exterior for hazards or vandalism", required: true },
      { id: "2", title: "Verify all access doors are secure and operational", required: true },
      { id: "3", title: "Check interior lighting and replace bulbs as needed", required: true },
      { id: "4", title: "Inspect restrooms for cleanliness and supplies", required: true },
      { id: "5", title: "Verify HVAC is operating at correct setpoints", required: true }]

    },
    {
      title: "Monthly Fire Safety Inspection",
      description: "Comprehensive check of all fire prevention and suppression systems within the facility.",
      duration: 60,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "10:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Check fire extinguisher charge and accessibility", required: true },
      { id: "2", title: "Test smoke detectors and fire alarm system", required: true },
      { id: "3", title: "Inspect emergency exit signs and lighting", required: true },
      { id: "4", title: "Ensure exit paths and fire doors are unobstructed", required: true },
      { id: "5", title: "Update fire safety logbook", required: true }]

    },
    {
      title: "HVAC System Performance Check",
      description: "Weekly inspection of heating, ventilation, and air conditioning systems for optimal performance and energy efficiency.",
      duration: 45,
      priority: "high",
      routine_type: "routine",
      default_time: "09:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Check air filter condition and replace if needed", required: true },
      { id: "2", title: "Verify temperature setpoints and actual readings", required: true },
      { id: "3", title: "Inspect belt tension and condition", required: true },
      { id: "4", title: "Clean condenser coils and check refrigerant levels", required: true },
      { id: "5", title: "Test thermostat calibration and operation", required: true }]

    },
    {
      title: "Daily GEMBA Walk - Common Areas",
      description: "Observe facility common areas to identify cleanliness, safety, and maintenance issues.",
      duration: 25,
      priority: "medium",
      routine_type: "gemba",
      default_time: "11:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Observe cleanliness and organization of lobbies", required: true },
      { id: "2", title: "Check functionality of common area equipment", required: true },
      { id: "3", title: "Engage with occupants about facility issues", required: true },
      { id: "4", title: "Identify potential safety hazards", required: true },
      { id: "5", title: "Note opportunities for aesthetic improvements", required: false }]

    },
    {
      title: "Weekly Space Utilization Audit",
      description: "Systematic review of space usage patterns and opportunities for optimization.",
      duration: 50,
      priority: "medium",
      routine_type: "layered_audit",
      default_time: "14:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Review occupancy patterns in conference rooms", required: true },
      { id: "2", title: "Check storage area organization and capacity", required: true },
      { id: "3", title: "Assess common area utilization rates", required: true },
      { id: "4", title: "Identify underutilized or overcrowded spaces", required: true },
      { id: "5", title: "Document space optimization recommendations", required: true }]

    },
    {
      title: "Plumbing System Inspection",
      description: "Daily check of plumbing systems including water pressure, leaks, and fixture functionality.",
      duration: 20,
      priority: "medium",
      routine_type: "routine",
      default_time: "08:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check water pressure at key fixtures", required: true },
      { id: "2", title: "Inspect for visible leaks or water damage", required: true },
      { id: "3", title: "Test hot water temperature and availability", required: true },
      { id: "4", title: "Verify proper drainage in sinks and floor drains", required: true },
      { id: "5", title: "Check water heater operation and pressure relief", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Maintenance Operations",
      description: "Observe maintenance work practices and identify opportunities for process improvement.",
      duration: 35,
      priority: "medium",
      routine_type: "gemba",
      default_time: "15:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Observe maintenance workflow and organization", required: true },
      { id: "2", title: "Check maintenance supply inventory levels", required: true },
      { id: "3", title: "Engage with maintenance staff about challenges", required: true },
      { id: "4", title: "Review work order completion efficiency", required: true },
      { id: "5", title: "Identify opportunities to reduce response times", required: false }]

    },
    {
      title: "Lighting System Maintenance",
      description: "Weekly inspection and maintenance of interior and exterior lighting systems.",
      duration: 40,
      priority: "medium",
      routine_type: "routine",
      default_time: "16:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [4] }, // Default to Thursday
      checklist_items: [
      { id: "1", title: "Replace burned-out bulbs throughout facility", required: true },
      { id: "2", title: "Check emergency lighting battery backup", required: true },
      { id: "3", title: "Clean light fixtures and lenses", required: true },
      { id: "4", title: "Test motion sensor and timer operation", required: true },
      { id: "5", title: "Verify exterior security lighting functionality", required: true }]

    },
    {
      title: "Monthly Elevator Safety Audit",
      description: "Comprehensive inspection of elevator systems for safety compliance and proper operation.",
      duration: 75,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "13:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Test emergency communication systems", required: true },
      { id: "2", title: "Verify door safety mechanisms and sensors", required: true },
      { id: "3", title: "Check inspection certificates and compliance", required: true },
      { id: "4", title: "Review elevator maintenance logs", required: true },
      { id: "5", title: "Test emergency power and lighting", required: true }]

    },
    {
      title: "Parking and Grounds GEMBA Walk",
      description: "Weekly observation of exterior grounds, parking areas, and landscaping maintenance needs.",
      duration: 30,
      priority: "low",
      routine_type: "gemba",
      default_time: "12:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [5] }, // Default to Friday
      checklist_items: [
      { id: "1", title: "Inspect parking lot condition and line markings", required: true },
      { id: "2", title: "Check landscaping and irrigation systems", required: true },
      { id: "3", title: "Observe snow removal or seasonal maintenance needs", required: true },
      { id: "4", title: "Identify potential safety hazards in walkways", required: true },
      { id: "5", title: "Note opportunities for curb appeal improvements", required: false }]

    }]

  },
  construction: {
    icon: HardHat,
    color: "bg-amber-500",
    lightColor: "bg-amber-50 text-amber-700 border-amber-200",
    name: "Construction",
    templates: [
    {
      title: "Daily Site Safety Briefing (Toolbox Talk)",
      description: "Morning meeting to discuss the day's tasks, potential hazards, and safety protocols with the entire crew.",
      duration: 15,
      priority: "critical",
      routine_type: "gemba",
      default_time: "07:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Review daily work plan and objectives", required: true },
      { id: "2", title: "Identify task-specific hazards (e.g., falls, electrical)", required: true },
      { id: "3", title: "Confirm required PPE for all tasks", required: true },
      { id: "4", title: "Discuss emergency procedures and muster points", required: true },
      { id: "5", title: "Allow crew members to voice safety concerns", required: true }]

    },
    {
      title: "Weekly Site Safety Inspection",
      description: "A comprehensive walkthrough of the construction site to identify and rectify safety hazards.",
      duration: 90,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "14:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Inspect scaffolding for proper assembly and safety tags", required: true },
      { id: "2", title: "Check fall protection systems and anchor points", required: true },
      { id: "3", title: "Verify electrical safety (e.g., GFCI, cord condition)", required: true },
      { id: "4", title: "Assess site housekeeping and material storage", required: true },
      { id: "5", title: "Review heavy equipment inspection logs", required: true }]

    },
    {
      title: "Equipment Pre-Use Inspection",
      description: "Daily inspection routine for construction equipment before operation to ensure safe and reliable performance.",
      duration: 25,
      priority: "high",
      routine_type: "routine",
      default_time: "06:45",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check fluid levels (oil, hydraulic, coolant)", required: true },
      { id: "2", title: "Inspect safety devices and warning systems", required: true },
      { id: "3", title: "Verify tire condition and pressure", required: true },
      { id: "4", title: "Test brakes and steering systems", required: true },
      { id: "5", title: "Document equipment meter readings", required: true }]

    },
    {
      title: "Quality Control Progress Inspection",
      description: "Daily review of completed work to ensure adherence to specifications and quality standards.",
      duration: 40,
      priority: "high",
      routine_type: "routine",
      default_time: "16:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Measure and verify work dimensions and alignment", required: true },
      { id: "2", title: "Check material specifications and quality", required: true },
      { id: "3", title: "Photograph progress for project documentation", required: true },
      { id: "4", title: "Identify any rework or deficiency issues", required: true },
      { id: "5", title: "Update quality control logs and reports", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Work Zone Efficiency",
      description: "Observe construction work processes to identify waste, inefficiencies, and improvement opportunities.",
      duration: 50,
      priority: "medium",
      routine_type: "gemba",
      default_time: "10:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Observe material handling and logistics flow", required: true },
      { id: "2", title: "Check tool and equipment organization", required: true },
      { id: "3", title: "Engage with crew about workflow challenges", required: true },
      { id: "4", title: "Identify waiting time and bottlenecks", required: true },
      { id: "5", title: "Document opportunities for process improvement", required: false }]

    },
    {
      title: "Monthly Environmental Compliance Audit",
      description: "Comprehensive review of environmental protection measures and regulatory compliance.",
      duration: 80,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "11:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Inspect stormwater management systems", required: true },
      { id: "2", title: "Check dust control and air quality measures", required: true },
      { id: "3", title: "Verify waste disposal and recycling practices", required: true },
      { id: "4", title: "Review noise control compliance", required: true },
      { id: "5", title: "Update environmental monitoring reports", required: true }]

    },
    {
      title: "Concrete Pour Preparation Check",
      description: "Pre-pour inspection routine to ensure forms, reinforcement, and conditions are ready for concrete placement.",
      duration: 35,
      priority: "critical",
      routine_type: "routine",
      default_time: "06:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Verify formwork alignment and bracing", required: true },
      { id: "2", title: "Check reinforcement placement and tie-off", required: true },
      { id: "3", title: "Confirm embedment and anchor bolt positions", required: true },
      { id: "4", title: "Test concrete temperature and slump", required: true },
      { id: "5", title: "Document pre-pour inspection approval", required: true }]

    },
    {
      title: "Site Security and Access Control Check",
      description: "Daily routine to ensure site security, proper access control, and protection of materials.",
      duration: 20,
      priority: "medium",
      routine_type: "routine",
      default_time: "17:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check perimeter fencing and gate security", required: true },
      { id: "2", title: "Verify tool and material storage security", required: true },
      { id: "3", title: "Test site lighting and security systems", required: true },
      { id: "4", title: "Document visitor access log", required: true },
      { id: "5", title: "Secure hazardous materials and equipment", required: true }]

    },
    {
      title: "Weekly Progress Coordination GEMBA Walk",
      description: "Collaborative walk with trades to coordinate work sequence and resolve interface issues.",
      duration: 45,
      priority: "high",
      routine_type: "gemba",
      default_time: "13:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Review 3-week look-ahead schedule with trades", required: true },
      { id: "2", title: "Identify trade coordination and sequencing issues", required: true },
      { id: "3", title: "Discuss material delivery and laydown areas", required: true },
      { id: "4", title: "Coordinate access and work zone boundaries", required: true },
      { id: "5", title: "Document action items and responsible parties", required: true }]

    },
    {
      title: "Monthly Crane and Lifting Equipment Audit",
      description: "Comprehensive inspection of crane operations, rigging practices, and lifting safety compliance.",
      duration: 100,
      priority: "critical",
      routine_type: "layered_audit",
      default_time: "09:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Review crane inspection certificates and logs", required: true },
      { id: "2", title: "Audit rigging hardware and sling conditions", required: true },
      { id: "3", title: "Verify crane operator certifications", required: true },
      { id: "4", title: "Check load chart posting and lift planning", required: true },
      { id: "5", title: "Review lift communication procedures", required: true }]

    }]

  },
  logistics_supply_chain: {
    icon: Truck,
    color: "bg-cyan-500",
    lightColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    name: "Logistics & Supply Chain",
    templates: [
    {
      title: "Inbound Shipment Receiving Audit",
      description: "Verifies the accuracy and condition of incoming goods against purchase orders and shipping documents.",
      duration: 45,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "10:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Match shipment to purchase order number", required: true },
      { id: "2", title: "Inspect packaging for external damage", required: true },
      { id: "3", title: "Verify pallet/carton count against bill of lading", required: true },
      { id: "4", title: "Perform random quality check on product condition", required: false },
      { id: "5", title: "Complete receiving paperwork and update inventory system", required: true }]

    },
    {
      title: "Weekly Warehouse Safety & Housekeeping",
      description: "Ensures the warehouse remains a safe and efficient environment for all employees.",
      duration: 60,
      priority: "medium",
      routine_type: "routine",
      default_time: "16:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] }, // Default to Monday
      checklist_items: [
      { id: "1", title: "Check for clear aisles and emergency exits", required: true },
      { id: "2", title: "Inspect pallet racking for damage or overloading", required: true },
      { id: "3", title: "Verify forklift and equipment charging stations are clear", required: true },
      { id: "4", title: "Check waste and recycling disposal areas", required: true },
      { id: "5", title: "Ensure spill kits are stocked and accessible", required: true }]

    },
    {
      title: "Daily Fleet Vehicle Inspection",
      description: "Pre-trip inspection routine for delivery vehicles to ensure safety and compliance.",
      duration: 25,
      priority: "high",
      routine_type: "routine",
      default_time: "06:30",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Check tire condition, pressure, and tread depth", required: true },
      { id: "2", title: "Inspect lights, signals, and reflectors", required: true },
      { id: "3", title: "Verify brake system operation and air pressure", required: true },
      { id: "4", title: "Check fluid levels and document mileage", required: true },
      { id: "5", title: "Inspect cargo area for damage or contamination", required: true }]

    },
    {
      title: "Outbound Shipping Accuracy Check",
      description: "Daily verification routine to ensure correct products and quantities are shipped to customers.",
      duration: 35,
      priority: "critical",
      routine_type: "routine",
      default_time: "15:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Verify pick accuracy against customer orders", required: true },
      { id: "2", title: "Check product expiration dates and lot codes", required: true },
      { id: "3", title: "Confirm shipping addresses and carrier selection", required: true },
      { id: "4", title: "Inspect packaging integrity and labeling", required: true },
      { id: "5", title: "Document shipment weights and tracking numbers", required: true }]

    },
    {
      title: "Weekly GEMBA Walk - Order Fulfillment Process",
      description: "Observe order picking, packing, and shipping processes to identify improvement opportunities.",
      duration: 50,
      priority: "high",
      routine_type: "gemba",
      default_time: "11:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [2] }, // Default to Tuesday
      checklist_items: [
      { id: "1", title: "Observe order picking accuracy and efficiency", required: true },
      { id: "2", title: "Check packing station organization and supplies", required: true },
      { id: "3", title: "Engage with warehouse staff about daily challenges", required: true },
      { id: "4", title: "Identify bottlenecks in fulfillment flow", required: true },
      { id: "5", title: "Document opportunities to reduce fulfillment time", required: false }]

    },
    {
      title: "Monthly Inventory Accuracy Audit",
      description: "Comprehensive review of inventory accuracy, cycle counts, and system reconciliation.",
      duration: 90,
      priority: "high",
      routine_type: "layered_audit",
      default_time: "14:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 15 }, // Default to 15th
      checklist_items: [
      { id: "1", title: "Conduct cycle count accuracy verification", required: true },
      { id: "2", title: "Analyze inventory variance reports", required: true },
      { id: "3", title: "Review obsolete and slow-moving inventory", required: true },
      { id: "4", title: "Verify physical location accuracy", required: true },
      { id: "5", title: "Update inventory control procedures", required: true }]

    },
    {
      title: "Cold Chain Temperature Monitoring",
      description: "Daily monitoring of temperature-controlled storage and transport to maintain product quality.",
      duration: 20,
      priority: "critical",
      routine_type: "routine",
      default_time: "08:00",
      recurrence: { type: 'daily', interval: 1 },
      checklist_items: [
      { id: "1", title: "Record refrigeration unit temperatures", required: true },
      { id: "2", title: "Check temperature alarm system functionality", required: true },
      { id: "3", title: "Verify door seal integrity and closure", required: true },
      { id: "4", title: "Document any temperature excursions", required: true },
      { id: "5", title: "Calibrate temperature monitoring devices", required: false }]

    },
    {
      title: "Weekly GEMBA Walk - Loading Dock Operations",
      description: "Observe loading dock efficiency, safety practices, and equipment utilization.",
      duration: 40,
      priority: "medium",
      routine_type: "gemba",
      default_time: "09:30",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [3] }, // Default to Wednesday
      checklist_items: [
      { id: "1", title: "Observe truck loading and unloading procedures", required: true },
      { id: "2", title: "Check dock equipment functionality and safety", required: true },
      { id: "3", title: "Engage with dock workers about efficiency challenges", required: true },
      { id: "4", title: "Review carrier scheduling and coordination", required: true },
      { id: "5", title: "Identify opportunities to reduce dwell time", required: false }]

    },
    {
      title: "Supplier Performance Review",
      description: "Weekly evaluation of supplier delivery performance, quality, and service levels.",
      duration: 55,
      priority: "medium",
      routine_type: "routine",
      default_time: "13:00",
      recurrence: { type: 'weekly', interval: 1, daysOfWeek: [4] }, // Default to Thursday
      checklist_items: [
      { id: "1", title: "Review supplier on-time delivery metrics", required: true },
      { id: "2", title: "Analyze quality rejection rates by supplier", required: true },
      { id: "3", title: "Check compliance with packaging requirements", required: true },
      { id: "4", title: "Document supplier performance issues", required: true },
      { id: "5", title: "Plan corrective action discussions", required: true }]

    },
    {
      title: "Monthly Transportation Cost Audit",
      description: "Comprehensive review of transportation costs, carrier performance, and routing efficiency.",
      duration: 75,
      priority: "medium",
      routine_type: "layered_audit",
      default_time: "12:00",
      recurrence: { type: 'monthly', interval: 1, dayOfMonth: 20 }, // Default to 20th
      checklist_items: [
      { id: "1", title: "Analyze freight costs and rate accuracy", required: true },
      { id: "2", title: "Review carrier performance scorecards", required: true },
      { id: "3", title: "Evaluate route optimization opportunities", required: true },
      { id: "4", title: "Check fuel surcharge and accessorial charges", required: true },
      { id: "5", title: "Document cost reduction recommendations", required: true }]

    }]

  }
};

export default function Templates() {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [routineFromTemplate, setRoutineFromTemplate] = useState(null);
  const navigate = useNavigate();

  const handleCreateFromTemplate = (template, industry) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1); // Get tomorrow's date

    // Set time based on template if available, otherwise default to 09:00
    const defaultTime = template.default_time || "09:00";
    const [hours, minutes] = defaultTime.split(':').map(Number);

    // Apply the time to tomorrow's date
    tomorrow.setHours(hours, minutes, 0, 0);

    const routineData = {
      title: template.title,
      description: template.description,
      industry,
      routine_type: template.routine_type || 'routine',
      recurrence: template.recurrence || { type: 'none', interval: 1 },
      priority: template.priority,
      status: "draft",
      assigned_to: [],
      estimated_duration: template.duration,
      checklist_items: template.checklist_items,
      next_due_date: tomorrow.toISOString(),
    };
    setRoutineFromTemplate(routineData);
    setShowRoutineBuilder(true);
  };

  const handleBuilderClose = () => {
    setShowRoutineBuilder(false);
    setRoutineFromTemplate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        
        {/* Header - Standardized */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 text-center lg:text-left w-full">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 justify-center lg:justify-start">
              <BookTemplate className="w-10 h-10 text-slate-700" />
              Create a Routine
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto lg:mx-0">Get started quickly with the AI generator or by selecting an industry-specific template.

            </p>
          </div>
        </div>

        {/* Main Action Cards - Better mobile layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                <div className="p-2 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-lg group-hover:from-violet-200 group-hover:to-indigo-200 transition-colors">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-violet-600" />
                </div>
                Create with AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Describe your goal, and let our AI build a comprehensive, tailored routine for you in seconds.
              </p>
              <Button
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white relative h-11"
                onClick={() => setShowAiGenerator(true)}>

                <Sparkles className="w-4 h-4" />
                Create with AI
                <Badge className="bg-white/20 text-white border-white/30 text-xs font-medium ml-2">
                  AI
                </Badge>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-slate-900 text-white group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                Start from Scratch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Have something specific in mind? Build your routine from the ground up with our step-by-step editor.
              </p>
              <Button
                variant="secondary"
                className="w-full h-11"
                onClick={() => setShowRoutineBuilder(true)}>

                Start Building <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Divider */}
        <div className="relative text-center py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative inline-block bg-slate-50 px-6 text-sm font-medium uppercase tracking-wider text-slate-500">
            Or choose a template
          </div>
        </div>

        {/* Industry Grid - Better responsive design */}
        {!selectedIndustry &&
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Object.entries(industryTemplates).map(([key, industry]) => {
            const IconComponent = industry.icon;
            return (
              <Card
                key={key}
                className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group h-full"
                onClick={() => setSelectedIndustry(key)}>

                  <div className={`absolute top-0 right-0 w-32 h-32 ${industry.color} opacity-5 rounded-full transform translate-x-8 -translate-y-8 group-hover:opacity-10 transition-opacity`} />
                  
                  <CardHeader className="text-center p-6 md:p-8">
                    <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 ${industry.color} bg-opacity-10 rounded-2xl flex items-center justify-center group-hover:bg-opacity-20 transition-colors`}>
                      <IconComponent className={`w-8 h-8 md:w-10 md:h-10 ${industry.color.replace('bg-', 'text-')}`} />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                      {industry.name}
                    </CardTitle>
                    <p className="text-slate-600 text-sm md:text-base">
                      {industry.templates.length} professional templates
                    </p>
                  </CardHeader>
                  
                  <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="space-y-3">
                      {industry.templates.slice(0, 2).map((template, idx) =>
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{template.title}</span>
                        </div>
                    )}
                      {industry.templates.length > 2 &&
                    <div className="text-sm text-slate-500 font-medium">
                          +{industry.templates.length - 2} more templates
                        </div>
                    }
                    </div>
                    
                    <Button className="w-full mt-6 group-hover:scale-105 transition-transform h-10">
                      Explore Templates <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>);

          })}
          </div>
        }

        {/* Selected Industry Templates - Enhanced design */}
        {selectedIndustry &&
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedIndustry(null)}
                className="gap-2 shrink-0">
                ← Back to Industries
              </Button>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-3 rounded-xl ${industryTemplates[selectedIndustry].color} bg-opacity-10 shrink-0`}>
                  {React.createElement(industryTemplates[selectedIndustry].icon, {
                  className: `w-6 h-6 ${industryTemplates[selectedIndustry].color.replace('bg-', 'text-')}`
                })}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">
                  {industryTemplates[selectedIndustry].name} Templates
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {industryTemplates[selectedIndustry].templates.map((template, idx) =>
            <Card key={idx} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <CardTitle className="text-lg md:text-xl font-bold text-slate-900 flex-1 leading-tight">
                        {template.title}
                      </CardTitle>
                      <Badge
                    className={
                    template.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    template.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                        {template.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                      {template.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {template.duration} min
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {template.checklist_items.length} tasks
                      </div>
                      <div className="capitalize font-medium">
                        {template.recurrence.type}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900">Key Tasks:</h4>
                      <div className="space-y-2">
                        {template.checklist_items.slice(0, 3).map((item) =>
                    <div key={item.id} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{item.title}</span>
                          </div>
                    )}
                        {template.checklist_items.length > 3 &&
                    <div className="text-xs text-slate-500 pl-6 font-medium">
                            +{template.checklist_items.length - 3} more tasks included
                          </div>
                    }
                      </div>
                    </div>

                    <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 h-11 mt-auto"
                  onClick={() => handleCreateFromTemplate(template, selectedIndustry)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
            )}
            </div>
          </div>
        }
      </div>
      
      {/* Modals */}
      {showAiGenerator && <AiRoutineGenerator onClose={() => setShowAiGenerator(false)} />}
      {showRoutineBuilder && <RoutineBuilder onClose={handleBuilderClose} editingRoutine={routineFromTemplate} />}
    </div>);

}
