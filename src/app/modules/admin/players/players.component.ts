import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ElementRef,
} from '@angular/core';
import * as XLSX from 'xlsx';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from 'app/shared/services/facade.service';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { MatDrawer } from '@angular/material/sidenav';
import { Constants } from '../../../shared/classes/general';
import { ActivatedRoute, Router } from '@angular/router';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { read, utils } from 'xlsx';
import { HandicapService } from 'app/shared/services/handicap.service';
import { DialogOverviewComponent } from '../dialogs/dialog-overview/dialog-overview.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { SetPasswordDialogComponent } from './set-password-dialog/set-password-dialog.component';
import { LogsService } from 'app/shared/services/logs.service';
import { SelectionModel } from '@angular/cdk/collections';
import { RemoveMembersResultsDialogComponent, RemoveMemberResult } from './remove-members-results-dialog/remove-members-results-dialog.component';

const CATEGORIES = [
    'Amateurs',
    'Senior Amateurs',
    'Veterans',
    'Junior Amateurs',
    'Ladies',
    'Professionals',
    'Senior Professionals',
    'Caddie',
];

@Component({
    standalone: false,
    selector: 'app-players',
    templateUrl: './players.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('caddieFileInput') caddieFileInputVariable: ElementRef;
    @ViewChild('removeMembersFileInput') removeMembersFileInputVariable: ElementRef;

    drawerMode: 'side' | 'over';

    // ── Table data ─────────────────────────────────────────────────────────────
    players: any[] = [];
    totalCount: number = 0;
    isLoading: boolean = false;

    playersTableColumns: string[] = [
        'id', 'Name', 'Phone', 'Email', 'MembershipNo',
        'Category', 'Handicap', 'club', 'createdAt', 'view', 'Edit', 'Delete',
    ];

    // ── Pagination ─────────────────────────────────────────────────────────────
    pageSize: number = 25;
    pageIndex: number = 0;

    // ── Filters ────────────────────────────────────────────────────────────────
    searchInputControl: UntypedFormControl = new UntypedFormControl('');
    selectedCategory: string = '';
    readonly categories = CATEGORIES;
    selectedRoundsFilter: string = ''; // '', '0', '1', '2', '3', '3+'
    readonly roundsOptions = [
        { value: '0',  label: 'Never played' },
        { value: '1',  label: '1 round' },
        { value: '2',  label: '2 rounds' },
        { value: '3',  label: '3 rounds' },
        { value: '3+', label: '3+ rounds' },
    ];

    // Autocomplete entity filters (only one active at a time)
    clubFilterControl: UntypedFormControl = new UntypedFormControl();
    tournamentFilterControl: UntypedFormControl = new UntypedFormControl();
    leagueFilterControl: UntypedFormControl = new UntypedFormControl();
    tourFilterControl: UntypedFormControl = new UntypedFormControl();

    filteredClubs$: Observable<any[]> = of([]);
    filteredTournaments$: Observable<any[]> = of([]);
    filteredLeagues$: Observable<any[]> = of([]);
    filteredTours$: Observable<any[]> = of([]);

    isEntityFiltered: boolean = false;
    entityFilterLoading: boolean = false;
    private _allEntityPlayers: any[] = [];

    // ── Selection (bulk ops) ───────────────────────────────────────────────────
    selection = new SelectionModel<any>(true, []);

    // ── Role / user session ────────────────────────────────────────────────────
    loggedInuser: UserSessionModel;
    tourID: string = '';
    isSuperAdmin: boolean = false;
    isClubAdmin: boolean = false;

    // ── Excel import (caddies) ─────────────────────────────────────────────────
    file: File;
    arrayBuffer: any;
    caddiesData: any[] = [];
    importingList = false;

    // ── Excel-driven club member removal ──────────────────────────────────────
    removeMembersData: any[] = [];
    removingMembers = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        public snackBar: MatSnackBar,
        private _handicapServise: HandicapService,
        public dialog: MatDialog,
        public _localStorage: LocalStorageService,
        private logger: LogsService,
    ) {}

    openSetPasswordDialog(): void {
        this.logger.log('openSetPasswordDialog called', 'INFO');
        if (this.selection.selected.length === 0) {
            this.logger.log('No players selected for password reset', 'WARN');
            this.snackBar.open('Please select at least one player to set password.', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(SetPasswordDialogComponent, {
            width: '1000px',
            data: this.selection.selected.map(player => ({ id: player.id, Name: player.Name, Email: player.Email }))
        });

        dialogRef.afterClosed().subscribe(result => {
            // Optionally, you might want to refresh the players list or show a summary of password changes
            // this.loadPlayers(); // if passwords are tied to a display property
            this.selection.clear(); // Clear selection after action
            this.logger.log('Set password dialog closed, selection cleared', 'INFO');
        });
    }

    ngOnInit(): void {
        this.logger.log('PlayersComponent initialized', 'INFO');
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.isSuperAdmin = this._localStorage.isSuperAdmin();
        this.isClubAdmin = this._localStorage.isClubAdmin();

        // For TourAdmin/LeagueAdmin keep old path
        if (!this.isSuperAdmin && !this.isClubAdmin) {
            this.fetchLegacyData();
            return;
        }

        this.loadPlayers();

        // Debounced search
        this.searchInputControl.valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(400),
            distinctUntilChanged(),
        ).subscribe(() => {
            this.pageIndex = 0;
            this.loadPlayers();
        });

        // Autocomplete observables
        this.filteredClubs$ = this.clubFilterControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((val) => {
                if (!val || typeof val !== 'string' || val.trim().length < 1) return of([]);
                return this._facadeService.searchClubsByName(val.trim());
            })
        );
        this.filteredTournaments$ = this.tournamentFilterControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((val) => {
                if (!val || typeof val !== 'string' || val.trim().length < 1) return of([]);
                return this._facadeService.searchTournamentsByTitle(val.trim());
            })
        );
        this.filteredLeagues$ = this.leagueFilterControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((val) => {
                if (!val || typeof val !== 'string' || val.trim().length < 1) return of([]);
                return this._facadeService.searchLeaguesByName(val.trim());
            })
        );
        this.filteredTours$ = this.tourFilterControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((val) => {
                if (!val || typeof val !== 'string' || val.trim().length < 1) return of([]);
                return this._facadeService.searchToursByName(val.trim());
            })
        );
    }

    ngOnDestroy(): void {
        this.logger.log('PlayersComponent destroyed', 'INFO');
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ── Data loading ───────────────────────────────────────────────────────────

    async loadPlayers(): Promise<void> {
        this.logger.log('loadPlayers called', 'INFO');
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const baseWhere = this.buildWhere();
            const namedWhere = this.withNameFilter(baseWhere, true);
            const unnamedWhere = this.withNameFilter(baseWhere, false);
            const offset = this.pageIndex * this.pageSize;

            // Parallel: named players at current offset + unnamed aggregate (limit:1 for count only)
            const [namedResult, unnamedAgg] = await Promise.all([
                this._facadeService.getPlayersPaginated(namedWhere, this.pageSize, offset),
                this._facadeService.getPlayersPaginated(unnamedWhere, 1, 0),
            ]);

            const namedCount = namedResult?.player_aggregate?.aggregate?.count || 0;
            const unnamedCount = unnamedAgg?.player_aggregate?.aggregate?.count || 0;
            this.totalCount = namedCount + unnamedCount;

            let rawPlayers: any[];

            if (offset < namedCount) {
                const namedPlayers = namedResult?.player || [];
                if (namedPlayers.length < this.pageSize && unnamedCount > 0) {
                    // Page crosses the named/unnamed boundary — fill remainder with unnamed
                    const unnamedResult = await this._facadeService.getPlayersPaginated(
                        unnamedWhere, this.pageSize - namedPlayers.length, 0,
                    );
                    rawPlayers = [...namedPlayers, ...(unnamedResult?.player || [])];
                } else {
                    rawPlayers = namedPlayers;
                }
            } else {
                // Current page is entirely in the unnamed section
                const unnamedOffset = offset - namedCount;
                const unnamedResult = await this._facadeService.getPlayersPaginated(
                    unnamedWhere, this.pageSize, unnamedOffset,
                );
                rawPlayers = unnamedResult?.player || [];
            }

            this.players = rawPlayers.map(p => this.mapPlayer(p));
            this.selection.clear();
            this.logger.log('Players loaded successfully', 'INFO', { totalCount: this.totalCount });
        } catch (err) {
            this.logger.log('Error loading players', 'ERROR', err);
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    private withNameFilter(baseWhere: any, named: boolean): any {
        this.logger.log(`withNameFilter called, named: ${named}`, 'DEBUG', baseWhere);
        const cond = named
            ? { _or: [{ firstName: { _gt: '' } }, { lastName: { _gt: '' } }] }
            : {
                _and: [
                    { _or: [{ firstName: { _is_null: true } }, { firstName: { _eq: '' } }] },
                    { _or: [{ lastName: { _is_null: true } }, { lastName: { _eq: '' } }] },
                ],
              };
        if (Object.keys(baseWhere).length === 0) return cond;
        if (baseWhere._and) return { _and: [...baseWhere._and, cond] };
        return { _and: [baseWhere, cond] };
    }

    private mapPlayer(p: any): any {
        this.logger.log('mapPlayer called', 'DEBUG', p);
        // When a club admin is logged in, prefer the membership record that belongs
        // to their club so the Club column always shows the current club's name even
        // for players that are also members of other clubs.
        const memberships: any[] = p.membershipQL || [];
        const preferred = (this.isClubAdmin && this.loggedInuser?.adminClubId)
            ? (memberships.find((m: any) => m.clubId === this.loggedInuser.adminClubId) ?? memberships[0])
            : memberships[0];

        return {
            id: p.id,
            Name: ((p.firstName || '').trim() + ' ' + (p.lastName || '').trim()).trim(),
            Phone: p.phone,
            Email: p.email,
            createdAt: p.createdAt,
            MembershipNo: p.membershipNumber,
            Category: p.playerCategory === 'Senior' ? 'Senior Amateurs' : p.playerCategory,
            Handicap: p.handicap,
            club: preferred?.club?.name ?? '—',
            homeClubId: preferred?.clubId,
        };
    }

    private buildWhere(): any {
        this.logger.log('buildWhere called', 'DEBUG');
        const conditions: any[] = [];

        // ClubAdmin is always restricted to their club
        if (this.isClubAdmin) {
            conditions.push({ membership: { clubId: { _eq: this.loggedInuser.adminClubId } } });
        }

        // Search across name, email, membership number
        const search = (this.searchInputControl.value || '').trim();
        if (search) {
            const s = `%${search}%`;
            conditions.push({
                _or: [
                    { firstName: { _ilike: s } },
                    { lastName: { _ilike: s } },
                    { fullName: { _ilike: s } },
                    { email: { _ilike: s } },
                    { membershipNumber: { _ilike: s } },
                ],
            });
        }

        // Category filter
        if (this.selectedCategory) {
            conditions.push({ playerCategory: { _eq: this.selectedCategory } });
        }

        // Rounds played filter (uses flights_played_aggregate)
        if (this.selectedRoundsFilter === '0') {
            conditions.push({ _not: { flights_played: {} } });
        } else if (this.selectedRoundsFilter === '1') {
            conditions.push({ flights_played_aggregate: { count: { predicate: { _eq: 1 } } } });
        } else if (this.selectedRoundsFilter === '2') {
            conditions.push({ flights_played_aggregate: { count: { predicate: { _eq: 2 } } } });
        } else if (this.selectedRoundsFilter === '3') {
            conditions.push({ flights_played_aggregate: { count: { predicate: { _eq: 3 } } } });
        } else if (this.selectedRoundsFilter === '3+') {
            conditions.push({ flights_played_aggregate: { count: { predicate: { _gt: 3 } } } });
        }

        return conditions.length > 0 ? { _and: conditions } : {};
    }

    applyRoundsFilter(value: string): void {
        this.logger.log(`applyRoundsFilter called with value: ${value}`, 'INFO');
        this.selectedRoundsFilter = this.selectedRoundsFilter === value ? '' : value;
        this.pageIndex = 0;
        this.loadPlayers();
    }

    onPageChange(event: PageEvent): void {
        this.logger.log('onPageChange called', 'INFO', event);
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        if (this.isEntityFiltered) {
            this._sliceEntityPage();
        } else {
            this.loadPlayers();
        }
    }

    private _sliceEntityPage(): void {
        this.logger.log('_sliceEntityPage called', 'DEBUG', { pageIndex: this.pageIndex, pageSize: this.pageSize });
        const start = this.pageIndex * this.pageSize;
        this.players = this._allEntityPlayers.slice(start, start + this.pageSize);
        this._changeDetectorRef.markForCheck();
    }

    applyCategory(category: string): void {
        this.logger.log(`applyCategory called with category: ${category}`, 'INFO');
        this.selectedCategory = category;
        this.pageIndex = 0;
        this.loadPlayers();
    }

    applyClubSearch(): void {
        this.logger.log('applyClubSearch called', 'INFO');
        this.pageIndex = 0;
        this.loadPlayers();
    }

    clearFilters(): void {
        this.logger.log('clearFilters called', 'INFO');
        this.searchInputControl.setValue('', { emitEvent: false });
        this.selectedCategory = '';
        this.selectedRoundsFilter = '';
        this._clearEntityFilters();
        this.isEntityFiltered = false;
        this._allEntityPlayers = [];
        this.pageIndex = 0;
        this.loadPlayers();
    }

    get hasActiveFilters(): boolean {
        this.logger.log('hasActiveFilters getter called', 'DEBUG');
        return !!((this.searchInputControl.value || '').trim() ||
            this.selectedCategory ||
            this.selectedRoundsFilter ||
            this.isEntityFiltered
        );
    }

    displayEntityName(entity: any): string {
        this.logger.log('displayEntityName called', 'DEBUG', entity);
        if (!entity) return '';
        return entity.name || entity.title || '';
    }

    private _clearEntityFilters(): void {
        this.logger.log('_clearEntityFilters called', 'DEBUG');
        this.clubFilterControl.setValue('', { emitEvent: false });
        this.tournamentFilterControl.setValue('', { emitEvent: false });
        this.leagueFilterControl.setValue('', { emitEvent: false });
        this.tourFilterControl.setValue('', { emitEvent: false });
    }

    private _clearOtherEntityFilters(active: string): void {
        this.logger.log(`_clearOtherEntityFilters called with active: ${active}`, 'DEBUG');
        if (active !== 'club') this.clubFilterControl.setValue('', { emitEvent: false });
        if (active !== 'tournament') this.tournamentFilterControl.setValue('', { emitEvent: false });
        if (active !== 'league') this.leagueFilterControl.setValue('', { emitEvent: false });
        if (active !== 'tour') this.tourFilterControl.setValue('', { emitEvent: false });
    }

    private _applyEntityPlayers(rawPlayers: any[]): void {
        this.logger.log('_applyEntityPlayers called', 'DEBUG', rawPlayers);
        this._allEntityPlayers = rawPlayers.map(p => this.mapPlayer(p));
        this.totalCount = this._allEntityPlayers.length;
        this.pageIndex = 0;
        this.isEntityFiltered = true;
        this.isLoading = false;
        this.entityFilterLoading = false;
        this._sliceEntityPage();
    }

    async onClubSelected(club: any): Promise<void> {
        this.logger.log('onClubSelected called', 'INFO', club);
        this._clearOtherEntityFilters('club');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByClub(club.id);
            this._applyEntityPlayers(data?.player || []);
        } catch (err) {
            this.logger.log('Error in onClubSelected', 'ERROR', err);
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onTournamentSelected(tournament: any): Promise<void> {
        this.logger.log('onTournamentSelected called', 'INFO', tournament);
        this._clearOtherEntityFilters('tournament');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTournament(tournament.id);
            const players = (data?.tournament_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            this.logger.log('Error in onTournamentSelected', 'ERROR', err);
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onLeagueSelected(league: any): Promise<void> {
        this.logger.log('onLeagueSelected called', 'INFO', league);
        this._clearOtherEntityFilters('league');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByLeague(league.id);
            const players = (data?.league_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            this.logger.log('Error in onLeagueSelected', 'ERROR', err);
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onTourSelected(tour: any): Promise<void> {
        this.logger.log('onTourSelected called', 'INFO', tour);
        this._clearOtherEntityFilters('tour');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTour(tour.id);
            const players = (data?.tour_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            this.logger.log('Error in onTourSelected', 'ERROR', err);
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    // ── Legacy path (TourAdmin / LeagueAdmin) ──────────────────────────────────

    async fetchLegacyData(): Promise<void> {
        this.logger.log('fetchLegacyData called', 'INFO');
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        let legacyPlayers: any[] = [];
        try {
            let state = this._localStorage.get(Constants.STATE);
            if (state === Constants.TOUR) {
                this.tourID = this._localStorage.get(Constants.TOUR_ID);
                const data = await this._facadeService.getPlayersListByTour(this.tourID);
                legacyPlayers = (data?.tour_member || []).map((obj: any) => ({
                    id: obj.player.id,
                    Name: ((obj.player.firstName || '').trim() + ' ' + (obj.player.lastName || '').trim()).trim(),
                    Phone: obj.player.phone,
                    Email: obj.player.email,
                    createdAt: obj.player.createdAt,
                    MembershipNo: obj.player.membershipNumber,
                    Category: obj.player.playerCategory === 'Senior' ? 'Senior Amateurs' : obj.player.playerCategory,
                    Handicap: obj.player.handicap,
                    club: '—',
                }));
                this.totalCount = legacyPlayers.length;
            } else if (state === Constants.LEAGUE) {
                this.logger.log('Fetching legacy data for LEAGUE', 'DEBUG', { leagueId: this.tourID });
                this.tourID = this._localStorage.get(Constants.LEAGUE_ID);
                const data = await this._facadeService.getPlayersListByLeague(this.tourID);
                legacyPlayers = (data?.league_member || []).map((obj: any) => ({
                    id: obj.player.id,
                    Name: ((obj.player.firstName || '').trim() + ' ' + (obj.player.lastName || '').trim()).trim(),
                    Phone: obj.player.phone,
                    Email: obj.player.email,
                    createdAt: obj.player.createdAt,
                    MembershipNo: obj.player.membershipNumber,
                    Category: obj.player.playerCategory === 'Senior' ? 'Senior Amateurs' : obj.player.playerCategory,
                    Handicap: obj.player.handicap,
                    club: '—',
                }));
                this.totalCount = legacyPlayers.length;
            }
        } catch (err) {
            this.logger.log('Error fetching legacy data', 'ERROR', err);
            console.error(err);
        } finally {
            this.players = legacyPlayers.sort((a, b) => {
                if (!a.Name && !b.Name) return 0;
                if (!a.Name) return 1;
                if (!b.Name) return -1;
                return a.Name.localeCompare(b.Name);
            });
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    // ── Table actions ──────────────────────────────────────────────────────────

    createPlayer(): void {
        this.logger.log('createPlayer called, navigating to add player form', 'INFO');
        this._router.navigate(['./add'], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    updatePlayer(id: string): void {
        this.logger.log(`updatePlayer called for ID: ${id}, navigating to view player form`, 'INFO');
        this._router.navigate(['./view/', id], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    viewProfile(id: string): void {
        this.logger.log(`viewProfile called for ID: ${id}, navigating to player profile`, 'INFO');
        this._router.navigate(['/players/viewProfile/' + id]);
    }

    async deletePlayer(player: any): Promise<void> {
        this.logger.log('deletePlayer called', 'INFO', player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to delete the player?',
        });
        dialogRef.afterClosed().subscribe(async (confirmed) => {
            if (confirmed) {
                const response = await this._facadeService.deletePlayer(player.homeClubId, player.id);
                if (response) {
                    this.snackBar.open('Player has been deleted.', 'x', { duration: 5000 });
                    this.logger.log(`Player ${player.id} deleted successfully`, 'INFO');
                    this.loadPlayers();
                } else {
                    this.logger.log(`Failed to delete player ${player.id}`, 'ERROR');
                }
            }
        });
    }

    // ── Selection ──────────────────────────────────────────────────────────────

    isAllSelected(): boolean {
        this.logger.log('isAllSelected called', 'DEBUG');
        return this.players.length > 0 &&
            this.selection.selected.length === this.players.length;
    }

    masterToggle(): void {
        this.logger.log('masterToggle called', 'INFO');
        if (this.isAllSelected()) {
            this.selection.clear();
            this.logger.log('All players deselected', 'INFO');
        } else {
            this.players.forEach(row => this.selection.select(row));
            this.logger.log('All players selected', 'INFO');
        }
    }

    checkboxLabel(row?: any): string {
        this.logger.log('checkboxLabel called', 'DEBUG', row);
        if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} player ${row.Name}`;
    }

    // ── Bulk operations ────────────────────────────────────────────────────────

    private async fetchAllPlayersForExport(): Promise<any[]> {
        this.logger.log('fetchAllPlayersForExport called', 'INFO');
        if (this.isEntityFiltered) {
            this.logger.log('Returning all entity filtered players', 'DEBUG');
            return this._allEntityPlayers;
        }
        const baseWhere = this.buildWhere();
        const namedWhere = this.withNameFilter(baseWhere, true);
        const unnamedWhere = this.withNameFilter(baseWhere, false);
        const [namedResult, unnamedResult] = await Promise.all([
            this._facadeService.getPlayersPaginated(namedWhere, 10000, 0),
            this._facadeService.getPlayersPaginated(unnamedWhere, 10000, 0),
        ]);
        const named = (namedResult?.player || []).map((p: any) => this.mapPlayer(p));
        const unnamed = (unnamedResult?.player || []).map((p: any) => this.mapPlayer(p));
        return [...named, ...unnamed];
    }

    async exportToExcel(): Promise<void> {
        this.logger.log('exportToExcel called', 'INFO');
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const allPlayers = await this.fetchAllPlayersForExport();
            const data = allPlayers.map(({ id, view, Edit, Delete, homeClubId, ...rest }) => rest);
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Players');
            XLSX.writeFile(wb, 'Players_report.xlsx');
            this.logger.log('Players exported to Excel successfully', 'INFO');
        } catch (err) {
            this.logger.log('Error exporting players to Excel', 'ERROR', err);
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async verifyUserEmails(): Promise<void> {
        this.logger.log('verifyUserEmails called', 'INFO');
        const emails = this.selection.selected.map(item => item.Email);
        const res = await this._facadeService.verifyUserEmails(emails);
        if (res) {
            this.snackBar.open('Player emails have been verified.', 'x', { duration: 5000 });
            this.selection.clear();
            this.logger.log('Player emails verified successfully', 'INFO', { emails });
        } else {
            this.snackBar.open('Error! Try Again later.', 'x', { duration: 5000 });
            this.logger.log('Error verifying player emails', 'ERROR', { emails });
        }
    }

    sendResetPasswordEmail(): void {
        this.logger.log('sendResetPasswordEmail called for selected players', 'INFO', this.selection.selected);
        this._facadeService.executeSendResetEmailInBulk(this.selection.selected).subscribe(() => {
            this.snackBar.open('Password reset email sent successfully.', 'close', { duration: 3000 });
            this.selection.clear();
            this.logger.log('Password reset emails sent successfully', 'INFO');
        });
    }

    async downloadPDF(): Promise<void> {
        this.logger.log('downloadPDF called', 'INFO');
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const allPlayers = await this.fetchAllPlayersForExport();
            const doc = new jsPDF();
            const col = ['Sr.', 'Name', 'Phone', 'Email', 'Mem No.', 'Category', 'H.C'];
            const rows = allPlayers.map((p, i) => [
                i + 1, p.Name, p.Phone || '', p.Email || '',
                p.MembershipNo || '', p.Category || '', p.Handicap ?? '',
            ]);
            doc.setFontSize(18);
            doc.text('Players List', 15, 15);
            (doc as any).autoTable({
                head: [col],
                body: rows,
                startY: 25,
                theme: 'grid',
                headStyles: {
                    fillColor: [23, 196, 178], // A shade of green/teal
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center', // Center align header text
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // Sr.
                    1: { cellWidth: 40 }, // Name
                    2: { cellWidth: 28 }, // Phone
                    3: { cellWidth: 40 }, // Email
                    4: { cellWidth: 20 }, // Membership No.
                    5: { cellWidth: 25 }, // Category
                    6: { cellWidth: 15, halign: 'center' }, // Handicap
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    valign: 'middle',
                    overflow: 'linebreak',
                },
                didParseCell: (data) => {
                    // This can be used for further styling based on content if needed
                }
            });
            doc.save('Players.pdf');
            this.logger.log('Players list exported to PDF successfully', 'INFO');
        } catch (err) {
            this.logger.log('Error exporting players to PDF', 'ERROR', err);
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    // ── Excel import (caddies) ──────────────────────────────────────────────────
    // Reads an Excel file of caddies (Card No, Name, Address, CNIC, Mobile, Category)
    // and inserts them into the caddie table, tagged with the logged-in admin's club.

    parseCaddieExcel(event: any): void {
        this.logger.log('parseCaddieExcel called', 'INFO', event);
        this.caddiesData = [];
        if (event.target.files.length > 0) this.file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            this.arrayBuffer = fileReader.result;
            const data = new Uint8Array(this.arrayBuffer as ArrayBuffer);
            const arr = Array.from(data).map(c => String.fromCharCode(c));
            const bstr = arr.join('');
            const workbook = read(bstr, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            this.caddiesData = utils.sheet_to_json(worksheet, { raw: true, defval: '' });
            this.importCaddieExcel();
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    async importCaddieExcel(): Promise<void> {
        this.logger.log('importCaddieExcel called', 'INFO');
        try {
            this.importingList = true;
            this._changeDetectorRef.markForCheck();

            const clubId = this.loggedInuser.adminClubId;
            let skipped = 0;

            const caddies = this.caddiesData.reduce((acc: any[], row: any) => {
                const rowKeys: { [key: string]: any } = {};
                for (const key of Object.keys(row)) {
                    rowKeys[key.trim().toLowerCase()] = row[key];
                }

                const name = String(rowKeys['name'] ?? '').trim();
                if (!name) {
                    skipped++;
                    return acc;
                }

                const cardNo = String(rowKeys['card no'] ?? rowKeys['cardno'] ?? rowKeys['card_no'] ?? '').trim();
                const address = String(rowKeys['address'] ?? '').trim();
                const phone = String(rowKeys['mobile'] ?? rowKeys['phone'] ?? '').trim();
                const cnic = String(rowKeys['cnic'] ?? '').trim();
                const category = String(rowKeys['category'] ?? '').trim() || null;

                acc.push({ name, cardNo, address, phone, cnic, category, clubId });
                return acc;
            }, []);

            if (!caddies.length) {
                this.snackBar.open('No valid caddie rows found in the file (Name is required).', 'x', { duration: 4000 });
                this.importingList = false;
                this.caddieFileInputVariable.nativeElement.value = '';
                return;
            }

            const status = await this._facadeService.importCaddieList(caddies);
            if (status) {
                const skippedMsg = skipped > 0 ? ` ${skipped} row(s) skipped (missing name).` : '';
                this.snackBar.open(`${caddies.length} caddie(s) imported.${skippedMsg}`, 'x', { duration: 5000 });
                this.importingList = false;
                this.caddieFileInputVariable.nativeElement.value = '';
                this.logger.log('Caddie data imported successfully', 'INFO', { imported: caddies.length, skipped });
            } else {
                this.snackBar.open('Error while importing caddies', 'x', { duration: 3000 });
                this.importingList = false;
                this.logger.log('Error importing caddie data', 'ERROR');
            }
        } catch (error) {
            this.logger.log('Exception in importCaddieExcel', 'ERROR', error);
            this.importingList = false;
        }
    }

    delay(ms: number): Promise<void> {
        this.logger.log(`Delaying for ${ms}ms`, 'DEBUG');
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── Excel-driven club member removal ───────────────────────────────────────
    // Reads an Excel file of players by membershipNumber, looks each one up in the
    // player table, then removes their club_member row for the logged-in admin's club.

    parseRemoveMembersExcel(event: any): void {
        this.logger.log('parseRemoveMembersExcel called', 'INFO', event);
        this.removeMembersData = [];
        if (event.target.files.length > 0) this.file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            this.arrayBuffer = fileReader.result;
            const data = new Uint8Array(this.arrayBuffer as ArrayBuffer);
            const arr = Array.from(data).map(c => String.fromCharCode(c));
            const bstr = arr.join('');
            const workbook = read(bstr, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            this.removeMembersData = utils.sheet_to_json(worksheet, { raw: true, defval: '' });

            if (!this.removeMembersData.length) {
                this.snackBar.open('The selected file has no rows to process.', 'x', { duration: 4000 });
                this.removeMembersFileInputVariable.nativeElement.value = '';
                return;
            }

            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '400px',
                data: `This will remove ${this.removeMembersData.length} member(s) from your club based on the uploaded file. Continue?`,
            });
            dialogRef.afterClosed().subscribe((confirmed) => {
                if (confirmed) {
                    this.removeMembersFromClub();
                } else {
                    this.removeMembersFileInputVariable.nativeElement.value = '';
                }
            });
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    async removeMembersFromClub(): Promise<void> {
        this.logger.log('removeMembersFromClub called', 'INFO');
        this.removingMembers = true;
        this._changeDetectorRef.markForCheck();

        const results: RemoveMemberResult[] = [];

        for (let i = 0; i < this.removeMembersData.length; i++) {
            const p = this.removeMembersData[i];
            const rowNumber = i + 1;

            const rowKeys: { [key: string]: any } = {};
            for (const key of Object.keys(p)) {
                rowKeys[key.trim().toLowerCase()] = p[key];
            }
            const membershipNumberVal = rowKeys['membershipnumber'];
            const membershipNumber = membershipNumberVal ? String(membershipNumberVal).trim() : null;

            if (!membershipNumber) {
                results.push({ row: rowNumber, membershipNumber: 'N/A', status: 'error', message: 'Membership number is missing.' });
                continue;
            }

            try {
                const matchingPlayers = await this._facadeService.getPlayerByMembershipNumber(membershipNumber);
                const player = matchingPlayers?.[0];

                if (!player) {
                    results.push({ row: rowNumber, membershipNumber, status: 'error', message: 'Player with this membership number was not found.' });
                    continue;
                }

                const removed = await this._facadeService.deletePlayer(this.loggedInuser.adminClubId, player.id);
                if (removed) {
                    results.push({ row: rowNumber, membershipNumber, status: 'success', message: `Removed from club (Player ID: ${player.id}).` });
                } else {
                    results.push({ row: rowNumber, membershipNumber, status: 'error', message: 'Failed to remove club membership.' });
                }
            } catch (error) {
                this.logger.log(`Error removing member for row ${rowNumber}`, 'ERROR', error);
                results.push({ row: rowNumber, membershipNumber, status: 'error', message: `An unexpected error occurred: ${error?.message || error}` });
            }
        }

        this.removingMembers = false;
        this.removeMembersFileInputVariable.nativeElement.value = '';
        this.dialog.open(RemoveMembersResultsDialogComponent, {
            width: '800px',
            data: results,
        });
        this.logger.log('removeMembersFromClub finished', 'INFO', { total: results.length });
        await this.delay(2000);
        this.loadPlayers();
    }
}
