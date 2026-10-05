import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApexOptions } from 'ng-apexcharts';
import { ProjectService } from 'app/modules/admin/dashboards/project/project.service';
import { TournamentsService } from 'app/shared/services/tournaments.service';
import { FacadeService } from 'app/shared/services/facade.service';
import {
    Constants,
    General,
    labels,
    labelsMembers,
    labelsPlayers,
    UniqueIdGenerator,
} from 'app/shared/classes/general';
import { trigger } from '@angular/animations';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { DatePipe } from '@angular/common';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddTourMainComponent } from '../../dialogs/dialog-add-tour-main/dialog-add-tour-main.component';
import { DialogPlayersComponent } from '../../dialogs/dialog-report-player/dialog-uncomplete.component';

@Component({
    standalone: false,
    selector: 'project',
    templateUrl: './project.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent implements OnInit, OnDestroy, AfterViewInit {
    chartGithubIssues: ApexOptions = {};
    chartTaskDistribution: ApexOptions = {};
    chartBudgetDistribution: ApexOptions = {};
    chartWeeklyExpenses: ApexOptions = {};
    chartMonthlyExpenses: ApexOptions = {};
    chartYearlyExpenses: ApexOptions = {};
    data: any;
    tournamentCounts: any;
    flightCounts: any = 0;
    flightCountsCal: any = 0;
    membersCountsCal: any = 0;
    flightCountsNotCal: any = 0;
    amateurCount: any = 0;
    seniorCount: any = 0;
    ladiesCount: any = 0;
    vateranCount: any = 0;
    yesterdayFlightCounts: any = 20;
    playerAddedTodayCounts: any = 2;
    playerCounts: any = 0;
    tourCounts: any = 0;
    leagueCounts: any = 0;
    showdata: Promise<boolean>;
    loading: boolean = false;
    _labels: any = labels;
    _labelsPlayers: any = labelsPlayers;
    _labelsMembers: any = labelsMembers;
    _series: any = [];
    _overview: any = [];
    _seriesPlayers: any = [];
    _overviewPlayers: any = [];
    selectedProject: string = 'ACME Corp. Backend App';
    loggedInuser: UserSessionModel;
    newRounds: any = 0;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clubLogo: string;
    tournaments: any;

    /**
     * Constructor
     */
    constructor(
        private _projectService: ProjectService,
        private _router: Router,
        public dialog: MatDialog,
        private _facadeService: FacadeService,
        private _datePipe: DatePipe, public _localStorage: LocalStorageService, private logger: LogsService
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // this.loggedInuser.adminClubId=localStorage.getItem('adminClubID');
        try {
            this.logger.log('Admin comes to Dashboard Page', "info");
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            this.clubLogo = this.loggedInuser.club && this.loggedInuser.club.logo ? this.loggedInuser.club.logo : 'e2esp.png';
            let currentDate = new Date();
            let tournamentCounts;
            let flightCounts;
            let playerCounts;
            let dataPlayers: any;
            let players: any;
            let getall: any;

            //this.showdata = Promise.resolve(true);
            this.loading = false;
            this._projectService.data$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((res) => {
                    this.logger.log('Getting Dashboard Data Successful', "info");
                    let getall = res.data;
                    console.log(getall);

                    if (this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin()) {

                        this.tournamentCounts = getall.TournamentCount.aggregate.count;
                        if (this.tournamentCounts > 6) {
                            this.tournaments = getall.TournamentQL.splice(0, 6);
                        } else {
                            this.tournaments = getall.TournamentQL;
                        }
                        this.flightCounts = getall.Count.aggregate.count;
                        this.playerCounts = getall.AggregateQL.aggregate.totalCount;
                        let myData: any[] = [];
                        let prevDate = null;
                        let memCounter = 0;
                        let totalFlights = 0;

                        let data = getall.TournamentsQLs.sort(this.ComparatorDate);
                        //let data = dataPlayers.TournamentsQL;
                        let i = 0;
                        let distinctMembers = new Set();
                        let distinctCategory = new Set();
                        const categoryCounts = {
                            'Amateurs': 0,
                            'Senior Amateurs': 0,
                            'Ladies': 0,
                            'Veterans': 0, // Add all possible categories
                            'others': 0, // Add all possible categories
                        }
                        this._labels = [];
                        for (let stats of data) {
                            if (stats.ended) {
                                this.flightCountsCal++;
                            }
                            if (stats.date == prevDate) {
                                memCounter =
                                    memCounter + (stats ? stats.MembersQL.length : 0);
                                totalFlights = totalFlights + 1;
                                for (let member of stats.MembersQL) {

                                    if (!distinctMembers.has(member.playerId)) {
                                        distinctMembers.add(member.playerId);
                                        if (categoryCounts[member.player.playerCategory] !== undefined) {
                                            categoryCounts[member.player.playerCategory]++;
                                        } else {
                                            categoryCounts['others']++;
                                        }
                                    }
                                }
                                myData[myData.length - 1].membersCount = memCounter;
                                myData[myData.length - 1].totalFlights = totalFlights;
                                prevDate = stats.date;
                            } else {
                                memCounter = 0;
                                totalFlights = 0;
                                memCounter =
                                    memCounter + (stats ? stats.MembersQL.length : 0);
                                totalFlights = totalFlights + 1;
                                for (let member of stats.MembersQL) {
                                    distinctMembers.add(member.playerId);
                                    if (categoryCounts[member.player.playerCategory] !== undefined) {
                                        categoryCounts[member.player.playerCategory]++;
                                    } else {
                                        categoryCounts['others']++;
                                    }
                                }
                                let obj = {
                                    date: stats.date,
                                    membersCount: memCounter,
                                    totalFlights: totalFlights,
                                };

                                myData.push(obj);
                                prevDate = stats.date;
                            }
                        }
                        // //console.log(distinctMembers.size);
                        // //console.log(distinctCategory);
                        // //console.log(categoryCounts);

                        // //console.log(myData);
                        this.membersCountsCal = distinctMembers.size;
                        let dataMembers: any[] = [];
                        let dataFlight: any[] = [];
                        let dataPlayers: any[] = [];
                        let dataPlayersCount: any[] = [];
                        for (let obj of myData) {
                            this._labels.push(General.getdate(obj.date));
                            dataMembers.push(obj.membersCount);
                            dataFlight.push(obj.totalFlights);
                        }
                        this._series = [
                            {
                                data: dataMembers,
                                name: 'Members',
                                type: 'line',
                            },
                            {
                                data: dataFlight,
                                name: 'Rounds',
                                type: 'column',
                            },
                        ];

                        // this.flightCountsNotCal =
                        //     getall.TournamentsQLs.length - this.flightCountsCal;
                        // //console.log(this._overview);

                        this._overview = {
                            newIssues: getall.TournamentsQLs.length,
                            closedIssues: this.membersCountsCal,
                            fixed: categoryCounts.Amateurs,
                            wontfix: categoryCounts['Senior Amateurs'],
                            reopened: categoryCounts.Ladies,
                            needstriage: categoryCounts.Veterans,
                        }
                        // //console.log(players);
                        if (this._localStorage.isSuperAdmin()) {
                            dataPlayers.push(getall.ClubAggregateQL.aggregate.count)
                            dataPlayers.push(getall.MobileAggregateQL.aggregate.count)
                            dataPlayers.push(getall.TrialAggregateQL.aggregate.count)
                            dataPlayers.push(getall.PremiumAggregateQL.aggregate.count)
                            dataPlayersCount.push(getall.ClubAggregateQL.aggregate.count)
                            dataPlayersCount.push(getall.MobileAggregateQL.aggregate.count)
                            dataPlayersCount.push(getall.TrialAggregateQL.aggregate.count)
                            dataPlayersCount.push(getall.PremiumAggregateQL.aggregate.count)
                            this._seriesPlayers = [
                                {
                                    data: dataPlayersCount,
                                    name: 'Players',
                                },
                            ];
                            this.tourCounts = getall.Tours.aggregate.count;
                            this.leagueCounts = getall.Leagues.aggregate.count;
                        } else {
                            dataPlayersCount.push(getall.club[0].Amateurs.aggregate['count'])
                            dataPlayersCount.push(getall.club[0].Senior_Amateurs.aggregate['count'])
                            dataPlayersCount.push(getall.club[0].Veterans.aggregate['count'])
                            dataPlayersCount.push(getall.club[0].Ladies.aggregate['count'])
                            // this._seriesPlayers = [
                            //     getall.club[0].Amateurs.aggregate['count'],

                            //     getall.club[0].Senior_Amateurs.aggregate['count'],

                            //     getall.club[0].Veterans.aggregate['count'],

                            //     getall.club[0].Ladies.aggregate['count'],
                            // ];
                            this._seriesPlayers = [
                                {
                                    data: dataPlayersCount,
                                    name: 'Players',
                                },
                            ];
                        }
                    } else {

                        // this.tournamentCounts = getall.TournamentsQLs.length;
                        const membersCatCounts = {
                            'Amateurs': 0,
                            'Senior Amateurs': 0,
                            'Ladies': 0,
                            'Veterans': 0, // Add all possible categories
                            'others': 0, // Add all possible categories
                        }
                        this.tournamentCounts = 0;
                        let latestTournament = [];
                        this.tournamentCounts = getall.TournamentsQLs.length;
                        for (let tour of getall.tour) {
                            for (let tournament of tour.tournaments) {
                                latestTournament.push(tournament);
                            }

                            this.flightCounts += tour.members.length;
                            for (let member of tour.members) {

                                if (member.player && member.player.playerCategory) {
                                    // Increment the count for the corresponding player category
                                    membersCatCounts[member.player.playerCategory]++;
                                }

                            }

                        }
                        for (let tour of getall.league) {
                            // for (let tournament of tour.tournaments) {
                            //     latestTournament.push(tournament);
                            // }
                            this.playerCounts += tour.members.length;
                            // for (let member of tour.members) {

                            //     if (member.player && member.player.playerCategory) {
                            //         // Increment the count for the corresponding player category
                            //         membersCatCounts[member.player.playerCategory]++;
                            //     }

                            // }

                        }
                        if (latestTournament.length > 6) {
                            this.tournaments = latestTournament.splice(0, 6);
                        } else {
                            latestTournament = getall.TournamentsQLs;
                            if (latestTournament.length > 6) {
                                this.tournaments = latestTournament.splice(0, 6);
                            } else {
                                this.tournaments = latestTournament;
                            }
                        }
                        //this.flightCounts = getall.tour.length;
                        let myData: any[] = [];
                        let prevDate = null;
                        let memCounter = 0;
                        let totalFlights = 0;
                        this.tourCounts = getall.tour.length;
                        this.leagueCounts = getall.league.length;
                        let data = getall.TournamentsQLs.sort(this.ComparatorDate);
                        //let data = dataPlayers.TournamentsQL;
                        let i = 0;
                        let distinctMembers = new Set();
                        let distinctCategory = new Set();
                        const categoryCounts = {
                            'Amateurs': 0,
                            'Senior Amateurs': 0,
                            'Ladies': 0,
                            'Veterans': 0, // Add all possible categories
                            'others': 0, // Add all possible categories
                        }
                        this._labels = [];
                        for (let stats of data) {
                            if (stats.startDate == prevDate) {
                                memCounter =
                                    memCounter + (stats ? stats.MembersQL.length : 0);
                                totalFlights = totalFlights + 1;
                                for (let member of stats.MembersQL) {

                                    if (!distinctMembers.has(member.playerId)) {
                                        distinctMembers.add(member.playerId);
                                        if (categoryCounts[member.player.playerCategory] !== undefined) {
                                            categoryCounts[member.player.playerCategory]++;
                                        } else {
                                            categoryCounts['others']++;
                                        }
                                    }
                                }
                                myData[myData.length - 1].membersCount = memCounter;
                                myData[myData.length - 1].totalFlights = totalFlights;
                                prevDate = stats.v;
                            } else {
                                memCounter = 0;
                                totalFlights = 0;
                                memCounter =
                                    memCounter + (stats ? stats.MembersQL.length : 0);
                                totalFlights = totalFlights + 1;
                                for (let member of stats.MembersQL) {
                                    distinctMembers.add(member.playerId);
                                    if (categoryCounts[member.player.playerCategory] !== undefined) {
                                        categoryCounts[member.player.playerCategory]++;
                                    } else {
                                        categoryCounts['others']++;
                                    }
                                }
                                let obj = {
                                    date: stats.startDate,
                                    membersCount: memCounter,
                                    totalFlights: totalFlights,
                                };

                                myData.push(obj);
                                prevDate = stats.startDate;
                            }
                        }
                        // //console.log(distinctMembers.size);
                        // //console.log(distinctCategory);
                        // //console.log(categoryCounts);

                        // //console.log(myData);
                        this.membersCountsCal = distinctMembers.size;
                        let dataMembers: any[] = [];
                        let dataFlight: any[] = [];
                        for (let obj of myData) {
                            this._labels.push(General.getdate(obj.date));
                            dataMembers.push(obj.membersCount);
                            dataFlight.push(obj.totalFlights);
                        }
                        this._series = [
                            {
                                data: dataMembers,
                                name: 'Members',
                                type: 'line',
                            },
                            {
                                data: dataFlight,
                                name: 'Rounds',
                                type: 'column',
                            },
                        ];

                        this._overview = {
                            newIssues: getall.TournamentsQLs.length,
                            closedIssues: this.membersCountsCal,
                            fixed: categoryCounts.Amateurs,
                            wontfix: categoryCounts['Senior Amateurs'],
                            reopened: categoryCounts.Ladies,
                            needstriage: categoryCounts.Veterans,
                        }
                        let dataPlayersCount: any[] = [];
                        // //console.log(players);
                        this._seriesPlayers = [
                            membersCatCounts.Amateurs,
                            membersCatCounts['Senior Amateurs'],
                            membersCatCounts.Veterans,
                            membersCatCounts.Ladies,
                            membersCatCounts.others,

                        ];

                        dataPlayersCount.push(categoryCounts.Amateurs)
                        dataPlayersCount.push(categoryCounts['Senior Amateurs'])
                        dataPlayersCount.push(categoryCounts.Veterans)
                        dataPlayersCount.push(categoryCounts.Ladies)

                        this._seriesPlayers = [
                            {
                                data: dataPlayersCount,
                                name: 'Players',
                            },
                        ];
                    }

                    // Prepare the chart data
                    this._prepareChartData();
                    this.loading = true;
                });
        } catch (error) {
            this.logger.log('Getting Dashboard Data Failed', "error", error.toString());
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    ngAfterViewInit(): void {
        this.loading = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    addNewRound() {
        this.logger.log('Admin Click on Add New Round in Dashboard Page', "info");
        this._router.navigate(['/dailyRounds/add-daily-rounds']);
    }
    addNewPlayer() {
        this.logger.log('Admin Click on Add New Player in Dashboard Page', "info");
        this._router.navigate([
            '/players/add'
        ]);
    }

    ComparatorDate(a, b) {
        if (a['date'] < b['date']) return -1;
        if (a['date'] > b['date']) return 1;
        return 0;
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    private _prepareChartData(): void {
        // Github issues
        //console.log('b');

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
            colors: ['#64748B', '#94A3B8'],
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
            labels: this._labels,
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

        //Task distribution
        this.chartTaskDistribution = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'bar',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
                // events: {
                //     dataPointSelection: (e, chart, options) => {
                //         // console.log(options);
                //         // console.log(this._labelsPlayers);
                //         console.log(this._labelsPlayers[options.dataPointIndex]);
                //         this._projectService.getPlayerDataDashbaord(this._labelsPlayers[options.dataPointIndex]).
                //             subscribe((res) => {
                //                 console.log(res);
                //                 const dialogRef = this.dialog.open(DialogPlayersComponent, {
                //                     data: { players: res.data?.player ?? res.data?.player_subscription, key: 'all', date: "" },
                //                 });
                //             })
                //     },
                // },
            },
            colors: ["#008FFB", "#FF4560", "#FEB019", "#00E396"],
            dataLabels: {
                enabled: true,
            },
            grid: {
                borderColor: 'var(--fuse-border)',
            },
            labels: this._localStorage.isSuperAdmin() || this._localStorage.isClubAdmin() ? this._labelsPlayers : this._labelsMembers,
            legend: {
                show: false,
            },

            plotOptions: {
                bar: {
                    columnWidth: '50%',
                    distributed: true,
                    borderRadius: 1,
                },
            },
            series: this._seriesPlayers,
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.75,
                    } as any,
                },
            },
            stroke: {
                width: [1, 0],
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
                        colors: [
                            "#008FFB", "#FF4560",

                            "#FEB019", "#00E396",

                        ],
                        fontSize: "12px",
                        fontWeight: "bold",
                    }
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
    async addnewTour() {
        this.logger.log('Admin Click on Add New Tour in Dashboard Page', "info");
        const dialogRef = this.dialog.open(DialogAddTourMainComponent);
        dialogRef.afterClosed().subscribe(async (result) => {
            this.logger.log(result ? 'Admin submits Add Tour dialog' : 'Admin cancelled Add Tour dialog', "info");
            //console.log(result);
            if (result) {
                let tour = {
                    id: UniqueIdGenerator.generate(),
                    adminId: this.loggedInuser.id,
                    name: result.title,
                    logo: null,
                    dateCreated: new Date().toISOString(),
                    startDate: result.startDate,
                    endDate: result.endDate,
                }
                this._facadeService.addTour(tour, result.file).subscribe((result) => {
                    this.logger.log(result ? 'Tour added successfully' : 'Adding Tour Failed', result ? "info" : "error", { id: tour.id, name: tour.name });
                    //console.log(result);
                    if (result) {

                    }
                })

            }

        })

    }
}
