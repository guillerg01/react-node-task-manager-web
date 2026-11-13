# Reglas del proyecto

- Lee este archivo antes de trabajar en cada módulo y revisa los cambios contra estas reglas.
- Organiza la aplicación por features dentro de `src/features`. Los componentes compartidos viven en `src/shared` y los proveedores en `src/app`.
- La feature define reglas, etiquetas y mensajes. Reutiliza campos, paginación y notificaciones cuando comparten comportamiento.
- Usa Material UI para controles y Tailwind en JSX para distribución y presentación.
- Mantén el transporte genérico. El backend aplica filtros, orden y paginación. TanStack Query gestiona caché e invalidación y React Hook Form gestiona el formulario.
- Usa TypeScript estricto, Node LTS y versiones estables compatibles. Versiona el lockfile.
- Escribe código, pruebas y commits en inglés. La interfaz, los README, las decisiones y estas reglas se escriben en español.
- Los commits deben tener título descriptivo y cuerpo con comportamiento, decisiones y verificación.
- Mantén el código sin comentarios, emojis ni firmas generadas.
- Ejecuta lint, tipos, pruebas y build. Inicia el sistema y comprueba los controles en navegador, teclado y tamaños móvil y escritorio antes de entregar cada funcionalidad.
- Trabaja mediante ramas desde `dev`. Promueve a `main` mediante pull request y comprobaciones. `main` es producción.
- Mantén secretos y artefactos fuera de Git. Documenta las decisiones y el uso real de IA.
