# 🪒 Sistema de Fidelización para Barberías

Sistema de tarjeta de sellos digital para barberías. 5 cortes pagados = 1 corte GRATIS.

## 📁 Estructura del Proyecto

```
barber-fidelity/
├── prisma/
│   ├── schema.prisma      # Schema de base de datos
│   ├── seed.ts            # Datos de prueba
│   └── dev.db             # Base de datos SQLite
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stamps/route.ts    # API: Agregar sellos y canjear
│   │   │   └── users/route.ts     # API: Crear usuarios
│   │   ├── [businessSlug]/
│   │   │   ├── page.tsx           # Tarjeta del cliente
│   │   │   └── register/page.tsx  # Registro de cliente
│   │   └── barber/dashboard/
│   │       └── page.tsx           # Panel del barbero + QR Scanner
│   ├── components/
│   │   ├── StampCard.tsx          # Visualización de sellos
│   │   ├── QrScanner.tsx          # Escáner de QR
│   │   └── QrCode.tsx             # Generador de QR
│   └── lib/
│       ├── prisma.ts              # Cliente Prisma
│       └── utils.ts               # Utilidades
└── .env                           # Variables de entorno
```

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
npx prisma migrate dev
npx prisma db seed

# 3. Iniciar servidor de desarrollo
npm run dev
```

## 📱 Flujos de Uso

### 1. Cliente nuevo
1. Escanea QR físico en la barbería → `/{businessSlug}/register`
2. Completa registro con nombre y teléfono
3. Ve su tarjeta digital con QR único
4. Guarda PWA en home screen

### 2. Validación por barbero
1. Barbero accede a `/barber/dashboard`
2. Escanea QR del cliente
3. Si stamps < 5: Click "Agregar Corte Pagado"
4. Si stamps == 5: Click "Canjear Corte Gratis"

## 🎨 Diseño

- **Tema oscuro**: `#0f0f0f` background
- **Acentos ámbar/oro**: `#f59e0b`
- **Tarjeta Memphis**: Visual clásico de tarjeta de sellos
- **Animaciones suaves**: Al agregar sellos con framer-motion

## 🔌 API Endpoints

### POST /api/stamps
```json
// Agregar sello
{
  "userId": "...",
  "action": "add"
}

// Canjear gratis
{
  "userId": "...",
  "action": "redeem"
}
```

### GET /api/stamps?userId=xxx
Obtiene información del cliente y su historial.

### POST /api/users
```json
{
  "name": "Juan Pérez",
  "phone": "5512345678",
  "businessSlug": "memphis-barberia"
}
```

## 🧪 Datos de Prueba

Después del seed, puedes probar con:

- **Negocio**: Memphis Barbería
- **URL Cliente**: http://localhost:3000/memphis-barberia
- **URL Barbero**: http://localhost:3000/barber/dashboard

Usuarios creados:
- Carlos Rodríguez (3 sellos) - Tel: 5512345678
- Ana Martínez (5 sellos - listo para canjear) - Tel: 5587654321

## 🛠️ Tecnologías

- **Next.js 16** + React 19
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma 5** + SQLite
- **html5-qrcode** (escáner QR)
- **qrcode** (generador QR)
- **framer-motion** (animaciones)
- **lucide-react** (iconos)

## 📋 Roadmap

- [ ] Autenticación de barberos (JWT)
- [ ] Panel de administración
- [ ] Estadísticas y reportes
- [ ] Notificaciones push
- [ ] Múltiples sucursales
- [ ] Sistema de recompensas avanzado
