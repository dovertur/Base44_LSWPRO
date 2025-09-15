
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPerformanceChart({ teamMembers, executions, isLoading }) {
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

  const chartData = teamMembers
    .filter(member => member.totalExecutions > 0)
    .map(member => ({
      name: member.full_name?.split(' ')[0] || member.email.split('@')[0],
      completionRate: member.completionRate || 0, // Added safeguard
      totalTasks: member.totalExecutions,
      avgDuration: member.avgDuration || 0, // Added safeguard
      thisWeek: member.thisWeekExecutions
    }))
    .sort((a, b) => b.completionRate - a.completionRate);

  const topPerformers = chartData.slice(0, 3);
  const teamAvg = chartData.length > 0 
    ? chartData.reduce((sum, member) => sum + (member.completionRate || 0), 0) / chartData.length // Added safeguard
    : 0;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        {topPerformers.map((performer, index) => (
          <Card key={performer.name} className={`border-0 shadow-xl bg-white relative overflow-hidden ${
            index === 0 ? 'ring-2 ring-yellow-400' : ''
          }`}>
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
                TOP PERFORMER
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-100' : 
                  index === 1 ? 'bg-slate-100' : 
                  'bg-orange-100'
                }`}>
                  {index === 0 && <Award className="w-6 h-6 text-yellow-600" />}
                  {index === 1 && <span className="text-slate-600 font-bold text-lg">2</span>}
                  {index === 2 && <span className="text-orange-600 font-bold text-lg">3</span>}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {performer.name}
                  </CardTitle>
                  <div className="text-sm text-slate-500">
                    Rank #{index + 1}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-900">{performer.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-slate-500">Completion Rate</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{performer.totalTasks}</div>
                  <div className="text-slate-500">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{performer.thisWeek}</div>
                  <div className="text-slate-500">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Weekly Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    formatter={(value, name) => {
                      if (name === 'thisWeek') return [value, 'Tasks This Week'];
                      return [value, name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="thisWeek" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">📊 Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-slate-900 mb-2">Team Average</h4>
              <div className="text-2xl font-bold text-slate-900 mb-1">{teamAvg.toFixed(1)}%</div>
              <p className="text-sm text-slate-600">
                {teamAvg >= 80 ? 'Excellent team performance! 🎉' : 
                 teamAvg >= 70 ? 'Good team performance, room to grow 📈' : 
                 'Team needs support to improve performance 🎯'}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-slate-900 mb-2">Active Contributors</h4>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {chartData.filter(m => m.thisWeek > 0).length}
              </div>
              <p className="text-sm text-slate-600">
                Team members completed tasks this week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
