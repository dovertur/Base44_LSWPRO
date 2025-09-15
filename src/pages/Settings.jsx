
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// New Imports
import { Badge } from '@/components/ui/badge'; // Added per outline's implicit needs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator'; // Added per outline's implicit needs
import { Alert, AlertDescription } from '@/components/ui/alert'; // Added per outline's implicit needs
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  Shield,
  Database,
  User as UserIcon,
  Sparkles
} from "lucide-react";
import DataIntegrityDashboard from "../components/shared/DataIntegrityDashboard"; // New import

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null); // Renamed from 'user' to 'currentUser' as per outline
  const [settings, setSettings] = useState({
    weekly_individual_summary: true,
    weekly_team_summary: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const user = await User.me(); // Fetch the user
        setCurrentUser(user); // Set currentUser state
        if (user.notification_preferences) {
          setSettings(user.notification_preferences);
        }
      } catch (error) {
        console.error("Failed to fetch user settings:", error);
        toast({
          title: "Error",
          description: "Could not load your settings.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({ notification_preferences: settings });
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <Skeleton className="h-4 w-40" />
                 <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
             <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <Skeleton className="h-4 w-40" />
                 <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-10 w-28 ml-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8"> {/* Changed max-w-4xl to max-w-7xl */}
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <UserIcon className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            {currentUser?.role === 'admin' && (
              <TabsTrigger value="system" className="gap-2">
                <Database className="w-4 h-4" />
                System
              </TabsTrigger>
            )}
          </TabsList>

          {/* Notifications Tab Content */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                {/* Original CardDescription is removed as per outline; description text is next to switches */}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="individual-summary" className="font-semibold">Weekly Individual Summary</Label>
                    <p className="text-sm text-slate-500">Receive a weekly email summarizing your personal task performance.</p>
                  </div>
                  <Switch
                    id="individual-summary"
                    checked={settings.weekly_individual_summary}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, weekly_individual_summary: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="team-summary" className="font-semibold">Weekly Team Summary</Label>
                    <p className="text-sm text-slate-500">Receive a weekly summary of your team's performance (if you are a team leader).</p>
                  </div>
                  <Switch
                    id="team-summary"
                    checked={settings.weekly_team_summary}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, weekly_team_summary: checked }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab Content (placeholder) */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Your account details and preferences will be managed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab Content (placeholder) */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Subscription Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Manage your subscription plan and billing information here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab Content (conditionally rendered for admin) */}
          {currentUser?.role === 'admin' && (
            <TabsContent value="system" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    System Administration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Integrity</h3>
                      <p className="text-slate-600 mb-4">
                        Monitor and maintain data consistency across the system. Run checks to identify
                        orphaned references and inconsistencies.
                      </p>
                      <DataIntegrityDashboard />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
