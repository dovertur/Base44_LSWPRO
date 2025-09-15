import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, SlidersHorizontal, Building, Zap, Filter, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const UpgradeNotice = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-lg border">
    <div className="p-4 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-full mb-6">
      <Shield className="w-12 h-12 text-violet-600" />
    </div>
    <h2 className="text-3xl font-bold text-slate-900">Advanced Security & Audit Trails</h2>
    <p className="mt-2 text-lg text-slate-600 max-w-xl">
      This feature is available on the Pro+ plan. Gain full visibility into every action taken in your workspace for compliance and security.
    </p>
    <div className="mt-8 flex items-center gap-4">
      <Button asChild size="lg" className="gap-2 bg-slate-900 hover:bg-slate-800">
        <Link to={createPageUrl("Billing")}>
          <Zap className="w-5 h-5" />
          Upgrade to Pro+
        </Link>
      </Button>
    </div>
  </div>
);

export default function AuditTrail() {
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    user: 'all',
    action: 'all',
    entity_type: 'all',
    timeframe: '30days'
  });

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, auditLogs, users] = await Promise.all([
        User.me(),
        AuditLog.list('-created_date', 500), // Load more for filtering
        User.list(),
      ]);
      setCurrentUser(user);
      if (user?.tier === 'pro_plus') {
        setLogs(auditLogs);
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Error loading audit trail data:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const getActionBadgeColor = (action) => {
    if (action.includes('create')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('promote') || action.includes('leader')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getEntityBadgeColor = (entityType) => {
    switch (entityType) {
      case 'User': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Team': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Routine': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredLogs = logs.filter(log => {
    // Search filter
    const searchMatch = filters.search 
      ? log.details.toLowerCase().includes(filters.search.toLowerCase()) || 
        log.entity_type.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.action.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    
    // User filter
    const userMatch = filters.user === 'all' ? true : log.actor_email === filters.user;
    
    // Action filter
    const actionMatch = filters.action === 'all' ? true : log.action.includes(filters.action);
    
    // Entity type filter
    const entityMatch = filters.entity_type === 'all' ? true : log.entity_type === filters.entity_type;
    
    // Time filter
    let timeMatch = true;
    if (filters.timeframe !== 'all') {
      const logDate = new Date(log.created_date);
      const now = new Date();
      const daysAgo = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      }[filters.timeframe];
      if (daysAgo) {
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        timeMatch = logDate >= cutoffDate;
      }
    }
    
    return searchMatch && userMatch && actionMatch && entityMatch && timeMatch;
  });

  // Get unique values for filters
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entity_type))];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (currentUser?.tier !== 'pro_plus') {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-6">
        <UpgradeNotice />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-10 h-10 text-slate-700" />
            Audit Trail
          </h1>
          <p className="text-lg text-slate-600">
            Review all important events and changes that have occurred in your workspace.
          </p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by action, user, or entity..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-slate-50 border-slate-300"
                  type="search"
                  inputMode="search"
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Select value={filters.user} onValueChange={(value) => setFilters(prev => ({...prev, user: value}))}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {allUsers.map(u => (
                      <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({...prev, action: value}))}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create Actions</SelectItem>
                    <SelectItem value="update">Update Actions</SelectItem>
                    <SelectItem value="delete">Delete Actions</SelectItem>
                    <SelectItem value="team">Team Changes</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.entity_type} onValueChange={(value) => setFilters(prev => ({...prev, entity_type: value}))}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueEntityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.timeframe} onValueChange={(value) => setFilters(prev => ({...prev, timeframe: value}))}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>

                {(filters.search || filters.user !== 'all' || filters.action !== 'all' || filters.entity_type !== 'all' || filters.timeframe !== '30days') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      search: '',
                      user: 'all',
                      action: 'all',
                      entity_type: 'all',
                      timeframe: '30days'
                    })}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="text-sm text-slate-600">
                Showing {filteredLogs.length} of {logs.length} events
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? filteredLogs.map(log => {
                  const actor = allUsers.find(u => u.email === log.actor_email);
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-medium text-slate-900">{actor?.full_name || log.actor_email}</div>
                        <div className="text-sm text-slate-500">{log.actor_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEntityBadgeColor(log.entity_type)}>
                          {log.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 max-w-md truncate" title={log.details}>{log.details}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {format(parseISO(log.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="w-8 h-8 text-slate-300" />
                        <p className="text-slate-500">No audit logs found for the selected filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}