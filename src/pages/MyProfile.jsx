
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, Lock, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { auditProfileUpdate } from "@/components/shared/auditLogger";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  // Replaced separate states with a formData object for better management
  const [formData, setFormData] = useState({ full_name: '', job_title: '', bio: '' });
  // Updated error key to match formData.full_name
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        // Populate formData from fetched user data
        setFormData({
          full_name: currentUser.full_name || '',
          job_title: currentUser.job_title || '',
          bio: currentUser.bio || ''
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setErrors({});
    // Validate full_name from formData
    if (!formData.full_name.trim()) {
      setErrors({ full_name: 'Full name cannot be empty.' }); // Updated error key
      return;
    }

    setIsSaving(true);
    try {
      // Use formData for the update payload
      const updatedData = {
        full_name: formData.full_name,
        job_title: formData.job_title,
        bio: formData.bio
      };

      // Detect changes for audit logging
      const changes = {};
      const fieldsToAudit = ['full_name', 'job_title', 'bio'];
      fieldsToAudit.forEach(key => {
        // Normalize values to empty string for consistent comparison
        const userValue = String(user?.[key] || '');
        const formValue = String(formData[key] || '');

        if (userValue !== formValue) {
          changes[key] = { from: userValue, to: formValue };
        }
      });

      await User.updateMyUserData(updatedData);
      setUser(prev => ({ ...prev, ...updatedData }));

      // Audit the profile update if there were changes
      if (Object.keys(changes).length > 0) {
        // Ensure user and user.id are available before auditing
        if (user && user.id) {
          await auditProfileUpdate(user.id, changes);
        } else {
          console.warn("User ID not available for audit logging.");
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Failed to update user data:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };
  
  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // File size validation (5MB limit for profile pictures)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Profile pictures must be under 5MB. Please choose a smaller file.",
        variant: "destructive",
      });
      // Clear the file input to allow re-uploading a different file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Profile pictures must be JPEG, PNG, GIF, or WebP format.",
        variant: "destructive",
      });
      // Clear the file input to allow re-uploading a different file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploadingPicture(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ custom_picture_url: file_url });
      setUser(prev => ({ ...prev, custom_picture_url: file_url }));
      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been saved.",
      });
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPicture(false);
      // Clear the file input to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-500">Could not load user profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-4xl font-bold text-slate-900">My Profile</h1>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                  <AvatarImage src={user.custom_picture_url || user.picture} alt={user.full_name} />
                  <AvatarFallback className="text-3xl bg-slate-800 text-white">
                    {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-300 cursor-pointer"
                  disabled={isUploadingPicture}
                >
                  {isUploadingPicture ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.full_name || 'User'}</CardTitle>
                <CardDescription className="text-lg text-slate-600">{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="full_name" className="font-semibold">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, full_name: e.target.value }));
                    if (errors.full_name) setErrors(prev => ({ ...prev, full_name: null }));
                  }}
                  placeholder="Your full name"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-100"
                />
                <p className="text-sm text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="job_title" className="font-semibold">Job Title</Label>
                <Input
                  id="job_title"
                  type="text"
                  autoComplete="organization-title"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="Your role or position"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="font-semibold">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us a little about yourself..."
                  rows={4}
                />
                <p className="text-xs text-slate-500">A brief description of your role and responsibilities.</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving || isUploadingPicture}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div>
                <p className="font-semibold">Password</p>
                <p className="text-sm text-slate-500">Change your account password.</p>
              </div>
              <Button variant="outline" disabled>
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
             <p className="text-xs text-slate-400 mt-2 pl-4">Password management is handled by your social login provider (e.g., Google).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
