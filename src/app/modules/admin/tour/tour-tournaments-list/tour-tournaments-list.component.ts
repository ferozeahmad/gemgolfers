import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import {
    STATUS_CLASSES,
    STATUS_LABELS,
    TourStatus,
    getDurationDays,
    getStatus,
    parseDateOnly,
} from '../tour-utils';

interface TourTournamentRow {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    formatLabel: string;
    rounds: number | null;
    duration: number;
    status: TourStatus;
    statusLabel: string;
    statusClass: string;
    setupComplete: boolean;
}

@Component({
    standalone: false,
    selector: 'app-tour-tournaments-list',
    templateUrl: './tour-tournaments-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourTournamentsListComponent implements OnInit, OnDestroy {
    @Input() tourId: string;

    tournaments: TourTournamentRow[] = [];
    isLoading: boolean = false;
    loadFailed = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _localStorage: LocalStorageService,
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

    trackByFn(index: number, item: TourTournamentRow): string {
        return item.id || String(index);
    }

    async loadTourTournaments(): Promise<void> {
        this.logger.log('Getting Tour Tournaments Data', "info", this.tourId);
        this.isLoading = true;
        this.loadFailed = false;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getTournamentsListByTourForCompleted(this.tourId);
            const raw: any[] = data?.CompletedRecently?.[0]?.tournaments || [];
            this.tournaments = this.sortByDateDesc(raw).map((t) => this.toRow(t));
            this.logger.log('Getting Tour Tournaments Data Successful', "info", { tourId: this.tourId, count: this.tournaments.length });
        } catch (error) {
            this.loadFailed = true;
            this.logger.log('Getting Tour Tournaments Data Failed', "error", error?.toString());
            console.error('Error loading tour tournaments:', error);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    private toRow(t: any): TourTournamentRow {
        const status = getStatus(t.startDate, t.endDate);
        return {
            id: t.id,
            title: t.title,
            startDate: t.startDate,
            endDate: t.endDate,
            formatLabel: this.prettyFormat(t.matchFormat),
            rounds: t.noOfRounds ?? null,
            duration: getDurationDays(t.startDate, t.endDate),
            status,
            statusLabel: STATUS_LABELS[status],
            statusClass: STATUS_CLASSES[status],
            // `isSetupComplete` is null for tournaments created before the setup wizard existed.
            setupComplete: t.isSetupComplete == null || t.isSetupComplete === true,
        };
    }

    /** "STROKE_PLAY" / "strokePlay" -> "Stroke Play" */
    private prettyFormat(format: string): string {
        if (!format) {
            return '';
        }
        return String(format)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    private sortByDateDesc(tournaments: any[]): any[] {
        return [...tournaments].sort((a, b) => {
            const dateA = parseDateOnly(a.startDate)?.getTime() ?? 0;
            const dateB = parseDateOnly(b.startDate)?.getTime() ?? 0;
            return dateB - dateA;
        });
    }

    /**
     * Opens the "new tournament" wizard. The tour is stored in the session state so that the wizard
     * attaches the tournament to this tour when it is saved (and offers the tour's members as players).
     */
    createTournament(): void {
        this.logger.log('Admin Click on Create Tournament in Tour Tournaments List', "info", this.tourId);
        this.rememberTour();
        this._router.navigate(['/tournaments/add'], { queryParams: { tourId: this.tourId } });
    }

    openTournament(tournament: TourTournamentRow): void {
        this.logger.log('Admin Click on View Tournament in Tour Tournaments List', "info", tournament.id);
        if (!tournament.setupComplete) {
            // Setup was never finished: resume the wizard instead of opening an incomplete tournament.
            this.rememberTour();
            this._router.navigate(['/tournaments/add', tournament.id], { queryParams: { tourId: this.tourId } });
            return;
        }
        this._router.navigate(['/tournaments/view', tournament.id]);
    }

    private rememberTour(): void {
        this._localStorage.set(Constants.TOUR_ID, this.tourId);
        this._localStorage.set(Constants.STATE, Constants.TOUR);
    }
}
