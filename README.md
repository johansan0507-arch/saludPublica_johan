# SaludPública Connect 🏥
### Sistema Integral de Gestión de Turnos para Centros de Salud Públicos
**SENA - Programa ADSO (Ficha 3139687 - Jornada Mañana)**  
**Autor / Instructor:** Carlos Chaparro  
**Tipo de Actividad:** Laboratorio Final de Aprendizaje  

---

## 1. Descripción del Proyecto

**SaludPública Connect** es una solución fullstack moderna de nivel productivo diseñada para optimizar la asignación y gestión de citas médicas en la red pública de salud. Incorpora:

* **Triaje Inteligente con Google Gemini AI:** Evaluación automatizada de síntomas clínicos en lenguaje natural para orientar al ciudadano a la especialidad más indicada.
* **Prevención Activa de Race Conditions:** Transacciones atómicas a nivel de base de datos (`prisma.$transaction`) que impiden reservas concurrentes del mismo turno.
* **Slots de Atención de 20 minutos:** Generación masiva y control estricto de horarios clínicos.
* **Acceso y Cancelación Pública por Token:** Visualización y cancelación de citas médicas directamente desde enlaces de correo sin requerir inicio de sesión previo.
* **Sistema Asíncrono de Correo y Notificaciones:** Procesamiento en segundo plano mediante **Bull Queue + Redis** y despacho con **Nodemailer**.
* **Panel de Control Administrativo:** Gráficos interactivos con **Recharts** para análisis de ocupación y demanda por especialidad.
* **Diseño con Estándar Impeccable:** Interfaz clínica de alta usabilidad, tipografía matemática, estados de carga y contrastes accesibles (WCAG AA).

---

## 2. Tecnologías Utilizadas

| Capa / Componente | Tecnología Principal | Propósito |
| :--- | :--- | :--- |
| **Frontend (UI)** | React 19 + TypeScript + Vite | Interfaz reactiva, rápida y fuertemente tipada |
| **Diseño y Estilos** | TailwindCSS + Lucide Icons | Paleta clínica, microinteracciones y diseño Impeccable |
| **Gráficos y Métricas**| Recharts | Visualización de demanda y tasa de ocupación |
| **Backend (API REST)** | NestJS 10 + TypeScript | Servidor modular, DTOs, Guards y Swagger |
| **Base de Datos & ORM**| PostgreSQL 16 + Prisma ORM | Modelado relacional, migraciones y transacciones atómicas |
| **Colas Asíncronas** | Redis 7 + Bull Queue | Tareas en segundo plano para notificaciones masivas |
| **Email SMTP** | Nodemailer | Envío de confirmaciones con link de cancelación |
| **Inteligencia Artificial**| Google Gemini AI SDK | Triaje de síntomas y orientación clínica |
| **Infraestructura** | Docker Compose + DevContainer | Despliegue en 1 clic en local o GitHub Codespaces |

---

## 3. Opciones de Ejecución

### Opción A: 1 Clic en GitHub Codespaces (Recomendado en GitHub)
Si estás viendo este repositorio en GitHub, no necesitas instalar Docker ni Node en tu computadora física:
1. Haz clic en el botón verde **`Code`** > pestaña **`Codespaces`** > **`Create codespace on main`**.
2. GitHub creará una máquina virtual en la nube con Docker, PostgreSQL y Redis preconfigurados (`.devcontainer/devcontainer.json`).
3. Los puertos se abrirán automáticamente:
   * **Frontend:** Puerto `3000`
   * **Backend (Swagger):** Puerto `3001/api`
   * **Redis Commander:** Puerto `8081`

---

