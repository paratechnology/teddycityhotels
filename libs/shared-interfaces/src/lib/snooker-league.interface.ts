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
  stats?: {
    played: number;
    won: number;
    lost: number;
    points: number;
  };
}

export interface ISnookerMatch {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  score?: { p1: number; p2: number };
  dateScheduled: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Postponed';
  stage: string; // Group A, Semi-Final, etc.
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
}
