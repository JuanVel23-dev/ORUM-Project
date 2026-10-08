# Auditoría de seguridad — estado y pendientes (sesión del 07/10/2026)

Continuación de [`auditoria-seguridad-2026-10-05.md`](./auditoria-seguridad-2026-10-05.md).
Aquel informe sigue describiendo el punto de partida; **este documento dice qué
se cerró, qué se verificó, qué no, y qué falta**. Si ambos se contradicen, vale
este.

---

## 1. Qué se cerró

| # | Hallazgo | Estado | Dónde |
|---|---|---|---|
| 1 | Next.js 16.2.11 con avisos críticos (A06/A08) | ✅ Cerrado. `pnpm audit --prod`: de 3 críticas / 7 altas / 3 moderadas a **0**. Se subió a **16.3.8**, no a 16.3.6 como decía el informe, porque aparecieron avisos nuevos (SSRF en la optimización de imágenes, envenenamiento de caché) corregidos solo desde esa versión. | PR #4 (en `main`) |
| 2 | Un comercio podía reactivarse a sí mismo (A01) | ✅ Cerrado en producción. Reproducido antes de arreglar. Era más amplio que lo descrito: podía cambiar `activo`, `deleted_at`, `indexable`, `nombre`, `marca_id` y `categoria_id`. | Migración local `…_comercios_sin_escritura_directa` |
| 3 | Contraseñas filtradas (A07) | ✅ Ya estaba activo en Supabase | — |
| 4 | Sin CSP real (A05) | ⏳ **Pendiente** (ver §3) | — |
| — | Privilegios de más (`TRUNCATE`, `TRIGGER`, `REFERENCES`) a `anon` y `authenticated` | ✅ Cerrado, incluidos los privilegios por defecto de tablas futuras. Probado con y sin la revocación como anónimo, socio, comercio y admin: resultados idénticos. | Migración local `…_quitar_privilegios_sobrantes` |
| — | Revisión de las 50 server actions | ✅ Sin vulnerabilidades reales. Todas tienen guardia propio o son públicas a propósito con Turnstile, límite de uso y respuesta uniforme. `alternarFavorito` usa el `miembro_id` de la sesión. | — |
| — | 42 acciones devolvían `error.message` de la base al usuario | ✅ Nuevo `mensajeDeError()`: el detalle va al log, el usuario ve una frase. Se conservan los mensajes propios de la base (`P0001`, `fn_validar_venta`). | PR #5 (en `main`) |
| — | Recuperación de contraseña de comercios sin `try/catch` en `after()` | ✅ Cerrado | PR #5 |
| — | Cambiar contraseña no pedía la actual | ✅ Ahora la pide; comparte los contadores del login; una contraseña filtrada se rechaza con mensaje claro | PR #5 |
| — | Bitácora: 90 % de los eventos sin actor; tablas sensibles sin auditar; escribible por `authenticated` | ✅ Cerrado: columna `updated_by` + triggers, más cobertura de `perfiles`, `empleados`, `sucursales`, `planes_membresia`, `anuncios`; bitácora solo-añadir | Rama `claude/bitacora-actor` + 2 migraciones locales |

### Las cuatro migraciones (todas aplicadas en producción, **ninguna está en el repo**)

Decisión del propietario: se dejan solo en local. Archivos en `supabase/migrations/`
sin seguimiento de git:

| Archivo local | Versión registrada en Supabase |
|---|---|
| `20261007130000_comercios_sin_escritura_directa.sql` | `20261008002943` |
| `20261007140000_quitar_privilegios_sobrantes.sql` | `20261008033326` |
| `20261008120000_bitacora_solo_anadir.sql` | `20261008041224` |
| `20261008130000_bitacora_actor_y_cobertura.sql` | `20261008041233` |

Las versiones no coinciden con los nombres de archivo (ya pasaba con las
migraciones anteriores, p. ej. `20261001150000` en el repo y `20261001013049` en
Supabase). No es un fallo, pero **no uses `supabase db push` sin reconciliarlas**.

