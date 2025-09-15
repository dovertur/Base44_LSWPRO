import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PerformanceListItem = ({ routine }) => (
    <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex-1 min-w-0">
            <Link to={createPageUrl(`Routines?query=${encodeURIComponent(routine.title)}`)} className="hover:underline">
                <p className="text-sm font-medium text-slate-800 truncate">{routine.title}</p>
            </Link>
            <p className="text-xs text-slate-500">{routine.totalExecutions} executions</p>
        </div>
        <div className="w-24 text-right">
            <span className="text-sm font-semibold">{routine.completionRate.toFixed(0)}%</span>
            <Progress value={routine.completionRate} className="h-1 mt-1" />
        </div>
        <Link to={createPageUrl(`Routines?query=${encodeURIComponent(routine.title)}`)}>
            <ArrowRight className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        </Link>
    </div>
);

export default function RoutinePerformance({ routines, executions, isLoading }) {
    if (isLoading) {
        return (
            <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                     <Skeleton className="h-6 w-48" />
                     <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div>
                        <Skeleton className="h-5 w-32 mb-4" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-5 w-32 mb-4" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const routinePerformanceData = routines.map(routine => {
        const routineExecutions = executions.filter(e => e.routine_id === routine.id);
        const totalExecutions = routineExecutions.length;
        const completedExecutions = routineExecutions.filter(e => e.status === 'completed').length;
        const completionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
        
        return { ...routine, totalExecutions, completionRate };
    }).filter(r => r.totalExecutions > 0);

    const sortedByPerformance = [...routinePerformanceData].sort((a, b) => b.completionRate - a.completionRate);
    
    const topPerformers = sortedByPerformance.slice(0, 5);
    const bottomPerformers = sortedByPerformance.slice(-5).reverse();

    return (
        <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
                <CardTitle>Top & Bottom Performing Routines</CardTitle>
                <CardDescription>Highlights routines with the highest and lowest completion rates.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-emerald-700">
                        <TrendingUp className="w-5 h-5" />
                        Top 5 Performers
                    </h3>
                    <div className="divide-y divide-slate-100">
                        {topPerformers.length > 0 ? (
                            topPerformers.map(routine => <PerformanceListItem key={`top-${routine.id}`} routine={routine} />)
                        ) : (
                            <p className="text-sm text-slate-500 py-4">No routine data to display.</p>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-red-700">
                        <TrendingDown className="w-5 h-5" />
                        Bottom 5 Performers
                    </h3>
                    <div className="divide-y divide-slate-100">
                         {bottomPerformers.length > 0 ? (
                            bottomPerformers.map(routine => <PerformanceListItem key={`bottom-${routine.id}`} routine={routine} />)
                        ) : (
                            <p className="text-sm text-slate-500 py-4">No routine data to display.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}