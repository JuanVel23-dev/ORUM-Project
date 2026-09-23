# Escala de severidad común

Todos los agentes auditores usan esta escala. Los nombres cambian ligeramente por
dominio (convención de cada disciplina), pero los niveles se corresponden.

| Nivel | Code Review | Seguridad | QA | Accesibilidad | Rendimiento |
|---|---|---|---|---|---|
| 1 | Blocker | Crítico | Crítico | Bloqueante | Alto |
| 2 | Major | Alto | Alto | Serio | Medio |
| 3 | Minor | Medio | Medio | Moderado | Bajo |
| 4 | Nit | Bajo / Informativo | Bajo | Menor | — |

## Definición de cada nivel

### Nivel 1 — Bloquea la entrega
Hay un fallo real, no hipotético: pérdida de datos, vulnerabilidad explotable,
funcionalidad principal rota, o un grupo de usuarios que no puede completar la tarea.

**No se despliega con hallazgos de nivel 1 abiertos.**

### Nivel 2 — Debe corregirse antes de cerrar
Fallará bajo condiciones previsibles, o genera deuda que crecerá. Hay margen de
maniobra para negociar el momento, no la necesidad.

### Nivel 3 — Debería corregirse
Mejora clara sin riesgo inmediato. Si no entra en esta iteración, se registra como
tarea, no se olvida.

### Nivel 4 — Opcional
Preferencia estilística o refinamiento. **Nunca bloquea.** Si un agente marca muchos
niveles 4, es señal de que falta una regla en `DESIGN_RULES.md` o en el linter, no de
que haya un problema.

## Regla anti-inflación

La tentación de todo auditor es subir la severidad para que le hagan caso. Un reporte
donde todo es Blocker no prioriza nada.

Prueba de contraste antes de asignar nivel 1 o 2: **¿puedes describir, en una frase,
la consecuencia concreta para un usuario o para el negocio?** Si la respuesta es
"quedaría más limpio", no es nivel 1 ni 2.

## Formato obligatorio de un hallazgo

```markdown
### [NIVEL] Título específico y accionable
- **Ubicación**: `ruta/archivo.tsx:línea`
- **Problema**: qué está mal
- **Impacto**: consecuencia concreta
- **Corrección**: código o pasos exactos
```

Un hallazgo sin ubicación o sin corrección concreta se devuelve al agente que lo
emitió.
