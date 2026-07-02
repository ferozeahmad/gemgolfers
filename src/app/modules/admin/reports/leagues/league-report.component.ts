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
import { Resolver } from './league-resolver.component';
import { LeagueService } from './league-service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUncompletedComponent } from '../../dialogs/dialog-uncomplete-players/dialog-uncomplete.component';
import { ProjectService } from '../../dashboards/project/project.service';
import { DialogLeaguesComponent } from '../../dialogs/dialog-leagues/dialog-leagues.component';
import { Constants, General } from 'app/shared/classes/general';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
    standalone: false,
    selector: 'app-league-report',
    templateUrl: './league-report.component.html',
    styleUrls: ['./league-report.component.scss'],
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
export class LeagueReportComponent implements OnInit, AfterViewInit {
    chartVisitors: ApexOptions;
    selection = new SelectionModel<any>(true, []);
    showdata: Promise<boolean>;
    chartConversions: ApexOptions;
    chartImpressions: ApexOptions;
    chartVisits: ApexOptions;
    chartVisitorsVsPageViews: ApexOptions;
    chartNewVsReturning: ApexOptions;
    chartGender: ApexOptions;
    chartAge: ApexOptions;
    chartLanguage: ApexOptions;
    data: any;
    male: number = 0;
    female: number = 0;
    series: any[] = [];
    seriesA: any[] = [];
    seriesB: any[] = [];
    seriesC: any[] = [];
    seriesD: any[] = [];
    _seriesE: any[] = [];
    labelsE: any[] = [];
    selectedPlayer = null;
    showFlight: boolean = false;
    dataMembers: any[] = [];
    dataMembersA: any[] = [];
    dataMembersB: any[] = [];
    dataMembersC: any[] = [];
    dataMembersE: any[] = [];
    Players: any = [];
    thisMonth: number = 0;
    MonthLabels: any[] = ['01 - 08', '09 - 16', '17 - 24'];
    genderLabels: any[] = ['Male', 'Female'];
    lastMonth: number = 0;
    clubPlayers: number = 0;
    mobilePlayers: number = 0;
    SecondLastMonth: number = 0;
    dataSource: MatTableDataSource<any>;
    dataSourcePlayer: MatTableDataSource<any>;
    displayedColumns = ['id', 'name', 'date', 'tournaments', 'members', 'owner','details'];
    displayedPlayersColumns = ['firstName', 'lastName', 'email'];
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
    flightCount: number = 0;
    scheduleForm: FormGroup;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    constructor(
        private datePipe: DatePipe,
        private _changeDetectorRef: ChangeDetectorRef,
        private location: Router, private fb: FormBuilder,
        private facadeService: FacadeService,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _data: LeagueService, private _projectService: ProjectService,
        public dialog: MatDialog,
        public snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        this.scheduleForm = this.fb.group({
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
        });
        this.fecthData();
    }
    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    fecthData() {
        this._data.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data: any) => {
                this.data = data;
                console.log(data);
                let d = new Date();
                d.setDate(1);
                for (let i = 0; i <= 60; i++) {
                    // //console.log(this.monthName[d.getMonth()] + ' ' + d.getFullYear());
                    this.labelsE.push(
                        this.monthName[d.getMonth()] + ' ' + d.getFullYear()
                    );
                    d.setMonth(d.getMonth() - 1);
                }
                //console.log(this.labelsE);

                this.sorts();
                // this.series[0] = [
                //     {
                //         data: this.dataMembers,
                //         name: 'New Users',
                //     },
                // ];
                this.seriesA = [
                    {
                        data: this.dataMembersA,
                        name: 'Leagues',
                    },
                ];
                this.seriesB = [
                    {
                        data: this.dataMembersB,
                        name: 'Leagues',
                    },
                ];
                this.seriesC = [
                    {
                        data: this.dataMembersC,
                        name: 'Leagues',
                    },
                ];
                this.seriesD = [this.male, this.female];

                this._seriesE[0] = [
                    {
                        data: this.dataMembersE,
                        name: 'Leagues',
                        type: 'line',
                    },
                    {
                        data: this.dataMembersE,
                        name: 'Leagues',
                        type: 'column',
                    },
                ];

                this._prepareChartData();
            })
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }
    sorts() {
        let rows = [];
        let myData: any[] = [];
        //let flights = [...this.data.flight_member];
        let memCounter = 0;
        let playerCounter = 0;
        let flightCounter = 0;
        let prevDate = null;
        let prevPlayerDate = null;
        let count = 0;
        let match = [];
        //console.log(match);
        let flag: boolean = true;

        for (let item of this.data.league) {
            if (item.dateCreated != null) {
                let SplitDate = item.dateCreated
                if (SplitDate == prevPlayerDate) {
                    playerCounter++;
                    prevPlayerDate = SplitDate;
                    this.dataMembers[this.dataMembers.length - 1]['y'] = playerCounter;
                } else {
                    playerCounter = 0;
                    playerCounter++;
                    prevPlayerDate = SplitDate;
                    let dateObj = {
                        x: new Date(item.dateCreated),
                        y: playerCounter,
                    };
                    this.dataMembers.push(dateObj);
                }

                let obj = {
                    id: item.id,
                    count: ++count,
                    name: item.name,
                    date: item.dateCreated?.substring(0, 10),
                    tournaments: item.tournaments.length,
                    members: item.members.length,
                    owner: item.admin.firstName + ' ' + item.admin.lastName + ' (' + item.admin.email + ')',
                };
                let date = new Date(item?.dateCreated).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                });
                if (flag) {
                    let countA = this.labelsE.find((a) => {
                        return a == date;
                    });
                    //console.log(countA);
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
                } else {
                    break;
                }
                rows.push(obj);
            }
        }

        this.dataSource = new MatTableDataSource(rows);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        //console.log(this.dataMembers);

        for (let items of this.dataMembers) {
            if (items.x.toString().includes('Apr')) {
                if (this.dataMembersA.length < 3 && items.y > 0) {
                    this.dataMembersA.push(items.y);
                }
                this.thisMonth++;
            } else if (items.x.toString().includes('Mar')) {
                this.lastMonth++;
                if (this.dataMembersB.length < 3 && items.y > 0) {
                    this.dataMembersB.push(items.y);
                }
            } else if (
                items.x.toString().includes('Jan') ||
                items.x.toString().includes('Feb') ||
                items.x.toString().includes('Dec')
            ) {
                this.SecondLastMonth++;
                if (this.dataMembersC.length < 3 && items.y > 0) {
                    this.dataMembersC.push(items.y);
                }
                //  this.dataMembersC.push(items.y);
            }
        }
        //console.log(this.dataMembers);
    }
    async toggleDetails(productId: string) {
        let dailyRoundCount = 0;
        let tournamentCount = 0;
        let leagueCount = 0;
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
        let count = await this.facadeService.getLeaguesMembers(
            productId
        );
        console.log(count);

        for (let obj of count['league'][0]?.members) {
            let item = {
                id: obj.playerId,
                firstName: obj.player['firstName'],
                lastName: obj.player['lastName'],
                email: obj.player['email'],
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


        // Conversions
        this.chartConversions = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'area',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#38BDF8'],
            fill: {
                colors: ['#38BDF8'],
                opacity: 0.5,
            },
            series: this.seriesA,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.MonthLabels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => val.toString(),
                },
            },
        };

        // Impressions
        this.chartImpressions = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'area',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#34D399'],
            fill: {
                colors: ['#34D399'],
                opacity: 0.5,
            },
            series: this.seriesB,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.MonthLabels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => val.toString(),
                },
            },
        };

        // Visits
        this.chartVisits = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'area',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#FB7185'],
            fill: {
                colors: ['#FB7185'],
                opacity: 0.5,
            },
            series: this.seriesC,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.MonthLabels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => val.toString(),
                },
            },
        };

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

                        //console.log(options);
                        //console.log(this.labelsE[options.dataPointIndex]);
                        const { startDate, endDate } = General.getMonthDates(this.labelsE[options.dataPointIndex]);
                        this.facadeService.getLeaguesListByDate(startDate.toString(), endDate.toString()).
                            subscribe((res) => {
                                console.log(res);
                                let rows = [];
                                let count = 0;
                                for (let item of res?.league) {
                                    let obj = {
                                        id: item.id,
                                        count: ++count,
                                        name: item.name,
                                        date: item.dateCreated?.substring(0, 10),
                                        tournaments: item.tournaments.length,
                                        members: item.members.length,
                                        owner: item.admin.firstName + ' ' + item.admin.lastName + ' (' + item.admin.email + ')',
                                    };
                                    rows.push(obj)
                                }
                                const dialogRef = this.dialog.open(DialogLeaguesComponent, {
                                    data: { tournaments: rows },
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
                    offsetX: -16,
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };

    }

    Dailysetup(selectedValue) {
        ////console.log(selectedValue)
        // this.lo.log('Getting Daily Round Data By Dropdown', "info", selectedValue.value.toString());
        if (selectedValue.value == Constants.DR_TODAY) {

            let currentDate = new Date();
            this._data.getFilterData(currentDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]).subscribe();
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {

            let currentDate = new Date();
            let lastDate = this.yesterday();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(lastDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {

            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            ////console.log(currentDate)
            ////console.log(lastDate)

            this._data.getFilterData(lastDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]).subscribe();
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {

            let currentDate = new Date();
            let lastDate = this.endOfMonth();

            this._data.getFilterData(lastDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]).subscribe();
        } else if (selectedValue.value == Constants.DR_CUSTOM) {
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
            this._data.getFilterData(startDate.toISOString().split('T')[0], lastDate.toISOString().split('T')[0]).subscribe();
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
    navigateToTournament(tournamentId: string) {
        this.location.navigate(['/tournaments/view', tournamentId]);
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
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

        const data = this.selection.selected.map((item) => {
            // Create a new object without the 'Details' column
            const { Select, id, Details, count, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Leagues_report.xlsx');
        this.selection.clear();
    }
    exportToExcelPlayers(): void {

        const data = this.dataSourcePlayer.data.map((item) => {
            // Create a new object without the 'Details' column
            const { id,  ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'League_Players_report.xlsx');
        this.selection.clear();
    }

    deleteLeagues(): void {
        const data = this.selection.selected;
        const dialogRef = this.dialog.open(FuseConfirmationDialogComponent, {
            data: {
                title: 'Delete League(s)',
                message:
                    'Are you sure you want to delete the selected League(s)? This action cannot be undone!',
                icon: {
                    show: true,
                    name: 'heroicons_outline:exclamation',
                    color: 'warn'
                },
                actions: {
                    confirm: {
                        show: true,
                        label: 'Delete',
                        color: 'warn'
                    },
                    cancel: {
                        show: true,
                        label: 'Cancel'
                    }
                },
                dismissible: false
            }, panelClass: 'fuse-confirmation-dialog-panel'
        });

        dialogRef.afterClosed().subscribe(result => {
            // this.logger.info("Dialog for confirmation is close", result);
            if (result === 'confirmed') {
                const deleteLeagues = data.map(element => element.id);
                this._data.deleteLeagues(deleteLeagues).then(res => {
                    if (res) {
                        for (let index in data) {
                            const leadSourceIndex =
                                this.dataSource.data.findIndex(
                                    (dataItem) =>
                                        dataItem.id === data[index].id
                                );
                            if (leadSourceIndex !== -1) {
                                this.dataSource.data.splice(
                                    leadSourceIndex,
                                    1
                                );
                            }
                        }
                        this.snackBar.open("Leagues have been deleted.", "x", {
                            duration: 3000,
                        });
                        this.dataSource._updateChangeSubscription();
                        this.selection.clear();
                    } else {
                        this.snackBar.open("Error!Please try again later.", "close", {
                            duration: 5 * 3000,
                        });
                    }
                })
            }
        })
    }
}
