import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FacadeService } from 'app/shared/services/facade.service';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-league-members-list',
    templateUrl: './league-members-list.component.html',
    styleUrls: ['./league-members-list.component.scss']
})
export class LeagueMembersListComponent implements OnInit {
    @Input() leagueId: string;

    dataSource: MatTableDataSource<any>;
    displayedColumns: string[] = ['Name', 'Email', 'Handicap', 'Category'];
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _facadeService: FacadeService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to League Members List in League Detail Page', "info", this.leagueId);
        if (this.leagueId) {
            this.loadLeagueMembers();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async loadLeagueMembers(): Promise<void> {
        this.logger.log('Getting League Members Data', "info", this.leagueId);
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();
        try {
            const data = await this._facadeService.getPlayersListByLeague(this.leagueId);
            const members = (data?.league_member || []).map((m: any) => ({
                id: m.player.id,
                Name: `${m.player.firstName || ''} ${m.player.lastName || ''}`.trim(),
                Email: m.player.email,
                Handicap: m.player.handicap,
                Category: m.player.playerCategory,
            }));
            this.dataSource = new MatTableDataSource(members);
            this.logger.log('Getting League Members Data Successful', "info", { leagueId: this.leagueId, count: members.length });
        } catch (error) {
            this.logger.log('Getting League Members Data Failed', "error", error.toString());
            console.error('Error loading league members:', error);
        } finally {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
        }
    }

    viewUserProfile(userId: string): void {
        this.logger.log('Admin Click on View Player Profile in League Members List', "info", userId);
        this._router.navigate(['/players/viewProfile/', userId]);
    }
}
