import { inject, injectable } from 'tsyringe';
import {
  ICreateSnookerCompetitionDto,
  IGenerateSnookerGroupsDto,
  IRecordSnookerResultDto,
  ISnookerCompetition,
  ISnookerCompetitionState,
  ISnookerLeagueData,
  ISnookerMatch,
  ISnookerPlayer,
  ISnookerStandingRow,
  PaginatedResponse,
} from '@teddy-city-hotels/shared-interfaces';
import { BadRequestError, NotFoundError } from '../errors/http-errors';
import { FirestoreService } from './firestore.service';

type PagingParams = { page: number; pageSize: number; search?: string };

@injectable()
export class SnookerService {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private getCompetitionRef() {
    return this.firestore.db.collection('snookerCompetition').doc('current');
  }

  private getPlayersCollection() {
    return this.firestore.db.collection('snookerPlayers');
  }

  private getMatchesCollection() {
    return this.firestore.db.collection('snookerMatches');
  }

  private normalizePaging(input?: Partial<PagingParams>): PagingParams {
    return {
      page: input?.page && Number.isFinite(input.page) ? Math.max(1, input.page) : 1,
      pageSize:
        input?.pageSize && Number.isFinite(input.pageSize)
          ? Math.min(100, Math.max(1, input.pageSize))
          : 12,
      search: input?.search?.trim() || undefined,
    };
  }

  private paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      data: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  private toRoundLabel(participantsCount: number): string {
    if (participantsCount <= 2) return 'Final';
    if (participantsCount === 4) return 'Semi Final';
    if (participantsCount === 8) return 'Quarter Final';
    if (participantsCount === 16) return 'Round of 16';
    return `Round of ${participantsCount}`;
  }

