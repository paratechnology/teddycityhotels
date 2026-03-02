import { z } from 'zod';

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
  firmId: z.string().min(1),
  password: z.string().min(8),
  firstName: z.string().min(1),
  otherNames: z.string().optional(),
  lastName: z.string().min(1),
});

export type AcceptInvitationDto = z.infer<typeof AcceptInvitationSchema>;

export interface IAcceptInvitation {
  token: string;
  firmId: string;
  password: string;
  firstName: string;
  otherNames?: string;
  lastName: string;
}
