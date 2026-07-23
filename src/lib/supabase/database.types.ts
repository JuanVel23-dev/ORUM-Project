/**
 * Tipos de la base de datos de ORUM (esquema `public`).
 *
 * Por ahora solo se tipan las tablas que usa el Portal Administrativo en esta
 * fase (autenticación + gestión de usuarios). En fases siguientes se irán
 * agregando el resto (membresias, ventas, promociones, etc.), o se pueden
 * regenerar con:  `supabase gen types typescript --project-id <ID>`.
 *
 * Referencia: ver `Esquema_BD.txt` en la raíz del proyecto.
 */

/** Códigos de rol tal como están en la tabla `roles`. */
export type RolCodigo = 'super_admin' | 'empleado' | 'comercio' | 'miembro'

/** Valores del enum `tipo_membresia`. */
export type TipoMembresia = 'nueva' | 'renovada'
/** Valores del enum `estado_membresia`. */
export type EstadoMembresia = 'activa' | 'vencida' | 'cancelada' | 'suspendida'

type Timestamp = string // timestamptz llega como ISO string

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number
          codigo: RolCodigo
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          codigo: RolCodigo
          nombre: string
          descripcion?: string | null
        }
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
        Relationships: []
      }
      perfiles: {
        Row: {
          id: string // uuid = auth.users.id
          rol_id: number
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id: string
          rol_id: number
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['perfiles']['Insert']>
        Relationships: []
      }
      empleados: {
        Row: {
          id: number
          perfil_id: string | null
          nombres: string
          apellidos: string
          cedula: string | null
          telefono: string | null
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          perfil_id?: string | null
          nombres: string
          apellidos: string
          cedula?: string | null
          telefono?: string | null
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['empleados']['Insert']>
        Relationships: []
      }
      comercios: {
        Row: {
          id: number
          perfil_id: string | null
          marca_id: number | null
          categoria_id: number | null
          nombre: string
          descripcion: string | null
          logo_url: string | null
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          perfil_id?: string | null
          marca_id?: number | null
          categoria_id?: number | null
          nombre: string
          descripcion?: string | null
          logo_url?: string | null
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['comercios']['Insert']>
        Relationships: []
      }
      marcas: {
        Row: {
          id: number
          nombre: string
          logo_url: string | null
        }
        Insert: {
          id?: number
          nombre: string
          logo_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['marcas']['Insert']>
        Relationships: []
      }
      categorias: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: Partial<Database['public']['Tables']['categorias']['Insert']>
        Relationships: []
      }
      ciudades: {
        Row: {
          id: number
          nombre: string
          departamento: string | null
        }
        Insert: {
          id?: number
          nombre: string
          departamento?: string | null
        }
        Update: Partial<Database['public']['Tables']['ciudades']['Insert']>
        Relationships: []
      }
      planes_membresia: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          precio: number
          duracion_meses: number
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
          precio: number
          duracion_meses?: number
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['planes_membresia']['Insert']>
        Relationships: []
      }
      miembros: {
        Row: {
          id: number
          perfil_id: string | null
          codigo_publico: string
          numero_membresia: string
          nombres: string
          apellidos: string
          cedula: string
          telefono: string | null
          direccion: string | null
          ciudad_id: number | null
          registrado_por: number | null
          fecha_registro: Timestamp
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          perfil_id?: string | null
          codigo_publico?: string
          numero_membresia: string
          nombres: string
          apellidos: string
          cedula: string
          telefono?: string | null
          direccion?: string | null
          ciudad_id?: number | null
          registrado_por?: number | null
          fecha_registro?: Timestamp
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['miembros']['Insert']>
        Relationships: []
      }
      membresias: {
        Row: {
          id: number
          miembro_id: number
          plan_id: number
          tipo: Database['public']['Enums']['tipo_membresia']
          estado: Database['public']['Enums']['estado_membresia']
          fecha_inicio: string
          fecha_fin: string
          precio_pagado: number
          comprobante_url: string | null
          vendido_por: number | null
          membresia_anterior_id: number | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id?: number
          miembro_id: number
          plan_id: number
          tipo: Database['public']['Enums']['tipo_membresia']
          estado?: Database['public']['Enums']['estado_membresia']
          fecha_inicio: string
          fecha_fin: string
          precio_pagado: number
          comprobante_url?: string | null
          vendido_por?: number | null
          membresia_anterior_id?: number | null
          created_at?: Timestamp
          updated_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['membresias']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tipo_membresia: 'nueva' | 'renovada'
      estado_membresia: 'activa' | 'vencida' | 'cancelada' | 'suspendida'
    }
  }
}

/** Atajo para una fila de una tabla: `Row<'empleados'>`. */
export type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
