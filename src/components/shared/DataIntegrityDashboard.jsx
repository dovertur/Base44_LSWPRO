import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  UsersIcon,
  ClipboardList,
  Play,
  XCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/api/entities";
import DataIntegrityService from "./DataIntegrityService";

export default function DataIntegrityDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const runChecks = async () => {
    setIsLoading(true);
    try {
      const checkResults = await DataIntegrityService.runAllChecks();
      setResults(checkResults);
      
      if (checkResults.summary.totalIssues === 0) {
        toast({
          title: "All Checks Passed",
          description: "No data integrity issues found. Your system is healthy!",
        });
      } else {
        toast({
          title: "Issues Detected",
          description: `Found ${checkResults.summary.totalIssues} data integrity issues that need attention.`,
          variant: "destructive",
        });
      }
      
      if (currentUser) {
        await DataIntegrityService.logIntegrityAction(
          'check_run',
          `Data integrity check completed. Found ${checkResults.summary.totalIssues} issues.`,
          currentUser
        );
      }
    } catch (error) {
      console.error('Error running integrity checks:', error);
      toast({
        title: "Check Failed",
        description: "There was an error running the integrity checks. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const repairIssues = async () => {
    if (!results || results.summary.totalIssues === 0) return;
    
    setIsRepairing(true);
    try {
      let totalRepaired = 0;
      const repairResults = [];

      // Repair orphaned user assignments
      if (results.orphanedUserAssignments.length > 0) {
        const userRepairs = await DataIntegrityService.repairOrphanedUserAssignments(
          results.orphanedUserAssignments
        );
        repairResults.push(...userRepairs);
        totalRepaired += userRepairs.filter(r => r.success).length;
      }

      // Repair orphaned team assignments
      if (results.orphanedTeamAssignments.length > 0) {
        const teamRepairs = await DataIntegrityService.repairOrphanedTeamAssignments(
          results.orphanedTeamAssignments
        );
        repairResults.push(...teamRepairs);
        totalRepaired += teamRepairs.filter(r => r.success).length;
      }

      toast({
        title: "Repairs Completed",
        description: `Successfully repaired ${totalRepaired} data integrity issues.`,
      });

      if (currentUser) {
        await DataIntegrityService.logIntegrityAction(
          'repair_run',
          `Data integrity repairs completed. Repaired ${totalRepaired} issues.`,
          currentUser
        );
      }

      // Re-run checks to verify repairs
      await runChecks();
    } catch (error) {
      console.error('Error repairing issues:', error);
      toast({
        title: "Repair Failed",
        description: "There was an error repairing some issues. Please check the logs.",
        variant: "destructive",
      });
    }
    setIsRepairing(false);
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'orphaned_user_assignment':
      case 'orphaned_team_assignment_user':
        return <Users className="w-4 h-4" />;
      case 'orphaned_team_assignment_routine':
      case 'orphaned_owning_team':
        return <UsersIcon className="w-4 h-4" />;
      case 'orphaned_team_leader':
        return <Shield className="w-4 h-4" />;
      case 'orphaned_execution':
        return <ClipboardList className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatIssueDescription = (issue) => {
    switch (issue.type) {
      case 'orphaned_user_assignment':
        return `Routine "${issue.routineTitle}" has assignments to non-existent users: ${issue.orphanedEmails.join(', ')}`;
      case 'orphaned_team_assignment_routine':
        return `Routine "${issue.routineTitle}" is assigned to non-existent teams`;
      case 'orphaned_team_assignment_user':
        return `User "${issue.userEmail}" belongs to non-existent teams`;
      case 'orphaned_owning_team':
        return `Routine "${issue.routineTitle}" is owned by a non-existent team`;
      case 'orphaned_team_leader':
        return `Team "${issue.teamName}" has non-existent leaders`;
      case 'orphaned_execution':
        return `Execution record exists for deleted routine (executed by ${issue.executedBy})`;
      default:
        return 'Unknown integrity issue';
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Data integrity dashboard is only available to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Integrity Dashboard</h2>
          <p className="text-slate-600">Monitor and maintain data consistency across the system</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={runChecks}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Checking...' : 'Run Checks'}
          </Button>
          {results && results.summary.totalIssues > 0 && (
            <Button
              onClick={repairIssues}
              disabled={isRepairing}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isRepairing ? 'Repairing...' : 'Auto-Repair Issues'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  results.summary.totalIssues === 0 ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {results.summary.totalIssues === 0 ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.summary.totalIssues}
                  </div>
                  <div className="text-sm text-slate-500">Total Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.orphanedUserAssignments.length}
                  </div>
                  <div className="text-sm text-slate-500">User Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.orphanedTeamAssignments.length + results.invalidTeamLeaders.length}
                  </div>
                  <div className="text-sm text-slate-500">Team Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.orphanedExecutions.length}
                  </div>
                  <div className="text-sm text-slate-500">Execution Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Detail */}
      {results && results.summary.totalIssues > 0 && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Issues ({results.summary.totalIssues})</TabsTrigger>
            <TabsTrigger value="users">User Issues ({results.orphanedUserAssignments.length})</TabsTrigger>
            <TabsTrigger value="teams">Team Issues ({results.orphanedTeamAssignments.length + results.invalidTeamLeaders.length})</TabsTrigger>
            <TabsTrigger value="executions">Execution Issues ({results.orphanedExecutions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {[...results.orphanedUserAssignments, ...results.orphanedTeamAssignments, ...results.invalidTeamLeaders, ...results.orphanedExecutions].map((issue, index) => (
              <Alert key={index}>
                {getIssueIcon(issue.type)}
                <AlertDescription className="ml-2">
                  <div className="flex items-center justify-between">
                    <span>{formatIssueDescription(issue)}</span>
                    <Badge variant={issue.type.includes('orphaned') ? 'destructive' : 'secondary'}>
                      {issue.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </TabsContent>

          {/* Similar TabsContent for other categories... */}
        </Tabs>
      )}

      {!results && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Ready to Run Integrity Checks</h3>
            <p className="text-slate-500 mb-6">
              Click "Run Checks" to scan your data for consistency issues
            </p>
            <Button onClick={runChecks} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Integrity Check
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}