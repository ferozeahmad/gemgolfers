import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Tournament } from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { Subject } from 'rxjs';

@Component({
    standalone: false,
    selector: 'app-league-tournaments-list',
    templateUrl: './league-tournaments-list.component.html',
    styleUrls: ['./league-tournaments-list.component.scss']
})
export class LeagueTournamentsListComponent implements OnInit {
    @Input() leagueId: string;

    tournaments: Tournament[] = [];
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router
    ) { }

    ngOnInit(): void {
        if (this.leagueId) {
            this.loadLeagueTournaments();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadLeagueTournaments(): Promise<void> {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getTournamentsListByLeague(this.leagueId);
            this.tournaments = this.sortByDateDesc(data?.CompletedRecently?.[0]?.tournaments || []);
        } catch (error) {
            console.error('Error loading league tournaments:', error);
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
