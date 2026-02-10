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
# barber-fidelity

Sistema de tarjeta de sellos digital para barberías (5 cortes pagados = 1 corte gratis).

## Inicio rápido

```bash
npm install
npm run dev
```

Si usas la base de datos (opcional en desarrollo):

```bash
npx prisma migrate dev
npx prisma db seed
```

Eso es todo — más detalles están en el código fuente.
// Canjear gratis
