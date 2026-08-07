export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string;
          id: string;
          listing_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          listing_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          listing_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_listing_fkey2";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      food_requests: {
        Row: {
          charity_id: string;
          created_at: string;
          hotel_id: string;
          id: string;
          listing_id: string;
          message: string | null;
          payment_method: string;
          caisse_status?: string | null;
          status: Database["public"]["Enums"]["request_status"];
          updated_at: string;
        };
        Insert: {
          charity_id: string;
          created_at?: string;
          hotel_id: string;
          id?: string;
          listing_id: string;
          message?: string | null;
          payment_method?: string;
          caisse_status?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Update: {
          charity_id?: string;
          created_at?: string;
          hotel_id?: string;
          id?: string;
          listing_id?: string;
          message?: string | null;
          payment_method?: string;
          caisse_status?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_requests_charity_profile_fkey";
            columns: ["charity_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_requests_hotel_profile_fkey";
            columns: ["hotel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_requests_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          address: string | null;
          category?: string | null;
          created_at: string;
          description: string | null;
          expires_at: string;
          hotel_id: string;
          id: string;
          lat: number | null;
          lng: number | null;
          meals_count: number;
          notes: string | null;
          photo_url: string | null;
          pickup_from: string;
          pickup_to: string;
          quantity_kg: number | null;
          status: Database["public"]["Enums"]["listing_status"];
          title: string;
          updated_at: string;
          wilaya: string | null;
        };
        Insert: {
          address?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string;
          hotel_id: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          meals_count?: number;
          notes?: string | null;
          photo_url?: string | null;
          pickup_from?: string;
          pickup_to?: string;
          quantity_kg?: number | null;
          status?: Database["public"]["Enums"]["listing_status"];
          title: string;
          updated_at?: string;
          wilaya?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string;
          hotel_id?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          meals_count?: number;
          notes?: string | null;
          photo_url?: string | null;
          pickup_from?: string;
          pickup_to?: string;
          quantity_kg?: number | null;
          status?: Database["public"]["Enums"]["listing_status"];
          title?: string;
          updated_at?: string;
          wilaya?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listings_hotel_profile_fkey";
            columns: ["hotel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          kind: string;
          link: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          link?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          link?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string;
          id: string;
          is_suspended: boolean;
          is_verified: boolean;
          lat: number | null;
          lng: number | null;
          org_name: string;
          phone: string | null;
          updated_at: string;
          wilaya: string | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          is_suspended?: boolean;
          is_verified?: boolean;
          lat?: number | null;
          lng?: number | null;
          org_name?: string;
          phone?: string | null;
          updated_at?: string;
          wilaya?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_suspended?: boolean;
          is_verified?: boolean;
          lat?: number | null;
          lng?: number | null;
          org_name?: string;
          phone?: string | null;
          updated_at?: string;
          wilaya?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "hotel" | "charity" | "admin";
      food_category: "cooked" | "bakery" | "produce" | "dairy" | "packaged" | "beverages" | "other";
      listing_status: "available" | "reserved" | "collected" | "expired";
      request_status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["hotel", "charity", "admin"],
      food_category: ["cooked", "bakery", "produce", "dairy", "packaged", "beverages", "other"],
      listing_status: ["available", "reserved", "collected", "expired"],
      request_status: ["pending", "accepted", "rejected", "completed", "cancelled"],
    },
  },
} as const;
