import { UsageCounter } from "@/api/entities";
import { User } from "@/api/entities";

// Get current month in YYYY-MM format
export const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Check and update AI generation usage
export const checkAndUpdateAIUsage = async (user, tierLimits) => {
  if (!user || !tierLimits || user.tier === 'free' || user.tier === 'pro_plus') {
    // Free users are blocked by other means, Pro+ has unlimited
    return { canUse: true, remaining: null };
  }

  if (user.tier === 'pro') {
    const currentPeriod = getCurrentPeriod();
    const limit = tierLimits.ai_generations_per_month || 20;

    // Get current usage
    const usageRecords = await UsageCounter.filter({
      user_id: user.id,
      metric: 'ai_generations',
      period: currentPeriod
    });

    let currentCount = 0;
    if (usageRecords.length > 0) {
      currentCount = usageRecords[0].count;
    }

    if (currentCount >= limit) {
      return { canUse: false, remaining: 0, limit };
    }

    // Update usage count
    if (usageRecords.length > 0) {
      await UsageCounter.update(usageRecords[0].id, {
        count: currentCount + 1
      });
    } else {
      await UsageCounter.create({
        user_id: user.id,
        metric: 'ai_generations',
        period: currentPeriod,
        count: 1
      });
    }

    return { canUse: true, remaining: limit - (currentCount + 1), limit };
  }

  return { canUse: true, remaining: null };
};

// Get current AI usage without updating
export const getAIUsage = async (user, tierLimits) => {
  if (!user || !tierLimits || user.tier === 'free' || user.tier === 'pro_plus') {
    return { used: 0, remaining: null, limit: null };
  }

  if (user.tier === 'pro') {
    const currentPeriod = getCurrentPeriod();
    const limit = tierLimits.ai_generations_per_month || 20;

    const usageRecords = await UsageCounter.filter({
      user_id: user.id,
      metric: 'ai_generations',
      period: currentPeriod
    });

    const used = usageRecords.length > 0 ? usageRecords[0].count : 0;
    return { used, remaining: limit - used, limit };
  }

  return { used: 0, remaining: null, limit: null };
};