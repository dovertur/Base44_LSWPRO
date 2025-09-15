import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { industryConfig } from "@/components/shared/industryConfig";

export default function IndustryBreakdown({ routines, executions, isLoading }) {
    if (isLoading) {
        return <Card className="border-0 shadow-xl bg-white"><CardContent><Skeleton className="h-72 w-full" /></CardContent></Card>;
    }
    
    const industryData = Object.keys(industryConfig).map(industryKey => {
        const industryRoutines = routines.filter(r => r.industry === industryKey);
        const industryRoutineIds = new Set(industryRoutines.map(r => r.id));
        const industryExecutions = executions.filter(e => industryRoutineIds.has(e.routine_id));
        
        const total = industryExecutions.length;
        const completed = industryExecutions.filter(e => e.status === 'completed').length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        
        return {
            name: industryConfig[industryKey].name,
            'Completion Rate': completionRate,
            'Total Executions': total
        };
    }).filter(d => d['Total Executions'] > 0);

    return (
        <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
                <CardTitle>Performance by Industry</CardTitle>
                <CardDescription>Comparing completion rates and execution volume across industries.</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Completion Rate" fill="#16a34a" />
                        <Bar dataKey="Total Executions" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}