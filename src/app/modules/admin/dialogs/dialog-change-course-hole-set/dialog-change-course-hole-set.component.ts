import { Component, Inject, OnInit, ViewChild } from '@angular/core';
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
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import { Player, CourseTee, UserSessionModel } from '../../../../shared/models/player.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import {
    DailyRound,
    Tournament,
    TournamentMember,
} from '../../../../shared/models/tournament.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { of, Observable } from 'rxjs';
import { DatePipe } from '@angular/common';
import { DialogAddPlayerComponent } from '../dialog-add-player/dialog-add-player.component';
import { DialogOverviewComponent } from '../dialog-overview/dialog-overview.component';
import { DialogAddExisitingPlayerComponent } from '../dialog-add-exisiting-player/dialog-add-exisiting-player.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-change-course-hole-set',
    templateUrl: './dialog-change-course-hole-set.component.html',
    styleUrls: ['./dialog-change-course-hole-set.component.scss'],
})
export class DialogChangeCourseHoleSetComponent implements OnInit {

    selectedCourseHoleSet: string;
    currentHoleSet: string;
    courseHoleSetNames;
    protected totalFlights: any[] = [];
    tees: any = [];
    public starterForm: FormGroup;
    public frmTitle: string;
    private playerID: string;
    currentPlayer: any = [];
    clubID: any;
    currentDate: Date;
    deleteProfile: any;
    playerTees: Map<string, any> = new Map<string, any>();

    loggedInuser: UserSessionModel;
    courseTee: CourseTee[] = [];
    updateHandicap: boolean = false;
    handicapLog: any;
    playerStatus: Boolean = false;
    currentTournament: Tournament;
    selectedMembers: any = [];
    tournamentMembers: Player[] = [];
    flightMembers: FlightMembers[] = [];

    filteredClubOptions: Observable<Club[]>;
    hideClubs: boolean = true;
    clubTitle: string;
    tournamentID: string;
    playTee: any[] = [];
    DailyRound: any;
    flightTime: any;
    membersColumns: string[] = [
        'name',
        'handicap',
        'category',
        'tee',
        'delete',
    ];
    membersSource: MatTableDataSource<Player>;
    isLoading = true;
    delMember: any[] = [];
    addMember: any[] = [];
    showTournamentTitle: Boolean = false;

    @ViewChild(MatPaginator) Mempaginator: MatPaginator;
    @ViewChild('msort') Memsort: MatSort;
    routeDate: string;

    constructor(
        public dialogRef: MatDialogRef<DialogChangeCourseHoleSetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private datepipe: DatePipe,
        public dialog: MatDialog,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
        public snackBar: MatSnackBar, private _localStorage: LocalStorageService,
        public facadeService: FacadeService,
        private logger: LogsService
    ) { }

