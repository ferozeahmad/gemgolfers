import { Injectable } from '@angular/core';
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { PlayerRegistrationService } from './player-registration.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants } from 'app/shared/classes/general';

@Injectable({
  providedIn: 'root',
})
export class PlayerRegistrationResolver implements Resolve<any> {
  constructor(
    private _service: PlayerRegistrationService,
    private _localStorage: LocalStorageService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    const loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);
    const clubId = loggedInUser?.clubId || '';
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    return this._service.getGuestEntries(clubId, todayDate);
  }
}
