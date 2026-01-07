# Cómo obtener tus credenciales de Supabase

Para conectar tu API NestJS con Supabase, necesitas dos valores clave: `DATABASE_URL` y `SUPABASE_JWT_SECRET`.

## 1. SUPABASE_JWT_SECRET
Este secreto se utiliza para verificar que los tokens (JWT) que envían los usuarios fueron realmente generados por tu proyecto de Supabase.

1. Entra a tu proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2. En el menú lateral izquierdo, ve a **Project Settings** (icono de engranaje ⚙️).
3. Haz clic en **API**.
4. Desplázate hasta la sección **JWT Settings**.
5. Copia el valor de **JWT Secret**.
   - *Nota*: Si lo revelas, asegúrate de copiarlo completo.

> [!TIP]
> **Si ves un menú "JWT Keys"** (como en tu captura):
> 1. Haz clic en la pestaña que dice **Legacy JWT Secret** (al lado de *JWT Signing Keys*).
> 2. Ahí podrás ver y copiar tu `SUPABASE_JWT_SECRET`.
> 3. *Nota*: Si ves un botón "Generate new secret" o "Migrate", ¡no lo pulses a menos que sepas lo que haces! (Podría desconectar tus usuarios actuales).

## 2. DATABASE_URL
La forma más fácil de obtener esto es usando el botón **Connect** en la parte superior:

1. Mira en la barra superior de tu pantalla (arriba del todo).
2. Haz clic en el botón blanco que dice **Connect**.
3. En la ventana que se abre, selecciona **Transaction Pooler** (recomendado) o **Direct**.
4. Copia la cadena que aparece bajo "Connection String".
   - Debería verse algo así: `postgres://postgres.xxyyzz:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
5. **IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con tu contraseña real de la base de datos.

## Dónde ponerlos
Pégalos en tu archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgres://postgres.turef:tupassword@aws-0-region.pooler.supabase.com:6543/postgres"
SUPABASE_JWT_SECRET="super-secret-jwt-token-..."
```
