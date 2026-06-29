import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Crypto } from 'app/shared/classes/crypto';
import { UserSessionModel } from '../models/player.model';
import { Constants } from '../classes/general';

@Injectable({
    providedIn: 'root'
})

export class LocalStorageService {

    constructor(private router: Router) { }

    public set(key: string, value: any) {
        localStorage.setItem(key, Crypto.encryptData(value));
    }

    get(key: string): UserSessionModel | any {
        return Crypto.decryptData(localStorage.getItem(key));
    }

    remove(key: string) {
        localStorage.removeItem(key);
    }

    clear() {
        localStorage.clear();
    }

    isSuperAdmin(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => r.name === 'SuperAdmin');
        }
        return false;
    }

    isClubAdmin(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => r.name === 'ClubAdmin');
        }
        return false;
    }

    isClubSecretary(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => r.name === 'ClubSecretary');
        }
        return false;
    }
    isFrontDesk(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => r.name === 'Front Desk');
        }
        return false;
    }

    isTourAdmin(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => { r.name === 'TourOperator' || r.name === 'TourLeagueAdmin' });
        }
        return false;
    }

    isTournamentManager(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => r.name === 'TournamentManager');
        }
        return false;
    }

    isLeagueAdmin(): boolean {
        let loggedInuser = this.get(Constants.LOGGED_IN_USER);
        if (loggedInuser && loggedInuser.roles) {
            return loggedInuser.roles.some((r: any) => { r.name === 'LeagueAdmin' || r.name === 'TourLeagueAdmin' });
        }
        return false;
    }

    initiateUserSession(user: any): UserSessionModel {
        let roles: { id: number; name: string }[] = [];
        let modules: { id: string; name: string }[] = [];
        let clubId = '';
        let courseId = '';
        let clubInfo: any = user?.membership.length > 0
            ? user.membership[0].club
            : null;
        clubId = clubInfo ? clubInfo.id : '';
        courseId = clubInfo && clubInfo.courses && clubInfo.courses.length > 0
            ? clubInfo.courses[0].id
            : '';
        if (user.roles && user.roles.length > 0) {
            user.roles.forEach((r: any) => {
                if (r.role && r.role?.name != 'User') {
                    let module = r.role?.access?.module;
                    roles.push(r.role);
                    r.role?.access?.forEach((a: any) => {
                        if (a.module) {
                            modules.push(a.module);
                        }
                    })
                }
            })
        }

        let userSession: UserSessionModel = {
            id: user.id,
            name: user.firstName + ' ' + user.lastName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            club: clubInfo,
            phone: user.phone,
            picture: user.picture,
            clubId: clubId,
            adminClubId: clubId,
            courseId: courseId,
            modules: modules,
            roles: roles,

        };
        return userSession;
    }

}