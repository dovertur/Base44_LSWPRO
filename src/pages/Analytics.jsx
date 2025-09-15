
import React, { useState, useEffect } from "react";
import { Routine, RoutineExecution } from "@/api/entities";
import { User } from "@/api/entities"; // Import User
import { TierLimit } from "@/api/entities"; // Import TierLimit
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Building2,
  Heart,
  Wrench,
  Users,
  Clock,
  AlertTriangle,
  Building, // Added
  HardHat, // Added
  Truck, // Added
  Filter, // Added
  Lock // Added
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { industryConfig } from "@/components/shared/industryConfig"; // Import shared config

import PerformanceOverview from "../components/analytics/PerformanceOverview";
import CompletionTrends from "../components/analytics/CompletionTrends";
import IndustryBreakdown from "../components/analytics/IndustryBreakdown";
import TeamAnalytics from "../components/analytics/TeamAnalytics";
import RoutinePerformance from "../components/analytics/RoutinePerformance";
import TimeAnalysis from "../components/analytics/TimeAnalysis";
import { Team as TeamEntity } from "@/api/entities"; // Renaming for clarity
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpgradeModal from "../components/shared/UpgradeModal";
import { useToast } from "@/components/ui/use-toast"; // Import useToast

export default function Analytics() {
  const [routines, setRoutines] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tierLimits, setTierLimits] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let limits;
      if (user.tier) {
        const tierLimitData = await TierLimit.filter({ tier: user.tier });
        if (tierLimitData.length > 0) {
          limits = tierLimitData[0];
          setTierLimits(limits);
        }
      }
      
      const [routineData, executionData, usersData, teamsData] = await Promise.all([
        Routine.list('-created_date'),
        RoutineExecution.list('-execution_date', 1000), // Load more for filtering
        User.list(),
        TeamEntity.list()
      ]);
      
      // Add comprehensive array safety
      setRoutines(Array.isArray(routineData) ? routineData : []);
      setExecutions(Array.isArray(executionData) ? executionData : []);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setAllTeams(Array.isArray(teamsData) ? teamsData : []);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set empty arrays on error
      setRoutines([]);
      setExecutions([]);
      setAllUsers([]);
      setAllTeams([]);
    }
    setIsLoading(false);
  };
  
  const getFilteredData = () => {
    if (!tierLimits || !currentUser) {
      return { filteredRoutines: [], filteredExecutions: [] };
    }
    
    // Add array safety throughout filtering logic
    const currentRoutines = Array.isArray(routines) ? routines : [];
    const currentExecutions = Array.isArray(executions) ? executions : [];
    
    // Date Range Filtering based on Tier
    const historyDays = tierLimits.analytics_history_days;
    // For free tier, hard cap at 30 days regardless of selection
    const enforcedHistoryDays = currentUser.tier === 'free' ? 30 : historyDays;

    let startDate;
    if (selectedTeam === 'all' && selectedUser === 'all') { // If no advanced team/user filter, apply tier history limit
      startDate = enforcedHistoryDays ? subDays(new Date(), enforcedHistoryDays) : new Date(0);
    } else { // If advanced filters are in use, assume pro_plus and respect that tier's limits or 'all' selection
      // 'all' time is only available for pro_plus. If 'all' is selected, startDate is epoch.
      startDate = dateRange === 'all' ? new Date(0) : (enforcedHistoryDays ? subDays(new Date(), enforcedHistoryDays) : new Date(0));
    }

    let dateFilteredExecutions = currentExecutions.filter(exec => 
      new Date(exec.execution_date) >= startDate
    );

    let filteredExecutions = dateFilteredExecutions;
    let filteredRoutines = [...currentRoutines];

    // Team/Personal Scope Filtering for non-admins
    if (currentUser.role !== 'admin') {
      const userTeams = currentUser.team_ids || [];
      
      // Routines accessible to the user (either created by them or owned by their teams)
      const accessibleRoutines = currentRoutines.filter(r => 
        r.created_by === currentUser.email || userTeams.includes(r.owning_team_id)
      );
      const accessibleRoutineIds = new Set(accessibleRoutines.map(r => r.id));

      // Executions performed by the user or for routines accessible to them
      filteredExecutions = dateFilteredExecutions.filter(exec => {
        return exec.executed_by === currentUser.email || accessibleRoutineIds.has(exec.routine_id);
      });

      // Filter routines to only include those that have associated filtered executions
      const routineIdsFromExecutions = new Set(filteredExecutions.map(e => e.routine_id));
      filteredRoutines = currentRoutines.filter(r => routineIdsFromExecutions.has(r.id));
    }
    
    // Industry Filter (applied after scoping)
    if (selectedIndustry !== "all") {
      filteredRoutines = filteredRoutines.filter(r => r.industry === selectedIndustry);
      const routineIds = new Set(filteredRoutines.map(r => r.id));
      filteredExecutions = filteredExecutions.filter(exec => routineIds.has(exec.routine_id));
    }

    // Pro+ Advanced Filters
    if (currentUser.tier === 'pro_plus') {
      if (selectedTeam !== 'all') {
        const teamRoutineIds = new Set(currentRoutines.filter(r => r.owning_team_id === selectedTeam).map(r => r.id));
        filteredExecutions = filteredExecutions.filter(exec => teamRoutineIds.has(exec.routine_id));
        // Also filter routines based on selected team
        filteredRoutines = filteredRoutines.filter(r => r.owning_team_id === selectedTeam);
      }
      if (selectedUser !== 'all') {
        filteredExecutions = filteredExecutions.filter(exec => exec.executed_by === selectedUser);
        // If a user is selected, filter routines that this user has executed
        const routineIdsExecutedByUser = new Set(filteredExecutions.map(e => e.routine_id));
        filteredRoutines = filteredRoutines.filter(r => routineIdsExecutedByUser.has(r.id));
      }
    }
    
    return { filteredRoutines, filteredExecutions };
  };

  const canExport = currentUser && (currentUser.tier === 'pro' || currentUser.tier === 'pro_plus');
  const canUseAdvancedFilters = currentUser && currentUser.tier === 'pro_plus';

  const handleAdvancedFilterClick = (feature) => {
    if (!canUseAdvancedFilters) {
      setUpgradeFeature(feature);
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const handleExportClick = () => {
    if (!canExport) {
      setUpgradeFeature("CSV Data Export");
      setShowUpgradeModal(true);
    } else {
      exportAnalytics();
    }
  };


  const exportAnalytics = async () => {
    setIsExporting(true);
    try {
      const { filteredRoutines, filteredExecutions } = getFilteredData();
      
      // Show progress toast
      toast({
        title: "Generating Report...",
        description: "Preparing your analytics data for export. This may take a moment.",
      });
      
      // Prepare analytics data for export with enhanced data
      const analyticsData = {
        summary: {
          totalRoutines: filteredRoutines.length,
          activeRoutines: filteredRoutines.filter(r => r.status === 'active').length,
          totalExecutions: filteredExecutions.length,
          completionRate: filteredExecutions.length > 0 ? (filteredExecutions.filter(e => e.status === 'completed').length / filteredExecutions.length * 100) : 0,
          averageDuration: filteredExecutions.length > 0 ? (filteredExecutions.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / filteredExecutions.length) : 0,
          overdueRoutines: filteredRoutines.filter(r => r.status === 'active' && r.next_due_date && new Date(r.next_due_date) < new Date()).length
        },
        routines: filteredRoutines.map(routine => ({
          'ID': routine.id,
          'Title': routine.title,
          'Description': routine.description || '',
          'Industry': routine.industry?.replace(/_/g, ' ') || 'N/A',
          'Type': routine.routine_type === 'gemba' ? 'GEMBA Walk' : 
                  routine.routine_type === 'layered_audit' ? 'Layered Audit' : 
                  'Standard Routine',
          'Status': routine.status,
          'Priority': routine.priority,
          'Frequency': routine.frequency,
          'Completion Rate': `${Math.round(routine.completion_rate || 0)}%`,
          'Est Duration (min)': routine.estimated_duration || 0,
          'Next Due': routine.next_due_date ? format(new Date(routine.next_due_date), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Created Date': routine.created_date ? format(new Date(routine.created_date), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Created By': routine.created_by || 'N/A',
          'Assigned Users': (routine.assigned_to || []).join('; ') || 'None',
          'Owning Team ID': routine.owning_team_id || 'N/A'
        })),
        executions: filteredExecutions.map(exec => {
          // 'routines' state variable is guaranteed to be an array after loadInitialData
          const routine = routines.find(r => r.id === exec.routine_id); 
          return {
            'Execution ID': exec.id,
            'Execution Date': exec.execution_date ? format(new Date(exec.execution_date), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
            'Routine Title': routine?.title || 'Unknown Routine',
            'Routine Industry': routine?.industry?.replace(/_/g, ' ') || 'N/A',
            'Executed By': exec.executed_by,
            'Status': exec.status,
            'Duration (min)': exec.duration_minutes || 0,
            'Completed Items': (exec.completed_items || []).length,
            'Total Items': routine?.checklist_items?.length || 0,
            'Notes': (exec.notes || '').replace(/"/g, '""'), // Escape quotes for CSV
            'Created Date': exec.created_date ? format(new Date(exec.created_date), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
          };
        })
      };

      // Create CSV content with proper escaping
      const createCSV = (data, title) => {
        if (!data.length) return `${title}\nNo data available\n`;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
          `${title}`,
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              let value = row[header];
              if (value === null || value === undefined) value = '';
              
              // Convert to string and escape quotes
              value = String(value).replace(/"/g, '""');
              
              // Quote fields that contain commas, quotes, or newlines
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value}"`;
              }
              
              return value;
            }).join(',')
          )
        ].join('\n');
        return csvContent;
      };

      // Generate comprehensive CSV report
      const filename = `lsw-analytics-${currentUser.tier}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      const blob = new Blob([
        'ROUTINE ANALYTICS REPORT',
        `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
        `User: ${currentUser.full_name || currentUser.email}`,
        `User Tier: ${currentUser.tier?.toUpperCase() || 'FREE'}`,
        `History Limit: ${tierLimits?.analytics_history_days ? `${tierLimits.analytics_history_days} days` : 'Unlimited'}`,
        `Date Range: ${dateRange.replace('days', ' days') === 'all' ? 'All Time' : dateRange.replace('days', ' days')}`,
        `Industry Filter: ${selectedIndustry !== 'all' ? selectedIndustry.replace(/_/g, ' ') : 'All Industries'}`,
        `Team Filter: ${selectedTeam !== 'all' ? allTeams.find(t => t.id === selectedTeam)?.name || 'Unknown Team' : 'All Teams'}`,
        `User Filter: ${selectedUser !== 'all' ? allUsers.find(u => u.email === selectedUser)?.full_name || selectedUser : 'All Users'}`,
        '',
        'SUMMARY METRICS',
        `Total Routines,${analyticsData.summary.totalRoutines}`,
        `Active Routines,${analyticsData.summary.activeRoutines}`,
        `Overdue Routines,${analyticsData.summary.overdueRoutines}`,
        `Total Executions,${analyticsData.summary.totalExecutions}`,
        `Overall Completion Rate,${analyticsData.summary.completionRate.toFixed(1)}%`,
        `Average Duration,${analyticsData.summary.averageDuration.toFixed(1)} minutes`,
        '',
        createCSV(analyticsData.routines, 'ROUTINE DETAILS'),
        '',
        createCSV(analyticsData.executions, 'EXECUTION HISTORY')
      ].join('\n'), { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Success toast
      toast({
        title: "Export Complete!",
        description: `Analytics report saved as ${filename}`,
      });
      
    } catch (error) {
      console.error("Error exporting analytics:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the analytics report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const { filteredRoutines, filteredExecutions } = getFilteredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">

        {/* Header - Standardized */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-slate-700" />
              Analytics & Insights
            </h1>
            <p className="text-lg text-slate-600">Analyze performance trends and operational efficiency.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportClick}
              disabled={isExporting}
              className="gap-2 justify-center"
            >
              {!canExport && <Lock className="w-3 h-3 text-yellow-500" />}
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                  <span className="hidden sm:inline">Exporting...</span>
                  <span className="sm:hidden">Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Date Range & Filters */}
        <Card className="border-0 shadow-lg bg-white">
          <div className="space-y-4 bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Period:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "7days", label: "7 Days", minTier: "free" },
                    { value: "30days", label: "30 Days", minTier: "free" },
                    { value: "90days", label: "90 Days", minTier: "pro" },
                    { value: "all", label: "All Time", minTier: "pro_plus" }
                  ].map(period => {
                    const isAllowed = 
                      (period.minTier === "free" && ['free', 'pro', 'pro_plus'].includes(currentUser?.tier)) ||
                      (period.minTier === "pro" && ['pro', 'pro_plus'].includes(currentUser?.tier)) ||
                      (period.minTier === "pro_plus" && ['pro_plus'].includes(currentUser?.tier));

                    return (
                      <Button
                        key={period.value}
                        variant={dateRange === period.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isAllowed) {
                            setDateRange(period.value);
                          } else {
                            handleAdvancedFilterClick("Extended History");
                          }
                        }}
                        className="text-xs relative"
                        disabled={!isAllowed && currentUser?.tier !== 'pro_plus'}
                      >
                        {period.label}
                        {!isAllowed && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500 bg-white rounded-full p-0.5" />}
                      </Button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Industry:</span>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-full sm:w-40 text-xs">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {Object.keys(industryConfig).map(key => (
                      <SelectItem key={key} value={key} className="capitalize">{key.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Advanced Filters - Stack on mobile */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 relative">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Team:</span>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={!canUseAdvancedFilters}>
                    <SelectTrigger className="w-full sm:w-48 text-xs">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {allTeams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!canUseAdvancedFilters && (
                      <div onClick={() => handleAdvancedFilterClick("Team Filtering")} className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md cursor-pointer">
                          <Lock className="w-5 h-5 text-yellow-500" />
                      </div>
                  )}
                </div>
                <div className="flex items-center gap-2 relative">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">User:</span>
                  <Select value={selectedUser} onValueChange={setSelectedUser} disabled={!canUseAdvancedFilters}>
                    <SelectTrigger className="w-full sm:w-48 text-xs">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {allUsers.map(user => <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!canUseAdvancedFilters && (
                      <div onClick={() => handleAdvancedFilterClick("User Filtering")} className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md cursor-pointer">
                          <Lock className="w-5 h-5 text-yellow-500" />
                      </div>
                  )}
                </div>
            </div>
          </div>
        </Card>

        {/* Performance Overview */}
        <PerformanceOverview 
          routines={filteredRoutines}
          executions={filteredExecutions}
          isLoading={isLoading}
        />

        {/* Analytics Tabs - Responsive */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-white border border-slate-200">
            <TabsTrigger value="trends" className="gap-1 sm:gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="industries" className="gap-1 sm:gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Industries</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-1 sm:gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-1 sm:gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Routines</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-1 sm:gap-2 col-span-2 sm:col-span-1">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Time</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <CompletionTrends 
              executions={filteredExecutions}
              routines={filteredRoutines}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="industries">
            <IndustryBreakdown 
              routines={filteredRoutines}
              executions={filteredExecutions}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamAnalytics 
              executions={filteredExecutions}
              routines={filteredRoutines}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="routines">
            <RoutinePerformance 
              routines={filteredRoutines}
              executions={filteredExecutions}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="time">
            <TimeAnalysis 
              executions={filteredExecutions}
              routines={filteredRoutines}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
        <UpgradeModal 
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={upgradeFeature}
        />
      </div>
    </div>
  );
}
