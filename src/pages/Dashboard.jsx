
import React, { useState, useEffect, useCallback } from "react";
import { Routine, RoutineExecution } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  Plus,
  Building2,
  Heart,
  Wrench,
  ArrowRight,
  Search,
  LayoutDashboard,
  Building,
  HardHat,
  Truck,
  Download
} from "lucide-react";
import { format, startOfDay, isBefore } from "date-fns";
import { industryConfig } from "@/components/shared/industryConfig";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import UpcomingRoutines from "../components/dashboard/UpcomingRoutines";
import TeamPerformance from "../components/dashboard/TeamPerformance";

export default function Dashboard() {
  const [routines, setRoutines] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Removed searchQuery and setSearchQuery as the search input is removed

  // Removed handleSearch as the search input is removed

  useEffect(() => {
    loadData();
  }, []); // This effect now runs only once on mount to fetch initial data.

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [routineData, executionData] = await Promise.all([
        Routine.list('-updated_date'),
        RoutineExecution.list('-execution_date', 10)
      ]);
      // Add defensive fallbacks to ensure arrays are never undefined
      setRoutines(Array.isArray(routineData) ? routineData : []);
      setExecutions(Array.isArray(executionData) ? executionData : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty arrays on error to prevent undefined iteration
      setRoutines([]);
      setExecutions([]);
    }
    setIsLoading(false);
  };

  const handleExportRoutinesCsv = useCallback(() => {
    if (!routines || !routines.length) {
      alert("No routines data available to export.");
      return;
    }

    const headers = [
      "ID",
      "Name", 
      "Status",
      "Description",
      "Frequency Type",
      "Frequency Value",
      "Next Due Date",
      "Last Completed Date",
      "Created Date",
      "Updated Date"
    ];

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      let stringValue = String(value);
      stringValue = stringValue.replace(/\r?\n|\r/g, ' ');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        stringValue = stringValue.replace(/"/g, '""');
        return `"${stringValue}"`;
      }
      return stringValue;
    };

    const data = routines.map(routine => [
      escapeCsvValue(routine.id),
      escapeCsvValue(routine.title),
      escapeCsvValue(routine.status),
      escapeCsvValue(routine.description),
      escapeCsvValue(routine.frequency_type),
      escapeCsvValue(routine.frequency_value),
      escapeCsvValue(routine.next_due_date ? format(new Date(routine.next_due_date), 'yyyy-MM-dd HH:mm:ss') : ''),
      escapeCsvValue(routine.last_completed_date ? format(new Date(routine.last_completed_date), 'yyyy-MM-dd HH:mm:ss') : ''),
      escapeCsvValue(routine.created_date ? format(new Date(routine.created_date), 'yyyy-MM-dd HH:mm:ss') : ''),
      escapeCsvValue(routine.updated_date ? format(new Date(routine.updated_date), 'yyyy-MM-dd HH:mm:ss') : '')
    ].join(','));

    const csvContent = [
      headers.join(','),
      ...data
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'routines_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [routines]); // This function is now memoized and only updates when `routines` changes.

  useEffect(() => {
    // This effect handles adding/removing the event listener.
    // It depends on the memoized function.
    const handleExport = () => handleExportRoutinesCsv();
    document.addEventListener('export-routines-csv', handleExport);
    
    return () => {
      document.removeEventListener('export-routines-csv', handleExport);
    };
  }, [handleExportRoutinesCsv]);

  const activeRoutines = Array.isArray(routines) ? routines.filter((r) => r.status === 'active') : [];
  const overdueRoutines = Array.isArray(routines) ? routines.filter((r) =>
    r.status === 'active' && r.next_due_date && isBefore(new Date(r.next_due_date), startOfDay(new Date()))
  ) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        
        {/* Header - Standardized */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-10 h-10 text-slate-700" />
              Dashboard
            </h1>
            <p className="text-lg text-slate-600">Welcome back! Here's your leadership overview.</p>
          </div>
        </div>

        {/* Top Section - REMOVED the card with search and actions */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("Routines?status=overdue")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between hover:bg-red-50 hover:text-red-700 transition-colors text-sm h-auto py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>View Overdue</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {overdueRoutines.length}
                  </Badge>
                </Button>
              </Link>

              <Link to={createPageUrl("Team")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between hover:bg-slate-100 transition-colors text-sm h-auto py-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Manage Team</span>
                  </div>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>

              <Link to={createPageUrl("Templates")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between hover:bg-slate-100 transition-colors text-sm h-auto py-2">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Routine</span>
                  </div>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <StatsOverview
          routines={activeRoutines}
          executions={Array.isArray(executions) ? executions : []}
          isLoading={isLoading} />

        {/* Main Content Grid - Improved responsive design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Better mobile spacing */}
          <div className="lg:col-span-2 space-y-6">
            <UpcomingRoutines
              routines={activeRoutines}
              isLoading={isLoading}
              onUpdate={loadData}
            />

            <RecentActivity
              executions={Array.isArray(executions) ? executions : []}
              routines={Array.isArray(routines) ? routines : []}
              isLoading={isLoading} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TeamPerformance
              executions={Array.isArray(executions) ? executions : []}
              isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
