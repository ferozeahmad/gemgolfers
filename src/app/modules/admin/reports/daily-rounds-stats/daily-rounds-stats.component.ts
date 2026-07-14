import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import { Player, UserSessionModel } from '../../../../shared/models/player.model';

import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Constants, General } from '../../../../shared/classes/general';
import { of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ApexOptions } from 'ng-apexcharts';
import { ceil } from 'lodash';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { DialogUncompletedComponent } from '../../dialogs/dialog-uncomplete-players/dialog-uncomplete.component';

@Component({
    standalone: false,
    selector: 'app-daily-rounds-stats',
    templateUrl: './daily-rounds-stats.component.html',
    styleUrls: ['./daily-rounds-stats.component.scss'],
})
export class DailyRoundsStatsComponent implements OnInit {
    chartBudgetDistribution: ApexOptions = {};
    chartGithubIssues: ApexOptions = {};
    Leaderboard: any;
    isLoading: boolean = false;
    isClubAdmin: boolean = false;
    showdata: Promise<boolean>;
    lastActiveTab = 1;
    noItemsInList = false;
    loggedInuser: UserSessionModel;
    scheduleForm: FormGroup;
    refresh: boolean = false;
    minDate: Date;
    maxDate: Date;
    startingHole: string;
    startTime: string;
    RoundDate: string;
    currentDate: string;
    Players: Player[] = [];
    file: File;
    arrayBuffer: any;
    customDate: any;
    customDate2: any;
    customValue: boolean;
    dailyStats: any[] = [];
    dailyStats2: any[] = [];
    dailyStats3: any[] = [];
    dailyStats4: any[] = [];
    dailyStats5: any[] = [];
    tournamentID: string;
    filterPlayer: string = '';
    filterCategory: string;
    HandicapIndex: any[] = [];
    weeklyRounds: any = [];
    barChartDataAmateur: any[] = [];
    barChartDataSenior: any[] = [];
    barChartDataProfessional: any[] = [];
    barChartDataLadies: any[] = [];
    barChartDataVeteran: any[] = [];
    barChartDataseniorsAmatuers: any[] = [];
    barChartDataOthers: any[] = [];
    barChartDataBefore1: any[] = [];
    barChartDataAfter1: any[] = [];
    barChartData9Holes: any[] = [];
    barChartData18Holes: any[] = [];
    barChartRedNine: any[] = [];
    barChartBlueNine: any[] = [];
    barChartYellowNine: any[] = [];
    barChartRedfrontBlueback: any[] = [];
    barChartBluefrontRedback: any[] = [];
    barChartRedfrontYellowback: any[] = [];
    barChartYellowfrontRedback: any[] = [];
    barChartBluefrontYellowback: any[] = [];
    barChartYellowfrontBlueback: any[] = [];

    singleRound: any[] = [];
    flightPlayers: any[] = [];
    findex = 0;
    showResult: boolean = false;
    showtable: boolean = true;
    matchPlayData: any[] = [];

    amateurDates: any[] = [];
    seniorDates: any[] = [];
    ladiesDates: any[] = [];
    veteransDates: any[] = [];
    seniorsAmatuersDates: any[] = [];
    professionalsDates: any[] = [];
    otherDates: any[] = [];

    before1Dates: any[] = [];
    after1Dates: any[] = [];
    holes9Dates: any[] = [];
    holes18Dates: any[] = [];

    redNineDates: any[] = [];
    blueNineDates: any[] = [];
    yellowNineDates: any[] = [];
    redFrontblueBackDates: any[] = [];
    blueFrontredBackDates: any[] = [];
    redFrontyellowBackDates: any[] = [];
    yellowFrontredBackDates: any[] = [];
    blueFrontyellowBackDates: any[] = [];
    yellowFrontblueBackDates: any[] = [];

    _labels: any = [];
    _series: any = [];
    _HolesSetsseries: any = [];
    _overview: any = [];
    _seriesPlayers: any = [];
    _overviewPlayers: any = [];

