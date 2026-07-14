import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
    Input,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import {
    Player,
    TournamentMemberStatus,
    UserSessionModel,
    enumPlayerCategory,
} from '../../../../shared/models/player.model';
import { TeeTime } from '../../../../shared/models/teetime.model';
//import { Score } from '../../shared/models/score.model';
import { Hole } from '../../../../shared/models/hole.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    FormArray,
    FormControl,
    FormBuilder,
    Validators,
    FormGroup,
} from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    Constants,
    handicapAllocation,
    UniqueIdGenerator,
} from '../../../../shared/classes/general';
import {
    TournamentRounds,
    Tournament,
} from '../../../../shared/models/tournament.model';
//import { Score } from '../../shared/classes/score';
import { Score, ScoreDetail } from '../../../../shared/models/score.model';
import { DatePipe } from '@angular/common';
import { General } from '../../../../shared/classes/general';
import { LogsService } from '../../../../shared/services/logs.service';

import { of } from 'rxjs';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { DialogChangeCourseHoleSetComponent } from '../../dialogs/dialog-change-course-hole-set/dialog-change-course-hole-set.component';
import { HandicapService } from 'app/shared/services/handicap.service';
import { forEach } from 'lodash';
import { LocalStorageService } from 'app/shared/services/localStorage';
// import { DialogChangeCourseHoleSetComponent } from "../../material-components/dialog-change-course-hole-set/dialog-change-course-hole-set.component";
// import { DialogOverviewComponent } from "../../material-components/dialog-overview/dialog-overview.component";
@Component({
    standalone: false,
    selector: 'app-view-daily-round',
    templateUrl: './view-daily-round.component.html',
    styleUrls: ['./view-daily-round.component.scss'],
})
export class ViewDailyRoundComponent implements OnInit {
    memberStatusesQLs: TournamentMemberStatus[] = [];
    Leaderboard: any;
    private noOfHolesInCourse: number = 18;
    activeRound: number;
    totalRounds: number;
    flightRound: number;
    fPlayer: any[] = [];
    isLoading: boolean = false;
    showResult: boolean = false;
    tRounds: TournamentRounds[] = [];
    roundFlights: any[] = [];
    matchFormat: string;
    teamMatch: boolean;
    selectedSubTournament: string;
    subTournamentDetail: any[] = [];
    players: Player;
    activePlayers: Player[] = [];
    playerScores: Score[];
    categories: any[] = [];
    allMatchResults: any[] = [];
    allLeadersGross: any[] = [];
    allLeadersCutOffGross: any[] = [];
    allLeadersCutOffNet: any[] = [];
    allLeadersNet: any[] = [];
    grossLeaders: any[] = [];
    netLeaders: any[] = [];
    grossAllLeaders: any[] = [];
    netAllLeaders: any[] = [];
    findex = 0;
    selectedCategory: any;
    selectedCategoryValue: string = '';
    upperCategoryLimit: boolean = false;
    showPairs: boolean;
    fDate: string;
    allRoundGrossScore: boolean = true;
    allRoundNetScore: boolean;
    allRoundCutOff: boolean = false;
    allRoundCutOffNet: boolean = false;
    cuttOffScore: number = 0;
    leaderGrossQL: any;
    leaderNetQL: any;
    selectedMembers: Player[][] = [];
    runningFlights: number = 0;
    isClubAdmin: boolean = false;
    isGross: boolean;
    isNet: boolean;
    lastActiveTab = 1;
    fName: any;
    fArray: any[] = [];
    cutOffList: any;
    clubItems: Promise<TeeTime[]>;
    noItemsInList = false;
    dailyRounds: any = [];
    myPlayer: TeeTime;
    loggedInuser: UserSessionModel;
    scheduleForm: FormGroup;
    refresh: boolean = false;
    minDate: Date;
    maxDate: Date;
    startingHole: string;
    startTime: string;
    RoundDate: string;
    currentDate: string;
    singleRound: any[] = [];
    roundSlots: string[] = [];
    file: File;
    arrayBuffer: any;
    playersData: any;
    savePlayers: TeeTime[] = [];
    duplicatePlayers: any[] = [];
    matchPlayData: any[] = [];
    matchPlayDataFixed: any[] = [];
    ddSelectedFlight: string = '0';
    currentRoundFlights: any[] = [];
    currentHoleSet: string;
    courseHoleSetNames;
    courseHoleSetNamesDisplay;
    selectedCourseHoleSet: string = '8_false';
    customDate: any;
    customDate2: any;
    customValue: boolean;
    showtable: boolean = true;
    calculateHandicap: boolean = false;
    dailyData: any;
    allRoundData;
    public starterForm: FormGroup;
    routeDate: any;
    duplicateIds: string[] = [];

    dailyStats: any[] = [];

    //scoreHeader: any[] = [];
    tournamentID: string;
    filterPlayer: string = '';
    coursesList: any[] = [];
    selectedCourse: string = '';
    courseHoleSet: number = 0;

    flightPlayers: any[] = [];
    filters: FormGroup;
    contactList: FormArray;
    dailyDate: any;

