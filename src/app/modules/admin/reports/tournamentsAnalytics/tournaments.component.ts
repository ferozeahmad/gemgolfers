import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Tournament } from '../../../../shared/models/tournament.model';
import {
    Player,
    PlayerHanidcap,
    IPlayerHandicapWhs,
    ClubMembership,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import {
    Constants,
    General,
    generateGemId,
    UniqueIdGenerator,
} from '../../../../shared/classes/general';
import { FacadeService } from 'app/shared/services/facade.service';
// import { DialogOverviewComponent } from "../material-components/dialog-overview/dialog-overview.component";

import { Subject, of, takeUntil } from 'rxjs';
import { async } from 'rxjs/internal/scheduler/async';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-tournaments',
    templateUrl: './tournaments.component.html',
    styleUrls: ['./tournaments.component.scss'],
})
export class TournamentsComponent implements OnInit {

    tournamentID: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    Tournaments: Tournament[] = [];
    TournamentsUpComing: Tournament[] = [];
    TournamentsSchedule: Tournament[] = [];
    TournamentsIncomplete: Tournament[] = [];
    copiedcompletedTournaments: Tournament[] = [];
    copiedTournamentsUpComing: Tournament[] = [];
    copiedTournamentsSchedule: Tournament[] = [];
    copiedTournamentsIncomplete: Tournament[] = [];
    myTournament: Tournament;
    loggedInuser: UserSessionModel;
    isLoading: boolean = true;
    isLoadingUpComing: boolean = true;
    isLoadingSchedule: boolean = true;
    isIncompletedLoading: boolean = true;
    handicapCalculated: PlayerHanidcap[] = [];
    selected: number = 0;
    savePlayers: any[];
    duplicatePlayers: any[];
    selectedProject: string = 'ACME Corp. Backend App';
    categories: any[] = [];
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    tourId: string = '';

