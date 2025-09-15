import {
  ClipboardList,
  Eye,
  ShieldCheck
} from "lucide-react";

export const routineTypeConfig = {
  routine: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ClipboardList,
    name: 'Standard Routine',
    shortName: 'Routine'
  },
  gemba: {
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Eye,
    name: 'GEMBA Walk',
    shortName: 'GEMBA'
  },
  layered_audit: {
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: ShieldCheck,
    name: 'Layered Process Audit',
    shortName: 'Layered Audit'
  }
};

// Fallback config for unknown routine types
export const defaultRoutineTypeConfig = {
  color: 'bg-slate-500',
  lightColor: 'bg-slate-50 text-slate-700 border-slate-200',
  icon: ClipboardList,
  name: 'Unknown Type',
  shortName: 'Unknown'
};

// Helper function to safely get routine type config
export const getRoutineTypeConfig = (routineType) => {
  return routineTypeConfig[routineType] || defaultRoutineTypeConfig;
};