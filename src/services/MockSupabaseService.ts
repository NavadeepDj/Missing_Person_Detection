// Mock Supabase service to bypass CORS issues
export class MockSupabaseService {
  private static instance: MockSupabaseService;
  private embeddings: any[] = [];
  private nextId: number = 1;

  private constructor() {
    // Load any existing data from localStorage
    const existing = localStorage.getItem('tracevision_mock_embeddings');
    if (existing) {
      this.embeddings = JSON.parse(existing);
      this.nextId = this.embeddings.length + 1;
    }
  }

  static getInstance(): MockSupabaseService {
    if (!MockSupabaseService.instance) {
      MockSupabaseService.instance = new MockSupabaseService();
    }
    return MockSupabaseService.instance;
  }

  async insert(table: string, data: any, options?: { select?: string }) {
    console.log('🗄️ Mock Supabase insert:', { table, data, options });

    const record = {
      id: this.nextId++,
      ...data,
      created_at: new Date().toISOString()
    };

    this.embeddings.push(record);

    // Save to localStorage for persistence
    localStorage.setItem('tracevision_mock_embeddings', JSON.stringify(this.embeddings));

    console.log('✅ Mock record created:', record);

    if (options?.select) {
      return { data: [record], error: null };
    }

    return { data: record, error: null };
  }

  async select(table: string, columns?: string, options?: { count?: boolean; head?: boolean; order?: any }) {
    console.log('📋 Mock Supabase select:', { table, columns, options });

    let result = [...this.embeddings];

    // Apply ordering if specified
    if (options?.order && options.order.length > 0) {
      const [column, direction] = options.order[0];
      result.sort((a, b) => {
        const aVal = this.getNestedValue(a, column);
        const bVal = this.getNestedValue(b, column);
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    // Apply limit if specified
    if (options?.head) {
      result = result.slice(0, 1);
    }

    if (options?.count !== undefined) {
      return { count: result.length, error: null };
    }

    console.log('✅ Mock select result:', result);
    return { data: result, error: null };
  }

  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async clear() {
    this.embeddings = [];
    this.nextId = 1;
    localStorage.removeItem('tracevision_mock_embeddings');
    console.log('🗑️ Mock database cleared');
  }
}