import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimeAnalysis({ executions, routines, dateRange, isLoading }) {
    if (isLoading) {
        return <Card className="border-0 shadow-xl bg-white"><CardContent><Skeleton className="h-72 w-full" /></CardContent></Card>;
    }
    return (
        <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
                <CardTitle>Time-based Analysis</CardTitle>
                <CardDescription>Coming soon: Insights into performance by time of day and day of the week.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-72 flex items-center justify-center text-slate-500">
                    Time analysis charts will be displayed here.
                </div>
            </CardContent>
        </Card>
    );
}