    async ngOnInit() {
        this.logger.log('Change Course Hole Set Dialog Opened', "info", { tournament: this.data?.tournament, course: this.data?.course, currentHoleSet: this.data?.currentHoleSet, members: this.data?.members?.length });
        // console.log(this.data);
        this.currentHoleSet =
            this.data.currentHoleSet + '_' + this.data.courseHoleSetsInverted;
        this.selectedCourseHoleSet =
            this.data.currentHoleSet + '_' + this.data.courseHoleSetsInverted;
        this.getSelectedCourse(this.data.course);
        this.getCourseTees(this.data.course);
        this.tournamentID = this.data.tournament;
        //console.log(this.currentHoleSet);
        //console.log(General.getPlayersTee(this.data.course));
        this.route.paramMap.subscribe((params) => {
            this.routeDate = params.get('id');
        });
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

        if (this.loggedInuser) {

            this.hideClubs = this._localStorage.isClubAdmin() ? true : false;
            this.clubTitle = this.loggedInuser.club ? this.loggedInuser.club.name : '';
        }

        // for(let member of this.data.members) {

        //   let playerTee: any = this.playerTees.get(member.playerId);

        // //console.log(playerTee);
        //   let flightMember = {
        //     playerId: member.playerId,
        //     attendance: false,
        //     playingTee: playerTee.value,
        //     guest: null
        //   }

        //   roundMembers.push(flightMember);
        // }

        let flightTime = '';

        if (this.data.time) {
            let time = this.data.time.split(':', 2);
            flightTime = time.length > 0 ? time[0] + ':' + time[1] : '';
        }

        this.starterForm = new FormGroup({
            holeSets: new FormControl(
                this.data.currentHoleSet +
                '_' +
                this.data.courseHoleSetsInverted,
                [Validators.required]
            ),
            title: new FormControl(''),
            roundCategory: new FormControl(this.data.tournamentFlight == true ? 'true' : 'false', [Validators.required]),
            members: new FormControl(this.data.members, [Validators.required]),
            startingTime: new FormControl(flightTime, [Validators.required]),
            roundTee: new FormControl(this.data.tee, [Validators.required]),
            playingTee: new FormControl([], [Validators.required]),
            addMembers: new FormControl(this.tournamentMembers),
            deleteMembers: new FormControl(this.delMember),
        });

        //console.log(this.starterForm.value.members);
        this.courseTee = General.getPlayersTee(this.data.course);
        //console.log(this.courseTee);

        this.membersSource = new MatTableDataSource(
            this.starterForm.value.members
        );
        //console.log(this.membersSource);

        this.clubID = this.loggedInuser?.adminClubId;
        this.currentDate = new Date();
        // this.getSelectedCourse(this.loggedInuser?.courseId);
    }

    changeFlight(item) {
        this.logger.log('Admin Changes Hole Set in Change Course Hole Set Dialog', "info", item?.value);
        //console.log('Selected value: ' + item.value);
        this.starterForm.value.holeSets = item.value;
        //console.log(this.starterForm);
    }

    changeRound(item) {
        this.logger.log('Admin Changes Round Category in Change Course Hole Set Dialog', "info", item?.value);
        if (item.value == 'true') {
            this.starterForm.get('title').setValidators([Validators.required]);
            this.starterForm.get('title').updateValueAndValidity();
            this.showTournamentTitle = true;
        } else {
            this.starterForm.get('title').clearValidators();
            this.starterForm.get('title').updateValueAndValidity();
            this.showTournamentTitle = false;
        }
    }

    selectedTee(event, playerId) {
        this.logger.log('Admin Changes Player Tee in Change Course Hole Set Dialog', "info", { playerId: playerId, tee: event?.value });
        //console.log(playerId);
        let target = event.source.selected._element.nativeElement;
        let selectedData = {
            value: event.value,
            text: target.innerText.trim(),
        };

        this.playerTees.set(playerId, selectedData);
        //console.log(this.playerTees);

        this.starterForm.value.members = this.starterForm.value.members.map(member => {
            if (member.playerId === playerId) {
                return {
                    ...member,
                    tee_id: selectedData.value,
                    playingTee: selectedData.text
                };
            }
            return member;
        });
        //console.log(this.playTee);
        //console.log(this.starterForm);
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Change Course Hole Set Dialog', "info");
        this.dialogRef.close();
    }

    getSelectedCourse(course) {
        this.facadeService
            .getCourseHoleSets(course)
            .subscribe((selectedCourseHoleSet) => {
                //console.log(selectedCourseHoleSet);
                if (selectedCourseHoleSet.course_hole_sets.length > 0) {
                    this.courseHoleSetNames =
                        selectedCourseHoleSet.course_hole_sets;
                    //console.log(this.courseHoleSetNames);
                    //this.showCourseHole = true;
                } else {
                    //this.showCourseHole = false;
                }
            });
    }

