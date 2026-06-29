import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Constants } from 'app/shared/classes/general';
import { DatePipe } from '@angular/common';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { PlayerService } from './players.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerResolver  {
    loggedInuser: any;
    /**
     * Constructor
     */
    constructor(
        private _projectService: PlayerService, private _localStorage: LocalStorageService, private _router: Router,
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
            if (this._localStorage.isSuperAdmin()) {
                return this._projectService.getData();
            } else if (this._localStorage.isClubAdmin()) {
                return this._projectService.getData();
            } 
        } catch (error) {
            this.logger.log('Getting Dashboard Data Failed', "error", error.toString());
        }
    }
}
