import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import logger from '@/lib/logger';

interface AuditLog {
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  resourceType: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
}

/**
 * ثبت Audit Log برای تمام عملیات‌های حساس
 * برای GDPR Compliance و Security Audit Trail
 */
export async function logAudit(
  request: NextRequest,
  log: AuditLog
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logger.warn('Audit log attempted without authenticated user');
      return;
    }
    
    // استخراج IP و User Agent
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // ذخیره در دیتابیس
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: log.action,
      resource_type: log.resourceType,
      resource_id: log.resourceId,
      old_data: log.oldData ? JSON.parse(JSON.stringify(log.oldData)) : null,
      new_data: log.newData ? JSON.parse(JSON.stringify(log.newData)) : null,
      ip_address: ip,
      user_agent: userAgent
    });
    
    if (error) {
      logger.error({ error: error.message }, 'Failed to save audit log');
    } else {
      logger.debug({
        userId: user.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId
      }, 'Audit log saved');
    }
    
  } catch (error: any) {
    // Silent fail - نباید عملیات اصلی را متوقف کند
    logger.error({ 
      error: error.message,
      stack: error.stack 
    }, 'Audit logger exception');
  }
}

/**
 * ثبت سریع Audit Log بدون Request object
 * برای استفاده در Server Actions
 */
export async function logAuditSimple(
  userId: string,
  log: AuditLog
): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action: log.action,
      resource_type: log.resourceType,
      resource_id: log.resourceId,
      old_data: log.oldData,
      new_data: log.newData,
      ip_address: 'server-action',
      user_agent: 'server-action'
    });
    
    if (error) {
      logger.error({ error: error.message }, 'Failed to save audit log (simple)');
    }
    
  } catch (error: any) {
    logger.error({ error: error.message }, 'Audit logger exception (simple)');
  }
}

