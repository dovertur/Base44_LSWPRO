import React from 'react';
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

export default function CalendarFilters({ filters, onFilterChange }) {
  const filterOptions = {
    industry: [
      { value: "all", label: "All Industries" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "healthcare", label: "Healthcare" },
      { value: "industrial_maintenance", label: "Industrial Maintenance" },
      { value: "facilities_maintenance", label: "Facilities Maintenance" },
      { value: "construction", label: "Construction" },
      { value: "logistics_supply_chain", label: "Logistics & Supply Chain" }
    ],
    routine_type: [
      { value: "all", label: "All Types" },
      { value: "routine", label: "Standard Routine", icon: ClipboardList },
      { value: "gemba", label: "GEMBA Walk", icon: Eye },
      { value: "layered_audit", label: "Layered Audit", icon: ShieldCheck }
    ],
    priority: [
      { value: "all", label: "All Priority" },
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" }
    ]
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter Calendar</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Industry Filter */}
        <DropdownMenuLabel className="text-xs">Industry</DropdownMenuLabel>
        {filterOptions.industry.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onFilterChange({ ...filters, industry: option.value })}
            className={filters.industry === option.value ? "bg-slate-100" : ""}
          >
            {option.value !== "all" && industryConfig[option.value] && (
              <div className={`w-3 h-3 rounded mr-2 ${industryConfig[option.value].color}`} />
            )}
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Routine Type Filter */}
        <DropdownMenuLabel className="text-xs">Type</DropdownMenuLabel>
        {filterOptions.routine_type.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ ...filters, routine_type: option.value })}
              className={filters.routine_type === option.value ? "bg-slate-100" : ""}
            >
              {option.value !== "all" && IconComponent && (
                <IconComponent className={`w-4 h-4 mr-2 ${routineTypeConfig[option.value]?.color.replace('bg-', 'text-') || 'text-slate-500'}`} />
              )}
              {option.label}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Priority Filter */}
        <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
        {filterOptions.priority.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onFilterChange({ ...filters, priority: option.value })}
            className={filters.priority === option.value ? "bg-slate-100" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onFilterChange({ industry: "all", routine_type: "all", priority: "all" })}>
          Clear All Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}