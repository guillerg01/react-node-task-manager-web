# Interfaz del gestor de tareas

Aplicación en español con React, Vite, TypeScript, Material UI y Tailwind CSS. Permite crear tareas, filtrarlas y paginarlas desde la API, y cambiar su estado.

[Demo](https://react-node-task-manager-web.onrender.com) · [Backend e instrucciones de Docker Compose](https://github.com/guillerg01/react-node-task-manager-api) · [Swagger](https://react-node-task-manager-api.onrender.com/docs)

![Vista de escritorio](docs/images/dashboard-1440.png)

[Vista móvil](docs/images/dashboard-375.png) · [Vista tablet](docs/images/dashboard-768.png)

## Ejecutar

Clona este repositorio junto al backend y ejecuta `docker compose up --build` desde el repositorio de la API. Abre `http://localhost:5174`.

Para iniciar solo la web, instala Node.js 26.13.1 y ejecuta `npm ci` y `npm run dev`. La API local predeterminada es `http://localhost:3000`. Configura `VITE_API_URL` con otro origen cuando corresponda.

## Comprobar

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Con Compose iniciado, ejecuta `npx playwright install chromium` y `npm run test:e2e`. Playwright recorre creación, estados, filtros, paginación, notificaciones y recuperación de errores en escritorio, tablet y móvil.

GitHub Actions ejecuta las comprobaciones en cada push y pull request. Sus pruebas de navegador levantan ambos repositorios y PostgreSQL.

## Arquitectura

La feature de tareas define reglas, etiquetas y comportamiento. Los campos validados, la paginación y las notificaciones comparten componentes. React Hook Form gestiona el formulario. El cliente Axios centraliza URL, timeout y clasificación de errores, incluidos `400`, `404`, `409`, `429` y errores del servidor.

TanStack Query usa una clave por estado, página y tamaño de página, con 30 segundos de vigencia. Crear una tarea invalida las consultas. Un cambio de estado actualiza la fila con la respuesta guardada o vuelve a consultar cuando cambia su pertenencia al filtro. Las escrituras tienen reintento manual. `localStorage` recuerda el filtro.

Hay una pantalla en `/`. El diseño muestra el formulario y la lista en columnas en escritorio y los apila en móvil. Los campos tienen etiquetas y errores asociados. El estado también se expresa mediante texto. Consulta [los diagramas](https://github.com/guillerg01/react-node-task-manager-api/blob/main/ARCHITECTURE.md).

## Flujo de desarrollo

Crea una rama desde `dev`, abre un pull request a `dev` y promueve la integración mediante un pull request a `main`. `main` es producción. Render publica `dist` después de pasar CI. Configura `VITE_API_URL` con el origen HTTPS del backend.

## Con más tiempo

Añadiría monitorización de la demo y una evaluación con lectores de pantalla.

## Uso de IA

Se pidió comparar bibliotecas, planificar la feature, ayudar a implementar y proponer pruebas. Se aceptaron Material UI con Tailwind, React Hook Form, Axios y las pruebas de red con MSW. Durante la verificación se ajustaron la caché, la paginación, los mensajes y la alineación visual. Consulta [el registro de decisiones](https://github.com/guillerg01/react-node-task-manager-api/blob/main/DECISIONS.md).
