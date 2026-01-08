export class ScheduleResponseDto {
    id: string;
    date: string;       // "2024-01-01"
    startTime: string;  // "10:00"
    endTime: string;    // "11:00"

    capacity: number;
    currentBookings: number; // spots ocupados (confirmados)
    spotsAvailable: number; // capacity - currentBookings

    discipline: {
        id: string;
        name: string;
        color: string;
    };

    coach?: {
        id: string;
        name: string;
    };

    userHasBooked: boolean; // ¿El usuario que pide la lista está apuntado?
    isCancelled: boolean;
    cancelReason?: string;

    // Opcional: Lista de participantes para el dueño
    participants?: {
        id: string;
        fullName: string;
        avatarUrl: string;
    }[];
}
