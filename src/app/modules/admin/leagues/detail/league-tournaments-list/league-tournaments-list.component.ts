import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Tournament } from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { Subject } from 'rxjs';
import { LogsService } from 'app/shared/services/logs.service';

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
        private _router: Router,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to League Tournaments List in League Detail Page', "info", this.leagueId);
        if (this.leagueId) {
            this.loadLeagueTournaments();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadLeagueTournaments(): Promise<void> {
        this.logger.log('Getting League Tournaments Data', "info", this.leagueId);
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getTournamentsListByLeague(this.leagueId);
            this.tournaments = this.sortByDateDesc(data?.CompletedRecently?.[0]?.tournaments || []);
            this.logger.log('Getting League Tournaments Data Successful', "info", { leagueId: this.leagueId, count: this.tournaments.length });
        } catch (error) {
            this.logger.log('Getting League Tournaments Data Failed', "error", error.toString());
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
        this.logger.log('Admin Click on View Tournament in League Tournaments List', "info", id);
        this._router.navigate(['/tournaments/view/', id]);
    }
}
