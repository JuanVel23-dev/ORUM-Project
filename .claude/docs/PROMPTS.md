# Prompts de ejecución

Copia y pega en Claude Code, **en orden**. Espera a que cada fase termine y revísala
antes de lanzar la siguiente.

> **Por qué por fases y no un solo prompt:** un único "audita y mejora todo el
> proyecto" produce un diff de cientos de archivos que nadie puede revisar, mezcla
> hallazgos críticos con cambios cosméticos, y si algo se rompe no sabes cuál de los
> 200 cambios lo rompió. Las fases existen para que puedas hacer commit y volver atrás.

---

## ANTES DE TODO — Declarar la frontera

**Obligatorio si tu proyecto tiene backend que los agentes no deben tocar.**

Abre `.claude/docs/SCOPE.md` y rellena a mano las tres zonas: trabajo, solo lectura y
prohibida. Es el único mecanismo que impide que `frontend-implementer` edite tu
backend — los agentes no pueden inferir esa frontera.

Decide también el caso de las Server Actions y Route Handlers (sección 5 del archivo):
en Next.js son código de servidor viviendo dentro del proyecto de frontend, y sin una
decisión explícita quedan en tierra de nadie.

Si prefieres que lo redacte un agente y tú lo revisas:

```
Lee la estructura de directorios de este proyecto y propón el contenido de
.claude/docs/SCOPE.md: qué rutas son zona de trabajo de frontend, cuáles son
backend de solo lectura y cuáles no deben leerse.

Propón también qué hacer con las Server Actions y Route Handlers.

NO edites nada todavía: dame la propuesta para que yo la revise.
```

Verifica el resultado línea a línea antes de aprobarlo. Es el archivo que más caro
sale equivocar.

---

## FASE 0 — Contexto base (una sola vez)

### 0.1 · Verificación de instalación

```
Lista los agentes disponibles en .claude/agents/ y confirma que hay 17.
Luego lee .claude/docs/WORKFLOW.md y resúmeme en 5 líneas las reglas de trabajo del equipo.
```

### 0.2 · Análisis del repositorio

```
Usa el agente codebase-analyst.

Analiza este proyecto Next.js completo y genera .claude/docs/ARCHITECTURE.md
siguiendo la estructura definida en tu system prompt.

Cuenta ocurrencias reales con Grep en vez de estimar. Donde encuentres dos formas
de hacer lo mismo, documenta ambas e indica cuál domina.
```

**Revisa el resultado antes de seguir.** Si las convenciones detectadas no coinciden
con la realidad, corrígelas a mano: todos los demás agentes se apoyan en este archivo.

### 0.2b · Inventario del contrato de API

Solo si tienes backend maduro. Determina qué puede proponer el diseño.

```
Usa el agente codebase-analyst.

Genera .claude/docs/API-CONTRACT.md: inventaría la superficie de datos que el
frontend consume hoy — endpoints y Server Actions, formas de las respuestas,
estados de error, paginación y filtros disponibles.

Presta especial atención a dos secciones: las capacidades que la API NO ofrece
(y que el frontend querría), y los datos que llegan pero no se usan.

Trata el backend como contrato externo: inventarías su superficie, no su
implementación interna.
```

### 0.3 · Sistema de diseño

```
Usa el agente design-system-architect en modo DEFINIR.

Extrae los tokens reales del proyecto (tailwind.config, variables CSS, tema existente)
y regenera .claude/docs/DESIGN_RULES.md con ellos.

No inventes valores nuevos: parte de lo que ya existe en el código. Donde detectes
inconsistencias, documenta el valor dominante como token y anota las divergencias
como deuda. Anota el ratio de contraste de cada par texto/fondo.
```

---

## FASE 1 — Diagnóstico completo (solo lectura, sin tocar código)

El objetivo de esta fase es **saber qué tiene el proyecto**, no arreglarlo. No se
modifica ni una línea.

### 1.1 · Auditoría en paralelo

```
Vamos a hacer una auditoría completa del proyecto. Esta fase es SOLO LECTURA:
ningún agente modifica código.

Lanza en paralelo estos seis agentes sobre el código de la aplicación:

- security-auditor
- performance-engineer
- accessibility-auditor
- code-reviewer
- mobile-ux-specialist
- design-system-architect (modo AUDITAR)

Cada uno debe entregar su reporte con el formato de su system prompt: severidad,
ubicación archivo:línea, impacto y corrección concreta.

Guarda cada reporte en .claude/audit/[nombre-agente].md
```

