import { Component, Inject, OnInit } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogClose,
} from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../../../shared/models/club.model';
import {
    Player,
    PlayerCategory,
    ClubMembership,
} from '../../../../shared/models/player.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { TournamentMember } from 'app/shared/models/tournament.model';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-add-player',
    templateUrl: './dialog-add-player.component.html',
    styleUrls: ['./dialog-add-player.component.scss'],
})
export class DialogAddPlayerComponent implements OnInit {

    public response: Player;
    public player: Player;
    tournamentQL: any;
    public playerForm: FormGroup;
    public frmTitle: string;
    private playerID: string;
    currentPlayer: any = [];
    playerCategories: PlayerCategory[] = [];
    golfClubs: Club[] = [];
    listCountries: any[] = [];
    loggedInuser: Player;
    showClub: boolean = true;
    showCategory: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<DialogAddPlayerComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
        public snackBar: MatSnackBar,
        public facadeService: FacadeService, public _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    async ngOnInit() {
        this.logger.log('Add Player Dialog Opened', "info", { tournamentID: this.data?.tournamentID });
        ////console.log(this.route.snapshot.paramMap.get("id"));

        this.route.paramMap.subscribe((params) => {
            this.playerID = params.get('id');
        });
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
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
            playerCategory: new FormControl('Amateurs', [Validators.required]),
            handicap: new FormControl('', [Validators.required]),
            playerClubMember: new FormControl(
                this._localStorage.isClubAdmin() ? this.loggedInuser.adminClubId : '',
                [this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin() ? Validators.required : Validators.nullValidator]
            ),
            membershipNumber: new FormControl(''),
        });

        let data = await this.facadeService.getTournamentByID(
            this.data.tournamentID
        );
        this.tournamentQL = data?.tournament?.[0];

        if (this._localStorage.isTournamentManager()) {
            this.showClub = false;
        }

        if (this.tournamentQL.skipCategory) {
            this.showCategory = false;
        }


        if (this.tournamentQL['CategoriesQL'].length > 0) {
            for (let obj of this.tournamentQL['CategoriesQL']) {
                let obja = {
                    id: 1,
                    name: obj.category,
                };
                this.playerCategories.push(obja);
            }
        } else {
            this.playerCategories = this.facadeService.getPlayerCategories();
        }

        let dataClubs = await this.facadeService.getClubList();
        this.golfClubs = dataClubs.club;

        this.listCountries = General.getCountries();

        if (this.playerID) {
            this.frmTitle = 'Update Player Form';
            //this.facadeService.findOne(this.playerID).subscribe(result => this.currentPlayer = result.player);
            this.currentPlayer = <Player>(
                await this.facadeService.getPlayerByID(this.playerID)
            );

            //console.log(this.currentPlayer);

            this.playerForm.setValue({
                firstName: this.currentPlayer[0].firstName,
                lastName: this.currentPlayer[0].lastName,
                gender: this.currentPlayer[0].gender,
                email: this.currentPlayer[0].email,
                phone: this.currentPlayer[0].phone,
                dob: this.currentPlayer[0].dob,
                picture: this.currentPlayer[0].picture,
                playerCategory: this.currentPlayer?.[0].playerCategory,
                handicap: this.currentPlayer[0].handicap,

                playerClubMember: this.loggedInuser
                    ? this.loggedInuser.adminClubId
                    : '',

                membershipNumber: this.currentPlayer[0].membershipNumber,
            });
        } else {
            this.frmTitle = 'Create Player Form';
        }
    }

    public hasError = (controlName: string, errorName: string) => {
        return this.playerForm.controls[controlName].hasError(errorName);
    };

    public reset() {
        this.playerForm.reset();
    }

    public onCancel = () => {
        this.logger.log('Admin Click on Cancel in Add Player Dialog', "info");
        this.location.back();
    };

    public createPlayer = (playerFormValue: any) => {
        this.logger.log('Admin Click on Save in Add Player Dialog', "info", { firstName: playerFormValue?.firstName, lastName: playerFormValue?.lastName, playerCategory: playerFormValue?.playerCategory, valid: this.playerForm?.valid });
        if (this.playerForm.valid) {
            this.executePlayerCreation(playerFormValue);
        }
    };

    async isEmailExist() {
        let flag = false;

        let checkEmail = <Player>(
            await this.facadeService.getPlayerByEmail(
                this.playerForm.get('email').value
            )
        );
        ////console.log(checkEmail);
        if (checkEmail) flag = true;

        return flag;
    }

    async isPhoneExist() {
        let flag = false;

        let checkEmail = <Player>(
            await this.facadeService.getPlayerByPhone(
                this.playerForm.get('phone').value
            )
        );
        ////console.log(checkEmail);
        if (checkEmail) flag = true;

        return flag;
    }

    async executePlayerCreation(playerFormValue: any) {

        let tournamentMember: TournamentMember[] = [];
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

        const existingPlayer =
            checkEmail[0] || checkPhone[0];

        if (
            existingPlayer &&
            (!this.playerID || existingPlayer.id !== this.playerID)
        ) {
            const member = {
                tournamentId: this.data.tournamentID,
                playerId: existingPlayer.id,
                category: existingPlayer.playerCategory,
                status: true,
            };

            await this.facadeService.insertTournamentMember([member]);
            this.logger.log('Existing Player Added to Tournament from Add Player Dialog', "info", { tournamentId: member.tournamentId, playerId: member.playerId });
            this.dialogRef.close(existingPlayer);
            return;
        }

        if (
            (checkEmail.length > 0 || checkPhone.length > 0) &&
            this.playerID
        ) {
            newFlag = false;
        }


        let clubMember: ClubMembership[] = [];
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        let UniqueId: string = '';
        let GEMId: string = '';

        let member: any = {
            clubId: playerFormValue.playerClubMember,
        };

        clubMember.push(member);
        // let players:any[] = await this.facadeService.getallPlayersforGGid();
        // var sortarray = players['player'];
        // sortarray.sort(this.Comparator);
        //console.log(sortarray);
        this.playerID
            ? (UniqueId = this.playerID)
            : (UniqueId = UniqueIdGenerator.generate());
        // this.currentPlayer.length > 0
        //     ? (GEMId = this.currentPlayer.gemId)
        //     : (GEMId = generateGemId.generate(sortarray[0].gemId));

        ////console.log(playerFormValue.isClubAdmin);
        const player: Player = {
            id: UniqueId,
            adminClubId:
                playerFormValue.isClubAdmin == true
                    ? playerFormValue.playerClubMember
                    : null,
            firebaseUid:
                this.currentPlayer.length > 0
                    ? this.currentPlayer.firebaseUid
                    : null,
            fcmToken:
                this.currentPlayer.length > 0
                    ? this.currentPlayer.fcmToken
                    : null,
            gemId: null,
            addedBy: this.loggedInuser.id,
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
            userRole: this._localStorage.isTournamentManager() ? 10 : 3,
            membership: !this._localStorage.isTournamentManager() ? clubMember : null,
            membershipNumber: playerFormValue?.membershipNumber ?? '',
        };
        let password = Math.random().toString(36).slice(-8);
        if (newFlag && !this.playerID) {

            await this.facadeService.updateAccountInFirebase(player.email, password).subscribe(async (re) => {
                if (re) {
                    this.facadeService.sendTransactionalEmail(player.email, player.firstName, password).subscribe();
                    ////console.log("Going to add new player");
                    const isSuccess = <boolean>(
                        await this.facadeService.AddPlayer(player)
                    );
                    ////console.log(isSuccess);
                    if (isSuccess) {
                        this.logger.log('Player Added Successfully from Add Player Dialog', "info", { playerId: player.id });
                        this.snackBar.open('Player has been added.', 'x', {
                            duration: 5000,
                        });
                        this.reset();
                        //this.router.navigate(['/players']);
                    }

                }


            })

        }

        this.response = player;
        this.dialogRef.close(this.response);
        //console.log(this.response);
    }

    public Comparator(a, b) {
        let gemIDA = parseInt(a['gemId'].slice(2));
        let gemIDB = parseInt(b['gemId'].slice(2));
        if (gemIDA < gemIDB) return 1;
        if (gemIDA > gemIDB) return -1;

        return 0;
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Close in Add Player Dialog', "info");
        this.dialogRef.close();
    }
}
