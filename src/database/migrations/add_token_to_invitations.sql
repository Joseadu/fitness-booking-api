-- Add token column for Path A setup flow
ALTER TABLE box_invitations 
ADD COLUMN token UUID UNIQUE DEFAULT NULL;
