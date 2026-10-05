import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntypedFormControl } from '@angular/forms';
import { FacadeService } from 'app/shared/services/facade.service';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-club-view',
    templateUrl: './club-view.component.html',
})
export class ClubViewComponent implements OnInit, OnDestroy {

    clubId: string;
    club: any = null;
    isLoading: boolean = true;
    clubLogoError: boolean = false;

    // Stats
    totalMembers: number = 0;
    totalTournaments: number = 0;
    totalSingleRounds: number = 0;
    totalCourses: number = 0;
    totalRounds: number = 0;
    completedTournaments: number = 0;

    // Category breakdown
    categoryStats: { label: string; count: number; color: string }[] = [];

    // Active expandable panel: 'tournaments' | 'dailyRounds' | null
    activePanelTab: 'tournaments' | 'dailyRounds' | null = null;

    // ── Tournaments panel ─────────────────────────────────────────────────────
    tournamentList: any[] = [];
    tournamentsTotal: number = 0;
    tourPageSize: number = 10;
    tourPageIndex: number = 0;
    tourIsLoading: boolean = false;
    tourDisplayedColumns: string[] = ['index', 'title', 'course', 'format', 'rounds', 'date', 'status', 'action'];

    // ── Daily Rounds panel ────────────────────────────────────────────────────
    dailyRoundsList: any[] = [];
    dailyRoundsTotal: number = 0;
    drPageSize: number = 10;
    drPageIndex: number = 0;
    drIsLoading: boolean = false;
    drDisplayedColumns: string[] = ['index', 'title', 'course', 'format', 'date', 'status', 'action'];

