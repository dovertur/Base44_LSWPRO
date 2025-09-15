
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SendEmail } from '@/api/integrations';
import { Loader2, Mail } from 'lucide-react';
import { auditUserInvite } from "@/components/shared/auditLogger";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function InviteMemberDialog({ open, onClose, onMemberAdded, currentUser }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async () => {
    if (!validateForm()) return;

    setIsInviting(true);
    try {
      const inviteLink = `${window.location.origin}/signup?invited_by=${encodeURIComponent(currentUser.email)}`;
      const senderName = currentUser.full_name || currentUser.email;
      
      const emailBody = `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">You're Invited to Join LSWPro!</h1>
          <p>Hi there,</p>
          <p><strong>${senderName}</strong> has invited you to join their team on LSWPro - the operational excellence platform.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #475569; margin: 0 0 15px 0;">Getting Started</h2>
            <p style="margin-bottom: 20px;">Click the button below to create your account and start collaborating:</p>
            <a href="${inviteLink}" 
               style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Join ${senderName}'s Team
            </a>
          </div>
          
          <h3 style="color: #475569;">What is LSWPro?</h3>
          <p>LSWPro helps teams manage operational routines, track performance, and maintain excellence through:</p>
          <ul style="padding-left: 20px;">
            <li>Structured routine management and checklists</li>
            <li>Team performance analytics</li>
            <li>Task assignments and notifications</li>
            <li>Audit trails and compliance tracking</li>
          </ul>
          
          <p style="margin-top: 30px;">Welcome to the team!</p>
          <p><em>- The LSWPro Team</em></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            If you have any questions about this invitation, you can reply directly to this email to reach ${senderName}.
          </p>
        </div>
      `;

      await SendEmail({
        to: email.trim(),
        subject: `${senderName} invited you to join their LSWPro team`,
        body: emailBody,
        from_name: "LSWPro"
      });

      // Audit the user invitation
      await auditUserInvite(email.trim());

      toast({
        title: "Invitation Sent!",
        description: `An invitation has been sent to ${email.trim()}.`,
      });

      setEmail('');
      setFullName('');
      setJobTitle('');
      setErrors({}); // Clear any previous errors
      onClose();
      if (onMemberAdded) onMemberAdded();

    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast({
        title: "Invitation Failed",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your LSWPro team. They'll receive an email with instructions to create their account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({...prev, email: null}));
              }}
              placeholder="colleague@company.com"
              className={errors.email ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="full_name">Full Name (Optional)</Label>
            <Input
              id="full_name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="job_title">Job Title (Optional)</Label>
            <Input
              id="job_title"
              type="text"
              autoComplete="organization-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Operations Manager"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isInviting}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