    async getCourseTees(course) {
        let tee = await this.facadeService.getTeesOfCourse(course);
        if (tee['course_tees'].length > 0) {
            for (let obj of tee['course_tees']) {
                let tee = {
                    name: obj.name_by_club,
                    color: obj.color,
                    tee_id: obj.tee_id,
                };
                this.tees.push(tee);
            }
        }

    }

    public hasError = (controlName: string, errorName: string) => {
        return this.starterForm.controls[controlName].hasError(errorName);
    };

    public onCancel = () => {
        this.logger.log('Admin Click on Cancel (Back) in Change Course Hole Set Dialog', "info");
        this.location.back();
    };

    async searchPlayer(query) {
        this.logger.log('Admin Search Player in Change Course Hole Set Dialog', "info", query);
        let player;

        if (query) {
            player = <Player[]>(
                await this.facadeService.getPlayerByMembershipNumber(query)
            );

            if (!player || player.length == 0) {
                player = <Player>(
                    await this.facadeService.getPlayerByMembershipNumberClubwise(this.clubID['id'], query, query)
                );
            }

            this.logger.log('Search Player in Change Course Hole Set Dialog Successful', "info", { found: player?.length });
            if (player.length == 1) {
                let founded = this.starterForm.value.members.filter((a) => {
                    if (a.PlayerQL) {
                        return a.PlayerQL.id == player[0].id;
                    } else {
                        return a.id == player[0].id;
                    }
                });
                //console.log(founded);

                if (founded.length == 0) {
                    if (this.starterForm.value.members.length > 4) {
                        this.snackBar.open(
                            "Maximum 5 players are allowed per flight.",
                            "x",
                            {
                                duration: 5000,
                            }
                        );

                        return;
                    }
                    let todayRoundCheck =
                        await this.facadeService.getPlayerTodayRound(
                            player[0].id,
                            this.data.date
                        );
                    //console.log(todayRoundCheck);
                    if (todayRoundCheck && todayRoundCheck.length > 0) {
                        this.snackBar.open(
                            'Player already played in a round today.',
                            'x',
                            {
                                duration: 5000,
                            }
                        );

                        return;
                    }
                    this.starterForm.value.members.push(player[0]);
                    this.logger.log('Player Added to Flight List in Change Course Hole Set Dialog', "info", player[0]?.id);

                    this.syncTournamentMembers();
                    this.snackBar.open(
                        'Player has been added in the list.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );
                } else {
                    this.snackBar.open(
                        'Player already exist in the list.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );
                }
            } else {
                if (player.length == 0) return;
                const dialogRef = this.dialog.open(
                    DialogAddExisitingPlayerComponent,
                    {
                        width: '80%',
                        data: { players: player },
                    }
                );

                dialogRef.afterClosed().subscribe(async (result) => {
                    //console.log(result);
                    this.logger.log(result ? 'Select Existing Player Dialog Confirmed in Change Course Hole Set Dialog' : 'Select Existing Player Dialog Cancelled in Change Course Hole Set Dialog', "info", result?.player?.id);
                    if (result) {
                        ////console.log("record deleted.");
                        //console.log(result);

                        let founded = this.starterForm.value.members.filter(
                            (a) => {
                                if (a.PlayerQL) {
                                    return a.PlayerQL.id == result['player'].id;
                                } else {
                                    return a.id == result['player'].id;
                                }
                            }
                        );
                        //console.log(founded);

                        //console.log(this.data.date);
                        if (founded.length == 0) {
                            if (this.starterForm.value.members.length > 4) {
                                this.snackBar.open(
                                    "Maximum 5 players are allowed per flight.",
                                    "x",
                                    {
                                        duration: 5000,
                                    }
                                );

                                return false;
                            }
                            //console.log(this.data.date);
                            let todayRoundCheck =
                                await this.facadeService.getPlayerTodayRound(
                                    result['player'].id,
                                    this.data.date
                                );
                            //console.log(todayRoundCheck);
                            if (todayRoundCheck && todayRoundCheck.length > 0) {
                                this.snackBar.open(
                                    'Player already played in a round today.',
                                    'x',
                                    {
                                        duration: 5000,
                                    }
                                );

                                return;
                            }
                            this.starterForm.value.members.push(result.player);
                            //console.log(this.starterForm.value.members);
                            this.syncTournamentMembers();
                            this.snackBar.open(
                                'Player has been added in the list.',
                                'x',
                                {
                                    duration: 5000,
                                }
                            );
                        } else {
                            this.snackBar.open(
                                'Player already exist in the list.',
                                'x',
                                {
                                    duration: 5000,
                                }
                            );
                        }
                    } else {
                        ////console.log("cancel delete action");
                    }
                });
            }
        }
    }

    syncTournamentMembers() {
        of(this.starterForm.value.members)
            .pipe()
            .subscribe(
                (data) => {
                    this.isLoading = false;
                    //console.log(this.starterForm.value.members);
                    this.starterForm.value.members.forEach(obj => {
                        // Always ensure PlayerQL exists

                        if (obj?.PlayerQL?.firstName && obj?.PlayerQL?.lastName) {
                            obj.PlayerQL.fullName =
                                `${obj.PlayerQL.firstName || ''} ${obj.PlayerQL.lastName || ''}`.trim();
                        }
                    });
                    this.membersSource = new MatTableDataSource(
                        this.starterForm.value.members
                    );
                    this.membersSource.sort = this.Memsort;
                    this.membersSource.paginator = this.Mempaginator;
                    //console.log(this.membersSource);

                    //this.updateTMCategorySelection();
                },
                (error) => (this.isLoading = false)
            );
    }

    addPlayer() {
        this.logger.log('Admin Click on Add Player in Change Course Hole Set Dialog', "info", { tournamentID: this.tournamentID });
        const dialogRef = this.dialog.open(DialogAddPlayerComponent, {
            data: { flights: this.selectedMembers.length, tournamentID: this.tournamentID },
        });

        dialogRef.afterClosed().subscribe((result) => {
            this.logger.log(result ? 'Add Player Dialog Confirmed in Change Course Hole Set Dialog' : 'Add Player Dialog Cancelled in Change Course Hole Set Dialog', "info", result?.id);
            if (result) {
                ////console.log("record deleted.");
                //console.log(result);
                this.flightMembers.push(result);
                this.tournamentMembers.push(result);
                ////console.log(this.clubMembers);
                this.syncTournamentMembers();
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    removePlayer(playerId: string) {
        this.logger.log('Admin Click on Remove Player in Change Course Hole Set Dialog', "info", playerId);
        //console.log(playerId);
        this.delMember.push(playerId);
        //console.log(this.starterForm.value.members);
        let data: any = this.starterForm.value.members;
        //console.log(data);
        let DelplayerIndex: any = data.findIndex((a) => {
            if (a.PlayerQL) {
                return a.PlayerQL.id == playerId;
            } else {
                return a.id == playerId;
            }
        });
        //console.log(DelplayerIndex);

        let DelplayerInfo: any = data.filter((a) => {
            if (a.PlayerQL) {
                return a.PlayerQL.id == playerId;
            } else {
                return a.id == playerId;
            }
        });
        //console.log(DelplayerInfo);

        ////console.log(flight + "<- ->" + player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to remove this player from group?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            this.logger.log(result ? 'Remove Player Confirmed in Change Course Hole Set Dialog' : 'Remove Player Cancelled in Change Course Hole Set Dialog', "info", playerId);
            if (result) {
                ////console.log("record deleted.");
                data.splice(DelplayerIndex, 1);
                //data.splice(playerId, 1);
                //console.log(data);
                //this.tournamentMembers.splice(0,0,DelplayerInfo[0])
                this.tournamentMembers = data;

                this.syncTournamentMembers();

                //this.facadeService.deleteTournamentMember(this.tournamentID, playerId);
            } else {
                //console.log('cancel delete action');
            }
        });
    }
}