    // ── Members table — server-side pagination ────────────────────────────────
    members: any[] = [];
    membersTotal: number = 0;
    pageSize: number = 15;
    pageIndex: number = 0;
    isMembersLoading: boolean = false;
    displayedColumns: string[] = ['index', 'name', 'category', 'handicap', 'membershipNumber', 'email', 'phone'];
    searchControl: UntypedFormControl = new UntypedFormControl('');

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private facadeService: FacadeService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private logger: LogsService,
    ) {}

    ngOnInit(): void {
        this.clubId = this.route.snapshot.paramMap.get('id');
        this.logger.log('Admin comes to Club View Page', "info", this.clubId);
        if (!this.clubId) {
            this.router.navigate(['/clubs']);
            return;
        }

        this.loadInitialData();

        this.searchControl.valueChanges.pipe(
            takeUntil(this.destroy$),
            debounceTime(400),
            distinctUntilChanged(),
        ).subscribe(() => {
            this.pageIndex = 0;
            this.loadMembers();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async loadInitialData(): Promise<void> {
        this.logger.log('Getting Club Data', "info", this.clubId);
        this.isLoading = true;
        try {
            const [clubsResult, statsResult, categoryResult, membersResult] = await Promise.all([
                this.facadeService.getClubList(),
                this.facadeService.getClubStatsByClubId(this.clubId),
                this.facadeService.getClubMemberAggregateByCategroy(this.clubId),
                this.facadeService.getClubMembersPaginated(this.clubId, this.pageSize, 0, ''),
            ]);

            // Club details
            const clubs: any[] = clubsResult?.club || [];
            this.club = clubs.find(c => c.id === this.clubId);
            if (!this.club) {
                this.logger.log('Club not found in Club View Page', "warn", this.clubId);
                this.snackBar.open('Club not found.', 'x', { duration: 3000 });
                this.router.navigate(['/clubs']);
                return;
            }
            this.totalCourses = this.club.courses?.length || 0;

            // Tournament stats — singleRound:false aggregate
            const aggData = statsResult?.tournament_aggregate;
            const singleRoundsAgg = statsResult?.single_rounds;
            this.totalTournaments = aggData?.aggregate?.count || 0;
            this.totalSingleRounds = singleRoundsAgg?.aggregate?.count || 0;
            const tournamentRoundsSum = aggData?.aggregate?.sum?.noOfRounds || 0;
            this.totalRounds = tournamentRoundsSum + this.totalSingleRounds;
            const nodes: any[] = aggData?.nodes || [];
            this.completedTournaments = nodes.filter(t => (t.activeRound || 0) > (t.noOfRounds || 1)).length;

            // Category breakdown
            const catData = categoryResult?.club?.[0];
            if (catData) {
                this.categoryStats = [
                    { label: 'Amateurs',             count: catData.Amateurs?.aggregate?.count || 0,             color: '#3B82F6' },
                    { label: 'Senior Amateurs',      count: catData.Senior_Amateurs?.aggregate?.count || 0,      color: '#8B5CF6' },
                    { label: 'Veterans',             count: catData.Veterans?.aggregate?.count || 0,             color: '#F59E0B' },
                    { label: 'Junior Amateurs',      count: catData.Junior_Amateurs?.aggregate?.count || 0,      color: '#10B981' },
                    { label: 'Ladies',               count: catData.Ladies?.aggregate?.count || 0,               color: '#EC4899' },
                    { label: 'Professionals',        count: catData.Professionals?.aggregate?.count || 0,        color: '#EF4444' },
                    { label: 'Senior Professionals', count: catData.Senior_Professionals?.aggregate?.count || 0, color: '#6366F1' },
                ].filter(c => c.count > 0);
            }

            // Members — first page only
            this.membersTotal = membersResult?.player_aggregate?.aggregate?.count || 0;
            this.totalMembers = this.membersTotal;
            this.members = this.mapPlayers(membersResult?.player || []);
            this.logger.log('Getting Club Data Successful', "info", this.clubId);

        } catch (err) {
            this.logger.log('Getting Club Data Failed', "error", err);
            console.error(err);
            this.snackBar.open('Failed to load club data.', 'x', { duration: 3000 });
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    // ── Panel toggle ──────────────────────────────────────────────────────────

    togglePanel(tab: 'tournaments' | 'dailyRounds'): void {
        this.logger.log('Admin Click on Panel in Club View Page', "info", tab);
        if (this.activePanelTab === tab) {
            this.activePanelTab = null;
            return;
        }
        this.activePanelTab = tab;
        if (tab === 'tournaments' && this.tournamentList.length === 0) {
            this.loadTournaments();
        }
        if (tab === 'dailyRounds' && this.dailyRoundsList.length === 0) {
            this.loadDailyRounds();
        }
    }

    // ── Tournaments ───────────────────────────────────────────────────────────

    async loadTournaments(): Promise<void> {
        this.logger.log('Getting Club Tournaments Data', "info", { clubId: this.clubId, pageIndex: this.tourPageIndex, pageSize: this.tourPageSize });
        this.tourIsLoading = true;
        try {
            const result = await this.facadeService.getClubTournamentsPaginated(
                this.clubId, this.tourPageSize, this.tourPageIndex * this.tourPageSize,
            );
            this.tournamentsTotal = result?.tournament_aggregate?.aggregate?.count || 0;
            this.tournamentList = result?.tournament || [];
            this.logger.log('Getting Club Tournaments Data Successful', "info", this.tournamentList.length);
        } catch (err) {
            this.logger.log('Getting Club Tournaments Data Failed', "error", err);
            console.error(err);
        } finally {
            this.tourIsLoading = false;
            this.cdr.detectChanges();
        }
    }

    onTourPageChange(event: PageEvent): void {
        this.logger.log('Admin changes Tournaments page in Club View Page', "info", { pageIndex: event.pageIndex, pageSize: event.pageSize });
        this.tourPageIndex = event.pageIndex;
        this.tourPageSize = event.pageSize;
        this.loadTournaments();
    }

    getTournamentStatus(t: any): { label: string; classes: string } {
        if ((t.activeRound || 0) > (t.noOfRounds || 1)) {
            return { label: 'Completed', classes: 'bg-green-50 text-green-700' };
        }
        if (t.started) {
            return { label: 'Live', classes: 'bg-red-50 text-red-600' };
        }
        return { label: 'Upcoming', classes: 'bg-blue-50 text-blue-600' };
    }

    viewTournament(id: string): void {
        this.logger.log('Admin Click on View Tournament in Club View Page', "info", id);
        this.router.navigate(['/tournaments/view', id]);
    }

    // ── Daily Rounds ──────────────────────────────────────────────────────────

    async loadDailyRounds(): Promise<void> {
        this.logger.log('Getting Club Daily Rounds Data', "info", { clubId: this.clubId, pageIndex: this.drPageIndex, pageSize: this.drPageSize });
        this.drIsLoading = true;
        try {
            const result = await this.facadeService.getClubDailyRoundsPaginated(
                this.clubId, this.drPageSize, this.drPageIndex * this.drPageSize,
            );
            this.dailyRoundsTotal = result?.tournament_aggregate?.aggregate?.count || 0;
            this.dailyRoundsList = result?.tournament || [];
            this.logger.log('Getting Club Daily Rounds Data Successful', "info", this.dailyRoundsList.length);
        } catch (err) {
            this.logger.log('Getting Club Daily Rounds Data Failed', "error", err);
            console.error(err);
        } finally {
            this.drIsLoading = false;
            this.cdr.detectChanges();
        }
    }

    onDrPageChange(event: PageEvent): void {
        this.logger.log('Admin changes Daily Rounds page in Club View Page', "info", { pageIndex: event.pageIndex, pageSize: event.pageSize });
        this.drPageIndex = event.pageIndex;
        this.drPageSize = event.pageSize;
        this.loadDailyRounds();
    }

    getDailyRoundStatus(t: any): { label: string; classes: string } {
        if (t.started && (t.activeRound || 0) > (t.noOfRounds || 1)) {
            return { label: 'Completed', classes: 'bg-green-50 text-green-700' };
        }
        if (t.started) {
            return { label: 'Live', classes: 'bg-red-50 text-red-600' };
        }
        return { label: 'Upcoming', classes: 'bg-blue-50 text-blue-600' };
    }

    // ── Members ───────────────────────────────────────────────────────────────

    async loadMembers(): Promise<void> {
        this.logger.log('Getting Club Members Data', "info", { clubId: this.clubId, pageIndex: this.pageIndex, pageSize: this.pageSize, search: this.searchControl.value });
        this.isMembersLoading = true;
        try {
            const search = this.searchControl.value || '';
            const result = await this.facadeService.getClubMembersPaginated(
                this.clubId, this.pageSize, this.pageIndex * this.pageSize, search,
            );
            this.membersTotal = result?.player_aggregate?.aggregate?.count || 0;
            this.members = this.mapPlayers(result?.player || []);
            this.logger.log('Getting Club Members Data Successful', "info", this.members.length);
        } catch (err) {
            this.logger.log('Getting Club Members Data Failed', "error", err);
            console.error(err);
        } finally {
            this.isMembersLoading = false;
            this.cdr.detectChanges();
        }
    }

    onPageChange(event: PageEvent): void {
        this.logger.log('Admin changes Members page in Club View Page', "info", { pageIndex: event.pageIndex, pageSize: event.pageSize });
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadMembers();
    }

    private mapPlayers(players: any[]): any[] {
        return players.map(p => ({
            id: p.id,
            name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(),
            category: p.playerCategory || '—',
            handicap: p.handicap ?? p.handicapWhsIndex ?? '—',
            membershipNumber: p.membershipNumber || '—',
            email: p.email || '—',
            phone: p.phone || '—',
        }));
    }

    viewMember(playerId: string): void {
        this.logger.log('Admin Click on View Member in Club View Page', "info", playerId);
        this.router.navigate(['/players/viewProfile', playerId]);
    }

    editClub(): void {
        this.logger.log('Admin Click on Edit Club in Club View Page', "info", this.clubId);
        this.router.navigate(['/clubs/edit', this.clubId]);
    }

    goBack(): void {
        this.logger.log('Admin Click on Back in Club View Page', "info", this.clubId);
        this.router.navigate(['/clubs']);
    }
}
