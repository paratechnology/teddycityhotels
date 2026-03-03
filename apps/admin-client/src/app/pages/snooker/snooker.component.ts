import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ICreateSnookerCompetitionDto,
  IGenerateSnookerGroupsDto,
  ISnookerCompetition,
  ISnookerCompetitionState,
  ISnookerMatch,
  ISnookerPlayer,
  ISnookerStandingRow,
} from '@teddy-city-hotels/shared-interfaces';
import { SnookerService } from '../../services/snooker.service';

@Component({
  selector: 'app-snooker',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './snooker.component.html',
  styleUrls: ['./snooker.component.scss'],
})
export class SnookerComponent implements OnInit {
  competition: ISnookerCompetition | null = null;
  players: ISnookerPlayer[] = [];
  matches: ISnookerMatch[] = [];
  groups: Array<{ id: string; name: string; playerIds: string[] }> = [];
  standings: Record<string, ISnookerStandingRow[]> = {};
  knockoutRounds: Array<{ round: number; label: string; matches: ISnookerMatch[] }> = [];

  loading = false;
  competitionBusy = false;
  registrationBusy = false;
  resultBusy = false;

  error = '';
  info = '';

  activeTab: 'overview' | 'players' | 'fixtures' | 'stages' = 'overview';
  showCompetitionModal = false;
  showPlayerModal = false;

  playersPage = 1;
  playersPageSize = 12;
  playersTotal = 0;
  playersSearch = '';

  matchesPage = 1;
  matchesPageSize = 12;
  matchesTotal = 0;

  resultDrafts: Record<string, { p1: number | null; p2: number | null }> = {};

  competitionForm: FormGroup;
  playerForm: FormGroup;
  groupForm: FormGroup;