---

## 2. Qué toca revisar

### Antes de dar por cerrada la rama `claude/bitacora-actor`
- [ ] **Abrir el PR y mirar la vista previa de Vercel.** No hay `gh` en esta
      máquina (`winget install GitHub.cli` y `gh auth login` si se quiere).
- [ ] **Decidir qué hacer con las migraciones.** El código de esta rama escribe
      `updated_by`; esa columna **solo existe en la base de producción**. Si
      alguien reconstruye la base desde `supabase/migrations/` (otro entorno,
      un clon, una base de pruebas), todas las escrituras del panel sobre esas
      9 tablas fallarán con «column updated_by does not exist». Mientras la base
      de producción sea la única, no pasa nada; es un riesgo a conocer, no un fallo.

### Verificado solo en parte
- [ ] **Una venta real de punta a punta.** El sistema bloqueó probarla (aunque
      se deshiciera) y no se forzó. La operación solo usa `INSERT` sobre `ventas`,
      que ninguna migración cambió. Prueba sugerida: una venta de $1.000 desde el
      portal local con el comercio de prueba y anularla después.
- [ ] **Cambio de contraseña exitoso.** Se probaron la actual incorrecta y la
      actual correcta con una contraseña filtrada (rechazada por Supabase). No se
      llegó a guardar una nueva, para no tocar la cuenta de prueba.
- [ ] **Mensajes de error del punto de `mensajeDeError`** con un fallo real de
      la base: está probado como función, no provocando el error en pantalla.
- [ ] **Transiciones de elemento compartido** (rejilla ↔ ficha) tras quitar
      `experimental.viewTransition`: el navegador de la máquina de desarrollo no
      las pinta. Mirar en uno normal.
- [ ] **Móvil real** y la vista previa de Vercel con una sesión de socio,
      comercio y admin.

### Limpieza local
- [ ] **Rastro de las pruebas en producción.** Evento `bitacora_actividad` nº
      275 (guardado sin cambios de La Casa de Alana, comercio 17); la secuencia
      de la bitácora salta de 262 a 275 porque las transacciones de prueba
      deshechas consumieron números. Es inofensivo.
- [ ] **Cuentas de prueba con privilegios reales.** `Usuarios Pruebas PlayWright.txt`
      tiene una cuenta **«Administrador mayor»** en la base de producción, con
      contraseña en claro en ese archivo (está en `.gitignore`). Sus credenciales
      pasaron por esta conversación. Considera cambiarlas, o desactivar esa cuenta
      cuando no se use.
