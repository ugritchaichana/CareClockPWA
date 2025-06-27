export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      medicine: {
        Row: {
          afternoon: boolean | null
          beforeBed: boolean | null
          consumptionType: string
          createdAt: string | null
          currentStock: number
          dosage: number
          evening: boolean | null
          id: number
          isActive: boolean | null
          medicineDetails: string | null
          medicineImageUrl: string | null
          medicineName: string
          morning: boolean | null
          patientId: number
          quantity: number
          updatedAt: string | null
        }
        Insert: {
          afternoon?: boolean | null
          beforeBed?: boolean | null
          consumptionType: string
          createdAt?: string | null
          currentStock?: number
          dosage: number
          evening?: boolean | null
          id?: number
          isActive?: boolean | null
          medicineDetails?: string | null
          medicineImageUrl?: string | null
          medicineName: string
          morning?: boolean | null
          patientId: number
          quantity: number
          updatedAt?: string | null
        }
        Update: {
          afternoon?: boolean | null
          beforeBed?: boolean | null
          consumptionType?: string
          createdAt?: string | null
          currentStock?: number
          dosage?: number
          evening?: boolean | null
          id?: number
          isActive?: boolean | null
          medicineDetails?: string | null
          medicineImageUrl?: string | null
          medicineName?: string
          morning?: boolean | null
          patientId?: number
          quantity?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_patientid_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_consumption: {
        Row: {
          consumedAt: string | null
          createdAt: string | null
          dosageTaken: number | null
          id: number
          medicineId: number
          notes: string | null
          notificationId: number | null
          patientId: number
          scheduledAt: string
          status: string | null
          updatedAt: string | null
        }
        Insert: {
          consumedAt?: string | null
          createdAt?: string | null
          dosageTaken?: number | null
          id?: number
          medicineId: number
          notes?: string | null
          notificationId?: number | null
          patientId: number
          scheduledAt: string
          status?: string | null
          updatedAt?: string | null
        }
        Update: {
          consumedAt?: string | null
          createdAt?: string | null
          dosageTaken?: number | null
          id?: number
          medicineId?: number
          notes?: string | null
          notificationId?: number | null
          patientId?: number
          scheduledAt?: string
          status?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_consumption_medicineid_fkey"
            columns: ["medicineId"]
            isOneToOne: false
            referencedRelation: "medicine"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_consumption_notificationid_fkey"
            columns: ["notificationId"]
            isOneToOne: false
            referencedRelation: "medicine_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_consumption_patientid_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_notifications: {
        Row: {
          createdAt: string | null
          group_id: string | null
          id: number
          isActive: boolean | null
          medicineId: number
          message: string | null
          patientId: number
          scheduledTime: string
          timeType: string
          title: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          group_id?: string | null
          id?: number
          isActive?: boolean | null
          medicineId: number
          message?: string | null
          patientId: number
          scheduledTime: string
          timeType: string
          title: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          group_id?: string | null
          id?: number
          isActive?: boolean | null
          medicineId?: number
          message?: string | null
          patientId?: number
          scheduledTime?: string
          timeType?: string
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_notifications_medicineid_fkey"
            columns: ["medicineId"]
            isOneToOne: false
            referencedRelation: "medicine"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_notifications_patientid_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number
          chronicDiseases: string | null
          createdAt: string | null
          drugAllergy: string | null
          firstName: string
          id: number
          lastName: string
          medicalRight: string | null
          phoneNumber: string
          prefix: string
          profileImageUrl: string | null
          registeredAt: string | null
          updatedAt: string | null
        }
        Insert: {
          age: number
          chronicDiseases?: string | null
          createdAt?: string | null
          drugAllergy?: string | null
          firstName: string
          id?: number
          lastName: string
          medicalRight?: string | null
          phoneNumber: string
          prefix: string
          profileImageUrl?: string | null
          registeredAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          age?: number
          chronicDiseases?: string | null
          createdAt?: string | null
          drugAllergy?: string | null
          firstName?: string
          id?: number
          lastName?: string
          medicalRight?: string | null
          phoneNumber?: string
          prefix?: string
          profileImageUrl?: string | null
          registeredAt?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          createdAt: string | null
          description: string | null
          doctorName: string | null
          filePath: string
          fileSize: number | null
          fileType: string | null
          hospitalName: string | null
          id: number
          imageUrl: string
          isActive: boolean | null
          patientId: number
          prescriptionDate: string | null
          title: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          doctorName?: string | null
          filePath: string
          fileSize?: number | null
          fileType?: string | null
          hospitalName?: string | null
          id?: number
          imageUrl: string
          isActive?: boolean | null
          patientId: number
          prescriptionDate?: string | null
          title: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          doctorName?: string | null
          filePath?: string
          fileSize?: number | null
          fileType?: string | null
          hospitalName?: string | null
          id?: number
          imageUrl?: string
          isActive?: boolean | null
          patientId?: number
          prescriptionDate?: string | null
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patientid_fkey"
            columns: ["patientId"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