  private clampGroupSize(groupSize?: number): number {
    if (!groupSize || !Number.isFinite(groupSize)) return 4;
    return Math.min(8, Math.max(2, Math.round(groupSize)));
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let idx = copy.length - 1; idx > 0; idx -= 1) {
      const swapWith = Math.floor(Math.random() * (idx + 1));
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
    }
    return copy;
  }

  private async clearCollection(collection: FirebaseFirestore.CollectionReference): Promise<void> {
    while (true) {
      const snapshot = await collection.limit(200).get();
      if (snapshot.empty) {
        break;
      }

      const batch = this.firestore.db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  private async requireCompetition(): Promise<ISnookerCompetition> {
    const doc = await this.getCompetitionRef().get();
    if (!doc.exists) {
      throw new BadRequestError('Create a competition first.');
    }
    return { id: doc.id, ...doc.data() } as ISnookerCompetition;
  }

  private async getAllPlayers(): Promise<ISnookerPlayer[]> {
    const snapshot = await this.getPlayersCollection().orderBy('fullName').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISnookerPlayer));
  }

  private async getAllMatches(): Promise<ISnookerMatch[]> {
    const snapshot = await this.getMatchesCollection().orderBy('dateScheduled', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISnookerMatch));
  }

  private computeStandings(
    players: ISnookerPlayer[],
    matches: ISnookerMatch[],
    groups: Array<{ id: string; name: string; playerIds: string[] }>
  ): Record<string, ISnookerStandingRow[]> {
    const baseMap = new Map<string, ISnookerStandingRow>();

    for (const player of players) {
      if (!player.groupId) continue;
      baseMap.set(player.id, {
        playerId: player.id,
        playerName: player.fullName,
        groupId: player.groupId,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        frameDifference: 0,
      });
    }

    for (const match of matches) {
      if (match.stageType !== 'group' || match.status !== 'Completed' || !match.score) continue;
      const p1 = baseMap.get(match.player1.id);
      const p2 = baseMap.get(match.player2.id);
      if (!p1 || !p2) continue;

      p1.played += 1;
      p2.played += 1;
      p1.frameDifference += match.score.p1 - match.score.p2;
      p2.frameDifference += match.score.p2 - match.score.p1;

      if (match.score.p1 > match.score.p2) {
        p1.won += 1;
        p2.lost += 1;
        p1.points += 3;
      } else if (match.score.p2 > match.score.p1) {
        p2.won += 1;
        p1.lost += 1;
        p2.points += 3;
      }
    }

    const standings: Record<string, ISnookerStandingRow[]> = {};
    for (const group of groups) {
      const rows = group.playerIds
        .map((playerId) => baseMap.get(playerId))
        .filter((row): row is ISnookerStandingRow => !!row)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.won !== a.won) return b.won - a.won;
          if (b.frameDifference !== a.frameDifference) return b.frameDifference - a.frameDifference;
          return a.playerName.localeCompare(b.playerName);
        });
      standings[group.id] = rows;
    }

    return standings;
  }

  private async maybeAdvanceKnockout(comp: ISnookerCompetition): Promise<void> {
    const matches = (await this.getAllMatches()).filter((match) => match.stageType === 'knockout');
    if (!matches.length) return;

    const grouped = new Map<number, ISnookerMatch[]>();
    for (const match of matches) {
      const round = match.round || 1;
      const list = grouped.get(round) || [];
      list.push(match);
      grouped.set(round, list);
    }

    const sortedRounds = Array.from(grouped.keys()).sort((a, b) => a - b);
    const latestRound = sortedRounds[sortedRounds.length - 1];
    if (!latestRound) return;

    const latestRoundMatches = (grouped.get(latestRound) || []).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const allLatestCompleted = latestRoundMatches.every((match) => match.status === 'Completed');
    if (!allLatestCompleted) return;

    const winners = latestRoundMatches
      .map((match) => {
        const winnerId = match.winnerId || (match.score && match.score.p1 > match.score.p2 ? match.player1.id : match.player2.id);
        const winnerName = winnerId === match.player1.id ? match.player1.name : match.player2.name;
        return winnerId ? { id: winnerId, name: winnerName } : null;
      })
      .filter((row): row is { id: string; name: string } => !!row);

    if (winners.length === 1) {
      await this.getCompetitionRef().set(
        {
          status: 'completed',
          winnerId: winners[0].id,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return;
    }

    const nextRound = latestRound + 1;
    const hasNextRound = grouped.has(nextRound);
    if (hasNextRound) return;

    const nextRoundParticipants = winners.length;
    const stageLabel = this.toRoundLabel(nextRoundParticipants);
    const batch = this.firestore.db.batch();

    for (let idx = 0; idx < winners.length; idx += 2) {
      const p1 = winners[idx];
      const p2 = winners[idx + 1];
      if (!p1 || !p2) continue;

      const ref = this.getMatchesCollection().doc();
      const match: ISnookerMatch = {
        id: ref.id,
        player1: p1,
        player2: p2,
        dateScheduled: new Date().toISOString(),
        status: 'Scheduled',
        stage: stageLabel,
        stageType: 'knockout',
        round: nextRound,
        order: idx / 2,
      };
      batch.set(ref, match);
    }

    await batch.commit();
    await this.getCompetitionRef().set(
      {
        status: 'knockout',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  async getCompetitionState(input?: {
    playersPage?: number;
    playersPageSize?: number;
    playersSearch?: string;
    matchesPage?: number;
    matchesPageSize?: number;
  }): Promise<ISnookerCompetitionState> {
    const competitionDoc = await this.getCompetitionRef().get();
    const competition = competitionDoc.exists
      ? ({ id: competitionDoc.id, ...competitionDoc.data() } as ISnookerCompetition)
      : null;

    const [players, matches] = await Promise.all([this.getAllPlayers(), this.getAllMatches()]);
    const groups = competition?.groups || [];
    const standings = this.computeStandings(players, matches, groups);

    const playersPaging = this.normalizePaging({
      page: input?.playersPage,
      pageSize: input?.playersPageSize,
      search: input?.playersSearch,
    });
    const matchesPaging = this.normalizePaging({
      page: input?.matchesPage,
      pageSize: input?.matchesPageSize,
    });

    const filteredPlayers = playersPaging.search
      ? players.filter((player) => {
          const search = playersPaging.search as string;
          return (
            player.fullName.toLowerCase().includes(search.toLowerCase()) ||
            player.email.toLowerCase().includes(search.toLowerCase()) ||
            player.phoneNumber.toLowerCase().includes(search.toLowerCase())
          );
        })
      : players;

    const playersPage = this.paginate(filteredPlayers, playersPaging.page, playersPaging.pageSize);
    const matchesPage = this.paginate(matches, matchesPaging.page, matchesPaging.pageSize);

    const knockoutMap = new Map<number, ISnookerMatch[]>();
    matches
      .filter((match) => match.stageType === 'knockout')
      .forEach((match) => {
        const round = match.round || 1;
        const list = knockoutMap.get(round) || [];
        list.push(match);
        knockoutMap.set(round, list);
      });

    const knockoutRounds = Array.from(knockoutMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, roundMatches]) => ({
        round,
        label: this.toRoundLabel(roundMatches.length * 2),
        matches: [...roundMatches].sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));

    return {
      competition,
      players: playersPage,
      groups,
      standings,
      matches: matchesPage,
      knockoutRounds,
    };
  }

  async createCompetition(dto: ICreateSnookerCompetitionDto): Promise<ISnookerCompetitionState> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestError('Competition name is required.');
    }

    const now = new Date().toISOString();
    const groupSize = this.clampGroupSize(dto.groupSize);
    const competition: ISnookerCompetition = {
      id: 'current',
      name,
      season: dto.season?.trim() || `${new Date().getFullYear()}`,
      status: 'registration',
      groupSize,
      knockoutSize: 0,
      groups: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.clearCollection(this.getPlayersCollection());
    await this.clearCollection(this.getMatchesCollection());
    await this.getCompetitionRef().set(competition);

    return this.getCompetitionState();
  }

  async generateGroups(dto: IGenerateSnookerGroupsDto): Promise<ISnookerCompetitionState> {
    const competition = await this.requireCompetition();
    if (competition.status !== 'registration') {
      throw new BadRequestError('Group generation is only allowed during registration.');
    }

    const players = await this.getAllPlayers();
    if (players.length < 4) {
      throw new BadRequestError('At least 4 registered players are required.');
    }

    const groupSize = this.clampGroupSize(dto.groupSize || competition.groupSize);
    const shuffled = this.shuffle(players);
    const groupCount = Math.ceil(shuffled.length / groupSize);
    const groups = Array.from({ length: groupCount }).map((_, idx) => {
      const letter = String.fromCharCode(65 + idx);
      return {
        id: `group-${letter.toLowerCase()}`,
        name: `Group ${letter}`,
        playerIds: [] as string[],
      };
    });

    shuffled.forEach((player, index) => {
      groups[index % groupCount].playerIds.push(player.id);
    });

    const batch = this.firestore.db.batch();
    for (const group of groups) {
      for (const playerId of group.playerIds) {
        const ref = this.getPlayersCollection().doc(playerId);
        batch.set(
          ref,
          {
            groupId: group.id,
            groupName: group.name,
            stats: {
              played: 0,
              won: 0,
              lost: 0,
              points: 0,
              frameDifference: 0,
            },
          },
          { merge: true }
        );
      }
    }
    await batch.commit();

    await this.clearCollection(this.getMatchesCollection());

    const playerMap = new Map(players.map((player) => [player.id, player]));
    const matchBatch = this.firestore.db.batch();
    let order = 0;
    for (const group of groups) {
      for (let i = 0; i < group.playerIds.length; i += 1) {
        for (let j = i + 1; j < group.playerIds.length; j += 1) {
          const p1 = playerMap.get(group.playerIds[i]);
          const p2 = playerMap.get(group.playerIds[j]);
          if (!p1 || !p2) continue;

          const ref = this.getMatchesCollection().doc();
          const match: ISnookerMatch = {
            id: ref.id,
            player1: { id: p1.id, name: p1.fullName },
            player2: { id: p2.id, name: p2.fullName },
            dateScheduled: new Date().toISOString(),
            status: 'Scheduled',
            stage: group.name,
            stageType: 'group',
            groupId: group.id,
            round: 1,
            order,
          };
          order += 1;
          matchBatch.set(ref, match);
        }
      }
    }
    await matchBatch.commit();

    await this.getCompetitionRef().set(
      {
        status: 'group_stage',
        groupSize,
        groups,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return this.getCompetitionState();
  }

  async startKnockoutStage(): Promise<ISnookerCompetitionState> {
    const competition = await this.requireCompetition();
    if (competition.status !== 'group_stage') {
      throw new BadRequestError('Knockout stage can only start after group stage.');
    }

    const matches = await this.getAllMatches();
    const groupMatches = matches.filter((match) => match.stageType === 'group');
    if (!groupMatches.length) {
      throw new BadRequestError('Generate groups and group fixtures first.');
    }

    if (groupMatches.some((match) => match.status !== 'Completed')) {
      throw new BadRequestError('All group matches must be completed before knockout stage.');
    }

    const players = await this.getAllPlayers();
    const standings = this.computeStandings(players, matches, competition.groups || []);

    const winners = Object.values(standings)
      .map((rows) => rows[0])
      .filter((row): row is ISnookerStandingRow => !!row);
    const runners = Object.values(standings)
      .map((rows) => rows[1])
      .filter((row): row is ISnookerStandingRow => !!row);

    const pool = [...winners, ...runners];
    if (pool.length < 2) {
      throw new BadRequestError('Not enough qualified players to start knockout stage.');
    }

    let knockoutSize = 1;
    while (knockoutSize * 2 <= pool.length) {
      knockoutSize *= 2;
    }
    if (knockoutSize < 2) {
      throw new BadRequestError('Unable to create a valid knockout bracket.');
    }

    const qualified = pool.slice(0, knockoutSize);
    const qualifiedPlayers = qualified
      .map((row) => players.find((player) => player.id === row.playerId))
      .filter((player): player is ISnookerPlayer => !!player);

    if (qualifiedPlayers.length < 2) {
      throw new BadRequestError('Qualified player records are incomplete.');
    }

    const stage = this.toRoundLabel(qualifiedPlayers.length);
    const batch = this.firestore.db.batch();
    let order = 0;

    for (let i = 0; i < qualifiedPlayers.length / 2; i += 1) {
      const p1 = qualifiedPlayers[i];
      const p2 = qualifiedPlayers[qualifiedPlayers.length - 1 - i];
      const ref = this.getMatchesCollection().doc();

      const match: ISnookerMatch = {
        id: ref.id,
        player1: { id: p1.id, name: p1.fullName },
        player2: { id: p2.id, name: p2.fullName },
        dateScheduled: new Date().toISOString(),
        status: 'Scheduled',
        stage,
        stageType: 'knockout',
        round: 1,
        order,
      };
      order += 1;
      batch.set(ref, match);
    }

    await batch.commit();
    await this.getCompetitionRef().set(
      {
        status: 'knockout',
        knockoutSize: qualifiedPlayers.length,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return this.getCompetitionState();
  }

  async recordMatchResult(matchId: string, dto: IRecordSnookerResultDto): Promise<ISnookerCompetitionState> {
    if (!Number.isFinite(dto.p1) || !Number.isFinite(dto.p2)) {
      throw new BadRequestError('Both score values must be numbers.');
    }
    if (dto.p1 < 0 || dto.p2 < 0 || dto.p1 === dto.p2) {
      throw new BadRequestError('Scores must be non-negative and cannot be tied.');
    }

    const competition = await this.requireCompetition();
    const matchRef = this.getMatchesCollection().doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
      throw new NotFoundError('Match not found.');
    }

    const match = { id: matchDoc.id, ...matchDoc.data() } as ISnookerMatch;
    if (match.status === 'Completed') {
      throw new BadRequestError('This match is already completed.');
    }

    const winnerId = dto.p1 > dto.p2 ? match.player1.id : match.player2.id;
    await matchRef.set(
      {
        score: { p1: Math.round(dto.p1), p2: Math.round(dto.p2) },
        winnerId,
        status: 'Completed',
      },
      { merge: true }
    );

    if (match.stageType === 'group') {
      const p1Ref = this.getPlayersCollection().doc(match.player1.id);
      const p2Ref = this.getPlayersCollection().doc(match.player2.id);
      const [p1Doc, p2Doc] = await Promise.all([p1Ref.get(), p2Ref.get()]);

      const p1 = p1Doc.exists ? (p1Doc.data() as ISnookerPlayer) : null;
      const p2 = p2Doc.exists ? (p2Doc.data() as ISnookerPlayer) : null;

      if (p1 && p2) {
        const p1Stats = p1.stats || { played: 0, won: 0, lost: 0, points: 0, frameDifference: 0 };
        const p2Stats = p2.stats || { played: 0, won: 0, lost: 0, points: 0, frameDifference: 0 };

        const p1Won = dto.p1 > dto.p2;
        await Promise.all([
          p1Ref.set(
            {
              stats: {
                played: p1Stats.played + 1,
                won: p1Stats.won + (p1Won ? 1 : 0),
                lost: p1Stats.lost + (p1Won ? 0 : 1),
                points: p1Stats.points + (p1Won ? 3 : 0),
                frameDifference: (p1Stats.frameDifference || 0) + (dto.p1 - dto.p2),
              },
            },
            { merge: true }
          ),
          p2Ref.set(
            {
              stats: {
                played: p2Stats.played + 1,
                won: p2Stats.won + (p1Won ? 0 : 1),
                lost: p2Stats.lost + (p1Won ? 1 : 0),
                points: p2Stats.points + (p1Won ? 0 : 3),
                frameDifference: (p2Stats.frameDifference || 0) + (dto.p2 - dto.p1),
              },
            },
            { merge: true }
          ),
        ]);
      }
    } else if (match.stageType === 'knockout' && competition.status === 'knockout') {
      await this.maybeAdvanceKnockout(competition);
    }

    return this.getCompetitionState();
  }

  async getLeagueData(): Promise<ISnookerLeagueData> {
    const state = await this.getCompetitionState({
      playersPage: 1,
      playersPageSize: 1000,
      matchesPage: 1,
      matchesPageSize: 1000,
    });

    const groupMap = new Map<string, ISnookerPlayer[]>();
    for (const player of state.players.data) {
      const key = player.groupName || player.skillLevel || 'Unassigned';
      const list = groupMap.get(key) || [];
      list.push(player);
      groupMap.set(key, list);
    }

    const groups = Array.from(groupMap.entries()).map(([name, players], idx) => ({
      id: `${idx + 1}`,
      name,
      players,
    }));

    return {
      seasonName: state.competition?.name || `Teddy City Open ${new Date().getFullYear()}`,
      groups,
      matches: state.matches.data,
    };
  }

  async getPlayers(): Promise<ISnookerPlayer[]> {
    return this.getAllPlayers();
  }

  async getPlayersPaginated(params: PagingParams): Promise<PaginatedResponse<ISnookerPlayer>> {
    const paging = this.normalizePaging(params);
    const players = await this.getAllPlayers();
    const filtered = paging.search
      ? players.filter((player) => {
          const search = (paging.search || '').toLowerCase();
          return (
            player.fullName.toLowerCase().includes(search) ||
            player.email.toLowerCase().includes(search) ||
            player.phoneNumber.toLowerCase().includes(search)
          );
        })
      : players;

    return this.paginate(filtered, paging.page, paging.pageSize);
  }

  async getPlayerById(playerId: string): Promise<ISnookerPlayer> {
    const doc = await this.getPlayersCollection().doc(playerId).get();
    if (!doc.exists) {
      throw new NotFoundError('Player not found');
    }
    return { id: doc.id, ...doc.data() } as ISnookerPlayer;
  }

  async createPlayer(player: ISnookerPlayer): Promise<ISnookerPlayer> {
    const competition = await this.requireCompetition();
    if (competition.status !== 'registration') {
      throw new BadRequestError('Player registration is only open during registration stage.');
    }

    const ref = this.getPlayersCollection().doc();
    const payload: ISnookerPlayer = {
      ...player,
      id: ref.id,
      registeredAt: player.registeredAt || new Date().toISOString(),
      isPaid: player.isPaid ?? false,
      stats: player.stats || { played: 0, won: 0, lost: 0, points: 0, frameDifference: 0 },
      groupId: '',
      groupName: '',
    };
    await ref.set(payload);
    return payload;
  }

  async updatePlayer(playerId: string, player: Partial<ISnookerPlayer>): Promise<ISnookerPlayer> {
    const competition = await this.requireCompetition();
    if (competition.status !== 'registration') {
      throw new BadRequestError('Player update is only allowed during registration stage.');
    }
    await this.getPlayerById(playerId);
    await this.getPlayersCollection().doc(playerId).set(player, { merge: true });
    return this.getPlayerById(playerId);
  }

  async deletePlayer(playerId: string): Promise<void> {
    const competition = await this.requireCompetition();
    if (competition.status !== 'registration') {
      throw new BadRequestError('Player removal is only allowed during registration stage.');
    }

    await this.getPlayerById(playerId);
    await this.getPlayersCollection().doc(playerId).delete();
  }

  async getMatches(): Promise<ISnookerMatch[]> {
    return this.getAllMatches();
  }

  async getMatchesPaginated(params: PagingParams): Promise<PaginatedResponse<ISnookerMatch>> {
    const paging = this.normalizePaging(params);
    const matches = await this.getAllMatches();
    return this.paginate(matches, paging.page, paging.pageSize);
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