> Si tu proyecto tiene tráfico iOS relevante o es una PWA, añade también
> `apple-hig-specialist` a esa lista.

### 1.2 · Consolidación y priorización

```
Usa el agente tech-lead.

Lee todos los reportes en .claude/audit/ y consolida un plan de mejora en
.claude/audit/PLAN-MEJORA.md.

Requisitos:
1. Deduplica: si varios auditores reportaron el mismo problema desde ángulos
   distintos, fúndelo en un solo ítem indicando qué auditores lo detectaron.
2. Ordena por (impacto × riesgo de no hacerlo) ÷ coste, no por severidad a secas.
3. Agrupa en lotes de trabajo INDEPENDIENTES, cada uno con un diff revisable
   (orientativo: menos de 15 archivos por lote).
4. Marca qué lotes se pueden hacer en paralelo sin conflicto de archivos.
5. Declara explícitamente qué NO vas a tocar en esta ronda y por qué.

No implementes nada todavía.
```

**Aquí paras y decides tú.** Lee el plan, quita lo que no quieras y aprueba lote a lote.

---

## FASE 2 — Corrección por lotes

Repite este bloque **una vez por lote**, con commit entre uno y otro.

```
Ejecuta el LOTE [N] del plan en .claude/audit/PLAN-MEJORA.md.

1. frontend-implementer aplica las correcciones de ese lote y solo de ese lote.
   Nada de refactors oportunistas: si ves algo roto al lado, repórtalo y no lo toques.
2. Al terminar, los auditores del dominio afectado re-verifican SOLO lo corregido.
3. Dame el resumen de archivos modificados y qué hallazgos quedan cerrados.
```

Después de cada lote:

```bash
git add -A && git commit -m "fix: lote N — [descripción]"
```

---

## FASE 3 — Red de seguridad

Antes de tocar nada más, asegura lo que ya funciona.

```
Usa el agente qa-tester.

Escribe tests de regresión para los flujos críticos que hemos modificado, usando el
framework de tests que ya está instalado en el proyecto (no introduzcas uno nuevo).

Prioriza los flujos donde un fallo sea más caro. Prueba comportamiento observable,
no implementación: consulta por rol, texto o etiqueta accesible.

Cubre también los estados de error, no solo el camino feliz.
```

---

## FASE 4 — Mejora de experiencia

Solo cuando lo anterior está estable y commiteado.

### 4.1 · Revisión de UX

```
Usa el agente ux-designer.

Revisa las pantallas principales del proyecto y detecta estados de interfaz que
faltan: vacío inicial, carga, carga parcial, vacío tras filtro, error recuperable,
error fatal, sin permiso.

Entrega una spec de los que falten, con el copy completo escrito. No dejes TODOs
de texto.
```

Luego implementa con el bloque de la Fase 2.

### 4.2 · Pulido final

```
Usa el agente motion-ux-polish.

Ahora que la funcionalidad es estable, revisa el detalle percibido: micro-interacciones,
transiciones, skeletons, estados hover/active/focus-visible/disabled, feedback inmediato.

Cada propuesta debe justificar su razón (orientación, continuidad, feedback o atención),
usar los tokens de motion de DESIGN_RULES.md, e incluir su variante para
prefers-reduced-motion.

Prioriza y descarta lo que sea decoración.
```

---

## FASE 5 — Cierre

```
Cierre de la ronda de mejora:

1. design-system-architect (modo AUDITAR): auditoría final de coherencia visual.
2. security-auditor: pasada final sobre todo lo modificado.
3. docs-handoff: actualiza el README y documenta los componentes reutilizables
   que hayan surgido.
4. Dame un resumen: qué se corrigió, qué quedó pendiente y por qué.
```

---

## Mantenimiento

Cada cierto tiempo, o si notas que algún agente no se activa nunca:

```
Usa el agente agent-tuner.

Audita el equipo de agentes: solapamientos entre descripciones, permisos de
herramientas excesivos, y asignación de modelo de cada uno.

Dame el reporte primero. No apliques cambios hasta que yo apruebe.
```

---

## Uso diario, después de la auditoría

Para el día a día no hace falta nada de lo anterior. Empieza siempre por triage:

