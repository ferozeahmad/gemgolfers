import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FacadeService } from 'app/shared/services/facade.service';
import { Tournament } from 'app/shared/models/tournament.model';
import { Constants, General } from 'app/shared/classes/general';
import { Router } from '@angular/router';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-tour-tournaments-list',
    templateUrl: './tour-tournaments-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourTournamentsListComponent implements OnInit, OnDestroy {
    @Input() tourId: string;

    tournaments: Tournament[] = [];
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to Tour Tournaments List in Tour Detail Page', "info", this.tourId);
        if (this.tourId) {
            this.loadTourTournaments();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadTourTournaments(): Promise<void> {
        this.logger.log('Getting Tour Tournaments Data', "info", this.tourId);
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getTournamentsListByTourForCompleted(this.tourId);
            this.tournaments = this.sortByDateDesc(data?.CompletedRecently?.[0]?.tournaments || []);
            this.logger.log('Getting Tour Tournaments Data Successful', "info", { tourId: this.tourId, count: this.tournaments.length });
        } catch (error) {
            this.logger.log('Getting Tour Tournaments Data Failed', "error", error.toString());
            console.error('Error loading tour tournaments:', error);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    private sortByDateDesc(tournaments: any[]): any[] {
        if (!tournaments) return [];
        return [...tournaments].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
        });
    }

    viewTournamentDetails(id: string): void {
        this.logger.log('Admin Click on View Tournament in Tour Tournaments List', "info", id);
        this._router.navigate(['/tournaments/view/', id]);
    }
}
