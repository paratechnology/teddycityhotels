import { PaginatedResponse } from './legacy-compat.interface';
import { IPaymentInitializationData } from './response';

export interface ISnookerPlayerRegistration {
  fullName: string;
  email: string;
  phoneNumber: string;
  nickname?: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Pro';
}

export interface ISnookerPlayer extends ISnookerPlayerRegistration {
  id: string;
  registeredAt: string;
  isPaid: boolean;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  groupId?: string;
  groupName?: string;
  stats?: {
    played: number;
    won: number;
    lost: number;
    points: number;
    frameDifference?: number;
  };
}

export type SnookerMatchStatus = 'Scheduled' | 'Live' | 'Completed' | 'Postponed';
export type SnookerStageType = 'group' | 'knockout';

export interface ISnookerMatch {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  score?: { p1: number; p2: number };
  dateScheduled: string;
  status: SnookerMatchStatus;
  stage: string;
  stageType?: SnookerStageType;
  groupId?: string;
  round?: number;
  order?: number;
  winnerId?: string;
}

export interface ISnookerGroup {
  id: string;
  name: string;
  players: ISnookerPlayer[];
}

export interface ISnookerLeagueData {
  seasonName: string;
  groups: ISnookerGroup[];
  matches: ISnookerMatch[];
  competitionStatus?: SnookerCompetitionStatus;
  registrationOpen?: boolean;
  registrationFee?: number;
}

export type SnookerCompetitionStatus =
  | 'registration'
  | 'group_stage'
  | 'knockout'
  | 'completed';

export interface ISnookerCompetition {
  id: string;
  name: string;
  season: string;
  status: SnookerCompetitionStatus;
  groupSize: number;
  knockoutSize: number;
  registrationFee: number;
  groups: Array<{ id: string; name: string; playerIds: string[] }>;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISnookerStandingRow {
  playerId: string;
  playerName: string;
  groupId: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  frameDifference: number;
}

export interface ISnookerCompetitionState {
  competition: ISnookerCompetition | null;
  players: PaginatedResponse<ISnookerPlayer>;
  groups: Array<{ id: string; name: string; playerIds: string[] }>;
  standings: Record<string, ISnookerStandingRow[]>;
  matches: PaginatedResponse<ISnookerMatch>;
  knockoutRounds: Array<{ round: number; label: string; matches: ISnookerMatch[] }>;
}

export interface ICreateSnookerCompetitionDto {
  name: string;
  season?: string;
  groupSize?: number;
  registrationFee?: number;
}

export interface IGenerateSnookerGroupsDto {
  groupSize?: number;
}

export interface IRecordSnookerResultDto {
  p1: number;
  p2: number;
}

export interface ICreatePublicSnookerRegistrationDto extends ISnookerPlayerRegistration {
  callbackUrl?: string;
}

export interface ISnookerRegistrationResponse {
  player: ISnookerPlayer;
  paymentData?: IPaymentInitializationData;
}
