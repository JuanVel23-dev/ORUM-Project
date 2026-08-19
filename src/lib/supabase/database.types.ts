/**
 * Tipos de la base de datos de ORUM (esquema `public`).
 *
 * Por ahora solo se tipan las tablas que usa el Portal Administrativo en esta
 * fase (autenticación + gestión de usuarios). En fases siguientes se irán
 * agregando el resto (membresias, ventas, promociones, etc.), o se pueden
 * regenerar con:  `supabase gen types typescript --project-id <ID>`.
 *
 * Referencia: ver `docs/referencia/Esquema_BD.txt`.
 */

/** Códigos de rol tal como están en la tabla `roles`. */
export type RolCodigo = 'super_admin' | 'empleado' | 'comercio' | 'miembro'

/** Códigos de tipo_beneficio tal como están en la tabla `tipos_beneficio`. */
export type TipoBeneficioCodigo = 'porcentaje' | 'dos_por_uno' | 'monto_fijo' | 'regalo'

/** Valores del enum `metodo_registro_venta`. */
export type MetodoRegistroVenta = 'qr' | 'numero'

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
        /*
          Este fichero se mantiene a mano y hasta ahora dejaba `Relationships`
          vacío en todas las tablas. El cliente de Supabase usa esa lista para
          tipar los embebidos: sin ella, un `select('… , planes_membresia(nombre)')`
          no compila —devuelve `SelectQueryError<"could not find the relation">`—
          aunque la clave foránea exista de verdad en la base.

          Se declara la que se usa. Si más adelante se embebe otra relación,
          hay que añadirla aquí igual (o regenerar el fichero con la CLI de
          Supabase, que ya está en devDependencies).
        */
        Relationships: [
          {
            foreignKeyName: 'membresias_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'planes_membresia'
            referencedColumns: ['id']
          },
        ]
      }
      sucursales: {
        Row: {
          id: number
          comercio_id: number
          ciudad_id: number
          nombre: string | null
          direccion: string | null
          telefono: string | null
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          comercio_id: number
          ciudad_id: number
          nombre?: string | null
          direccion?: string | null
          telefono?: string | null
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['sucursales']['Insert']>
        Relationships: []
      }
      tipos_beneficio: {
        Row: {
          id: number
          codigo: TipoBeneficioCodigo
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          codigo: TipoBeneficioCodigo
          nombre: string
          descripcion?: string | null
        }
        Update: Partial<Database['public']['Tables']['tipos_beneficio']['Insert']>
        Relationships: []
      }
      promociones: {
        Row: {
          id: number
          comercio_id: number
          tipo_beneficio_id: number
          titulo: string
          descripcion: string | null
          valor: number | null
          fecha_inicio: string | null
          fecha_fin: string | null
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          comercio_id: number
          tipo_beneficio_id: number
          titulo: string
          descripcion?: string | null
          valor?: number | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['promociones']['Insert']>
        Relationships: []
      }
      bitacora_actividad: {
        Row: {
          id: number
          actor_id: string | null
          accion: string
          entidad: string
          entidad_id: number | null
          datos_anteriores: Record<string, unknown> | null
          datos_nuevos: Record<string, unknown> | null
          fecha_hora: Timestamp
        }
        Insert: {
          id?: number
          actor_id?: string | null
          accion: string
          entidad: string
          entidad_id?: number | null
          datos_anteriores?: Record<string, unknown> | null
          datos_nuevos?: Record<string, unknown> | null
          fecha_hora?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['bitacora_actividad']['Insert']>
        Relationships: []
      }
      ventas: {
        Row: {
          id: number
          miembro_id: number
          membresia_id: number | null
          sucursal_id: number
          promocion_id: number | null
          valor_compra: number
          valor_descuento: number
          valor_final: number
          metodo_registro: MetodoRegistroVenta
          registrada_por_perfil: string | null
          fecha_hora: Timestamp
          created_at: Timestamp
        }
        Insert: {
          id?: number
          miembro_id: number
          membresia_id?: number | null
          sucursal_id: number
          promocion_id?: number | null
          valor_compra: number
          valor_descuento?: number
          valor_final: number
          metodo_registro: MetodoRegistroVenta
          registrada_por_perfil?: string | null
          fecha_hora?: Timestamp
          created_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['ventas']['Insert']>
        Relationships: []
      }
      configuracion: {
        Row: {
          id: number
          clave: string
          valor: string | null
          descripcion: string | null
          updated_at: Timestamp
        }
        Insert: {
          id?: number
          clave: string
          valor?: string | null
          descripcion?: string | null
          updated_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['configuracion']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      buscar_miembro_comercio: {
        Args: { p_numero: string }
        Returns: {
          miembro_id: number
          nombres: string
          apellidos: string
          numero_membresia: string
          vigente: boolean
          membresia_id: number | null
          plan_nombre: string | null
        }[]
      }
    }
    Enums: {
      tipo_membresia: 'nueva' | 'renovada'
      estado_membresia: 'activa' | 'vencida' | 'cancelada' | 'suspendida'
    }
  }
}

/** Atajo para una fila de una tabla: `Row<'empleados'>`. */
export type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
