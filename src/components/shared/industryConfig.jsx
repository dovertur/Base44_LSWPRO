import {
  Building2,
  Heart,
  Wrench,
  Building,
  HardHat,
  Truck
} from "lucide-react";

export const industryConfig = {
  manufacturing: {
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Building2,
    name: 'Manufacturing'
  },
  healthcare: {
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Heart,
    name: 'Healthcare'
  },
  industrial_maintenance: {
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: Wrench,
    name: 'Industrial Maintenance'
  },
  facilities_maintenance: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Building,
    name: 'Facilities Maintenance'
  },
  construction: {
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: HardHat,
    name: 'Construction'
  },
  logistics_supply_chain: {
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Truck,
    name: 'Logistics & Supply Chain'
  }
};

// Fallback config for unknown industries
export const defaultIndustryConfig = {
  color: 'bg-slate-500',
  lightColor: 'bg-slate-50 text-slate-700 border-slate-200',
  icon: Building2,
  name: 'Unknown'
};

// Helper function to safely get industry config
export const getIndustryConfig = (industry) => {
  return industryConfig[industry] || defaultIndustryConfig;
};