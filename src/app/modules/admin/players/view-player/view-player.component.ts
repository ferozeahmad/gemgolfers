import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe, formatDate, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
    IPlayerHandicapWhs,
    Player,
    PlayerWHSHanidcap,
    UserSessionModel,
    handicap_change_log,
} from '../../../../shared/models/player.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Score } from 'app/shared/classes/score';
import { General, UniqueIdGenerator } from 'app/shared/classes/general';
import {
    handicapAllocation,
    Constants,
} from '../../../../shared/classes/general';
import { FlightScores } from 'app/shared/classes/FlightScores';
import { Flight } from 'app/shared/models/flight.model';
import { Course } from 'app/shared/classes/course';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ScoreStats } from 'app/shared/classes/ScoreStats';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { ApexOptions } from 'ng-apexcharts';
import { HandicapService } from 'app/shared/services/handicap.service';
import { DialogMergeComponent } from '../../dialogs/dialog-merge-profile/dialog-merge.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { environment } from 'environments/environment';
import { LogsService } from 'app/shared/services/logs.service';
import { Subject } from 'rxjs';

@Component({
    standalone: false,
    selector: 'app-view-player',
    templateUrl: './view-player.component.html',
    styleUrls: ['./view-player.component.scss'],
})
export class ViewPlayerComponent implements OnInit, OnDestroy {
    private playerID: string;
    loggedInuser: UserSessionModel;
    currentPlayer: Player;
    playerFlightScores: FlightScores[] = [];
    par3Avg: number;
    par4Avg: number;
    par5Avg: number;

    shotsBirdiesPercent: number;
    shotsBogeysPercent: number;
    shotsThreeOrHigherPercent: number;
    shotsParsPercent: number;
    shotsDoubleBogeysPercent: number;
    isLoading: boolean = true;
    redTeeHI: number;
    balckVetTeeHI: number;
    blueTeeHI: number;
    whiteTeeHI: number;
    blackTeeHI: number;
    barChartDataGross: any[] = [];
    GrossScoreDates: any[] = [];
    NetScoreDates: any[] = [];
    playerHandiData: any;
    barChartDataNet: any[] = [];
    handicapHistory: any[] = [];
    handicapHistoryDate: any[] = [];
    clubTitle: string;
    playerWHS: PlayerWHSHanidcap;
    playerWHSRound: any;
    playerWHSHistory: any;
    palyerWHSHandDif: number;
    CONGUgrossSource: MatTableDataSource<any>;
    CONGUgrossColumns = ['id', 'updatedAt', 'courseName', 'score'];
    CONGUnetSource: MatTableDataSource<any>;
    CONGUnetColumns = ['id', 'updatedAt', 'courseName', 'score'];
    dataSource: MatTableDataSource<any>;
    totalRounds: any = 0;
    ConguScoreLength: any = 0;
    _labels: any = [
        '06 Dec - 13 Dec',
        '14 Dec - 21 Dec',
        '22 Dec - 29 Dec',
        '30 Dec - 06 Jan',
    ];
    _series: any = [];
    displayedColumns = [
        'id',
        'tournamentTitle',
        'updatedAt',
        'score',
        'oldhandicap',
        'handicap',
    ];
    WHSSource: MatTableDataSource<any>;
    WHSColumns = [
        'id',
        'tournament',
        'playedAt',
        /* "round", */
        'score',
        'adjustedScore',
        'handicapDifferential',
        'handicapIndex',
        'tee',
    ];
    topDiff: any;
    bottomDiff: any;
    topDiff20: any;
    bottomDiff20: any;
    playerHandicapWhsList: any[] = [];
    usedForHandicap = [];
    memberQLs = [];
    handicapsAvailable: number;
    handicapsToUse: number;
    personLeads: any;
    showdata: Promise<boolean>;

    // ── Activity Log ──────────────────────────────────────────────────────
    activityGroups: { date: string; dateKey: string; activities: any[] }[] = [];
    activityLoading: boolean = false;
    activityDateFilter: string = '';

    get filteredActivityGroups() {
        if (!this.activityDateFilter) return this.activityGroups;
        return this.activityGroups.filter(g => g.dateKey === this.activityDateFilter);
    }

    // ── Password Reset ────────────────────────────────────────────────────
    showPasswordResetModal = false;
    resetPassword = '';
    resetConfirmPassword = '';
    showResetPassword = false;
    showResetConfirmPassword = false;
    isResettingPassword = false;
    resetPasswordError = '';
    // @ViewChild(MatPaginator) Wpaginator: MatPaginator;
    // @ViewChild(MatSort) Wsort: MatSort;
    // @ViewChild('fileInput') WfileInputVariable: ElementRef;

    // @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild('paginatorConguHistory') paginatorConguHistory: MatPaginator;
    @ViewChild('paginatorWHSHistory') paginatorWHSHistory: MatPaginator;
    @ViewChild('paginatorScoreConguHistory')
    paginatorScoreConguHistory: MatPaginator;
    @ViewChild('paginatorScoreWHSHistory')
    paginatorScoreWHSHistory: MatPaginator;
    @ViewChild('asort') asort: MatSort;
    @ViewChild('bsort') bsort: MatSort;
    @ViewChild('csort') csort: MatSort;
    @ViewChild('dsort') dsort: MatSort;

