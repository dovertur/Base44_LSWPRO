import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Routine } from '@/api/entities';
import { getAIUsage } from '@/components/shared/usageHelpers';
import { Zap, ClipboardList, BarChart3 } from 'lucide-react';

export default function CurrentUsage({ currentUser, tierLimits }) {
  const [usage, setUsage] = useState({
    activeRoutines: 0,
    aiGenerations: { used: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    if (!currentUser || !tierLimits) return;

    setIsLoading(true);
    try {
      const [routines, aiUsage] = await Promise.all([
        Routine.filter({ created_by: currentUser.email, status: 'active' }),
        getAIUsage(currentUser, tierLimits),
      ]);
      setUsage({
        activeRoutines: routines.length,
        aiGenerations: aiUsage,
      });
    } catch (error) {
      console.error("Error loading usage data:", error);
    }
    setIsLoading(false);
  }, [currentUser, tierLimits]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const UsageBar = ({ icon: Icon, title, used, limit }) => {
    const percentage = limit ? (used / limit) * 100 : 0;
    const isUnlimited = limit === null || limit === undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-lg font-bold text-slate-900">{used}</span>
              <span className="text-sm text-slate-500">
                {isUnlimited ? 'Unlimited' : `/ ${limit}`}
              </span>
            </div>
            {!isUnlimited && <Progress value={percentage} className="h-2" />}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader>
        <CardTitle>Current Usage & Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageBar
          icon={ClipboardList}
          title="Active Routines"
          used={usage.activeRoutines}
          limit={tierLimits?.max_active_routines}
        />
        <UsageBar
          icon={Zap}
          title="AI Generations (This Month)"
          used={usage.aiGenerations.used}
          limit={tierLimits?.ai_generations_per_month}
        />
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics History</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-1/2" />
          ) : (
            <div className="text-lg font-bold text-slate-900">
              {tierLimits?.analytics_history_days ? `${tierLimits.analytics_history_days} Days` : 'Unlimited'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}