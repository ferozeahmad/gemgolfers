import { Component, OnInit, ViewChild } from '@angular/core';
import { FacadeService } from 'app/shared/services/facade.service';
import { HandicapService } from 'app/shared/services/handicap.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { DialogMergeComponent } from '../../dialogs/dialog-merge-profile/dialog-merge.component';
import { MatDialog } from '@angular/material/dialog';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
@Component({
    standalone: false,
    selector: 'app-merge-profiles',
    templateUrl: './merge-profiles.component.html',
    styleUrls: ['./merge-profiles.component.scss'],
})
export class MergeProfilesComponent implements OnInit {
    Players: any = [];
    DataSourceA: MatTableDataSource<any>;
    DataSourceB: MatTableDataSource<any>;
    @ViewChild('MatPaginatorA') Apaginator: MatPaginator;
    @ViewChild('MatSortA') Asort: MatSort;
    @ViewChild('MatPaginatorB') Bpaginator: MatPaginator;
    @ViewChild('MatSortB') Bsort: MatSort;
    selectionA = new SelectionModel<Player>(true, []);
    selectionB = new SelectionModel<Player>(true, []);
    DataSourceBColumns: string[] = [
        'select',
        'Name',
        'Phone',
        'Email',
        'Membership',
        'Handicap',
        'Club',
        // 'Delete',
    ];
    DataSourceAColumns: string[] = [
        'select',
        'Name',
        'Phone',
        'Email',
        'Membership',
        'Handicap',
        'Club',
        // 'Delete',
    ];
    loggedInuser: UserSessionModel;
    constructor(
        private _facadeService: FacadeService,
        private handicapService: HandicapService,
        public snackBar: MatSnackBar,
        public dialog: MatDialog, private _localStorage: LocalStorageService,
    ) { }
    async ngOnInit() {
        let rows = [];
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        of(this.Players)
            .pipe()
            .subscribe(
                async (data) => {
                    if (this._localStorage.isSuperAdmin()) {
                        data = await this._facadeService.getPlayersListMerge();
                    } else if (this._localStorage.isClubAdmin()) {
                       data = await this._facadeService.getPlayersListMergeClub(this.loggedInuser.adminClubId);
                    }
                    //console.log(data);
                    this.Players = data.player;

                    for (let obj of this.Players) {
                        let newobj = {
                            id: obj.id,
                            Name: obj.firstName + ' ' + obj.lastName,
                            Phone: obj.phone,
                            Email: obj.email,
                            Membership: obj.membershipNumber,
                            Handicap: obj.handicap,
                            Club:
                                obj.membership.length > 0
                                    ? obj.membership[0].club.name.substring(
                                        0,
                                        obj.membership[0].club.name.indexOf(
                                            ' '
                                        )
                                    )
                                    : '-',
                        };
                        rows.push(newobj);
                    }
                    this.DataSourceA = new MatTableDataSource(rows);
                    this.DataSourceB = new MatTableDataSource(rows);
                    this.DataSourceA.paginator = this.Apaginator;
                    this.DataSourceA.sort = this.Asort;
                    this.DataSourceB.paginator = this.Bpaginator;
                    this.DataSourceB.sort = this.Bsort;
                },
                (error) => console.log('error')
            );
    }

    async mergeProfiles() {
        let oldPlayer = Object.assign({}, this.selectionA.selected);
        let newPlayer = Object.assign({}, this.selectionB.selected);

        const dialogRef = this.dialog.open(DialogMergeComponent, {
            width: '350px',
            data: {
                text: 'Do you want to calculate handicap again?',
                isPanelty: false,
            },
        });
        dialogRef.afterClosed().subscribe(async (result) => {
            //console.log(result);
            if (result != undefined) {
                let response = await this._facadeService.mergePlayers(
                    oldPlayer[0].id,
                    newPlayer[0].id
                );
                if (response && result != '' && result != undefined) {
                    let obj = {
                        playerId: newPlayer[0].id,
                        count: result,
                    };

                    this.handicapService
                        .calculateHandicap(obj)
                        .then((response) => {
                            //console.log(response);
                            this.snackBar.open(
                                'Players are Merged and Handicap Calculated Successfully.',
                                'x',
                                {
                                    duration: 5000,
                                }
                            );
                            this.selectionA.clear(true);
                            this.selectionB.clear(true);
                        })
                        .catch((err) => {
                            //console.log('error' + err);
                            this.snackBar.open('Error!.', 'x', {
                                duration: 5000,
                            });
                        });
                    // this.handicapService
                    //     .calculateHandicapWHS(obj)
                    //     .then((response) => {
                    //         //console.log(response);
                    //         this.snackBar.open(
                    //             'Players are Merged and Handicap Calculated Successfully.',
                    //             'x',
                    //             {
                    //                 duration: 5000,
                    //             }
                    //         );
                    //         this.selectionA.clear(true);
                    //         this.selectionB.clear(true);
                    //     })
                    //     .catch((err) => {
                    //         //console.log('error' + err);
                    //         this.snackBar.open('Error!.', 'x', {
                    //             duration: 5000,
                    //         });
                    //     });
                } else if (response == true) {
                    this.selectionA.clear(true);
                    this.selectionB.clear(true);
                    this.snackBar.open(
                        'Players are Merged Successfully.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );
                } else {
                    this.snackBar.open('Error!.', 'x', {
                        duration: 5000,
                    });
                }
            }
        });
    }

    applyFilterA(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.DataSourceA.filter = filterValue;
    }
    applyFilterB(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.DataSourceB.filter = filterValue;
    }
}
