# Arquitectura de Backend: Invitaciones vs Membresías (Atletas)

Para migrar a NestJS de forma profesional y sin líos, dividiremos el trabajo en dos módulos independientes que se comunican entre sí.

---

## 🏗️ 1. Módulo de Invitaciones (`Invitations`)
**Responsabilidad**: Gestionar la "Sala de Espera". Aquí están los que han sido invitados pero aún no son miembros.

- **Dato clave**: Se basa en el **Email**. No hace falta que el usuario exista aún.
- **Endpoints**:
    - `POST /invitations`: Crea el registro "pendiente" y envía el correo.
    - `GET /invitations/box/:id`: Devuelve a los "pendientes" para tu lista de box.
    - `DELETE /invitations/:id`: Cancela la invitación (el dueño se arrepiente).

---

## 🏗️ 2. Módulo de Membresías/Atletas (`Memberships`)
**Responsabilidad**: Gestionar a los "Atletas Reales". Los que ya están dentro de la app y vinculados a tu gimnasio.

- **Dato clave**: Se basa en el **User ID**. El usuario ya tiene cuenta.
- **Endpoints**:
    - `GET /memberships/box/:id`: Devuelve la lista de atletas reales de tu gimnasio.
    - `DELETE /memberships/:userId`: Elimina al atleta del gimnasio (desvinculación).

---

## 🔄 3. El Flujo de "Alta" y Conversión (Senior Logic)

El sistema debe detectar automáticamente si el email ya pertenece a un usuario o no.

### CAMINO A: El usuario NO existe (Alta con Credenciales)
Es el flujo para traer gente nueva a la app y que no "falle" como ahora:
1.  **Dueño envía invitación**.
2.  **Backend**:
    - Crea un usuario "provisional" en el sistema de Auth.
    - Genera una **contraseña temporal** (ej: `fb-123456`).
    - Crea la invitación `pending` y la vincula a ese nuevo usuario.
3.  **Email**: Se envía al usuario: *"Bienvenido, entra con este Email y esta Contraseña Temporal"*.
4.  **Primer Login**:
    - El Frontend detecta un flag `mustChangePassword`.
    - Obliga al usuario a poner su nueva clave.
    - Al terminar, su cuenta está lista y ya es miembro **Activo** de tu box.

---

### CAMINO B: El usuario YA existe (Invitación a Box)
Para usuarios que ya usan la app en otros gimnasios:
1.  **Dueño envía invitación**.
2.  **Backend**: Detecta que el email ya existe. No crea usuario nuevo ni contraseña.
3.  **Email/Notificación**: *"Has sido invitado al Box X. Acepta pulsando aquí"*.
4.  **Aceptación**:
    - El usuario entra en la app y ve un aviso de "Invitación Pendiente".
    - Al pulsar **ACEPTAR**, se crea la relación con el box y pasa a ser **Activo**.

---

## 🎨 4. El Estado en el Frontend (Resumen)

| Situación | Estado Visual | Acción de Usuario |
| :--- | :--- | :--- |
| Invitación enviada | **PENDIENTE** | Esperar al usuario |
| Nuevo: Login hecho | **ACTIVO** | Cambiar contraseña (automático) |
| Existente: Aceptado | **ACTIVO** | Pulsar "Aceptar" |

## ⚡ 5. Gatillos de Traspaso (Momentos clave para el Backend)

Para que el desarrollador de Backend no tenga dudas de **cuándo** hacer la magia:

1.  **Gatillo A (Usuario Nuevo)**: 
    - **Cuándo**: En el momento en que se completa con éxito el cambio de contraseña forzoso.
    - **Acción**: El sistema ve que ese email tenía una invitación pendiente, la marca como `accepted` y crea su membresía `active` inmediatamente.
    - **Resultado**: El usuario entra en la app y ya ve su box configurado. No tiene que aceptar nada extra.

2.  **Gatillo B (Usuario Existente)**:
    - **Cuándo**: Al recibir una petición al endpoint `POST /invitations/:id/accept`.
    - **Acción**: El sistema marca la invitación como `accepted` y crea la membresía `active`.
    - **Resultado**: El usuario pulsa un botón en su panel y "¡pum!", ya está dentro del nuevo box.

---

> [!TIP]
> **En resumen**: El Backend es el que decide cuándo alguien deja de ser una "invitación" para ser un "atleta". El Frontend solo refresca la lista y el usuario verá cómo se mueve de una sección a otra automáticamente.
