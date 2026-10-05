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
import { Resolver } from './signUp-resolver.component';
import { SignUpService } from './signUp-service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUncompletedComponent } from '../../dialogs/dialog-uncomplete-players/dialog-uncomplete.component';
import { ProjectService } from '../../dashboards/project/project.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Constants, General } from 'app/shared/classes/general';
import { SelectionModel } from '@angular/cdk/collections';
import { DialogPlayersComponent } from '../../dialogs/dialog-report-player/dialog-uncomplete.component';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-signUp-report',
    templateUrl: './signUp-report.component.html',
    styleUrls: ['./signUp-report.component.scss'],
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
export class SignUpReportComponent implements OnInit, AfterViewInit {

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
    trailPlayers: number = 0;
    premiuimPlayers: number = 0;
    SecondLastMonth: number = 0;
    dataSource: MatTableDataSource<any>;
    dataSourcePlayer: MatTableDataSource<any>;
    displayedColumns = ['id', 'name', 'date', 'email', 'phone', 'countryCode', 'club', 'subscription', 'flights',];
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
        private _data: SignUpService, private _projectService: ProjectService,
        public dialog: MatDialog,
        private logger: LogsService,
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to SignUp Report Page', "info");
        this.scheduleForm = this.fb.group({
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
        });
        this._data.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data: any) => {
                this.data = data;
                console.log(data);
                let d = new Date();
                d.setDate(1);
                for (let i = 0; i <= 12; i++) {
                    // //console.log(this.monthName[d.getMonth()] + ' ' + d.getFullYear());
                    this.labelsE.push(
                        this.monthName[d.getMonth()] + ' ' + d.getFullYear()
                    );
                    d.setMonth(d.getMonth() - 1);
                }
                //console.log(this.labelsE);
                this.mobilePlayers = this.data.MobileAggregateQL.aggregate.count
                this.clubPlayers = this.data.ClubAggregateQL.aggregate.count
                this.trailPlayers = this.data.TrialAggregateQL.aggregate.count
                this.premiuimPlayers = this.data.PremiumAggregateQL.aggregate.count
                this.sorts();

                this._seriesE[0] = [
                    {
                        data: this.dataMembersE,
                        name: 'Players',
                        type: 'line',
                    },
                    {
                        data: this.dataMembersE,
                        name: 'Players',
                        type: 'column',
                    },
                ];

                this._prepareChartData();
            })
    }
    ngAfterViewInit(): void {
        this.dataSource = new MatTableDataSource(this.copyPlayers);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }
    sorts() {
        let myData: any[] = [];
        //let flights = [...this.data.flight_member];
        let memCounter = 0;
        let playerCounter = 0;
        let flightCounter = 0;
        let prevDate = null;
        let prevPlayerDate = null;
        let count = 0;
        let match = [];
        console.log("match");
        let flag: boolean = true;

        for (let item of this.data.player) {
            if (item.createdAt != null) {
                let SplitDate = item.createdAt?.split('T');
                if (SplitDate[0] == prevPlayerDate) {
                    playerCounter++;
                    prevPlayerDate = SplitDate[0];
                    // this.dataMembers[this.dataMembers.length - 1]['y'] = playerCounter;
                } else {
                    playerCounter = 0;
                    playerCounter++;
                    prevPlayerDate = SplitDate[0];
                    let dateObj = {
                        x: new Date(item.createdAt),
                        y: playerCounter,
                    };
                    //   this.dataMembers.push(dateObj);
                }

                let obj = {
                    id: item.id,
                    count: ++count,
                    name: item.fullName,
                    date: item.createdAt?.substring(0, 10),
                    email: item.email,
                    phone: item.phone,
                    flights: 0,
                    club: item.membership[0]?.club?.name,
                    subscription: item.subscription?.subscription,
                    countryCode: item.countryCode,
                };
                let date = new Date(item?.createdAt).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                });
                if (flag) {
                    let countA = this.labelsE.find((a) => {
                        return a == date;
                    });
                    console.log(countA);
                    if (countA !== undefined && prevDate == countA) {
                        memCounter++;
                        prevDate = countA;
                        this.dataMembersE[this.dataMembersE.length - 1] = memCounter;
                    } else if (countA !== undefined) {
                        memCounter = 0;
                        memCounter++;
                        prevDate = countA;
                        this.dataMembersE.push(memCounter);
                    } else if (countA == undefined) {
                        flag = false;
                    }
                }
                this.Players.push(obj);
            }
        }
        this.copyPlayers=[...this.Players];
        this.dataSource = new MatTableDataSource(this.Players.splice(0,20));
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
       
        console.log("end-match");
    }
    async toggleDetails(productId: string) {
        this.logger.log('Admin Click on Player Details in SignUp Report Page', "info", productId);
        let dailyRoundCount = 0;
        let tournamentCount = 0;
        let leagueCount = 0;
        this.expandedElement = this.expandedElement === productId ? null : productId;
        let rows = [];
        // If the product is already selected...
        if (this.selectedPlayer != null && this.selectedPlayer == productId) {
            // Close the details
            //document.getElementById(productId).classList.add('warn');
            const selectedPlayerElement = document.getElementById(productId);
            if (selectedPlayerElement) {
                selectedPlayerElement.classList.add('warn');
            }
            this.selectedPlayer = null;
            return;
        } else if (
            this.selectedPlayer != null &&
            this.selectedPlayer != productId
        ) {
            const selectedPlayerElement = document.getElementById(this.selectedPlayer);
            if (selectedPlayerElement) {
                selectedPlayerElement.classList.add('warn');
            }
        }
        let count = await this.facadeService.getTotalFlightsPlayedByPlayer(
            productId
        );
        console.log(count);
        this.logger.log('Getting Player Flights Successfully in SignUp Report Page', "info", productId);

        this.flightCount = count['flight_member'];
        for (let obj of this.flightCount) {
            if (obj.flight.tournament.singleRound) {
                dailyRoundCount++;
            } else {
                tournamentCount++;
            }
            if (obj.flight.tournament.league) {
                leagueCount++;
            }

        }
        let item = {
            id: '1',
            dailyRoundCount: dailyRoundCount,
            tournamentCount: tournamentCount,
            leagueCount: leagueCount,
            tourCount: 0,
        }
        rows.push(item);
        if (rows.length == 0) {
            let item = {
                id: '1',
                dailyRoundCount: 0,
                tournamentCount: 0,
                leagueCount: 0,
                tourCount: 0,
            }
            rows.push(item);
        }
        this.dataSourcePlayer = new MatTableDataSource(rows);
        this.dataSourcePlayer.paginator = this.paginator;
        this.dataSourcePlayer.sort = this.sort;
        const selectedPlayerElement = document.getElementById(productId);
        if (selectedPlayerElement) {
            selectedPlayerElement.classList.remove('warn');
        }
        this.selectedPlayer = productId;
    }
    private _prepareChartData(): void {

        // Visitors vs Page Views
        this.chartVisitorsVsPageViews = {
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
                events: {
                    dataPointSelection: (e, chart, options) => {
                        this.logger.log('Admin Click on Chart Month in SignUp Report Page', "info", this.labelsE[options.dataPointIndex]);

                        //console.log(options);
                        //console.log(this.labelsE[options.dataPointIndex]);
                        const { startDate, endDate } = General.getMonthDates(this.labelsE[options.dataPointIndex]);
                        this._projectService.getPlayerData(startDate.toString(), endDate.toString()).
                            subscribe((res) => {
                                //console.log(res);
                                this.logger.log('Getting Players Data By Month Successfully in SignUp Report Page', "info", this.labelsE[options.dataPointIndex]);
                                const dialogRef = this.dialog.open(DialogPlayersComponent, {
                                    data: { players: res.data?.player, key: 'all', date: startDate },
                                });
                            })
                    },
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
            labels: this.labelsE,
            legend: {
                show: false,
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',

                },

            },
            series: this._seriesE,
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
                    offsetX: 8,
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };
console.log('end');


    }

    Dailysetup(selectedValue) {
        this.logger.log('Admin Select Date Filter in SignUp Report Page', "info", selectedValue.value);
        ////console.log(selectedValue)
        // this.lo.log('Getting Daily Round Data By Dropdown', "info", selectedValue.value.toString());
        if (selectedValue.value == Constants.DR_TODAY) {
            this.customValue = false;
            let currentDate = new Date();
            this._data.getFilterData(currentDate, currentDate).subscribe();
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.yesterday();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(currentDate, lastDate).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(currentDate, lastDate).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(currentDate, lastDate).subscribe();
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
        this.logger.log('Admin Click on Search By Dates in SignUp Report Page', "info", result);
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
            this._data.getFilterData(lastDate, startDate).subscribe();
        } else {
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
        this.logger.log('Admin Click on Select All in SignUp Report Page', "info");
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelected()
            ? this.selection.clear()
            : this.dataSource.data.forEach((row) =>
                this.selection.select(row)
            );
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }
    exportToExcel(): void {
        this.logger.log('Admin Click on Export to Excel in SignUp Report Page', "info", this.selection.selected.length);

        const data = this.selection.selected.map((item) => {
            // Create a new object without the 'Details' column
            const { Select, id, Details, count, flights, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Players_report.xlsx');
        this.logger.log('Players exported to Excel successfully', "info");
        this.selection.clear();
    }
}
