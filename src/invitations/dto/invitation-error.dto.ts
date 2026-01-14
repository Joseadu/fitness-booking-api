export enum InvitationErrorCode {
    ALREADY_MEMBER = 'ALREADY_MEMBER',
    PENDING_INVITATION = 'PENDING_INVITATION',
    INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
    INVITATION_NOT_PENDING = 'INVITATION_NOT_PENDING',
    UNAUTHORIZED_ACCEPT = 'UNAUTHORIZED_ACCEPT',
    INVITATION_NOT_LINKED = 'INVITATION_NOT_LINKED',
}

export class InvitationErrorResponse {
    statusCode: number;
    error: InvitationErrorCode;
    message: string;
    timestamp?: string;
}
