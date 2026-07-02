import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { FacadeService } from 'app/shared/services/facade.service';

@Component({
    standalone: false,
    selector: 'app-tour-members-list',
    templateUrl: './tour-members-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourMembersListComponent implements OnInit, OnDestroy {
    @Input() tourId: string;

    dataSource: MatTableDataSource<any>;
    displayedColumns: string[] = [ 'Name', 'Email', 'Handicap', 'Category'];
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        if (this.tourId) {
            this.loadTourMembers();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadTourMembers(): Promise<void> {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByTour(this.tourId);
            const members = (data?.tour_member || []).map((m: any) => ({
                id: m.player.id,
                Name: `${m.player.firstName || ''} ${m.player.lastName || ''}`.trim(),
                Email: m.player.email,
                Handicap: m.player.handicap,
                Category: m.player.playerCategory,
            }));
            this.dataSource = new MatTableDataSource(members);
        } catch (error) {
            console.error('Error loading tour members:', error);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }
}
