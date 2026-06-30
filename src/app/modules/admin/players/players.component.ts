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
import { Constants, UniqueIdGenerator, generateGemId } from '../../../shared/classes/general';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubMembership, Player, UserSessionModel } from 'app/shared/models/player.model';
import { read, utils } from 'xlsx';
import { HandicapService } from 'app/shared/services/handicap.service';
import { DialogOverviewComponent } from '../dialogs/dialog-overview/dialog-overview.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { SetPasswordDialogComponent } from './set-password-dialog/set-password-dialog.component';
import { LogsService } from 'app/shared/services/logs.service';
import { SelectionModel } from '@angular/cdk/collections';

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

    // ── Excel import ───────────────────────────────────────────────────────────
    file: File;
    arrayBuffer: any;
    playersData: any;
    savePlayers: any[] = [];
    duplicatePlayers: any[] = [];
    importingList = false;

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
        if (this.selection.selected.length === 0) {
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
            this.importExcelData();
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    async importExcelData(): Promise<void> {
        try {
            this.importingList = true;
            this.savePlayers = [];
            this.duplicatePlayers = [];
            const clubMember: ClubMembership[] = [];

            for (const p of this.playersData) {
                const UniqueId = UniqueIdGenerator.generate();
                clubMember.push({ clubId: this.loggedInuser.adminClubId, playerId: UniqueId } as any);
                this.savePlayers.push({
                    id: UniqueId,
                    adminClubId: null, firebaseUid: null, fcmToken: null,
                    gemId: generateGemId.generate(UniqueId),
                    firstName: p.firstName, lastName: p.lastName,
                    gender: p.gender || null, dob: p.dob || null, picture: p.picture || null,
                    email: p.email || null, phone: p.phone || null,
                    playerCategory: p.category || null, handicap: p.hc || 0,
                    online: false, countryCode: p.code || null, extraData: p.extra || null,
                    membershipNumber: p.membershipNumber, userRole: 3, membership: null,
                });
            }

            const status = await this._facadeService.importPlayerList(this.savePlayers, clubMember);
            if (status) {
                const newProfiles = Math.max(0, this.savePlayers.length - this.duplicatePlayers.length);
                this.snackBar.open(
                    `${newProfiles} players created. ${this.duplicatePlayers.length} already existed.`,
                    'x', { duration: 5000 },
                );
                this.importingList = false;
                this.fileInputVariable.nativeElement.value = '';
                await this.delay(2000);
                this.loadPlayers();
            } else {
                this.snackBar.open('Error while loading file', 'x', { duration: 3000 });
                this.importingList = false;
            }
        } catch {
            this.importingList = false;
        }
    }

    delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
