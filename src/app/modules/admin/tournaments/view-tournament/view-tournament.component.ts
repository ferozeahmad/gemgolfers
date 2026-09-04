import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    enumPlayerCategory,
    Player,
    PlayerHanidcap,
    TournamentMemberStatus,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    matchFormat,
    TournamentCategory,
    TournamentMember,
} from '../../../../shared/models/tournament.model';
import { Leader, LeaderType } from '../../../../shared/classes/leader';
import {
    UniqueIdGenerator,
    General,
    Constants,
    handicapAllocation,
} from '../../../../shared/classes/general';
import { FacadeService } from '../../../../shared/services/facade.service';
import { AppStats } from '../../../../shared/helper/app-stats.help';
import { FlightScores } from '../../../../shared/classes/FlightScores';
import { ScoreStats } from '../../../../shared/classes/ScoreStats';
import { of } from 'rxjs';
import { Score } from 'app/shared/classes/score';
import { DatePipe } from '@angular/common';

import { DialogCloseRoundComponent } from '../../dialogs/dialog-close-round/dialog-close-round.component';
import { DialogCourseDetailsComponent } from '../../dialogs/dialog-course-details/dialog-course-details.component';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { DialogPlayingCategoryComponent } from '../../dialogs/dialog-playing-category/dialog-playing-category.component';
import { DialogMarshalComponent } from '../../dialogs/dialog-marshal/dialog-marshal.component';
import { ApexOptions } from 'ng-apexcharts';
import { DialogPlayerListComponent } from '../../dialogs/dialog-player-list/dialog-player-list.component';
import { MatDrawer } from '@angular/material/sidenav';
import { FlightManagementComponent } from '../flight-management/flight-management.component';
// import { PlayerManagementComponent } from '../player-management/player-management.component';
import { forEach } from 'lodash';
import { DialogPlayerComponent } from '../../dialogs/dialog-player/dialog-player.component';
import { DialogAddPlayerComponent } from '../../dialogs/dialog-add-player/dialog-add-player.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { DialogEditPlayerHandicapComponent } from '../../dialogs/dialog-edit-player-handicap/dialog-edit-player-handicap.component';
import * as XLSX from 'xlsx';

@Component({
    standalone: false,
    selector: 'app-view-tournament',
    templateUrl: './view-tournament.component.html',
    styleUrls: ['./view-tournament.component.scss'],
})
export class ViewTournamentComponent implements OnInit {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    drawerMode: 'side' | 'over';
    private tournamentID: string;
    private newFlightID: string;
    private flightRound: string;
    playersCatgery: any;
    dataSource: MatTableDataSource<any>;
    dataSourceTournametMembers: MatTableDataSource<any>;
    dataSourceFlightMembers: MatTableDataSource<any>;
    allMatchResults: any[] = [];
    membersColumns = [
        'firstName',
        'lastName',
        'handicap',
        'playerCategory',
        'select',
    ];
    flightsmembersColumns = [
        'firstName',
        'lastName',
        'handicap',
        'playerCategory',
        'select',
    ];
    private noOfHolesInCourse: number = 18;
    fullTournament: any;
    joiningCode: string = '';
    memberStatusesQLs: TournamentMemberStatus[] = [];
    isLoading: boolean = true;
    totalRounds: number;
    activeRound: number = 1;
    currentRound: number = 1;
    noOfRounds: number = 1;
    selected: number = 0;
    changer: number = 0;
    totalMembers: number = 0;
    webLogo: string;
    flightid: any;
    flight: any = [];
    membersData: Player[] = [];
    allPlayers: Player[] = [];
    membersStats: any[] = [];
    topMembers: any[] = [];
    topPlayersScoreType: 'gross' | 'net' = 'gross';
    highlightedFlightId: string = null;
    showResultSheetMenu = false;
    isGeneratingResultSheet = false;
    tournamentCourses: any[] = [];
    topMembers1: any[] = [];
    topMembers2: any[] = [];
    topMembers3: any[] = [];
    topMembers4: any[] = [];
    leaderboardUrl: string;
    public barChartLabels: string[] = [];
    _series: any = [];
    loggedInUser: UserSessionModel;
    leaderboardData: any[] = [];
    playerCategoryList: any[] = [];
    membersStatus: any;
    gridColumns = 3;
    courseImg: string;
    activeTab: string = 'Overview';
    tournamentPlayersAdd: boolean = true;
    showCloseBtn: boolean = true;
    showMatchPlay: boolean = false;
    showShambles: boolean = false;
    categories: TournamentCategory[] = [];
    FlightsQL: any[] = [];
    selectedMembers: Player[][] = [];
    activeTournamentMembers: TournamentMember[] = [];
    runningFlights: number = 0;
    teetime: number = 0;
    flightNumber: number = 0;
    scoreAdded: boolean = false;
    avgScore: any[] = [];
    avgScore1: number[] = [];
    avgScore2: number[] = [];
    avgScore3: number[] = [];
    avgScore4: number[] = [];
    chartavgScore: number[] = [];
    chartavgScore1: number[] = [];
    chartavgScore2: number[] = [];
    chartavgScore3: number[] = [];
    chartavgScore4: number[] = [];
    selectedCategory: any;
    clubLogo: any;
    par3Avg1: number;
    par4Avg1: number;
    par5Avg1: number;
    shotsBirdiesPercent1: number;
    shotsBogeysPercent1: number;
    shotsThreeOrHigherPercent1: number;
    shotsParsPercent1: number;
    shotsDoubleBogeysPercent1: number;
    roundsStats: boolean = false;
    copied: boolean = false;
    round1Stats: boolean = false;
    isClubAdmin: boolean = false;
    round3Stats: boolean = false;
    round4Stats: boolean = false;
    showMainTab1: boolean = true;
    showMainTab2: boolean = false;
    showMainTab3: boolean = false;
    showMainTab4: boolean = false;
    showMainTab5: boolean = false;
    showMainTab6: boolean = false;
    showSummary: boolean = false;
    tournamentMember: any = [];
    tournamentMembers: any = [];
    dataFullTournament: any;
    cuttFlag: number = 0;
    tournamentCategories: any;
    leaderAllRoundData: any;
    AmateursCount: number = 0;
    JuniorsCount: number = 0;
    SeniorsCount: number = 0;
    VeteransCount: number = 0;
    LadiesCount: number = 0;
    AmateursPlayingDates: any[] = [];
    SeniorsPlayingDates: any[] = [];
    JuniorsPlayingDates: any[] = [];
    VeteransPlayingDates: any[] = [];
    LadiesPlayingDates: any[] = [];
    mainSelected: number = 0;
    par3Avg2: number;
    par4Avg2: number;
    par5Avg2: number;
    shotsBirdiesPercent2: number;
    shotsBogeysPercent2: number;
    shotsThreeOrHigherPercent2: number;
    shotsParsPercent2: number;
    shotsDoubleBogeysPercent2: number;
    dataSourceR1Gross: MatTableDataSource<any>;
    displayedColumnsR1Gross = ['pos', 'name', 'gross', 'toPar', 'thru'];
    dataSourceR2Gross: MatTableDataSource<any>;
    displayedColumnsR2Gross = ['pos', 'name', 'gross', 'toPar', 'thru'];
    dataSourceR3Gross: MatTableDataSource<any>;
    displayedColumnsR3Gross = ['pos', 'name', 'gross', 'toPar', 'thru'];
    dataSourceR4Gross: MatTableDataSource<any>;
    displayedColumnsR4Gross = ['pos', 'name', 'gross', 'toPar', 'thru'];
    topPlayers = [
        {
            PlayerQL: {
                firstName: 'Player',
                lastName: '1',
            },
        },
        {
            PlayerQL: {
                firstName: 'Player',
                lastName: '2',
            },
        },
        {
            PlayerQL: {
                firstName: 'Player',
                lastName: '3',
            },
        },
    ];
    tabs = ['Overview', 'Groups', 'Scores', 'Participants'];
    ponitsFormats: any;
    dataSourceR1NET: MatTableDataSource<any>;
    displayedColumnsR1NET = ['pos', 'name', 'net', 'toPar', 'thru'];
    dataSourceR2NET: MatTableDataSource<any>;
    displayedColumnsR2NET = ['pos', 'name', 'net', 'toPar', 'thru'];
    dataSourceR3NET: MatTableDataSource<any>;
    displayedColumnsR3NET = ['pos', 'name', 'net', 'toPar', 'thru'];
    dataSourceR4NET: MatTableDataSource<any>;
    displayedColumnsR4NET = ['pos', 'name', 'net', 'toPar', 'thru'];

    dataSourceTotalGross: MatTableDataSource<any>;
    displayedColumnsTotalGross = [
        'pos',
        'name',
        'R1gross',
        'R2gross',
        'R3gross',
        'R4gross',
        'total',
    ];
    dataSourceTotalNET: MatTableDataSource<any>;
    displayedColumnsTotalNET = [
        'pos',
        'name',
        'R1net',
        'R2net',
        'R3net',
        'R4net',
        'total',
    ];
    tournamentMembersColumn = [

        'firstName',
        'lastName',
        'email',
        'category',
        'handicap',
        'actions',
    ]

    dataSourceMembersStatus: MatTableDataSource<any>;
    displayedColumnsMembersStatus = ['name', 'category', 'handicap'];
    storagePath: string;
    chartGithubIssues: ApexOptions = {};
    // Pie
    public pieChartLabels: string[] = ['On Par 3', 'On Par 4', 'On Par 5'];
    public pieChartData1: number[] = []; //[300, 500, 100];
    public pieChartData2: number[] = [];
    public pieChartData3: number[] = [];
    public pieChartData4: number[] = [];
    public pieChartType: string = 'pie';
    public playersUpdatedHandicap: PlayerHanidcap[] = [];
    showImage: boolean = false;
    noOfROund: any;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    url: any;
    category: any[] = [];
    rounds: any[] = [];
    totalPlayers: any = 0;
    matchFormat: any;

    constructor(
        private datePipe: DatePipe,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        public changeDetection: ChangeDetectorRef,
        private _localStorage: LocalStorageService,
        private logger: LogsService,
        //private _flightManagmentComponent: FlightManagementComponent,
        public facadeService: FacadeService // private storage: AngularFireStorage
    ) {
        this.barChartLabels.push('Birdies');
        this.barChartLabels.push('Pars');
        this.barChartLabels.push('Bogeys');
        this.barChartLabels.push('D.Bogeys');
        this.barChartLabels.push('3 or Plus');
        this.barChartLabels.push('On Par 3');
        this.barChartLabels.push('On Par 4');
        this.barChartLabels.push('On Par 5');
    }

