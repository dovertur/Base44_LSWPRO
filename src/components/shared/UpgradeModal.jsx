import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Zap, Building, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const featureMapping = {
  "Active Routines": {
    icon: CheckCircle,
    description: "Create unlimited operational routines",
    freeLimit: "5 routines",
    proFeature: "Unlimited routines"
  },
  "Team Members": {
    icon: CheckCircle,
    description: "Add more team members to collaborate",
    freeLimit: "3 members",
    proFeature: "Up to 25 members"
  },
  "AI Routine Generation": {
    icon: Sparkles,
    description: "Use AI to automatically create detailed routines",
    freeLimit: "Not available",
    proFeature: "20 generations/month"
  },
  "Analytics History": {
    icon: CheckCircle,
    description: "Access longer analytics history",
    freeLimit: "30 days",
    proFeature: "90+ days"
  },
  "CSV Export": {
    icon: CheckCircle,
    description: "Export your data for external analysis",
    freeLimit: "Not available",
    proFeature: "Full CSV export"
  }
};

export default function UpgradeModal({ open, onClose, featureName }) {
  const feature = featureMapping[featureName] || featureMapping["Active Routines"];
  const IconComponent = feature.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-full w-fit">
            <IconComponent className="w-8 h-8 text-violet-600" />
          </div>
          <DialogTitle className="text-2xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-base">
            You've reached the limit for <strong>{featureName}</strong> on the Free plan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">{feature.description}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Free Plan:</span>
                <Badge variant="outline" className="text-slate-600">{feature.freeLimit}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pro Plan:</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{feature.proFeature}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">Pro Plan also includes:</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Team management & collaboration
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Advanced analytics & reporting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Priority customer support
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <Link to={createPageUrl("Billing")}>
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to Pro - $29/month
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}