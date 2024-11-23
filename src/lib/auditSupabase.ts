import { createClient } from '@supabase/supabase-js';

// T1 Business Line Audit Database
const t1AuditSupabaseUrl = 'https://pphakjxqfaewhtuqovzz.supabase.co';
const t1AuditSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGFranhxZmFld2h0dXFvdnp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjI2NjY2OSwiZXhwIjoyMDQ3ODQyNjY5fQ.xulRcXYIqw-pN73_41C9_D77d6JBa5Ri0487pI6oDck';

// Create clients for different business lines
export const auditDatabases = {
  T1: createClient(t1AuditSupabaseUrl, t1AuditSupabaseKey),
  // Add more databases for other business lines as needed
};

export function getAuditDatabase(businessLine: string) {
  // Default to T1 if no specific database is found
  return auditDatabases[businessLine as keyof typeof auditDatabases] || auditDatabases.T1;
}