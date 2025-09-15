import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export default function CompletionTrends({ executions, routines, dateRange, isLoading }) {
    if (isLoading) {
        return (
            <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-72 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    // Data processing logic
    const now = new Date();
    let startDate;
    switch(dateRange) {
        case '7days': startDate = subDays(now, 6); break;
        case '30days': startDate = subDays(now, 29); break;
        case '90days': startDate = subDays(now, 89); break;
        default: startDate = subDays(now, 29);
    }
    
    const interval = eachDayOfInterval({ start: startDate, end: now });
    
    const data = interval.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const executionsOnDay = executions.filter(e => format(new Date(e.execution_date), 'yyyy-MM-dd') === dayString);
        
        const total = executionsOnDay.length;
        const completed = executionsOnDay.filter(e => e.status === 'completed').length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        
        return {
            date: format(day, 'MMM d'),
            'Completion Rate': completionRate,
            'Total Executions': total
        };
    });

    return (
        <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
                <CardTitle>Completion Rate & Volume Trends</CardTitle>
                <CardDescription>Performance over the last {dateRange.replace('days', ' days')}</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Executions', angle: -90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Completion Rate" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Total Executions" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}