    constructor(
        private location: Router,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private facadeService: FacadeService,
        public _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    ngAfterViewInit(): void {
        //this.dataSource.sort = this.sort;
    }

    async ngOnInit() {
        try {
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            let array = {
                id: 0,
                title: 'Completed',
            };
            let arraya = {
                id: 1,
                title: 'Live',
            };
            // let arrayb = {
            //     id: 2,
            //     title: 'Incomplete',
            // };
            let arrayc = {
                id: 2,
                title: 'Upcoming',
            };
            this.categories.push(array);
            this.categories.push(arraya);
            //this.categories.push(arrayb);
            this.categories.push(arrayc);
            //console.log(this.categories);

            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            this.logger.log('Admin comes to Tournament Page', "info");
            this.logger.log('Getting Tournaments Data', "info");
            if (this._localStorage.isSuperAdmin()) {
                let dataTournamentsForCompleted =
                    await this.facadeService.getTournamentsListForCompleted(
                        todayDate
                    );
                this.Tournaments = dataTournamentsForCompleted.CompletedRecently;
                //console.log(this.Tournaments);
                this.copiedcompletedTournaments = this.Tournaments;
               
                this.isLoading = false;
            } else if (this._localStorage.isClubAdmin()) {
                let dataTournamentsForCompleted =
                    await this.facadeService.getTournamentsListByClubForCompleted(
                        todayDate,
                        this.loggedInuser.adminClubId
                    );

                this.Tournaments = dataTournamentsForCompleted.CompletedRecently;
                this.copiedcompletedTournaments = this.Tournaments;
                this.isIncompletedLoading = false;
                this.isLoading = false;
                //console.log(this.Tournaments);
                
            } else if (this._localStorage.isTournamentManager()) {
                let dataTournamentsForCompleted =
                    await this.facadeService.getTournamentsListByAdminForCompleted(
                        todayDate,
                        this.loggedInuser.id
                    );

                this.Tournaments = dataTournamentsForCompleted.CompletedRecently;
                this.copiedcompletedTournaments = this.Tournaments;
                this.isIncompletedLoading = false;
                this.isLoading = false;
                console.log(this.Tournaments);
            } else if (this._localStorage.isTourAdmin() || this._localStorage.isLeagueAdmin()) {
                let state = this._localStorage.get(Constants.STATE);
                if (state == Constants.TOUR) {
                    this.tourId = this._localStorage.get(Constants.TOUR_ID);
                    if (this.tourId) {
                        let dataTournamentsForCompleted =
                            await this.facadeService.getTournamentsListByTourForCompleted(
                                this.tourId
                            );

                        this.Tournaments = dataTournamentsForCompleted.CompletedRecently[0].tournaments;
                        this.copiedcompletedTournaments = this.Tournaments;
                        this.isIncompletedLoading = false;
                        this.isLoading = false;
                        //console.log(this.Tournaments);
                    }
                } else if (state == Constants.LEAGUE) {
                    this.tourId = this._localStorage.get(Constants.LEAGUE_ID);
                    if (this.tourId) {
                        let dataTournamentsForCompleted =
                            await this.facadeService.getTournamentsListByLeague(
                                this.tourId
                            );

                        this.Tournaments = dataTournamentsForCompleted.CompletedRecently[0].tournaments;
                        this.copiedcompletedTournaments = this.Tournaments;
                        this.isIncompletedLoading = false;
                        this.isLoading = false;
                    }
                }
            }
            this.logger.log('Getting Tournaments Data Sucessfully', "info");
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }
    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    filterByCategory($event) {
        //console.log($event);
        try {
            this.logger.log('Admin Select Category Filter in Tournament Page', "info", $event.value);
            if (this._localStorage.isClubAdmin()) {
                if ($event.value == 1) {
                    this.selected = 1;
                    this.getTournamentLive();
                } else if ($event.value == 2) {
                    this.selected = 2;
                    this.getTournamentSchedule();
                } else if ($event.value == 3) {
                    this.selected = 3;
                    this.getTournamentIncompelete();
                } else {
                    this.selected = 0;
                    this.getTournamentCompeleted();
                }
            } else {
                if ($event.value == 1) {
                    this.selected = 1;
                    this.getTournamentLiveForAdmin();
                } else if ($event.value == 2) {
                    this.selected = 2;
                    this.getTournamentScheduleForAdmin();
                } else if ($event.value == 3) {
                    this.selected = 3;
                    this.getTournamentIncompeleteForAdmin();
                } else {
                    this.selected = 0;
                    this.getTournamentCompeletedForAdmin();
                }
            }
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }
    filterByQuery(query) {
        //console.log(query);
        //console.log(this.copiedcompletedTournaments);

        if (query.length > 3) {
            this.Tournaments = this.Tournaments.filter((obj) => {
                return obj.title
                    .toString()
                    .toLowerCase()
                    .includes(query.toString().toLowerCase());
            });
        } else if (query == '' && this.selected == 0) {
            this.Tournaments = this.copiedcompletedTournaments;
        } else if (query == '' && this.selected == 1) {
            this.Tournaments = this.copiedTournamentsUpComing;
        } else if (query == '' && this.selected == 2) {
            this.Tournaments = this.copiedTournamentsSchedule;
        } else if (query == '' && this.selected == 3) {
            this.Tournaments = this.copiedTournamentsIncomplete;
        }
    }
    async getTournamentCompeleted() {
        try {
            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsForCompleted =
                await this.facadeService.getTournamentsListByClubForCompleted(
                    todayDate,
                    this.loggedInuser.adminClubId
                );
            ////console.log(dataTournaments);
            this.isIncompletedLoading = false;
            this.isLoadingUpComing = false;
            this.Tournaments = dataTournamentsForCompleted.CompletedRecently;
            this.copiedcompletedTournaments = this.Tournaments;
            this.logger.log('Getting Compeleted Tournaments Sucessfully', "info");
            this.isLoading = false;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
        ////console.log(this.Tournaments);
    }

    async getTournamentLive() {
        try {
            this.logger.log('Getting Live Tournaments Data', "info");
            this.logger.log('Getting Live Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsLive =
                await this.facadeService.getTournamentsListByClubForLive(
                    todayDate,
                    this.loggedInuser.adminClubId
                );
            //console.log(dataTournamentsLive);

            this.Tournaments = dataTournamentsLive.ActiveTournaments;
            this.copiedTournamentsUpComing = this.Tournaments;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }
    async getTournamentSchedule() {
        try {
            this.logger.log('Getting Schedule Tournaments Data', "info");
            this.logger.log('Getting Schedule Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate() + 1).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsLive =
                await this.facadeService.getTournamentsListByClubForSchedule(
                    todayDate,
                    this.loggedInuser.adminClubId
                );
            //console.log(dataTournamentsLive);

            this.Tournaments = dataTournamentsLive.Scheduled;
            this.copiedTournamentsSchedule = this.Tournaments;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }

        ////console.log("change source");
    }

    async getTournamentIncompelete() {
        try {

            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsLive =
                await this.facadeService.getTournamentsListByClubForIncompelete(
                    todayDate,
                    this.loggedInuser.adminClubId
                );
            this.Tournaments = dataTournamentsLive.Incomplete;
            this.copiedTournamentsIncomplete = this.Tournaments;
            this.logger.log('Getting Incompelete Tournaments Sucessfully', "info");
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }

        ////console.log("change source");
    }

    async getTournamentCompeletedForAdmin() {
        try {
            this.logger.log('Getting Compeleted Tournaments Data', "info");
            this.logger.log('Getting Compeleted Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsForCompleted =
                await this.facadeService.getTournamentsListForCompleted(todayDate);
            ////console.log(dataTournaments);
            this.isIncompletedLoading = false;
            this.isLoadingUpComing = false;
            this.Tournaments = dataTournamentsForCompleted.CompletedRecently;
            this.copiedcompletedTournaments = this.Tournaments;
            this.isLoading = false;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
        ////console.log(this.Tournaments);
    }

    async getTournamentLiveForAdmin() {
        try {
            this.logger.log('Getting Live Tournaments Data', "info");
            this.logger.log('Getting Live Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsForLive =
                await this.facadeService.getTournamentsListForLiveByAdmin(
                    todayDate
                );
            //console.log(dataTournamentsForLive);

            this.Tournaments = dataTournamentsForLive.ActiveTournaments;
            this.copiedTournamentsUpComing = this.Tournaments;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    async getTournamentScheduleForAdmin() {
        try {
            this.logger.log('Getting Schedule Tournaments Data', "info");
            this.logger.log('Getting Schedule Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate() + 1).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsForSchedule =
                await this.facadeService.getTournamentsListForSheduleByAdmin(
                    todayDate
                );
            //console.log(dataTournamentsForSchedule);

            this.Tournaments;
            dataTournamentsForSchedule.Scheduled;
            this.copiedTournamentsSchedule = this.Tournaments;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    async getTournamentIncompeleteForAdmin() {
        try {
            this.logger.log('Getting Incompelete Tournaments Data', "info");
            this.logger.log('Getting Incompelete Tournaments Sucessfully', "info");
            let today: Date = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
            let dataTournamentsForIncomplete =
                await this.facadeService.getTournamentsListForIncompleteByAdmin(
                    todayDate
                );
            this.Tournaments = dataTournamentsForIncomplete.Scheduled;
            this.copiedTournamentsIncomplete = this.Tournaments;
        } catch (error) {
            this.logger.log('Getting Tournaments Data Failed', "error", error.toString());
        }
    }

    redirectToDetails = (id: string) => {
        ////console.log(id);
        this.logger.log('Admin Click on View in Tournamnet Page', "info", id);
        this.location.navigate(['tournaments/view/' + id]);
    };



    menuChange(a) {
        this.logger.log('Admin Change Menu in Tournament Page', "info");
        this.selectedProject = 'Live';
        //console.log(a);
    }
}