  constructor(private snookerService: SnookerService, private fb: FormBuilder) {
    this.competitionForm = this.fb.group({
      name: ['', Validators.required],
      season: [new Date().getFullYear().toString()],
      groupSize: [4, [Validators.required, Validators.min(2), Validators.max(8)]],
    });

    this.playerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      nickname: [''],
      skillLevel: ['Beginner' as ISnookerPlayer['skillLevel'], Validators.required],
      isPaid: [true],
    });

    this.groupForm = this.fb.group({
      groupSize: [4, [Validators.required, Validators.min(2), Validators.max(8)]],
    });
  }

  ngOnInit(): void {
    this.loadState();
  }

  get totalPlayersPages(): number {
    return Math.max(1, Math.ceil(this.playersTotal / this.playersPageSize));
  }

  get totalMatchesPages(): number {
    return Math.max(1, Math.ceil(this.matchesTotal / this.matchesPageSize));
  }

  get statusLabel(): string {
    if (!this.competition) return 'No active competition';
    if (this.competition.status === 'registration') return 'Registration';
    if (this.competition.status === 'group_stage') return 'Group Stage';
    if (this.competition.status === 'knockout') return 'Knockout Stage';
    if (this.competition.status === 'completed') return 'Completed';
    return this.competition.status;
  }

  get canRegisterPlayers(): boolean {
    return this.competition?.status === 'registration';
  }

  get canGenerateGroups(): boolean {
    return this.canRegisterPlayers && this.playersTotal >= 4;
  }

  get canStartKnockout(): boolean {
    return this.competition?.status === 'group_stage';
  }

  get groupIds(): string[] {
    return this.groups.map((group) => group.id);
  }

  getGroupName(groupId: string): string {
    return this.groups.find((group) => group.id === groupId)?.name || groupId;
  }

  resolvePlayerName(playerId?: string): string {
    if (!playerId) return '-';
    const fromPlayers = this.players.find((row) => row.id === playerId)?.fullName;
    if (fromPlayers) return fromPlayers;

    for (const match of this.matches) {
      if (match.player1.id === playerId) return match.player1.name;
      if (match.player2.id === playerId) return match.player2.name;
    }

    for (const rows of Object.values(this.standings)) {
      const row = rows.find((entry) => entry.playerId === playerId);
      if (row) return row.playerName;
    }

    return playerId;
  }

  openCompetitionModal(): void {
    this.showCompetitionModal = true;
    this.competitionForm.reset({
      name: '',
      season: new Date().getFullYear().toString(),
      groupSize: this.competition?.groupSize || 4,
    });
  }

  closeCompetitionModal(): void {
    this.showCompetitionModal = false;
  }

  openPlayerModal(): void {
    if (!this.canRegisterPlayers) {
      this.error = 'Player registration is only available during registration stage.';
      return;
    }

    this.playerForm.reset({
      fullName: '',
      email: '',
      phoneNumber: '',
      nickname: '',
      skillLevel: 'Beginner',
      isPaid: true,
    });
    this.showPlayerModal = true;
  }

  closePlayerModal(): void {
    this.showPlayerModal = false;
  }

  private applyState(state: ISnookerCompetitionState): void {
    this.competition = state.competition;
    this.players = state.players.data;
    this.playersTotal = state.players.total;
    this.playersPage = state.players.page;
    this.playersPageSize = state.players.pageSize;

    this.matches = state.matches.data;
    this.matchesTotal = state.matches.total;
    this.matchesPage = state.matches.page;
    this.matchesPageSize = state.matches.pageSize;

    this.groups = state.groups || [];
    this.standings = state.standings || {};
    this.knockoutRounds = state.knockoutRounds || [];

    if (state.competition?.groupSize) {
      this.groupForm.patchValue({ groupSize: state.competition.groupSize });
    }
  }

  loadState(): void {
    this.loading = true;
    this.error = '';

    this.snookerService
      .getCompetitionState({
        playersPage: this.playersPage,
        playersPageSize: this.playersPageSize,
        playersSearch: this.playersSearch,
        matchesPage: this.matchesPage,
        matchesPageSize: this.matchesPageSize,
      })
      .subscribe({
        next: (state) => {
          this.applyState(state);
          this.loading = false;
        },
        error: (error: { error?: { message?: string } }) => {
          this.error = error?.error?.message || 'Failed to load snooker competition state.';
          this.loading = false;
        },
      });
  }

  createCompetition(): void {
    if (this.competitionForm.invalid) {
      this.competitionForm.markAllAsTouched();
      return;
    }

    this.competitionBusy = true;
    this.error = '';
    this.info = '';

    const value = this.competitionForm.getRawValue();
    const payload: ICreateSnookerCompetitionDto = {
      name: value['name'] || '',
      season: value['season'] || undefined,
      groupSize: Number(value['groupSize']) || 4,
    };

    this.snookerService.createCompetition(payload).subscribe({
      next: (state) => {
        this.playersSearch = '';
        this.playersPage = 1;
        this.matchesPage = 1;
        this.applyState(state);
        this.competitionBusy = false;
        this.showCompetitionModal = false;
        this.activeTab = 'overview';
        this.info = 'Snooker competition created. Player registration is now open.';
      },
      error: (error: { error?: { message?: string } }) => {
        this.competitionBusy = false;
        this.error = error?.error?.message || 'Failed to create competition.';
      },
    });
  }

  registerPlayer(): void {
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      return;
    }

    if (!this.canRegisterPlayers) {
      this.error = 'Player registration is only available during registration stage.';
      return;
    }

    this.registrationBusy = true;
    this.error = '';
    this.info = '';

    const value = this.playerForm.getRawValue();
    const payload: ISnookerPlayer = {
      id: '',
      fullName: value['fullName'] || '',
      email: value['email'] || '',
      phoneNumber: value['phoneNumber'] || '',
      nickname: value['nickname'] || undefined,
      skillLevel: value['skillLevel'] || 'Beginner',
      registeredAt: new Date().toISOString(),
      isPaid: !!value['isPaid'],
      stats: { played: 0, won: 0, lost: 0, points: 0, frameDifference: 0 },
    };

    this.snookerService.registerPlayer(payload).subscribe({
      next: () => {
        this.registrationBusy = false;
        this.showPlayerModal = false;
        this.playerForm.reset({
          fullName: '',
          email: '',
          phoneNumber: '',
          nickname: '',
          skillLevel: 'Beginner',
          isPaid: true,
        });
        this.playersPage = 1;
        this.loadState();
      },
      error: (error: { error?: { message?: string } }) => {
        this.registrationBusy = false;
        this.error = error?.error?.message || 'Failed to register player.';
      },
    });
  }

  deletePlayer(id: string): void {
    if (!this.canRegisterPlayers) {
      this.error = 'Players can only be removed during registration stage.';
      return;
    }

    this.snookerService.deletePlayer(id).subscribe({
      next: () => {
        if (this.players.length === 1 && this.playersPage > 1) {
          this.playersPage -= 1;
        }
        this.loadState();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error?.error?.message || 'Failed to delete player.';
      },
    });
  }

  generateGroups(): void {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }
    if (!this.canGenerateGroups) {
      this.error = 'At least 4 players are required before generating groups.';
      return;
    }

    this.competitionBusy = true;
    this.error = '';
    this.info = '';

    const value = this.groupForm.getRawValue();
    const payload: IGenerateSnookerGroupsDto = {
      groupSize: Number(value['groupSize']) || this.competition?.groupSize || 4,
    };

    this.snookerService.generateGroups(payload).subscribe({
      next: (state) => {
        this.competitionBusy = false;
        this.matchesPage = 1;
        this.applyState(state);
        this.activeTab = 'stages';
        this.info = 'Groups and qualifying fixtures generated successfully.';
      },
      error: (error: { error?: { message?: string } }) => {
        this.competitionBusy = false;
        this.error = error?.error?.message || 'Failed to generate groups.';
      },
    });
  }

  startKnockoutStage(): void {
    if (!this.canStartKnockout) {
      this.error = 'Knockout can only start after group stage is active.';
      return;
    }

    this.competitionBusy = true;
    this.error = '';
    this.info = '';

    this.snookerService.startKnockoutStage().subscribe({
      next: (state) => {
        this.competitionBusy = false;
        this.matchesPage = 1;
        this.applyState(state);
        this.activeTab = 'stages';
        this.info = 'Knockout bracket generated from group qualifiers.';
      },
      error: (error: { error?: { message?: string } }) => {
        this.competitionBusy = false;
        this.error = error?.error?.message || 'Failed to start knockout stage.';
      },
    });
  }

  getDraft(matchId: string): { p1: number | null; p2: number | null } {
    if (!this.resultDrafts[matchId]) {
      this.resultDrafts[matchId] = { p1: null, p2: null };
    }
    return this.resultDrafts[matchId];
  }

  submitResult(match: ISnookerMatch): void {
    if (this.resultBusy) return;

    const draft = this.getDraft(match.id);
    const p1 = Number(draft.p1);
    const p2 = Number(draft.p2);
    if (!Number.isFinite(p1) || !Number.isFinite(p2) || p1 < 0 || p2 < 0 || p1 === p2) {
      this.error = 'Scores must be non-negative numbers and cannot be tied.';
      return;
    }

    this.resultBusy = true;
    this.error = '';
    this.info = '';

    this.snookerService.recordMatchResult(match.id, { p1, p2 }).subscribe({
      next: (state) => {
        this.resultBusy = false;
        this.applyState(state);
        this.resultDrafts[match.id] = { p1: null, p2: null };
      },
      error: (error: { error?: { message?: string } }) => {
        this.resultBusy = false;
        this.error = error?.error?.message || 'Failed to save match result.';
      },
    });
  }

  searchPlayers(): void {
    this.playersPage = 1;
    this.loadState();
  }

  clearPlayerSearch(): void {
    this.playersSearch = '';
    this.playersPage = 1;
    this.loadState();
  }

  goToPlayersPage(page: number): void {
    if (page < 1 || page > this.totalPlayersPages || page === this.playersPage) return;
    this.playersPage = page;
    this.loadState();
  }

  goToMatchesPage(page: number): void {
    if (page < 1 || page > this.totalMatchesPages || page === this.matchesPage) return;
    this.matchesPage = page;
    this.loadState();
  }
}
