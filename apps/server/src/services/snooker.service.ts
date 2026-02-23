import { injectable } from 'tsyringe';
import { ISnookerLeagueData, ISnookerPlayer, ISnookerMatch } from '@teddy-city-hotels/shared-interfaces';
import { NotFoundError } from '../errors/http-errors';

const dummyPlayers: ISnookerPlayer[] = [
    { id: '1', fullName: 'Ronnie O'Sullivan', email: 'ronnie@example.com', phoneNumber: '123', isPaid: true, registeredAt: new Date().toISOString(), skillLevel: 'Pro', stats: { played: 0, won: 0, lost: 0, points: 0 } },
    { id: '2', fullName: 'Judd Trump', email: 'judd@example.com', phoneNumber: '123', isPaid: true, registeredAt: new Date().toISOString(), skillLevel: 'Pro', stats: { played: 0, won: 0, lost: 0, points: 0 } },
];

const dummyMatches: ISnookerMatch[] = [
    { id: '1', player1: { id: '1', name: 'Ronnie O'Sullivan' }, player2: { id: '2', name: 'Judd Trump' }, dateScheduled: new Date().toISOString(), status: 'Scheduled', stage: 'Final' }
];

const dummyLeagueData: ISnookerLeagueData = {
    seasonName: 'Teddy City Open 2026',
    groups: [
        { id: 'A', name: 'Group A', players: dummyPlayers }
    ],
    matches: dummyMatches,
};


@injectable()
export class SnookerService {
  
  async getLeagueData(): Promise<ISnookerLeagueData> {
    return Promise.resolve(dummyLeagueData);
  }

  async getPlayers(): Promise<ISnookerPlayer[]> {
    return Promise.resolve(dummyPlayers);
  }

  async getPlayerById(playerId: string): Promise<ISnookerPlayer> {
    const player = dummyPlayers.find(p => p.id === playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }
    return Promise.resolve(player);
  }

  async updatePlayer(playerId: string, player: ISnookerPlayer): Promise<ISnookerPlayer> {
    const index = dummyPlayers.findIndex(p => p.id === playerId);
    if (index === -1) {
        throw new NotFoundError('Player not found');
    }
    dummyPlayers[index] = { ...dummyPlayers[index], ...player };
    return Promise.resolve(dummyPlayers[index]);
  }

  async getMatches(): Promise<ISnookerMatch[]> {
    return Promise.resolve(dummyMatches);
  }

    async updateMatch(matchId: string, match: ISnookerMatch): Promise<ISnookerMatch> {
        const index = dummyMatches.findIndex(m => m.id === matchId);
        if (index === -1) {
            throw new NotFoundError('Match not found');
        }
        dummyMatches[index] = { ...dummyMatches[index], ...match };
        return Promise.resolve(dummyMatches[index]);
    }
}