```
Usa task-triage: [tu petición]
```

Te devuelve el nivel (T0–T4) y qué agentes hacen falta. Luego sigues esa secuencia.

---

# ANEXO — Track de auditoría de diseño

Para proyectos con **backend maduro y frontend que hay que auditar y mejorar**.
Sustituye a las Fases 1–5 de arriba cuando el objetivo es exclusivamente diseño y
experiencia, sin desarrollo de funcionalidad nueva.

Requisito previo: `SCOPE.md`, `ARCHITECTURE.md`, `API-CONTRACT.md` y `DESIGN_RULES.md`
generados y revisados.

## D1 · Diagnóstico visual y de experiencia (solo lectura)

```
Auditoría de diseño y experiencia. Esta fase es SOLO LECTURA: ningún agente
modifica código. Respeta la frontera de .claude/docs/SCOPE.md.

Lanza en paralelo sobre la zona de trabajo declarada en SCOPE.md:

- design-system-architect (modo AUDITAR)  → coherencia visual y tokens
- accessibility-auditor                    → WCAG 2.1 AA
- mobile-ux-specialist                     → táctil, viewport, teclado, gestos
- performance-engineer                     → Web Vitals y percepción de velocidad

Guarda cada reporte en .claude/audit/[nombre-agente].md
```

Añade `apple-hig-specialist` si tienes tráfico iOS relevante o PWA.

## D2 · Diagnóstico de flujos y estados

```
Usa el agente ux-designer.

Recorre las pantallas principales y detecta qué estados de interfaz faltan:
vacío inicial, carga, carga parcial, vacío tras filtro, error recuperable,
error fatal, sin permiso.

Detecta también: jerarquía visual poco clara, acciones primarias ambiguas,
formularios sin validación útil, copy que expone jerga técnica o errores crudos
del backend al usuario.

Diseña dentro de lo que .claude/docs/API-CONTRACT.md permite. Lo que requiera
datos que hoy no existen, sepáralo en PROPUESTAS PARA BACKEND.

Guarda en .claude/audit/ux-designer.md. No implementes nada.
```

Este agente suele ser el que más valor aporta en un proyecto con backend maduro: es
frecuente que la API devuelva errores correctos que la interfaz nunca muestra.

## D3 · Plan de mejora priorizado

```
Usa el agente tech-lead.

Consolida los reportes de .claude/audit/ en .claude/audit/PLAN-DISENO.md.

1. Deduplica los hallazgos que varios auditores reportaron desde ángulos distintos
   (el área táctil de 44px, por ejemplo, llega de accesibilidad y de móvil).
2. Ordena por impacto en el usuario ÷ coste. Un estado de error ausente vale más
   que diez tokens desalineados.
3. Agrupa en lotes independientes con diff revisable (< 15 archivos).
4. Ningún lote puede tocar la zona de solo lectura de SCOPE.md.
5. Consolida al final la sección PROPUESTAS PARA BACKEND de todos los reportes.

No implementes nada.
```

Revisa el plan y aprueba lote a lote. La sección de propuestas para backend es la que
llevas al otro equipo.

## D4 · Corrección por lotes

Repite por cada lote, con commit entre uno y otro.

```
Ejecuta el LOTE [N] de .claude/audit/PLAN-DISENO.md.

1. frontend-implementer aplica ese lote y solo ese lote, respetando SCOPE.md.
   Nada de refactors oportunistas.
2. Los auditores del dominio afectado re-verifican solo lo corregido.
3. Resumen de archivos modificados y hallazgos cerrados.
```

```bash
git add -A && git commit -m "design: lote N — [descripción]"
```

## D5 · Regresión visual

```
Usa el agente qa-tester.

Escribe tests para los flujos que hemos tocado, con el framework ya instalado.
Prioriza los estados nuevos (error, vacío, carga) que antes no existían y que
nadie ha ejercitado nunca.

Prueba comportamiento observable: rol, texto y etiqueta accesible.
```

## D6 · Pulido y cierre

```
1. motion-ux-polish: revisa el detalle percibido ahora que los estados existen.
   Cada propuesta con su razón, sus tokens y su variante reduced-motion.
2. design-system-architect (AUDITAR): pasada final de coherencia.
3. Resumen: qué mejoró, qué quedó pendiente y qué depende del backend.
```
