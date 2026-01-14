export class InvitationSuccessResponse {
    success: true;
    data: {
        invitation: {
            id: string;
            email: string;
            status: string;
            boxId: string;
            createdAt: Date;
        };
        path: 'new_user' | 'existing_user';
        emailSent: boolean;
    };
    message: string;
}

export class AcceptInvitationResponse {
    success: true;
    data: {
        membership: {
            id: string;
            userId: string;
            boxId: string;
            role: string;
            isActive: boolean;
        };
        alreadyExisted: boolean;
    };
    message: string;
}
