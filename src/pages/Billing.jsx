import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { TierLimit } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, CreditCard, Sparkles, Zap, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentUsage from '../components/billing/CurrentUsage';

const plans = {
  free: {
    name: "Free",
    price: "$0",
    description: "For individuals and small teams getting started.",
    features: [
      "5 Active Routines",
      "3 Team Members",
      "30-Day Analytics History",
      "Standard Support"
    ],
    cta: "Current Plan",
    icon: Sparkles,
    color: "text-slate-800",
    bgColor: "bg-slate-100",
    buttonVariant: "outline"
  },
  pro: {
    name: "Pro",
    price: "$29",
    priceFrequency: "/ month",
    description: "For growing teams that need more power and collaboration.",
    features: [
      "Unlimited Routines",
      "Full Team Management",
      "AI Routine Generation (20/month)",
      "90-Day Analytics History",
      "CSV Data Exports"
    ],
    cta: "Upgrade to Pro",
    icon: Zap,
    color: "text-emerald-800",
    bgColor: "bg-emerald-100",
    buttonVariant: "default"
  },
  pro_plus: {
    name: "Pro+",
    price: "$79",
    priceFrequency: "/ month",
    description: "For large organizations with advanced needs.",
    features: [
      "All Pro features, plus:",
      "Unlimited AI Generations",
      "Unlimited Analytics History",
      "Advanced Analytics & Filters",
      "Audit Trails & API Access",
    ],
    cta: "Upgrade to Pro+",
    icon: Building,
    color: "text-violet-800",
    bgColor: "bg-violet-100",
    buttonVariant: "default"
  }
};

export default function Billing() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tierLimits, setTierLimits] = useState(null); // New state for tier limits
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  const loadData = useCallback(async () => { // Renamed from loadUser
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (user.tier) {
        const limits = await TierLimit.filter({ tier: user.tier });
        if (limits.length > 0) {
          setTierLimits(limits[0]);
        } else {
          // Fallback if no specific limits found for the tier (e.g., free tier might not have an entry)
          setTierLimits({}); // Set to an empty object or a default limit object
        }
      } else {
        // If user has no tier, default to 'free' or a base set of limits
        setTierLimits({});
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setTierLimits({}); // Ensure tierLimits is set even on error to prevent infinite loading
    }
    setIsLoading(false);
  }, []); // No dependencies needed as it doesn't rely on props or state

  useEffect(() => {
    loadData(); // Call loadData instead of loadUser
  }, [loadData]);

  const handleUpgrade = (tier) => {
    alert(`This would typically redirect to a Stripe checkout page to upgrade to the ${plans[tier].name} plan.`);
  };
  
  const handleSimulateUpgrade = async (tier) => {
    if (!currentUser) return;
    try {
      await User.updateMyUserData({ tier });
      await loadData(); // Refresh user and tier limit data
    } catch (error) {
      console.error(`Failed to simulate upgrade to ${tier}:`, error);
    }
  };

  if (isLoading || !tierLimits) { // Added !tierLimits to loading condition
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <CreditCard className="w-10 h-10 text-slate-700" />
            Billing & Subscriptions
          </h1>
          <p className="text-lg text-slate-600">
            Manage your plan, view invoices, and update payment details.
          </p>
        </div>

        {/* The previous "Current Plan" Card component is removed from here */}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Choose Your Plan</h2>
              <p className="text-slate-600">Upgrade to unlock powerful features for your team.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {Object.entries(plans).map(([key, plan]) => {
                const isCurrentPlan = currentUser?.tier === key;
                return (
                  <Card 
                    key={key} 
                    className={`flex flex-col border-0 shadow-xl ${isCurrentPlan ? 'ring-2 ring-slate-900' : ''}`}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center items-center mb-4">
                        <div className={`p-3 rounded-lg ${plan.bgColor}`}>
                          <plan.icon className={`w-6 h-6 ${plan.color}`} />
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-slate-600 h-10">{plan.description}</CardDescription>
                      <div className="text-4xl font-bold text-slate-900 mt-4">
                        {plan.price}
                        <span className="text-lg font-normal text-slate-500">{plan.priceFrequency}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                      <ul className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleUpgrade(key)}
                        disabled={isCurrentPlan}
                        variant={isCurrentPlan ? 'outline' : 'default'}
                        className={`w-full ${isCurrentPlan ? '' : 'bg-slate-900 hover:bg-slate-800'}`}
                      >
                        {isCurrentPlan ? "Current Plan" : plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          <div className="space-y-8">
            {/* New CurrentUsage component */}
            <CurrentUsage currentUser={currentUser} tierLimits={tierLimits} />
            
            <Card className="border-dashed border-slate-300 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-slate-600" />
                  Developer Mode
                </CardTitle>
                <CardDescription>
                  Simulate plan changes to see how the app behaves on different tiers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="dev-mode" checked={isDevMode} onCheckedChange={setIsDevMode} />
                  <Label htmlFor="dev-mode">Enable Plan Simulation</Label>
                </div>
                {isDevMode && (
                  <div className="flex flex-wrap gap-4 p-4 bg-slate-100 rounded-lg">
                    <Button 
                      onClick={() => handleSimulateUpgrade('free')} 
                      disabled={currentUser?.tier === 'free'}
                      variant="outline"
                    >
                      Switch to Free
                    </Button>
                    <Button 
                      onClick={() => handleSimulateUpgrade('pro')} 
                      disabled={currentUser?.tier === 'pro'}
                      variant="outline"
                    >
                      Switch to Pro
                    </Button>
                    <Button 
                      onClick={() => handleSimulateUpgrade('pro_plus')} 
                      disabled={currentUser?.tier === 'pro_plus'}
                      variant="outline"
                    >
                      Switch to Pro+
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}