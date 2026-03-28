# Esquema Firebase + Premium (Vital Market)

## 1) Estructura de Realtime Database

```mermaid
erDiagram
    ROOT ||--o{ INVENTARIO : contiene
    ROOT ||--o{ PREMIUM_USERS : contiene

    INVENTARIO ||--o{ PRODUCTO : items
    PREMIUM_USERS ||--o{ USER_NODE : usuarios
    USER_NODE ||--|| PROFILE : perfil
    USER_NODE ||--o{ TRANSACTION : historial

    PRODUCTO {
        string id
        string nombre
        number stock
        number precio
        string categoria
        string vence
    }

    PROFILE {
        boolean active
        string source
        string transactionId
        string status
        number amountInCents
        string currency
        string premiumUntil
        string updatedAt
    }

    TRANSACTION {
        string transactionId
        string status
        string source
        number amountInCents
        string currency
        string paidAt
        string createdAt
        string premiumUntil
    }
```

Ruta sugerida en RTDB:

- inventario/{productoId}
- premiumUsers/{userId}/profile
- premiumUsers/{userId}/transactions/{transactionId}

Ejemplo profile:

```json
{
  "active": true,
  "source": "wompi",
  "transactionId": "123456-abc",
  "status": "APPROVED",
  "amountInCents": 1990000,
  "currency": "COP",
  "premiumUntil": "2026-04-27T20:00:00.000Z",
  "updatedAt": "2026-03-27T20:00:00.000Z"
}
```

## 2) Flujo Premium (Wompi + Backend + Firebase)

```mermaid
flowchart TD
    A[Usuario pulsa Actualizar a Premium] --> B[Frontend abre modal de pago]
    B --> C[Frontend POST create-intent al backend]
    C --> D[Backend genera reference y firma]
    D --> E[Frontend abre WidgetCheckout Wompi]
    E --> F{Pago aprobado?}
    F -- No --> G[Mostrar estado pendiente o fallido]
    F -- Si --> H[Frontend POST confirm con transactionId]
    H --> I[Backend consulta transaccion en Wompi]
    I --> J{Status APPROVED?}
    J -- No --> K[Respuesta no aprobado]
    J -- Si --> L[Backend escribe profile y transactions en Firebase]
    L --> M[Frontend sincroniza estado premium]
    M --> N[UI activa beneficios Premium]
```

## 3) Reglas de seguridad recomendadas (RTDB)

Opcion minima temporal (solo pruebas):

```json
{
  "rules": {
    "inventario": {
      ".read": true,
      ".write": true
    },
    "premiumUsers": {
      ".read": true,
      ".write": true
    }
  }
}
```

Opcion recomendada con Auth (produccion):

```json
{
  "rules": {
    "inventario": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "premiumUsers": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        "profile": {
          ".write": "auth != null && auth.uid == $userId"
        },
        "transactions": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

Nota importante:

- Para produccion real, idealmente solo el backend debe escribir premiumUsers.
- En ese caso se recomienda Admin SDK en backend para evitar escrituras desde cliente.
