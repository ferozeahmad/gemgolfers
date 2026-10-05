import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../../../shared/models/player.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from '../../../../shared/services/facade.service';
import { SelectionModel } from '@angular/cdk/collections';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-player',
    templateUrl: './dialog-player.component.html',
    styleUrls: ['./dialog-player.component.scss'],
})
export class DialogPlayerComponent implements OnInit {
    dataSource: MatTableDataSource<any>;
    displayedColumns = [
        'fullName',
        'handicap',
        'category',
        'membershipNo',
        'club',
        'select',
    ];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    public response: any[];
    public player: Player[] = [];
    totalFlights: any[] = [];
    selectedFlight: number = 0;
    selectedRowIndex: string;
    selection = new SelectionModel<Player>(true, []);
    value: boolean = false;
    datas: any[] = [];
    showTable: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<DialogPlayerComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public facadeService: FacadeService,
        private logger: LogsService
    ) {}

    ngOnInit() {
        this.logger.log('Player Dialog Opened', "info", { flights: this.data?.flights });
        //console.log(this.data);

        for (let flight = 1; flight <= this.data.flights; flight++) {
            let r: any = {
                Text: 'Flight ' + flight,
                Value: flight,
            };
            this.totalFlights.push(r);
        }

        //if (this.data.flights > 0) this.selectedFlight = 1;
    }

    async getPlayerInformationByGEMID() {
        let GEMID: string = (<HTMLInputElement>document.getElementById('gemid'))
            .value;
        this.logger.log('Admin Search Player by GEM ID in Player Dialog', "info", GEMID);

        if (GEMID) {
            this.player = <Player[]>(
                await this.facadeService.getPlayerByGEMID(GEMID)
            );
            this.logger.log('Search Player by GEM ID in Player Dialog Successful', "info");

            this.setDataSource(this.player['player']);

            // if (this.player.length > 0) {
            //   this.response[0] = {
            //     player: this.player[0],
            //     flight: Number(this.selectedFlight) - 1,
            //   };
            //   this.selectPlayer(this.player[0]);
            // } else {
            //   this.response = null;
            // }
        }
    }

    async getPlayerInformationByPhone() {
        let phone: string = (<HTMLInputElement>document.getElementById('phone'))
            .value;
        this.logger.log('Admin Search Player by Phone in Player Dialog', "info", phone);

        if (phone) {
            this.player = <Player[]>(
                await this.facadeService.getPlayerByPhone(phone)
            );
            this.logger.log('Search Player by Phone in Player Dialog Successful', "info");

            if (this.player['player'] != undefined) {
                this.setDataSource(this.player['player']);
            } else {
                this.setDataSource(this.player);
            }

            // if (this.player.length > 0) {
            //   this.response[0] = {
            //     player: this.player[0],
            //     flight: Number(this.selectedFlight) - 1,
            //   };
            //   this.selectPlayer(this.player[0]);
            // } else {
            //   this.response = null;
            // }
        }
    }

    async getPlayerInformationByMembershipNumber() {
        let membershipNumber: string = (<HTMLInputElement>(
            document.getElementById('membershipNumber')
        )).value;
        this.logger.log('Admin Search Player by Membership Number in Player Dialog', "info", membershipNumber);

        if (membershipNumber) {
            this.player = <Player[]>(
                await this.facadeService.getPlayerByMembershipNumber(
                    membershipNumber
                )
            );
            this.logger.log('Search Player by Membership Number in Player Dialog Successful', "info", { found: this.player?.length });

            this.setDataSource(this.player);

            // if (this.player.length > 0) {
            //   this.response = {
            //     player: this.player[0],
            //     flight: Number(this.selectedFlight) - 1,
            //   };
            //   this.selectPlayer(this.player[0]);
            // } else {
            //   this.response = null;
            // }
        }
    }

    async getPlayerInformationByEmail() {
        let email: string = (<HTMLInputElement>document.getElementById('email'))
            .value;
        this.logger.log('Admin Search Player by Email in Player Dialog', "info", email);

        if (email) {
            this.player = <Player[]>(
                await this.facadeService.getPlayerByEmail(email)
            );
            this.logger.log('Search Player by Email in Player Dialog Successful', "info", { found: this.player?.length });

            this.setDataSource(this.player);

            // if (this.player.length > 0) {
            //   this.response = {
            //     player: this.player[0],
            //     flight: Number(this.selectedFlight) - 1,
            //   };
            //   this.selectPlayer(this.player[0]);
            // } else {
            //   this.response = null;
            // }
        }
    }

    async getPlayerInformationByName() {
        let fullName: string = (<HTMLInputElement>(
            document.getElementById('fullName')
        )).value;
        // let lastName: string = (<HTMLInputElement>(
        //   document.getElementById("lastName")
        // )).value;
        let handicap: string = (<HTMLInputElement>(
            document.getElementById('handicap')
        )).value;
        let text1 = '%';
        let text4 = '%';
        let result = text1.concat(fullName, text4);
        this.logger.log('Admin Search Player by Name in Player Dialog', "info", { fullName: fullName, handicap: handicap });
        //console.log('====================================');
        //console.log(fullName);
        //console.log('====================================');
        //console.log(result);
        if (fullName) {
            if (!fullName) fullName = 'NOTHING';
            //console.log('====================================');
            //console.log(handicap);
            //console.log('====================================');
            let lowerHandicap = handicap ? Number(handicap) - 1 : 70;
            let upperHandicap = handicap ? Number(handicap) + 1 : 70;

            //console.log(lowerHandicap);
            //console.log(upperHandicap);

            let matchingList = <Player>(
                await this.facadeService.searchPlayerForTournament(
                    result,
                    lowerHandicap,
                    upperHandicap
                )
            );
            this.player = matchingList['Result'];
            this.logger.log('Search Player by Name in Player Dialog Successful', "info", { found: this.player?.length });

            this.setDataSource(this.player);

            // if (this.player[0]) {
            //   this.response = {
            //     player: this.player[0],
            //     flight: Number(this.selectedFlight) - 1,
            //   };
            // } else {
            //   this.response = null;
            // }
        }
    }

    getMatchingPlayers(object) {
        let matching: any[] = [];
        //console.log(object);
        for (let i = 1; i <= 4; i++) {
            for (let j = 1; j < 4; j++) {
                ////console.log("Result" + i + j);
                ////console.log(object["Result" + i + j].length);
                if (
                    object['Result' + i + j] != null &&
                    object['Result' + i + j].length < 50
                ) {
                    for (let item of object['Result' + i + j]) {
                        // //console.log(matching);
                        // //console.log(item);
                        let exist = matching.filter((a) => {
                            return a.id == item.id;
                        });

                        // //console.log(exist.length);

                        if (exist.length == 0) matching.push(item);
                    }
                }
            }
        }
        ////console.log(matching);
        return matching;
    }

    getClubTooltip(membership) {
        //console.log(membership);
        let clubList: string;
        for (let member of membership) {
            clubList += member.club.name + ', ';
        }
        clubList = clubList.trim();
        clubList = clubList.replace(/,\s*$/, '');
    }

    applyFilter(filterValue: string) {
        //console.log(filterValue);
        if (filterValue.length > 0) {
            this.value = true;
        }
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    isAllSelected() {
        ////console.log(this.dataSource);
        if (this.dataSource) {
            // //console.log(this.selection);
            const numSelected = this.selection.selected.length;
            // //console.log(numSelected);
            this.selectPlayer(this.selection.selected);
            const numRows = this.dataSource.data.length;
            ////console.log(this.dataSource.data);

            // //console.log(numRows);

            return numSelected === numRows;
        }
    }

    isAllSelecteds() {
        ////console.log(this.dataSource);
        if (this.dataSource) {
            // //console.log(this.selection);
            const numSelected = this.selection.selected.length;
            // //console.log(numSelected);
            this.selectPlayer(this.selection.selected);
            const numRows = this.dataSource.data.length;
            //console.log(this.dataSource.data);

            // //console.log(numRows);

            return numSelected === numRows;
        }
    }

    masterToggle() {
        this.logger.log('Admin Toggles Select All in Player Dialog', "info");
        // //console.log(this.selection);
        // //console.log(this.selection.selected.length);
        this.isAllSelecteds()
            ? this.selection.clear()
            : this.dataSource.data.forEach((row) => this.selection.select(row));
        this.selectPlayer(this.selection.selected);
    }

    checkboxLabel(row?: Player): string {
        // //console.log(this.selection);
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${
            this.selection.isSelected(row) ? 'deselect' : 'select'
        } player ${row.firstName} ${row.lastName}`;
    }

    setDataSource(dataSource) {
        this.dataSource = new MatTableDataSource(dataSource);
        this.showTable = true;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    selectPlayer(player) {
        //console.log(this.selection.selected);
        this.datas = this.selection.selected;
        this.response = [];

        if (this.datas.length > 0) {
            for (let i of this.datas) {
                let obj = {
                    flight:
                        this.selectedFlight > 0 ? this.selectedFlight : 10000,
                    player: i,
                };
                this.response.push(obj);
            }
        } else {
            this.response = null;
        }

        // this.response = {
        //   player: player,
        //   flight: Number(this.selectedFlight) - 1,
        // };

        this.selectedRowIndex = player.id;
    }

    changeFlight(item) {
        this.logger.log('Admin Changes Flight in Player Dialog', "info", item?.value);
        //console.log('Selected value: ' + item.value);
        this.selectedFlight = item.value;

        if (this.response)
            for (let i of this.response) {
                this.response[i]['flight'] = Number(this.selectedFlight);
            }
        //this.response[0].flight = Number(this.selectedFlight);
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Player Dialog', "info");
        this.dialogRef.close();
    }
}
