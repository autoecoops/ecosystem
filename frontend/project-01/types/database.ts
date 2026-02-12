export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          language: string;
          files: Record<string, string>;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          language: string;
          files?: Record<string, string>;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          language?: string;
          files?: Record<string, string>;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}