    dataSource: MatTableDataSource<any>;
    displayedColumns = [
        'id',
        'details',
        'date',
        'totalMembers',
        'amateurs',
        'ladies',
        'veterans',
        'seniorsAmatuers',
        // 'others',
    ];
    //['id','name', 'dates','updatedHandicap','details'];
    dataSource2: MatTableDataSource<any>;
    displayedColumns2 = ['id', 'date', 'totalMembers', 'before1PM', 'after1PM'];

    dataSource3: MatTableDataSource<any>;
    displayedColumns3 = [
        // 'id',
        // 'date',
        'totalMembers',
        'nineHoles',
        'eighteenHoles',
    ];

    dataSource4: MatTableDataSource<any>;
    displayedColumns4: string[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('fileInput') fileInputVariable: ElementRef;

    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private facadeService: FacadeService,
        private router: Router,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _localStorage: LocalStorageService,
        private _formBuilder: FormBuilder,
        private logger: LogsService
    ) { }

    public barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
    };
    public barChartLabels: string[] = []; // = ['March 23, 2019', 'March 24, 2019', 'April 05, 2019', 'April 23, 2019', 'Feb 23, 2020', 'Feb 24, 2020', 'March 13, 2020'];
    public barChartType: string;
    public barChartLegend: boolean;

    public barChartData: any[] = [
        {
            data: this.barChartDataAmateur,
            label: 'amateurs',
            dates: this.amateurDates,
        },
        {
            data: this.barChartDataSenior,
            label: 'seniors',
            dates: this.seniorDates,
        },
        {
            data: this.barChartDataLadies,
            label: 'ladies',
            dates: this.ladiesDates,
        },
        {
            data: this.barChartDataProfessional,
            label: 'professionals',
            dates: this.professionalsDates,
        },
        {
            data: this.barChartDataVeteran,
            label: 'veterans',
            dates: this.veteransDates,
        },
    ];

    public barChartOptions2: any = {
        scaleShowVerticalLines: false,
        responsive: true,
    };
    public barChartLabels2: string[] = []; // = ['March 23, 2019', 'March 24, 2019', 'April 05, 2019', 'April 23, 2019', 'Feb 23, 2020', 'Feb 24, 2020', 'March 13, 2020'];
    public barChartType2: string;
    public barChartLegend2: boolean;

    public barChartData2: any[] = [
        {
            data: this.barChartDataBefore1,
            label: 'before1PM',
            dates: this.before1Dates,
        },
        {
            data: this.barChartDataAfter1,
            label: 'after1PM',
            dates: this.after1Dates,
        },
    ];

    public barChartOptions3: any = {
        scaleShowVerticalLines: false,
        responsive: true,
    };

    public barChartLabels3: string[] = []; // = ['March 23, 2019', 'March 24, 2019', 'April 05, 2019', 'April 23, 2019', 'Feb 23, 2020', 'Feb 24, 2020', 'March 13, 2020'];
    public barChartType3: string;
    public barChartLegend3: boolean;

    public barChartData3: any[] = [
        {
            data: this.barChartData9Holes,
            label: '9holes',
            dates: this.holes9Dates,
        },
        {
            data: this.barChartData18Holes,
            label: '18holes',
            dates: this.holes18Dates,
        },
    ];

    public barChartOptions4: any = {
        scaleShowVerticalLines: false,
        responsive: true,
    };
    public barChartLabels4: string[] = []; // = ['March 23, 2019', 'March 24, 2019', 'April 05, 2019', 'April 23, 2019', 'Feb 23, 2020', 'Feb 24, 2020', 'March 13, 2020'];
    public barChartType4: string;
    public barChartLegend4: boolean;

    public barChartData4: any[] = [];

    public courseholesets: any[] = [];
    public courseHoleSetsData: any[] = [];

    async ngOnInit() {
        try {
            this.logger.log('Admin Come to Daily Round Report Page', "info");
            this.logger.log('Getting Daily Round Report Data', "info", "Last Seven Days");

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.Players = [];

            this.route.paramMap.subscribe((params) => {
                this.filterCategory = params.get('category');
            });

            this.isLoading = true;
            this.showResult = false;
            this.showtable = false;

            this.scheduleForm = this.fb.group({
                BookingDate: ['', [Validators.required]],
            });

            //console.log(this.scheduleForm);

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            // Fetch course hole sets data
            if (this.loggedInuser?.clubId) {
                const holeSetsResponse = await this.facadeService.getCourseHoleSetsForCourse(this.loggedInuser.courseId);
                this.courseHoleSetsData = holeSetsResponse?.course_hole_sets || [];
                this.courseholesets = this.courseHoleSetsData.map(hs => hs.displayName);
                this.displayedColumns.push(...this.courseholesets);
            }

            this.weeklyRounds = [];
            of(this.weeklyRounds)
                .pipe()
                .subscribe(
                    async (data) => {
                        var currentDate = new Date();
                        currentDate.setDate(currentDate.getDate());

                        var nxtDate = new Date();
                        nxtDate.setDate(nxtDate.getDate() + 7);

                        this.getDailyRounds(currentDate, this.endOfWeek());
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {

        }
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    playerList(players, key, date) {
        this.logger.log('Getting Daily Starter Report Player Wise', "info", date);
        const dialogRef = this.dialog.open(DialogUncompletedComponent, {
            data: { players: players, key: key, date: date },
        });
    }

    async getDailyRounds(fromDate: Date, toDate: Date) {
        let dailyRoundsData: any[] = [];
        let dataPlayers: any;
        this.singleRound.length = 0;
        this.flightPlayers = [];
        this.findex = 0;
        this.dailyStats = [];
        this.dailyStats2 = [];
        this.dailyStats3 = [];
        this.dailyStats4 = [];
        this.dailyStats5 = [];
        this.showtable = false;
        this.showResult = false;
        this.isLoading = true;
        let amateurs = 0;
        let seniorsAmatuers = 0;
        let ladies = 0;
        let professionals = 0;
        let veterans = 0;
        let nulls = 0;
        let totalFlights = 0;
        let active = 0;
        let ended = 0;
        let disclaimer = 0;
        let audioRecording = 0;
        let addedToday = 0;

        const holeSetCounts: { [key: string]: number } = {};
        this.courseHoleSetsData.forEach(hs => {
            holeSetCounts[hs.displayName] = 0;
        });

        let myData: any[] = [];
        let myData4: any[] = [];
        let prevDate = null;
        let memCounter = 0;

        if ((this._localStorage.isSuperAdmin())) {
            dataPlayers = await this.facadeService.getDailyRoundsStatAdmin(
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        } else {
            dataPlayers = await this.facadeService.getDailyRoundsStat(
                this.loggedInuser.id,
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        }
        //console.log(dataPlayers);
        for (let stats of dataPlayers.FlightsQL) {

            const timestamp = stats.date;
            if (timestamp === prevDate) {
                memCounter += stats ? 1 : 0;
                totalFlights++;
                amateurs += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Amateurs'
                        );
                    }).length
                    : 0;
                seniorsAmatuers += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Senior Amateurs'
                        );
                    }).length
                    : 0;
                ladies += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Ladies'
                        );
                    }).length
                    : 0;
                professionals += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Professionals'
                        );
                    }).length
                    : 0;
                veterans += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Veterans'
                        );
                    }).length
                    : 0;
                nulls += stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == null
                        );
                    }).length
                    : 0;

                const currentHoleSet = this.courseHoleSetsData.find(
                    (hs) => hs.holeSets === stats.courseHoleSets && hs.inverted === stats.courseHoleSetsInverted
                );
                if (currentHoleSet) {
                    holeSetCounts[currentHoleSet.displayName]++;
                }
                if (stats.MembersQL.length) {
                    for (let p of stats.MembersQL)
                        myData[myData.length - 1].allPlayersList.push({ ...p.PlayerQL, caddy: p.caddy });
                }
            } else {

                let allPlayersList = [];
                memCounter = stats ? 1 : 0;
                totalFlights = 1;

                if (stats.MembersQL.length) {
                    for (let p of stats.MembersQL) {
                        let score = 0;
                        if (p.scores && p.scores.length > 0) {
                            score += p.scores.reduce((acc, curr) => acc + (curr.grossScore || 0), 0);
                        }
                        allPlayersList.push({ ...p.PlayerQL, caddy: p.caddy, score: score });
                    }
                } 
                amateurs = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Amateurs'
                        );
                    }).length
                    : 0;
                seniorsAmatuers = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Senior Amateurs'
                        );
                    }).length
                    : 0;
                ladies = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Ladies'
                        );
                    }).length
                    : 0;
                professionals = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Professionals'
                        );
                    }).length
                    : 0;
                veterans = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == 'Veterans'
                        );
                    }).length
                    : 0;
                nulls = stats.MembersQL.length > 0
                    ? stats.MembersQL.filter((a) => {
                        return (
                            a.PlayerQL.playerCategory == null
                        );
                    }).length
                    : 0;

                // Reset and then set counts for the new date
                this.courseHoleSetsData.forEach(hs => {
                    holeSetCounts[hs.displayName] = 0;
                });
                const newHoleSet = this.courseHoleSetsData.find(
                    (hs) => hs.holeSets === stats.courseHoleSets && hs.inverted === stats.courseHoleSetsInverted
                );
                if (newHoleSet) {
                    holeSetCounts[newHoleSet.displayName]++;
                }
                let obj = {
                    date: timestamp,
                    membersCount: memCounter,
                    totalFlights: totalFlights,
                    amateurs: amateurs,
                    allPlayersList: allPlayersList,
                    seniorsAmatuers: seniorsAmatuers,
                    seniors: seniorsAmatuers,
                    ladies: ladies,
                    professionals: professionals,
                    veterans: veterans,
                    nulls: nulls,

                };
                let obj4 = {
                    date: timestamp,
                    ...holeSetCounts
                }

                myData.push(obj);
                myData4.push(obj4);
                prevDate = timestamp;
            }

            myData[myData.length - 1].membersCount = memCounter;
            myData[myData.length - 1].totalFlights = totalFlights;
            myData[myData.length - 1].amateurs = amateurs;
            myData[myData.length - 1].seniors = seniorsAmatuers;
            myData[myData.length - 1].seniorsAmatuers = seniorsAmatuers;
            myData[myData.length - 1].ladies = ladies;
            myData[myData.length - 1].professionals = professionals;
            myData[myData.length - 1].veterans = veterans;
            myData[myData.length - 1].nulls = nulls;

            myData4[myData.length - 1] = {
                date: timestamp,
                ...holeSetCounts
            };
        }
        //console.log(myData);
        //console.log(myData4);
        const mergedMap = new Map<string, any>();

        // First pass: add all myData rows keyed by date
        myData.forEach(item => {
            mergedMap.set(item.date, { ...item });
        });

        // Second pass: merge myData4 rows into the same date entry
        myData4.forEach(item => {
            if (mergedMap.has(item.date)) {
                mergedMap.set(item.date, { ...mergedMap.get(item.date), ...item });
            } else {
                // date only exists in myData4, add it as a new row
                mergedMap.set(item.date, { ...item });
            }
        });

        const newData = Array.from(mergedMap.values());

        this.dataSource = null;
        this.dataSource = new MatTableDataSource(newData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // this.dataSource4 = null;
        // this.dataSource4 = new MatTableDataSource(myData4);

        // // //console.log(this.dataSource4)
        // this.dataSource4.paginator = this.paginator;
        // this.dataSource4.sort = this.sort;


        this.barChartLabels = [];
        this.barChartDataAmateur = [];
        this.barChartDataSenior = [];
        this.barChartDataProfessional = [];
        this.barChartDataLadies = [];
        this.barChartDataVeteran = [];
        this.barChartDataseniorsAmatuers = [];
        this.barChartDataOthers = [];
        this.amateurDates = [];
        this.seniorDates = [];
        this.ladiesDates = [];
        this.veteransDates = [];
        this.professionalsDates = [];
        this.seniorsAmatuersDates = [];
        this.otherDates = [];
        let dataMembers: any[] = [];
        let dataMembers4: any[] = [];
        let index4 = 0;

        const totalHoleSetCounts: { [key: string]: number } = {};
        this.courseHoleSetsData.forEach(hs => {
            totalHoleSetCounts[hs.displayName] = 0;
        });

        //console.log(myData);
        for (let data of myData) {
            dataMembers.push(data.membersCount);
            this.barChartLabels.push(data.date);
            this.barChartDataAmateur.push(data.amateurs);
            this.barChartDataSenior.push(data.seniors);
            this.barChartDataProfessional.push(data.professionals);
            this.barChartDataLadies.push(data.ladies);
            this.barChartDataVeteran.push(data.veterans);
            this.barChartDataseniorsAmatuers.push(data.seniorsAmatuers);
            this.barChartDataOthers.push(data.nulls);

            const row4 = myData4[index4];
            this.courseHoleSetsData.forEach(hs => {
                totalHoleSetCounts[hs.displayName] += row4[hs.displayName] || 0;
            });

            if (data.amateurs > 0) {
                this.amateurDates.push(data.date);
            } else if (data.seniors > 0) {
                this.seniorDates = data.date;
            } else if (data.professionals > 0) {
                this.professionalsDates.push(data.date);
            } else if (data.veterans > 0) {
                this.veteransDates.push(data.date);
            } else if (data.ladies > 0) {
                this.ladiesDates.push(data.date);
            } else if (data.seniorsAmatuers > 0) {
                this.seniorsAmatuersDates.push(data.date);
            } else if (data.nulls > 0) {
                this.otherDates.push(data.date);
            }
            index4++;
        }

        this.courseHoleSetsData.forEach(hs => {
            dataMembers4.push(totalHoleSetCounts[hs.displayName]);
        });

        this._HolesSetsseries = [
            {
                data: dataMembers4,
                name: 'Hole-Set%',
            },
        ];
        this._series['0'] = [
            {
                data: dataMembers,
                name: 'Members',
                type: 'line',
            },
            {
                data: this.barChartDataAmateur,
                name: 'amateurs',
                type: 'column',
            },
            {
                data: this.barChartDataSenior,
                name: 'seniors',
                type: 'column',
            },
            {
                data: this.barChartDataLadies,
                name: 'ladies',
                type: 'column',
            },
            {
                data: this.barChartDataProfessional,
                name: 'professionals',
                type: 'column',
            },
            {
                data: this.barChartDataVeteran,
                name: 'veterans',
                type: 'column',
            },
            {
                data: this.barChartDataVeteran,
                name: 'seniors Amateurs',
                type: 'column',
            },
            {
                data: this.barChartDataOthers,
                name: 'others',
                type: 'column',
            },
        ];

        //console.log(this.barChartData);

        this.barChartType = 'bar';
        this.barChartLegend = true;

        this.barChartData4 = this.courseHoleSetsData.map(hs => {
            const dataCounts = myData4.map(row => row[hs.displayName] || 0);
            const activeDates = myData4
                .filter(row => (row[hs.displayName] || 0) > 0)
                .map(row => row.date);
            return {
                data: dataCounts,
                label: hs.displayName,
                dates: activeDates
            };
        });

        this.chart();
        this.showdata = Promise.resolve(true);

        // for(let stats of this.dailyStats3) {

        //   if(stats.date == prevDate){

        //     memCounter = memCounter + stats.membersCount;
        //     if(stats.before1PM == true){
        //     before1PM = before1PM + 1;
        //     }
        //     else{
        //       after1PM = after1PM + 1;
        //     }

        //     myData2[myData2.length - 1].membersCount = memCounter;
        //     myData2[myData2.length - 1].before1PM = before1PM;
        //     myData2[myData2.length - 1].after1PM = after1PM;

        //     prevDate = stats.date;
        //   }
        //   else {
        //     memCounter = 0;
        //     before1PM = 0;
        //     after1PM = 0;

        //     memCounter = memCounter + stats.membersCount;
        //     if(stats.before1PM == true){
        //       before1PM = before1PM + 1;
        //       }
        //       else{
        //         after1PM = after1PM + 1;
        //       }

        //     let obj =  {
        //       date: stats.date,
        //       membersCount: memCounter,
        //       before1PM: before1PM,
        //       after1PM: after1PM
        //     }

        //     myData2.push(obj);
        //     prevDate = stats.date;
        //   }
        // }

        //     //console.log(myData2);

        //     this.dataSource2 = null;

        //     this.dataSource2 = new MatTableDataSource(myData2);

        //     //console.log(this.dataSource2)
        //     this.dataSource2.paginator = this.paginator;
        //     this.dataSource2.sort = this.sort;

        //     for(let data of myData2){

        //       this.barChartLabels2.push(data.date);
        //       this.barChartDataBefore1.push(data.before1PM);
        //       this.barChartDataAfter1.push(data.after1PM);

        //       if(data.before1PM > 0)
        //       {
        //         this.before1Dates.push(data.date);
        //       }
        //       else if(data.after1PM > 0)
        //       {
        //         this.after1Dates.push(data.date)
        //       }

        //   }

        //   this.barChartType2 = 'bar';
        //   this.barChartLegend2 = true;

        //     for(let stats of this.dailyStats4) {

        //       if(stats.date == prevDate){

        //         memCounter = memCounter + stats.membersCount;

        //         if(stats.nineHoles == true){
        //           nineHoles = nineHoles + 1;
        //           }
        //           else{
        //             eighteenHoles = eighteenHoles + 1;
        //           }

        //         myData3[myData3.length - 1].membersCount = memCounter;
        //         myData3[myData3.length - 1].nineHoles = nineHoles;
        //         myData3[myData3.length - 1].eighteenHoles = eighteenHoles;

        //         prevDate = stats.date;
        //       }
        //       else {
        //         memCounter = 0;
        //         nineHoles = 0;
        //         eighteenHoles = 0;

        //         memCounter = memCounter + stats.membersCount;

        //         if(stats.nineHoles == true){
        //           nineHoles = nineHoles + 1;
        //           }
        //           else{
        //             eighteenHoles = eighteenHoles + 1;
        //           }

        //         let obj =  {
        //           date: stats.date,
        //           membersCount: memCounter,
        //           nineHoles: nineHoles,
        //           eighteenHoles: eighteenHoles
        //         }

        //         myData3.push(obj);
        //         prevDate = stats.date;
        //       }
        //     }

        //         //console.log(myData3);

        //         this.dataSource3 = null;
        //         this.dataSource3 = new MatTableDataSource(myData3);

        //         //console.log(this.dataSource3)
        //         this.dataSource3.paginator = this.paginator;
        //         this.dataSource3.sort = this.sort;

        //         for(let data of myData3){

        //           this.barChartLabels3.push(data.date);
        //           this.barChartData9Holes.push(data.nineHoles);
        //           this.barChartData18Holes.push(data.eighteenHoles);

        //           if(data.nineHoles > 0)
        //           {
        //             this.holes9Dates.push(data.date);
        //           }
        //           else if(data.eighteenHoles > 0)
        //           {
        //             this.holes18Dates.push(data.date)
        //           }

        //       }

        //       this.barChartType3 = 'bar';
        //       this.barChartLegend3 = true;

        // for(let stats of this.dailyStats5) {

        //   if(stats.date == prevDate){

        //     memCounter = memCounter + stats.membersCount;
        //     redNine =  (stats.redNine.length !== 0)? Number(redNine) + Number(1) : 0;
        //     blueNine = (stats.blueNine.length !== 0)? Number(blueNine) + Number(1) : 0 ;
        //     yellowNine = (stats.yellowNine.length !== 0)? Number(yellowNine) + Number(1) : 0;
        //     redfrontBlueback = (stats.redfrontBlueback.length !== 0)? Number(redfrontBlueback) + Number(1) : 0;
        //     blueFrontRedback = (stats.blueFrontRedback.length !== 0)? Number(blueFrontRedback) + Number(1) : 0;
        //     redFrontYellowback = (stats.redFrontYellowback.length !== 0)? Number(redFrontYellowback) + Number(1) : 0;
        //     yellowFrontRedback = (stats.yellowFrontRedback.length !== 0)? Number(yellowFrontRedback) + Number(1) : 0;
        //     blueFrontYellowback = (stats.blueFrontYellowback.length !== 0)? Number(blueFrontYellowback) + Number(1) : 0;
        //     yellowFrontBlueback = (stats.yellowFrontBlueback.length !== 0)? Number(yellowFrontBlueback) + Number(1) : 0;

        //     myData4[myData4.length - 1].membersCount = memCounter;
        //     myData4[myData4.length - 1].redNine = redNine;
        //     myData4[myData4.length - 1].blueNine = blueNine;
        //     myData4[myData4.length - 1].yellowNine = yellowNine;
        //     myData4[myData4.length - 1].redfrontBlueback = redfrontBlueback ;
        //     myData4[myData4.length - 1].blueFrontRedback = blueFrontRedback ;
        //     myData4[myData4.length - 1].redFrontYellowback = redFrontYellowback ;
        //     myData4[myData4.length - 1].yellowFrontRedback = yellowFrontRedback ;
        //     myData4[myData4.length - 1].blueFrontYellowback= blueFrontYellowback;
        //     myData4[myData4.length - 1].yellowFrontBlueback= yellowFrontBlueback;

        //     prevDate = stats.date;
        //   }
        //   else {

        //     memCounter = 0;
        //     redNine = 0;
        //     blueNine = 0;
        //     yellowNine = 0;
        //     redfrontBlueback = 0;
        //     blueFrontRedback  = 0;
        //     redFrontYellowback  = 0;
        //     yellowFrontRedback  = 0;
        //     blueFrontYellowback = 0;
        //     yellowFrontBlueback = 0;

        //     memCounter = memCounter + stats.membersCount;
        //     redNine =  redNine + stats.redNine;
        //     blueNine = blueNine + stats.blueNine;
        //     yellowNine = yellowNine + stats.yellowNine;
        //     redfrontBlueback = redfrontBlueback + stats.redfrontBlueback;
        //     blueFrontRedback = blueFrontRedback + stats.blueFrontRedback;
        //     redFrontYellowback = redFrontYellowback + stats.redFrontYellowback;
        //     yellowFrontRedback = yellowFrontRedback + stats.yellowFrontRedback;
        //     blueFrontYellowback = blueFrontYellowback + stats.blueFrontYellowback;
        //     yellowFrontBlueback = yellowFrontBlueback + stats.yellowFrontBlueback

        //     let obj =  {
        //       date: stats.date,
        //       membersCount: memCounter,
        //       redNine :  redNine,
        //       blueNine : blueNine,
        //       yellowNine : yellowNine,
        //       redfrontBlueback : redfrontBlueback,
        //       blueFrontRedback : blueFrontRedback,
        //       redFrontYellowback : redFrontYellowback,
        //       yellowFrontRedback : yellowFrontRedback,
        //       blueFrontYellowback : blueFrontYellowback,
        //       yellowFrontBlueback : yellowFrontBlueback
        //     }

        //     myData4.push(obj);
        //     prevDate = stats.date;
        //   }
        // }

        //             //console.log(myData4);

        //             this.dataSource4 = null;
        //             this.dataSource4 = new MatTableDataSource(myData4);

        //             //console.log(this.dataSource4)
        //             this.dataSource4.paginator = this.paginator;
        //             this.dataSource4.sort = this.sort;

        //             for(let data of myData4){

        // this.barChartLabels4.push(data.date);
        // this.barChartRedNine.push(data.redNine);
        // this.barChartYellowNine.push(data.yellowNine);
        // this.barChartBlueNine.push(data.blueNine);
        // this.barChartRedfrontBlueback.push(data.redfrontBlueback);
        // this.barChartBluefrontRedback.push(data.bluefrontRedback);
        // this.barChartRedfrontYellowback.push(data.RedfrontYellowback);
        // this.barChartYellowfrontRedback.push(data.yellowfrontRedback);
        // this.barChartBluefrontYellowback.push(data.blueFrontYellowback);
        // this.barChartYellowfrontBlueback.push(data.yellowFrontBlueback);

        // if(data.redNine > 0)
        // {
        //   this.redNineDates.push(data.date)
        // }
        // else if(data.yellowNine > 0)
        // {
        //   this.yellowNineDates = data.date
        // }
        // else if(data.blueNine > 0)
        // {
        //   this.blueNineDates.push(data.date)
        // }

        // else if(data.redfrontBlueback > 0)
        // {
        //   this.redFrontblueBackDates.push(data.date)
        // }

        // else if(data.bluefrontRedback > 0)
        // {
        //   this.blueFrontredBackDates.push(data.date)
        // }

        // else if(data.redfrontYellowback > 0)
        // {
        //   this.redFrontyellowBackDates.push(data.date)
        // }

        // else if(data.yellowfrontRedback > 0)
        // {
        //   this.yellowFrontredBackDates.push(data.date)
        // }

        // else if(data.bluefrontYellowback > 0)
        // {
        //   this.blueFrontyellowBackDates.push(data.date)
        // }

        // else if(data.yellowfrontblueback > 0)
        // {
        //   this.yellowFrontblueBackDates.push(data.date)
        // }

        //           }

        //           this.barChartType4 = 'bar';
        //           this.barChartLegend4 = true;
    }

    Comparator(a, b) {
        if (a['date'] < b['date']) return -1;
        if (a['date'] > b['date']) return 1;
        return 0;
    }

    endOfWeek() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 7));
    }

    endOfMonth() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 29));
    }

    Dailysetup(selectedValue) {
        this.logger.log('Getting Daily Round Report Data by Dropdown', "info", selectedValue.value);
        //console.log(selectedValue);
        if (selectedValue.value == Constants.DR_TODAY) {
            this.customValue = false;
            let currentDate = new Date();
            this.getDailyRounds(currentDate, currentDate);
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_3_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_6_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_CUSTOM) {
            this.customValue = true;
            // let currentDate = this.customDate.value;
            // let lastDate = this.customDate2.value;
            // //console.log(currentDate)
            // //console.log(lastDate)
            // this.getDailyRounds(currentDate,lastDate);
        } else {
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
            colors: [
                '#A70606',
                '#DC5B11',
                '#0F0F03',
                '#061797',
                '#DDDED8',
                '#C109AE',
                '#0A9928',
                '#450707',
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

        this.chartBudgetDistribution = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'radar',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#818CF8'],
            dataLabels: {
                enabled: true,
                formatter: (val: number): string | number => `${val}`,
                textAnchor: 'start',
                style: {
                    fontSize: '13px',
                    fontWeight: 500,
                },
                background: {
                    borderWidth: 0,
                    padding: 4,
                },
                offsetY: -15,
            },
            markers: {
                strokeColors: '#818CF8',
                strokeWidth: 4,
            },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: 'var(--fuse-border)',
                        connectorColors: 'var(--fuse-border)',
                    },
                },
            },
            series: this._HolesSetsseries,
            stroke: {
                width: 2,
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: (val: number): string => `${val}`,
                },
            },
            xaxis: {
                labels: {
                    show: true,
                    style: {
                        fontSize: '12px',
                        fontWeight: '500',
                    },
                },
                categories: this.courseholesets,
            },
            yaxis: {
                max: (max: number): number =>
                    parseInt((max + 10).toFixed(0), 10),
                tickAmount: 7,
            },
        };
    }
    onDatePick(item) {
        //console.log(item);
        this.customDate = item;
        if (this.customDate2) {
            let currentDate = this.customDate.value;
            let lastDate = this.customDate2.value;

            //console.log(currentDate);
            //console.log(lastDate);
            this.getDailyRounds(currentDate, lastDate);
        } else {
        }
    }

    onDatePick2(item) {
        //console.log(item);
        this.customDate2 = item;
        if (this.customDate) {
            let currentDate = this.customDate.value;
            let lastDate = this.customDate2.value;

            //console.log(currentDate);
            //console.log(lastDate);
            this.getDailyRounds(currentDate, lastDate);
        } else {
        }
    }

    public chartClicked(e: any): void {
        // //console.log(e);
    }

    public chartHovered(e: any): void {
        // //console.log(e);
    }
}
