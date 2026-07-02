import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { LogsService } from 'app/shared/services/logs.service';
import { TourService } from './tour.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants } from 'app/shared/classes/general';

@Injectable({
    providedIn: 'root',
})
export class TourResolver {
    loggedInuser: any;
    /**
     * Constructor
     */
    constructor(
        private logger: LogsService,
        private tourService: TourService, private _localStorage: LocalStorageService,
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

            this.logger.log('Getting LeaderBoard Data', "info");
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            if (this._localStorage.isSuperAdmin()) {
                return this.tourService.getTours();
            } else {
                return this.tourService.getTours(this.loggedInuser.id);
            }
        } catch (error) {
            this.logger.log('Getting LeaderBoard Data Failed', "error", error.toString());
        }
    }
}
