import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  actionUrl, 
  onAction,
  className = "" 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-600 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
      {(actionText && (actionUrl || onAction)) && (
        actionUrl ? (
          <Link to={actionUrl}>
            <Button>{actionText}</Button>
          </Link>
        ) : (
          <Button onClick={onAction}>{actionText}</Button>
        )
      )}
    </div>
  );
}