### Opción B: Con Base de Datos en la Nube (Neon / Supabase)
Si estás en una máquina Windows sin Docker instalado:
1. Crea una base de datos PostgreSQL gratuita en [Neon.tech](https://neon.tech) o [Supabase.com](https://supabase.com).
2. Copia la URL de conexión e ingrésala en `backend/.env`:
   ```env
   DATABASE_URL="postgresql://tu_usuario:tu_password@ep-xyz.neon.tech/saludpublica?sslmode=require"
   ```
3. Ejecuta las migraciones y el seed (ver paso 4).

---

### Opción C: Ejecución Local con Docker Compose
Si tienes Docker Desktop instalado en tu sistema:
```bash
# 1. Levantar infraestructura en segundo plano
docker-compose up -d
```
* **PostgreSQL:** `localhost:5432`
* **Redis:** `localhost:6379`
* **Redis Commander UI:** `http://localhost:8081`

---

## 4. Puesta en Marcha Paso a Paso

### Backend (NestJS)
```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Generar el cliente de Prisma
npm run prisma:generate

# 3. Ejecutar las migraciones en la base de datos PostgreSQL
npm run prisma:migrate

# 4. Poblar la base de datos con el Seed (4 médicos, 5 especialidades, ~176 slots)
npm run prisma:seed

# 5. Iniciar el servidor en modo desarrollo
npm run start:dev
```
* **API Activa en:** `http://localhost:3001`
* **Documentación Interactiva (Swagger):** `http://localhost:3001/api`

### Frontend (React + Vite)
En una nueva terminal:
```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Configurar variable de Gemini en frontend/.env.local (Opcional, incluye fallback clínico)
# VITE_GEMINI_API_KEY=tu_api_key_aqui

# 3. Iniciar servidor Vite
npm run dev
```
* **Frontend Activo en:** `http://localhost:3000`

---

## 5. Credenciales de Prueba (Seed Preconfigurado)

El comando `npm run prisma:seed` genera automáticamente las siguientes cuentas:

| Rol | Correo Electrónico | Contraseña | Funciones |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@saludpublica.gov.co` | `Admin123!` | Dashboard, métricas Recharts, crear médicos y generador de slots de 20m |
| **Paciente** | `paciente@saludpublica.gov.co` | `Paciente123!` | Triaje IA, reserva de turnos y cancelación |
| **Médico General** | `dr.gomez@saludpublica.gov.co` | `Doctor123!` | Consulta de agenda y slots asignados |
| **Pediatra** | `dra.ramos@saludpublica.gov.co` | `Doctor123!` | Consulta médica pediátrica |

*(La interfaz web incluye botones rápidos para rellenar estas credenciales con 1 clic en el modal de login).*

---

## 6. Pruebas y Validación con Postman

El proyecto incluye la colección lista para importar:  
📁 `SaludPublicaConnect.postman_collection.json`

1. Abre **Postman** y presiona **Import** > Selecciona el archivo `.json`.
2. Las variables de entorno ya están configuradas:
   * `baseUrl`: `http://localhost:3001`
   * `token`: Capturado automáticamente al ejecutar la petición *Login Paciente*.
   * `adminToken`: Capturado automáticamente al ejecutar la petición *Login Administrador*.
   * `slotId` y `cancelToken`: Guardados dinámicamente entre peticiones.
3. Valida la prueba de **Simulación de Race Condition**: ejecuta dos veces la reserva del mismo `slotId` para confirmar la respuesta `409 Conflict`.

---

## 7. Catálogo de Endpoints de la API REST

| Módulo | Método | Endpoint / Ruta | Descripción / Acceso |
| :--- | :--- | :--- | :--- |
| **Autenticación** | `POST` | `/auth/register` | Registro de nuevos usuarios |
| **Autenticación** | `POST` | `/auth/login` | Login (Retorna JWT) |
| **Autenticación** | `GET` | `/auth/profile` | Perfil del usuario autenticado (🔒 JWT) |
| **Especialidades** | `GET` | `/specialties` | Listar especialidades médicas |
| **Médicos** | `GET` | `/doctors` | Listar médicos (filtro por especialidad) |
| **Médicos** | `POST` | `/doctors` | Registrar médico (🔒 Admin) |
| **Médicos** | `POST` | `/doctors/:id/slots/generate` | Generar slots de 20 min (🔒 Admin) |
| **Turnos** | `GET` | `/appointments` | Listar citas del usuario (🔒 Autenticado) |
| **Turnos** | `POST` | `/appointments` | Reservar turno (🔒 Paciente, Anti-Race Condition) |
| **Turnos** | `GET` | `/appointments/stats` | Métricas y estadísticas (🔒 Admin) |
| **Turnos Públicos**| `GET` | `/appointments-public/token/:token` | Consultar turno sin login |
| **Turnos Públicos**| `POST` | `/appointments-public/cancel/:token` | Cancelar turno desde enlace de correo |
