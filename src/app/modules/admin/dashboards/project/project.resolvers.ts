import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ProjectService } from 'app/modules/admin/dashboards/project/project.service';
import { Constants } from 'app/shared/classes/general';
import { DatePipe } from '@angular/common';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Injectable({
    providedIn: 'root',
})
export class ProjectResolver {
    loggedInuser: any;
    /**
     * Constructor
     */
    constructor(
        private _projectService: ProjectService,
        private _datePipe: DatePipe, private _localStorage: LocalStorageService, private _router: Router,
        private logger: LogsService
    ) {

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {
        try {

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.logger.log('Getting Dashboard Data', "info");
            let lastWeekSunday = this.currentDate();
            let lastWeekMonday = this.lastSevenDayDate();
            if (this._localStorage.isSuperAdmin()) {
                return this._projectService.getData(
                    null, null,
                    this._datePipe.transform(
                        lastWeekSunday.toString(),
                        'yyyy-MM-dd'
                    ),
                    this._datePipe.transform(
                        lastWeekMonday.toString(),
                        'yyyy-MM-dd'
                    )
                );
            } else if (this._localStorage.isClubAdmin()) {
                return this._projectService.getData(
                    this.loggedInuser.id,
                    this.loggedInuser.adminClubId,
                    this._datePipe.transform(
                        lastWeekSunday.toString(),
                        'yyyy-MM-dd'
                    ),
                    this._datePipe.transform(
                        lastWeekMonday.toString(),
                        'yyyy-MM-dd'
                    )
                );
            } else if (this._localStorage.isClubSecretary()) {
                this._router.navigateByUrl('/reports/dailyPlayer').catch((error) => {
                    console.error('Navigation error:', error);
                });
            } else if (this._localStorage.isFrontDesk()) {
                this._router.navigateByUrl('/reports/playerRegistration').catch((error) => {
                    console.error('Navigation error:', error);
                });
            } else if (this._localStorage.isTourAdmin() || this._localStorage.isLeagueAdmin()) {
                return this._projectService.getTourData(
                    this.loggedInuser.id,
                    this._datePipe.transform(
                        lastWeekSunday.toString(),
                        'yyyy-MM-dd'
                    ),
                    this._datePipe.transform(
                        lastWeekMonday.toString(),
                        'yyyy-MM-dd'
                    )
                );
            } else if (this._localStorage.isTournamentManager()) {
                return this._projectService.getTournamentData(
                    this.loggedInuser.id,
                    this._datePipe.transform(
                        lastWeekSunday.toString(),
                        'yyyy-MM-dd'
                    ),
                    this._datePipe.transform(
                        lastWeekMonday.toString(),
                        'yyyy-MM-dd'
                    )
                );
            }
        } catch (error) {
            this.logger.log('Getting Dashboard Data Failed', "error", error.toString());
        }
    }

    public lastSevenDayDate(): string {
        const currentDate = new Date();

        // Get the date 7 days ago
        const sevenDaysAgo = new Date(currentDate);
        sevenDaysAgo.setDate(currentDate.getDate() - 7);

        // Format the dates in the desired format (YYYY-MM-DD)
        const formattedSevenDaysAgo = sevenDaysAgo.toISOString().slice(0, 10);

        // //console.log('Current Date:', formattedCurrentDate);
        // //console.log('7 Days Ago:', formattedSevenDaysAgo);

        return formattedSevenDaysAgo;
    }
    public currentDate(): string {
        const currentDate = new Date();
        // Format the dates in the desired format (YYYY-MM-DD)
        const formattedCurrentDate = currentDate.toISOString().slice(0, 10);

        return formattedCurrentDate;
    }
    public today() {
        let date = new Date();
        return new Date(date.setDate(date.getDate()));
    }
}
