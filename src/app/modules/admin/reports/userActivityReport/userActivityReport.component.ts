import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { FacadeService } from 'app/shared/services/facade.service';
import { DatePipe } from '@angular/common';
import { Club } from 'app/shared/models/club.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApexOptions } from 'ng-apexcharts';
import { Subject, of, takeUntil } from 'rxjs';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import * as XLSX from 'xlsx';
import { read, utils } from 'xlsx';
import { Resolver } from './userActivityReport.resolver.component';
import { UserActivityService } from './userActivityReport.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUncompletedComponent } from '../../dialogs/dialog-uncomplete-players/dialog-uncomplete.component';
import { ProjectService } from '../../dashboards/project/project.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Constants, General } from 'app/shared/classes/general';
import { SelectionModel } from '@angular/cdk/collections';
import { DialogPlayersComponent } from '../../dialogs/dialog-report-player/dialog-uncomplete.component';
import { DialogUserActivityComponent } from '../../dialogs/dialog-user-activity/dialog-user-activity.component';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'userActivityReport',
    templateUrl: './userActivityReport.component.html',
    styleUrls: ['./userActivityReport.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition(
                'expanded <=> collapsed',
                animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
            ),
        ]),
    ],
})
export class UserActivityReport implements OnInit, AfterViewInit {

