import { injectable, inject } from 'tsyringe';
import { ISnookerLeagueData, ISnookerMatch, ISnookerPlayer } from '@teddy-city-hotels/shared-interfaces';
import { NotFoundError } from '../errors/http-errors';
import { FirestoreService } from './firestore.service';

@injectable()
export class SnookerService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getPlayersCollection() {
    return this.firestore.db.collection('snookerPlayers');
  }

  private getMatchesCollection() {
    return this.firestore.db.collection('snookerMatches');
  }

  async getLeagueData(): Promise<ISnookerLeagueData> {
    const [players, matches] = await Promise.all([this.getPlayers(), this.getMatches()]);

    const grouped = new Map<string, ISnookerPlayer[]>();
    for (const player of players) {
      const key = player.skillLevel || 'Unassigned';
      const list = grouped.get(key) || [];
      list.push(player);
      grouped.set(key, list);
    }

    const groups = Array.from(grouped.entries()).map(([name, groupPlayers], idx) => ({
      id: `${idx + 1}`,
      name: `${name} Group`,
      players: groupPlayers,
    }));

    return {
      seasonName: `Teddy City Open ${new Date().getFullYear()}`,
      groups,
      matches,
    };
  }

  async getPlayers(): Promise<ISnookerPlayer[]> {
    const snapshot = await this.getPlayersCollection().orderBy('fullName').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISnookerPlayer));
  }

  async getPlayerById(playerId: string): Promise<ISnookerPlayer> {
    const doc = await this.getPlayersCollection().doc(playerId).get();
    if (!doc.exists) {
      throw new NotFoundError('Player not found');
    }
    return { id: doc.id, ...doc.data() } as ISnookerPlayer;
  }

  async createPlayer(player: ISnookerPlayer): Promise<ISnookerPlayer> {
    const ref = this.getPlayersCollection().doc();
    const payload: ISnookerPlayer = {
      ...player,
      id: ref.id,
      registeredAt: player.registeredAt || new Date().toISOString(),
      isPaid: player.isPaid ?? false,
      stats: player.stats || { played: 0, won: 0, lost: 0, points: 0 },
    };
    await ref.set(payload);
    return payload;
  }

  async updatePlayer(playerId: string, player: Partial<ISnookerPlayer>): Promise<ISnookerPlayer> {
    await this.getPlayerById(playerId);
    await this.getPlayersCollection().doc(playerId).set(player, { merge: true });
    return this.getPlayerById(playerId);
  }

  async deletePlayer(playerId: string): Promise<void> {
    await this.getPlayerById(playerId);
    await this.getPlayersCollection().doc(playerId).delete();
  }

  async getMatches(): Promise<ISnookerMatch[]> {
    const snapshot = await this.getMatchesCollection().orderBy('dateScheduled', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISnookerMatch));
  }

  async createMatch(match: ISnookerMatch): Promise<ISnookerMatch> {
    const ref = this.getMatchesCollection().doc();
    const payload: ISnookerMatch = {
      ...match,
      id: ref.id,
    };
    await ref.set(payload);
    return payload;
  }

  async updateMatch(matchId: string, match: Partial<ISnookerMatch>): Promise<ISnookerMatch> {
    const doc = await this.getMatchesCollection().doc(matchId).get();
    if (!doc.exists) {
      throw new NotFoundError('Match not found');
    }
    await this.getMatchesCollection().doc(matchId).set(match, { merge: true });
    const updated = await this.getMatchesCollection().doc(matchId).get();
    return { id: updated.id, ...updated.data() } as ISnookerMatch;
  }

  async deleteMatch(matchId: string): Promise<void> {
    const doc = await this.getMatchesCollection().doc(matchId).get();
    if (!doc.exists) {
      throw new NotFoundError('Match not found');
    }
    await this.getMatchesCollection().doc(matchId).delete();
  }
}
