import { supabase } from './client';
import type { Broker, BrokerInsert, BrokerUpdate } from '../types/database';

/**
 * Get the currently authenticated broker
 */
export async function getCurrentBroker(): Promise<Broker | null> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting current user:', userError);
    return null;
  }

  // Get broker data
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching current broker:', error);
    return null;
  }

  return data;
}

/**
 * Get a broker by ID
 */
export async function getBrokerById(id: string): Promise<Broker | null> {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching broker:', error);
    return null;
  }

  return data;
}

/**
 * Update current broker profile
 */
export async function updateCurrentBroker(updates: BrokerUpdate): Promise<Broker> {
  const currentBroker = await getCurrentBroker();
  
  if (!currentBroker) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('brokers')
    .update(updates)
    .eq('id', currentBroker.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating broker:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new broker (used during signup)
 */
export async function createBroker(broker: BrokerInsert): Promise<Broker> {
  const { data, error } = await supabase
    .from('brokers')
    .insert(broker)
    .select()
    .single();

  if (error) {
    console.error('Error creating broker:', error);
    throw error;
  }

  return data;
}

/**
 * Get all brokers (admin only)
 */
export async function getAllBrokers(): Promise<Broker[]> {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brokers:', error);
    throw error;
  }

  return data || [];
}
