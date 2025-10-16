// Utility to test Supabase connection and CORS configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class SupabaseTest {
  static async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Testing Supabase connection...');
      console.log('📍 URL:', supabaseUrl);
      console.log('🔑 Key:', supabaseAnonKey ? 'Present' : 'Missing');

      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          success: false,
          error: 'Missing Supabase environment variables'
        };
      }

      // Create client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase client created');

      // Test basic connection - try to connect to the case_details table
      console.log('📋 Testing database access...');
      const { data, error, status } = await supabase
        .from('case_details')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Database error:', error);
        return {
          success: false,
          error: error.message,
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            status
          }
        };
      }

      console.log('✅ Database connection successful!');
      return {
        success: true,
        details: {
          status,
          hasData: data && data.length > 0,
          dataLength: data?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  }

  static async testTableStructure(): Promise<{ success: boolean; error?: string; columns?: any[] }> {
    try {
      console.log('🏗️ Testing table structure...');

      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

      // Try to get table info - this will fail if table doesn't exist or no permissions
      const { data, error } = await supabase
        .from('case_details')
        .select('*')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        return {
          success: true,
          columns
        };
      } else {
        return {
          success: true,
          columns: [] // Table exists but is empty
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}