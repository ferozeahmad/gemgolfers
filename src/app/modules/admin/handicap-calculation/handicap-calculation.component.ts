import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Constants } from 'app/shared/classes/general';
import { UserSessionModel } from 'app/shared/models/player.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { HandicapService } from 'app/shared/services/handicap.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { DialogMergeComponent } from '../dialogs/dialog-merge-profile/dialog-merge.component';

@Component({
    standalone: false,
    selector: 'app-handicap-calculation',
    templateUrl: './handicap-calculation.component.html',
    styleUrls: ['./handicap-calculation.component.scss'],
})
export class HandicapCalculationComponent implements OnInit {
    dataSource: MatTableDataSource<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    selection = new SelectionModel<any>(false, []);
    displayedColumns: string[] = ['select', 'Name', 'Phone', 'Email', 'Membership', 'Handicap', 'Club'];
    loggedInUser: UserSessionModel;
    totalPlayers = 0;
    pageSize = 20;
    pageIndex = 0;
    filterValue = '';

    constructor(
        private handicapService: HandicapService,
        private _facadeService: FacadeService,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private _localStorage: LocalStorageService,
    ) {}

    async ngOnInit() {
        this.loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.dataSource = new MatTableDataSource([]);
        await this.loadPlayersPage(0, this.pageSize);
    }

    async applyFilter(filterValue: string) {
        this.filterValue = (filterValue || '').trim();
        this.pageIndex = 0;
        if (this.paginator) {
            this.paginator.firstPage();
        }
        await this.loadPlayersPage(this.pageIndex, this.pageSize);
    }

    async onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        await this.loadPlayersPage(this.pageIndex, this.pageSize);
    }

    private getPlayersWhereClause(): any {
        const where: any = {};

        if (this._localStorage.isClubAdmin()) {
            where.membership = {
                clubId: {
                    _eq: this.loggedInUser.adminClubId,
                },
            };
        } else {
            where.firstName = { _neq: '' };
        }

        if (this.filterValue) {
            where._or = [
                { fullName: { _ilike: `%${this.filterValue}%` } },
                { firstName: { _ilike: `%${this.filterValue}%` } },
                { lastName: { _ilike: `%${this.filterValue}%` } },
                { email: { _ilike: `%${this.filterValue}%` } },
                { membershipNumber: { _ilike: `%${this.filterValue}%` } },
            ];
        }

        return where;
    }

    private async loadPlayersPage(pageIndex: number, pageSize: number) {
        const offset = pageIndex * pageSize;
        const where = this.getPlayersWhereClause();
        const data = await this._facadeService.getPlayersPaginated(where, pageSize, offset);
        const rows = (data?.player || []).map((obj: any) => ({
            id: obj.id,
            Name: obj.firstName + ' ' + obj.lastName,
            Phone: obj.phone,
            Email: obj.email,
            Membership: obj.membershipNumber,
            Handicap: obj.handicap,
            Club:
                obj.membershipQL?.length > 0
                    ? obj.membershipQL[0].club?.name?.split(' ')[0] || '-'
                    : '-',
        }));

        this.totalPlayers = data?.player_aggregate?.aggregate?.count || 0;
        this.dataSource.data = rows;
        this.selection.clear();
    }

    private openConfirmAndCalculate(calcFn: (obj: { playerId: string; count: any }) => Promise<any>) {
        const player = this.selection.selected[0];
        if (!player) {
            this.snackBar.open('Please! Select Player.', 'x', { duration: 5000 });
            return;
        }
        const dialogRef = this.dialog.open(DialogMergeComponent, {
            width: '350px',
            data: { text: 'Do you want to calculate handicap again?', isPanelty: false },
        });
        dialogRef.afterClosed().subscribe(async (result) => {
            if (result != undefined && result !== '') {
                await calcFn({ playerId: player.id, count: result })
                    .then(() => {
                        this.selection.clear();
                        this.snackBar.open('Handicap Calculated Successfully.', 'x', { duration: 5000 });
                    })
                    .catch(() => {
                        this.snackBar.open('Error!.', 'x', { duration: 5000 });
                    });
            }
        });
    }

    calculateHandicapCONGU() {
        this.openConfirmAndCalculate((obj) => this.handicapService.calculateHandicap(obj));
    }

    calculateHandicapWHS() {
        this.openConfirmAndCalculate((obj) => this.handicapService.calculateHandicapWHS(obj));
    }
}
