import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

interface AuditLog {
  action: 'create' | 'read' | 'update' | 'delete';
  resourceType: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
}

export async function logAudit(
  request: NextRequest,
  log: AuditLog
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: log.action,
      resource_type: log.resourceType,
      resource_id: log.resourceId,
      old_data: log.oldData,
      new_data: log.newData,
      ip_address: ip,
      user_agent: userAgent
    });
    
  } catch (error) {
    // Silent fail - don't block main request
    console.error('Audit log failed:', error);
  }
}
