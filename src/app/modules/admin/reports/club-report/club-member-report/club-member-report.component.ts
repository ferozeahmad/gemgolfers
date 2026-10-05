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
    selector: 'app-club--member-report',
    templateUrl: './club-member-report.component.html',
    styleUrls: ['./club-member-report.component.scss'],
})
export class ClubMemberComponent implements OnInit {
    count: any = 0;
    chartBudgetDistribution: ApexOptions = {};
    chartGithubIssues: ApexOptions = {};
    playersDataSource: MatTableDataSource<any>;
    playersTableColumns: string[] = [
        // 'id',
        // 'view',
        'Name',
        'Phone',
        'Email',
        'MembershipNo',
        'Category',
        'Handicap',
        // 'club',
        'createdAt',
        // 'Status',
        // 'Edit',
        // 'Delete',
    ];
    clubId: string = '';
    public barChartLabels: string[] = [];
    _series: any = [];
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    showdata: Promise<boolean>;
    Players: any = [];
    TablePlayers: any = [];
    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private facadeService: FacadeService,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin Come to Club Members Report Page', "info");
        this.fecthData();
    }

    async fecthData() {

        let data: any;
        this.route.paramMap.subscribe((params) => {
            this.clubId = params.get('id');
        });
        this.logger.log('Getting Club Members Report Data', "info", this.clubId);
        data = await this.facadeService.getPlayersListByClub(
            this.clubId
        );
        this.logger.log('Getting Club Members Report Data Successfully', "info", data?.player?.length);
        this.count = data.player.length;
        this.Players = data.player;
        //console.log(data);
        for (let obj of this.Players) {
            let Fname = obj.firstName
                ? obj.firstName.trim()
                : obj.firstName;
            let Lname = obj.lastName ? obj.lastName.trim() : obj.lastName;
            let newobj = {
                id: obj.id,
                Name: Fname + ' ' + Lname,
                Phone: obj.phone,
                Email: obj.email,
                createdAt: obj.createdAt,
                MembershipNo: obj.membershipNumber,
                Category:
                    obj.playerCategory == 'Senior'
                        ? 'Senior Amateurs'
                        : obj.playerCategory,
                Handicap: obj.handicap,
                // Status: obj.membershipQL,
                // club: obj.membershipQL[0]?.club?.name ?? '-',
            };
            this.TablePlayers.push(newobj);
        }
        this.playersDataSource = new MatTableDataSource(this.TablePlayers);
        this.playersDataSource.paginator = this.paginator;
        this.playersDataSource.sort = this.sort;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.playersDataSource.filter = filterValue;

        if (this.playersDataSource.paginator) {
            this.playersDataSource.paginator.firstPage();
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
