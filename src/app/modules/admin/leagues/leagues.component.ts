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
import { Constants, UniqueIdGenerator } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddLeagueComponent } from '../dialogs/dialog-add-league/dialog-add-league.component';
import { UserSessionModel } from 'app/shared/models/player.model';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-leagues',
    templateUrl: './leagues.component.html',
    styleUrls: ['./leagues.component.scss'],
})
export class LeaguesComponent implements OnInit {
    clubs: any[] = [];
    showLeaderBoards: boolean = false;
    _series: any = [];
    selectedId: any = null;
    leaderBoards: any[] = [];
    dataSource: MatTableDataSource<any>;
    displayedColumns = [
        'id',
        'name',
        'date',
        'members',
        'tournament',
        'details',
        'table'
    ];
    loggedInuser: UserSessionModel;
    chartBudgetDistribution: ApexOptions = {};
    chartGithubIssues: ApexOptions = {};
    public barChartLabels: string[] = [];
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    showdata: Promise<boolean>;
    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private facadeService: FacadeService,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _localStorage: LocalStorageService,
        public dialog: MatDialog,
        private logger: LogsService,
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to Leagues Page', "info");
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.fecthData();
    }

    async fecthData() {

        let dataMembers: any[] = [];
        let dataTournaments: any[] = [];
        let clubName: any[] = [];
        let clubs: any;
        this.logger.log('Getting Leagues Data', "info");
        //console.log(this.loggedInuser);
        if (this._localStorage.isSuperAdmin()) {
            clubs = await this.facadeService.getLeagues();
        } else if (this._localStorage.isClubAdmin()) {
            clubs = await this.facadeService.getLeaguesByClub(this.loggedInuser.adminClubId);
        } else {
            clubs = await this.facadeService.getLeaguesByClub(this.loggedInuser.id);
        }
        // //console.log(clubs.league);
        this.clubs = clubs.league;
        this.logger.log('Getting Leagues Data Successful', "info", { count: this.clubs.length });
        if (this.clubs.length == 0) {
            this.showLeaderBoards = true;
        }
        this.dataSource = new MatTableDataSource(clubs.league);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        for (let obj of this.clubs) {
            if (obj['members'].length > 0) {
                this.barChartLabels.push(obj.name);
                dataMembers.push(obj['members'].length);
                dataTournaments.push(obj['tournaments'].length);
            }
        }
        this._series['0'] = [
            {
                data: dataMembers,
                name: 'Members',
                type: 'line',
            },
            {
                data: dataMembers,
                name: 'Members',
                type: 'column',
            },

            {
                data: dataTournaments,
                name: 'Tournaments',
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
            colors: ['#AF6F0B', '#121212', '#AC1500'],
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

    toggleDetails(productId: string): void {
        this.logger.log('Admin Click on Toggle League Details in Leagues Page', "info", productId);
        this.showLeaderBoards = true;
        if (this.selectedId && this.selectedId === productId) {
            this.showLeaderBoards = false;
            return;
        }

        this.leaderBoards = this.clubs.find((a) => {
            return a.id == productId;
        });
        this.showLeaderBoards = true;
    }

    addNewLeague() {
        this.logger.log('Admin Click on Add New League in Leagues Page', "info");
        const dialogRef = this.dialog.open(DialogAddLeagueComponent);
        dialogRef.afterClosed().subscribe(async (result) => {
            //console.log(result);
            this.logger.log(result ? 'Add League Dialog Confirmed in Leagues Page' : 'Add League Dialog Cancelled in Leagues Page', "info", result ? result.title : undefined);
            if (result) {
                let league: any = {
                    id: UniqueIdGenerator.generate(),
                    adminId: this.loggedInuser.id,
                    name: result.title,
                    logo: null,
                    dateCreated: new Date().toISOString(),
                }
                this.facadeService.addLeague(league, result.file).subscribe((result) => {
                    console.log(result);
                    this.logger.log(result ? 'League Added Successfully' : 'Adding League Failed', result ? "info" : "error", { id: league.id, name: league.name });
                    if (result) {
                        league.tournaments = []
                        league.members = []
                        this.dataSource.data = [...this.dataSource.data, league];
                    }
                })

            }

        })
    }
}
