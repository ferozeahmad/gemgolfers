import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClubMembership, Player } from '../../../../shared/models/player.model';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SelectionModel } from '@angular/cdk/collections';
import { TournamentMember } from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Constants, General, UniqueIdGenerator, generateGemId } from 'app/shared/classes/general';
import { Club } from 'app/shared/models/club.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
@Component({
    standalone: false,
    selector: 'app-dialog-player-list',
    templateUrl: './dialog-player-list.component.html',
    styleUrls: ['./dialog-player-list.component.scss'],
})
export class DialogPlayerListComponent implements OnInit {
    dataSource: MatTableDataSource<Player>;
    public playerForm: FormGroup;
    show: boolean = true;
    golfClubs: Club[] = [];
    displayedColumns = [
        'name',
        'handicap',
        'membershipNumber',
        'cat',
        'email',
        'select',
    ];
    loggedInuser: any;
    public response: any;
    playerCategories: any[] = [];
    playerList: Player[] = [];
    selection = new SelectionModel<Player>(true, []);
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        public dialogRef: MatDialogRef<DialogPlayerListComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private facadeService: FacadeService,
        public snackBar: MatSnackBar, public _localStorage: LocalStorageService
    ) { }

    async ngOnInit() {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.playerCategories = this.facadeService.getPlayerCategories();
        //console.log(this.data);
        let dataClubs = await this.facadeService.getClubList();
        this.golfClubs = dataClubs.club;

        this.playerList = this.data.players;

        this.dataSource = new MatTableDataSource(this.playerList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    applyFilter(filterValue: string) {
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
            const numSelected = this.selection.selected.length;
            const numRows = this.dataSource.data.length;
            return numSelected === numRows;
        }
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelected()
            ? this.selection.clear()
            : this.dataSource.data.forEach((row) => this.selection.select(row));
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: Player): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }
    public downloadAsPDF() {
        var doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Round's Report Detail:", 15, 15);
        doc.setFontSize(11);
        doc.setTextColor(100);

        // From HTML
        (doc as any).autoTable({
            html: '#playerTable',
            startY: 25,
            theme: 'grid',
            useCss: false,
        });

        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document
        //doc.save('flights.pdf');
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    async saveTournamentMembers() {
        let tournamentMember: TournamentMember[] = [];
        let counter: number;
        let DelplayerIndex: any;
        let DelplayerInfo: any;
        let selectionArray = Object.assign({}, this.selection.selected);

        for (var index in selectionArray) {
            if (selectionArray[index]) {
                // let founded = this.tournamentMembers.filter((a) => {
                //   return a.id == selectionArray[index].id;
                // });

                // if (founded.length == 0)
                //   this.tournamentMembers.push(selectionArray[index]);

                let member: any = {
                    tournamentId: this.data.tournamentID,
                    playerId: selectionArray[index].id,
                    status: true,
                };
                if (this.data.subTournamentID !== undefined && this.data.subTournamentID !== "") {
                    let member: any = {
                        tournamentId: this.data.subTournamentID,
                        playerId: selectionArray[index].id,
                        status: true,
                        category: selectionArray[index].playerCategory
                    };
                    tournamentMember.push(member);
                }
                tournamentMember.push(member);
                counter = parseInt(index) + 1;
                //console.log(counter);

                //console.log(selectionArray);
            }
        }
        //this.showCategory = false;
        ////console.log(this.categoryCounts[0]);

        //this.categoryCounts[0].value = this.categoryCounts[0].value - counter;
        ////console.log(this.categoryCounts[0].value);

        //console.log(tournamentMember);

        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentMember)
        );

        if (result) {
            this.snackBar.open('Tournament members have been saved.', 'x', {
                duration: 3000,
            });
            this.dialogRef.close(tournamentMember);
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
            // this.player = matchingList['Result'];
            console.log(matchingList['Result']);
            if (this._localStorage.isClubAdmin()) {
                matchingList['Result'] = matchingList['Result'].filter((a) => {
                    return (
                        a?.professionalMembership?.some((b) => b?.club?.id == this.loggedInuser.adminClubId) ||
                        a?.membership?.some((b) => b?.club?.id == this.loggedInuser.adminClubId)
                    );
                });
            }
            this.setDataSource(matchingList['Result']);

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
    setDataSource(dataSource) {
        this.dataSource = new MatTableDataSource(dataSource);

        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }
    close() {
        this.dialogRef.close();
    }
    addNewPlayer() {
        this.playerForm = new FormGroup({
            firstName: new FormControl('', [
                Validators.required,
                Validators.maxLength(60),
            ]),
            lastName: new FormControl('', [
                Validators.required,
                Validators.maxLength(60),
            ]),

            email: new FormControl('', [Validators.email]),
            phone: new FormControl(''),
            dob: new FormControl(''),
            playerCategory: new FormControl('', [Validators.required]),
            handicap: new FormControl('', [Validators.required]),

            playerClubMember: new FormControl(
                this.loggedInuser ? this.loggedInuser.adminClubId : '',
                [this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin() ? Validators.required : Validators.nullValidator]
            ),
            membershipNumber: new FormControl(''),
        });
        this.show = false;
    }

    public createPlayer = (playerFormValue: any) => {
        if (this.playerForm.valid) {
            this.executePlayerCreation(playerFormValue);
        }
    };
    async executePlayerCreation(playerFormValue: any) {
        let newFlag = true;
        let checkEmail: Player[] = [];
        let checkPhone: Player[] = [];

        const email = this.playerForm.get('email')?.value;
        const phone = this.playerForm.get('phone')?.value;

        if (email) {
            checkEmail = await this.facadeService.getPlayerByEmail(email) as Player[];
        }

        if (phone) {
            checkPhone = await this.facadeService.getPlayerByPhone(phone) as Player[];
        }

        const existingPlayer = checkEmail[0] || checkPhone[0];

        if (existingPlayer) {
            const member = {
                tournamentId: this.data.tournamentID,
                playerId: existingPlayer.id,
                category: existingPlayer.playerCategory,
                status: true,
            };

            await this.facadeService.insertTournamentMember([member]);
            this.dialogRef.close(existingPlayer);
            return;
        }

        if (
            (checkEmail.length > 0 || checkPhone.length > 0)
        ) {
            newFlag = false;
        }

        let clubMember: ClubMembership[] = [];

        let UniqueId: string = '';
        let GEMId: string = '';

        let member: any = {
            clubId: playerFormValue.playerClubMember,
        };

        clubMember.push(member);
        // let players: any[] = await this.facadeService.getallPlayersforGGid();
        // var sortarray = players['player'];
        // sortarray.sort(this.Comparator);
        //console.log(sortarray);
        UniqueId = UniqueIdGenerator.generate();
        // GEMId = generateGemId.generate(sortarray[0].gemId);

        ////console.log(playerFormValue.isClubAdmin);
        const player: Player = {
            id: UniqueId,
            adminClubId:
                playerFormValue.isClubAdmin == true
                    ? playerFormValue.playerClubMember
                    : null,
            firebaseUid: null,

            fcmToken: null,
            addedBy: this.loggedInuser ? this.loggedInuser.id : null,
            gemId: null,
            firstName: playerFormValue.firstName,
            lastName: playerFormValue.lastName,
            gender: playerFormValue.gender,
            dob: General.parseToDate(playerFormValue.dob),
            picture: playerFormValue.picture,
            email: playerFormValue.email,
            phone: playerFormValue.phone,
            playerCategory: playerFormValue.playerCategory,
            handicap: playerFormValue.handicap,
            online: false,
            countryCode: playerFormValue.countryCode,
            extraData: playerFormValue.extraData,
            userRole: playerFormValue.isClubAdmin == true ? 2 : 3,
            membership: !this._localStorage.isTournamentManager() ? clubMember : null,
            membershipNumber: playerFormValue.membershipNumber,
        };

        if (newFlag) {
            ////console.log("Going to add new player");
            const isSuccess = <boolean>(
                await this.facadeService.AddPlayer(player)
            );
            ////console.log(isSuccess);
            if (isSuccess) {
                let member: any = {
                    tournamentId: this.data.tournamentID,
                    playerId: player.id,
                    status: true,
                    category: player.playerCategory,
                };
                await this.saveMembers(member);
                this.snackBar.open('Player has been created.', 'x', {
                    duration: 5000,
                });
                // this.reset();
                //this.router.navigate(['/players']);
            }
        }

        this.response = player;
        this.dialogRef.close(this.response);
        //console.log(this.response);
    }
    public hasError = (controlName: string, errorName: string) => {
        return this.playerForm.controls[controlName].hasError(errorName);
    };

    public reset() {
        this.playerForm.reset();
    }


    async saveMembers(tournamentMember: TournamentMember[]) {
        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentMember)
        );
    }
}
