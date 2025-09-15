
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { SendEmail } from '@/api/integrations';
import { Loader2, Send } from 'lucide-react';

export default function SendMessageDialog({ open, onClose, recipient, sender }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!body.trim()) newErrors.body = "Message body cannot be empty.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) return;

    setIsSending(true);
    try {
      const fromName = sender?.full_name || "LSWPro App";
      const emailBody = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <p>Hi ${recipient.full_name || recipient.email.split('@')[0]},</p>
          <p>You have received a new message from <strong>${sender.full_name || sender.email}</strong>:</p>
          <div style="padding: 15px; border-left: 4px solid #e2e8f0; margin: 15px 0;">
            <p style="margin: 0;">${body.replace(/\n/g, '<br>')}</p>
          </div>
          <p>You can reply directly to this email to respond.</p>
          <p><em>- Sent via LSWPro</em></p>
        </div>
      `;

      await SendEmail({ to: recipient.email, subject, body: emailBody, from_name: fromName });

      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${recipient.full_name || recipient.email}.`,
      });

      setSubject('');
      setBody('');
      onClose();

    } catch (err) {
      console.error("Failed to send message:", err);
      toast({
        title: "Error Sending Message",
        description: "There was a problem sending the message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!recipient) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipient.full_name || recipient.email}</DialogTitle>
          <DialogDescription>
            The user will receive this message as an email from you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input 
              id="recipient" 
              type="email"
              value={recipient.full_name ? `${recipient.full_name} <${recipient.email}>` : recipient.email} 
              readOnly 
              className="bg-slate-100" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              autoComplete="off"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors(prev => ({...prev, subject: null}));
              }}
              placeholder="Message subject"
              className={errors.subject ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors(prev => ({...prev, body: null}));
              }}
              placeholder={`Type your message to ${recipient.full_name || 'the user'} here.`}
              rows={6}
              className={errors.body ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
