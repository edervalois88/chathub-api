# ChatHub – Japifon Tech Challenge

## 1. Objetivo del proyecto

Construir una version funcional del nucleo de Japifon: una bandeja omnicanal multi‑empresa que permite a multiples agentes atender conversaciones en tiempo real. El entregable debe demostrar dominio de arquitectura, desarrollo fullstack con Nest.js/Next.js, bases de datos MongoDB/MySQL*, tiempo real con WebSockets, seguridad JWT y buenas practicas de ingenieria.

> \*En esta iteracion se deja lista la estructura para integrar metricas relacionales (Prisma/MySQL) sin bloquear la funcionalidad principal en MongoDB.

---

## 2. Arquitectura de alto nivel

### Backend (Nest.js)

- **Modulos principales**  
  - `Auth`: registro/login JWT, organizaciones (multi‑tenant), gestion de usuarios/agentes.  
  - `Chat`: contactos, conversaciones, mensajes, WebSocket Gateway.  
- **Persistencia**  
  - MongoDB (Mongoose) para contactos, conversaciones y mensajes.  
  - Hook para extender con MySQL/Prisma en un microservicio de metricas.  
- **Tiempo real**  
  - WebSocket (`@nestjs/websockets` + adaptador WS).  
  - Eventos `joinConversation`, `sendMessage`, `messageHistory`.  
- **Seguridad**  
  - `JwtStrategy` valida usuarios y rellena `req.user` con organizacion y rol.  
  - Guards, DTOs + `ValidationPipe` (`whitelist`, `transform`).  
  - CORS configurable por `CLIENT_ORIGIN`.

### Frontend (Next.js 15 App Router)

- **Estado global**: `AuthContext` (token + usuario + refresh + logout).  
- **UI**: Tailwind CSS 4 + tokens de color (rosa mexicano y azul rey).  
- **Paginas clave**:  
  - `/register`, `/login`.  
  - `/` inbox (Sidebar + Chatroom).  
  - `/chat/[roomId]` navegacion profunda.  
  - `/conversations`, `/conversations/create`.  
- **Realtime**: WebSocket nativo; fallback HTTP listo para extender.  
- **Componentes**: `Sidebar`, `ChatRoom`, paneles para contactos/conversaciones.

### Diagrama resumido

```
Next.js (App Router)
  ├── AuthContext (fetch profile, tokens)
  ├── Sidebar ── fetch GET /chat/conversations
  ├── ChatRoom ── WS ws://api?token=JWT
  └── Management pages (contacts, analytics WIP)

Nest.js API
  ├── AuthModule ── usuarios, organizaciones, JWT
  ├── ChatModule ── contactos, conversaciones, mensajes
  └── WebSocketGateway ── coordinacion en tiempo real

MongoDB ─ colecciones: organizations, users, contacts, conversations, messages
```

---

## 3. Configuracion local

1. **Prerequisitos**  
   - Node.js ≥ 20  
   - npm ≥ 10  
   - MongoDB local (`mongodb://127.0.0.1:27017/chathub`) o ajustar `.env`  
   - (Opcional) Docker Desktop para levantar servicios auxiliares.

2. **Variables de entorno** (`.env` en `chathub-api/`)  
   ```env
   JWT_SECRET=yourSuperSecretKey
   MONGODB_URI=mongodb://127.0.0.1:27017/chathub
   CLIENT_ORIGIN=http://localhost:3000
   ```

3. **Instalacion**  
   ```bash
   # Backend
   cd chathub-api
   npm install

   # Frontend
   cd chathub-api/chathub-frontend
   npm install
   ```

4. **Ejecucion**  
   ```bash
   # Backend (Nest)
   npm run start:dev

   # Frontend (Next)
   npm run dev
   ```

---

## 4. Estructura relevante del repositorio

```
chathub-api/
├── src/
│   ├── app.module.ts                # Configuracion principal Nest
│   ├── main.ts                      # Bootstrap con CORS + pipes + WS adapter
│   ├── auth/                        # Modulo Auth y organizaciones
│   └── chat/                        # Conversaciones, contactos, gateway WS
├── docs/IMPLEMENTATION.md           # Este documento
└── ...

chathub-frontend/
├── src/app/
│   ├── layout.tsx                   # Fuente global, AuthProvider
│   ├── page.tsx                     # Dashboard principal
│   ├── login/, register/            # Flujos de autenticacion
│   ├── conversations/, chat/        # Gestion de conversaciones
│   └── ...
├── src/components/Sidebar.tsx       # Inbox + actions + logout
├── src/components/ChatRoom.tsx      # Mensajeria tiempo real
└── src/context/AuthContext.tsx      # Gestion de token + usuario
```

---

## 5. Flujos funcionales implementados

1. **Registro**  
   - Usuario crea organizacion (`organizationName` + slug opcional).  
   - Se genera usuario propietario (`role: owner`) y token listo para login.  
   - Registro se automatiza en frontend (tras crear, inicia sesion).

2. **Login**  
   - Credenciales (`username` + `password`) → JWT de 60 min.  
   - Respuesta incluye datos de usuario + organizacion para poblar UI.  
   - `AuthContext` guarda token en `localStorage`, hace `fetchProfile` y gestiona logout.

3. **Contactos**  
   - CRUD basico: crear contacto (nombre, email/telefono opcional).  
   - Se almacenan asociados a la organizacion y al agente que los creo.

