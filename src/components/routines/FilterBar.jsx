import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ChevronDown, ClipboardList, Eye, ShieldCheck } from "lucide-react";
import { industryConfig } from "@/components/shared/industryConfig";
import { routineTypeConfig } from "@/components/shared/routineTypeConfig";

export default function FilterBar({ filters, onFilterChange }) {
  const filterOptions = {
    status: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "draft", label: "Draft" },
      { value: "paused", label: "Paused" },
      { value: "completed", label: "Completed" },
      { value: "overdue", label: "Overdue" }
    ],
    priority: [
      { value: "all", label: "All Priority" },
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" }
    ],
    frequency: [
      { value: "all", label: "All Frequency" },
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" }
    ],
    routine_type: [
      { value: "all", label: "All Types" },
      { value: "routine", label: "Standard Routine", icon: ClipboardList },
      { value: "gemba", label: "GEMBA Walk", icon: Eye },
      { value: "layered_audit", label: "Layered Audit", icon: ShieldCheck }
    ]
  };

  const industryOptions = [
    { value: "all", label: "All Industries" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "healthcare", label: "Healthcare" },
    { value: "industrial_maintenance", label: "Industrial Maintenance" },
    { value: "facilities_maintenance", label: "Facilities Maintenance" },
    { value: "construction", label: "Construction" },
    { value: "logistics_supply_chain", label: "Logistics & Supply Chain" },
  ];

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== "all").length;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'paused':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      default:
        return 'hover:bg-slate-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      default:
        return 'hover:bg-slate-100';
    }
  };

  const getRoutineTypeColor = (routineType) => {
    const config = routineTypeConfig[routineType];
    if (!config) return 'hover:bg-slate-100';
    return config.lightColor.replace('border-', 'hover:border-');
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="w-4 h-4" />
        Filters:
      </div>

      {/* Industry Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${filters.industry !== "all" ? "bg-slate-100 border-slate-300" : ""}`}
          >
            {industryOptions.find(opt => opt.value === filters.industry)?.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Industry</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {industryOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ industry: option.value })}
              className={filters.industry === option.value ? "bg-slate-100" : ""}
            >
              {option.value !== "all" && industryConfig[option.value] && (
                <div className={`w-3 h-3 rounded mr-2 ${industryConfig[option.value].color}`} />
              )}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Routine Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${filters.routine_type !== "all" ? getRoutineTypeColor(filters.routine_type) : ""}`}
          >
            {filterOptions.routine_type.find(opt => opt.value === filters.routine_type)?.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.routine_type.map((option) => {
            const IconComponent = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange({ routine_type: option.value })}
                className={filters.routine_type === option.value ? "bg-slate-100" : ""}
              >
                {option.value !== "all" && IconComponent && (
                  <IconComponent className={`w-4 h-4 mr-2 ${routineTypeConfig[option.value]?.color.replace('bg-', 'text-') || 'text-slate-500'}`} />
                )}
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${filters.status !== "all" ? getStatusColor(filters.status) : ""}`}
          >
            {filterOptions.status.find(opt => opt.value === filters.status)?.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.status.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ status: option.value })}
              className={filters.status === option.value ? "bg-slate-100" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${filters.priority !== "all" ? getPriorityColor(filters.priority) : ""}`}
          >
            {filterOptions.priority.find(opt => opt.value === filters.priority)?.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.priority.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ priority: option.value })}
              className={filters.priority === option.value ? "bg-slate-100" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Frequency Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${filters.frequency !== "all" ? "bg-slate-100 border-slate-300" : ""}`}
          >
            {filterOptions.frequency.find(opt => opt.value === filters.frequency)?.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Frequency</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.frequency.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ frequency: option.value })}
              className={filters.frequency === option.value ? "bg-slate-100" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Count */}
      {getFilterCount() > 0 && (
        <Badge variant="secondary" className="ml-2">
          {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} active
        </Badge>
      )}
    </div>
  );
}