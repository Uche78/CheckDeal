import { supabase } from './client';
import { getCurrentBroker } from './brokers';
import type { Borrower, BorrowerInsert, BorrowerUpdate } from '../types/database';

/**
 * Get all borrowers for a specific application
 */
export async function getBorrowersByApplicationId(applicationId: string): Promise<Borrower[]> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    throw new Error('Not authenticated');
  }
  
  // First verify the application belongs to this broker
  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('broker_id', broker.id)
    .single();
  
  if (!application) {
    throw new Error('Application not found or access denied');
  }
  
  const { data, error } = await supabase
    .from('borrowers')
    .select('*')
    .eq('application_id', applicationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching borrowers:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a single borrower by ID
 */
export async function getBorrowerById(id: string): Promise<Borrower | null> {
  const { data, error } = await supabase
    .from('borrowers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching borrower:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create a new borrower
 */
export async function createBorrower(borrower: BorrowerInsert): Promise<Borrower> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    throw new Error('Not authenticated');
  }
  
  // Verify the application belongs to this broker
  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('id', borrower.application_id)
    .eq('broker_id', broker.id)
    .single();
  
  if (!application) {
    throw new Error('Application not found or access denied');
  }
  
  const { data, error } = await supabase
    .from('borrowers')
    .insert(borrower)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating borrower:', error);
    throw error;
  }

// ✅ Log activity
  await logActivity(
    borrower.application_id,
    'borrower_added',
    `${borrower.borrower_type === 'primary' ? 'Primary borrower' : 'Co-borrower'} added: ${borrower.full_name}`,
    { borrower_id: data.id, borrower_type: borrower.borrower_type }
  );
  
  return data;
}

/**
 * Update a borrower
 */
export async function updateBorrower(id: string, updates: Partial<BorrowerUpdate>): Promise<Borrower> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('borrowers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating borrower:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a borrower (soft delete)
 */
export async function deleteBorrower(id: string): Promise<void> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    throw new Error('Not authenticated');
  }

  // Soft delete - set deleted_at timestamp
  const { error } = await supabase
    .from('borrowers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting borrower:', error);
    throw error;
  }
// ✅ Log activity
  if (borrower) {
    await logActivity(
      borrower.application_id,
      'borrower_removed',
      `${borrower.borrower_type === 'primary' ? 'Primary borrower' : 'Co-borrower'} removed: ${borrower.full_name}`,
      { borrower_id: id }
    );
  }
}

/**
 * Get primary borrower for an application
 */
export async function getPrimaryBorrower(applicationId: string): Promise<Borrower | null> {
  const borrowers = await getBorrowersByApplicationId(applicationId);
  return borrowers.find(b => b.borrower_type === 'primary') || null;
}

/**
 * Get all co-borrowers for an application
 */
export async function getCoBorrowers(applicationId: string): Promise<Borrower[]> {
  const borrowers = await getBorrowersByApplicationId(applicationId);
  return borrowers.filter(b => b.borrower_type === 'co_borrower');
}

/**
 * Calculate total household income for an application
 */
export async function getTotalHouseholdIncome(applicationId: string): Promise<number> {
  const borrowers = await getBorrowersByApplicationId(applicationId);
  return borrowers.reduce((total, borrower) => {
    return total + (borrower.annual_income || 0);
  }, 0);
}