    chartVisitorsVsPageViews: ApexOptions;
    data: any;
    scheduleForm: FormGroup;
    _seriesE: any[] = [];
    labelsE: any[] = [];
    selectedPlayer = null;
    expandedElement: any | null;
    showFlight: boolean = false;
    dataMembersE: any[] = [];
    Players: any = [];
    copyPlayers: any = [];
    clubPlayers: number = 0;
    mobilePlayers: number = 0;
    leaguePlayers: number = 0;
    trailPlayers: number = 0;
    premiuimPlayers: number = 0;
    SecondLastMonth: number = 0;
    dataSource: MatTableDataSource<any>;
    dataSourcePlayer: MatTableDataSource<any>;
    displayedColumns = ['id', 'name', 'email', 'totalActivity', 'details'];
    displayedPlayersColumns = ['dailyRound', 'tournament', 'league', 'tour'];
    monthName = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    flightCount: any;
    customValue: boolean;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    selection = new SelectionModel<any>(true, []);
    constructor(
        private datePipe: DatePipe,
        private _changeDetectorRef: ChangeDetectorRef,
        private location: Router,
        private facadeService: FacadeService, private fb: FormBuilder,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _data: UserActivityService, private _projectService: ProjectService,
        public dialog: MatDialog,
        private logger: LogsService,
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to User Activity Report Page', "info");
        this.scheduleForm = this.fb.group({
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
        });
        this._data.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data: any) => {
                this.data = data;
                console.log(data);
                // let d = new Date();
                // d.setDate(1);
                // for (let i = 0; i <= 12; i++) {
                //     // //console.log(this.monthName[d.getMonth()] + ' ' + d.getFullYear());
                //     this.labelsE.push(
                //         this.monthName[d.getMonth()] + ' ' + d.getFullYear()
                //     );
                //     d.setMonth(d.getMonth() - 1);
                // }
                // //console.log(this.labelsE);
                // this.mobilePlayers = this.data.MobileAggregateQL.aggregate.count
                // this.clubPlayers = this.data.ClubAggregateQL.aggregate.count
                // this.trailPlayers = this.data.TrialAggregateQL.aggregate.count
                // this.premiuimPlayers = this.data.PremiumAggregateQL.aggregate.count
                // this.sorts();

                // this._seriesE[0] = [
                //     {
                //         data: this.dataMembersE,
                //         name: 'Players',
                //         type: 'line',
                //     },
                //     {
                //         data: this.dataMembersE,
                //         name: 'Players',
                //         type: 'column',
                //     },
                // ];

                // this._prepareChartData();
                this.groupDataByUserId(this.data.user_activity_log)
            })
    }
    ngAfterViewInit(): void {
        this.dataSource = new MatTableDataSource(this.copyPlayers);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    groupDataByUserId(data: any[]) {
        this.mobilePlayers, this.leaguePlayers, this.premiuimPlayers, this.trailPlayers, this.clubPlayers = 0;
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.userId]) {
                acc[item.userId] = {
                    userId: item.userId,
                    name: item.name,
                    email: item.email,
                    activities: [],
                    count: 0
                };
                this.clubPlayers++;
            }
            if (item.activityType == 'NEW_USER_SIGNED_UP') {
                this.mobilePlayers++;
            }
            if (item.activityType == 'CREATED_NEW_LEAGUE') {
                this.leaguePlayers++;
            }
            if (item.activityType == 'CREATED_NEW_TOUR') {
                this.premiuimPlayers++;
            }
            if (item.activityType == 'CREATED_TOURNAMENT') {
                this.trailPlayers++;
            }
            acc[item.userId].activities.push({ date: item.dateTime, description: item.description });
            acc[item.userId].count++;
            return acc;
        }, {});

        this.copyPlayers = Object.values(grouped);
        // this.totalCount = data.length;
        this.dataSource = new MatTableDataSource(this.copyPlayers);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }


    // private _prepareChartData(): void {

    //     // Visitors vs Page Views
    //     this.chartVisitorsVsPageViews = {
    //         chart: {
    //             fontFamily: 'inherit',
    //             foreColor: 'inherit',
    //             height: '100%',
    //             type: 'line',
    //             toolbar: {
    //                 show: false,
    //             },
    //             zoom: {
    //                 enabled: false,
    //             },
    //             events: {
    //                 dataPointSelection: (e, chart, options) => {

    //                     //console.log(options);
    //                     //console.log(this.labelsE[options.dataPointIndex]);
    //                     const { startDate, endDate } = General.getMonthDates(this.labelsE[options.dataPointIndex]);
    //                     this._projectService.getPlayerData(startDate.toString(), endDate.toString()).
    //                         subscribe((res) => {
    //                             //console.log(res);
    //                             const dialogRef = this.dialog.open(DialogPlayersComponent, {
    //                                 data: { players: res.data?.player, key: 'all', date: startDate },
    //                             });
    //                         })
    //                 },
    //             },
    //         },
    //         colors: ['#64748B', '#94A3B8'],
    //         dataLabels: {
    //             enabled: true,
    //             enabledOnSeries: [0],
    //             background: {
    //                 borderWidth: 0,
    //             },
    //         },
    //         grid: {
    //             borderColor: 'var(--fuse-border)',
    //         },
    //         labels: this.labelsE,
    //         legend: {
    //             show: false,
    //         },
    //         plotOptions: {
    //             bar: {
    //                 columnWidth: '50%',

    //             },

    //         },
    //         series: this._seriesE,
    //         states: {
    //             hover: {
    //                 filter: {
    //                     type: 'darken',
    //                     value: 0.75,
    //                 },
    //             },
    //         },
    //         stroke: {
    //             width: [3, 0],
    //         },
    //         tooltip: {
    //             followCursor: true,
    //             theme: 'dark',
    //         },
    //         xaxis: {
    //             axisBorder: {
    //                 show: false,
    //             },
    //             axisTicks: {
    //                 color: 'var(--fuse-border)',
    //             },
    //             labels: {
    //                 style: {
    //                     colors: 'var(--fuse-text-secondary)',
    //                 },
    //             },
    //             tooltip: {
    //                 enabled: false,
    //             },
    //         },
    //         yaxis: {
    //             labels: {
    //                 offsetX: 8,
    //                 style: {
    //                     colors: 'var(--fuse-text-secondary)',
    //                 },
    //             },
    //         },
    //     };
    //     console.log('end');


    // }

    Dailysetup(selectedValue) {
        this.logger.log('Admin Select Date Filter in User Activity Report Page', "info", selectedValue.value);
        ////console.log(selectedValue)
        // this.lo.log('Getting Daily Round Data By Dropdown', "info", selectedValue.value.toString());
        if (selectedValue.value == Constants.DR_TODAY) {
            this.customValue = false;
            let currentDate = new Date();
            this._data.getFilterData(this.datePipe.transform(currentDate, 'yyyy-MM-ddT00:00:00.000'), this.datePipe.transform(currentDate, 'yyyy-MM-ddT23:59:59.999')).subscribe();
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.yesterday();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(this.datePipe.transform(lastDate, 'yyyy-MM-ddT00:00:00.000'), this.datePipe.transform(currentDate, 'yyyy-MM-ddT00:00:00.000')).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            ////console.log(currentDate)
            ////console.log(lastDate)
            this._data.getFilterData(this.datePipe.transform(lastDate, 'yyyy-MM-ddT00:00:00.000'), this.datePipe.transform(currentDate, 'yyyy-MM-ddT23:59:59.999')).subscribe();
            // this._data.getFilterData(currentDate, lastDate).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            ////console.log(currentDate)
            ////console.log(lastDate)
            this._data.getFilterData(this.datePipe.transform(lastDate, 'yyyy-MM-ddT00:00:00.000'), this.datePipe.transform(currentDate, 'yyyy-MM-ddT23:59:59.999')).subscribe();
            // this._data.getFilterData(currentDate, lastDate).subscribe();
        } else if (selectedValue.value == Constants.DR_CUSTOM) {
            this.customValue = true;
            // let currentDate = this.customDate.value;
            // let lastDate = this.customDate2.value;
            // //console.log(currentDate)
            // //console.log(lastDate)
            // this.fecthData(currentDate,lastDate);
        } else {
        }
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

    onDatePick() {
        const result = this.scheduleForm.value.startDate + ',' + this.scheduleForm.value.endDate;
        this.logger.log('Admin Click on Search By Dates in User Activity Report Page', "info", result);
        // this.logger.log('Getting Daily Round Data By Dates', "info", result.toString());
        //console.log(this.scheduleForm.value.startDate);
        //console.log(this.scheduleForm.value.endDate);
        if (this.scheduleForm.value.startDate) {
            let lastDate = this.scheduleForm.value.endDate;
            let startDate = this.scheduleForm.value.startDate;
            if (lastDate == '') {
                lastDate = startDate;
            }
            if (startDate == '') {
                startDate = lastDate;
            }
            // lastDate = startDate ? lastDate == "" : lastDate;
            // startDate = lastDate ? startDate == "" : startDate;

            //console.log(lastDate);
            //console.log(startDate);
            this._data.getFilterData(this.datePipe.transform(startDate, 'yyyy-MM-ddT00:00:00.000'), this.datePipe.transform(lastDate, 'yyyy-MM-ddT23:59:59.999')).subscribe();
            // this._data.getFilterData(lastDate, startDate).subscribe();
        } else {
        }
    }

    openDetailDialogs(userId: string) {
        this.logger.log('Admin Click on View Details in User Activity Report Page', "info", userId);
        let user = this.copyPlayers.filter((play) => { return play.userId == userId });

        const dialogRef = this.dialog.open(DialogUserActivityComponent, {
            data: { activities: user[0]?.activities },
        });

    }
}