    chartVisitors: ApexOptions;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        public facadeService: FacadeService,
        private handicapService: HandicapService,
        private datepipe: DatePipe,
        private _localStorage: LocalStorageService,
        private logger: LogsService,
        private http: HttpClient
    ) { }

    // bar chart
    // public barChartOptions: any = {
    //     scaleShowVerticalLines: false,
    //     responsive: true,
    // };
    public barChartLabels: string[] = []; // = ['March 23, 2019', 'March 24, 2019', 'April 05, 2019', 'April 23, 2019', 'Feb 23, 2020', 'Feb 24, 2020', 'March 13, 2020'];
    // public barChartType: string;
    // public barChartLegend: boolean;

    // public barChartData: any[] = [
    //     {
    //         data: this.barChartDataGross,
    //         label: 'Gross',
    //         dates: this.GrossScoreDates,
    //         borderRadius: 10,
    //     },
    //     { data: this.barChartDataNet, label: 'Net', dates: this.NetScoreDates },
    // ];
    // // lineChart
    // public lineChartData: Array<any> = [
    //     { data: this.handicapHistory, label: 'Handicap' },
    // ];
    // public lineChartLabels: Array<any> = this.handicapHistoryDate;
    // public lineChartOptions: any = {
    //     responsive: true,
    // };
    // public lineChartColors: Array<any> = [
    //     // {
    //     //     // grey
    //     //     backgroundColor: 'rgba(148,159,177,0.2)',
    //     //     borderColor: 'rgba(148,159,177,1)',
    //     //     pointBackgroundColor: 'rgba(148,159,177,1)',
    //     //     pointBorderColor: '#fff',
    //     //     pointHoverBackgroundColor: '#fff',
    //     //     pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    //     // },
    //     {
    //         // grey
    //         backgroundColor: 'rgba(58,165,152,1)',
    //         borderColor: 'rgba(23,77,86,1)',
    //         pointBackgroundColor: 'rgba(148,159,177,1)',
    //         pointBorderColor: '#fff',
    //         pointHoverBackgroundColor: '#fff',
    //         pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    //     },
    //     {
    //         // dark grey
    //         backgroundColor: 'rgba(23,77,86,0.8)',
    //         borderColor: 'rgba(77,83,96,1)',
    //         pointBackgroundColor: 'rgba(77,83,96,1)',
    //         pointBorderColor: '#fff',
    //         pointHoverBackgroundColor: '#fff',
    //         pointHoverBorderColor: 'rgba(77,83,96,1)',
    //     },
    // ];
    // public lineChartLegend: boolean;
    // public lineChartType: string;

    async ngOnInit() {
        this.logger.log('ViewPlayerComponent initialized', 'INFO');
        try {
            this.logger.log('Getting Players Profile Data', "info");
            ////console.log(this.route.snapshot.paramMap.get("id"));
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            this.route.paramMap.subscribe((params) => {
                this.playerID = params.get('id');

                if (this.loggedInuser) {

                    //console.log(clubInfo);

                    this.clubTitle = this.loggedInuser?.club?.name ?? '';
                }
            });

            if (this.playerID) {
                //this.currentPlayer = <Player>await this.facadeService.getPlayerByID(this.playerID);
                ////console.log(this.currentPlayer);

                let courseID = this.loggedInuser?.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
                let courseRating: any = {
                    courseId: courseID,
                    courseHoleSets: 3,
                };
                this.playerWHS = await this.facadeService.getPlayerWHS(
                    this.playerID
                );

                this.playerWHSHistory = this.playerWHS['HandicapHistoryWhsQL'];
                //console.log(this.playerWHSHistory);

                this.usedForHandicap =
                    this.playerWHSHistory && this.playerWHSHistory.length > 0
                        ? (this.playerWHSHistory.find(h => !h.isFreezed)?.used_handicaps || [])
                        : [];

                this.playerHandicapWhsList = this.playerWHSHistory;
                this.topDiff20 =
                    this.playerHandicapWhsList.length > 0
                        ? this.playerHandicapWhsList[0].handicapDifferential
                        : null;
                //console.log('Lowest Handicap=' + this.topDiff20);

                // this.topDiff = this.playerHandicapWhsList.sort(
                //     this.ComparatorHandicapDifferentialAsc
                // );

                this.handicapsAvailable = this.playerHandicapWhsList.length;

                switch (this.handicapsAvailable) {
                    case 20:
                        this.handicapsToUse = 8;
                        break;
                    case 19:
                        this.handicapsToUse = 7;
                        break;
                    case 18:
                    case 17:
                        this.handicapsToUse = 6;
                        break;
                    case 16:
                    case 15:
                        this.handicapsToUse = 5;
                        break;
                    case 14:
                    case 13:
                    case 12:
                        this.handicapsToUse = 4;
                        break;
                    case 11:
                    case 10:
                    case 9:
                        this.handicapsToUse = 3;
                        break;
                    case 8:
                    case 7:
                    case 6:
                        this.handicapsToUse = 2;
                        break;
                    case 5:
                    case 4:
                    case 3:
                        this.handicapsToUse = 1;
                        break;
                    default:
                        this.handicapsToUse = 0;
                        break;
                }
                // this.topDiff =
                //     this.topDiff.length > this.handicapsToUse
                //         ? this.topDiff[this.handicapsToUse].handicapDifferential
                //         : 0;
                ////console.log("TopDiffer" + this.topDiff);
                ////console.log("Available Handicaps" + this.playerHandicapWhsList);
                ////console.log("Available Handicaps" + this.handicapsAvailable);
                ////console.log("Available Handicaps" + this.handicapsToUse);
                const slicedWhs = this.playerWHSHistory;
                //console.log(slicedWhs);
                // for (let whsItem in slicedWhs) {
                //     if (slicedWhs[+whsItem].combined_handicap) {
                //         slicedWhs.splice(
                //             +whsItem + 1,
                //             0,
                //             slicedWhs[whsItem].combined_handicap
                //         );
                //         slicedWhs[+whsItem].combined_handicap = null;
                //         slicedWhs[+whsItem].noBorder = true;
                //         slicedWhs[+whsItem].highlight = true;
                //         slicedWhs[+whsItem + 1].highlight = true;
                //     }

                //     // if(slicedWhs[+whsItem].is_combined)
                //     //   slicedWhs.splice(+whsItem, 1);
                // }
                for (let whsItem of slicedWhs) {
                    if (whsItem.combined_handicap) {
                        const index = slicedWhs.indexOf(whsItem);
                        slicedWhs.splice(index + 1, 0, whsItem.combined_handicap);
                        whsItem.combined_handicap = null;
                        whsItem.noBorder = true;
                        whsItem.highlight = true;
                        slicedWhs[index].highlight = true;
                        slicedWhs[index + 1].highlight = true;
                    }
                }

                this.personLeads = slicedWhs.filter(function (a) {
                    return !a.is_combined;
                }, 0);
                // this.personLeads = slicedWhs
                this.WHSSource = new MatTableDataSource(this.personLeads);

                this.WHSSource.paginator = this.paginatorWHSHistory;
                this.WHSSource.sort = this.bsort;

                let playerscore: any =
                    await this.facadeService.getPlayerFlightScores(this.playerID);
                console.log(playerscore);
                this.currentPlayer = playerscore.PlayerQL;
                this.totalRounds = playerscore.Aggegate.aggregate.totalCount;
                let memberQLs: any = playerscore.MemberQL;
                this.memberQLs = playerscore.MemberQL;
                this.playerWHSRound = await this.facadeService.getPlayerWHSRound(
                    courseRating
                );
                console.log(this.playerWHS);
                //console.log(this.playerWHSRound);
                let handicapIndex = this.currentPlayer[0]['handicapWhsIndex'];
                let rating = this.playerWHSRound['course_rating'];
                for (let item of rating) {
                    let slopeRating = item['slopeRating'];
                    let courseRating = item['courseRating'];
                    let coursePar = item['coursePar'];
                    if (item['tee'] == 'WHITE') {
                        this.whiteTeeHI =
                            (handicapIndex * (slopeRating / 113.0) +
                                (courseRating - coursePar)) *
                            0.95;
                        this.whiteTeeHI = Math.abs(Math.round(this.whiteTeeHI));
                    } else if (item['tee'] == 'BLACK') {
                        this.blackTeeHI =
                            (handicapIndex * (slopeRating / 113.0) +
                                (courseRating - coursePar)) *
                            0.95;
                        this.blackTeeHI = Math.abs(Math.round(this.blackTeeHI));
                    } else if (item['tee'] == 'BLUE') {
                        this.blueTeeHI =
                            (handicapIndex * (slopeRating / 113.0) +
                                (courseRating - coursePar)) *
                            0.95;
                        this.blueTeeHI = Math.abs(Math.round(this.blueTeeHI));
                    } else if (item['tee'] == 'RED') {
                        this.redTeeHI =
                            (handicapIndex * (slopeRating / 113.0) +
                                (courseRating - coursePar)) *
                            0.95;
                        this.redTeeHI = Math.abs(Math.round(this.redTeeHI));
                    } else if (item['tee'] == 'Black') {
                        this.balckVetTeeHI =
                            (handicapIndex * (slopeRating / 113.0) +
                                (courseRating - coursePar)) *
                            0.95;
                        this.balckVetTeeHI = Math.abs(Math.round(this.balckVetTeeHI));
                    }
                }
                // //console.log(this.redTeeHI);
                // //console.log(this.balckVetTeeHI);
                // //console.log(this.blackTeeHI);
                // //console.log(this.whiteTeeHI);
                // //console.log(this.blueTeeHI);

                //this.barChartDataGross = [];
                //this.barChartDataNet = [];
                this.playerHandiData = playerscore['HandicapQL'];
                const slicedCongu = this.playerHandiData

                this.dataSource = new MatTableDataSource(slicedCongu);
                this.dataSource.paginator = this.paginatorConguHistory;
                this.dataSource.sort = this.asort;
                let newScores: any[] = [];
                let newScore: any[] = [];
                for (let memberQL of memberQLs) {
                    let flightQL: any = memberQL.FlightQL;
                    let { name }: any = flightQL.course;

                    let scoresQLs: any = flightQL.ScoresQL;
                    if (scoresQLs.length == 0) {
                        // Do not add flights without score
                        continue;
                    }
                    ////console.log(scoresQLs);

                    let scores: any[] = [];

                    let grossScore: number = 0;
                    let netScore: number = 0;
                    let dates: string[] = [];
                    for (let scoreQL of scoresQLs) {
                        //ScoreQL scoreQL = scoresQL.getFragments().getScoreQL();
                        if (scoreQL.grossScore <= 0) {
                            continue;
                        }

                        let objScore: Score = new Score(
                            scoreQL.playerId,
                            scoreQL.playerHandicap,
                            scoreQL.hole.index,
                            scoreQL.hole.par,
                            scoreQL.grossScore
                        );
                        ////console.log(objScore)
                        grossScore += objScore.getGrossScore();
                        netScore += objScore.getNetScore(handicapAllocation.AS_IS);

                        //let score: Score;
                        //let detailQL: any = scoreQL.detailQL;
                        //if (detailQL != null) {
                        //score = QLModelMapper.scoreQlToModel(scoreQL, detailQL.getFragments().getScoreDetailQL());
                        //} else {
                        //score = QLModelMapper.scoreQlToModel(scoreQL);
                        //}
                        //scores.add(score);
                        scores.push(scoreQL);
                    }
                    ////console.log(dates);
                    ////console.log(scores);
                    ////console.log(this.barChartData);
                    ////console.log(flightQL);

                    // this.dataSource.sort = this.sort;

                    if (this.barChartLabels.length <= 10) {
                        this.barChartLabels.push(flightQL.date);
                        this.barChartDataGross.push(grossScore);
                        this.barChartDataNet.push(netScore);
                    }

                    let recentScores = {
                        date: flightQL.date,
                        gross: grossScore,
                        net: netScore,
                        courseName: name,
                    };
                    if (newScores.length <= 20) {
                        newScores.push(recentScores);
                    }
                    //this._labels.push(flightQL.date);

                    newScore.push(recentScores);

                    ////console.log(newScores);

                    ////console.log(this.barChartLabels);
                    ////console.log(this.barChartDataGross);
                    ////console.log(this.barChartDataNet);
                    ////console.log(this.barChartData);
                    this.ConguScoreLength = newScores.length;
                    this.CONGUgrossSource = new MatTableDataSource(newScores);
                    this.CONGUgrossSource.paginator =
                        this.paginatorScoreConguHistory;
                    this.CONGUgrossSource.sort = this.csort;
                    // this.dataSource.sort = this.sort;

                    this.CONGUnetSource = new MatTableDataSource(newScores);
                    this.CONGUnetSource.paginator = this.paginatorScoreWHSHistory;
                    this.CONGUnetSource.sort = this.dsort;

                    if (scores.length == 0) {
                        // Do not add flights without score
                        continue;
                    }

                    let flight: Flight = flightQL;

                    let courseQL = flightQL.CourseQL;
                    let course = courseQL;

                    this.playerFlightScores.push(
                        new FlightScores(flight, scores, course)
                    );
                }

                let dataMembersG: any[] = [];
                let dataMembersN: any[] = [];
                for (let obj of newScores) {
                    dataMembersG.push({
                        x: new Date(obj.date),
                        y: obj.gross,
                    });
                    dataMembersN.push({
                        x: new Date(obj.date),
                        y: obj.net,
                    });
                }
                this._series.push({
                    name: 'Gross',
                    data: dataMembersG,
                });
                this._series.push({
                    name: 'Net',
                    data: dataMembersN,
                });
                //console.log(this._series);
                //console.log(this._labels);

                ////console.log(this.playerFlightScores);
                let finalScoreStats: ScoreStats = new ScoreStats();
                for (let stats of this.playerFlightScores) {
                    finalScoreStats.addScoreStats(stats.scoreStats);
                }
                ////console.log(finalScoreStats);

                // this.par3Avg = finalScoreStats.par3Stats.getAvgScores();
                // this.par4Avg = finalScoreStats.par4Stats.getAvgScores();
                // this.par5Avg = finalScoreStats.par5Stats.getAvgScores();

                this.shotsBirdiesPercent = finalScoreStats.getShotsBirdiesPercent();
                this.shotsBogeysPercent = finalScoreStats.getShotsBogeysPercent();
                this.shotsThreeOrHigherPercent =
                    //     finalScoreStats.getShotsThreeOrHigherPercent();
                    this.shotsParsPercent = finalScoreStats.getShotsParsPercent();
                // this.shotsDoubleBogeysPercent =
                //     finalScoreStats.getShotsDoubleBogeysPercent();

                // this.barChartType = 'bar';
                // this.barChartLegend = true;

                // this.lineChartLegend = true;
                // this.lineChartType = 'line';

                this.isLoading = false;
                let flag: boolean = false;

                for (let handicap of playerscore.HandicapQL) {
                    if (!flag) {
                        this.handicapHistory.push(handicap.oldHandicap);
                        this.handicapHistoryDate.push('Initial');

                        flag = true;
                    }
                    this.handicapHistory.push(handicap.handicap);
                    this.handicapHistoryDate.push(
                        General.parseToDate(handicap.updatedAt).toDateString()
                    );
                }

                // //console.log(finalScoreStats);

                // //console.log(finalScoreStats.par3Stats.getAvgScores());
                // //console.log(finalScoreStats.par4Stats.getAvgScores());
                // //console.log(finalScoreStats.par5Stats.getAvgScores());
                // //console.log(finalScoreStats.getShotsBirdiesPercent());
                // //console.log(finalScoreStats.getShotsBogeysPercent());
                // //console.log(finalScoreStats.getShotsThreeOrHigherPercent());
                // //console.log(finalScoreStats.getShotsParsPercent());
                // //console.log(finalScoreStats.getShotsDoubleBogeysPercent());

                //this.currentPlayer = <Player>await this.facadeService.getPlayerByID(this.playerID);
                this.chartVisitors = {
                    chart: {
                        animations: {
                            speed: 400,
                            animateGradually: {
                                enabled: false,
                            },
                        },
                        fontFamily: 'inherit',
                        foreColor: 'inherit',
                        width: '100%',
                        height: '100%',
                        type: 'area',
                        toolbar: {
                            show: false,
                        },
                        zoom: {
                            enabled: false,
                        },
                    },
                    colors: ['#818CF8', '#38BDF8'],
                    dataLabels: {
                        enabled: false,
                    },
                    fill: {
                        colors: ['#312E81'],
                    },

                    series: this._series,
                    stroke: {
                        width: 2,
                    },
                    grid: {
                        show: true,
                        borderColor: '#334155',
                        padding: {
                            top: 10,
                            bottom: 0,
                            left: 0,
                            right: 0,
                        },
                        position: 'back',
                        xaxis: {
                            lines: {
                                show: true,
                            },
                        },
                    },
                    tooltip: {
                        followCursor: true,
                        theme: 'dark',
                        x: {
                            format: 'MMM dd, yyyy',
                        },
                        y: {
                            formatter: (value: number): string => `${value}`,
                        },
                    },
                    xaxis: {
                        axisBorder: {
                            show: false,
                        },
                        axisTicks: {
                            show: false,
                        },
                        crosshairs: {
                            stroke: {
                                color: '#475569',
                                dashArray: 0,
                                width: 2,
                            },
                        },
                        labels: {
                            offsetY: 0,
                            style: {
                                colors: '#CBD5E1',
                            },
                        },
                        tickAmount: 20,
                        tooltip: {
                            enabled: false,
                        },
                        type: 'datetime',
                    },
                    yaxis: {
                        axisTicks: {
                            show: false,
                        },
                        axisBorder: {
                            show: false,
                        },
                        min: (min): number => min - 5,
                        max: (max): number => max + 20,
                        tickAmount: 5,

                        show: false,
                    },
                };
                this.logger.log('Getting Players Profile Data Successfully', "info");
            } else {
                this.location.back();
            }
            this.showdata = Promise.resolve(true);
            this.loadPlayerActivity();
        } catch (error) {
            this.logger.log('Getting Players Data Failed', "error", error.toString());
        }
    }

    private loadPlayerActivity(): void {
        this.activityLoading = true;
        this.facadeService.getPlayerActivityByUserId(this.playerID).subscribe({
            next: (logs: any[]) => {
                const grouped: { [key: string]: { date: string; dateKey: string; activities: any[] } } = {};
                for (const log of logs) {
                    const d = new Date(log.dateTime);
                    const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
                    const date = d.toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    if (!grouped[dateKey]) grouped[dateKey] = { date, dateKey, activities: [] };
                    grouped[dateKey].activities.push(log);
                }
                this.activityGroups = Object.values(grouped);
                this.activityLoading = false;
            },
            error: () => { this.activityLoading = false; }
        });
    }

    // events
    public chartClicked(e: any): void {
        // //console.log(e);
    }

    public chartHovered(e: any): void {
        // //console.log(e);
    }

    ComparatorDate(a, b) {
        if (a['updatedAt'] < b['updatedAt']) return -1;
        if (a['updatedAt'] > b['updatedAt']) return 1;
        return 0;
    }

    ComparatorHandicapDifferentialAsc(a, b) {
        if (a['handicapDifferential'] < b['handicapDifferential']) return -1;
        if (a['handicapDifferential'] > b['handicapDifferential']) return 1;
        return 0;
    }

    ComparatorHandicapDifferentialDsc(a, b) {
        if (a['handicapDifferential'] > b['handicapDifferential']) return -1;
        if (a['handicapDifferential'] < b['handicapDifferential']) return 1;
        return 0;
    }

    public onCancel = () => {
        this.router.navigate(['/players']);
    };

    redirectToUpdate = (id: string) => {
        this.router.navigate(['/players/update/' + id]);
    };

    async delete(clubId: string, playerId: string) {
        //<boolean>await this.facadeService.deletePlayer(clubId, playerId);
        // for(let id of this.KGCIds) {
        //   <boolean>await this.facadeService.insertClubMember("-LUFS3FAg4OEhIiK0vgY", id);
        //   //console.log(id);
        // }
    }
    onPageFired(event) { }
    deletePlayer(playerId: string): void {
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to delete this record.',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                let clubId: string;

                if (this._localStorage.isClubAdmin())
                    clubId = this.loggedInuser.adminClubId;

                this.delete(clubId, playerId);

                //this.router.navigate(["/players"]);
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    isHandicapUsed(id: string) {
        ////console.log(this.usedForHandicap);
        let used: boolean = this.usedForHandicap.some((handicap) => {
            return (
                handicap.used_handicap_id == id ||
                handicap.combine_handicap_id == id
            );
        });
        return used;
    }
    playingTee(id: string) {
        // //console.log(id);
        let used = this.memberQLs.find((handicap) => {
            return handicap.FlightQL.tournamentId == id;
        });
        if (used) {
            let tee = this.playerWHSRound['course_tees'].filter(tee => { return tee.tee_id == used.tee_id });
            if (tee && tee.length > 0) {
                return tee[0].name_by_club ?? General.getPlayersTeesColourByCategory(this.currentPlayer[0].playerCategory);
            } else {
                General.getPlayersTeesColourByCategory(this.currentPlayer[0].playerCategory)
            }
        } else {
            General.getPlayersTeesColourByCategory(this.currentPlayer[0].playerCategory)
        }

    }
    isPanelty(flight) {
        ////console.log(this.usedForHandicap);
        if (flight && flight[0] != undefined) {
            let used: boolean = flight[0].members.some((element) => {
                return (
                    element.playerId == this.playerID && element.panelty == true
                );
            });
            return used;
        } else {
            return false;
        }
    }

    async changeWHSHandicap() {
        const dialogRef = this.dialog.open(DialogMergeComponent, {
            width: '350px',
            data: {
                text: 'Do you want to penalize this player?',
                isPanelty: true,
            },
        });
        dialogRef.afterClosed().subscribe(async (result) => {
            if (result != undefined && result != '') {
                let obj = {
                    playerId: this.playerID,
                    count: 40,
                    diffChange: result,
                };
                await this.handicapService
                    .adjustHandicapWHS(obj)
                    .then((response) => {
                        //console.log(response);

                        this.snackBar.open(
                            'Handicap Adjusted Sucessfully.',
                            'x',
                            {
                                duration: 2000,
                            }
                        );
                        window.location.reload();
                    })
                    .catch((err) => {
                        //console.log('error' + err);
                        this.snackBar.open('Error!.', 'x', {
                            duration: 5000,
                        });
                    });
            }
        });
    }

    async changeCONGUHandicap() {
        const dialogRef = this.dialog.open(DialogMergeComponent, {
            width: '350px',
            data: {
                text: 'Do you want to penalize this player?',
                isPanelty: true,
            },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            this.playerHandiData = this.playerHandiData.slice(0, 20);
            //console.log(this.playerHandiData);
            let tournamentId = this.playerHandiData[0].tournamentId;

            if (result) {
                let newHandicap = parseFloat(
                    (result + this.currentPlayer[0].handicap).toFixed(2)
                );

                try {
                    let response = await this.facadeService.updateConguHandicap(
                        this.playerID,
                        newHandicap,
                        tournamentId
                    );
                    let Hdate = new Date();

                    let latest_date: any = this.datepipe.transform(
                        Hdate,
                        'yyyy-MM-ddThh:mm:ss.SSSSSS+00:00'
                    );
                    const handicap_change_log: handicap_change_log = {
                        id: UniqueIdGenerator.generate(),
                        playerId: this.playerID,
                        newHandicap: newHandicap,
                        oldHandicap: this.currentPlayer[0].handicap,
                        whs: false,
                        dateTime: latest_date,
                        remarks: 'Panelty By Admin',
                        tournamentId: null,
                        updaterId: this.loggedInuser.id,
                    };

                    //console.log(handicap_change_log);
                    //this.handicapLog = handicap_change_log;

                    const remarksAdded = <boolean>(
                        await this.facadeService.AddHandicapRemarks(
                            handicap_change_log
                        )
                    );
                    if (response && remarksAdded) {
                        this.snackBar.open(
                            'Handicap Adjusted Successfully.',
                            'x',
                            {
                                duration: 1000,
                            }
                        );
                        window.location.reload();
                    }
                } catch (error) {
                    // Handle error
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.logger.log('ViewPlayerComponent destroyed', 'INFO');
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    public downloadAsPDFWHS() {
        let doc = new jsPDF();
        let col = [
            'Sr.',
            'Mem.No',
            'Date',
            'Score',
            'Adj.Score',
            'h/diff',
            'h/index',
            'tee',
        ];
        var rows = [];

        doc.setFontSize(17);
        doc.text(
            'WHS-Handicap Change-Log of ' +
            this.currentPlayer[0].firstName +
            ' ' +
            this.currentPlayer[0].lastName,
            14,
            15
        );
        doc.setFontSize(18);
        // doc.setTextColor(100);

        let count = 0;
        this.personLeads.forEach((element) => {
            count++;
            let panelty: boolean = false;

            let used: boolean = this.usedForHandicap.some((handicap) => {
                return (
                    handicap.used_handicap_id == element.Handicap_id ||
                    handicap.combine_handicap_id == element.Handicap_id
                );
            });
            let tee = this.playingTee(element.tournamentId);
            let temp = [
                count,
                this.currentPlayer[0].membershipNumber,
                formatDate(element.playedAt, 'mediumDate', 'en-US'),
                element.score,
                element.adjustedScore,
                Math.round(element.handicapDifferential * 10) / 10,
                Math.round(element.handicapIndex * 10) / 10,
                tee,
                element.highlight,
                used,
                element.panelty,
            ];
            rows.push(temp);
        });
        // From HTML
        //console.log(rows);

        let a = 1;
        (doc as any).autoTable(col, rows, {
            startY: 25,
            theme: 'grid',
            didParseCell: function (data) {
                if (data.row.raw[8] == true) {
                    data.cell.styles.fillColor = [195, 249, 230];
                }
                if (data.row.raw[10] == true) {
                    data.cell.styles.textColor = [255, 9, 9];
                }
                a++;
                if (data.row.raw[9] == true && a == 5) {
                    data.cell.styles.fillColor = [249, 187, 147];
                    ////console.log(1);
                    //a=false;
                }
                if (data.row.index == 1) {
                    ////console.log('assssssssssss');
                }
                //console.log(data.row.index);

                ////console.log(a);
            },
        });
        // (doc as any).autoTable({
        //   html: "#pdfTable",
        //   startY: 25,
        //   theme: "grid",
        // });
        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document
        //doc.save('flights.pdf');
    }
    public downloadAsPDFCongu() {
        let doc = new jsPDF();
        let col = [
            'Sr.',
            'Mem.No',
            'Date',
            'G.Score',
            'Adj.Gross',
            'Net',
            'Crnt H/C',
            "H'Cap Adj",
            'Exact H/C',
        ];
        var rows = [];
        doc.setFontSize(17);
        doc.text(
            'CONGU-Handicap Change-Log of ' +
            this.currentPlayer[0].firstName +
            ' ' +
            this.currentPlayer[0].lastName,
            14,
            15
        );
        doc.setFontSize(18);
        doc.setTextColor(100);

        let count = 0;
        this.playerHandiData = this.playerHandiData.slice(0, 20);
        this.playerHandiData.forEach((element) => {
            let panelty: boolean = false;
            count++;
            // if (
            //     element.tournamentQL.flights &&
            //     element.tournamentQL.flights[0] != undefined
            // ) {
            //     panelty = element.tournamentQL.flights[0].members.some(
            //         (element) => {
            //             return (
            //                 element.playerId == this.playerID &&
            //                 element.panelty == true
            //             );
            //         }
            //     );
            // }
            let temp = [
                count,
                this.currentPlayer[0].membershipNumber,
                formatDate(
                    element.tournamentQL.startDate,
                    'mediumDate',
                    'en-US'
                ),
                element.grossScore ? element.grossScore : '-',
                element.adjustedScore ? element.adjustedScore : '-',
                element.score,
                element.oldHandicap,
                Math.round((element.handicap - element.oldHandicap) * 10) / 10,
                element.handicap,
                element.panelty,
            ];
            rows.push(temp);
        });
        //From HTML
        (doc as any).autoTable(col, rows, {
            startY: 25,
            theme: 'grid',
            didParseCell: function (data) {
                if (data.row.raw[9] == true) {
                    data.cell.styles.textColor = [255, 9, 9];
                }
            },
        });

        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document
        //doc.save('flights.pdf');
    }
    //   updateCourseHandicap(course: Course, myHcIndex: number) {
    //     let holeSet: Array<CourseHoleSet> = (course.holeSets)? course.holeSets : new Array<CourseHoleSet>();

    //     let selectedHoleSet: number = (holeSet.length == 0)? 0 : 3;

    //     let ratingsAm: CourseRating = course.getRating(Tee.AMATEURS.getId(), selectedHoleSet) ?:
    //     CourseRating(course.id, Tee.AMATEURS.name, selectedHoleSet, 72.0f, 113,
    //         72, Tee.AMATEURS.getId())

    //     val ratingsSeniors: CourseRating = course.getRating(Tee.SENIORS.getId(), selectedHoleSet) ?:
    //     CourseRating(course.id, Tee.SENIORS.name, selectedHoleSet, 72.0f, 113,
    //         72, Tee.SENIORS.getId())

    //     val ratingsLadies: CourseRating = course.getRating(Tee.LADIES.getId(), selectedHoleSet) ?:
    //     CourseRating(course.id, Tee.LADIES.name, selectedHoleSet, 72.0f, 113,
    //         72, Tee.LADIES.getId())

    //     val ratingsPro: CourseRating = course.getRating(Tee.PROFESSIONALS.getId(), selectedHoleSet) ?:
    //     CourseRating(course.id, Tee.PROFESSIONALS.name, selectedHoleSet, 72.0f, 113,
    //         72, Tee.PROFESSIONALS.getId())

    //     for (aTee in course.courseTees){

    //         when(aTee.tee){
    //             Tee.AMATEURS -> {
    //                 if(aTee.color != Color.WHITE){
    //                     binding.viewContainerWhsOnTee.amTee.backgroundTintList = ColorStateList.valueOf(aTee.color)
    //                     binding.viewContainerWhsOnTee.amTee.setTextColor(if (isColorDark(aTee.color)) Color.WHITE else Color.BLACK)

    //                 }else{
    //                     binding.viewContainerWhsOnTee.amTee.background = resources.getDrawable(R.drawable.background_home_tee_white)
    //                     binding.viewContainerWhsOnTee.amTee.setTextColor(Color.BLACK)
    //                 }
    //             }
    //             Tee.LADIES -> {
    //                 if(aTee.color != Color.WHITE){
    //                     binding.viewContainerWhsOnTee.ladiesTee.backgroundTintList = ColorStateList.valueOf(aTee.color)
    //                     binding.viewContainerWhsOnTee.ladiesTee.setTextColor(if (isColorDark(aTee.color)) Color.WHITE else Color.BLACK)
    //                 }else{
    //                     binding.viewContainerWhsOnTee.ladiesTee.background = resources.getDrawable(R.drawable.background_home_tee_white)
    //                     binding.viewContainerWhsOnTee.ladiesTee.setTextColor(Color.BLACK)
    //                 }
    //             }
    //             Tee.SENIORS -> {
    //                 if(aTee.color != Color.WHITE){
    //                     binding.viewContainerWhsOnTee.seniorTee.backgroundTintList = ColorStateList.valueOf(aTee.color)
    //                     binding.viewContainerWhsOnTee.seniorTee.setTextColor(if (isColorDark(aTee.color)) Color.WHITE else Color.BLACK)
    //                 }else{
    //                     binding.viewContainerWhsOnTee.seniorTee.background = resources.getDrawable(R.drawable.background_home_tee_white)
    //                     binding.viewContainerWhsOnTee.seniorTee.setTextColor(Color.BLACK)
    //                 }
    //             }
    //             Tee.PROFESSIONALS -> {
    //                 if(aTee.color != Color.WHITE){
    //                     binding.viewContainerWhsOnTee.proTee.backgroundTintList = ColorStateList.valueOf(aTee.color)
    //                     binding.viewContainerWhsOnTee.proTee.setTextColor(if (isColorDark(aTee.color)) Color.WHITE else Color.BLACK)
    //                 }else{
    //                     binding.viewContainerWhsOnTee.proTee.background = resources.getDrawable(R.drawable.background_home_tee_white)
    //                     binding.viewContainerWhsOnTee.proTee.setTextColor(Color.BLACK)
    //                 }
    //             }
    //             Tee.VETERANS -> {
    // //                    binding.viewContainerWhsOnTee.amTee.backgroundTintList = ColorStateList.valueOf(aTee.color)
    //             }
    //         }
    //     }
    //     binding.viewContainerWhsOnTee.amTee.text = "${calculatePlayingHandicap(myHcIndex, ratingsAm.slopeRating.toDouble(),
    //         ratingsAm.courseRating.toDouble(), ratingsAm.coursePar).roundToInt()}"
    //     binding.viewContainerWhsOnTee.seniorTee.text = "${calculatePlayingHandicap(myHcIndex, ratingsSeniors.slopeRating.toDouble(),
    //         ratingsSeniors.courseRating.toDouble(), ratingsSeniors.coursePar).roundToInt()}"
    //     binding.viewContainerWhsOnTee.ladiesTee.text = "${calculatePlayingHandicap(myHcIndex, ratingsLadies.slopeRating.toDouble(),
    //         ratingsLadies.courseRating.toDouble(), ratingsLadies.coursePar).roundToInt()}"
    //     binding.viewContainerWhsOnTee.proTee.text = "${calculatePlayingHandicap(myHcIndex, ratingsPro.slopeRating.toDouble(),
    //         ratingsPro.courseRating.toDouble(), ratingsPro.coursePar).roundToInt()}"
    //     return
    // }

    get hasValidEmail(): boolean {
        const email = this.currentPlayer?.[0]?.email;
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    openPasswordResetModal() {
        this.resetPassword = '';
        this.resetConfirmPassword = '';
        this.resetPasswordError = '';
        this.showResetPassword = false;
        this.showResetConfirmPassword = false;
        this.showPasswordResetModal = true;
    }

    closePasswordResetModal() {
        this.showPasswordResetModal = false;
        this.resetPassword = '';
        this.resetConfirmPassword = '';
        this.resetPasswordError = '';
    }

    async submitPasswordReset() {
        this.resetPasswordError = '';

        if (!this.resetPassword || this.resetPassword.length < 8) {
            this.resetPasswordError = 'Password must be at least 8 characters.';
            return;
        }
        if (this.resetPassword !== this.resetConfirmPassword) {
            this.resetPasswordError = 'Passwords do not match.';
            return;
        }

        const email = this.currentPlayer[0]?.email;
        if (!email) {
            this.resetPasswordError = 'Player email not found.';
            return;
        }

        this.isResettingPassword = true;
        try {
            await this.http.post(
                `${environment.firebaseAdminUrl}/firebaseAdminSDK`,
                {
                    request: {
                        type: 'update',
                        UsersData: { email, password: this.resetPassword }
                    }
                }
            ).toPromise();

            this.closePasswordResetModal();
            this.snackBar.open('Password reset successfully.', 'Close', { duration: 3000 });
        } catch (err) {
            this.resetPasswordError = 'Failed to reset password. Please try again.';
        } finally {
            this.isResettingPassword = false;
        }
    }
}
//this.topDiff=this.topDiff[5].handicapDifferential;
////console.log("TopDiffer"+this.topDiff[5].handicapDifferential)
// this.bottomDiff = this.playerHandicapWhsList.sort(
//   this.ComparatorHandicapDifferentialDsc
// );
// //console.log("TopDiffer"+this.bottomDiff[0].handicapDifferential)
// this.bottomDiff =
//   this.bottomDiff.length > 0
//     ? this.bottomDiff[0].handicapDifferential
//     : null;
// //console.log(this.bottomDiff);
// let len = this.playerHandicapWhsList.length;
// this.bottomDiff20 =
//   this.playerHandicapWhsList.length <= 19
//     ? this.playerHandicapWhsList[len - 1].handicapDifferential
//     : null;
// //this.bottomDiff20 = (this.playerHandicapWhsList.length >= 20)? this.playerHandicapWhsList[19].handicapDifferential: this.playerHandicapWhsList[this.playerHandicapWhsList.length -1].handicapDifferential
// //console.log("Highest Handicap=" + this.bottomDiff20);
////console.log( "Before"+this.playerHandicapWhsList);

// //console.log("lenght=" + len);
// this.playerHandicapWhsList = this.playerWHSHistory.sort(
//   this.ComparatorHandicapDifferentialAsc
// );
// //console.log(this.playerHandicapWhsList);
// this.palyerWHSHandDif=this.playerWHS.handicapDifferential;
// //console.log(this.playerWHS.handicapDifferential)
// //console.log("HandicapDiference"+this.palyerWHSHandDif)
// //console.log(this.playerWHSHistory);
// //this.playerWHSHistory = this.playerWHSHistory.sort(this.ComparatorDate);
// //console.log(this.playerWHSHistory);