4. **Conversaciones**  
   - Alta de conversacion: se valida que el contacto pertenezca a la organizacion.  
   - Campos enriquecidos: canal (`Web Chat`, `WhatsApp`, `SMS`), estado (`open`, `pending`, `resolved`), `lastMessagePreview`, `lastActivityAt`.  
   - Sidebar y vista de listado consumen `/chat/conversations` (ordenado por actividad).

5. **Mensajeria en tiempo real**  
   - WebSocket handshake con token JWT (`ws://host?token=...`).  
   - `joinConversation` → responde con historial.  
   - `sendMessage` → valida multi‑tenant y difunde a todos los clientes conectados.  
   - Persistencia de mensajes (Mongo) + actualizacion de `lastMessagePreview`.

6. **Seguridad multi‑tenant**  
   - Todas las rutas protegidas extraen organizacion desde `req.user`.  
   - Servicios validan que contacto/conversacion pertenezcan a la misma organizacion.  
   - Gateway rechaza accesos cruzados.

---

## 6. Tecnologias y motivacion

| Capa            | Tecnologia              | Razon principal                                                         |
|-----------------|-------------------------|-------------------------------------------------------------------------|
| Backend         | Nest.js + TypeScript    | Escalabilidad modular, inyeccion de dependencias, tests integrables.   |
|                 | Mongoose + MongoDB      | Agilidad para esquemas conversacionales, `.populate` y timestamps.     |
|                 | Passport JWT            | Autenticacion robusta, facil extension a refresh tokens.               |
|                 | WebSockets (`ws`)       | Bajo overhead, control total del protocolo (sin depender de Socket.IO).|
| Frontend        | Next.js 15 (App Router) | Hibrido SSR/CSR, rutas anidadas y server components.                    |
|                 | Tailwind CSS 4          | Tokens de diseno rapidos, personalizacion de branding.                 |
|                 | React Hooks             | Estados locales (`useState`, `useEffect`), `AuthContext` compartido.    |
| Tooling         | ConfigModule            | Gestion centralizada de variables (`MONGODB_URI`, `CLIENT_ORIGIN`).    |
|                 | ValidationPipe          | Sanitiza payloads, evita overposting.                                  |

---

## 7. Retos abordados

1. **Multi‑tenant real**  
   - Se anadio `Organization` y referencias en `User`, `Contact`, `Conversation`.  
   - `JwtStrategy` devuelve usuario completo con organizacion → disponible en controllers y gateway.

2. **Desalineacion WebSocket ↔ cliente**  
   - El frontend enviaba `{ event, data: string }` y el gateway esperaba `payload.content`.  
   - Se normalizo protocolo a `{ event, data: { content } }` y se anadio fallback para strings.

3. **Estados de UI y branding**  
   - Contexto global gestiona token + usuario + logout.  
   - Se aplico paleta azul rey + rosa mexicano + degradados, respetando contraste.  
   - Sidebar muestra metricas, status, boton de creacion y logout.

4. **Validaciones y seguridad**  
   - `ValidationPipe` con `whitelist` + DTOs.  
   - Reglas en `ChatService` previenen acceso cruzado a conversaciones/contacts.  
   - Mensajes en gateway envian errores legibles al cliente.

---

## 8. Proximos pasos sugeridos

1. **Pruebas automatizadas**
   - Unit tests `AuthService`/`ChatService` (Jest) con in‑memory Mongo.  
   - e2e tests con `Supertest` para flujos criticos.

2. **Metricas y reporting**
   - Implementar microservicio Prisma/MySQL para KPIs (SLA, volumen por canal).  
   - Exponer API `/analytics` y panel en frontend.

3. **Invitaciones y roles avanzados**
   - Endpoint para invitar agentes (enviar link con token).  
   - Roles adicionales (`viewer`, `supervisor`) + permisos granulares.

4. **Infraestructura**
   - Contenedores Docker (API + Front + Mongo + Redis).  
   - GitHub Actions: lint/test/build → deploy (Render/Vercel/AWS).  
   - Logs estructurados (Pino), metricas Prometheus, tracing OpenTelemetry.

5. **Integraciones externas**
   - Endpoints webhook (`/inbound/whatsapp`) para simular mensajes entrantes reales.  
   - Envio de notificaciones push/email cuando hay mensajes sin atender.

---

## 9. Uso rapido en Demo

1. Levanta backend (`npm run start:dev`) y frontend (`npm run dev`).  
2. Registrate en `/register` creando una organizacion.  
3. Inicia sesion en `/login` con el usuario creado.  
4. Desde el dashboard:  
   - Crea un contacto (`/conversations/create`).  
   - Abre una conversacion y envia mensajes (veras el streaming en tiempo real).  
   - Gestiona varias conversaciones desde la sidebar.  
5. Repite el login en otra ventana para simular agentes concurrentes.

---

## 10. Conclusion

El sistema demuestra fin a fin la capacidad de planificar y ejecutar un stack fullstack moderno:
- Arquitectura modular multi‑tenant con Nest.js y MongoDB.  
- UI reactiva con Next.js + Tailwind ajustada a la identidad Japifon.  
- Tiempo real estable via WebSockets.  
- Documentacion clara para onboarding y extension.

La base esta lista para continuar con analitica, integraciones externas y despliegue en la nube, cumpliendo con las expectativas de un Staff Engineer en un entorno de telecomunicaciones.
