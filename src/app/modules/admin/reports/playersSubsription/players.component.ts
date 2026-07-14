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
import { Constants, UniqueIdGenerator, generateGemId } from '../../../../shared/classes/general';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubMembership, Player, UserSessionModel } from 'app/shared/models/player.model';
import { read, utils } from 'xlsx';
import { HandicapService } from 'app/shared/services/handicap.service';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { PlayerSubscriptionHistoryDialogComponent } from './player-subscription-history-dialog/player-subscription-history-dialog.component';
import { ImportResultsDialogComponent, ImportResult } from './import-results-dialog/import-results-dialog.component';
import { SelectMonthYearDialogComponent } from './select-month-year-dialog/select-month-year-dialog.component';
import { LogsService } from 'app/shared/services/logs.service';
import { SelectionModel } from '@angular/cdk/collections';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

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
    @ViewChild('fileInput') fileInputVariable: ElementRef;

    drawerMode: 'side' | 'over';

    // ── Table data ─────────────────────────────────────────────────────────────
    players: any[] = [];
    totalCount: number = 0;
    isLoading: boolean = false;

    playersTableColumns: string[] = [
        'id', 'Name', 'Phone', 'Email', 'MembershipNo',
        'Category', 'Handicap', 'club', 'createdAt', 'view',
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

    // ── Excel import ───────────────────────────────────────────────────────────
    file: File;
    arrayBuffer: any;
    playersData: any;
    savePlayers: any[] = [];
    duplicatePlayers: any[] = [];
    importingList = false;
    currentImportRow = 0;
    totalImportRows = 0;
    importProgressPercent = 0;

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

    openPlayerSubscriptionHistoryDialog(player: any): void {
        this.dialog.open(PlayerSubscriptionHistoryDialogComponent, {
            width: '1000px',
            data: { player: player },
        });
    }

    ngOnInit(): void {
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
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ── Data loading ───────────────────────────────────────────────────────────

    async loadPlayers(): Promise<void> {
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
        } catch (err) {
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    private withNameFilter(baseWhere: any, named: boolean): any {
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
        this.selectedRoundsFilter = this.selectedRoundsFilter === value ? '' : value;
        this.pageIndex = 0;
        this.loadPlayers();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        if (this.isEntityFiltered) {
            this._sliceEntityPage();
        } else {
            this.loadPlayers();
        }
    }

    private _sliceEntityPage(): void {
        const start = this.pageIndex * this.pageSize;
        this.players = this._allEntityPlayers.slice(start, start + this.pageSize);
        this._changeDetectorRef.markForCheck();
    }

    applyCategory(category: string): void {
        this.selectedCategory = category;
        this.pageIndex = 0;
        this.loadPlayers();
    }

    applyClubSearch(): void {
        this.pageIndex = 0;
        this.loadPlayers();
    }

    clearFilters(): void {
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
        return !!(
            (this.searchInputControl.value || '').trim() ||
            this.selectedCategory ||
            this.selectedRoundsFilter ||
            this.isEntityFiltered
        );
    }

    displayEntityName(entity: any): string {
        if (!entity) return '';
        return entity.name || entity.title || '';
    }

    private _clearEntityFilters(): void {
        this.clubFilterControl.setValue('', { emitEvent: false });
        this.tournamentFilterControl.setValue('', { emitEvent: false });
        this.leagueFilterControl.setValue('', { emitEvent: false });
        this.tourFilterControl.setValue('', { emitEvent: false });
    }

    private _clearOtherEntityFilters(active: string): void {
        if (active !== 'club') this.clubFilterControl.setValue('', { emitEvent: false });
        if (active !== 'tournament') this.tournamentFilterControl.setValue('', { emitEvent: false });
        if (active !== 'league') this.leagueFilterControl.setValue('', { emitEvent: false });
        if (active !== 'tour') this.tourFilterControl.setValue('', { emitEvent: false });
    }

    private _applyEntityPlayers(rawPlayers: any[]): void {
        this._allEntityPlayers = rawPlayers.map(p => this.mapPlayer(p));
        this.totalCount = this._allEntityPlayers.length;
        this.pageIndex = 0;
        this.isEntityFiltered = true;
        this.isLoading = false;
        this.entityFilterLoading = false;
        this._sliceEntityPage();
    }

    async onClubSelected(club: any): Promise<void> {
        this._clearOtherEntityFilters('club');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByClub(club.id);
            this._applyEntityPlayers(data?.player || []);
        } catch (err) {
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onTournamentSelected(tournament: any): Promise<void> {
        this._clearOtherEntityFilters('tournament');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTournament(tournament.id);
            const players = (data?.tournament_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onLeagueSelected(league: any): Promise<void> {
        this._clearOtherEntityFilters('league');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByLeague(league.id);
            const players = (data?.league_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async onTourSelected(tour: any): Promise<void> {
        this._clearOtherEntityFilters('tour');
        this.entityFilterLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTour(tour.id);
            const players = (data?.tour_member || []).map((m: any) => m.player).filter(Boolean);
            this._applyEntityPlayers(players);
        } catch (err) {
            console.error(err);
            this.entityFilterLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    // ── Legacy path (TourAdmin / LeagueAdmin) ──────────────────────────────────

    async fetchLegacyData(): Promise<void> {
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
        this._router.navigate(['./add'], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    updatePlayer(id: string): void {
        this._router.navigate(['./view/', id], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    viewProfile(id: string): void {
        this._router.navigate(['/players/viewProfile/' + id]);
    }

    async deletePlayer(player: any): Promise<void> {
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to delete the player?',
        });
        dialogRef.afterClosed().subscribe(async (confirmed) => {
            if (confirmed) {
                const response = await this._facadeService.deletePlayer(player.homeClubId, player.id);
                if (response) {
                    this.snackBar.open('Player has been deleted.', 'x', { duration: 5000 });
                    this.loadPlayers();
                }
            }
        });
    }

    // ── Selection ──────────────────────────────────────────────────────────────

    isAllSelected(): boolean {
        return this.players.length > 0 &&
            this.selection.selected.length === this.players.length;
    }

    masterToggle(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.players.forEach(row => this.selection.select(row));
        }
    }

    checkboxLabel(row?: any): string {
        if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} player ${row.Name}`;
    }

    // ── Bulk operations ────────────────────────────────────────────────────────

    private async fetchAllPlayersForExport(): Promise<any[]> {
        if (this.isEntityFiltered) {
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
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const allPlayers = await this.fetchAllPlayersForExport();
            const data = allPlayers.map(({ id, view, Edit, Delete, homeClubId, ...rest }) => rest);
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Players');
            XLSX.writeFile(wb, 'Players_report.xlsx');
        } catch (err) {
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    async verifyUserEmails(): Promise<void> {
        const emails = this.selection.selected.map(item => item.Email);
        const res = await this._facadeService.verifyUserEmails(emails);
        if (res) {
            this.snackBar.open('Player emails have been verified.', 'x', { duration: 5000 });
            this.selection.clear();
        } else {
            this.snackBar.open('Error! Try Again later.', 'x', { duration: 5000 });
        }
    }

    sendResetPasswordEmail(): void {
        this._facadeService.executeSendResetEmailInBulk(this.selection.selected).subscribe(() => {
            this.snackBar.open('Password reset email sent successfully.', 'close', { duration: 3000 });
            this.selection.clear();
        });
    }

    async downloadPDF(): Promise<void> {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const allPlayers = await this.fetchAllPlayersForExport();
            const doc = new jsPDF();
            const col = ['Sr.', 'Name', 'Phone', 'Email', 'Mem/No', 'Category', 'Handicap'];
            const rows = allPlayers.map((p, i) => [
                i + 1, p.Name, p.Phone || '', p.Email || '',
                p.MembershipNo || '', p.Category || '', p.Handicap ?? '',
            ]);
            doc.setFontSize(18);
            doc.text('Players List', 15, 15);
            (doc as any).autoTable(col, rows, { startY: 25, theme: 'grid' });
            doc.save('Players.pdf');
        } catch (err) {
            console.error(err);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    // ── Excel import (unchanged logic) ─────────────────────────────────────────

    onFileChange(event: any): void {
        if (event.target.files.length > 0) this.file = event.target.files[0];
    }

    parseFlightsData(event: any): void {
        this.playersData = [];
        if (event.target.files.length > 0) this.file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            this.arrayBuffer = fileReader.result;
            const data = new Uint8Array(this.arrayBuffer as ArrayBuffer);
            const arr = Array.from(data).map(c => String.fromCharCode(c));
            const bstr = arr.join('');
            const workbook = read(bstr, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            this.playersData = utils.sheet_to_json(worksheet, { raw: true, defval: '' });
            
            // Ask user for the Month and Year first
            const dialogRef = this.dialog.open(SelectMonthYearDialogComponent, {
                width: '450px',
                disableClose: true,
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    this.importExcelData(result.dueDate, result.month, result.year);
                } else {
                    this.fileInputVariable.nativeElement.value = '';
                }
            });
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    async importExcelData(dueDate: string, month: number, year: number): Promise<void> {
        this.importingList = true;
        this.totalImportRows = this.playersData.length;
        this.currentImportRow = 0;
        this.importProgressPercent = 0;
        this._changeDetectorRef.markForCheck();

        const importResults: ImportResult[] = [];

        for (let i = 0; i < this.playersData.length; i++) {
            this.currentImportRow = i + 1;
            this.importProgressPercent = Math.round((this.currentImportRow / this.totalImportRows) * 100);
            this._changeDetectorRef.markForCheck();

            const p = this.playersData[i];
            const rowNumber = i + 1;

            // Map all keys to lowercase and trim them to find correct properties
            const rowKeys: { [key: string]: any } = {};
            for (let key of Object.keys(p)) {
                rowKeys[key.trim().toLowerCase()] = p[key];
            }

            const membershipNumberVal = rowKeys['memno'] || rowKeys['membershipno'] || rowKeys['membership number'] || rowKeys['membership_number'] || rowKeys['membershipnumber'] || p.membershipNumber;
            const membershipNumber = membershipNumberVal ? String(membershipNumberVal).trim() : null;

            if (!membershipNumber) {
                importResults.push({
                    row: rowNumber,
                    membershipNumber: 'N/A',
                    status: 'error',
                    message: 'Membership number is missing.',
                });
                continue;
            }

            try {
                // Check if player exists by membership number
                const existingPlayerResponse = await this._facadeService.getPlayerByMembershipNumber(membershipNumber);
                const existingPlayer = existingPlayerResponse?.[0];

                if (existingPlayer) {
                    const amtWithGst = this.parseNumber(rowKeys['amtwithgst'] || rowKeys['amountwithgst'] || rowKeys['amount_with_gst']);
                    const withoutGst = this.parseNumber(rowKeys['withoutgst'] || rowKeys['amountwithoutgst'] || rowKeys['amount_without_gst'] || rowKeys['amount'] || rowKeys['amt']);
                    const locker = this.parseNumber(rowKeys['locker']);
                    const capitation = this.parseNumber(rowKeys['capitation']);

                    // Use amtWithGst as primary amount, otherwise fallback to withoutGst
                    // const amountToSave = amtWithGst;



                    const selectedMonthName = monthNames[month];
                    const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

                    // Check if a subscription already exists for this player and month/year
                    const existingSubscriptionResponse = await this._facadeService.getClubMemberSubscription(
                        existingPlayer.id,
                        this.loggedInuser.adminClubId,
                        startDate
                    );
                    const existingSubscription = existingSubscriptionResponse?.[0];

                    const subscriptionData = {
                        playerId: existingPlayer.id,
                        clubId: this.loggedInuser.adminClubId,
                        dueDate: dueDate,
                        createdAt: new Date().toISOString(),
                        startDate: startDate,
                        type: `${selectedMonthName} ${year} Subscription`,
                        amountWithGst: amtWithGst,
                        locker: locker,
                        capitation: capitation,
                        amountWithoutGst: withoutGst,
                    };

                    if (existingSubscription) {
                        // Update existing subscription
                        const updateSubscriptionStatus = await this._facadeService.updateClubMemberSubscription(
                            existingSubscription.id,
                            subscriptionData
                        );
                        if (updateSubscriptionStatus) {
                            importResults.push({
                                row: rowNumber,
                                membershipNumber: membershipNumber,
                                status: 'success',
                                message: `Subscription updated with amount ${amtWithGst}. (ID: ${existingSubscription.id})`,
                            });
                        } else {
                            importResults.push({
                                row: rowNumber,
                                membershipNumber: membershipNumber,
                                status: 'error',
                                message: 'Failed to update subscription for existing player.',
                            });
                        }
                    } else {
                        // Create new subscription
                        const createSubscriptionStatus = await this._facadeService.createClubMemberSubscription(subscriptionData);

                        if (createSubscriptionStatus) {
                            importResults.push({
                                row: rowNumber,
                                membershipNumber: membershipNumber,
                                status: 'success',
                                message: `Subscription added with amount ${amtWithGst}.`,
                            });
                        } else {
                            importResults.push({
                                row: rowNumber,
                                membershipNumber: membershipNumber,
                                status: 'error',
                                message: 'Failed to add subscription for existing player.',
                            });
                        }
                    }
                } else {
                    // Player not found, record error and skip
                    importResults.push({
                        row: rowNumber,
                        membershipNumber: membershipNumber,
                        status: 'error',
                        message: 'Player with membership number not found.',
                    });
                }
            } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                importResults.push({
                    row: rowNumber,
                    membershipNumber: membershipNumber,
                    status: 'error',
                    message: `An unexpected error occurred: ${error.message}`,
                });
            }
        }

        this.importingList = false;
        this.fileInputVariable.nativeElement.value = '';
        this.dialog.open(ImportResultsDialogComponent, {
            width: '800px',
            data: importResults,
        });
        await this.delay(2000);
        this.loadPlayers();
    }

    private parseNumber(val: any): number {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const str = String(val).replace(/,/g, '').trim();
        const parsed = parseFloat(str);
        return isNaN(parsed) ? 0 : parsed;
    }

    delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper function to convert Excel serial date to ISO string (YYYY-MM-DD)
    private excelSerialDateToISOString(serial: number | string): string | null {
        if (typeof serial === 'string' && !isNaN(Number(serial))) {
            serial = Number(serial);
        }

        if (typeof serial !== 'number' || isNaN(serial)) {
            return null; // Not a valid serial number
        }

        // Excel serial dates start from Jan 1, 1900. JavaScript Date objects start from Jan 1, 1970.
        // 25569 is the number of days between Jan 1, 1900 and Jan 1, 1970, plus one for Excel's bug with Feb 29, 1900.
        const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899 (adjusted for Excel's bug)
        const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);

        // Format to YYYY-MM-DD
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}
