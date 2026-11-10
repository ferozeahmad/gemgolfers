import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';
import {
    AddTourMemberDialogData,
    AddTourMemberDialogResult,
    DialogAddTourMemberComponent,
} from '../../dialogs/dialog-add-tour-member/dialog-add-tour-member.component';
import { getInitials } from '../tour-utils';

interface TourMemberRow {
    id: string;
    name: string;
    email: string;
    handicap: number | null;
    category: string;
    categoryClass: string;
    initials: string;
}

@Component({
    standalone: false,
    selector: 'app-tour-members-list',
    templateUrl: './tour-members-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourMembersListComponent implements OnInit, OnDestroy {
    @Input() tourId: string;
    /** Emits after members were added, so the parent can refresh its counters. */
    @Output() membersChanged = new EventEmitter<void>();

    members: TourMemberRow[] = [];
    filteredMembers: TourMemberRow[] = [];
    searchTerm = '';
    isLoading = false;
    loadFailed = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to Tour Members List in Tour Detail Page', "info", this.tourId);
        if (this.tourId) {
            this.loadTourMembers();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    trackById(index: number, row: TourMemberRow): string {
        return row.id;
    }

    async loadTourMembers(): Promise<void> {
        this.logger.log('Getting Tour Members Data', "info", this.tourId);
        this.isLoading = true;
        this.loadFailed = false;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTour(this.tourId);
            this.members = (data?.tour_member || [])
                .filter((m: any) => !!m.player)
                .map((m: any) => {
                    const name = `${m.player.firstName || ''} ${m.player.lastName || ''}`.trim();
                    return {
                        id: m.player.id,
                        name,
                        email: m.player.email,
                        handicap: m.player.handicap ?? null,
                        category: m.player.playerCategory === 'Seniors' ? 'Senior Amateurs' : (m.player.playerCategory || '—'),
                        categoryClass: this.categoryClass(m.player.playerCategory),
                        initials: getInitials(name),
                    } as TourMemberRow;
                })
                .sort((a: TourMemberRow, b: TourMemberRow) => a.name.localeCompare(b.name));
            this.applyFilter();
            this.logger.log('Getting Tour Members Data Successful', "info", { tourId: this.tourId, count: this.members.length });
        } catch (error) {
            this.loadFailed = true;
            this.logger.log('Getting Tour Members Data Failed', "error", error?.toString());
            console.error('Error loading tour members:', error);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    onSearch(term: string): void {
        this.searchTerm = term ?? '';
        this.applyFilter();
        this._changeDetectorRef.markForCheck();
    }

    private applyFilter(): void {
        const term = this.searchTerm.trim().toLowerCase();
        this.filteredMembers = !term
            ? this.members
            : this.members.filter(
                (m) =>
                    (m.name || '').toLowerCase().includes(term) ||
                    (m.email || '').toLowerCase().includes(term) ||
                    (m.category || '').toLowerCase().includes(term)
            );
    }

    private categoryClass(category: string): string {
        switch (category) {
            case 'Amateurs':
                return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300';
            case 'Seniors':
            case 'Senior Amateurs':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300';
            case 'Ladies':
                return 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-300';
            case 'Veterans':
                return 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300';
            default:
                return 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300';
        }
    }

    addMember(): void {
        this.logger.log('Admin Click on Add Member in Tour Members List', "info", this.tourId);
        const data: AddTourMemberDialogData = {
            tourId: this.tourId,
            existingPlayerIds: this.members.map((m) => m.id),
        };
        this.dialog
            .open<DialogAddTourMemberComponent, AddTourMemberDialogData, AddTourMemberDialogResult>(
                DialogAddTourMemberComponent,
                { data, autoFocus: false }
            )
            .afterClosed()
            .subscribe(async (result) => {
                if (!result?.added) {
                    return;
                }
                const name = result.players?.[0]
                    ? `${result.players[0].firstName ?? ''} ${result.players[0].lastName ?? ''}`.trim()
                    : 'Player';
                this.snackBar.open(`${name || 'Player'} was added to the tour.`, 'Close', { duration: 3000 });
                await this.loadTourMembers();
                this.membersChanged.emit();
            });
    }
}
