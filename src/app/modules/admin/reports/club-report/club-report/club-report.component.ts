import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { FacadeService } from 'app/shared/services/facade.service';
import { DatePipe } from '@angular/common';
import { Club } from 'app/shared/models/club.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApexOptions } from 'ng-apexcharts';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-club-report',
    templateUrl: './club-report.component.html',
    styleUrls: ['./club-report.component.scss'],
})
export class ClubReportComponent implements OnInit {
    clubs: Club[] = [];
    chartBudgetDistribution: ApexOptions = {};
    chartGithubIssues: ApexOptions = {};
    dataSource: MatTableDataSource<any>;
    displayedColumns = ['id', 'name', 'email', 'phone', 'members', 'course'];
    // public barChartLabels: string[] = [
    //     '50',
    //     '100',
    //     '200',
    //     '500',
    //     '700',
    //     '1000',
    //     '1200',
    //     '1500',
    //     '1700',
    //     '2000',
    //     '2500',
    // ];
    public barChartLabels: string[] = [];
    _series: any = [];
    barChartData20: any[] = [];
    barChartData50: any[] = [];
    barChartData100: any[] = [];
    barChartData200: any[] = [];
    barChartData500: any[] = [];
    barChartData700: any[] = [];
    barChartData1000: any[] = [];
    barChartData1200: any[] = [];
    barChartData1500: any[] = [];
    barChartData1700: any[] = [];
    barChartData2000: any[] = [];
    barChartData2500: any[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    showdata: Promise<boolean>;
    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private facadeService: FacadeService,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin Come to Club Report Page', "info");
        this.fecthData();
    }

    async fecthData() {
        let dataMembers: any[] = [];
        let clubName: any[] = [];
        this.logger.log('Getting Club Report Data', "info");
        let clubs = await this.facadeService.getClubList();
        this.logger.log('Getting Club Report Data Successfully', "info", clubs?.club?.length);
        console.log(clubs);
        this.clubs = clubs.club;
        this.dataSource = new MatTableDataSource(clubs.club);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        for (let obj of this.clubs) {
            if (obj['members'].length > 0) {
                this.barChartLabels.push(obj.name.match(/\b([A-Z])/g).join(''));
                dataMembers.push(obj['members'].length)
            }
            // if (obj['members'].length <= 20) {
            //     this.barChartData20.push(obj);
            // } else if (obj['members'].length <= 50) {
            //     this.barChartData50.push(obj);
            //     clubName.push(obj.name);
            // } else if (obj['members'].length <= 100) {
            //     this.barChartData100.push(obj);
            // } else if (obj['members'].length <= 200) {
            //     this.barChartData200.push(obj);
            // } else if (obj['members'].length <= 500) {
            //     this.barChartData500.push(obj);
            // } else if (obj['members'].length <= 700) {
            //     this.barChartData700.push(obj);
            // } else if (obj['members'].length <= 1000) {
            //     this.barChartData1000.push(obj);
            // } else if (obj['members'].length <= 1200) {
            //     this.barChartData1200.push(obj);
            // } else if (obj['members'].length <= 1500) {
            //     this.barChartData1500.push(obj);
            // } else if (obj['members'].length <= 1700) {
            //     this.barChartData1700.push(obj);
            // } else if (obj['members'].length <= 2000) {
            //     this.barChartData2000.push(obj);
            // } else if (obj['members'].length <= 2500) {
            //     this.barChartData2500.push(obj);
            // }
        }
        // dataMembers.push(this.barChartData20.length)
        // dataMembers.push(this.barChartData50.length);
        // dataMembers.push(this.barChartData100.length);
        // dataMembers.push(this.barChartData200.length);
        // dataMembers.push(this.barChartData500.length);
        // dataMembers.push(this.barChartData700.length);
        // dataMembers.push(this.barChartData1000.length);
        // dataMembers.push(this.barChartData1200.length);
        // dataMembers.push(this.barChartData1500.length);
        // dataMembers.push(this.barChartData1700.length);
        // dataMembers.push(this.barChartData2000.length);
        // dataMembers.push(this.barChartData2500.length);
        //console.log(this.barChartLabels);

        this._series['0'] = [
            {
                data: dataMembers,
                name: 'Members',
                type: 'line',
            },
            {
                data: dataMembers,
                name: "Total",
                type: 'column',
            },
        ];

        this.chart();
        this.showdata = Promise.resolve(true);
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }
    goToClub(clubId: string | number) {
        this.logger.log('Admin Click on View Club Members in Club Report Page', "info", clubId);
        this.location.navigate([`/reports/club/${clubId}`]);
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

        // this.chartBudgetDistribution = {
        //     chart: {
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'radar',
        //         sparkline: {
        //             enabled: true,
        //         },
        //     },
        //     colors: ['#818CF8'],
        //     dataLabels: {
        //         enabled: true,
        //         formatter: (val: number): string | number => `${val}%`,
        //         textAnchor: 'start',
        //         style: {
        //             fontSize: '13px',
        //             fontWeight: 500,
        //         },
        //         background: {
        //             borderWidth: 0,
        //             padding: 4,
        //         },
        //         offsetY: -15,
        //     },
        //     markers: {
        //         strokeColors: '#818CF8',
        //         strokeWidth: 4,
        //     },
        //     plotOptions: {
        //         radar: {
        //             polygons: {
        //                 strokeColors: 'var(--fuse-border)',
        //                 connectorColors: 'var(--fuse-border)',
        //             },
        //         },
        //     },
        //     series: this._HolesSetsseries,
        //     stroke: {
        //         width: 2,
        //     },
        //     tooltip: {
        //         theme: 'dark',
        //         y: {
        //             formatter: (val: number): string => `${val}%`,
        //         },
        //     },
        //     xaxis: {
        //         labels: {
        //             show: true,
        //             style: {
        //                 fontSize: '12px',
        //                 fontWeight: '500',
        //             },
        //         },
        //         categories: this.courseholesets,
        //     },
        //     yaxis: {
        //         max: (max: number): number =>
        //             parseInt((max + 10).toFixed(0), 10),
        //         tickAmount: 7,
        //     },
        // };
    }
}