    async ngOnInit() {
        ////console.log(this.route.snapshot.paramMap.get("id"));
        try {
            this.logger.log('Admin comes to View Tournament Page', "info");

            this.loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);

            if (this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin()) {
                this.isClubAdmin = true;
            }
            this.clubLogo = this.loggedInUser.club && this.loggedInUser.club.logo ? this.loggedInUser.club.logo : 'e2esp.png';
            this.route.paramMap.subscribe((params) => {
                this.tournamentID = params.get('id');
            });

            if (this.tournamentID) {
                this.logger.log('Getting Tournament Data', "info", this.tournamentID);
                this.url = 'golfcourse.jpg';
                this.dataFullTournament =
                    await this.facadeService.tournamentDashBoard(this.tournamentID);
                console.log(this.dataFullTournament);
                // this.getTournamentMembers();
                console.log(this.tournamentCourses);
                this.memberStatusesQLs =
                    this.dataFullTournament['TournamentQL'][0].MemberStatusesQL;
                this.tournamentCourses =
                    this.dataFullTournament['TournamentQL'][0].CoursesQL;
                this.noOfROund =
                    this.dataFullTournament['TournamentQL'][0].noOfRounds;

                if (
                    this.dataFullTournament['TournamentQL'][0]['CourseQL'].picture
                ) {
                } else {
                    this.url = 'golfcourse.jpg';
                }


                if (this.dataFullTournament.TournamentQL.length == 0) {
                    alert('no record found.');
                    this.isLoading = false;
                    return false;
                }
                this.matchFormat = this.dataFullTournament['TournamentQL'][0]['matchFormat'];
                if (
                    this.dataFullTournament['TournamentQL'][0]['matchFormat'] ==
                    matchFormat.TEXAS_SCRAMBLE
                ) {
                    this.showCloseBtn = false;
                    this.tournamentPlayersAdd = true;
                }

                this.fullTournament = this.dataFullTournament.TournamentQL[0];
                this.isLoading = false;


                if (this.fullTournament) {
                    this.joiningCode = this.fullTournament.inviteCode;
                    if (this.fullTournament.matchFormat == matchFormat.SHAMBLES) {
                        this.showShambles = true;
                        this.tabs.push('Pairs');
                    }
                    if (this.fullTournament.matchFormat == matchFormat.MATCH_PLAY || this.fullTournament.matchFormat == matchFormat.BEST_THREE || this.fullTournament.matchFormat == matchFormat.BEST_TWO) {
                        this.showMatchPlay = true;
                        this.tabs.push('Teams');
                        if (this.fullTournament.matchFormat == matchFormat.MATCH_PLAY) {
                            const formatsObj = this.fullTournament.pointsFormats;

                            const readableFormats = Object.values(formatsObj)       // Extract values
                                .filter(f => f)                                     // Remove null/undefined
                                .map((f: string) => f.toLowerCase())                          // lowercase
                                .map((f: string) => f.charAt(0).toUpperCase() + f.slice(1))   // capitalize first letter
                                .join(", ");                                        // join by comma

                            this.ponitsFormats = readableFormats
                        }
                    }

                    this.activeRound = this.fullTournament.activeRound;
                    this.currentRound = this.fullTournament.activeRound;
                    this.noOfRounds = this.fullTournament.noOfRounds;
                    this.categories = this.fullTournament.CategoriesQL;
                    this.tournamentCategories =
                        this.dataFullTournament['TournamentQL'][0]['CategoriesQL'];
                    // this.playersUpdatedHandicap =
                    //   this.fullTournament.HandicapCalculated;

                    if (this.fullTournament.webLogoUrl)
                        this.webLogo = this.fullTournament.webLogoUrl;
                    else this.webLogo = Constants.DEFAULT_CLUB_LOGO;

                    if (this.activeRound > this.noOfRounds) {
                        if (this.fullTournament.prefix) {
                            this.selected = this.noOfRounds - 1;
                            //else //this.selected = this.activeRound - 1;

                            this.leaderboardUrl =
                                'https://app.gemgolfers.com/leaderboard/' +
                                this.fullTournament.prefix;
                        } else {
                            this.leaderboardUrl =
                                'https://app.gemgolfers.com/leaderboard/' +
                                this.tournamentID;
                        }
                    } else {
                        this.selected = this.activeRound - 1;
                    }
                    if (
                        this.dataFullTournament['TournamentQL'][0]['CategoriesQL']
                            .length == 0
                    ) {
                        this.playerCategoryList =
                            this.facadeService.getPlayerCategories();
                        ////console.log(playerCategoryList);
                    }
                } else this.router.navigate(['/tournaments/']);

                ////console.log(this.fullTournament);

                // this.calculateStatistics();
                // if (this.tournamentPlayersAdd) {
                //     this.GrossData(
                //         this.dataFullTournament['TournamentQL'][0].CategoriesQL[0]
                //             .category
                //     );
                //     this.NetData(
                //         this.dataFullTournament['TournamentQL'][0].CategoriesQL[0]
                //             .category
                //     );
                // }
                this.calculatePlayersCount();
                const effectiveRound = Math.min(this.activeRound, this.noOfRounds);
                this.getRoundStats(effectiveRound);
                this.calculateStatistics(effectiveRound);
                this.getTournamentMembers();
                this.rounds = [];

                for (let i = 1; i <= this.noOfRounds; i++) {
                    let status = '';

                    if (i < this.activeRound) {
                        status = 'Completed';
                    } else if (i === this.activeRound) {
                        status = 'In Progress';
                    } else {
                        status = 'Pending'; // or "Upcoming"
                    }

                    this.rounds.push({
                        label: 'Round ' + i,
                        status: status,
                        round: i
                    });
                }

                // this.rounds.push({ label: 'Summary' });
                //this.currentPlayer = <Player>await this.facadeService.getPlayerByID(this.playerID);
            } else {
                this.router.navigate(['/tournaments/']);
            }
        } catch (error) {
            this.logger.log('Getting View Tournament Data Failed', "error", error.toString());
        }
    }

    calculatePlayersCount() {
        try {
            this.AmateursCount = 0;
            this.JuniorsCount = 0;
            this.SeniorsCount = 0;
            this.VeteransCount = 0;
            this.LadiesCount = 0;
            // this.FlightsQL.slice(0,6);
            this.totalPlayers =
                this.dataFullTournament['TournamentQL'][0]['members'];
            // console.log(totalPlayers);
            for (const c of this.fullTournament.CategoriesQL) {


                // const distinctThings = m.filter((thing, i, arr) => {
                //   return arr.indexOf(arr.find(t => t.id === thing.id)) === i;
                // });
                if (c.category == 'Amateurs') {
                    if (
                        c.flightSettings &&
                        c.flightSettings['playingDate'] &&
                        c.flightSettings['playingDate'].length > 0
                    ) {
                        for (let obj of c.flightSettings['playingDate']) {
                            this.AmateursPlayingDates.push(obj);
                        }
                    } else if (
                        c.flightSettings &&
                        c.flightSettings.length > 0
                    ) {
                        for (let obj of c.flightSettings) {
                            this.AmateursPlayingDates.push(obj);
                        }
                    }
                }
                if (c.category.includes('Junior')) {

                    if (
                        c.flightSettings &&
                        c.flightSettings['playingDate'] &&
                        c.flightSettings['playingDate'].length > 0
                    ) {
                        for (let obj of c.flightSettings['playingDate']) {
                            this.JuniorsPlayingDates.push(obj);
                        }
                    } else if (
                        c.flightSettings &&
                        c.flightSettings.length > 0
                    ) {
                        for (let obj of c.flightSettings) {
                            this.JuniorsPlayingDates.push(obj);
                        }
                    }
                }
                if (c.category.includes('Senior')) {
                    if (
                        c.flightSettings &&
                        c.flightSettings['playingDate'] &&
                        c.flightSettings['playingDate'].length > 0
                    ) {
                        for (let obj of c.flightSettings['playingDate']) {
                            this.SeniorsPlayingDates.push(obj);
                        }
                    } else if (
                        c.flightSettings &&
                        c.flightSettings.length > 0
                    ) {
                        for (let obj of c.flightSettings) {
                            this.SeniorsPlayingDates.push(obj);
                        }
                    }
                }
                if (c.category == 'Professionals') {
                    if (
                        c.flightSettings &&
                        c.flightSettings['playingDate'] &&
                        c.flightSettings['playingDate'].length > 0
                    ) {
                        for (let obj of c.flightSettings['playingDate']) {
                            this.VeteransPlayingDates.push(obj);
                        }
                    } else if (
                        c.flightSettings &&
                        c.flightSettings.length > 0
                    ) {
                        for (let obj of c.flightSettings) {
                            this.VeteransPlayingDates.push(obj);
                        }
                    }
                }
                if (c.category == 'Ladies') {
                    if (
                        c.flightSettings &&
                        c.flightSettings['playingDate'] &&
                        c.flightSettings['playingDate'].length > 0
                    ) {
                        for (let obj of c.flightSettings['playingDate']) {
                            this.LadiesPlayingDates.push(obj);
                        }
                    } else if (
                        c.flightSettings &&
                        c.flightSettings.length > 0
                    ) {
                        for (let obj of c.flightSettings) {
                            this.LadiesPlayingDates.push(obj);
                        }
                    }
                }
            }
            for (const c of this.totalPlayers) {
                if (c.PlayerQL['playerCategory'] == 'Amateurs') {
                    this.AmateursCount++;
                }
                if (c.PlayerQL['playerCategory'].includes('Junior')) {
                    this.JuniorsCount++;
                }
                if (c.PlayerQL['playerCategory'].includes('Senior')) {
                    this.SeniorsCount++;
                }
                if (c.PlayerQL['playerCategory'] == 'Professionals') {
                    this.VeteransCount++;
                }
                if (c.PlayerQL['playerCategory'] == 'Ladies') {
                    this.LadiesCount++;
                }
            }

        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    calculateStatistics(round?: number) {
        try {

            this.FlightsQL = [];
            this.topMembers = [];
            let totalPlayer = [];
            if (round) {
                this.FlightsQL = this.fullTournament.FlightsQL.filter((a) => {
                    return a.flightRound == round;
                });
            }

            if (this.FlightsQL.length && this.FlightsQL.length > 6) {
                this.FlightsQL.splice(6, this.FlightsQL.length);
                for (const c of this.FlightsQL) {
                    for (let obj of c['MembersQL']) {
                        totalPlayer.push(obj);
                    }
                }
            } else {
                totalPlayer = [...this.dataFullTournament['TournamentQL'][0]['members']];
            }

            // Build scored player list from all flights
            const handicapAllocation = this.getHandicapAllocation ? this.getHandicapAllocation() : 'full';
            const allFlights = this.fullTournament.FlightsQL.filter((a) => round ? a.flightRound == round : true);
            const scoredPlayers: any[] = [];
            for (const flight of allFlights) {
                for (const member of (flight.MembersQL || [])) {
                    const scores: any[] = member.ScoresQL || [];
                    let grossTotal = 0;
                    let netTotal = 0;
                    let scoreHandicap = 0;
                    for (const score of scores) {
                        const gross = score.grossScore || 0;
                        if (gross <= 0) continue;
                        grossTotal += gross;
                        if (score.playerHandicap) scoreHandicap = score.playerHandicap;
                    }
                    netTotal = grossTotal > 0 ? grossTotal - scoreHandicap : 0;
                    scoredPlayers.push({
                        id: member.playerId,
                        title: member.PlayerQL['firstName'] + ' ' + member.PlayerQL['lastName'],
                        handicap: member.PlayerQL['handicap'],
                        category: member.PlayerQL['playerCategory'],
                        class: member.PlayerQL['playerCategory'],
                        grossScore: grossTotal,
                        netScore: netTotal,
                        flightId: flight.id,
                    });
                }
            }

            // If we have scores, sort by score; otherwise fall back to handicap
            if (scoredPlayers.length > 0) {
                const hasScores = scoredPlayers.some(p => p.grossScore > 0);
                if (hasScores) {
                    if (this.topPlayersScoreType === 'net') {
                        scoredPlayers.sort((a, b) => (a.netScore || 999) - (b.netScore || 999));
                    } else {
                        scoredPlayers.sort((a, b) => (a.grossScore || 999) - (b.grossScore || 999));
                    }
                    // Remove duplicates by player id (player may appear in multiple flights)
                    const seen = new Set();
                    for (const p of scoredPlayers) {
                        if (seen.has(p.id)) continue;
                        seen.add(p.id);
                        if (!hasScores || p.grossScore > 0) this.topMembers.push(p);
                        if (this.topMembers.length >= 10) break;
                    }
                } else {
                    totalPlayer.sort(this.ComparatorHandicap);
                    let count = 0;
                    for (const c of totalPlayer) {
                        if (count >= 10) break;
                        this.topMembers.push({
                            id: c.playerId,
                            title: c.PlayerQL['firstName'] + ' ' + c.PlayerQL['lastName'],
                            handicap: c.PlayerQL['handicap'],
                            category: c.PlayerQL['playerCategory'],
                            class: c.PlayerQL['playerCategory'],
                            grossScore: 0,
                            netScore: 0,
                        });
                        count++;
                    }
                }
            } else {
                totalPlayer.sort(this.ComparatorHandicap);
                let count = 0;
                for (const c of totalPlayer) {
                    if (count >= 10) break;
                    this.topMembers.push({
                        id: c.playerId,
                        title: c.PlayerQL['firstName'] + ' ' + c.PlayerQL['lastName'],
                        handicap: c.PlayerQL['handicap'],
                        category: c.PlayerQL['playerCategory'],
                        class: c.PlayerQL['playerCategory'],
                        grossScore: 0,
                        netScore: 0,
                    });
                    count++;
                }
            }
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    toggleTopPlayersScoreType(type: 'gross' | 'net') {
        this.topPlayersScoreType = type;
        this.calculateStatistics(Math.min(this.activeRound, this.noOfRounds));
    }

    navigateToPlayerFlight(player: any) {
        this.highlightedFlightId = player.flightId || null;
        this.setPrimaryTab('Scores');
    }

    public onChangeGross(event) {
        //console.log(event);
        this.selectedCategory = this.tournamentCategories[event.index].category;
        //console.log(this.selectedCategory);
        if (this.showSummary) this.GrossData(this.selectedCategory);
    }
    public onChangeNet(event) {
        //console.log(event);
        this.selectedCategory = this.tournamentCategories[event.index].category;
        //console.log(this.selectedCategory);
        if (this.showSummary) this.NetData(this.selectedCategory);
        this.showSummary = true;
    }
    tabClicked(tab: any) {

        try {
            this.activeRound = tab.round;
            this.calculateStatistics(tab.round);
            this.getRoundStats(tab.round);

            // if (tab.index == 0 && tab.tab['textLabel'] !== 'Summary') {
            //     this.calculateStatistics1();
            //     this.getRound1stats(1);
            //     // this.getRound1stats(1);
            //     // this.GrossData(this.tournamentCategories[0].category);
            //     // this.NetData(this.tournamentCategories[0].category);
            // } else if (tab.index == 1 && tab.tab['textLabel'] !== 'Summary') {
            //     this.calculateStatistics2();
            //     this.getRound2stats(2);
            // } else if (tab.index == 2 && tab.tab['textLabel'] !== 'Summary') {
            //     this.calculateStatistics3();
            //     this.getRound3stats(3);
            // } else if (tab.index == 3 && tab.tab['textLabel'] !== 'Summary') {
            //     this.calculateStatistics4();
            //     this.getRound4stats(4);
            // } else if (tab.index == 4 && tab.tab['textLabel'] !== 'Summary') {
            //     this.calculateStatistics4();
            //     this.getRound4stats(4);
            // } else {
            //     this.GrossData(
            //         this.dataFullTournament['TournamentQL'][0].CategoriesQL[0]
            //             .category
            //     );
            //     this.NetData(
            //         this.dataFullTournament['TournamentQL'][0].CategoriesQL[0]
            //             .category
            //     );
            // }
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    setPrimaryTab(tab: string) {
        this.activeTab = tab;
        this.calculateStatistics(Math.min(this.activeRound, this.noOfRounds));
        this.getRoundStats(Math.min(this.activeRound, this.noOfRounds));
    }

    activePrimaryTab() {
        return this.activeTab;
    }

    // maintabClicked(tab: any) {
    //     try {
    //         this.logger.log('Admin click on Main Tab in View Tournament Page', "info", tab.toString());
    //         if (!this.showMatchPlay) {
    //             if (tab.index == 0) {
    //                 this.showMainTab1 = true;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //                 if (this.activeRound == 1) this.calculateStatistics1();
    //                 this.getRound1stats(1);
    //                 if (this.activeRound == 2) this.calculateStatistics2();
    //                 this.getRound2stats(2);
    //                 if (this.activeRound == 3) this.calculateStatistics3();
    //                 this.getRound3stats(3);
    //                 if (this.activeRound == 4) this.calculateStatistics4();
    //                 this.getRound4stats(4);
    //             } else if (tab.index == 1) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = true;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //             } else if (tab.index == 2) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = true;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //             } else if (tab.index == 3) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.getTournamentMembers();
    //                 this.showMainTab5 = true;
    //             } else if (tab.index == 4) {

    //             }
    //         } else {
    //             if (tab.index == 0) {
    //                 this.showMainTab1 = true;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //                 this.showMainTab6 = false;
    //                 if (this.activeRound == 1) this.calculateStatistics1();
    //                 this.getRound1stats(1);
    //                 if (this.activeRound == 2) this.calculateStatistics2();
    //                 this.getRound2stats(2);
    //                 if (this.activeRound == 3) this.calculateStatistics3();
    //                 this.getRound3stats(3);
    //                 if (this.activeRound == 4) this.calculateStatistics4();
    //                 this.getRound4stats(4);
    //             } else if (tab.index == 1) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = true;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //                 this.showMainTab6 = false;
    //             } else if (tab.index == 2) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //                 this.showMainTab6 = true;
    //             } else if (tab.index == 3) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = true;
    //                 this.showMainTab4 = false;
    //                 this.showMainTab5 = false;
    //                 this.showMainTab6 = false;
    //             } else if (tab.index == 4) {
    //                 this.showMainTab1 = false;
    //                 this.showMainTab2 = false;
    //                 this.showMainTab3 = false;
    //                 this.showMainTab4 = false;
    //                 this.getTournamentMembers();
    //                 this.showMainTab5 = true;
    //                 this.showMainTab6 = false;
    //             } else {


    //             }
    //         }

    //     } catch (error) {
    //         this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
    //     }
    // }

    getRoundStats(round?: number) {
        // if (this.round1Stats) return;
        this.avgScore = [];
        this.chartavgScore1 = [];
        this.pieChartData1 = [];
        this._series = [];
        let roundFlights = [];

        if (round) {
            roundFlights = this.fullTournament.FlightsQL.filter((a) => {
                return a.flightRound == round;
            });
        } else {
            roundFlights = this.fullTournament.FlightsQL;
        }

        let stats = new AppStats(roundFlights, this.fullTournament.CourseQL);
        let finalScoreStats: ScoreStats = stats.getApplicationStats();
        //console.log(finalScoreStats);
        // this.avgScore.push({
        //     name: 'On Par 3',
        //     value: finalScoreStats.par3Stats.getAvgScores(),
        // })
        // this.avgScore.push({
        //     name: 'On Par 4',
        //     value: finalScoreStats.par4Stats.getAvgScores(),
        // })
        // this.avgScore.push({
        //     name: 'On Par 5',
        //     value: finalScoreStats.par5Stats.getAvgScores(),
        // })
        this.avgScore.push({
            name: 'Birdies',
            value: Math.round(finalScoreStats.getShotsBirdiesPercent()),
        })
        this.avgScore.push({
            name: 'Pars',
            value: Math.round(finalScoreStats.getShotsParsPercent()),
        })
        this.avgScore.push({
            name: 'Bogeys',
            value: Math.round(finalScoreStats.getShotsBogeysPercent()),
        })
        this.avgScore.push({
            name: 'D. Bogeys',
            value: Math.round(finalScoreStats.getShotsDoubleBogeysPercent()),
        })

        // this.avgScore['par3Avg'] = finalScoreStats.par3Stats.getAvgScores();
        // this.avgScore['par4Avg'] = finalScoreStats.par4Stats.getAvgScores();
        // this.avgScore['par5Avg'] = finalScoreStats.par5Stats.getAvgScores();

        // this.avgScore['shotsBirdiesPercent'] =
        //     finalScoreStats.getShotsBirdiesPercent();
        // this.avgScore['shotsBogeysPercent'] =
        //     finalScoreStats.getShotsBogeysPercent();
        // this.avgScore['shotsThreeOrHigherPercent'] =
        //     finalScoreStats.getShotsThreeOrHigherPercent();
        // this.avgScore['shotsParsPercent'] =
        //     finalScoreStats.getShotsParsPercent();
        // this.avgScore['shotsDoubleBogeysPercent'] =
        //     finalScoreStats.getShotsDoubleBogeysPercent();

        this.chartavgScore1.push(
            Math.round(finalScoreStats.getShotsBirdiesPercent())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.getShotsParsPercent())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.getShotsBogeysPercent())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.getShotsDoubleBogeysPercent())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.getShotsThreeOrHigherPercent())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.par3Stats.getAvgScores())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.par4Stats.getAvgScores())
        );
        this.chartavgScore1.push(
            Math.floor(finalScoreStats.par5Stats.getAvgScores())
        );

        this._series['0'] = [
            {
                data: this.chartavgScore1,
                name: 'Average',
                type: 'line',
            },
            {
                data: this.chartavgScore1,
                name: 'Average',
                type: 'column',
            },
        ];
        //console.log(this._series);

        if (finalScoreStats['grossTotal'] != 0) {
            this.pieChartData1 = [
                General.precisionRound(this.avgScore['par3Avg'], 2),
                General.precisionRound(this.avgScore['par4Avg'], 2),
                General.precisionRound(this.avgScore['par5Avg'], 2),
            ];
        } else {
            this.pieChartData1 = [0.01, 0.01, 0.01];
        }

        this.chart();

        this.round1Stats = true;
    }

    copyLink(): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.joiningCode).then(() => {
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
            });
        }
    }
    chart() {
        this.chartGithubIssues = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'line',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
            },
            colors: ['#155e46', '#10b981',
            ],
            dataLabels: {
                enabled: true,
                enabledOnSeries: [0],
                background: {
                    borderWidth: 0,
                },
            },
            grid: {
                borderColor: 'var(--fuse-border)',
            },
            labels: this.barChartLabels,
            legend: {
                show: false,
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            series: this._series,
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.75,
                    } as any,
                },
            },
            stroke: {
                width: [3, 0],
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
            },
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    color: 'var(--fuse-border)',
                },
                labels: {
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
                tooltip: {
                    enabled: false,
                },
            },
            yaxis: {
                labels: {
                    offsetX: -16,
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };
    }

    viewMarshalList() {
        try {
            this.logger.log('Admin click on marshals btn', "info");
            const dialogRef = this.dialog.open(DialogMarshalComponent, {
                width: '700px',
                data: { marshals: this.fullTournament.MarshalQL },
            });

            dialogRef.afterClosed().subscribe((result) => {
                ////console.log(result);
                if (result) {
                    ////console.log(result.player);
                } else {
                    ////console.log("cancel delete action");
                }
            });
        } catch (error) {
            this.logger.log('Getting Marshals Data Failed', "error", error.toString());
        }
    }

    // async closeRound(round: number) {

    //   const dialogRef = this.dialog.open(DialogCloseRoundComponent, {
    //     width: '500px',
    //     data: { round: round }
    //   });

    //   dialogRef.afterClosed().subscribe(result => {
    //     let getResult: any = result;
    //     if(getResult) {

    //       //console.log(getResult);

    //       let cutOffCriteria: any = {
    //         round: round,
    //         copyFlights: true,
    //         score: getResult.score,
    //         type: getResult.type,
    //         order: getResult.order
    //       }
    //       //console.log(cutOffCriteria);

    //       let result = this.facadeService.closeActiveRound(this.tournamentID, round, cutOffCriteria);
    //       ////console.log(result);
    //       this.activeRound = round;
    //       this.selected = round

    //       this.closeCurrentRound();
    //     }
    //     else {
    //       ////console.log("cancel delete action");
    //     }
    //   });

    // }
    calculateDiff(startDate, endDate) {
        let days = Math.floor(
            (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24
        );
        return days;
    }

    async closeRound() {
        try {
            this.logger.log('Admin Click on Close Round Tournament btn', "info", this.activeRound.toString());
            if (this.activeRound == this.noOfROund) {
                this.logger.log('Close Round Dialog Box Open', "info", this.noOfROund.toString());
                const dialogRef = this.dialog.open(DialogOverviewComponent, {
                    width: '350px',
                    data: 'Do you want to close the tournament?',
                });

                dialogRef.afterClosed().subscribe(async (result) => {
                    if (result) {
                        const resultString = JSON.stringify(result);
                        this.logger.log('Result from Close Round Dialog Box', "info", resultString);
                        await this.facadeService.closeActiveRound(
                            this.tournamentID,
                            this.activeRound + 1,
                            this.fullTournament.cutOffCriteria, this.activeRound
                        );
                        window.location.reload();
                    } else {
                        this.logger.log('Close Round Dialog Box Close Without Save', "info");
                        ////console.log("cancel delete action");
                    }
                });
            } else {
                this.logger.log('Close Round Dialog Box Open', "info", this.noOfROund.toString());
                let allowCat: boolean = false;
                this.activeTournamentMembers = [];
                let flights = this.dataFullTournament['TournamentQL'][0].FlightsQL;
                let startDate =
                    this.dataFullTournament['TournamentQL'][0].startDate;
                startDate = new Date(startDate);
                startDate.setDate(startDate.getDate() + this.activeRound);
                //console.log(startDate);

                let newstartDate = startDate.getDate();

                //console.log(newstartDate);
                if (this.categories.length > 0) {
                    for (let newObj of this.categories) {
                        let flightSettings: any = newObj.flightSettings;

                        if (
                            Object.prototype.toString
                                .call(flightSettings)
                                .indexOf('Array') > -1 &&
                            flightSettings.length > 0
                        ) {
                            for (let obj of flightSettings) {
                                // let chngDate = obj.dates.replaceAll('-', '').toString();
                                // let newDate =
                                //     chngDate.substring(4, 8) +
                                //     '-' +
                                //     chngDate.substring(2, 4) +
                                //     '-' +
                                //     +chngDate.substring(0, 2);
                                // //console.log(newDate);

                                let flightDate = new Date(obj.dates).getDate();
                                //console.log(flightDate);
                                if (flightDate == newstartDate) {
                                    allowCat = true;
                                    newObj['allowCat'] = true;
                                    break;
                                }

                                ////console.log(this.calculateDiff(newstartDate,flightDate));
                            }
                            if (!allowCat) {
                                newObj['allowCat'] = false;
                            }
                            for (let obj of flights) {
                                if (obj.flightRound == this.activeRound) {
                                    let check = obj.MembersQL.filter((a) => {
                                        return (
                                            a.PlayerQL.playerCategory == newObj.category
                                        );
                                    });
                                    if (check.length > 0) {
                                        newObj['cut'] = true;
                                        check = [];
                                        break;
                                    } else {
                                        newObj['cut'] = false;
                                    }
                                }
                            }
                        } else if (
                            Object.prototype.toString
                                .call(flightSettings)
                                .indexOf('Object') > -1
                        ) {
                            for (let obj of flightSettings['playingDate']) {
                                let chngDate = obj.dates.replaceAll('-', '').toString();
                                let newDate =
                                    chngDate.substring(4, 8) +
                                    '-' +
                                    chngDate.substring(2, 4) +
                                    '-' +
                                    +chngDate.substring(0, 2);

                                let flightDate = new Date(newDate).getDate();
                                if (Number.isNaN(flightDate)) {
                                    flightDate = new Date(obj.dates).getDate();
                                }
                                //console.log(flightDate);
                                if (flightDate == newstartDate) {
                                    allowCat = true;
                                    newObj['allowCat'] = true;
                                    break;
                                }
                                ////console.log(this.calculateDiff(newstartDate,flightDate));
                            }
                            if (!allowCat) {
                                newObj['allowCat'] = false;
                            }
                            for (let obj of flights) {
                                if (obj.flightRound == this.activeRound) {
                                    let check = obj.MembersQL.filter((a) => {
                                        return (
                                            a.PlayerQL.playerCategory == newObj.category
                                        );
                                    });
                                    if (check.length > 0) {
                                        newObj['cut'] = true;
                                        check = [];
                                        break;
                                    } else {
                                        newObj['cut'] = false;
                                    }
                                }
                            }
                        } else {
                            for (let obj of flights) {
                                if (obj.flightRound == this.activeRound) {
                                    let check = obj.MembersQL.filter((a) => {
                                        return (
                                            a.PlayerQL.playerCategory == newObj.category
                                        );
                                    });
                                    if (check.length > 0) {
                                        newObj['cut'] = true;
                                        check = [];
                                        break;
                                    } else {
                                        newObj['cut'] = false;
                                    }
                                }
                            }
                            newObj['allowCat'] = true;
                        }
                    }
                }
                const dialogRef = this.dialog.open(DialogCloseRoundComponent, {
                    width: '800px',
                    data: {
                        round: this.activeRound + 1,
                        categories: this.categories,
                        tournament: this.tournamentID,
                        startDate:
                            this.dataFullTournament.TournamentQL[0].startDate,
                    },
                });
                dialogRef.afterClosed().subscribe(async (result) => {

                    let getResult: any = result;
                    var jsons = new Array();
                    let flag = true;
                    jsons = [];
                    //console.log(getResult);
                    if (getResult && getResult.category && this.matchFormat == matchFormat.STROKE_PLAY) {
                        //console.log(getResult.category);
                        for (let cats in getResult.category) {
                            if (getResult.category[cats].copyFlights == false) {
                                flag = false;
                            }

                            //console.log(getResult.category[cats]);
                            let copyflights: any = [];
                            if (
                                this.fullTournament.cutOffCriteria != null &&
                                Object.keys(
                                    this.fullTournament.cutOffCriteria.cutOff[0]
                                ).length > 0
                            ) {
                                for (let cut of this.fullTournament.cutOffCriteria[
                                    'cutOff'
                                ]) {
                                    if (
                                        cut.name == getResult.category[cats].name &&
                                        getResult.category[cats].cuttScore == ''
                                    ) {
                                        copyflights.push(cut);
                                    }
                                }
                                //console.log(copyflights);
                            }

                            let cutOffCriteria: any = {
                                round:
                                    copyflights.length > 0
                                        ? copyflights[0].round
                                        : this.activeRound,
                                //copyFlights: (getResult.category[cats].copy == "1"),
                                copymembers:
                                    copyflights.length > 0
                                        ? copyflights[0].score
                                        : null,
                                copyflights: getResult.category[cats].copyFlights,
                                name: getResult.category[cats].name,
                                players: getResult.category[cats].players,
                                time: getResult.category[cats].time,
                                interval: getResult.category[cats].interval,
                                tee: getResult.category[cats].tee,
                                score:
                                    copyflights.length > 0
                                        ? copyflights[0].score
                                        : flag == false
                                            ? getResult.category[cats].cuttScore
                                            : 1000,
                                type: getResult.category[cats].type,
                                order: getResult.category[cats].order,
                                playing: getResult.category[cats].playing,
                                lastRoundPlayed:
                                    getResult.category[cats].lastRoundPlayed,
                            };
                            //console.log(cutOffCriteria);
                            await this.closeCurrentRound(
                                cutOffCriteria,
                                cutOffCriteria.name,
                                cutOffCriteria.score,
                                cutOffCriteria.copymembers
                            );
                            // this.dataFullTournament =
                            //     await this.facadeService.tournamentDashBoard(
                            //         this.tournamentID
                            //     );
                            jsons.push(cutOffCriteria);
                        }
                        let jObject = { cutOff: jsons };
                        //console.log(jObject);
                        let a = JSON.stringify(jObject);
                        var src = a.replace(/\\/g, '');
                        //console.log(src);
                        const resultString = JSON.stringify(result);
                        this.logger.log('Result from Close Round Dialog Box', "info", resultString);
                        let response = await this.facadeService.closeActiveRound(
                            this.tournamentID,
                            this.activeRound + 1,
                            jObject,
                            this.activeRound
                        );
                        if (response) {
                            window.location.reload();
                        }
                    } else {
                        if (getResult.category[0].playing == true || getResult.category[0].playing == 'true') {
                            for (let cats in getResult.category) {
                                try {
                                    const res = await this.saveCategoryFlightsForMatchPlay(this.fullTournament.FlightsQL.filter(a => a.flightRound == this.activeRound));

                                    if (res) {
                                        const jObject = { cutOff: jsons };

                                        const response = await this.facadeService.closeActiveRound(
                                            this.tournamentID,
                                            this.activeRound + 1,
                                            jObject,
                                            this.activeRound
                                        );

                                        if (response) {
                                            window.location.reload();
                                        }
                                    }

                                } catch (error) {
                                    console.error("Error in closing round:", error);
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            this.logger.log('Close Tournament Round Failed', "error", error.toString());
        }
    }

    showCourseDetails() {
        this.dialog.open(DialogCourseDetailsComponent, {
            data: {
                course: this.dataFullTournament['TournamentQL'][0]['CourseQL']
                    .id,
            },
        });
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }
    async closeCurrentRound(
        cutOffCriteria: any,
        categoryName: string,
        categoryScore: number,
        copymembers: any
    ): Promise<void> {
        try {
            this.logger.log(
                'Cut calculation after Close Round.',
                'info',
                JSON.stringify(cutOffCriteria)
            );

            let nextRoundPlayers: any[] = [];

            const objLeader: Leader = new Leader(
                this.fullTournament,
                this.activeRound,
                this.fullTournament,
                categoryName
            );

            let result = objLeader.parseSubscriptionResponse();

            if (!cutOffCriteria.copyflights) {

                if (!result || result.length === 0) {
                    result = this.dataFullTournament.TournamentQL[0].members.filter(
                        (a) => a.PlayerQL.playerCategory === categoryName
                    ).map(m => m.PlayerQL);
                }
                else if (cutOffCriteria.type === LeaderType.GROSS) {

                    result = result.filter(a =>
                        a.AllGrossUnder <= (categoryScore ?? a.AllGrossUnder) &&
                        a['holes' + this.activeRound] === this.noOfHolesInCourse
                    );

                    nextRoundPlayers =
                        cutOffCriteria.order === 'asc'
                            ? result.sort(this.ComparatorAllGross)
                            : result.sort(this.ComparatorAllGrossDesc);

                }
                else if (cutOffCriteria.type === LeaderType.NEW) {

                    const members =
                        this.dataFullTournament.TournamentQL[0].members.filter(
                            a => a.PlayerQL.playerCategory === categoryName
                        );

                    this.makePlayerFlights(members.map(m => m.PlayerQL), cutOffCriteria.players);
                    await this.saveCategoryFlights(cutOffCriteria, categoryName);
                    return;

                }
                else {

                    result = result.filter(a =>
                        a.AllNetUnder <= (categoryScore ?? a.AllNetUnder) &&
                        a['holes' + this.activeRound] === this.noOfHolesInCourse
                    );

                    nextRoundPlayers =
                        cutOffCriteria.order === 'asc'
                            ? result.sort(this.ComparatorAllNet)
                            : result.sort(this.ComparatorAllNetDesc);
                }

                if (copymembers == null) {
                    this.makePlayerFlights(nextRoundPlayers, cutOffCriteria.players);
                    await this.saveCategoryFlights(cutOffCriteria, categoryName);
                }

            } else {
                nextRoundPlayers = result;
                this.makePlayerFlights(nextRoundPlayers, cutOffCriteria.players);
                await this.saveCategoryFlights(cutOffCriteria, categoryName);
            }

        } catch (error) {
            this.logger.log(
                'Cut calculation Failed after Close Round.',
                'error',
                JSON.stringify(error)
            );
            throw error; // 🔥 important: propagate failure
        }
    }


    async makePlayerFlights(nextRoundPlayers: any, playersPerFlight: number) {
        try {


            let cnter = 0;
            let outer = 0;
            this.selectedMembers = [];

            ////console.log(this.selectedMembers);
            for (var index in nextRoundPlayers) {
                ////console.log(outer + "<--->" + cnter);

                if (cnter == 0) this.selectedMembers[outer] = [];

                this.selectedMembers[outer][cnter] = nextRoundPlayers[index];

                if (cnter == playersPerFlight - 1) {
                    cnter = 0;
                    outer++;
                } else {
                    cnter++;
                }
            }
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    async saveCategoryFlights(criteria: any, categoryName: any) {
        try {
            let tournamentFlights: Flight[] = [];
            //let fcnter = 0;
            ////console.log(criteria);
            this.changer++;

            let tournamentFlightMembers: FlightMembers[];
            let teeBox: number;
            let teeTime: string = criteria.time;
            for (var index in this.selectedMembers) {
                tournamentFlightMembers = [];
                console.log(this.selectedMembers[index]);

                for (var index2 in this.selectedMembers[index]) {
                    if (Number.isInteger(Number(index2))) {
                        // //console.log(this.selectedMembers[index][index2]["playerCategory"]);
                        // //console.log(this.selectedMembers[index][index2].playerCategory);
                        ////console.log(categoryName);
                        // //console.log(this.selectedMembers[index][index2]["name"]);

                        let roundTeeId: any = General.getPlayersTe(categoryName);
                        // //console.log(roundTeeId.id);
                        let FM: any = {
                            playerId: this.selectedMembers[index][index2]['id']
                                ? this.selectedMembers[index][index2]['id']
                                : this.selectedMembers[index][index2]['playerId'],
                            attendance: false,
                            playingTee: roundTeeId.result,
                            tee_id: roundTeeId.id,
                        };
                        tournamentFlightMembers.push(FM);
                    }
                }
                if (tournamentFlightMembers.length > 0) {
                    ////console.log(tournamentFlightMembers);
                    // //console.log('Before Running' + this.runningFlights);
                    this.runningFlights++;
                    this.teetime++;
                    //let startingHole = parseFloat((<HTMLInputElement>document.getElementById("flight_" + index + "_hole")).value);
                    //let startTime : string = (<HTMLInputElement>document.getElementById("flight_" + index + "_time")).value;
                    let currentDate = new Date();
                    currentDate.setDate(currentDate.getDate() + 1);
                    teeBox = this.getNextTeeBox(criteria.tee, this.teetime);
                    teeTime = this.getNextFlightTime(
                        teeTime,
                        criteria.interval,
                        criteria.tee,
                        this.teetime,
                        teeBox
                    );
                    // //console.log(teeBox);
                    // //console.log(teeTime);
                    // //console.log(General.parseToDate(currentDate.toDateString()));
                    let roundTeeId: any = General.getPlayersTe(categoryName);
                    //console.log(roundTeeId.id);
                    let selectedCourse;
                    console.log(this.tournamentCourses);
                    if (this.tournamentCourses.length > 0) {
                        selectedCourse = this.tournamentCourses.filter((cour) => { return cour.round == this.activeRound + 1 })
                    }

                    let flight: any = {
                        id: UniqueIdGenerator.generate(),
                        tournamentId: this.tournamentID,
                        courseId: this.noOfRounds > 1 && selectedCourse?.[0] ? selectedCourse?.[0].courseId : this.fullTournament.courseId,
                        adminId: this.loggedInUser.id,
                        courseHoleSets: this.noOfRounds > 1 && selectedCourse?.[0] ? selectedCourse?.[0].courseHoleSets : this.fullTournament.courseHoleSets,
                        flightNo: this.runningFlights,
                        flightRound: this.activeRound + 1,
                        startingHole: teeBox,
                        tee: roundTeeId.result,
                        tee_id: roundTeeId.id,
                        category: categoryName,
                        date: General.parseToDate(currentDate.toDateString()),
                        time: teeTime,
                        ended: false,
                        members: {
                            data: tournamentFlightMembers,
                        },
                    };
                    ////console.log(flight);
                    tournamentFlights.push(flight);
                    //break;
                    ////console.log('After loop' + this.runningFlights);
                }
            }
            this.teetime = 0;
            await this.facadeService.createNextRoundFlights(tournamentFlights);
            ////console.log(tournamentFlights);
            // //console.log('After Function' + this.runningFlights);
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }
    async saveCategoryFlightsForMatchPlay(flights: any[]) {
        try {
            let tournamentFlights: Flight[] = [];
            let tournamentPairs: any[];
            let tournamentTeamOpponents: any[] = [];
            let createPairs: boolean = false;
            //let fcnter = 0;
            ////console.log(criteria);
            this.changer++;
            // let arr = this.fullTournament.pointsFormats;
            // arr.forEach((control, index) => {
            //     if (index == this.activeRound + 1 && (control.format == 'GREENSOME' || control.format == 'FOURSOME')) {
            //         createPairs = true;
            //     }
            // });

            const roundKey = `pointsFormat${this.activeRound + 1}`;

            const format = this.fullTournament.pointsFormats?.[roundKey];

            console.log("Format:", format);
            if (format == matchFormat.GREENSOME || format == matchFormat.FOURSOME) {
                createPairs = true;
            }
            let tournamentFlightMembers: FlightMembers[];
            let teeBox: number;
            let teeTime: string = "08:00:00+00";
            for (var index in flights) {
                tournamentPairs = [];
                tournamentFlightMembers = [];
                for (var index2 in flights[index]['MembersQL']) {

                    // const nextMember = flights[index]['MembersQL'][index2 + 1]['playerId'];
                    let FM: any = {
                        playerId: flights[index]['MembersQL'][index2]['playerId'],
                        attendance: false,
                        playingTee: 'AMATEURS',
                        tee_id: 1,
                        // PlayerQL:flights[index]['MembersQL'][index2]['PlayerQL'],
                    };

                    const existsInPairs = tournamentPairs.some(p =>
                        p.member1Id === FM.playerId || p.member2Id === FM.playerId
                    );

                    if (this.showMatchPlay && this.check(tournamentTeamOpponents, FM.playerId)) {

                        let team1Id = this.getTeamId(FM.playerId);
                        let { oppoentId, opponentTeamId } = this.findOpponentFlightWise(team1Id, tournamentTeamOpponents, flights[index]['MembersQL'])
                        if (team1Id != opponentTeamId) {
                            let teamOpponent = {
                                id: UniqueIdGenerator.generate(),
                                team1Id: team1Id,
                                team2Id: opponentTeamId,
                                team1MemberId: FM.playerId,
                                team2MemberId: oppoentId,
                                tournamentId: this.tournamentID,
                            }
                            tournamentTeamOpponents.push(teamOpponent);
                        }
                    }

                    if (createPairs && !existsInPairs) {
                        let nextMember = this.getTeamMemberInFlight(flights[index]['MembersQL'], FM.playerId)
                        if (nextMember) {
                            let pair = {
                                id: UniqueIdGenerator.generate(),
                                tournamentId: this.tournamentID,
                                pairName: flights[index]['MembersQL'][index2].PlayerQL.firstName + '/' + nextMember.PlayerQL.firstName,
                                member1Id: FM.playerId,
                                member2Id: nextMember.playerId,
                            };
                            tournamentPairs.push(pair);
                        } else {
                            FM = null;
                        }
                    }
                    if (FM)
                        tournamentFlightMembers.push(FM);
                }
                if (tournamentFlightMembers.length > 0) {

                    this.runningFlights++;
                    this.teetime++;
                    let currentDate = new Date();
                    currentDate.setDate(currentDate.getDate() + 1);
                    let flight: any = {
                        id: UniqueIdGenerator.generate(),
                        tournamentId: this.tournamentID,
                        courseId: this.fullTournament.courseId,
                        adminId: this.loggedInUser.id,
                        courseHoleSets: 0,
                        flightNo: this.runningFlights,
                        flightRound: this.activeRound + 1,
                        startingHole: teeBox,
                        tee: 'AMATEURS',
                        tee_id: 1,
                        category: 'AMATEURS',
                        date: General.parseToDate(currentDate.toDateString()),
                        time: teeTime,
                        ended: false,
                        members: {
                            data: tournamentFlightMembers,
                        },
                        team: {
                            data: tournamentTeamOpponents,
                        },
                        pairs: {
                            data: tournamentPairs,
                        },
                    };
                    ////console.log(flight);
                    tournamentFlights.push(flight);
                    //break;
                    ////console.log('After loop' + this.runningFlights);
                }
                tournamentTeamOpponents = [];
            }
            this.teetime = 0;
            return await this.facadeService.createNextRoundFlights(tournamentFlights);
            ////console.log(tournamentFlights);
            // //console.log('After Function' + this.runningFlights);
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());

        }
    }
    downloadResultSheetGross() {
        let doc = new jsPDF();
        let col = General.createClmGross(this.noOfRounds);

        doc.setFontSize(22);
        doc.setFillColor(0, 0, 0);
        doc.rect(10, 5, 190, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(this.fullTournament.title, 13, 12, { align: 'justify' });
        doc.text('\nScore Sheet', 13, 12, { align: 'justify' });

        this.tournamentCategories.forEach((element) => {
            this.getSummaryData(element.category);
            let rows = [];
            //this.getSummaryData('Result');
            // doc.text("W.E.F:", 143, 15);
            // doc.text(
            // this.datepipe.transform(this.currentDate.toString(), "MMM d, y"),
            // 160,
            // 15
            // );
            doc.setFontSize(18);
            doc.setTextColor(99, 29, 5);
            //  doc.text('\n' + element.category, 13, 25);
            doc.setFontSize(15);
            let count = 0;
            let grossAllArray: any[] = [];

            for (let leader in this.allMatchResults) {
                grossAllArray.push(this.allMatchResults[leader]);
            }
            grossAllArray.sort(this.ComparatorAllGross);
            this.sortAllGrossLeadersTie(grossAllArray);
            //console.log(grossAllArray);

            for (let leader in grossAllArray) {
                count++;
                if (this.noOfRounds > 1) {
                    let temp = [
                        grossAllArray[leader].position,
                        grossAllArray[leader].name,
                        grossAllArray[leader].handicap,
                        grossAllArray[leader].clubName,
                        grossAllArray[leader].TotalGross4 != '' &&
                            grossAllArray[leader].TotalGross4 != undefined
                            ? grossAllArray[leader].TotalGross4
                            : '-',

                        grossAllArray[leader].TotalGross3 != '' &&
                            grossAllArray[leader].TotalGross3 != undefined
                            ? grossAllArray[leader].TotalGross3
                            : '-',

                        grossAllArray[leader].TotalGross2 != '' &&
                            grossAllArray[leader].TotalGross2 != undefined
                            ? grossAllArray[leader].TotalGross2
                            : '-',

                        grossAllArray[leader].TotalGross1 != '' &&
                            grossAllArray[leader].TotalGross1 != undefined
                            ? grossAllArray[leader].TotalGross1
                            : '-',

                        grossAllArray[leader].AllGrossPoints != '' &&
                            grossAllArray[leader].AllGrossPoints != undefined
                            ? grossAllArray[leader].AllGrossPoints
                            : '-',
                    ];
                    rows.push(temp);
                } else {
                    let temp = [
                        grossAllArray[leader].position,
                        grossAllArray[leader].name,
                        grossAllArray[leader].handicap,
                        grossAllArray[leader].clubName,
                        grossAllArray[leader].TotalGross1 != '' &&
                            grossAllArray[leader].TotalGross1 != undefined
                            ? grossAllArray[leader].TotalGross1
                            : '-',

                        grossAllArray[leader].TotalGrossUnder1 != '' &&
                            grossAllArray[leader].TotalGrossUnder1 != undefined
                            ? grossAllArray[leader].TotalGrossUnder1
                            : '-',

                    ];
                    rows.push(temp);
                }

            }

            // From HTML
            // //console.log(rows);
            // this.sortAllGrossLeadersTie(rows);
            // //console.log(rows);
            (doc as any).autoTable(col, rows, { startY: 35, theme: 'grid' });
            doc.addPage();

            // Open PDF document in new tab
        });

        doc.output('dataurlnewwindow');
        // Download PDF document
        //doc.save('flights.pdf');
    }
    downloadResultSheetNet() {
        let doc = new jsPDF();
        let col = General.createClmNet(this.noOfRounds);

        doc.setFontSize(22);
        doc.setFillColor(0, 0, 0);
        doc.rect(10, 5, 190, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(this.fullTournament.title, 13, 12, { align: 'justify' });
        doc.text('\nScore Sheet', 13, 12, { align: 'justify' });

        this.tournamentCategories.forEach((element) => {
            this.getSummaryData(element.category);
            let rows = [];
            //this.getSummaryData('Result');
            // doc.text("W.E.F:", 143, 15);
            // doc.text(
            // this.datepipe.transform(this.currentDate.toString(), "MMM d, y"),
            // 160,
            // 15
            // );
            doc.setFontSize(18);
            doc.setTextColor(99, 29, 5);
            //   doc.text('\n' + element.category, 13, 25);
            doc.setFontSize(15);
            let count = 0;
            let grossAllArray: any[] = [];

            for (let leader in this.allMatchResults) {
                grossAllArray.push(this.allMatchResults[leader]);
            }
            grossAllArray.sort(this.ComparatorAllNet);
            this.sortAllNetLeadersTie(grossAllArray);
            //console.log(grossAllArray);
            for (let leader in grossAllArray) {
                count++;
                if (this.noOfRounds > 1) {
                    let temp = [
                        grossAllArray[leader].position,
                        grossAllArray[leader].name,
                        grossAllArray[leader].handicap,
                        grossAllArray[leader].clubName,
                        grossAllArray[leader].TotalNet4 != '' &&
                            grossAllArray[leader].TotalNet4 != undefined
                            ? grossAllArray[leader].TotalNet4
                            : '-',

                        grossAllArray[leader].TotalNet3 != '' &&
                            grossAllArray[leader].TotalNet3 != undefined
                            ? grossAllArray[leader].TotalNet3
                            : '-',

                        grossAllArray[leader].TotalNet2 != '' &&
                            grossAllArray[leader].TotalNet2 != undefined
                            ? grossAllArray[leader].TotalNet2
                            : '-',

                        grossAllArray[leader].TotalNet1 != '' &&
                            grossAllArray[leader].TotalNet1 != undefined
                            ? grossAllArray[leader].TotalNet1
                            : '-',

                        grossAllArray[leader].AllNetPoints != '' &&
                            grossAllArray[leader].AllNetPoints != undefined
                            ? grossAllArray[leader].AllNetPoints
                            : '-',
                    ];
                    rows.push(temp);
                } else {
                    let temp = [
                        grossAllArray[leader].position,
                        grossAllArray[leader].name,
                        grossAllArray[leader].handicap,
                        grossAllArray[leader].clubName,
                        grossAllArray[leader].TotalNet1 != '' &&
                            grossAllArray[leader].TotalNet1 != undefined
                            ? grossAllArray[leader].TotalNet1
                            : '-',

                        grossAllArray[leader].TotalNetUnder1 != '' &&
                            grossAllArray[leader].TotalNetUnder1 != undefined
                            ? grossAllArray[leader].TotalNetUnder1
                            : '-',

                    ];
                    rows.push(temp);
                }

            }

            // From HTML
            //console.log(rows);
            // this.sortAllGrossLeadersTie(rows);
            // //console.log(rows);
            (doc as any).autoTable(col, rows, { startY: 35, theme: 'grid' });
            doc.addPage();

            // Open PDF document in new tab
        });

        doc.output('dataurlnewwindow');
        // Download PDF document
        //doc.save('flights.pdf');
    }
    populateActiveTournamentMembers() {
        for (let c of this.categories) {
            let nextRoundPlayers: any[] = [];
            let objLeader: Leader = new Leader(
                this.fullTournament,
                this.activeRound,
                this.fullTournament,
                c.category
            );

            let tournamentLeaders = objLeader.parseSubscriptionResponse();

            //console.log(tournamentLeaders);

            if (tournamentLeaders) {
                tournamentLeaders = tournamentLeaders.filter((a) => {
                    return (
                        a['holes' + this.activeRound] == this.noOfHolesInCourse
                    );
                });

                nextRoundPlayers = tournamentLeaders.sort(
                    this.ComparatorAllGrossDesc
                );

                for (let p of nextRoundPlayers) {
                    let tm: TournamentMember = {
                        tournamentId: this.tournamentID,
                        playerId: p.playerId,
                        status: true,
                    };
                    this.activeTournamentMembers.push(tm);
                }
            }

            ////console.log(this.activeTournamentMembers);

            this.markActiveTournamentMembers(this.activeTournamentMembers);
        }
    }

    markActiveTournamentMembers(tournamentMembers: TournamentMember[]) {
        this.facadeService.markActiveTournamentMembers(
            this.tournamentID,
            tournamentMembers
        );
    }

    getNextTeeBox(startingHoleOption: string, flight: number): number {
        if (startingHoleOption == '1_10') {
            //console.log('In Function' + flight);

            if (flight !== 1 && flight % 2 === 0) return 10;
            else return 1;
        } else if (startingHoleOption == '10') {
            return 10;
        } else {
            return 1;
        }
    }

    getNextFlightTime(
        time: string,
        interval: number,
        startingHole: string,
        flight: number,
        teeBox: number
    ) {
        let flightTime: string = '00:00';

        try {
            let dateNow: Date = new Date(Constants.DEFAULT_DATE + ' ' + time);

            if (startingHole == '1_10') {
                if (teeBox === 1 && flight !== 1)
                    dateNow.setMinutes(dateNow.getMinutes() + interval);
            } else if (startingHole == '1') {
                if (flight % 2 == 0)
                    dateNow.setMinutes(dateNow.getMinutes() + interval);
                else {
                    dateNow.setMinutes(dateNow.getMinutes());
                }
            } else if (startingHole == '10') {
                if (flight % 2 == 0)
                    dateNow.setMinutes(dateNow.getMinutes() + interval);
                else {
                    dateNow.setMinutes(dateNow.getMinutes());
                }
            }

            //console.log(dateNow);

            let h = dateNow.getHours();
            let m = dateNow.getMinutes();

            flightTime = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
        } catch {
            flightTime = '00:00';
        }

        return flightTime;
    }

    undoRound() {
        try {

            // this.logger.log('Admin click on undo round btn', "info", this.activeRound.toString());
            // this.logger.log('Round undo Dialog Box Open', "info", this.activeRound.toString());
            const dialogRef = this.dialog.open(DialogOverviewComponent, {
                width: '350px',
                data: 'Do you want to undo current round?',
            });

            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    // this.logger.log('Round undo sucessfully', "info", this.activeRound.toString());
                    let jObject = null;
                    //console.log('====================================');
                    //console.log(jObject);
                    //console.log('====================================');
                    await this.facadeService.UndoTournamentRound(
                        this.tournamentID,
                        this.activeRound,
                        this.activeRound - 1,
                        jObject
                    );

                    window.location.reload();
                } else {
                    ////console.log("cancel delete action");
                }
            });
        } catch (error) {
            this.logger.log('Round undo Failed', "error", error.toString());
        }
    }

    redirectToLeaderboard() {
        //this.router.navigate(['/leaderboard/' + this.tournamentID]);

        let tournament: string = '';

        if (this.fullTournament.prefix) tournament = this.fullTournament.prefix;
        else tournament = this.tournamentID;

        let url = this.router.createUrlTree(['/leaderboard', tournament]);
        window.open(url.toString(), '_blank');
    }
    redirectToScores() {
        this.router.navigate(['/matchplay/' + this.tournamentID]);
    }
    viewsignupform() {
        let url = this.router.createUrlTree([
            '/signUpForm/' + this.tournamentID,
        ]);
        window.open(url.toString(), '_blank');
    }

    redirectToflightManagement() {
        this.router.navigate(['/tournaments/manage/' + this.tournamentID]);
    }
    redirectToAttendance() {
        this.router.navigate(['/tournaments/attendance/' + this.tournamentID]);
    }
    async calculateHandicap() {
        //console.log(player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to calculate the handicap for this Tournament?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                let result = this.facadeService.calculateHandicap(
                    this.tournamentID
                );
                if (result) {
                    this.snackBar.open('Handicap has been calculated.', 'x', {
                        duration: 3000,
                        panelClass: ['orange-snackbar'],
                    });
                }
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    redirectToTournamentSetup() {
        this.router.navigate(['/tournaments/add/' + this.tournamentID]);
    }

    addTournamentPlayers() {
        this.router.navigate(['/tournaments/players/' + this.tournamentID]);
    }
    copy() {
        let selBox = document.createElement('textarea');

        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';

        selBox.value = this.leaderboardUrl;

        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();

        document.execCommand('copy');
        document.body.removeChild(selBox);
    }
    pop(s) {
        //console.log(s.title);

        const dialogRef = this.dialog.open(DialogPlayingCategoryComponent, {
            data: {
                cat: s,
                tournament: this.tournamentID,
            },
        });
    }
    viewProfile(s) {
        //console.log(s);

        this.router.navigate(['/players/view/' + s.id]);
    }

    ComparatorAllGross(a, b) {
        if (a['AllGrossUnder'] < b['AllGrossUnder']) return -1;
        if (a['AllGrossUnder'] > b['AllGrossUnder']) return 1;
        return 0;
    }
    ComparatorAllGrossSheet(a, b) {
        if (a.PlayingRound > b.PlayingRound) {
            return -1;
        }
        if (a.PlayingRound < b.PlayingRound) {
            return 1;
        }
        if (a.playerStatus < b.playerStatus) {
            return -1;
        }
        if (a.playerStatus > b.playerStatus) {
            return 1;
        }
        if (a['AllGrossUnder'] > b['AllGrossUnder']) return 1;
        if (a['AllGrossUnder'] < b['AllGrossUnder']) return -1;
        return 0;
    }
    ComparatorHandicap(a, b) {
        if (a.PlayerQL['handicap'] < b.PlayerQL['handicap']) return -1;
        if (a.PlayerQL['handicap'] > b.PlayerQL['handicap']) return 1;
        return 0;
    }

    ComparatorPosition(a, b) {
        if (a['position'] < b['position']) return -1;
        if (a['position'] > b['position']) return 1;
        return 0;
    }

    ComparatorPositionR1(a, b) {
        if (a['underR1'] < b['underR1']) return -1;
        if (a['underR1'] > b['underR1']) return 1;
        return 0;
    }

    ComparatorPositionR2(a, b) {
        if (a['underR2'] < b['underR2']) return -1;
        if (a['underR2'] > b['underR2']) return 1;
        return 0;
    }

    ComparatorPositionR3(a, b) {
        if (a['underR3'] < b['underR3']) return -1;
        if (a['underR3'] > b['underR3']) return 1;
        return 0;
    }

    ComparatorPositionR4(a, b) {
        if (a['underR4'] < b['underR4']) return -1;
        if (a['underR4'] > b['underR4']) return 1;
        return 0;
    }

    ComparatorAllGrossDesc(a, b) {
        if (a['AllGrossUnder'] > b['AllGrossUnder']) return -1;
        if (a['AllGrossUnder'] < b['AllGrossUnder']) return 1;
        return 0;
    }

    ComparatorAllNet(a, b) {
        if (a['AllNetUnder'] < b['AllNetUnder']) return -1;
        if (a['AllNetUnder'] > b['AllNetUnder']) return 1;
        return 0;
    }

    ComparatorAllNetDesc(a, b) {
        if (a['AllNetUnder'] > b['AllNetUnder']) return -1;
        if (a['AllNetUnder'] < b['AllNetUnder']) return 1;
        return 0;
    }

    // events
    public chartClicked(e: any): void {
        // //console.log(e);
    }

    public chartHovered(e: any): void {
        // //console.log(e);
    }
    getHandicapAllocation(): string {
        let hcAllocation: string;

        if (this.dataFullTournament['TournamentQL'][0]['handicapAllocations'])
            hcAllocation =
                this.dataFullTournament['TournamentQL'][0][
                'handicapAllocations'
                ];
        else hcAllocation = handicapAllocation.AS_IS;

        return hcAllocation;
    }
    private async GrossData(category: any) {
        this.getSummaryData(category);

        //console.log(this.allMatchResults);
        let grossAllArray: any[] = [];

        for (let leader in this.allMatchResults) {
            grossAllArray.push(this.allMatchResults[leader]);
        }
        grossAllArray.sort(this.ComparatorAllGross);
        this.sortAllGrossLeadersTie(grossAllArray);

        this.dataSourceTotalGross = new MatTableDataSource(grossAllArray);
        this.dataSourceTotalGross.paginator = this.paginator;
        this.dataSourceTotalGross.sort = this.sort;
    }

    getSummaryData(category) {
        this.allMatchResults = [];
        let flights = this.dataFullTournament['TournamentQL'][0].FlightsQL;
        let handicapAllocation: string = this.getHandicapAllocation();
        for (let flightData of flights) {
            let membersQLs: any = flightData.MembersQL;

            for (let membersQL of membersQLs) {
                let playerId: String = membersQL.playerId;

                let player: Player = membersQL.PlayerQL;
                if (category !== 'All') {
                    if (player.playerCategory !== category) continue;
                }

                if (player == null) {
                    continue;
                }

                let grossTotal: number = 0;
                let netTotal: number = 0;
                let grossUnderTotal: number = 0;
                let netUnderTotal: number = 0;
                let stableFordPointsTotal: number = 0;
                let handicap: number = 0;
                let scoreHandicap: number = 0;
                let holesPlayed: number = 0;
                let flightIds: String[] = [];
                let cntr: number = 0;

                let scores: any[] = membersQL.ScoresQL;
                for (let score of scores) {
                    let objScore: Score = new Score(
                        score.playerId,
                        score.playerHandicap,
                        score.hole.index,
                        score.hole.par,
                        score.grossScore
                    );
                    let gross: number = score.grossScore;

                    if (gross <= 0) {
                        continue;
                    }

                    grossTotal += gross;
                    let currentNet: number =
                        objScore.getNetScore(handicapAllocation);
                    scores[cntr]['netScore'] = currentNet;

                    grossUnderTotal += objScore.getGrossUnder();
                    //netUnderTotal = netUnderTotal + objScore.getNetUnder(handicapAllocation);
                    stableFordPointsTotal +=
                        objScore.getStablefordPoints(handicapAllocation);
                    handicap += objScore.getPlayerHandicap(handicapAllocation);
                    scoreHandicap =
                        objScore.getPlayerHandicap(handicapAllocation);
                    holesPlayed++;

                    if (!flightIds.includes(score.flightId)) {
                        flightIds.push(score.flightId);
                    }
                    cntr++;

                    //if(player.id == "-L6192uVBlBFw3grUy9_")
                    //////console.log("player: " + player.firstName + " ->" + gross + " -> " + currentNet + " ->" + netTotal + " ->" + score.HoleIPQL.holeNo);
                }

                let playerHole18ScoreGross: any[] = [];
                let playerHole18ScoreNet: any[] = [];
                let clubName = '';
                if (player.membership.length > 0)
                    clubName = player.membership[0].club.name;

                for (
                    let i = 0;
                    i < this.fullTournament.CourseQL.noOfHoles;
                    i++
                ) {
                    let hole = scores.find((a) => {
                        return a.hole.holeNo == i + 1;
                    });

                    if (hole) {
                        playerHole18ScoreGross[i] = hole.grossScore;
                        playerHole18ScoreNet[i] = hole.netScore;
                    } else {
                        playerHole18ScoreGross[i] = 0;
                        playerHole18ScoreNet[i] = 0;
                    }
                }
                netTotal = grossTotal - scoreHandicap;
                // ////console.log(netTotal);
                netUnderTotal = grossUnderTotal - scoreHandicap;

                let name: string = player.firstName + ' ' + player.lastName;
                let picture: string = player.picture;
                if (
                    holesPlayed <= 0 ||
                    (handicap <= 0 &&
                        player.playerCategory !=
                        enumPlayerCategory.PROFESSIONALS)
                ) {
                    //handicap = player.getHandicap(handicapAllocation); // need to be discuss with zain bhai will it be the same as objScore.getPlayerHandicap
                    handicap = player.handicap;
                } else {
                    handicap = handicap / holesPlayed;
                }
                let allStatus: any = this.memberStatusesQLs;
                let playerStatus: any;

                if (allStatus) {
                    playerStatus = allStatus.find(
                        (s) => s.playerId === playerId
                    );
                }

                let extraData: string = player.extraData;
                let completed: boolean =
                    holesPlayed > 0 &&
                    holesPlayed >= this.noOfHolesInCourse * flightIds.length;

                let LeaderGross: any = {
                    position: 0,
                    tied: false,
                    courseId: flightData.courseId,
                    holeSets: flightData.courseHoleSets,
                    holeSetsInverted: flightData.courseHoleSetsInverted
                        ? flightData.courseHoleSetsInverted
                        : false,
                    playerId: playerId,
                    clubName: clubName ? General.getClubName(clubName) : '-',
                    name: name,
                    picture: picture,
                    playingRound: flightData.flightRound,
                    handicap: handicap,
                    score: grossTotal,
                    type: LeaderType.GROSS,
                    status: 0,
                    extraData: extraData,
                    under: grossUnderTotal,
                    points: stableFordPointsTotal,
                    holes: holesPlayed,
                    completed: completed,
                    holeScores: playerHole18ScoreGross,
                    holeScoreLast18: this.getLastHolesTotal(
                        18,
                        playerHole18ScoreGross
                    ),
                    holeScoreLast9: this.getLastHolesTotal(
                        9,
                        playerHole18ScoreGross
                    ),
                    holeScoreLast6: this.getLastHolesTotal(
                        6,
                        playerHole18ScoreGross
                    ),
                    holeScoreLast3: this.getLastHolesTotal(
                        3,
                        playerHole18ScoreGross
                    ),
                    holeScoreLast1: this.getLastHolesTotal(
                        1,
                        playerHole18ScoreGross
                    ),
                    playerStatus: playerStatus
                        ? playerStatus.status
                        : scores.length <= 0
                            ? "mc"
                            : "ac"
                };

                // this.grossLeaders.push(LeaderGross);
                // ////console.log('Gross:' + this.grossLeaders);

                // this.grossAllLeaders.push(LeaderGross);
                // ////console.log(this.grossAllLeaders);

                let LeaderNet: any = {
                    position: 0,
                    tied: false,
                    playerId: playerId,
                    courseId: flightData.courseId,
                    holeSets: flightData.courseHoleSets,
                    holeSetsInverted: flightData.courseHoleSetsInverted
                        ? flightData.courseHoleSetsInverted
                        : false,
                    name: name,

                    clubName: clubName ? General.getClubName(clubName) : '-',
                    picture: picture,
                    handicap: handicap,
                    score: netTotal,
                    playingRound: flightData.flightRound,
                    type: LeaderType.NET,
                    status: 0,
                    extraData: extraData,
                    under: netUnderTotal,
                    points: stableFordPointsTotal,
                    holes: holesPlayed,
                    completed: completed,
                    holeScores: playerHole18ScoreNet,
                    holeScoreLast18: this.getLastHolesTotal(
                        18,
                        playerHole18ScoreNet
                    ),
                    holeScoreLast9: this.getLastHolesTotal(
                        9,
                        playerHole18ScoreNet
                    ),
                    holeScoreLast6: this.getLastHolesTotal(
                        6,
                        playerHole18ScoreNet
                    ),
                    holeScoreLast3: this.getLastHolesTotal(
                        3,
                        playerHole18ScoreNet
                    ),
                    holeScoreLast1: this.getLastHolesTotal(
                        1,
                        playerHole18ScoreNet
                    ),
                    playerStatus: playerStatus
                        ? playerStatus.status
                        : scores.length <= 0
                            ? "mc"
                            : "ac"
                };

                // this.netLeaders.push(LeaderNet);
                // this.netAllLeaders.push(LeaderNet);
                // ////console.log(this.netAllLeaders);

                this.calculateTotal(
                    LeaderGross,
                    LeaderNet,
                    flightData.flightRound
                );
            }
        }
    }
    private sortAllGrossLeadersTie(leaderGrossList: any[]) {
        leaderGrossList = leaderGrossList.sort(this.ComparatorAllGrossPosition);
        //Collections.sort(grossLeaders);
        //console.log(leaderGrossList);

        ////console.log(leaderGrossList);
        //////console.log(leaderList);
        //return false;

        let pos: number = 1;
        let tied: boolean;

        if (leaderGrossList.length > 0) leaderGrossList[0]['position'] = pos;

        //////console.log(leaderList);
        for (let i = 1; i < leaderGrossList.length; i++) {
            let leaderCurrent = leaderGrossList[i];
            let leaderPrevious = leaderGrossList[i - 1];
            let firstCompleted = false;
            let secondCompleted = false;

            let checkRoundPlayed =
                leaderCurrent.activeRound > leaderCurrent.totalRounds
                    ? leaderCurrent.totalRounds
                    : leaderCurrent.activeRound;

            if (checkRoundPlayed == 1) {
                firstCompleted = leaderCurrent.completed1;
                secondCompleted = leaderPrevious.completed1;
            } else if (checkRoundPlayed == 2) {
                firstCompleted = leaderCurrent.completed2;
                secondCompleted = leaderPrevious.completed2;
            } else if (checkRoundPlayed == 3) {
                firstCompleted = leaderCurrent.completed3;
                secondCompleted = leaderPrevious.completed3;
            } else if (checkRoundPlayed == 4) {
                firstCompleted = leaderCurrent.completed4;
                secondCompleted = leaderPrevious.completed4;
            }

            tied = leaderCurrent.AllGrossUnder == leaderPrevious.AllGrossUnder;


            if (tied) {
                //leaderCurrent["tied"]= true;
                //leaderPrevious["tied"]= true;
                leaderGrossList[i]['tied'] = true;
                leaderGrossList[i - 1]['tied'] = true;
                leaderGrossList[i]['position'] = 'T' + pos;
                leaderGrossList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderGrossList[i]['position'] = pos;
            }
            //////console.log(pos);

            //////console.log("position-> " + pos + " -->" + leaderCurrent.name);
        }
        ////console.log(leaderGrossList);

        return leaderGrossList;
    }
    ComparatorAllGrossPosition(a, b) {
        let compare: number;

        compare = Number(a.status) - Number(b.status);
        if (compare != 0) {
            return compare;
        }
        if (a.playerStatus < b.playerStatus) {
            return -1;
        }
        if (a.playerStatus > b.playerStatus) {
            return 1;
        }

        // if (a.holes1 < b.holes1) {
        //     return 1;
        // }

        // if (a.holes1 < b.holes1) {
        //     return 1;
        // }
        let selfHoles: number = 0;
        let leaderHoles: number = 0;
        let completed: boolean = false;
        let checkRoundPlayed =
            a.activeRound > a.totalRounds ? a.totalRounds : a.activeRound;

        if (checkRoundPlayed == 1) {
            selfHoles = a.holes1;
            leaderHoles = b.holes1;

            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holes2;
            leaderHoles = b.holes2;

            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holes3;
            leaderHoles = b.holes3;

            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holes4;
            leaderHoles = b.holes4;

            completed = a.completed4 && b.completed4;
        }

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.AllGrossUnder - b.AllGrossUnder;

            if (compare != 0) {
                return compare;
            }
            if (completed) {
                let noOfHoles: number = 9;
                while (noOfHoles > 0) {
                    if (noOfHoles == 9)
                        compare = a.holeScoreLast9 - b.holeScoreLast9;
                    else if (noOfHoles == 6)
                        compare = a.holeScoreLast6 - b.holeScoreLast6;
                    else if (noOfHoles == 3)
                        compare = a.holeScoreLast3 - b.holeScoreLast3;
                    else if (noOfHoles < 3)
                        compare = a.holeScoreLast1 - b.holeScoreLast1;

                    if (compare != 0) {
                        return compare;
                    }
                    if (noOfHoles > 3) {
                        noOfHoles -= 3;
                    } else {
                        noOfHoles -= 2;
                    }
                }
                compare = leaderHoles - selfHoles;
                if (compare != 0) {
                    return compare;
                }
            }

        }


        //if (a["position"] < b["position"]) return -1;
        //if (a["position"] > b["position"]) return 1;

        return 0;
    }

    ComparatorAllNetPosition(a, b) {
        let compare: number;

        compare = Number(a.status) - Number(b.status);
        if (compare != 0) {
            return compare;
        }
        if (a.playerStatus < b.playerStatus) {
            return -1;
        }
        if (a.playerStatus > b.playerStatus) {
            return 1;
        }

        let selfHoles: number = 0;
        let leaderHoles: number = 0;
        let completed: boolean = false;
        let checkRoundPlayed =
            a.activeRound > a.totalRounds ? a.totalRounds : a.activeRound;

        if (checkRoundPlayed == 1) {
            selfHoles = a.holes1;
            leaderHoles = b.holes1;
            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holes2;
            leaderHoles = b.holes2;
            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holes3;
            leaderHoles = b.holes3;
            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holes4;
            leaderHoles = b.holes4;
            completed = a.completed4 && b.completed4;
        }

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.AllNetUnder - b.AllNetUnder;

            if (compare != 0) {
                return compare;
            }
            if (completed) {
                let noOfHoles: number = 9;
                while (noOfHoles > 0) {
                    if (noOfHoles == 9)
                        compare = a.holeScoreLast9 - b.holeScoreLast9;
                    else if (noOfHoles == 6)
                        compare = a.holeScoreLast6 - b.holeScoreLast6;
                    else if (noOfHoles == 3)
                        compare = a.holeScoreLast3 - b.holeScoreLast3;
                    else if (noOfHoles < 3)
                        compare = a.holeScoreLast1 - b.holeScoreLast1;

                    if (compare != 0) {
                        return compare;
                    }
                    if (noOfHoles > 3) {
                        noOfHoles -= 3;
                    } else {
                        noOfHoles -= 2;
                    }
                }
                compare = leaderHoles - selfHoles;
                if (compare != 0) {
                    return compare;
                }
            }
        }


        //if (a["position"] < b["position"]) return -1;
        //if (a["position"] > b["position"]) return 1;

        return 0;
    }
    async NetData(category: any) {
        this.getSummaryData(category);

        let netAllArray: any[] = [];
        for (let leader in this.allMatchResults) {
            netAllArray.push(this.allMatchResults[leader]);
        }
        netAllArray.sort(this.ComparatorAllNet);
        this.sortAllNetLeadersTie(netAllArray);
        this.dataSourceTotalNET = new MatTableDataSource(netAllArray);
        this.dataSourceTotalNET.paginator = this.paginator;
        this.dataSourceTotalNET.sort = this.sort;
        this.showSummary = true;
    }
    async deleteTM(player: any) {
        //console.log(player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to remove this player from Tournament?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                let result = this.facadeService.deleteTournamentMember(
                    this.tournamentID,
                    player.id
                );
                if (result) {
                    this.snackBar.open('Member has been deleted', 'x', {
                        duration: 3000,
                        panelClass: ['orange-snackbar'],
                    });
                    this.tournamentMember = this.tournamentMember.filter(
                        (a) => a.playerId !== player.id
                    );
                }
            } else {
                ////console.log("cancel delete action");
            }
        });
    }
    async editTM(player: any) {
        //console.log(player);
        const dialogRef = this.dialog.open(DialogEditPlayerHandicapComponent, {
            data: {
                player: player,
            },
        });

        dialogRef.afterClosed().subscribe(async (res) => {
            if (res) {
                console.log(res);

                ////console.log("record deleted.");
                let result = await this.facadeService.updateTournamentMemberHandicap(
                    this.tournamentID,
                    player.id,
                    res.handicap
                );
                if (result) {
                    this.snackBar.open('Member has been updated', 'x', {
                        duration: 3000,
                        panelClass: ['orange-snackbar'],
                    });

                    //Update the handicap in the table
                    let tmIndex = this.dataSource.data.findIndex(
                        (a) => a.id === player.id
                    );
                    if (tmIndex !== -1) {
                        this.dataSource.data[tmIndex].handicap =
                            res.handicap;
                        this.dataSource._updateChangeSubscription();
                    }



                }
            } else {
                ////console.log("cancel delete action");
            }
        });
    }
    async disqulifyTM(player: any) {
        //console.log(player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to mark this player Incomplete/Disqualified?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                let member: any = {
                    tournamentId: this.tournamentID,
                    playerId: player.id,
                    status: 'ic',
                };
                let result =
                    this.facadeService.insertTournamentMemberStatus(member);
                if (result) {
                    this.snackBar.open('Member has been disqualify', 'x', {
                        duration: 3000,
                        panelClass: ['orange-snackbar'],
                    });
                }
            } else {
                ////console.log("cancel delete action");
            }
        });
    }
    public getLastHolesTotal(noOfHoles: number, holeScores: any[]): number {
        let total: number = 0;

        for (let i = holeScores.length - 1; i >= 0 && noOfHoles > 0; i--) {
            total += holeScores[i];
            noOfHoles--;
        }

        return total;
    }
    async getTournamentMembers() {
        try {
            this.logger.log('Getting Tournament Members', "info", this.tournamentID);

            let dataFullTournaments: any;
            let tournamentsMember: any[] = [];
            if (this.dataFullTournament['TournamentQL'][0].leagueId == null) {
                dataFullTournaments = await this.facadeService.getTournamentMembers(
                    this.tournamentID
                );
                //console.log(dataFullTournaments);
                this.flightNumber = this.fullTournament.FlightsQL.length + 1;
                this.tournamentMember = dataFullTournaments.TournamentMemberQL;
                this.tournamentMembers = dataFullTournaments.TournamentMemberQL;
                this.logger.log('Getting Tournament Members Succesfully', "info", this.tournamentID);
                this.tournamentMembers.forEach(account => {
                    let member = {
                        id: account.playerId,
                        firstName: account.player ? account.player["firstName"] : account["firstName"],
                        lastName: account.player ? account.player["lastName"] : account["lastName"],
                        email: account.player ? account.player["email"] : account["email"],
                        handicap: account.handicap ? account.handicap : account.player["handicap"],
                        playerCategory: account.player ? account.player["playerCategory"] : account["playerCategory"],
                    }
                    tournamentsMember.push(member);
                });
                this.dataSource = new MatTableDataSource(tournamentsMember);
                this.dataSource.filterPredicate = (data: any, filter: string) => {
                    const first = (data.firstName || "").toLowerCase();
                    const last = (data.lastName || "").toLowerCase();
                    const full = `${first} ${last}`.trim();

                    filter = filter.toLowerCase();

                    return first.includes(filter) ||
                        last.includes(filter) ||
                        full.includes(filter);
                };
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
            } else {
                dataFullTournaments =
                    await this.facadeService.getTournamentsFlights(
                        this.tournamentID
                    );
                //console.log(dataFullTournaments);
                this.logger.log('Getting Tournament Members Succesfully', "info", this.tournamentID);
                if (dataFullTournaments) {
                    for (let obj of dataFullTournaments['TournamentQL'][0].FlightManagerQLi) {
                        for (const iterator of obj.MembersQL) {
                            this.tournamentMember.push(iterator.PlayerQL);
                            this.tournamentMembers.push(iterator.PlayerQL);
                        }
                    }
                }
                this.flightNumber = this.fullTournament.FlightsQL.length + 1;
                // this.tournamentMember = dataFullTournaments.TournamentMemberQL;
                this.tournamentMembers = dataFullTournaments.TournamentMemberQL;

                this.dataSource = new MatTableDataSource(this.tournamentMember);
                this.dataSource.filterPredicate = (data: any, filter: string) => {
                    const first = (data.firstName || "").toLowerCase();
                    const last = (data.lastName || "").toLowerCase();
                    const full = `${first} ${last}`.trim();

                    filter = filter.toLowerCase();

                    return first.includes(filter) ||
                        last.includes(filter) ||
                        full.includes(filter);
                };
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
            }
        } catch (error) {
            this.logger.log('Getting Tournaments Members Data Failed', "error", error.toString());
        }
    }

    private calculateTotal(leaderGross: any, leaderNet: any, round: number) {
        // let status: any = this.memberStatusesQLs.find(
        //   (s) => s.playerId === leaderGross.playerId
        // );

        // if (status && this.activeRound > 1) return false;

        if (leaderGross.playerId in this.allMatchResults) {
            //////console.log("index exist");
        } else {
            this.allMatchResults[leaderGross.playerId] = [];

            this.allMatchResults[leaderGross.playerId]['position'] = '';

            this.allMatchResults[leaderGross.playerId][
                'TotalGross' + round
            ] = 0;
            this.allMatchResults[leaderGross.playerId]['TotalNet' + round] = 0;
            this.allMatchResults[leaderGross.playerId]['roundStatus' + round] =
                leaderGross.status;
            this.allMatchResults[leaderGross.playerId][
                'TotalGrossUnder' + round
            ] = 0;
            this.allMatchResults[leaderGross.playerId]['AllGrossUnder'] = 0;
            this.allMatchResults[leaderGross.playerId]['AllGrossPoints'] = 0;
            this.allMatchResults[leaderGross.playerId]['AllNetPoints'] = 0;

            this.allMatchResults[leaderGross.playerId][
                'TotalNetUnder' + round
            ] = 0;
            this.allMatchResults[leaderGross.playerId]['AllNetUnder'] = 0;
            this.allMatchResults[leaderGross.playerId]['points' + round] += 0;
            this.allMatchResults[leaderGross.playerId]['holes' + round] += 0;

            //////console.log("index created");
        }

        if (!this.allMatchResults[leaderGross.playerId]['TotalGross' + round])
            this.allMatchResults[leaderGross.playerId][
                'TotalGross' + round
            ] = 0;

        if (!this.allMatchResults[leaderGross.playerId]['TotalNet' + round])
            this.allMatchResults[leaderGross.playerId]['TotalNet' + round] = 0;

        if (
            !this.allMatchResults[leaderGross.playerId][
            'TotalGrossUnder' + round
            ]
        )
            this.allMatchResults[leaderGross.playerId][
                'TotalGrossUnder' + round
            ] = 0;

        if (
            !this.allMatchResults[leaderGross.playerId]['TotalNetUnder' + round]
        )
            this.allMatchResults[leaderGross.playerId][
                'TotalNetUnder' + round
            ] = 0;

        this.allMatchResults[leaderGross.playerId]['position'] = '';
        this.allMatchResults[leaderGross.playerId]['courseId'] =
            leaderGross.courseId;
        this.allMatchResults[leaderGross.playerId]['holeSets'] =
            leaderGross.holeSets;
        this.allMatchResults[leaderGross.playerId]['playerId'] =
            leaderGross.playerId;
        this.allMatchResults[leaderGross.playerId]['name'] = leaderGross.name;
        this.allMatchResults[leaderGross.playerId]['clubName'] =
            leaderGross.clubName;
        this.allMatchResults[leaderGross.playerId]['picture'] =
            leaderGross.picture;
        this.allMatchResults[leaderGross.playerId]['handicap'] =
            leaderGross.handicap;
        this.allMatchResults[leaderGross.playerId]['TotalGross' + round] +=
            leaderGross.score;
        this.allMatchResults[leaderGross.playerId]['TotalNet' + round] +=
            leaderNet.score;
        this.allMatchResults[leaderGross.playerId]['roundStatus' + round] =
            leaderGross.status;
        this.allMatchResults[leaderGross.playerId]['extraData'] =
            leaderGross.extraData;

        this.allMatchResults[leaderGross.playerId]['TotalGrossUnder' + round] +=
            leaderGross.under;
        this.allMatchResults[leaderGross.playerId]['AllGrossUnder'] +=
            leaderGross.under;
        this.allMatchResults[leaderGross.playerId]['PlayingRound'] =
            leaderGross.playingRound;
        this.allMatchResults[leaderGross.playerId]['holeSetsInverted'] =
            leaderGross.holeSetsInverted;
        this.allMatchResults[leaderGross.playerId]['AllGrossPoints'] +=
            leaderGross.score;
        this.allMatchResults[leaderGross.playerId]['TotalNetUnder' + round] +=
            leaderNet.under;
        this.allMatchResults[leaderGross.playerId]['AllNetUnder'] +=
            leaderNet.under;
        this.allMatchResults[leaderGross.playerId]['AllNetPoints'] +=
            leaderNet.score;
        this.allMatchResults[leaderGross.playerId]['points' + round] =
            leaderGross.points;
        this.allMatchResults[leaderGross.playerId]['holes' + round] =
            leaderGross.holes;
        this.allMatchResults[leaderGross.playerId]['completed' + round] =
            leaderGross.completed;
        this.allMatchResults[leaderGross.playerId]['completed' + round] =
            leaderGross.completed;

        // this.allMatchResults[leaderGross.playerId]["holeScoresGross" + round] =
        //   leaderGross.holeScores;
        // this.allMatchResults[leaderGross.playerId]["holeScoresNet" + round] =
        //   leaderNet.holeScores;

        this.allMatchResults[leaderGross.playerId]['holeScoreLast9'] =
            leaderGross.holeScoreLast9;
        this.allMatchResults[leaderGross.playerId]['holeScoreLast6'] =
            leaderGross.holeScoreLast6;
        this.allMatchResults[leaderGross.playerId]['holeScoreLast3'] =
            leaderGross.holeScoreLast3;
        this.allMatchResults[leaderGross.playerId]['holeScoreLast1'] =
            leaderGross.holeScoreLast1;

        this.allMatchResults[leaderGross.playerId]['activeRound'] =
            this.activeRound;
        this.allMatchResults[leaderGross.playerId]['totalRounds'] =
            this.totalRounds;

        status
            ? (this.allMatchResults[leaderGross.playerId]['status'] = 1)
            : (this.allMatchResults[leaderGross.playerId]['status'] = 0);
        this.allMatchResults[leaderGross.playerId]['playerStatus'] =
            leaderGross.playerStatus;
        //////console.log(leaderGross.playerId + " -> " + "TotalGross" + round + " "  + this.allMatchResults[leaderGross.playerId]["TotalGross" + round]);
        return false;
    }

    applyMembersFilter(filterValue: string) {
        try {
            this.logger.log('Admin search in Tournament Members', "info", filterValue);
            if (filterValue == '') {
                this.tournamentMember = this.tournamentMembers;
                return;
            }
            filterValue = filterValue.toLowerCase();
            let players = [];
            if (filterValue.length >= 3) {
                for (let c of this.tournamentMembers) {
                    c['fullname'] =
                        c.player['firstName'] + ' ' + c.player['lastName'];
                    if (c['fullname'].toLowerCase().includes(filterValue)) {
                        players.push(c);
                    } else if (
                        c.player['membershipNumber'] &&
                        c.player['membershipNumber']
                            .toLowerCase()
                            .toString()
                            .includes(filterValue)
                    ) {
                        players.push(c);
                    } else if (
                        c.player['playerCategory'] &&
                        c.player['playerCategory']
                            .toLowerCase()
                            .toString()
                            .includes(filterValue)
                    ) {
                        players.push(c);
                    } else if (
                        c.player['email'] &&
                        c.player['email']
                            .toLowerCase()
                            .toString()
                            .includes(filterValue)
                    ) {
                        players.push(c);
                    }
                }
                //console.log(players);

                this.tournamentMember = players;
                ////console.log(this.player);
                // this.setDataSource(this.player);
            }
        } catch (error) {
            this.logger.log('Search in Tournament Members Failed', "error", error.toString());
        }
    }

    addPlayer() {
        const dialogRef = this.dialog.open(DialogAddPlayerComponent, {
            data: { flights: this.selectedMembers.length, tournamentID: this.tournamentID },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                //console.log(result);
                // this.clubMembers.push(result);
                ////console.log(this.clubMembers);
                // this.syncClubMembers();
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    searchPlayer() {
        const dialogRef = this.dialog.open(DialogPlayerComponent, {
            width: '740px',
            data: { flights: this.selectedMembers.length },
        });

        dialogRef.afterClosed().subscribe((result) => {
            //console.log(result);
            if (result.length == 1) {
                ////console.log("record deleted.");
                //console.log(result);

                let founded = this.tournamentMembers.filter((a) => {
                    return a.player.id == result[0].player.id;
                });
                //console.log(founded);

                if (founded.length == 0) {
                    let tournamentMember: TournamentMember[] = [];

                    let member: any = {
                        tournamentId: this.tournamentID,
                        playerId: result[0].player.id,
                        status: true,
                    };

                    this.saveMembers(member);
                    this.getTournamentMembers();
                } else {
                    this.snackBar.open(
                        'Player already exist in the list.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );
                }
            } else if (result.length > 1) {
                result.forEach((element) => {
                    let founded = this.tournamentMembers.filter((a) => {
                        return a.player.id == result[0].player.id;
                    });
                    //console.log(founded);

                    if (founded.length == 0) {
                        let tournamentMember: TournamentMember[] = [];

                        let member: any = {
                            tournamentId: this.tournamentID,
                            playerId: element.player.id,
                            status: true,
                        };

                        this.saveMembers(member);
                    } else {
                        this.snackBar.open(
                            'Player already exist in the list.',
                            'x',
                            {
                                duration: 5000,
                            }
                        );
                    }
                });
                this.getTournamentMembers();
            } else {
            }
        });
    }

    async saveMembers(tournamentMember: TournamentMember[]) {
        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentMember)
        );

        if (result) {
            this.snackBar.open('Tournament member have been added.', 'x', {
                duration: 5000,
            });
        }
    }
    movetoFlight(id) {
        this.mainSelected = ++this.mainSelected;
    }
    async playerList() {

        try {
            this.logger.log('Admin Click on Add New Member Btn on Members Tab', "info", this.tournamentID);
            let datas: any;
            if (this._localStorage.isSuperAdmin() || this._localStorage.isClubAdmin()) {
                datas = await this.facadeService.getPlayersListForTournament(
                    this.loggedInUser.adminClubId
                );
            } else {
                datas = await this.facadeService.getPlayersByID(
                    this.loggedInUser.id
                );
            }
            //Remve the players who are already in the tournament
            datas.player = datas.player.filter((player) => {
                let exist = this.tournamentMembers.find((a) => a.playerId == player.id);
                return !exist;
            });
            let subtournamentID =
                this.dataFullTournament['SubTournamentQL'].length > 0
                    ? this.dataFullTournament['SubTournamentQL'][0].subTournamentId
                    : '';
            const dialogRef = this.dialog.open(DialogPlayerListComponent, {
                data: {
                    players: datas.player,
                    tournamentID: this.tournamentID,
                    subTournamentID: subtournamentID,
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                //console.log(result);
                const resultString = JSON.stringify(result);
                this.logger.log('Result From Add New Member Btn on Members Tab', "info", resultString);
                if (result) {
                    ////console.log("record deleted.");
                    //console.log(result);
                    this.getTournamentMembers();
                    // this.clubMembers.push(result);
                    // //console.log(this.clubMembers);
                    // this.syncClubMembers();
                } else {
                    ////console.log("cancel delete action");
                }
            });
        } catch (error) {
            this.logger.log('Getting Players To add on Tournament View Page Failed', "error", error.toString());
        }
    }
    async closeDrawer() {
        //let obj =new FlightManagementComponent(this.route, this.router,this.snackBar,this.dialog,null,this.facadeService,this.changeDetection);
        if (this.flightid) {
            //this._flightManagmentComponent.closedrawer(this.tournamentID);
            // obj.closedrawer(this.tournamentID)
            //obj.ngOnInit();
            // obj.changeRound(2);
        } else {
            //this._flightManagmentComponent.closedrawer(this.newFlightID);
            // obj.closedrawer(this.tournamentID)
        }
        this.matDrawer.close();
        this.flight = [];
        this.flightid = null;
        this.dataSourceFlightMembers = null;
    }
    selectedTee(event, flightId) {
        //console.log(flightId);
        let target = event.source.selected._element.nativeElement;
        let selectedData = {
            value: event.value,
            text: target.innerText.trim(),
        };
        // //console.log(this.roundFlights);
        if (this.flight) {
            let roundTeeId: any = General.getPlayersTe(selectedData.text);

            if (this.flight.id === flightId) {
                this.flight.tee = selectedData.value;
                this.flight.tee_id = roundTeeId.id;
            }
        }
    }
    onfligthNumberChange(event) {
        this.flight.flightNo = event;
    }
    onfligthTimeChange(event) {
        this.flight.time = event;
    }
    onfligthHoleChange(event) {
        this.flight.startingHole = event;
    }
    async getFlightId(id: string) {
        this.flightid = id;
        let SelectedFLight: any = [];
        let flightPlayers: any[] = [];
        this.getTournamentMembers();
        SelectedFLight = await this.facadeService.singleRoundFlightsQuery(
            this.flightid
        );
        this.flight = SelectedFLight.FlightsQL[0];
        this.flight.MembersQL.forEach((element) => {
            flightPlayers.push(element['PlayerQL']);
        });
        this.dataSourceFlightMembers = new MatTableDataSource(flightPlayers);
        this.dataSourceFlightMembers.sort = this.sort;
        //console.log(this.flight);

        // //console.log(this.flightid);
    }
    private sortAllNetLeadersTie(leaderList: any[]) {
        //Collections.sort(grossLeaders);

        leaderList = leaderList.sort(this.ComparatorAllNetPosition);
        //////console.log(leaderList);
        //return false;

        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;
        //////console.log(leaderList);
        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];
            let firstCompleted = false;
            let secondCompleted = false;

            let checkRoundPlayed =
                leaderCurrent.activeRound > leaderCurrent.totalRounds
                    ? leaderCurrent.totalRounds
                    : leaderCurrent.activeRound;

            if (checkRoundPlayed == 1) {
                firstCompleted = leaderCurrent.completed1;
                secondCompleted = leaderPrevious.completed1;
            } else if (checkRoundPlayed == 2) {
                firstCompleted = leaderCurrent.completed2;
                secondCompleted = leaderPrevious.completed2;
            } else if (checkRoundPlayed == 3) {
                firstCompleted = leaderCurrent.completed3;
                secondCompleted = leaderPrevious.completed3;
            } else if (checkRoundPlayed == 4) {
                firstCompleted = leaderCurrent.completed4;
                secondCompleted = leaderPrevious.completed4;
            }

            if (leaderCurrent.AllNetUnder != undefined) {
                tied = leaderCurrent.AllNetUnder == leaderPrevious.AllNetUnder;
            } else {
                tied = leaderCurrent.under == leaderPrevious.under;
            }

            if (tied) {
                //leaderCurrent["tied"]= true;
                //leaderPrevious["tied"]= true;
                leaderList[i]['tied'] = true;
                leaderList[i - 1]['tied'] = true;
                leaderList[i]['position'] = 'T' + pos;
                leaderList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderList[i]['position'] = pos;
            }
            //////console.log(pos);

            //////console.log("position-> " + pos + " -->" + leaderCurrent.name);
        }
        //leaderList = leaderList.sort(this.ComparatorAllGrossPosition);
        //////console.log("return");
        //console.log(leaderList);
        return leaderList;
    }
    async getnewFlightId(id: string) {
        this.newFlightID = id;
        let SelectedFLight: any = [];
        let flightPlayers: any[] = [];
        this.getTournamentMembers();
        SelectedFLight = await this.facadeService.singleRoundFlightsQuery(
            this.newFlightID
        );
        this.flight = SelectedFLight.FlightsQL[0];
        this.flight.MembersQL.forEach((element) => {
            flightPlayers.push(element['PlayerQL']);
        });
        this.dataSourceFlightMembers = new MatTableDataSource(flightPlayers);
        this.dataSourceFlightMembers.sort = this.sort;
        //console.log(this.flight);

        // //console.log(this.flightid);
    }

    async removeFlightMembers(playerId) {
        //console.log(playerId);
        let count = 0;
        // this.flight.MembersQL.forEach((element) => {
        //     if (element['PlayerQL'].id == playerId) {
        //         this.flight.MembersQL.splice(count, 1);
        //     }
        //     count++;
        // });
        let result = <any>(
            await this.facadeService.DeleteFlightMembers(
                this.flightid,
                playerId
            )
        );
        //console.log(result);
        if (result) {
            this.snackBar.open('Flights members have been removed.', 'x', {
                duration: 5000,
            });
        }

        this.getFlightId(this.flightid);
    }
    getFlightTime(items: any) {
        let flightTime: string = '00:00';

        try {
            if (items.time) {
                let dateNow: Date = new Date(
                    Constants.DEFAULT_DATE + ' ' + items.time.substr(0, 5)
                );

                var h = dateNow.getHours();
                var m = dateNow.getMinutes();

                flightTime = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
            }
        } catch {
            flightTime = '00:00';
        }

        return flightTime;
    }
    createFlight(index: any) {
        this.flightRound = index;
        this.flight.startingHole = 1;
        this.flight.tee = 'AMATEURS';

        this.newFlightID = UniqueIdGenerator.generate();
    }
    async saveTournamentPlayer(player: any) {
        let flightMembersToSave: any[] = [];
        //console.log(player);
        let roundTeeId: any = General.getPlayersTe(
            player.playerCategory ? player.playerCategory : 'AMATEURS'
        );

        let FM: any = {
            playerId: player.id,
            flightId: this.flightid ? this.flightid : this.newFlightID,
            attendance: true,
            playingTee: roundTeeId.result ? roundTeeId.result : 'AMATEURS',
            tee_id: roundTeeId.id,
        };
        flightMembersToSave.push(FM);
        let save: boolean;
        if (this.flightid) {
            save = <boolean>(
                await this.facadeService.saveFlightMembers(
                    this.flightid ? this.flightid : this.newFlightID,
                    flightMembersToSave
                )
            );
        } else {
            let flight: any = {
                id: this.newFlightID,
                tournamentId: this.tournamentID,
                courseId: this.fullTournament.CourseQL.id,
                adminId: this.fullTournament.adminId,
                courseHoleSets: this.fullTournament.courseHoleSets
                    ? this.fullTournament.courseHoleSets
                    : 3,
                flightNo: this.flightNumber,
                flightRound: this.flightRound,
                startingHole: this.flight.startingHole,
                tee: this.flight.length > 0 ? this.flight.tee : 'AMATEURS',
                tee_id: this.flight.length > 0 ? this.flight.tee_id : '1',
                date:
                    this.flight.length > 0
                        ? this.flight.date
                        : this.dataFullTournament['TournamentQL'][0].startDate,
                time: this.flight.time,
                ended: false,
            };
            await this.facadeService.SaveRoundFlight(flight);
            save = <boolean>(
                await this.facadeService.saveFlightMembers(
                    this.newFlightID,
                    flightMembersToSave
                )
            );
        }

        if (save && this.flightid) {
            this.getFlightId(this.flightid);
            this.snackBar.open(
                'Flights Member have been saved and updated successfully.',
                'x',
                {
                    duration: 5000,
                }
            );
        } else {
            this.getnewFlightId(this.newFlightID);
            this.snackBar.open(
                'Flights Member have been saved and updated successfully.',
                'x',
                {
                    duration: 5000,
                }
            );
        }
        // let result = <any>(
        //     await this.facadeService.saveFlightMembers(member)
        // );
        // this.getFlightId(this.flightid);
        // if (result) {
        //     this.snackBar.open('Tournament members have been saved.', 'x', {
        //         duration: 5000,
        //     });
        // }
    }
    async saveFlight() {
        //console.log('flight saved');
        let flight: any;
        if (this.flightid) {
            flight = {
                id: this.flightid,
                tournamentId: this.tournamentID,
                courseId: this.fullTournament.CourseQL.id,
                adminId: this.flight.adminId,
                courseHoleSets:
                    this.flight.length > 0 ? this.flight.courseHoleSets : 3,
                flightNo: this.flight.flightNo,
                flightRound: this.flight.flightRound,
                startingHole: this.flight.startingHole,
                tee: this.flight.length > 0 ? this.flight.tee : 'AMATEURS',
                tee_id: this.flight.length > 0 ? this.flight.tee_id : '1',
                date:
                    this.flight.length > 0
                        ? this.flight.date
                        : this.dataFullTournament['TournamentQL'][0].startDate,
                time: this.flight.time,
                ended: false,
            };
        } else {
            flight = {
                id: this.newFlightID,
                tournamentId: this.tournamentID,
                courseId: this.fullTournament.CourseQL.id,
                adminId: this.fullTournament.adminId,
                courseHoleSets: this.fullTournament.courseHoleSets
                    ? this.fullTournament.courseHoleSets
                    : 3,
                flightNo: this.flightNumber,
                flightRound: this.flightRound,
                startingHole: this.flight.startingHole,
                tee: this.flight.length > 0 ? this.flight.tee : 'AMATEURS',
                tee_id: this.flight.length > 0 ? this.flight.tee_id : '1',
                date:
                    this.flight.length > 0
                        ? this.flight.date
                        : this.dataFullTournament['TournamentQL'][0].startDate,
                time: this.flight.time,
                ended: false,
            };
        }
        let save = <boolean>await this.facadeService.SaveRoundFlight(flight);
        if (save) {
            this.getFlightId(this.flightid);
            this.snackBar.open(
                'Flights have been saved and updated successfully.',
                'x',
                {
                    duration: 5000,
                }
            );
        }
        // }
    }

    getTeamId(playerId) {
        if (this.fullTournament.teams.length > 0) {
            let playerTeamId;
            for (let data of this.fullTournament.teams) {
                data.teamMembers.forEach(element => {
                    if (element.playerId == playerId) {
                        playerTeamId = data.id;
                    }
                });
            }
            return playerTeamId;
        }
    }

    getTeamMemberInFlight(members, playerId) {
        if (!members || members.length === 0) return null;

        // 1. Get current player’s Team ID
        const teamId = this.getTeamId(playerId);
        if (!teamId) return null;

        // 2. Find another member in the flight with the SAME teamId
        for (let m of members) {
            if (m.playerId !== playerId) {
                const memberTeamId = this.getTeamId(m.playerId);
                if (memberTeamId === teamId) {
                    return m; // Found teammate in the same flight
                }
            }
        }

        return null; // No teammate found
    }


    findOpponentFlightWise(teamId, tournamentTeamOpponents, members) {

        let oppoentId;
        let opponentTeamId;
        for (let data of members) {
            opponentTeamId = this.getTeamId(data.playerId);
            if (opponentTeamId != teamId && this.check(tournamentTeamOpponents, data.playerId)) {
                oppoentId = data.playerId;
                continue;
            }
        }
        return { oppoentId, opponentTeamId };

    }

    check(tournamentTeamOpponents, playerId) {

        let boolean = true;
        tournamentTeamOpponents.forEach(element => {
            if (element.team1MemberId == playerId || element.team2MemberId == playerId) {
                boolean = false;
            }
        });
        return boolean;
    }

    // -----------------------------------------------------------------------
    // Result Sheet Generation
    // -----------------------------------------------------------------------

    private ordinalSuffix(n: number): string {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    buildResultSheetData(nineHole: boolean = false, sortType: 'gross' | 'net' = 'gross') {
        const tournament = this.fullTournament;
        if (!tournament) return { categories: [], completedRounds: [], pars: Array(18).fill(0), nineHole: false };

        const allFlights: any[] = tournament.FlightsQL || [];

        // Determine completed rounds (rounds that have at least one score)
        const completedRounds: number[] = [];
        for (let r = 1; r <= this.noOfRounds; r++) {
            const hasScores = allFlights
                .filter(f => f.flightRound === r)
                .some(f => (f.MembersQL || []).some(m => m.ScoresQL && m.ScoresQL.length > 0));
            if (hasScores) completedRounds.push(r);
        }

        // Get par values – prefer CoursesQL hole data, fall back to scores
        const pars: number[] = Array(18).fill(0);
        const courseHoles = tournament.CoursesQL?.[0]?.course?.HolesQL;
        if (courseHoles) {
            for (const hole of courseHoles) {
                if (hole.holeNo >= 1 && hole.holeNo <= 18) pars[hole.holeNo - 1] = hole.par || 0;
            }
        }
        if (pars.every(p => p === 0)) {
            for (const flight of allFlights) {
                for (const member of (flight.MembersQL || [])) {
                    for (const score of (member.ScoresQL || [])) {
                        const h = score.hole?.holeNo;
                        if (h >= 1 && h <= 18 && score.hole?.par) pars[h - 1] = score.hole.par;
                    }
                }
            }
        }

        // For a 9-hole event work out which 9 holes were actually played
        // (front nine 1-9 or back nine 10-18) so the sheet shows the real holes.
        let displayHoleNos: number[] = [];
        if (nineHole) {
            const playedHoles = new Set<number>();
            for (const flight of allFlights) {
                for (const member of (flight.MembersQL || [])) {
                    for (const score of (member.ScoresQL || [])) {
                        const h = score.hole?.holeNo;
                        if (h >= 1 && h <= 18) playedHoles.add(h);
                    }
                }
            }
            const minHole = playedHoles.size ? Math.min(...playedHoles) : 1;
            const start = minHole >= 10 ? 10 : 1;            // back nine vs front nine
            displayHoleNos = Array.from({ length: 9 }, (_, i) => start + i);
        }

        // Pars laid out for the displayed holes (slot 0-8 used by the PDF/Excel)
        const displayPars: number[] = nineHole
            ? [...displayHoleNos.map(h => pars[h - 1] || 0), ...Array(9).fill(0)]
            : pars;

        // Build player map: playerId → aggregated data
        const playerMap = new Map<string, any>();

        for (const round of completedRounds) {
            const roundFlights = allFlights.filter(f => f.flightRound === round);
            for (const flight of roundFlights) {
                for (const member of (flight.MembersQL || [])) {
                    const scores: any[] = member.ScoresQL || [];
                    if (scores.length === 0) continue;

                    const playerId = member.playerId;
                    const player = member.PlayerQL;
                    const clubName = player?.membership?.[0]?.club?.name || '';

                    const sortedScores = [...scores].sort((a, b) => (a.hole?.holeNo || 0) - (b.hole?.holeNo || 0));
                    // If any player has 9 scores, treat as 9-hole event

                    const scoreByHole: { [h: number]: number } = {};
                    let playerHandicap = 0;
                    for (const score of sortedScores) {
                        const holeNo = score.hole?.holeNo;
                        if (score.playerHandicap != null) playerHandicap = score.playerHandicap;
                        if (holeNo >= 1 && holeNo <= 18) scoreByHole[holeNo] = score.grossScore || 0;
                    }

                    // front9 = the holes shown in the first 9 columns; back9 = next 9 (18-hole only)
                    const front9: number[] = nineHole
                        ? displayHoleNos.map(h => scoreByHole[h] || 0)
                        : Array.from({ length: 9 }, (_, i) => scoreByHole[i + 1] || 0);
                    const back9: number[] = nineHole
                        ? Array(9).fill(0)
                        : Array.from({ length: 9 }, (_, i) => scoreByHole[i + 10] || 0);

                    const out = front9.reduce((a, b) => a + b, 0);
                    const inn = back9.reduce((a, b) => a + b, 0);
                    const dayGross = out + inn;
                    // For 9-hole events the handicap is halved (rounded to nearest whole)
                    // if (sortedScores.length === 9) { nineHole = true; } else { nineHole = false; }
                    const effHandicap = sortedScores.length === 9 ? Math.round(playerHandicap / 2) : playerHandicap;
                    const dayNet = dayGross > 0 ? Math.max(0, dayGross - effHandicap) : 0;

                    if (!playerMap.has(playerId)) {
                        playerMap.set(playerId, {
                            id: playerId,
                            name: `${player?.firstName || ''} ${player?.lastName || ''}`.trim(),
                            hcp: member?.playingHandicap ?? '',
                            club: clubName,
                            category: player?.playerCategory || 'General',
                            rounds: {}
                        });
                    }
                    playerMap.get(playerId)!.rounds[round] = { front9, back9, out, in: inn, dayGross, dayNet };
                }
            }
        }

        // Compute totals
        const players = Array.from(playerMap.values());
        for (const p of players) {
            p.totalGross = completedRounds.reduce((sum, r) => sum + (p.rounds[r]?.dayGross || 0), 0);
            p.totalNet = completedRounds.reduce((sum, r) => sum + (p.rounds[r]?.dayNet || 0), 0);
        }

        // Group by category and assign positions
        const categoryMap = new Map<string, any[]>();
        for (const p of players) {
            if (!categoryMap.has(p.category)) categoryMap.set(p.category, []);
            categoryMap.get(p.category)!.push(p);
        }

        // A category with valid handicapLimits splits into a lower-bracket and an
        // upper-bracket table (mirrors the stroke-play leaderboard's tab logic) —
        // only stroke play scores every player individually against par, so this
        // split only makes sense for that format.
        const categoryDefs: any[] = tournament.CategoriesQL || [];
        const isStrokePlay = tournament.matchFormat === matchFormat.STROKE_PLAY;
        const hasHandicapLimits = (catDef: any): boolean => {
            const l = catDef?.handicapLimits;
            if (!l) return false;
            return (
                l.lowerLimitStart != null && l.lowerLimitEnd != null &&
                l.upperLimitStart != null && l.upperLimitEnd != null &&
                l.lowerLimitEnd > l.lowerLimitStart &&
                l.upperLimitStart > l.lowerLimitEnd &&
                l.upperLimitEnd > l.upperLimitStart
            );
        };
        const finalizeCategory = (name: string, catPlayers: any[]): { name: string; players: any[] } => {
            const byGross = catPlayers.filter(p => p.totalGross > 0).sort((a, b) => a.totalGross - b.totalGross);
            const byNet = catPlayers.filter(p => p.totalNet > 0).sort((a, b) => a.totalNet - b.totalNet);
            byGross.forEach((p, i) => { p.grossPos = i + 1; });
            byNet.forEach((p, i) => { p.netPos = i + 1; });
            catPlayers.sort((a, b) => {
                const scoreA = sortType === 'gross' ? a.totalGross : a.totalNet;
                const scoreB = sortType === 'gross' ? b.totalGross : b.totalNet;

                if (!scoreA && !scoreB) return 0;
                if (!scoreA) return 1;
                if (!scoreB) return -1;
                return scoreA - scoreB;
            });
            return { name, players: catPlayers };
        };

        const categories: { name: string; players: any[] }[] = [];
        for (const [catName, catPlayers] of categoryMap) {
            const catDef = categoryDefs.find((c: any) => c.category === catName);
            if (isStrokePlay && hasHandicapLimits(catDef)) {
                const limits = catDef.handicapLimits;
                const lowerPlayers = catPlayers.filter(p => Number(p.hcp) <= limits.lowerLimitEnd);
                const upperPlayers = catPlayers.filter(p => Number(p.hcp) > limits.lowerLimitEnd);
                if (lowerPlayers.length > 0) {
                    categories.push(finalizeCategory(`${catName} (${limits.lowerLimitStart} - ${limits.lowerLimitEnd})`, lowerPlayers));
                }
                if (upperPlayers.length > 0) {
                    categories.push(finalizeCategory(`${catName} (${limits.upperLimitStart} - ${limits.upperLimitEnd})`, upperPlayers));
                }
            } else {
                categories.push(finalizeCategory(catName, catPlayers));
            }
        }

        return { categories, completedRounds, pars: displayPars, nineHole };
    }

    // 9-hole detection — same condition the Scores tab uses: the tournament's selected
    // course_hole_sets entry (matched by holeSets + inverted) has noOfHoles === 9.
    private async isNineHoleEvent(): Promise<boolean> {
        try {
            const t = this.fullTournament;
            const courseId = t?.courseId;
            if (!courseId) return false;
            const data = await this.facadeService.getCourseHoleSetsForCourse(courseId);
            const sets: any[] = data?.course_hole_sets || [];
            if (sets.length === 0) return false;
            const selected = sets.find(
                (s: any) => s.holeSets == t.courseHoleSets && !!s.inverted === !!t.courseHoleSetsInverted
            );
            const noOfHoles = (selected ?? sets[0])?.noOfHoles;
            return noOfHoles === 9;
        } catch {
            return false;
        }
    }

    async generateGrossResultSheetPDF() {
        this.isGeneratingResultSheet = true;
        this.showResultSheetMenu = false;
        try {
            const nineHole = await this.isNineHoleEvent();
            const { categories, completedRounds, pars } = this.buildResultSheetData(nineHole, 'gross');
            if (completedRounds.length === 0) {
                this.snackBar.open('No completed rounds with scores found.', 'Close', { duration: 3000 });
                return;
            }

            const tournamentTitle = (this.fullTournament.title || 'Tournament').toString();
            // Columns for a single round: 9-hole = H1-H9 + OUT + DAY GROSS (11); 18-hole adds H10-H18 + IN (21)
            const colsPerRound = nineHole ? 11 : 21;

            // One round per page — a standard landscape page fits a single round's columns
            const pageWidth = nineHole ? 210 : 297;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, pageWidth] });
            const usableWidth = pageWidth - 28;

            const parOut = pars.slice(0, 9).reduce((a, b) => a + b, 0);
            const parIn = pars.slice(9, 18).reduce((a, b) => a + b, 0);

            let firstPage = true;

            for (const cat of categories) {
                for (let ri = 0; ri < completedRounds.length; ri++) {
                    const r = completedRounds[ri];
                    if (!firstPage) { doc.addPage(); }
                    firstPage = false;
                    let startY = 16;

                    // Tournament title
                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'bold');
                    doc.text(tournamentTitle.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

                    // Category + round bar
                    doc.setFillColor(41, 128, 185);
                    doc.rect(14, startY, usableWidth, 7, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.text(`RESULT – ${cat.name.toUpperCase()} – ROUND ${r}`, pageWidth / 2, startY + 4.5, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                    startY += 9;

                    const header2: string[] = ['S#', 'NAME', 'HCP', 'CLUB'];
                    const parRow: (string | number)[] = ['PAR', '', '', ''];

                    if (nineHole) {
                        header2.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            `DAY ${r} GROSS`);
                        parRow.push(...pars.slice(0, 9), parOut, '');
                    } else {
                        header2.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'IN',
                            `DAY ${r} GROSS`);
                        parRow.push(...pars.slice(0, 9), parOut, ...pars.slice(9, 18), parIn, '');
                    }
                    header2.push('TOTAL GROSS');
                    parRow.push('');

                    const body: any[][] = [];
                    cat.players.forEach((p, idx) => {
                        const row: any[] = [idx + 1, p.name, p.hcp, p.club];
                        const rd = p.rounds[r];
                        if (rd) {
                            if (nineHole) {
                                row.push(...rd.front9.map(s => s || ''), rd.out || '',
                                    rd.dayGross || '');
                            } else {
                                row.push(...rd.front9.map(s => s || ''), rd.out || '',
                                    ...rd.back9.map(s => s || ''), rd.in || '',
                                    rd.dayGross || '');
                            }
                        } else {
                            row.push(...Array(colsPerRound).fill(''));
                        }
                        row.push(p.totalGross || '');
                        body.push(row);
                    });

                    // Column widths
                    const colStyles: any = {
                        0: { cellWidth: 7 }, 1: { cellWidth: 30 }, 2: { cellWidth: 8 }, 3: { cellWidth: 20 }
                    };
                    let ci2 = 4;
                    for (let h = 0; h < 9; h++) colStyles[ci2++] = { cellWidth: 6.5 };
                    colStyles[ci2++] = { cellWidth: 8 };          // OUT
                    if (!nineHole) {
                        for (let h = 0; h < 9; h++) colStyles[ci2++] = { cellWidth: 6.5 };
                        colStyles[ci2++] = { cellWidth: 8 };      // IN
                    }
                    colStyles[ci2++] = { cellWidth: 12 };         // DAY GROSS
                    colStyles[ci2++] = { cellWidth: 13 };         // TOTAL GROSS
                    colStyles[1] = { ...colStyles[1], halign: 'left' };
                    colStyles[3] = { ...colStyles[3], halign: 'left' };

                    (doc as any).autoTable({
                        startY,
                        head: [header2, parRow],
                        body,
                        theme: 'grid',
                        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 6.5, halign: 'center', cellPadding: 1 },
                        bodyStyles: { fontSize: 6.5, halign: 'center', cellPadding: 1 },
                        columnStyles: colStyles,
                        tableWidth: usableWidth,
                    });

                    let finalY = (doc as any).lastAutoTable.finalY + 5;

                    // Positions table — only on the category's final round page (based on the overall event total)
                    if (ri === completedRounds.length - 1) {
                        const topGross = cat.players.filter(p => p.grossPos).sort((a, b) => a.grossPos - b.grossPos).slice(0, 3);
                        const posBody: any[][] = topGross.map(p => [`${this.ordinalSuffix(p.grossPos)} Gross`, p.name, p.hcp, p.club, p.totalGross, '']);
                        if (posBody.length > 0) {
                            (doc as any).autoTable({
                                startY: finalY,
                                head: [['Position', 'Name', 'HCP', 'Club', 'Gross']],
                                body: posBody,
                                theme: 'grid',
                                headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, halign: 'center', cellPadding: 1 },
                                bodyStyles: { fontSize: 7, cellPadding: 1 },
                                columnStyles: { 1: { halign: 'left' }, 3: { halign: 'left' } },
                                tableWidth: 100,
                                margin: { left: 14 },
                            });
                        }
                    }
                }
            }

            doc.save(`${tournamentTitle}_Gross_Results.pdf`);
        } finally {
            this.isGeneratingResultSheet = false;
        }
    }

    async generateNetResultSheetPDF() {
        this.isGeneratingResultSheet = true;
        this.showResultSheetMenu = false;
        try {
            const nineHole = await this.isNineHoleEvent();
            const { categories, completedRounds, pars } = this.buildResultSheetData(nineHole, 'net');
            if (completedRounds.length === 0) {
                this.snackBar.open('No completed rounds with scores found.', 'Close', { duration: 3000 });
                return;
            }

            const tournamentTitle = (this.fullTournament.title || 'Tournament').toString();
            // Columns for a single round: 9-hole = H1-H9 + OUT + DAY NET (11); 18-hole adds H10-H18 + IN (21)
            const colsPerRound = nineHole ? 11 : 21;

            // One round per page — a standard landscape page fits a single round's columns
            const pageWidth = nineHole ? 210 : 297;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, pageWidth] });
            const usableWidth = pageWidth - 28;

            const parOut = pars.slice(0, 9).reduce((a, b) => a + b, 0);
            const parIn = pars.slice(9, 18).reduce((a, b) => a + b, 0);

            let firstPage = true;

            for (const cat of categories) {
                for (let ri = 0; ri < completedRounds.length; ri++) {
                    const r = completedRounds[ri];
                    if (!firstPage) { doc.addPage(); }
                    firstPage = false;
                    let startY = 16;

                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'bold');
                    doc.text(tournamentTitle.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

                    doc.setFillColor(41, 128, 185);
                    doc.rect(14, startY, usableWidth, 7, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.text(`RESULT – ${cat.name.toUpperCase()} – ROUND ${r}`, pageWidth / 2, startY + 4.5, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                    startY += 9;

                    const header2: string[] = ['S#', 'NAME', 'HCP', 'CLUB'];
                    const parRow: (string | number)[] = ['PAR', '', '', ''];

                    if (nineHole) {
                        header2.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            `DAY ${r} NET`);
                        parRow.push(...pars.slice(0, 9), parOut, '');
                    } else {
                        header2.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'IN',
                            `DAY ${r} NET`);
                        parRow.push(...pars.slice(0, 9), parOut, ...pars.slice(9, 18), parIn, '');
                    }
                    header2.push('TOTAL GROSS', 'TOTAL NET');
                    parRow.push('', '');

                    const body: any[][] = [];
                    cat.players.forEach((p, idx) => {
                        const row: any[] = [idx + 1, p.name, p.hcp, p.club];
                        const rd = p.rounds[r];
                        if (rd) {
                            if (nineHole) {
                                row.push(...rd.front9.map(s => s || ''), rd.out || '',
                                    rd.dayNet || '');
                            } else {
                                row.push(...rd.front9.map(s => s || ''), rd.out || '',
                                    ...rd.back9.map(s => s || ''), rd.in || '',
                                    rd.dayNet || '');
                            }
                        } else {
                            row.push(...Array(colsPerRound).fill(''));
                        }
                        row.push(p.totalGross || '', p.totalNet || '');
                        body.push(row);
                    });

                    const colStyles: any = {
                        0: { cellWidth: 7 }, 1: { cellWidth: 30 }, 2: { cellWidth: 8 }, 3: { cellWidth: 20 }
                    };
                    let ci2 = 4;
                    for (let h = 0; h < 9; h++) colStyles[ci2++] = { cellWidth: 6.5 };
                    colStyles[ci2++] = { cellWidth: 8 };          // OUT
                    if (!nineHole) {
                        for (let h = 0; h < 9; h++) colStyles[ci2++] = { cellWidth: 6.5 };
                        colStyles[ci2++] = { cellWidth: 8 };      // IN
                    }
                    colStyles[ci2++] = { cellWidth: 12 };         // DAY NET
                    colStyles[ci2++] = { cellWidth: 13 };         // TOTAL GROSS
                    colStyles[ci2++] = { cellWidth: 13 };         // TOTAL NET
                    colStyles[1] = { ...colStyles[1], halign: 'left' };
                    colStyles[3] = { ...colStyles[3], halign: 'left' };

                    (doc as any).autoTable({
                        startY,
                        head: [header2, parRow],
                        body,
                        theme: 'grid',
                        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 6.5, halign: 'center', cellPadding: 1 },
                        bodyStyles: { fontSize: 6.5, halign: 'center', cellPadding: 1 },
                        columnStyles: colStyles,
                        tableWidth: usableWidth,
                    });

                    let finalY = (doc as any).lastAutoTable.finalY + 5;

                    // Positions table — only on the category's final round page (based on the overall event total)
                    if (ri === completedRounds.length - 1) {
                        const topNet = cat.players.filter(p => p.netPos).sort((a, b) => a.netPos - b.netPos).slice(0, 3);
                        const posBody: any[][] = topNet.map(p => [`${this.ordinalSuffix(p.netPos)} Net`, p.name, p.hcp, p.club, p.totalNet]);
                        if (posBody.length > 0) {
                            (doc as any).autoTable({
                                startY: finalY,
                                head: [['Position', 'Name', 'HCP', 'Club', 'Net']],
                                body: posBody,
                                theme: 'grid',
                                headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, halign: 'center', cellPadding: 1 },
                                bodyStyles: { fontSize: 7, cellPadding: 1 },
                                columnStyles: { 1: { halign: 'left' }, 3: { halign: 'left' } },
                                tableWidth: 100,
                                margin: { left: 14 },
                            });
                        }
                    }
                }
            }

            doc.save(`${tournamentTitle}_Net_Results.pdf`);
        } finally {
            this.isGeneratingResultSheet = false;
        }
    }

    async generateResultSheetExcel() { /* commented out for now */
        this.isGeneratingResultSheet = true;
        this.showResultSheetMenu = false;
        try {
            const nineHole = await this.isNineHoleEvent();
            const { categories, completedRounds, pars } = this.buildResultSheetData(nineHole);
            if (completedRounds.length === 0) {
                this.snackBar.open('No completed rounds with scores found.', 'Close', { duration: 3000 });
                return;
            }

            // Columns per round: 9-hole = H1-H9 + OUT + DAY GROSS + DAY NET (12); 18-hole adds H10-H18 + IN (22)
            const colsPerRound = nineHole ? 12 : 22;

            const ExcelJS = (await import('exceljs')).default;
            const tournamentTitle = (this.fullTournament.title || 'Tournament').toString();
            const parOut = pars.slice(0, 9).reduce((a, b) => a + b, 0);
            const parIn = pars.slice(9, 18).reduce((a, b) => a + b, 0);

            const wb = new ExcelJS.Workbook();
            wb.creator = 'GemGolfers';
            wb.created = new Date();

            // Helper for solid fill
            const fill = (argb: string): any => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
            const font = (opts: any): any => opts;
            const border = (style: string = 'thin', argb: string = 'FFCCCCCC'): any =>
                ({ top: { style, color: { argb } }, bottom: { style, color: { argb } }, left: { style, color: { argb } }, right: { style, color: { argb } } });

            for (const cat of categories) {
                // Sheet name max 31 chars
                const sheetName = cat.name.length > 31 ? cat.name.substring(0, 28) + '...' : cat.name;
                const ws = wb.addWorksheet(sheetName);

                const numRoundCols = completedRounds.length * colsPerRound;
                const totalCols = 4 + numRoundCols + 2;

                // Column widths
                const cols: any[] = [{ width: 5 }, { width: 28 }, { width: 7 }, { width: 18 }];
                for (let r = 0; r < completedRounds.length; r++) {
                    for (let h = 0; h < 9; h++) cols.push({ width: 5.5 });
                    cols.push({ width: 7 });                 // OUT
                    if (!nineHole) {
                        for (let h = 0; h < 9; h++) cols.push({ width: 5.5 });
                        cols.push({ width: 7 });             // IN
                    }
                    cols.push({ width: 13 });                // DAY GROSS
                    cols.push({ width: 13 });                // DAY NET
                }
                cols.push({ width: 14 }, { width: 14 });
                ws.columns = cols;

                // ── Row 1: Tournament title ──────────────────────────────────
                const titleRow = ws.addRow([tournamentTitle.toUpperCase()]);
                ws.mergeCells(1, 1, 1, totalCols);
                const tc = titleRow.getCell(1);
                tc.font = font({ bold: true, size: 14, color: { argb: 'FFFFFFFF' } });
                tc.fill = fill('FF175F9D');
                tc.alignment = { horizontal: 'center', vertical: 'middle' };
                titleRow.height = 24;

                // ── Row 2: Category header ───────────────────────────────────
                const catRow = ws.addRow([`RESULT – ${cat.name.toUpperCase()}`]);
                ws.mergeCells(2, 1, 2, totalCols);
                const cc = catRow.getCell(1);
                cc.font = font({ bold: true, size: 12, color: { argb: 'FFFFFFFF' } });
                cc.fill = fill('FF2980B9');
                cc.alignment = { horizontal: 'center', vertical: 'middle' };
                catRow.height = 20;

                // ── Row 3: Round group headers ───────────────────────────────
                const rGroupVals: any[] = ['', '', '', ''];
                for (const r of completedRounds) {
                    rGroupVals.push(`ROUND ${r}`);
                    for (let i = 0; i < colsPerRound - 1; i++) rGroupVals.push('');
                }
                rGroupVals.push('', '');
                const rGroupRow = ws.addRow(rGroupVals);
                rGroupRow.height = 18;
                let rStart = 5;
                for (const r of completedRounds) {
                    ws.mergeCells(3, rStart, 3, rStart + colsPerRound - 1);
                    const rc = rGroupRow.getCell(rStart);
                    rc.font = font({ bold: true, size: 10, color: { argb: 'FFFFFFFF' } });
                    rc.fill = fill('FF5DADE2');
                    rc.alignment = { horizontal: 'center', vertical: 'middle' };
                    rStart += colsPerRound;
                }

                // ── Row 4: Column headers ────────────────────────────────────
                const colHdrVals: any[] = ['S#', 'NAME', 'HCP', 'CLUB'];
                for (const r of completedRounds) {
                    if (nineHole) {
                        colHdrVals.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            `DAY ${r}\nGROSS`, `DAY ${r}\nNET`);
                    } else {
                        colHdrVals.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'OUT',
                            'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'IN',
                            `DAY ${r}\nGROSS`, `DAY ${r}\nNET`);
                    }
                }
                colHdrVals.push('TOTAL\nGROSS', 'TOTAL\nNET');
                const colHdrRow = ws.addRow(colHdrVals);
                colHdrRow.height = 28;
                colHdrRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    if (colNum > totalCols) return;
                    cell.font = font({ bold: true, size: 8.5, color: { argb: 'FFFFFFFF' } });
                    cell.fill = fill('FF1A5276');
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.border = border('thin', 'FF2980B9');
                });
                // TOTAL columns get green header
                colHdrRow.getCell(totalCols - 1).fill = fill('FF1E8449');
                colHdrRow.getCell(totalCols).fill = fill('FF1E8449');

                // ── Row 5: PAR row ───────────────────────────────────────────
                const parVals: any[] = ['PAR', '', '', ''];
                for (const _r of completedRounds) {
                    if (nineHole) {
                        parVals.push(...pars.slice(0, 9), parOut, '', '');
                    } else {
                        parVals.push(...pars.slice(0, 9), parOut, ...pars.slice(9, 18), parIn, '', '');
                    }
                }
                parVals.push('', '');
                const parRowObj = ws.addRow(parVals);
                parRowObj.height = 15;
                parRowObj.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    if (colNum > totalCols) return;
                    cell.font = font({ bold: true, size: 9, color: { argb: 'FF000000' } });
                    cell.fill = fill('FFD7DBDD');
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = { bottom: { style: 'medium', color: { argb: 'FF95A5A6' } } };
                });
                parRowObj.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

                // Medal/position background colors (gold, silver, bronze)
                const medalBgs = ['FFFFF9C4', 'FFE8E8E8', 'FFFDE3C0'];

                // ── Player rows ──────────────────────────────────────────────
                cat.players.forEach((p, idx) => {
                    const rowVals: any[] = [idx + 1, p.name, p.hcp, p.club];
                    for (const r of completedRounds) {
                        const rd = p.rounds[r];
                        if (rd) {
                            if (nineHole) {
                                rowVals.push(
                                    ...rd.front9.map((s: number) => s || ''), rd.out || '',
                                    rd.dayGross || '', rd.dayNet || ''
                                );
                            } else {
                                rowVals.push(
                                    ...rd.front9.map((s: number) => s || ''), rd.out || '',
                                    ...rd.back9.map((s: number) => s || ''), rd.in || '',
                                    rd.dayGross || '', rd.dayNet || ''
                                );
                            }
                        } else {
                            rowVals.push(...Array(colsPerRound).fill(''));
                        }
                    }
                    rowVals.push(p.totalGross || '', p.totalNet || '');

                    const playerRow = ws.addRow(rowVals);
                    playerRow.height = 15;
                    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF2F3F4';

                    playerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                        if (colNum > totalCols) return;
                        cell.font = font({ size: 9 });
                        cell.fill = fill(rowBg);
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.border = border('hair');
                    });

                    // Left-align name and club
                    playerRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
                    playerRow.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };

                    // Color OUT / IN / DAY columns per round
                    let colIdx = 5;
                    for (const _r of completedRounds) {
                        // OUT
                        const outC = playerRow.getCell(colIdx + 9);
                        outC.fill = fill('FFD6EAF8'); outC.font = font({ bold: true, size: 9 });
                        if (!nineHole) {
                            // IN
                            const inC = playerRow.getCell(colIdx + 19);
                            inC.fill = fill('FFD6EAF8'); inC.font = font({ bold: true, size: 9 });
                        }
                        // DAY GROSS / DAY NET (last two cols of the round block)
                        const dgC = playerRow.getCell(colIdx + colsPerRound - 2);
                        dgC.fill = fill('FFD5E8D4'); dgC.font = font({ bold: true, size: 9 });
                        colIdx += colsPerRound;
                    }

                    // TOTAL GROSS / TOTAL NET – dark green with white text
                    const tgC = playerRow.getCell(totalCols);
                    tgC.fill = fill('FF27AE60'); tgC.font = font({ bold: true, size: 9, color: { argb: 'FFFFFFFF' } });

                    // Medal for top-3 gross
                    if (p.grossPos && p.grossPos <= 3) {
                        playerRow.getCell(1).fill = fill(medalBgs[p.grossPos - 1]);
                        playerRow.getCell(1).font = font({ bold: true, size: 9 });
                    }
                });

                // ── Positions summary ────────────────────────────────────────
                ws.addRow([]);

                const posTitleRow = ws.addRow(['POSITIONS']);
                ws.mergeCells(ws.rowCount, 1, ws.rowCount, 6);
                posTitleRow.getCell(1).font = font({ bold: true, size: 10, color: { argb: 'FFFFFFFF' } });
                posTitleRow.getCell(1).fill = fill('FF2C3E50');
                posTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                posTitleRow.height = 16;

                const posHdrRow = ws.addRow(['POSITION', 'NAME', 'HCP', 'CLUB', 'GROSS', 'NET']);
                posHdrRow.height = 14;
                posHdrRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    if (colNum > 6) return;
                    cell.font = font({ bold: true, size: 9, color: { argb: 'FFFFFFFF' } });
                    cell.fill = fill('FF566573');
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                const topGross = cat.players.filter((p: any) => p.grossPos).sort((a: any, b: any) => a.grossPos - b.grossPos).slice(0, 3);
                const topNet = cat.players.filter((p: any) => p.netPos).sort((a: any, b: any) => a.netPos - b.netPos).slice(0, 3);

                topGross.forEach((p: any, i: number) => {
                    const row = ws.addRow([`${this.ordinalSuffix(p.grossPos)} GROSS`, p.name, p.hcp, p.club, p.totalGross, '']);
                    row.height = 14;
                    row.getCell(1).fill = fill(medalBgs[i]);
                    row.getCell(1).font = font({ bold: true, size: 9 });
                    row.getCell(2).font = font({ bold: true, size: 9 });
                    row.getCell(5).font = font({ bold: true, size: 9 });
                    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                        if (colNum > 6) return;
                        cell.alignment = { horizontal: colNum <= 4 ? 'left' : 'center', vertical: 'middle' };
                        cell.border = border('hair');
                    });
                });

                topNet.forEach((p: any, i: number) => {
                    const row = ws.addRow([`${this.ordinalSuffix(p.netPos)} NET`, p.name, p.hcp, p.club, '', p.totalNet]);
                    row.height = 14;
                    row.getCell(1).fill = fill(medalBgs[i]);
                    row.getCell(1).font = font({ bold: true, size: 9 });
                    row.getCell(2).font = font({ bold: true, size: 9 });
                    row.getCell(6).font = font({ bold: true, size: 9 });
                    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                        if (colNum > 6) return;
                        cell.alignment = { horizontal: colNum <= 4 ? 'left' : 'center', vertical: 'middle' };
                        cell.border = border('hair');
                    });
                });

                // Freeze first 5 rows and first 4 columns
                ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 5 }];
            }

            // Write buffer and trigger browser download
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer as ArrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tournamentTitle}_Results.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            this.isGeneratingResultSheet = false;
        }
    }
}