- [ ] **Worktrees y ramas locales** que ya no hacen falta: `claude/next-16-3-8` y
      `claude/errores-y-password-actual` (fusionadas); carpetas en
      `C:\dev\orum-worktrees\` (`next-16-3-8`, `errores-y-password`, y la de esta
      rama cuando se fusione). Git no pudo borrar los metadatos de siete worktrees
      viejos en `.git/worktrees/` (`Permission denied`, OneDrive): se borran a mano
      desde el Explorador.
- [ ] **Documentación desactualizada:** `CLAUDE.md` («Deuda conocida» 1) y los
      comentarios de `transiciones-ruta.tsx` y `transiciones.ts` aún hablan de
      `experimental.viewTransition`, que ya no existe. Y
      `auditoria-seguridad-2026-10-05.md` conserva los estados de entonces.

---

## 3. Qué queda pendiente (sin empezar)

| Prioridad | Qué | Detalle |
|---|---|---|
| Media | **Pantalla de la bitácora** | `/admin/bitacora` filtra `entidad = 'miembro'` (`page.tsx`, línea ~161): **solo muestra eventos de miembros**. Los de comercios, promociones, planes, perfiles, empleados, sucursales y anuncios ya se guardan con actor, pero hoy solo se consultan en Supabase. Hace falta una vista con filtro por entidad y actor (y etiquetas legibles: la acción del trigger es `editar`/`crear`/`eliminar`, la de la app `edicion`/`alta`). |
| Media | **Un comercio retirado aún puede cambiar sus imágenes** | `miComercio()` (`comercios/(portal)/imagenes-actions.ts`) filtra `deleted_at` pero no `activo`, así que «Retirar del club» no le quita ese acceso. Es el mismo hueco que se cerró para las ventas en el PR #3. Riesgo bajo: un comercio inactivo no sale en público. Corrección: exigir `activo` ahí. |
| Baja | **CSP completa (hallazgo 4)** | Hoy solo `frame-ancestors 'none'`. Necesita nonces y probarse desplegada. Los 3 `dangerouslySetInnerHTML` inyectan JSON-LD o el script del tema, no entrada de usuario. |
| Baja | **Retención y alertas de la bitácora (A09/D)** | Sin política de retención. Guarda filas completas con cédula, teléfono y dirección (también de miembros eliminados). Nadie recibe alertas por ráfagas de accesos fallidos ni por topes de `limite_uso`. Los logs de acceso de Supabase tienen retención corta según el plan (no verificado cuál es). **Decisión del propietario.** |
| Baja | **`repomix-output.xml`** | Comprobar que no esté en git ni contenga secretos. Descartado por ahora a petición del propietario. |
| Baja | **Privilegio `MAINTAIN`** | `anon` y `authenticated` lo conservan (VACUUM/ANALYZE/REINDEX). No expuesto por la API. No estaba en el alcance de la revocación. |
| Baja | **Privilegios por defecto de `supabase_admin`** | Tiene los suyos en `public` y no se pudieron cambiar desde aquí. Las migraciones corren como `postgres`, así que no afecta a lo que se crea con este proyecto. |
| Baja | **Bitácora: bajas sin actor** | Un `DELETE` hecho sin sesión no trae datos, así que no hay a quién atribuirlo. La app casi no borra (solo al deshacer un alta a medias). |
| Baja | **Tablas sin auditar a propósito** | `numeros_registro` (cargas masivas: ruido), `configuracion`, `recursos_sitio`. |
| Baja | **Eventos duplicados de miembros** | Ahora hay una fila del trigger y otra de `registrarActividad`, las dos con actor. Redundante, no dañino. Se puede quitar la de la app cuando la pantalla de la bitácora lea las del trigger. |
| Baja | **Cambiar un comercio desde su sesión** | Tras la migración del hallazgo 2, un comercio no puede escribir en `comercios` (ni siquiera `descripcion`). Si algún día debe editar algo, va por una server action con `service_role`, como las imágenes. La política `comercios_admin` (`ALL`) queda inerte. |

---

## 4. Cómo funciona lo que se añadió (para quien lo mantenga)

**Actor en la bitácora.** Casi todas las escrituras del panel van con
`service_role`, donde `auth.uid()` es nulo, así que el trigger no sabía quién
actuaba. Ahora:

1. La acción del servidor declara `updated_by: <uid>` junto al cambio.
2. Un trigger `BEFORE` (`fn_capturar_actor`) copia ese valor a una variable
   **local de la transacción** (`orum.actor`) y **vacía la columna**.
3. El trigger `AFTER` (`fn_auditar`) toma el actor en este orden: `auth.uid()`
   (sesión), `orum.actor`, y para ventas `registrada_por_perfil`.

Consecuencias de diseño: una escritura que **olvide** declarar el actor sale como
«desconocido» y nunca atribuida a quien editó antes; con sesión de usuario manda
siempre el uid real, así que no se puede falsear desde la API.

**Si añades una escritura nueva sobre una tabla auditada**, declara `updated_by`.
La prueba `src/lib/bitacora/actor-en-escrituras.test.ts` falla, con archivo y
línea, si se olvida. Si añades una tabla a la auditoría, añádela también a la
lista `TABLAS_AUDITADAS` de esa prueba.

**Errores de la base al usuario.** Usa `mensajeDeError(prefijo, error, sufijo?)`
de `src/lib/shared/errores.ts`; nunca `${error.message}` en una plantilla.