    dataSource: MatTableDataSource<any>;
    public response: any;
    scoreHeader: any[] = [];
    courseData: any[] = [];
    allScores: any[] = [];
    playerName: string;
    Dvalue: Date;
    flightCourseHoleSets: Map<string, any> = new Map<string, any>();
    flightCourseTees: Map<String, any> = new Map<string, any>();
    //scoreHeader: any[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('fileInput') fileInputVariable: ElementRef;
    index: number = 0;
    pageIndex: number = 0;
    lenght: any;
    pageSize: number = 20;

    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private handicapService: HandicapService,
        private router: Router,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _formBuilder: FormBuilder,
        public dialog: MatDialog,
        private logger: LogsService, private _localStorage: LocalStorageService
    ) { }

    ngOnInit() {
        try {
            this.logger.log('Admin Come to View Daily Round Page', "info");

            this.showtable = false;
            this.showResult = false;
            this.isLoading = true;

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            // this.dailyRounds = [];
            this.filters = this._formBuilder.group({
                name: [null, Validators.compose([Validators.required])],
            });
            this.route.paramMap.subscribe((params) => {
                this.routeDate = params.get('id');
            });
            this.logger.log('Getting View Daily Rounds Data By Date', "info", this.routeDate);

            //console.log(this.routeDate);

            of(this.dailyRounds)
                .pipe()
                .subscribe(
                    async (data) => {
                        this.getDailyRounds(this.routeDate);
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {

        }
    }

    async getDailyRounds(date) {
        this.isLoading = true;
        let dataPlayers: any;
        //console.log(this.loggedInUser);
        if (this._localStorage.isClubAdmin()) {
            dataPlayers = await this.facadeService.getSingleDailyRound(
                this.loggedInuser.adminClubId,
                date
            );
        } else {
            dataPlayers = await this.facadeService.getSingleDailyRoundAdmin(
                date
            );
        }

        let courseId = this.loggedInuser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
        let selectedCourseHoleSet =
            await this.facadeService.getCourseHoleSetsForCourse(courseId);
        this.courseHoleSetNames = selectedCourseHoleSet['course_hole_sets'];
        //this.courseHoleSetNamesDisplay = selectedCourseHoleSet['course_hole_sets'].filter(a=>a.isActive==true);
        //console.log(selectedCourseHoleSet);
        this.lenght = dataPlayers.TournamentsQL.length;
        // this.lenght /= 20;
        // this.lenght = Math.ceil(this.lenght);
        //console.log(this.courseHoleSetNames);
        //console.log(dataPlayers);
        this.matchPlayData = dataPlayers.TournamentsQL;
        this.matchPlayDataFixed = dataPlayers.TournamentsQL;
        this.matchPlayDataFixed = this.matchPlayDataFixed.sort(
            this.flightComparatorForFixed
        );
        //console.log(this.matchPlayData);

        this.parseSubscriptionResponse(this.routeDate, false);
    }

    async parseSubscription(date) {
        if (this.matchPlayData == null) {
            return false;
        }

        let tournamentData: any = this.matchPlayData;

        //console.log(tournamentData);

        //console.log(date);
        let newDate = General.parseToDate(date);
        //console.log(this.datePipe.transform(newDate.toString(), 'yyyy-MM-dd'));
        let flightDate = this.datePipe.transform(
            newDate.toString(),
            'yyyy-MM-dd'
        );

        for (let flight of tournamentData) {
            if (
                flight.FlightsQL.length > 0 &&
                flight.FlightsQL[0].date == flightDate
            ) {
                if (flight.noOfRounds > 0) {
                    //console.log(flight);
                    //console.log(this.filterPlayer);
                    if (this.filterPlayer) {
                        var filteredArray: any = flight.FlightsQL.filter(
                            (element) =>
                                element.MembersQL.some(
                                    (MembersQL) =>
                                        MembersQL.PlayerQL.firstName
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            ) ||
                                        MembersQL.PlayerQL.membershipNumber ==
                                        this.filterPlayer ||
                                        MembersQL.PlayerQL.lastName
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            ) ||
                                        (
                                            MembersQL.PlayerQL.firstName +
                                            ' ' +
                                            MembersQL.PlayerQL.lastName
                                        )
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            )
                                )
                        ).map((element) => {
                            let n = Object.assign({}, element, {
                                MembersQL: element.MembersQL.filter(
                                    (subElement) =>
                                        subElement.PlayerQL.firstName
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            ) ||
                                        subElement.PlayerQL.membershipNumber ==
                                        this.filterPlayer ||
                                        subElement.PlayerQL.lastName
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            ) ||
                                        (
                                            subElement.PlayerQL.firstName +
                                            ' ' +
                                            subElement.PlayerQL.lastName
                                        )
                                            .toLowerCase()
                                            .trim()
                                            .includes(
                                                this.filterPlayer
                                                    .toLowerCase()
                                                    .trim()
                                            )
                                ),
                            });
                            return n;
                        });
                        //console.log(filteredArray);
                        //console.log(filteredArray);

                        //console.log(flight.FlightsQL);
                    }

                    ////console.log(this.roundFlights);

                    if (this.filterPlayer) {
                        if (filteredArray.length > 0) {
                            let flightScore =
                                await this.facadeService.getRoundScore(
                                    filteredArray[0]['id']
                                );
                            this.setupMatchplay(
                                filteredArray,
                                flight.FlightsQL[0].CourseQL,
                                flightScore.FlightQL[0]['MembersQL'],
                                true
                            );
                        }
                    } else {
                        //console.log(flight);
                        this.fPlayer.push(flight.FlightsQL);
                        this.setupMatchplay(
                            this.fPlayer,
                            flight.FlightsQL[0].CourseQL,
                            [],
                            true
                        );
                    }
                }
            } else {
                //console.log('Unamatched');
            }
        }
    }

    private async setupMatchplay(
        flightsQLs: any[],
        course: any[],
        roundScore: any[],
        flag: boolean
    ) {
        //console.log(flightsQLs);

        for (let flightData of flightsQLs) {
            let flightHeader = await this.setupMatchplayHeader(
                flightData.courseId,
                flightData.courseHoleSets,
                flightData.courseHoleSetsInverted,
                course
            );
            //console.log(flightHeader);

            let singleFlight = this.setupSingleFlight(
                flightData,
                flightHeader,
                roundScore
            );

            let courseHoleSetTitle;
            if (flightData.CourseQL && this.courseHoleSetNames) {
                courseHoleSetTitle = this.courseHoleSetNames.find((a) => {
                    return (
                        a.holeSets == flightData.courseHoleSets &&
                        a.inverted == flightData.courseHoleSetsInverted
                    );
                });
            }

            this.flightPlayers.push(singleFlight);
            this.flightPlayers[this.flightPlayers.length - 1]['header'] =
                flightHeader;
            this.flightPlayers[this.flightPlayers.length - 1]['flightId'] =
                flightData.id;
            this.flightPlayers[this.flightPlayers.length - 1]['tournamentId'] =
                flightData.tournamentId;
            this.flightPlayers[this.flightPlayers.length - 1]['categoryRound'] =
                flightData.categoryRound;
            this.flightPlayers[this.flightPlayers.length - 1]['flightTime'] =
                flightData.time;
            this.flightPlayers[this.flightPlayers.length - 1][
                'courseHoleSetTitle'
            ] = courseHoleSetTitle ? courseHoleSetTitle.displayName : '';
            this.flightPlayers[this.flightPlayers.length - 1][
                'courseHoleSetKey'
            ] = courseHoleSetTitle
                    ? flightData.courseHoleSets +
                    '_' +
                    flightData.courseHoleSetsInverted
                    : '';
            this.flightPlayers[this.flightPlayers.length - 1]['courseTee'] =
                courseHoleSetTitle ? flightData.tee : '';
            this.flightPlayers[this.flightPlayers.length - 1]['membersCount'] =
                singleFlight ? singleFlight.length : 0;
            this.flightPlayers[this.flightPlayers.length - 1]['ended'] =
                flightData.ended;
        }
        //console.log('FILTERS' + this.flightPlayers);
        // this.dataSource = new MatTableDataSource(this.flightPlayers);
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.sort;
        //console.log(this.dataSource);
    }

    setupSingleFlight(flightData, flightHeader, roundScore) {
        ////console.log(flightData);
        ////console.log("Flight ID: " + flightData.id);
        let membersQLs: any = flightData.MembersQL;
        let singleFlight: any[] = [];

        ////console.log(par9);
        ////console.log(par18);
        ////console.log(flightData);
        for (let membersQL of membersQLs) {
            let player: Player = membersQL.PlayerQL;
            let playerScore: any[] = [];
            if (roundScore) {
                playerScore = roundScore.filter((a) => {
                    return a.playerId == player.id;
                });
            }
            if (playerScore.length == 0) {
                playerScore = membersQL.ScoresQL;
            }

            let playerId: String = player.id;

            if (player == null) {
                continue;
            }

            let playerHole9Score: any = [];
            let playerHole18Score: any[] = [];
            let playerHole9ScoreIds: any = [];
            let playerHole18ScoreIds: any[] = [];
            let gross9Total = 0;
            let gross18Total = 0;
            let holePlayed: number = 0;

            for (let i = 0; i < 9; i++) {
                // let courseHole = flightHeader.courseHoles9.filter(el => {
                //   return el.holeNo == (i + 1);
                // });

                ////console.log(courseHole);
                let currentHole = flightHeader.courseHoles9[i]
                    ? flightHeader.courseHoles9[i]
                    : [];
                let hole;
                if (roundScore.length > 0) {
                    hole = playerScore[0]['ScoresQL'].find((a) => {
                        return a.holeId == (currentHole ? currentHole.id : '');
                    });
                } else {
                    hole = playerScore.find((a) => {
                        return a.holeId == (currentHole ? currentHole.id : '');
                    });
                }
                ////console.log(hole);

                if (hole) {
                    playerHole9Score[i] = hole.grossScore;
                    playerHole9ScoreIds[i] = { id: hole.id, holeId: hole.holeId, playerId: playerId, flightId: flightData.id }
                    gross9Total += hole.grossScore;
                    holePlayed++;
                } else {
                    playerHole9Score[i] = '';
                    playerHole9ScoreIds[i] = {};
                }
            }

            for (let i = 0; i < 9; i++) {
                if (flightHeader.courseHoles18.length > 0) {
                    // let courseHole = flightHeader.courseHoles18.filter(el => {
                    //   return el.holeNo == ((i + 9) + 1);
                    // });

                    ////console.log(((i + 9) + 1));
                    ////console.log(courseHole);
                    let currentHole = flightHeader.courseHoles18[i]
                        ? flightHeader.courseHoles18[i]
                        : [];
                    let hole;
                    if (roundScore.length > 0) {
                        hole = playerScore[0]['ScoresQL'].find((a) => {
                            ////console.log(a.holeId + "<---->" + courseHole[0].id);
                            ////console.log((courseHole.length > 0)? courseHole[0].id : "");
                            return (
                                a.holeId == (currentHole ? currentHole.id : '')
                            );
                        });
                    } else {
                        hole = playerScore.find((a) => {
                            ////console.log(a.holeId + "<---->" + courseHole[0].id);
                            ////console.log((courseHole.length > 0)? courseHole[0].id : "");
                            return (
                                a.holeId == (currentHole ? currentHole.id : '')
                            );
                        });
                    }

                    ////console.log(hole);

                    if (hole) {
                        playerHole18Score[i] = hole.grossScore;
                        playerHole18ScoreIds[i] = { id: hole.id, holeId: hole.holeId, playerId: playerId, flightId: flightData.id }
                        gross18Total += hole.grossScore;
                        holePlayed++;
                    } else {
                        playerHole18Score[i] = '';
                        playerHole18ScoreIds[i] = {};
                    }
                }
            }
            let grossTotal: number = gross9Total + gross18Total;

            ////console.log(playerHole9Score);
            ////console.log(playerHole18Score);
            let undoHandicap = membersQL.undoHandicap == 0 ? false : true;
            let LeaderGross: any = {
                flightId: flightData.id,
                tournamentId: flightData.tournamentId,
                courseId: flightData.courseId,
                playerId: player.id,
                name: player.firstName + ' ' + player.lastName,
                picture: player.picture,
                memberShipNumber: player.membershipNumber,
                handicap: player.handicap,
                Hole9Scores: playerHole9Score,
                Hole9ScoresIds: playerHole9ScoreIds,
                Hole18ScoresIds: playerHole18ScoreIds,
                Hole18Scores: playerHole18Score,
                gross9Total: gross9Total,
                gross18Total: gross18Total,
                grossTotal: grossTotal,
                holesPlayed: holePlayed,
                undoHandicap: undoHandicap,
                panelty: membersQL.panelty,
            };

            singleFlight.push(LeaderGross);
        }

        return singleFlight;
    }

    yesterday() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 1));
    }

    endOfWeek() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 7));
    }

    endOfMonth() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 29));
    }

    redirectToDetails = (id: string) => {
        this.location.navigate(['/players/view/' + id]);
    };

    redirectToPlayersScore = (id: string) => {
        this.showtable = false;
        this.isLoading = true;
        this.location.navigate([
            'daily-rounds/add-player-daily-score/filter/' + id,
        ]);
    };

    redirectToUpdate = (id: string) => {
        this.location.navigate(['/players/update/' + id]);
    };

    getHandicapAllocation(): string {
        let hcAllocation: string;

        if (this.Leaderboard.handicapAllocations)
            hcAllocation =
                this.Leaderboard.handicapAllocations.handicapAllocation;
        else hcAllocation = handicapAllocation.AS_IS;

        return hcAllocation;
    }

    showDuplicates() {
        //console.log(this.duplicateIds.sort());
    }

    public getLastHolesTotal(noOfHoles: number, holeScores: any[]): number {
        let total: number = 0;

        for (let i = holeScores.length - 1; i >= 0 && noOfHoles > 0; i--) {
            total += holeScores[i];
            noOfHoles--;
        }

        return total;
    }

    private async parseSubscriptionResponse(date, flag): Promise<boolean> {
        this.duplicateIds = [];
        //console.log(date);
        // let dd = new Date();
        // dd.setDate((General.parseToDate(date)).getDate());
        // //console.log(dd);
        // //this.fDate = date;
        let newDate = General.parseToDate(date);
        //console.log(newDate);
        this.fDate = newDate.toString().substring(0, 16);
        //console.log(this.fDate);

        this.showtable = false;
        this.isLoading = true;

        this.singleRound.length = 0;
        this.flightPlayers = [];
        this.findex = 0;
        this.dailyStats = [];

        if (this.matchPlayData == null) {
            return false;
        }
        // let end = 0;
        // if (this.index == 0) {
        //   end = this.pageSize;
        // } else {
        //   end = this.index + this.pageSize;
        // }
        // if (end > this.matchPlayDataFixed.length) {
        //   end = this.matchPlayDataFixed.length % this.pageSize;
        // }
        // this.matchPlayData = this.matchPlayDataFixed.splice(this.index, end);
        // let tournamentData: any = this.matchPlayData;
        // //console.log(tournamentData);
        let count = 0;
        for (
            this.pageIndex;
            this.pageIndex < this.matchPlayDataFixed.length;
            this.pageIndex++
        ) {
            //console.log(this.pageIndex);
            count++;
            let flight = this.matchPlayDataFixed[this.pageIndex];
            if (
                flight.FlightsQL.length > 0 &&
                flight.FlightsQL[0].date == date
            ) {
                if (flag == true) {
                    let flightScore = await this.facadeService.getRoundScore(
                        flight.FlightsQL[0]['id']
                    );
                    flight.FlightsQL[0].courseHoleSets =
                        flightScore.FlightQL[0].courseHoleSets;
                    flight.FlightsQL[0].courseHoleSetsInverted =
                        flightScore.FlightQL[0].courseHoleSetsInverted;
                    //flight.FlightsQL[0].MembersQL.filter()
                    flightScore.FlightQL[0]['MembersQL'].forEach((obj) => {
                        const found = flight.FlightsQL[0].MembersQL.some(
                            (item) => {
                                return item.playerId === obj.playerId;
                            }
                        );
                        if (!found) {
                            flight.FlightsQL[0].MembersQL.push(obj);
                        }
                    });
                    this.setupMatchplayData(
                        flight.FlightsQL[0]['CourseQL'],
                        flight.FlightsQL,
                        flightScore.FlightQL[0]['MembersQL'],
                        true,
                        flight.id
                    );
                } else {
                    this.setupMatchplayData(
                        flight.FlightsQL[0]['CourseQL'],
                        flight.FlightsQL,
                        [],
                        true,
                        flight.id
                    );
                }

                this.allRoundData = this.flightPlayers;
            } else {
                //console.log('Unamatched');
            }
            if (count >= this.pageSize) break;
        }
        this.isLoading = false;
        //console.log('DETAILS' + this.flightPlayers);
        // for (let flight of tournamentData) {
        //   if (flight.FlightsQL.length > 0 && flight.FlightsQL[0].date == date) {
        //     this.setupMatchplayData(
        //       flight.FlightsQL[0]["CourseQL"],
        //       flight.FlightsQL,
        //       1,
        //       true,
        //       flight.id
        //     );

        //     this.allRoundData = this.flightPlayers;
        //   } else {
        //     //console.log("Unamatched");
        //   }
        // }
    }

    private async setupMatchplayHeader(
        courseId: string,
        holeSets: number,
        courseHoleSetsInverted: boolean,
        dataLeaderboard
    ) {
        //console.log(courseId);
        // let dataLeaderboard = await this.facadeService.getCourseInformation(
        //   courseId
        // );
        // //console.log(dataLeaderboard);

        this.isLoading = false;
        if (dataLeaderboard.HolesQL.length <= 0) return;

        let flightHeader: any[] = [];
        this.isLoading = false;
        this.courseHoleSet = holeSets;

        //if(this.courseHoleSet == 3) this.courseHoleSet = 12;

        let courseHoles9: Hole[] = [];
        let courseHoles18: Hole[] = [];
        let courseHoles27: Hole[] = [];
        let courseHoles36: Hole[] = [];

        let yardage9: number[] = [];
        let yardage18: number[] = [];
        let yardage27: number[] = [];
        let yardage36: number[] = [];

        let yardage9Total: number = 0;
        let yardage18Total: number = 0;
        let yardage27Total: number = 0;
        let yardage36Total: number = 0;

        let par9: number = 0;
        let par18: number = 0;
        let par27: number = 0;
        let par36: number = 0;

        let courseQLs: any = dataLeaderboard;
        //console.log(courseQLs);

        let holesQLs: any = courseQLs.HolesQL;

        var isPresent = this.coursesList.some(function (el) {
            return el.id === courseQLs.id;
        });

        if (!isPresent) {
            let courseInfo: any = {
                id: courseQLs.id,
                name: courseQLs.name,
            };
            this.coursesList.push(courseInfo);
        }

        ////console.log(this.coursesList)
        holesQLs = holesQLs.sort(this.Comparator);

        // console.log(holesQLs);
        //this.removeExtraHoleSets(holeSets, holesQLs, courseHoleSetsInverted);
        // this.getSelectedCourse("-LUFS3FCQKOGpJ2IEHmf");
        // //console.log(this.courseHoleSetNames);

        let holes = this.getHolesSets(
            holeSets,
            holesQLs,
            courseHoleSetsInverted,
            this.courseHoleSetNames
        );
        //console.log(holes);
        for (let holeQL of holes) {
            //let teeDistance = JSON.parse(holeQL.teeDistances);
            let teeDistance = holeQL?.meta[0]?.tee_distance ?? 0;

            if (holeQL.holeNo < 10) {
                yardage9Total += parseInt(teeDistance);
                par9 += holeQL.par;
                yardage9.push(parseInt(teeDistance));

                courseHoles9.push(holeQL);
            } else if (holeQL.holeNo > 9 && holeQL.holeNo < 19) {
                courseHoles18.push(holeQL);

                yardage18.push(parseInt(teeDistance));
                yardage18Total += parseInt(teeDistance);
                par18 += holeQL.par;
            } else if (holeQL.holeNo > 18 && holeQL.holeNo < 28) {
                yardage27.push(parseInt(teeDistance));
                yardage27Total += parseInt(teeDistance);
                par27 += holeQL.par;

                courseHoles27.push(holeQL);
            }
        }

        let parTotal: number =
            Number(par9) + Number(par18) + Number(par27) + Number(par36);
        let yardageTotal: number =
            Number(yardage9Total) +
            Number(yardage18Total) +
            Number(yardage27Total) +
            Number(yardage36Total);

        let scoreHeader: any = {
            courseHoles9: courseHoles9,
            courseHoles18: courseHoles18,
            courseHoles27: courseHoles27,
            courseHoles36: courseHoles36,
            yardage9: yardage9,
            yardage18: yardage18,
            yardage27: yardage27,
            yardage36: yardage36,
            yardage9Total: yardage9Total,
            yardage18Total: yardage18Total,
            yardage27Total: yardage27Total,
            yardage36Total: yardage36Total,
            par9: par9,
            par18: par18,
            par27: par27,
            par36: par36,
            parTotal: parTotal,
            yardageTotal: yardageTotal,
        };
        ////console.log(scoreHeader);
        flightHeader.push(scoreHeader);
        //console.log(scoreHeader);

        return scoreHeader;
        ////console.log(this.scoreHeader);
    }
    onPageFired(event) {
        try {
            this.logger.log('Admin click on pagination on View Daily Round', "info", event);
            //console.log(event);
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex * event.pageSize;
            this.parseSubscriptionResponse(this.routeDate, true);
        } catch (error) {
            this.logger.log('Getting Daily Round Data Failed', "error", error.toString());

        }
    }

    filterPlayerFlight(flag: boolean) {
        try {
            this.logger.log('Admin search on View Daily Round', "info", this.filters.get('name').value);

            if (flag) this.filterPlayer = this.filters.get('name').value;
            else {
                this.filterPlayer = '';
                this.filters.reset();
                this.pageIndex = 0;
                this.parseSubscriptionResponse(this.routeDate, true);
                // this.flightPlayers = this.allRoundData;
                return false;
            }

            //console.log(this.flightPlayers);

            this.flightPlayers = [];
            this.parseSubscription(this.fDate);
        } catch (error) {
            this.logger.log('Search on Daily Round Data Failed', "error", error.toString());

        }
    }

    public removeExtraHoleSets(
        courseHoleSets: number,
        holes,
        isCourseHoleSetsInverted: boolean
    ) {
        if (courseHoleSets == 0) {
            return;
        }
        let holes1to9: boolean = this.hasHoleSet1to9(courseHoleSets);
        let holes10to18: boolean = this.hasHoleSet10to18(courseHoleSets);
        let holes19to27: boolean = this.hasHoleSet19to27(courseHoleSets);
        let holes28to36: boolean = this.hasHoleSet28to36(courseHoleSets);
        //console.log(holes1to9);
        //console.log(holes10to18);
        //console.log(holes19to27);
        //console.log(holes28to36);
        for (let i = 0; i < holes.length; i++) {
            //int holeNo = holes.get(i).getHoleNo();
            let holeNo: number = holes[i].holeNo;
            ////console.log("holeNo: " + holeNo);
            if (holeNo >= 1 && holeNo <= 9) {
                if (!holes1to9) {
                    holes.splice(i, 1); //holes.remove(i);
                    i--;
                }
            } else if (holeNo >= 10 && holeNo <= 18) {
                if (!holes10to18) {
                    holes.splice(i, 1);
                    i--;
                } else if (!holes1to9) {
                    //holes.get(i).setHoleNo(holeNo - 9);
                    holes[i].holeNo = holeNo - 9;
                }
            } else if (holeNo >= 19 && holeNo <= 27) {
                if (!holes19to27) {
                    holes.splice(i, 1);
                    i--;
                } else {
                    let setsToRemove: number =
                        (holes1to9 ? 0 : 1) + (holes10to18 ? 0 : 1);
                    if (setsToRemove > 0) {
                        //holes.get(i).setHoleNo(holeNo - 9 * setsToRemove);
                        holes[i].holeNo = holeNo - 9 * setsToRemove;
                    }
                }
            } else if (holeNo >= 28 && holeNo <= 36) {
                if (!holes28to36) {
                    holes.splice(i, 1);
                    i--;
                } else {
                    let setsToRemove: number =
                        (holes1to9 ? 0 : 1) +
                        (holes10to18 ? 0 : 1) +
                        (holes19to27 ? 0 : 1);
                    if (setsToRemove > 0) {
                        //holes.get(i).setHoleNo(holeNo - 9 * setsToRemove);
                        holes[i].holeNo = holeNo - 9 * setsToRemove;
                    }
                }
            }
        }
        ////console.log(holes);
        let holesCount = holes.length;
        if (holesCount == 9) {
            //Collections.sort(holes, (hole1, hole2) -> hole1.getIndex() - hole2.getIndex());
            holes = holes.sort(this.ComparatorHoles);
            for (let i: number = 0; i < holesCount; i++) {
                holes[i].index = i + 1;
            }
            holes.sort(this.Comparator);
        } else if (holesCount == 18 && isCourseHoleSetsInverted) {
            let holesToMove: number = 9;
            while (holesToMove > 0) {
                //holes.add(0, holes.remove(holesCount - 1));
                let removedHole = holes.splice(holesCount - 1, 1);
                holes.unshift(removedHole[0]);
                holesToMove -= 1;
            }

            for (let h of holes) {
                if (h.holeNo < 10) h.holeNo = h.holeNo + 9;
                else h.holeNo = h.holeNo - 9;
            }
        }
        //console.log(holes);
    }
    public getHolesSets(
        courseHoleSets: number,
        holes,
        isCourseHoleSetsInverted: boolean,
        holesSets
    ) {
        let arrayOfHoleSet: any = [];
        if (courseHoleSets == 0) {
            return;
        }
        for (let obj of holesSets) {
            if (
                obj.holeSets == courseHoleSets &&
                isCourseHoleSetsInverted == obj.inverted
            ) {
                if (obj.backId == null) {
                    let counter = 1;
                    for (let i of holes) {
                        if (obj.id == i.holeSetId) {
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counter,
                                par: i.par,
                                index: i.index,
                                teeDistances: i.teeDistances,
                                meta: i.meta,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counter++;
                        }
                    }
                } else {
                    let holesSetA = holesSets.find(
                        (x) => x.holeSets == obj.frontId
                    );
                    let holesSetB = holesSets.find(
                        (x) => x.holeSets == obj.backId
                    );
                    // console.log(holesSetA);
                    // console.log(holesSetB);
                    let counter = 1;
                    for (let i of holes) {
                        if (holesSetA.id == i.holeSetId) {
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counter,
                                par: i.par,
                                index: i.index,
                                teeDistances: i.teeDistances,
                                meta: i.meta,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counter++;
                        }
                    }
                    let counterA = 10;
                    for (let i of holes) {
                        if (holesSetB.id == i.holeSetId) {
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counterA,
                                par: i.par,
                                index: i.index,
                                teeDistances: i.teeDistances,
                                meta: i.meta,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counterA++;
                        }
                    }
                }
            }
        }
        return arrayOfHoleSet;
    }

    private async setupMatchplayData(
        courseInfo: any,
        flightsQLs: any[],
        roundScore: any[],
        flag: boolean,
        tournamentId: string
    ) {
        //let findex = 0;
        // //console.log(flightsQLs);
        this.index = 0;
        for (let flightData of flightsQLs) {
            ////console.log(flightData);
            ////console.log("Flight ID: " + flightData.id);
            let membersQLs: any = flightData.MembersQL;
            let singleFlight: any[] = [];
            let flightHeader = await this.setupMatchplayHeader(
                flightData.courseId,
                flightData.courseHoleSets,
                flightData.courseHoleSetsInverted,
                courseInfo
            );
            //  //console.log(flightHeader);
            // //console.log(flightData);

            let courseHoleSetTitle;
            if (courseInfo) {
                courseHoleSetTitle = this.courseHoleSetNames.find((a) => {
                    return (
                        a.holeSets == flightData.courseHoleSets &&
                        a.inverted == flightData.courseHoleSetsInverted
                    );
                });
            }
            // //console.log(courseHoleSetTitle);
            let index1 = 0;
            for (let membersQL of membersQLs) {
                let player: Player = membersQL.PlayerQL;
                let playerScore: any[] = [];
                if (roundScore) {
                    playerScore = roundScore.filter((a) => {
                        return a.playerId == player.id;
                    });
                }
                if (playerScore.length == 0) {
                    playerScore = membersQL.ScoresQL;
                }
                this.duplicateIds.push(
                    membersQL.playerId + '<>' + membersQL.flightId
                );
                let playerId: String = player.id;

                if (player == null) {
                    continue;
                }

                let playerHole9Score: any = [];
                let playerHole18Score: any[] = [];
                let playerHole9ScoreIds: any = [];
                let playerHole18ScoreIds: any[] = [];
                let gross9Total = 0;
                let gross18Total = 0;
                let holePlayed: number = 0;

                for (let i = 0; i < 9; i++) {
                    let currentHole = flightHeader.courseHoles9[i]
                        ? flightHeader.courseHoles9[i]
                        : [];
                    let hole;
                    if (currentHole) {
                        if (roundScore.length > 0) {
                            hole = playerScore[0]['ScoresQL'].find((a) => {
                                return (
                                    a.holeId ==
                                    (currentHole ? currentHole.id : '')
                                );
                            });
                        } else {
                            hole = playerScore.find((a) => {
                                return (
                                    a.holeId ==
                                    (currentHole ? currentHole.id : '')
                                );
                            });
                        }

                        ////console.log(hole);

                        if (hole) {
                            playerHole9Score[i] = hole.grossScore;
                            playerHole9ScoreIds[i] = { id: hole.id, holeId: hole.holeId, playerId: playerId, flightId: flightData.id }
                            gross9Total += hole.grossScore;
                            holePlayed++;
                        } else {
                            playerHole9Score[i] = '';
                            playerHole9ScoreIds[i] = {};
                        }
                    }
                }

                for (let i = 0; i < 9; i++) {
                    if (flightHeader.courseHoles18.length > 0) {
                        // let courseHole = flightHeader.courseHoles18.filter(el => {
                        //   return el.holeNo == ((i + 9) + 1);
                        // });

                        let currentHole = flightHeader.courseHoles18[i]
                            ? flightHeader.courseHoles18[i]
                            : [];

                        ////console.log(((i + 9) + 1));
                        ////console.log(courseHole);
                        let hole;
                        if (currentHole) {
                            if (roundScore.length > 0) {
                                hole = playerScore[0]['ScoresQL'].find((a) => {
                                    ////console.log(a.holeId + "<---->" + courseHole[0].id);
                                    ////console.log((courseHole.length > 0)? courseHole[0].id : "");
                                    return (
                                        a.holeId ==
                                        (currentHole ? currentHole.id : '')
                                    );
                                });
                            } else {
                                hole = playerScore.find((a) => {
                                    ////console.log(a.holeId + "<---->" + courseHole[0].id);
                                    ////console.log((courseHole.length > 0)? courseHole[0].id : "");
                                    return (
                                        a.holeId ==
                                        (currentHole ? currentHole.id : '')
                                    );
                                });
                            }

                            ////console.log(hole);

                            if (hole) {
                                playerHole18Score[i] = hole.grossScore;
                                playerHole18ScoreIds[i] = { id: hole.id, holeId: hole.holeId, playerId: playerId, flightId: flightData.id }
                                gross18Total += hole.grossScore;
                                holePlayed++;
                            } else {
                                playerHole18Score[i] = '';
                                playerHole18ScoreIds[i] = {};
                            }
                        }
                    }
                }

                let grossTotal: number = gross9Total + gross18Total;
                // //console.log(this.index ,"=", this.dailyData.TournamentsQL[this.index].playingOnWhs)
                let handicap = membersQLs[index1].playingHandicap;
                for (let obj of this.matchPlayData) {
                    if (obj.id == tournamentId) {
                        if (obj.playingOnWhs == true) {
                            handicap = membersQLs[index1].playingHandicapWhs;
                        } else {
                            handicap = membersQLs[index1].playingHandicap;
                        }
                        break;
                    }
                }
                //let handicap = membersQLs[index1].playingHandicap; //this.dailyData.TournamentsQL[this.index].playingOnWhs == true ? membersQLs[index1].playingHandicapWhs : membersQLs[index1].playingHandicap;
                //  //console.log(handicap);

                index1++;
                //  //console.log(index1);
                let undoHandicap = membersQL.undoHandicap == 0 ? false : true;
                let LeaderGross: any = {
                    flightId: flightData.id,
                    tournamentId: flightData.tournamentId,
                    courseId: flightData.courseId,
                    playerId: player.id,
                    name: player.firstName + ' ' + player.lastName,
                    picture: player.picture,
                    memberShipNumber: player.membershipNumber,
                    handicap: handicap ? handicap : player.handicap,
                    Hole9Scores: playerHole9Score,
                    Hole9ScoresIds: playerHole9ScoreIds,
                    Hole18Scores: playerHole18Score,
                    Hole18ScoresIds: playerHole18ScoreIds,
                    gross9Total: gross9Total,
                    gross18Total: gross18Total,
                    grossTotal: grossTotal,
                    holesPlayed: holePlayed,
                    undoHandicap: undoHandicap,
                    panelty: membersQL.panelty,
                };

                singleFlight.push(LeaderGross);
            }
            this.index++;
            console.log(singleFlight);
            
            ////console.log(this.index);

            ////console.log(flightData.courseId + " -" + flightData.courseHoleSets);

            ////console.log(flightData.id);

            this.flightPlayers.push(singleFlight);
            ////console.log("members addeed");
            this.flightPlayers[this.findex]['header'] = flightHeader;
            this.flightPlayers[this.findex]['courseId'] = flightData.courseId;
            this.flightPlayers[this.findex]['ended'] = flightData.ended;
            this.flightPlayers[this.findex]['categoryRound'] =
                flightData.categoryRound;
            this.flightPlayers[this.findex]['flightId'] = flightData.id;
            this.flightPlayers[this.findex]['tournamentId'] = tournamentId;
            this.flightPlayers[this.findex]['flightTime'] = flightData.time;
            this.flightPlayers[this.findex]['courseHoleSetTitle'] =
                courseHoleSetTitle ? courseHoleSetTitle.displayName : '';
            this.flightPlayers[this.findex]['courseHoleSetKey'] =
                courseHoleSetTitle
                    ? flightData.courseHoleSets +
                    '_' +
                    flightData.courseHoleSetsInverted
                    : '';
            this.flightPlayers[this.findex]['courseTee'] = courseHoleSetTitle
                ? flightData.tee
                : '';
            this.flightPlayers[this.flightPlayers.length - 1]['membersCount'] =
                singleFlight ? singleFlight.length : 0;

            ////console.log("flight setup");

            ////console.log(this.flightPlayers[this.findex]);

            this.findex++;
        }

        this.flightPlayers = this.flightPlayers.sort(this.flightComparator);
        //  //console.log('DETAILS' + this.flightPlayers);
        this.dataSource = new MatTableDataSource(this.flightPlayers);
        // this.dataSource.paginator.l = this.paginator;
        // this.dataSource.sort = this.sort;
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.sort;

        this.showResult = true;
    }

    findScoreId(list: any[], holeId: string, playerId: string, flightId: string) {
        return list.find(x =>
            x &&
            x.holeId === holeId &&
            x.playerId === playerId &&
            x.flightId === flightId
        );
    }

    async saveFlightScore(flightId: string) {
        //var startingHole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_-L613n4gp3nF0QiXiCt1")).value);
        ////console.log(flightId);

        let selectedFlight: any = this.flightPlayers.find((a) => {
            return a.flightId == flightId;
        });

        ////console.log(selectedFlight);

        let today: Date = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

        //let tournamentData: any = this.matchPlayData;
        //let courseQLs: any = tournamentData.CourseQL;
        //let holesQLs: any = courseQLs.HolesQL;
        let playerScores: Score[] = [];
        let deleteIds: string[] = [];

        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

        let courseQLs = null;
        let courseHoleQLs = null;
        if (selectedFlight.length > 0)
            courseQLs = await this.facadeService.getCourseInformation(
                selectedFlight[0].courseId
            );

        if (courseQLs && courseQLs.course && courseQLs.course.length > 0)
            courseHoleQLs = courseQLs.course[0].HolesQL;

        for (let player of selectedFlight) {
            let totalPlayed = 0;
            let playerScoresIds: string[] = [];
            let playerEmptyScoresIds: string[] = [];

            let player1DigitIds: string[] = [];
            let player2DigitIds: string[] = [];

            for (let hole of courseHoleQLs) {
                let holeObj = <HTMLInputElement>(
                    document.getElementById(hole.id + '&' + player.playerId)
                );
                if (holeObj) {
                    let grossScore = parseFloat(
                        (<HTMLInputElement>(
                            document.getElementById(
                                hole.id + '&' + player.playerId
                            )
                        )).value
                    );

                    ////console.log(grossScore);
                    if (grossScore) {
                        let playerScore: Score = {
                            playerId: player.playerId,
                            flightId: player.flightId,
                            holeId: hole.id,
                            playerHandicap: this.precisionRound(
                                player.handicap,
                                0
                            ),
                            grossScore: grossScore,
                            updatedAt: General.parseToDate(
                                todayDate.toDateString()
                            ),
                            updaterId: this.loggedInuser.id,
                            updaterName:
                                this.loggedInuser.firstName +
                                ' ' +
                                this.loggedInuser.lastName,
                            detailId: null,
                        };
                        playerScores.push(playerScore);
                        playerScoresIds.push(hole.id + '&' + player.playerId);

                        if (grossScore > 9)
                            player2DigitIds.push(
                                hole.id + '&' + player.playerId
                            );
                        else
                            player1DigitIds.push(
                                hole.id + '&' + player.playerId
                            );

                        totalPlayed++;
                    } else {
                        playerEmptyScoresIds.push(
                            hole.id + '&' + player.playerId
                        );
                        let match = this.findScoreId(player.Hole9ScoresIds, hole.id, player.playerId, flightId);

                        // If not found, search in Hole18
                        if (!match) {
                            match = this.findScoreId(player.Hole18ScoresIds, hole.id, player.playerId, flightId);
                        }

                        // Push ID if match found
                        if (match && match.id) {
                            deleteIds.push(match.id);
                        }
                    }
                }
            }
            //console.log(playerScores);
            ////console.log(playerScoresIds);
            ////console.log(playerEmptyScoresIds);

            if (totalPlayed > 0) {
                for (let id of playerEmptyScoresIds)
                    document.getElementById(id).classList.add('empty');

                for (let id of playerScoresIds)
                    document.getElementById(id).classList.remove('empty');

                for (let id of player2DigitIds)
                    document.getElementById(id).classList.add('warn');

                for (let id of player1DigitIds)
                    document.getElementById(id).classList.remove('warn');
            }
        }

        let result = <any>(
            await this.facadeService.SaveScoresMutation(playerScores)
        );

        if (deleteIds.length > 0) {
            await this.facadeService.deleteScores(deleteIds);
        }

        if (result) {
            this.snackBar.open('Score has been submitted.', 'x', {
                duration: 5000,
            });

            if (selectedFlight.length > 0) {
                let todayString: Date = new Date();
                let timeupdated: any =
                    await this.facadeService.setScoreUpdateTime(
                        selectedFlight[0].tournamentId,
                        todayString.toISOString().slice(0, -5) + "Z"
                    );

                if (timeupdated) return;
            }
        }
    }

    async savePlayerScore(flightId: string, playerId: string) {
        //var startingHole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_-L613n4gp3nF0QiXiCt1")).value);
        ////console.log(this.flightPlayers);
        let deleteIds: string[] = [];
        let selectedFlight: any = this.flightPlayers.find((a) => {
            return a.flightId == flightId;
        });

        ////console.log(selectedFlight);
        //return false;

        let today: Date = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

        //let tournamentData: any = this.matchPlayData;
        //let courseQLs: any = tournamentData.CourseQL;
        //let holesQLs: any = courseQLs.HolesQL;
        let playerScores: Score[] = [];

        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

        let courseQLs = null;
        let courseHoleQLs = null;
        if (selectedFlight.length > 0)
            courseQLs = await this.facadeService.getCourseInformation(
                selectedFlight[0].courseId
            );

        if (courseQLs && courseQLs.course && courseQLs.course.length > 0)
            courseHoleQLs = courseQLs.course[0].HolesQL;

        for (let player of selectedFlight) {
            ////console.log(player.playerId);

            if (player.playerId == playerId) {
                for (let hole of courseHoleQLs) {
                    let holeObj = <HTMLInputElement>(
                        document.getElementById(hole.id + '&' + player.playerId)
                    );
                    //console.log(holeObj);
                    //console.log(holeObj);

                    if (holeObj) {
                        let grossScore = holeObj
                            ? parseFloat(
                                (<HTMLInputElement>(
                                    document.getElementById(
                                        hole.id + '&' + player.playerId
                                    )
                                )).value
                            )
                            : 0;

                        if (!grossScore) {
                            document
                                .getElementById(hole.id + '&' + player.playerId)
                                .classList.add('empty');
                            let match = this.findScoreId(player.Hole9ScoresIds, hole.id, player.playerId, flightId);

                            // If not found, search in Hole18
                            if (!match) {
                                match = this.findScoreId(player.Hole18ScoresIds, hole.id, player.playerId, flightId);
                            }

                            // Push ID if match found
                            if (match && match.id) {
                                deleteIds.push(match.id);
                            }
                        }
                        else {
                            document
                                .getElementById(hole.id + '&' + player.playerId)
                                .classList.remove('empty');

                        }

                        if (grossScore && grossScore > 9)
                            document
                                .getElementById(hole.id + '&' + player.playerId)
                                .classList.add('warn');
                        else
                            document
                                .getElementById(hole.id + '&' + player.playerId)
                                .classList.remove('warn');

                        ////console.log(grossScore);
                        if (grossScore) {
                            let playerScore: Score = {
                                playerId: player.playerId,
                                flightId: player.flightId,
                                holeId: hole.id,
                                playerHandicap: this.precisionRound(
                                    player.handicap,
                                    0
                                ),
                                grossScore: grossScore,
                                updatedAt: General.parseToDate(
                                    todayDate.toDateString()
                                ),
                                updaterId: this.loggedInuser.id,
                                updaterName:
                                    this.loggedInuser.firstName +
                                    ' ' +
                                    this.loggedInuser.lastName,
                                detailId: null,
                            };
                            playerScores.push(playerScore);
                        }
                    }
                }
            }
        }
        //console.log(playerScores);
        // console.log(deleteIds);

        ////console.log(playerScores.length);

        let result: any;

        if (playerScores.length > 0) {
            result = <any>(
                await this.facadeService.SaveScoresMutation(playerScores)
            );
        }

        if (deleteIds.length > 0) {
            await this.facadeService.deleteScores(deleteIds);
        }

        if (result) {
            this.snackBar.open('Score has been submitted.', 'x', {
                duration: 5000,
            });

            if (selectedFlight.length > 0) {
                let todayString: Date = new Date();
                let timeupdated: any =
                    await this.facadeService.setScoreUpdateTime(
                        selectedFlight[0].tournamentId,
                        todayString.toISOString().slice(0, -5) + "Z"
                    );
            }
            if (selectedFlight.categoryRound == 2) {
                const dialogRef = this.dialog.open(DialogOverviewComponent, {
                    width: '350px',
                    data: 'Do you want to Re-Calculate Handicap?',
                });
                dialogRef.afterClosed().subscribe(async (result) => {
                    if (result) {
                        for (let player of selectedFlight) {
                            ////console.log(player.playerId);

                            if (player.playerId == playerId) {
                                player.undoHandicap = false;
                                break;
                            }
                        }
                        let playersId = [];
                        playersId.push(playerId);
                        let isSuccess = <boolean>(
                            await this.facadeService.deletePlayerHandiCal(
                                selectedFlight[0].tournamentId,
                                playersId
                            )
                        );
                        const bool = <boolean>(
                            await this.facadeService.undoHandicapPlayer(
                                flightId,
                                playerId
                            )
                        );
                        if (isSuccess) {
                            let obj = {
                                playerId: playerId,
                                tournamentId: selectedFlight[0].tournamentId,
                            };
                            await this.handicapService
                                .calculatePlayerHandicap(obj)
                                .then((response) => {
                                    //console.log(response);
                                });
                            setTimeout(async () => {
                                let newObj = {
                                    playerId: playerId,
                                    count: 4,
                                };
                                await this.handicapService
                                    .calculateHandicap(newObj)
                                    .then((response) => {
                                        //console.log(response);
                                    })
                                    .catch((err) => {
                                        //console.log('error' + err);
                                        this.snackBar.open('Error!.', 'x', {
                                            duration: 5000,
                                        });
                                    });
                                await this.handicapService
                                    .calculateHandicapWHS(newObj)
                                    .then((response) => {
                                        //console.log(response);
                                    })
                                    .catch((err) => {
                                        //console.log('error' + err);
                                        this.snackBar.open('Error!.', 'x', {
                                            duration: 5000,
                                        });
                                    });
                                this.snackBar.open(
                                    'Handicap Re-Calculated',
                                    'x',
                                    {
                                        duration: 5000,
                                    }
                                );
                            }, 3000);
                        }
                    }
                });
            }
        }
    }

    onGross9Change(grossValue: string, playerId: string, header: any): void {
        let total9: number = 0;

        for (let hole of header.courseHoles9) {
            if (
                <HTMLInputElement>(
                    document.getElementById(hole.id + '&' + playerId)
                )
            )
                //console.log(
                // (<HTMLInputElement>(
                //     document.getElementById(hole.id + '&' + playerId)
                // )).value
                // );
                total9 +=
                    (<HTMLInputElement>(
                        document.getElementById(hole.id + '&' + playerId)
                    )).value != ''
                        ? parseFloat(
                            (<HTMLInputElement>(
                                document.getElementById(hole.id + '&' + playerId)
                            )).value
                        )
                        : 0;
        }

        // var hole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_" + playerId)).value);
        // var hole2 = parseFloat((<HTMLInputElement>document.getElementById("hole_2_" + playerId)).value);
        // var hole3 = parseFloat((<HTMLInputElement>document.getElementById("hole_3_" + playerId)).value);
        // var hole4 = parseFloat((<HTMLInputElement>document.getElementById("hole_4_" + playerId)).value);
        // var hole5 = parseFloat((<HTMLInputElement>document.getElementById("hole_5_" + playerId)).value);
        // var hole6 = parseFloat((<HTMLInputElement>document.getElementById("hole_6_" + playerId)).value);
        // var hole7 = parseFloat((<HTMLInputElement>document.getElementById("hole_7_" + playerId)).value);
        // var hole8 = parseFloat((<HTMLInputElement>document.getElementById("hole_8_" + playerId)).value);
        // var hole9 = parseFloat((<HTMLInputElement>document.getElementById("hole_9_" + playerId)).value);
        var gross9total = <HTMLInputElement>(
            document.getElementById('gross9total_' + playerId)
        );
        var gross18total = <HTMLInputElement>(
            document.getElementById('gross18total_' + playerId)
        );
        var grosstotal = <HTMLInputElement>(
            document.getElementById('grosstotal_' + playerId)
        );

        //let total9 = ((Number(hole1))? Number(hole1) : 0) + ((Number(hole2))? Number(hole2) : 0) + ((Number(hole3))? Number(hole3) : 0) + ((Number(hole4))? Number(hole4) : 0) + ((Number(hole5))? Number(hole5) : 0) + ((Number(hole6))? Number(hole6) : 0) + ((Number(hole7))? Number(hole7) : 0) + ((Number(hole8))? Number(hole8) : 0) + ((Number(hole9))? Number(hole9) : 0);
        gross9total.value = total9.toString();

        let total: number =
            (gross9total && Number(gross9total.value)
                ? Number(gross9total.value)
                : 0) +
            (gross18total && Number(gross18total.value)
                ? Number(gross18total.value)
                : 0);
        grosstotal.value = total.toString();
        //console.log(total);
        //console.log(total);
    }

    Comparator(a, b) {
        if (a['holeNo'] < b['holeNo']) return -1;
        if (a['holeNo'] > b['holeNo']) return 1;
    }

    flightComparator(a, b) {
        if (a['flightTime'] < b['flightTime']) return -1;
        if (a['flightTime'] > b['flightTime']) return 1;
        return 0;
    }
    flightComparatorForFixed(a, b) {
        //console.log(a);

        var x = a.FlightsQL.length > 0 ? a.FlightsQL[0]['time'] : 0;

        var y = b.FlightsQL.length > 0 ? b.FlightsQL[0]['time'] : 0;

        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    }

    ComparatorDate(a, b) {
        if (a['date'] < b['date']) return -1;
        if (a['date'] > b['date']) return 1;
        return 0;
    }

    ComparatorHoles(hole1, hole2) {
        return hole1.index - hole2.index;
    }

    onGross18Change(grossValue: string, playerId: string, header: any): void {
        let total18: number = 0;

        for (let hole of header.courseHoles18) {
            if (
                <HTMLInputElement>(
                    document.getElementById(hole.id + '&' + playerId)
                )
            )
                total18 +=
                    (<HTMLInputElement>(
                        document.getElementById(hole.id + '&' + playerId)
                    )).value != ''
                        ? parseFloat(
                            (<HTMLInputElement>(
                                document.getElementById(
                                    hole.id + '&' + playerId
                                )
                            )).value
                        )
                        : 0;
        }
        // var hole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_10_" + playerId)).value);
        // var hole2 = parseFloat((<HTMLInputElement>document.getElementById("hole_11_" + playerId)).value);
        // var hole3 = parseFloat((<HTMLInputElement>document.getElementById("hole_12_" + playerId)).value);
        // var hole4 = parseFloat((<HTMLInputElement>document.getElementById("hole_13_" + playerId)).value);
        // var hole5 = parseFloat((<HTMLInputElement>document.getElementById("hole_14_" + playerId)).value);
        // var hole6 = parseFloat((<HTMLInputElement>document.getElementById("hole_15_" + playerId)).value);
        // var hole7 = parseFloat((<HTMLInputElement>document.getElementById("hole_16_" + playerId)).value);
        // var hole8 = parseFloat((<HTMLInputElement>document.getElementById("hole_17_" + playerId)).value);
        // var hole9 = parseFloat((<HTMLInputElement>document.getElementById("hole_18_" + playerId)).value);
        var gross9total = <HTMLInputElement>(
            document.getElementById('gross9total_' + playerId)
        );
        var gross18total = <HTMLInputElement>(
            document.getElementById('gross18total_' + playerId)
        );
        var grosstotal = <HTMLInputElement>(
            document.getElementById('grosstotal_' + playerId)
        );

        //let total18 = ((Number(hole1))? Number(hole1) : 0) + ((Number(hole2))? Number(hole2) : 0) + ((Number(hole3))? Number(hole3) : 0) + ((Number(hole4))? Number(hole4) : 0) + ((Number(hole5))? Number(hole5) : 0) + ((Number(hole6))? Number(hole6) : 0) + ((Number(hole7))? Number(hole7) : 0) + ((Number(hole8))? Number(hole8) : 0) + ((Number(hole9))? Number(hole9) : 0);
        gross18total.value = total18.toString();

        let total: number =
            (Number(gross9total.value) ? Number(gross9total.value) : 0) +
            (Number(gross18total.value) ? Number(gross18total.value) : 0);
        grosstotal.value = total.toString();
    }

    numberOnly(event): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    hideResult() {
        if (this.routeDate) {
            this.router.navigate(['/dailyRounds']);
        } else {
            this.showtable = true;
            this.showResult = false;
        }
    }

    redirectToScores() {
        this.router.navigate(['/matchplay/' + this.tournamentID]);
    }

    redirectToflightManagement() {
        this.router.navigate(['/tournaments/manage/' + this.tournamentID]);
    }
    redirectToView = (date: string) => {
        this.router.navigate(['/daily-rounds/view-daily-rounds/' + date]);
    };

    redirectToAttendance() {
        this.router.navigate(['/tournaments/attendance/' + this.tournamentID]);
    }
    precisionRound(number: number, precision: number) {
        if (precision < 0) {
            let factor = Math.pow(10, precision);
            return Math.round(number * factor) / factor;
        } else
            return +(
                Math.round(Number(number + 'e+' + precision)) +
                'e-' +
                precision
            );
    }

    public hasHoleSet1to9(courseHoleSets): boolean {
        ////console.log(Constants.Holes1to9);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes1to9) != 0
        );
    }

    public hasHoleSet10to18(courseHoleSets): boolean {
        ////console.log(Constants.Holes10to18);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes10to18) != 0
        );
    }

    public hasHoleSet19to27(courseHoleSets): boolean {
        ////console.log(Constants.Holes19to27);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes19to27) != 0
        );
    }

    public hasHoleSet28to36(courseHoleSets): boolean {
        ////console.log(Constants.Holes28to36);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes28to36) != 0
        );
    }

    async redirectCalculation(id) {
        //this.router.navigate(["/tournaments/handicap-whs/" + id]);
        ////console.log(id);
        try {

            this.logger.log('Handicap Calculation btn click on Daily Round Page', "info", id);
            let selectedFlight: any = this.flightPlayers.find((a) => {
                return a.flightId == id;
            });
            //console.log(selectedFlight.tournamentId);

            let flag: boolean = true;
            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to Calculate Handicap?',
            });
            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    if (selectedFlight.categoryRound == 2) {
                        flag = false;
                    }
                    // for (let player of selectedFlight) {
                    //     let handicap =
                    //         await this.facadeService.getPlayersHandicapWhsHistoryAboveDate(
                    //             player.playerId,
                    //             this.routeDate
                    //         );
                    //     //console.log(handicap);
                    //     if (handicap && handicap.HandicapHistoryWhsQL.length > 0) {
                    //         flag = false;
                    //         break;
                    //     }
                    // }
                    if (result && flag) {
                        const isSuccess = <boolean>(
                            await this.facadeService.singleRoundFlightQuery(id)
                        );
                        if (isSuccess) {
                            selectedFlight.ended = true;
                            this.snackBar.open('Handicap Calculated', 'x', {
                                duration: 5000,
                            });
                        } else {
                            //console.log('Handicap Calculation Cancel');
                        }
                    } else if (result && !flag) {
                        // //console.log(objA);
                        let playersId = [];
                        for (let item of selectedFlight) {
                            //console.log(item);
                            playersId.push(item.playerId);
                        }
                        //console.log(playersId);

                        let isSuccess = <boolean>(
                            await this.facadeService.deletePlayerHandiCal(
                                selectedFlight.tournamentId,
                                playersId
                            )
                        );
                        if (isSuccess) {
                            const bool = <boolean>(
                                await this.facadeService.singleRoundFlightQuery(id)
                            );
                            setTimeout(async () => {
                                if (bool) {
                                    selectedFlight.ended = true;
                                    for (let item of selectedFlight) {
                                        // continue //
                                        let obj = {
                                            playerId: item.playerId,
                                            count: 3,
                                        };
                                        await this.handicapService
                                            .calculateHandicap(obj)
                                            .then((response) => {
                                                //console.log(response);
                                            })
                                            .catch((err) => {
                                                //console.log('error' + err);
                                                this.snackBar.open('Error!.', 'x', {
                                                    duration: 5000,
                                                });
                                            });
                                        await this.handicapService
                                            .calculateHandicapWHS(obj)
                                            .then((response) => {
                                                //console.log(response);
                                            })
                                            .catch((err) => {
                                                //console.log('error' + err);
                                                this.snackBar.open('Error!.', 'x', {
                                                    duration: 5000,
                                                });
                                            });
                                    }
                                    this.snackBar.open('Handicap Calculated', 'x', {
                                        duration: 5000,
                                    });
                                } else {
                                    //console.log('Handicap Calculation Cancel');
                                }
                            }, 5000);
                        } else {
                            this.snackBar.open('Handicap Not Calculated', 'x', {
                                duration: 5000,
                            });
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.log('Handicap Calculated on Daily Round Data Failed', "error", error.toString());

        }
    }

    async UndoFlightHandicap(flightId, playerId) {
        try {
            const combinedData = `flightId=${flightId}, playerId=${playerId}`;
            this.logger.log('Admin click undo Handicap on Daily Round Page', "info", combinedData);
            //console.log(flightId);
            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to Undo Handicap?',
            });
            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    const isSuccess = <boolean>(
                        await this.facadeService.undoFlightHandicap(
                            flightId,
                            playerId
                        )
                    );
                    if (isSuccess) {
                        for (let i = 0; i < this.flightPlayers.length; i++) {
                            let obj = this.flightPlayers[i];
                            if (obj.flightId == flightId) {
                                // this.flightPlayers[i].ended = false;
                                this.flightPlayers[i].categoryRound = 2;
                                this.flightPlayers[i].forEach((a) => {
                                    if (a.playerId == playerId) {
                                        a.undoHandicap = true;
                                    }
                                });
                                break;
                            }
                        }

                        this.snackBar.open('Handicap Calculation Reverted', 'x', {
                            duration: 2000,
                        });
                    }
                }
            });
        } catch (error) {
            this.logger.log('Undo Calculated on Daily Round Data Failed', "error", error.toString());

        }
    }
    async UndoSingleFlightHandicap(flightId) {
        try {
            // const combinedData = `flightId=${flightId}, playerId=${playerId}`;
            this.logger.log('Admin click undo Handicap on Daily Round Page', "info", flightId);
            //console.log(flightId);
            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to Undo Handicap?',
            });
            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    const isSuccess = <boolean>(
                        await this.facadeService.UndoSingleFlightHandicap(
                            flightId
                        )
                    );
                    if (isSuccess) {
                        for (let i = 0; i < this.flightPlayers.length; i++) {
                            let obj = this.flightPlayers[i];
                            if (obj.flightId == flightId) {
                                this.flightPlayers[i].ended = false;
                                this.flightPlayers[i].categoryRound = 2;
                                this.flightPlayers[i].forEach((a) => {

                                    a.undoHandicap = true;

                                });
                                break;
                            }
                        }

                        this.snackBar.open('Handicap Calculation Reverted', 'x', {
                            duration: 2000,
                        });
                    }
                }
            });
        } catch (error) {
            this.logger.log('Undo Calculated on Daily Round Data Failed', "error", error.toString());

        }
    }

    keytab(e) {
        var code = e.keyCode || e.which;

        if (code === 13) {
            e.preventDefault();
            let control: HTMLInputElement = <HTMLInputElement>e.srcElement;

            while (control) {
                let nextControl = <HTMLInputElement>control.nextElementSibling;

                if (nextControl) {
                    control = nextControl;

                    while (nextControl) {
                        control = nextControl;

                        nextControl = <HTMLInputElement>(
                            nextControl.firstElementChild
                        );

                        if (
                            nextControl &&
                            nextControl.type == 'text' &&
                            !nextControl.disabled
                        )
                            break;
                    }

                    if (nextControl) {
                        control = nextControl;
                        break;
                    }
                } else {
                    control = <HTMLInputElement>control.parentElement;
                }
            }

            if (control && control.focus) {
                control.focus();
            }
        }
    }

    async changeCourseHoleset(flightId: string, tournamentID: string) {
        try {

            const combinedData = `flightId=${flightId}, tournamentID=${tournamentID}`;
            this.logger.log('Admin click change Hole Set on Daily Round Page', "info", combinedData);
            //console.log(this.flightPlayers);
            let flight;
            //let flightData = this.matchPlayData.find(a => a.FlightsQL.some(f => f.id == flightId));
            let updatedData = await this.facadeService.singleRoundFlightsQuery(
                flightId
            );
            // console.log(updatedData);

            if (!updatedData) return;
            else {
                if (updatedData.FlightsQL.length > 0)
                    flight = updatedData.FlightsQL[0];
            }

            //console.log(flightId);
            this.logger.log('Dailog change Hole Set on Daily Round Page Open', "info");
            const dialogRef = this.dialog.open(DialogChangeCourseHoleSetComponent, {
                data: {
                    course: flight.courseId,
                    currentHoleSet: flight.courseHoleSets,
                    courseHoleSetsInverted: flight.courseHoleSetsInverted,
                    time: flight.time,
                    startingHole: flight.startingHole,
                    tee: flight.tee,
                    tournament: tournamentID,
                    members: flight.MembersQL,
                    tournamentFlight: flight.tournament.tournamentFlight,
                    date: this.routeDate,
                },
                width: '650px',
            });

            dialogRef.afterClosed().subscribe(async (result) => {
                // console.log(result);
                if (result) {
                    ////console.log(result);
                    // console.log(result);
                    const resultString = JSON.stringify(result);
                    // this.logger.log('Rsult from Dailog change Hole Set on Daily Round Page', "info", resultString);

                    //console.log(this.flightPlayers);
                    let splited = result.holeSets.split('_', 2);
                    //console.log(splited);
                    let holeSetsSelection: number = Number(splited[0]);
                    let holeSetsInverted: boolean = splited[1] == 'true';
                    let tee = result.roundTee;
                    let time = result.startingTime;
                    //let hole = result.startingHole;
                    let flightMember;
                    let deleteMember = result.deleteMembers;
                    let fMember: any = [];
                    if (result.members) {
                        for (let members in result.members) {
                            flightMember = {
                                flightId: result.members[members].flightId
                                    ? result.members[members].flightId
                                    : flightId,
                                playerId: result.members[members].playerId
                                    ? result.members[members].playerId
                                    : result.members[members].id,
                                attendance: result.members[members].attendance
                                    ? result.members[members].attendance
                                    : false,
                                playingTee: result.members[members].playingTee
                                    ? result.members[members].playingTee
                                    : 'White',
                                tee_id: result.members[members].tee_id ? result.members[members].tee_id : 1,
                                guest: result.members[members].guest
                                    ? result.members[members].guest
                                    : null,
                            };

                            fMember.push(flightMember);
                        }
                    }

                    //console.log(fMember);

                    let flightScores: Array<Score> = null;
                    let oldHoles: Array<Hole> = null;

                    let newFlight: boolean = false;
                    let courseHoleSets: number = flight.courseHoleSets;
                    let courseHoleSetsInverted: boolean =
                        flight.courseHoleSetsInverted;
                    let newScores: Array<Score> = new Array<Score>();

                    //console.log(flight);

                    if (!newFlight && flightId) {
                        if (
                            courseHoleSets != holeSetsSelection ||
                            courseHoleSetsInverted != holeSetsInverted
                        ) {
                            // hole sets are changed, check if there are any scores for this flight
                            flightScores = this.getScoresCopy(flight); //flight.ScoresQL;
                            //console.log(flightScores);
                            if (flightScores) {
                                oldHoles = this.getCourseHolesCopy(flightId);
                                if (oldHoles != null) {
                                    //flight.removeExtraHoleSets(oldHoles);
                                }
                            }

                            //console.log(oldHoles);
                            //flight.setCourseHoleSets(holeSetsSelection);
                            //flight.setCourseHoleSetsInverted(holeSetsInverted);
                            if (flightScores != null && oldHoles != null) {
                                let dataLeaderboard =
                                    await this.facadeService.getCourseInformation(
                                        flight.courseId
                                    );

                                if (dataLeaderboard.course.length == 0) return;

                                let courseQLs: any = dataLeaderboard.course[0];
                                let holesQLs: any = courseQLs.HolesQL;
                                let newHoles = this.getHolesSets(
                                    holeSetsSelection,
                                    holesQLs,
                                    holeSetsInverted,
                                    this.courseHoleSetNames
                                );
                                //console.log(newHoles);

                                if (newHoles != null) {
                                    //flight.removeExtraHoleSets(newHoles);
                                    for (let score of flightScores) {
                                        //console.log(score);
                                        let holeId: string = score.holeId;
                                        for (let i = 0; i < oldHoles.length; i++) {
                                            //console.log(
                                            // oldHoles[i].id + ' <--> ' + holeId
                                            // );
                                            if (oldHoles[i].id == holeId) {
                                                let newScore: Score = Object.assign(
                                                    {},
                                                    score
                                                );

                                                if (i < newHoles.length) {
                                                    newScore.holeId =
                                                        newHoles[i].id;
                                                    newScores.push(newScore);
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    //console.log(flightScores);
                                    //console.log(newScores);
                                    if (newScores.length > 0) {
                                        //flightManager.setScoresToDelete(flightScores);
                                        //flightManager.setScoresToInsert(newScores);
                                    }
                                }

                                let scoreDetailsDelete: string[] = [];
                                let scoreFlightIdsToRemove: string[] = [];
                                let scorePlayerIdsToRemove: string[] = [];

                                for (let oldScore of flightScores) {
                                    //console.log(oldScore);
                                    if (oldScore['DetailQL']) {
                                        let detailId: string =
                                            oldScore['DetailQL'].id;
                                        if (detailId)
                                            scoreDetailsDelete.push(detailId);
                                    }

                                    if (oldScore.flightId)
                                        scoreFlightIdsToRemove.push(
                                            oldScore.flightId
                                        );
                                    if (oldScore.playerId)
                                        scorePlayerIdsToRemove.push(
                                            oldScore.playerId
                                        );
                                }

                                let scoresToInsert: Score[] = [];
                                let scoreDetail: ScoreDetail[] = [];

                                for (let score of newScores) {
                                    if (score['DetailQL']) {
                                        let playerScoreDetail: ScoreDetail = {
                                            id: UniqueIdGenerator.generate(),
                                            putts: score['DetailQL'].putts,
                                            penalties: score['DetailQL'].penalties,
                                            fairway: score['DetailQL'].fairway,
                                            gir: score['DetailQL'].gir,
                                            sandSave: score['DetailQL'].sandSave,
                                            upAndDown: score['DetailQL'].upAndDown,
                                            penalty: score['DetailQL'].penalty,
                                            firClub: score['DetailQL'].firClub,
                                            girClub: score['DetailQL'].girClub,
                                            girDistance:
                                                score['DetailQL'].girDistance,
                                            sandSavePoint:
                                                score['DetailQL'].sandSavePoint,
                                            upAndDownPoint:
                                                score['DetailQL'].upAndDownPoint,
                                            upAndDownDistance:
                                                score['DetailQL'].upAndDownDistance,
                                            girShot: score['DetailQL'].girShot,
                                        };
                                        scoreDetail.push(playerScoreDetail);
                                    }

                                    let playerScore: any = {
                                        playerId: score.playerId,
                                        flightId: score.flightId,
                                        holeId: score.holeId,
                                        playerHandicap: this.precisionRound(
                                            score.playerHandicap,
                                            0
                                        ),
                                        grossScore: score.grossScore,
                                        updatedAt: score.updatedAt,
                                        updaterId: score.updaterId,
                                        updaterName: score.updaterName,
                                        detailId: null,
                                        //detail: scoreDetail
                                    };

                                    scoresToInsert.push(playerScore);
                                }

                                let result =
                                    await this.facadeService.updateDailyRoundCourseHoleset(
                                        flight.tournamentId,
                                        holeSetsSelection,
                                        holeSetsInverted,
                                        false /* scoreDetail.length > 0 ? true : false, */,
                                        // scoreDetailsDelete,
                                        // scoreFlightIdsToRemove,
                                        // scorePlayerIdsToRemove,
                                        // scoresToInsert,
                                        [],
                                        [],
                                        [],
                                        [],
                                        tee,
                                        time,
                                        fMember,
                                        deleteMember,
                                        flightId
                                    );


                                //console.log(result);
                                //this.facadeService.updateDailyRoundCourseHoleset(this.tournamentID, flightScores, newScores);

                                if (result) {
                                    this.logger.log('Hole Set Change on Daily Round Page Sucessfully', "info");


                                    // await new Promise((f) => setTimeout(f, 5000));
                                }
                            }
                            //window.location.reload();

                            // let findex = 0;
                            // for(let flightData of flightsQLs) {

                            //   let flightHeader = await this.setupMatchplayHeader(flightData.courseId, flightData.courseHoleSets, flightData.courseHoleSetsInverted);

                            //   let singleFlight = this.setupSingleFlight(flightData, flightHeader);

                            //   this.flightPlayers.push(singleFlight);
                            //   this.flightPlayers[findex] = singleFlight;
                            //   this.flightPlayers[findex]["header"] = flightHeader;
                            //   this.flightPlayers[findex]["flightId"] = flightData.id;

                            //   findex++;
                            // }
                        } else {
                            let result =
                                await this.facadeService.updateDailyRoundCourseHoleset(
                                    flight.tournamentId,
                                    holeSetsSelection,
                                    holeSetsInverted,
                                    false,
                                    [],
                                    [],
                                    [],
                                    [],
                                    tee,
                                    time,
                                    fMember,
                                    deleteMember,
                                    flightId
                                );
                            //console.log(result);
                            //this.facadeService.updateDailyRoundCourseHoleset(this.tournamentID, flightScores, newScores);

                            if (result) {
                                this.logger.log('Hole Set Change on Daily Round Page Sucessfully', "info");

                            }
                        }
                        await this.facadeService.updateTournamentFlight(
                            flight.tournamentId,
                            result.roundCategory == 'true' ? true : false
                        );
                    }
                    setTimeout(async () => {
                        let updatedFlight =
                            await this.facadeService.updatedFlightsQuery(flightId);
                        //console.log(updatedFlight);

                        // let getCurrentFlight = currentFlight;
                        // getCurrentFlight.time = time;
                        // getCurrentFlight.tee = tee;
                        // getCurrentFlight.courseHoleSets = holeSetsSelection;
                        // getCurrentFlight.courseHoleSetsInverted = holeSetsInverted;
                        // for(let mem in getCurrentFlight.MembersQL){

                        //   getCurrentFlight.MembersQL[mem].playingTee = fMember[mem].playingTee;

                        // }

                        // //console.log(getCurrentFlight);

                        ////console.log(flightData)

                        let courseHoleSetTitle;
                        if (
                            updatedFlight.FlightsQL[0].CourseQL &&
                            updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL
                        ) {
                            courseHoleSetTitle =
                                updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL.find(
                                    (a) => {
                                        return (
                                            a.holeSets ==
                                            updatedFlight.FlightsQL[0]
                                                .courseHoleSets &&
                                            a.inverted ==
                                            updatedFlight.FlightsQL[0]
                                                .courseHoleSetsInverted
                                        );
                                    }
                                );
                        }
                        //console.log(courseHoleSetTitle);

                        let flightHeader = await this.setupMatchplayHeader(
                            updatedFlight.FlightsQL[0].courseId,
                            updatedFlight.FlightsQL[0].courseHoleSets,
                            updatedFlight.FlightsQL[0].courseHoleSetsInverted,
                            updatedFlight.FlightsQL[0].CourseQL
                        );
                        //console.log(flightHeader);
                        let singleFlight = this.setupSingleFlight(
                            updatedFlight.FlightsQL[0],
                            flightHeader,
                            []
                        );
                        //console.log(singleFlight);

                        //this.flightPlayers.push(singleFlight);
                        ////console.log(this.flightPlayers)

                        let flightIndex = this.flightPlayers.findIndex(
                            (a) => a.flightId == flightId
                        );

                        this.flightPlayers[flightIndex] = singleFlight;
                        this.flightPlayers[flightIndex]['header'] = flightHeader;
                        this.flightPlayers[flightIndex]['flightId'] =
                            updatedData.FlightsQL[0].id;
                        this.flightPlayers[flightIndex]['tournamentId'] =
                            updatedData.id;
                        this.flightPlayers[flightIndex]['flightTime'] = time;
                        this.flightPlayers[flightIndex]['courseHoleSetTitle'] =
                            courseHoleSetTitle.displayName;
                        this.flightPlayers[flightIndex]['courseHoleSetKey'] =
                            updatedFlight.FlightsQL[0]
                                ? updatedFlight.FlightsQL[0].courseHoleSets +
                                '_' +
                                updatedFlight.FlightsQL[0].courseHoleSetsInverted
                                : '';
                        this.flightPlayers[flightIndex]['courseTee'] =
                            courseHoleSetTitle ? updatedFlight.FlightsQL[0].tee : '';
                        this.flightPlayers[this.flightPlayers.length - 1][
                            'membersCount'
                        ] = singleFlight ? singleFlight.length : 0;

                        // window.location.reload();
                        this.snackBar.open(
                            'Flight has been updated.',
                            'x',
                            {
                                duration: 5000,
                            }
                        );
                    }, 10000);
                    //console.log(flightId);

                    // let getCurrentFlight = this.flightPlayers.find((f) => {
                    //   return f.flightId == flightId
                    // });

                    // //console.log(getCurrentFlight);
                    // //console.log(result);
                    // //console.log(this.matchPlayData);

                    //window.location.reload();

                    // let currentFlight : any = [];

                    // for(let f in this.matchPlayData){
                    //   currentFlight = this.matchPlayData[f].FlightsQL.find((a)=> {
                    //     return a.id == flightId;
                    //   });
                    //   if(currentFlight)
                    //   break;

                    // }

                    // //console.log(currentFlight)

                    // let ourFlight = currentFlight.FlightsQL[0];
                    // //console.log(ourFlight)


                    //this.flightPlayers = this.flightPlayers.sort(this.flightComparator);
                    //console.log(this.flightPlayers);
                } else {
                    //console.log('else executed');
                }
            });
        } catch (error) {
            this.logger.log('Changing Hole Set on Daily Round Data Failed', "error", error.toString());

        }
    }

    public getCourseHolesCopy(id): Array<Hole> {
        let flight = this.flightPlayers.find((f) => {
            return f.flightId == id;
        });

        if (!flight) {
            return null;
        }

        let holesCopy: Array<Hole> = new Array<Hole>();
        for (let hole of flight.header.courseHoles9) {
            holesCopy.push(hole);
        }
        for (let hole of flight.header.courseHoles18) {
            holesCopy.push(hole);
        }

        return holesCopy;
    }

    public getScoresCopy(flight): Array<Score> {
        let ScoresQL: Array<Score> = new Array<Score>();

        if (flight.MembersQL && flight.MembersQL.length > 0) {
            for (let member of flight.MembersQL) {
                if (member.ScoresQL && member.ScoresQL.length > 0) {
                    for (let score of member.ScoresQL) {
                        ScoresQL.push(score);
                    }
                }
            }
        }

        return ScoresQL;
    }

    getCourseHoles(holeSets, courseHoleSetsInverted, holesQLs) {
        this.courseHoleSet = holeSets;

        //if(this.courseHoleSet == 3) this.courseHoleSet = 12;

        let courseHoles9: Hole[] = [];
        let courseHoles18: Hole[] = [];
        let courseHoles: Hole[] = [];

        // var isPresent = this.coursesList.some(function(el){ return el.id === courseQLs.id});

        // if(!isPresent) {
        //   let courseInfo: any = {
        //     id: courseQLs.id,
        //     name: courseQLs.name
        //   }
        //   this.coursesList.push(courseInfo);
        // }

        ////console.log(this.coursesList);

        holesQLs = holesQLs.sort(this.Comparator);
        //console.log(holesQLs);
        this.removeExtraHoleSets(holeSets, holesQLs, courseHoleSetsInverted);
        ////console.log(holesQLs);
        for (let holeQL of holesQLs) {
            //let teeDistance = JSON.parse(holeQL.teeDistances);
            let teeDistance = holeQL.teeDistances;

            if (holeQL.holeNo < 10) {
                //holeQL.yardage9 = yardage9;
                //courseHoles9.push(holeQL);
                ////console.log(courseHoleSetsInverted);
                courseHoles9.push(holeQL);
                courseHoles.push(holeQL);
            } else if (holeQL.holeNo > 9 && holeQL.holeNo < 19) {
                courseHoles18.push(holeQL);
                courseHoles.push(holeQL);
            } else {
            }
        }

        return courseHoles;
    }

    changeHoleSet(event: any, flightId: string, type: boolean) {
        let currentFlight: any = this.flightCourseHoleSets.get(flightId);

        if (!currentFlight) {
            currentFlight = {
                holeSet: '',
                tee: '',
            };
        }

        type
            ? (currentFlight.holeSet = event.value)
            : (currentFlight.tee = event.value);

        this.flightCourseHoleSets.set(flightId, currentFlight);
    }

    async getSelectedCourse(course) {
        //console.log(course);

        await this.facadeService
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

    async saveFlightChanges(flightId) {
        let currentFlight: any = this.flightCourseHoleSets.get(flightId);
        let flight;
        //console.log(currentFlight);
        if (currentFlight) {
            let updatedData = await this.facadeService.singleRoundFlightsQuery(
                flightId
            );

            if (!updatedData) return;
            else {
                if (updatedData.FlightsQL.length > 0)
                    flight = updatedData.FlightsQL[0];
            }
            //console.log(flight);

            ////console.log(result);
            //console.log(this.flightPlayers);
            let splited = currentFlight.holeSet.split('_', 2);
            //console.log(splited);
            let holeSetsSelection: number =
                splited.length > 0 && splited[0] != ''
                    ? Number(splited[0])
                    : flight.courseHoleSets;
            let holeSetsInverted: boolean =
                splited.length > 0 && splited[0] != ''
                    ? splited[1] == 'true'
                    : flight.courseHoleSetsInverted;
            let tee = currentFlight.tee ? currentFlight.tee : flight.tee;
            let time = flight.time; //result.startingTime;
            //let hole = result.startingHole;
            let flightMember;
            let deleteMember = []; //result.deleteMembers;
            let fMember: any = [];
            // if(result.members){
            // for (let members in result.members){
            //     flightMember =  {
            //       flightId: (result.members[members].flightId)?result.members[members].flightId : flightId,
            //       playerId:  (result.members[members].playerId)?result.members[members].playerId : result.members[members].id,
            //       attendance:  (result.members[members].attendance)?result.members[members].attendance : false,
            //       playingTee : (result.playingTee.length && result.playingTee[members] )? result.playingTee[members].value : result.roundTee,
            //       guest : (result.members[members].guest)?result.members[members].guest : null

            //     }

            //     fMember.push(flightMember)
            //   }
            // }

            //console.log(fMember);

            let flightScores: Array<Score> = null;
            let oldHoles: Array<Hole> = null;

            let newFlight: boolean = false;
            let courseHoleSets: number = flight.courseHoleSets;
            let courseHoleSetsInverted: boolean = flight.courseHoleSetsInverted;
            let newScores: Array<Score> = new Array<Score>();

            //console.log(flight);

            if (!newFlight && flightId) {
                if (
                    courseHoleSets != holeSetsSelection ||
                    courseHoleSetsInverted != holeSetsInverted
                ) {
                    // hole sets are changed, check if there are any scores for this flight
                    flightScores = this.getScoresCopy(flight); //flight.ScoresQL;
                    //console.log(flightScores);
                    if (flightScores) {
                        oldHoles = this.getCourseHolesCopy(flightId);
                        if (oldHoles != null) {
                            //flight.removeExtraHoleSets(oldHoles);
                        }
                    }

                    //console.log(oldHoles);
                    //flight.setCourseHoleSets(holeSetsSelection);
                    //flight.setCourseHoleSetsInverted(holeSetsInverted);
                    if (flightScores != null && oldHoles != null) {
                        let dataLeaderboard =
                            await this.facadeService.getCourseInformation(
                                flight.courseId
                            );

                        if (dataLeaderboard.course.length == 0) return;

                        let courseQLs: any = dataLeaderboard.course[0];
                        let holesQLs: any = courseQLs.HolesQL;
                        let newHoles = this.getCourseHoles(
                            holeSetsSelection,
                            holeSetsInverted,
                            holesQLs
                        );
                        //console.log(newHoles);

                        if (newHoles != null) {
                            //flight.removeExtraHoleSets(newHoles);
                            for (let score of flightScores) {
                                //console.log(score);
                                let holeId: string = score.holeId;
                                for (let i = 0; i < oldHoles.length; i++) {
                                    //console.log(
                                    // oldHoles[i].id + ' <--> ' + holeId
                                    //     );
                                    if (oldHoles[i].id == holeId) {
                                        let newScore: Score = Object.assign(
                                            {},
                                            score
                                        );

                                        if (i < newHoles.length) {
                                            newScore.holeId = newHoles[i].id;
                                            newScores.push(newScore);
                                        }
                                        break;
                                    }
                                }
                            }
                            //console.log(flightScores);
                            //console.log(newScores);
                            if (newScores.length > 0) {
                                //flightManager.setScoresToDelete(flightScores);
                                //flightManager.setScoresToInsert(newScores);
                            }
                        }

                        let scoreDetailsDelete: string[] = [];
                        let scoreFlightIdsToRemove: string[] = [];
                        let scorePlayerIdsToRemove: string[] = [];

                        for (let oldScore of flightScores) {
                            //console.log(oldScore);
                            if (oldScore['DetailQL']) {
                                let detailId: string = oldScore['DetailQL'].id;
                                if (detailId) scoreDetailsDelete.push(detailId);
                            }

                            if (oldScore.flightId)
                                scoreFlightIdsToRemove.push(oldScore.flightId);
                            if (oldScore.playerId)
                                scorePlayerIdsToRemove.push(oldScore.playerId);
                        }

                        let scoresToInsert: Score[] = [];
                        let scoreDetail: ScoreDetail[] = [];

                        for (let score of newScores) {
                            if (score['DetailQL']) {
                                let playerScoreDetail: ScoreDetail = {
                                    id: UniqueIdGenerator.generate(),
                                    putts: score['DetailQL'].putts,
                                    penalties: score['DetailQL'].penalties,
                                    fairway: score['DetailQL'].fairway,
                                    gir: score['DetailQL'].gir,
                                    sandSave: score['DetailQL'].sandSave,
                                    upAndDown: score['DetailQL'].upAndDown,
                                    penalty: score['DetailQL'].penalty,
                                    firClub: score['DetailQL'].firClub,
                                    girClub: score['DetailQL'].girClub,
                                    girDistance: score['DetailQL'].girDistance,
                                    sandSavePoint:
                                        score['DetailQL'].sandSavePoint,
                                    upAndDownPoint:
                                        score['DetailQL'].upAndDownPoint,
                                    upAndDownDistance:
                                        score['DetailQL'].upAndDownDistance,
                                    girShot: score['DetailQL'].girShot,
                                };
                                scoreDetail.push(playerScoreDetail);
                            }

                            let playerScore: any = {
                                playerId: score.playerId,
                                flightId: score.flightId,
                                holeId: score.holeId,
                                playerHandicap: this.precisionRound(
                                    score.playerHandicap,
                                    0
                                ),
                                grossScore: score.grossScore,
                                updatedAt: score.updatedAt,
                                updaterId: score.updaterId,
                                updaterName: score.updaterName,
                                detailId: null,
                                //detail: scoreDetail
                            };

                            scoresToInsert.push(playerScore);
                        }

                        let result =
                            await this.facadeService.updateDailyRoundCourseHoleset(
                                flight.tournamentId,
                                holeSetsSelection,
                                holeSetsInverted,
                                scoreDetail.length > 0 ? true : false,
                                scoreDetailsDelete,
                                scoreFlightIdsToRemove,
                                scorePlayerIdsToRemove,
                                scoresToInsert,
                                tee,
                                time,
                                fMember,
                                deleteMember,
                                flightId
                            );
                        //console.log(result);
                        //this.facadeService.updateDailyRoundCourseHoleset(this.tournamentID, flightScores, newScores);

                        if (result) {
                            this.snackBar.open(
                                'Flight has been updated.',
                                'x',
                                {
                                    duration: 5000,
                                }
                            );
                        }
                    }
                } else {
                    let result =
                        await this.facadeService.updateDailyRoundCourseHoleset(
                            flight.tournamentId,
                            holeSetsSelection,
                            holeSetsInverted,
                            false,
                            [],
                            [],
                            [],
                            [],
                            tee,
                            time,
                            fMember,
                            deleteMember,
                            flightId
                        );

                    if (result) {
                        this.snackBar.open('Flight has been updated.', 'x', {
                            duration: 5000,
                        });
                    }
                }
            }

            //console.log(flightId);

            // let getCurrentFlight = this.flightPlayers.find((f) => {
            //   return f.flightId == flightId
            // });

            // //console.log(getCurrentFlight);
            // //console.log(result);
            // //console.log(this.matchPlayData);

            //window.location.reload();

            // let currentFlight : any = [];

            // for(let f in this.matchPlayData){
            //   currentFlight = this.matchPlayData[f].FlightsQL.find((a)=> {
            //     return a.id == flightId;
            //   });
            //   if(currentFlight)
            //   break;

            // }

            // //console.log(currentFlight)

            // let ourFlight = currentFlight.FlightsQL[0];
            // //console.log(ourFlight)

            let updatedFlight =
                await this.facadeService.singleRoundFlightsQuery(flightId);
            //console.log(updatedFlight);

            // let getCurrentFlight = currentFlight;
            // getCurrentFlight.time = time;
            // getCurrentFlight.tee = tee;
            // getCurrentFlight.courseHoleSets = holeSetsSelection;
            // getCurrentFlight.courseHoleSetsInverted = holeSetsInverted;
            // for(let mem in getCurrentFlight.MembersQL){

            //   getCurrentFlight.MembersQL[mem].playingTee = fMember[mem].playingTee;

            // }

            // //console.log(getCurrentFlight);

            ////console.log(flightData)

            let courseHoleSetTitle;
            if (
                updatedFlight.FlightsQL[0].CourseQL &&
                updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL
            ) {
                courseHoleSetTitle =
                    updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL.find(
                        (a) => {
                            return (
                                a.holeSets ==
                                updatedFlight.FlightsQL[0].courseHoleSets &&
                                a.inverted ==
                                updatedFlight.FlightsQL[0]
                                    .courseHoleSetsInverted
                            );
                        }
                    );
            }
            //console.log(courseHoleSetTitle);

            let flightHeader = await this.setupMatchplayHeader(
                updatedFlight.FlightsQL[0].courseId,
                updatedFlight.FlightsQL[0].courseHoleSets,
                updatedFlight.FlightsQL[0].courseHoleSetsInverted,
                updatedFlight.FlightsQL[0].CourseQL
            );
            //console.log(flightHeader);
            let singleFlight = this.setupSingleFlight(
                updatedFlight.FlightsQL[0],
                flightHeader,
                []
            );
            //console.log(singleFlight);

            //this.flightPlayers.push(singleFlight);
            ////console.log(this.flightPlayers)

            let flightIndex = this.flightPlayers.findIndex(
                (a) => a.flightId == flightId
            );

            this.flightPlayers[flightIndex] = singleFlight;
            this.flightPlayers[flightIndex]['header'] = flightHeader;
            this.flightPlayers[flightIndex]['flightId'] =
                updatedData.FlightsQL[0].id;
            this.flightPlayers[flightIndex]['tournamentId'] = updatedData.id;
            this.flightPlayers[flightIndex]['flightTime'] = time;
            this.flightPlayers[flightIndex]['courseHoleSetTitle'] =
                courseHoleSetTitle.displayName;
            this.flightPlayers[flightIndex]['courseHoleSetKey'] =
                courseHoleSetTitle
                    ? courseHoleSetTitle.holeSets +
                    '_' +
                    courseHoleSetTitle.inverted
                    : '';
            this.flightPlayers[flightIndex]['courseTee'] = courseHoleSetTitle
                ? updatedFlight.FlightsQL[0].tee
                : '';
            this.flightPlayers[this.flightPlayers.length - 1]['membersCount'] =
                singleFlight ? singleFlight.length : 0;

            //this.flightPlayers = this.flightPlayers.sort(this.flightComparator);
            //console.log(this.flightPlayers);
        }
    }

    paneltToggle(tournamentId, flightId, playerId, event) {
        if (event.checked) {
            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to penalize this player?',
            });
            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    let result = await this.facadeService.markPlayerPanelty(
                        tournamentId,
                        flightId,
                        playerId
                    );
                    if (result) {
                        let selectedFlight: any = this.flightPlayers.find(
                            (a) => {
                                return a.flightId == flightId;
                            }
                        );
                        selectedFlight.forEach((element) => {
                            if (element.playerId == playerId) {
                                element.panelty = true;
                            }
                        });
                        this.snackBar.open('Panelty Marked.', 'x', {
                            duration: 5000,
                        });
                    }
                } else {
                    event.source.checked = false;
                }
            });
        } else {
            let selectedFlight: any = this.flightPlayers.find((a) => {
                return a.flightId == flightId;
            });
            selectedFlight.forEach((element) => {
                if (element.playerId == playerId) {
                    element.panelty = false;
                }
            });
        }
    }
    movetoNewRound(player) {
        //console.log(player);
        this.createNewRound(player);
    }

    createNewRound(player) {
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to move this player to a new round?',
        });
        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                let selectedFlight: any = this.flightPlayers.find((a) => {
                    return a.flightId == player.flightId;
                });
                let courseHS = selectedFlight.courseHoleSetKey.split('_', 2);
                //console.log(selectedFlight);
                //console.log(this.fDate);
                const addRound: any = {
                    holeSets: courseHS.length > 0 ? courseHS[0] : 3,
                    holeSetInverted: courseHS.length > 0 ? courseHS[1] : false,
                    //startingHole: starterFormValue.startingHole,
                    startingTime: selectedFlight.flightTime,
                    roundTee: selectedFlight.courseTee,
                    roundDate: this.fDate,
                    //addPlayer : starterFormValue.addPlayer
                };
                //console.log(addRound);
                let tournamentFlights: Flight[] = [];
                let fcnter = 1;
                // let roundMembers: any[] = [];
                // let flightMember = {
                //   playerId: player.playerId,
                //   attendance: false,
                //   playingTee: (selectedFlight.courseTee)? selectedFlight.courseTee : "BLUE",
                //   guest: null
                // }
                //   roundMembers.push(flightMember);
                let newFlightId = UniqueIdGenerator.generate();
                let flight: any = {
                    id: newFlightId,
                    //tournamentId: this.tournamentID,
                    courseId: player.courseId,
                    adminId: this.loggedInuser.id,
                    courseHoleSets: addRound.holeSets,
                    flightNo: fcnter,
                    flightRound: 0,
                    startingHole: 1,
                    tee: addRound.roundTee,
                    category: null,
                    date: General.parseToDate(this.fDate),
                    time: addRound.startingTime,
                    ended: false,
                    categoryRound: selectedFlight.categoryRound,
                    courseHoleSetsInverted: addRound.holeSetInverted,
                    members: {
                        data: [],
                    },
                };
                //console.log(flight);
                tournamentFlights.push(flight);
                //console.log(tournamentFlights);
                let newTournamentId = UniqueIdGenerator.generate();
                let tournament: Tournament = {
                    id: newTournamentId,
                    clubId: this.loggedInuser.adminClubId,
                    leagueId: null,
                    courseId: player.courseId,
                    adminId: this.loggedInuser.id,
                    title:
                        this.fDate +
                        ' ' +
                        this.loggedInuser.club.name,
                    prefix: null,
                    courseHoleSets: addRound.holeSets,
                    teamMatch: false,
                    pairsMatch: false,
                    interLeague: false,
                    publicTournament: false,
                    confirmParticipants: false,
                    noOfRounds: 1,
                    activeRound: 1,
                    playingOnWhs:
                        this.dailyData &&
                            this.dailyData.TournamentsQL.length > 0
                            ? this.dailyData.TournamentsQL[0].playingOnWhs
                            : false,
                    matchFormat: 'STROKE_PLAY',
                    pointsFormats: null,
                    pointsValues: null,
                    handicapAllocations: null,
                    tee: selectedFlight.courseTee
                        ? selectedFlight.courseTee
                        : 'AMATEURS',
                    tee_id: 1,
                    scoreManagement: 'ONLY_PLAYERS',
                    startDate: General.parseToDate(this.fDate),
                    endDate: General.parseToDate(this.fDate),
                    createdAt: new Date(this.fDate).toISOString(),
                    flightsCategory: null,
                    started: true,
                    invited: false,
                    singleRound: true,
                    sponsorName: '',
                    sponsorLogo: '',
                    mobileLogoUrl: '',
                    webLogoUrl: '',
                    courseHoleSetsInverted: addRound.holeSetInverted,
                    categories: [],
                    marshals: [],
                    flights: tournamentFlights,
                    members: [],
                };
                //console.log(tournament);
                let result = <any>(
                    await this.facadeService.addTournament(tournament)
                );
                //this.executeStarterCreation(this.starterForm)
                //console.log(result);
                if (result) {
                    let eliminated = <any>(
                        await this.facadeService.eliminateRound(
                            selectedFlight.flightId,
                            newFlightId,
                            player.playerId
                        )
                    );
                    if (eliminated) {
                        let flightIndex = this.flightPlayers.findIndex(
                            (a) => a.flightId == player.flightId
                        );
                        let playerIndex = this.flightPlayers[
                            flightIndex
                        ].findIndex((a) => a.playerId == player.playerId);
                        this.flightPlayers[flightIndex].splice(playerIndex, 1);
                        let updatedFlight =
                            await this.facadeService.singleRoundFlightsQuery(
                                newFlightId
                            );
                        //console.log(updatedFlight);
                        let courseHoleSetTitle;
                        if (
                            updatedFlight.FlightsQL[0].CourseQL &&
                            updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL
                        ) {
                            courseHoleSetTitle =
                                updatedFlight.FlightsQL[0].CourseQL.CourseHoleSetsQL.find(
                                    (a) => {
                                        return (
                                            a.holeSets ==
                                            updatedFlight.FlightsQL[0]
                                                .courseHoleSets &&
                                            a.inverted ==
                                            updatedFlight.FlightsQL[0]
                                                .courseHoleSetsInverted
                                        );
                                    }
                                );
                        }
                        //console.log(courseHoleSetTitle);
                        let flightHeader = await this.setupMatchplayHeader(
                            updatedFlight.FlightsQL[0].courseId,
                            updatedFlight.FlightsQL[0].courseHoleSets,
                            updatedFlight.FlightsQL[0].courseHoleSetsInverted,
                            updatedFlight.FlightsQL[0].CourseQL
                        );
                        //console.log(flightHeader);
                        let singleFlight = this.setupSingleFlight(
                            updatedFlight.FlightsQL[0],
                            flightHeader,
                            []
                        );
                        //console.log(singleFlight);
                        //this.flightPlayers.push(singleFlight);
                        ////console.log(this.flightPlayers)
                        let newFlightData = singleFlight;
                        newFlightData['header'] = flightHeader;
                        newFlightData['flightId'] = newFlightId;
                        newFlightData['categoryRound'] =
                            selectedFlight.categoryRound;
                        newFlightData['tournamentId'] = newTournamentId;
                        newFlightData['flightTime'] = selectedFlight.flightTime;
                        newFlightData['courseHoleSetTitle'] =
                            courseHoleSetTitle.displayName;
                        newFlightData['courseHoleSetKey'] = updatedFlight
                            .FlightsQL[0]
                            ? updatedFlight.FlightsQL[0].courseHoleSets +
                            '_' +
                            updatedFlight.FlightsQL[0].courseHoleSetsInverted
                            : '';
                        newFlightData['courseTee'] = courseHoleSetTitle
                            ? updatedFlight.FlightsQL[0].tee
                            : '';
                        newFlightData['membersCount'] = singleFlight
                            ? singleFlight.length
                            : 0;
                        this.flightPlayers.splice(
                            flightIndex,
                            0,
                            newFlightData
                        );
                        this.snackBar.open(
                            'Player has been moved to a new round.',
                            'x',
                            {
                                duration: 5000,
                            }
                        );
                    }
                    //this.router.navigate(['/daily-rounds/']);
                }
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    async removePlayer(tournamentId, flightId, playerId) {
        try {
            const combinedData = `flightId=${flightId}, playerId=${playerId}`;
            this.logger.log('Admin click delete player on Daily Round Page', "info", combinedData);
            // console.log(tournamentId);
            // console.log(flightId);
            // console.log(playerId);

            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to delete this player?',
            });
            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    let response = await this.facadeService.DeleteFlightMembers(
                        flightId,
                        playerId
                    );
                    if (response) {
                        this.logger.log('Players is deleted ', "info");
                        let playersId = [];
                        playersId.push(playerId);
                        const check = await this.facadeService.deletePlayerHandiCal(
                            tournamentId,
                            playersId
                        );
                        if (check) {
                            let flightIndex = this.flightPlayers.findIndex(
                                (a) => a.flightId == flightId
                            );
                            let playerIndex = this.flightPlayers[
                                flightIndex
                            ].findIndex((a) => a.playerId == playerId);
                            this.flightPlayers[flightIndex].splice(playerIndex, 1);
                            this.snackBar.open('Player has been deleted.', 'x', {
                                duration: 2000,
                            });
                            if (this.flightPlayers[flightIndex].ended) {
                                let newObj = {
                                    playerId: playerId,
                                    count: 4,
                                };
                                await this.handicapService
                                    .calculateHandicap(newObj)
                                    .then((response) => {
                                        //console.log(response);
                                        this.snackBar.open('Congu-Handicap Recalculated.', 'x', {
                                            duration: 1000,
                                        });
                                    })
                                    .catch((err) => {
                                        //console.log('error' + err);
                                        this.snackBar.open('Congu-Handicap Error!.', 'x', {
                                            duration: 1000,
                                        });
                                    });
                                await this.handicapService
                                    .calculateHandicapWHS(newObj)
                                    .then((response) => {
                                        //console.log(response);
                                        this.snackBar.open('WHS-Handicap Recalculated.', 'x', {
                                            duration: 1000,
                                        });
                                    })
                                    .catch((err) => {
                                        //console.log('error' + err);
                                        this.snackBar.open('WHS-Handicap Error!.', 'x', {
                                            duration: 1000,
                                        });
                                    });
                            }
                        }
                    }
                } else {
                    this.logger.log('Delete player Dialog Box Close', "info");
                }
            });
        } catch (error) {
            this.logger.log('Removing Player on Daily Round Data Failed', "error", error.toString());

        }
    }
}
