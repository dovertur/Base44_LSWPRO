import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkloadDistribution({ teamMembers, routines, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const workloadData = teamMembers.map(member => {
    const activeAssignments = routines.filter(r => 
      r.assigned_to?.includes(member.email) && r.status === 'active'
    );
    
    const criticalTasks = activeAssignments.filter(r => r.priority === 'critical').length;
    const highTasks = activeAssignments.filter(r => r.priority === 'high').length;
    const totalEstimatedTime = activeAssignments.reduce((sum, r) => sum + (r.estimated_duration || 0), 0);
    
    const workloadScore = criticalTasks * 3 + highTasks * 2 + activeAssignments.length;
    
    return {
      name: member.full_name?.split(' ')[0] || member.email.split('@')[0],
      email: member.email,
      activeAssignments: activeAssignments.length,
      criticalTasks,
      highTasks,
      totalEstimatedTime,
      workloadScore,
      completionRate: member.completionRate
    };
  }).sort((a, b) => b.workloadScore - a.workloadScore);

  const overloadedMembers = workloadData.filter(m => m.workloadScore > 10);
  const underutilizedMembers = workloadData.filter(m => m.workloadScore < 3 && m.activeAssignments < 2);
  const avgWorkload = workloadData.length > 0 
    ? workloadData.reduce((sum, m) => sum + m.workloadScore, 0) / workloadData.length 
    : 0;

  const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Workload Summary */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{overloadedMembers.length}</div>
                <div className="text-sm text-slate-500">Overloaded</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{underutilizedMembers.length}</div>
                <div className="text-sm text-slate-500">Underutilized</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{avgWorkload.toFixed(1)}</div>
                <div className="text-sm text-slate-500">Avg Workload</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {workloadData.filter(m => m.workloadScore >= 5 && m.workloadScore <= 10).length}
                </div>
                <div className="text-sm text-slate-500">Optimally Loaded</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="activeAssignments" fill="#3b82f6" name="Active Tasks" />
                  <Bar dataKey="criticalTasks" fill="#ef4444" name="Critical Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Time Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadData.filter(m => m.totalEstimatedTime > 0).slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalEstimatedTime"
                  >
                    {workloadData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value} min`, 'Estimated Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Workload Table */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Team Workload Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Team Member</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Active Tasks</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Critical</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">High Priority</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Est. Time</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Workload Status</th>
                </tr>
              </thead>
              <tbody>
                {workloadData.map((member) => {
                  const getWorkloadStatus = () => {
                    if (member.workloadScore > 10) return { text: "Overloaded", color: "bg-red-100 text-red-700 border-red-200" };
                    if (member.workloadScore < 3) return { text: "Underutilized", color: "bg-blue-100 text-blue-700 border-blue-200" };
                    return { text: "Optimal", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
                  };
                  
                  const status = getWorkloadStatus();
                  
                  return (
                    <tr key={member.email} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {member.name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{member.name}</div>
                            <div className="text-xs text-slate-500 truncate">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{member.activeAssignments}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${member.criticalTasks > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {member.criticalTasks}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${member.highTasks > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                          {member.highTasks}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{member.totalEstimatedTime} min</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={status.color}>{status.text}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workload Insights */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">⚖️ Workload Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overloadedMembers.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overloaded Team Members
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                The following team members may need workload redistribution:
              </p>
              <div className="flex flex-wrap gap-2">
                {overloadedMembers.map(member => (
                  <Badge key={member.email} variant="destructive" className="text-xs">
                    {member.name} ({member.activeAssignments} tasks)
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {underutilizedMembers.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Capacity
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                These team members have capacity for additional assignments:
              </p>
              <div className="flex flex-wrap gap-2">
                {underutilizedMembers.map(member => (
                  <Badge key={member.email} className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    {member.name} ({member.activeAssignments} tasks)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}