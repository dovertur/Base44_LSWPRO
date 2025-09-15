import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// This component will show performance breakdown by team
export default function TeamAnalytics({ executions, routines, isLoading }) {

    if (isLoading) {
        return (
            <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-72 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    // Aggregate performance data by team
    const teamPerformance = routines.reduce((acc, routine) => {
        if (!routine.owning_team_id) return acc;

        if (!acc[routine.owning_team_id]) {
            acc[routine.owning_team_id] = {
                teamId: routine.owning_team_id,
                teamName: `Team ${routine.owning_team_id.substring(0, 8)}`,
                totalExecutions: 0,
                completedExecutions: 0,
            };
        }

        const routineExecutions = executions.filter(e => e.routine_id === routine.id);
        acc[routine.owning_team_id].totalExecutions += routineExecutions.length;
        acc[routine.owning_team_id].completedExecutions += routineExecutions.filter(e => e.status === 'completed').length;
        
        return acc;
    }, {});

    const chartData = Object.values(teamPerformance).map(team => ({
        ...team,
        'Completion Rate': team.totalExecutions > 0 ? (team.completedExecutions / team.totalExecutions) * 100 : 0
    })).filter(d => d.totalExecutions > 0);

    return (
        <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Completion rates and execution volume by team.</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="teamName" />
                            <YAxis yAxisId="left" orientation="left" stroke="#16a34a" />
                            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Completion Rate" fill="#16a34a" name="Completion Rate (%)" />
                            <Bar yAxisId="right" dataKey="totalExecutions" fill="#3b82f6" name="Total Executions" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        No team data to display for the selected period. Assign routines to teams to see data here.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}