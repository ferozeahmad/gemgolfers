import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FacadeService } from 'app/shared/services/facade.service';
import { Tournament } from 'app/shared/models/tournament.model';
import { Constants, General } from 'app/shared/classes/general';
import { Router } from '@angular/router';

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
        private _router: Router
    ) { }

    ngOnInit(): void {
        if (this.tourId) {
            this.loadTourTournaments();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadTourTournaments(): Promise<void> {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getTournamentsListByTourForCompleted(this.tourId);
            this.tournaments = this.sortByDateDesc(data?.CompletedRecently?.[0]?.tournaments || []);
        } catch (error) {
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
        this._router.navigate(['/tournaments/view/', id]);
    }
}
