import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import {
    Observable,
    catchError,
    forkJoin,
    from,
    map,
    of,
    pipe,
    switchMap,
} from 'rxjs';
import {
    Player,
    PlayerCategory,
    ClubMembership,
    Marshal,
    handicap_change_log,
} from '../models/player.model';
import * as Query from '../GraphQL/player.gql';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { environment } from 'environments/environment';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
//import { map } from "rxjs/operators";
//import { toDate } from "@angular/common/src/i18n/format_date";

@Injectable({
    providedIn: 'root',
})
export class PlayersService {
    constructor(
        private apollo: Apollo,
        private storage: AngularFireStorage,
        private afAuth: AngularFireAuth,
    ) { }

    public getPlayersPaginated(
        where: any,
        limit: number,
        offset: number,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayersPaginated,
                    variables: { where, limit, offset },
                    fetchPolicy: 'network-only',
                })
                .valueChanges.subscribe(({ data }) => resolve(data));
        });
    }

    public getPlayersList(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayers,
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListReport(): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getPlayersListReport,
            })
            .pipe(map((item) => item.data));
    }
    public getPlayersListReportDateWise(
        fromDate?: any,
        toDate?: any,
    ): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getPlayersListReportDateWise,
                variables: {
                    fromDate: fromDate,
                    toDate: toDate,
                },
            })
            .pipe(map((item) => item.data));
    }
    public getPlayersActivityReport(
        fromDate?: any,
        toDate?: any,
    ): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getPlayersActivityReportDateWise,
                variables: {
                    fromDate: fromDate,
                    toDate: toDate,
                },
            })
            .pipe(map((item) => item.data));
    }
    public getPlayersListByAdminCONGU(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersListByAdminCONGU,
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListMerge(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersMerge,
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public getPlayersListByClub(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersByClub,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListMergeClub(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersListMergeClub,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListByTour(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersByTour,
                    variables: {
                        where: {
                            tourId: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListByLeague(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersListByLeague,
                    variables: {
                        where: {
                            leagueId: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListForTournament(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersList,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListByClubCONGU(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersListByClubCONGU,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getPlayersListByClubOnlyWHS(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersListByClubOnlyWHS,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                            playerCategory: {
                                _nin: [
                                    'Professionals',
                                    'Caddie',
                                    'Senior Professionals',
                                ],
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getTotalPlayersAll(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTotalPlayersAll,
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getallPlayersforGGid(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getallPlayersforGGid,
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getTotalPlayers(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTotalPlayers,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: id,
                                },
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getTotalFlightPlayed(
        id: string,
        fromDate: string,
        toDate: any,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTotalFLightPlayed,
                    variables: {
                        where: {
                            _and: [
                                {
                                    _or: [
                                        {
                                            membership: {
                                                club: { id: { _eq: id } },
                                            },
                                        },
                                        {
                                            guest: { adminClubId: { _eq: id } },
                                        },
                                    ],
                                },
                                {
                                    flights_played: {
                                        flight: { date: { _gte: toDate } },
                                    },
                                },
                                {
                                    flights_played: {
                                        flight: { date: { _lte: fromDate } },
                                    },
                                },
                            ],
                        },
                        date: fromDate,
                        sdate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getTotalFlightPlayedAdmin(
        fromDate: string,
        toDate: any,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTotalFlightPlayedAdmin,
                    variables: {
                        where: {
                            _and: [
                                {
                                    flights_played: {
                                        flight: { date: { _gte: toDate } },
                                    },
                                },
                                {
                                    flights_played: {
                                        flight: { date: { _lte: fromDate } },
                                    },
                                },
                            ],
                        },
                        date: fromDate,
                        sdate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public getFlightPlayedAdmin(courseId: string, date: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getFlightPlayedAdmin,
                    variables: {
                        courseId: courseId,
                        date: date,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public getPlayersListByClubAndCategory(
        id: string,
        category: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersByClub,
                    variables: {
                        where: {
                            _and: [
                                {
                                    membership: {
                                        clubId: {
                                            _eq: id,
                                        },
                                    },
                                },
                                {
                                    playerCategory: {
                                        _eq: category,
                                    },
                                },
                            ],
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public getPlayerHandicapListByClub(clubId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.PlayerHandicapListByClubQL,
                    variables: {
                        clubId: clubId,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public playerUpdatedHandicapReport(
        clubId: string,
        fromDate: string,
        toDate: string,
    ): Promise<any> {
        //console.log(clubId);

        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.playerUpdatedHandicapReport,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public playerUpdatedHandicapReportAdmin(
        fromDate: string,
        toDate: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.playerUpdatedHandicapReportAdmin,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public playerUpdatedHandicapWHSReport(
        clubId: string,
        fromDate: string,
        toDate: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.playerUpdatedHandicapWHSReport,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public playerUpdatedHandicapWHSReportAdmin(
        fromDate: string,
        toDate: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.playerUpdatedHandicapWHSReportAdmin,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    public mergeProfiles(
        oldPlayerId: string,
        newPlayerId: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.MergePlayers,
                    variables: {
                        oldPlayerId: oldPlayerId,
                        newPlayerId: newPlayerId,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
        });
    }

    public getPlayerHandicapListByPlayerId(
        playerId: string,
        fromDate: any,
        toDate: any,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.PlayerHandicapListByplayerIdQL,
                    variables: {
                        where: {
                            _and: [
                                { members: { playerId: { _eq: playerId } } },
                                { date: { _gte: toDate } },
                                { date: { _lte: fromDate } },
                            ],
                        },
                        playerId: playerId,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    getPlayerByID(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayerByID,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    updateUserInFireBase(email: string, password: string): Observable<boolean> {
        // Create the new player's Firebase account using a SECONDARY app instance
        // so the main app's AngularFireAuth session (the admin) is never disturbed.
        return new Observable<boolean>((observer) => {
            const secondaryAppName = `secondary-${Date.now()}`;
            const secondaryApp: FirebaseApp = initializeApp(
                environment.firebase,
                secondaryAppName,
            );
            const secondaryAuth = getAuth(secondaryApp);

            createUserWithEmailAndPassword(secondaryAuth, email, password)
                .then(() => {
                    observer.next(true);
                    observer.complete();
                })
                .catch((error) => {
                    if (error?.code === 'auth/email-already-in-use') {
                        observer.next(true);
                        observer.complete();
                    } else {
                        observer.next(false);
                        observer.error(error);
                    }
                })
                .finally(() => {
                    // Clean up the secondary app so it doesn't accumulate
                    deleteApp(secondaryApp).catch(() => { });
                });
        });
    }

    sendTransactionalEmail(
        email: string,
        name: string,
        password: string,
    ): Observable<any> {
        return this.apollo
            .subscribe<boolean>({
                query: Query.emailAction,
                variables: {
                    request: {
                        email: email,
                        name: name,
                        password: password,
                    },
                },
            })
            .pipe(map((item) => item.data));
    }

    getPlayersByID(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayersByID,
                    variables: {
                        where: {
                            addedBy: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }
    getPlayerByIDDetailForm(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getPlayerByIDDetailForm,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    getPlayerByGEMID(GEMID: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFilter,
                    variables: {
                        where: {
                            gemId: {
                                _eq: GEMID,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }

    public getPlayerByPhone(phone: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFilter,
                    variables: {
                        where: {
                            phone: {
                                _eq: phone,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }

    getPlayerByMembershipNumberForSearch(
        clubID: string,
        membershipNumber: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFilter,
                    variables: {
                        where: {
                            _and: [
                                { membership: { clubId: { _eq: clubID } } },
                                { membershipNumber: { _eq: membershipNumber } },
                            ],
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }
    getPlayerByMembershipNumber(membershipNumber: any): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByMembershipNumber,
                    variables: {
                        where: { membershipNumber: { _eq: membershipNumber } },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }
    getTotalFlightsPlayedByPlayer(id: any): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getTotalFlightsPlayedByPlayer,
                    variables: {
                        where: { playerId: { _eq: id } },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    getPlayerByEmail(email: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFilter,
                    variables: {
                        where: {
                            email: {
                                _eq: email,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }
    getPlayerByEmailLogin(email: string): Observable<any> {
        return this.apollo
            .subscribe<any>({
                query: Query.getPlayerByEmailLogin,
                variables: {
                    where: {
                        email: {
                            _eq: email,
                        },
                    },
                },
            })
            .pipe(map((item) => item.data['player']));
    }

    getPlayerByFirstName(firstName: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFirstName,
                    variables: {
                        where: {
                            _and: [
                                {
                                    firstName: {
                                        _eq: firstName,
                                    },
                                    phone: {
                                        _is_null: true,
                                    },
                                },
                            ],
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }

    getPlayerByCategory(category: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByFilter,
                    variables: {
                        where: {
                            playerCategory: {
                                _eq: category,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    getPlayerByClub(clubId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerByClub,
                    variables: {
                        where: {
                            clubId: {
                                _eq: clubId,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }
    getProfessionalByClub(clubId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.getProfessionalByClub,
                    variables: {
                        where: {
                            clubId: {
                                _eq: clubId,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    public searchPlayer(
        firstName: string,
        lastName: string,
        playerCategory: string,
        handicapLower: number,
        handicapUpper: number,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.searchPlayerQL,
                    variables: {
                        firstName: firstName,
                        lastName: lastName,
                        playerCategory: playerCategory,
                        handicapLower: handicapLower,
                        handicapUpper: handicapUpper,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public searchPlayerForTournament(
        fullName: string,
        handicapLower: number,
        handicapUpper: number,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.searchPlayerForTournamentQL,
                    variables: {
                        fullName: fullName,
                        handicapLower: handicapLower,
                        handicapUpper: handicapUpper,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public AddPlayer(player: Player): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddMutation,
                    variables: {
                        objects: [
                            {
                                id: player.id,
                                adminClubId: player.adminClubId,
                                firebaseUid: player.firebaseUid,
                                fcmToken: player.fcmToken,
                                gemId: player.gemId,
                                addedBy: player?.addedBy ?? null,
                                firstName: player.firstName,
                                lastName: player.lastName,
                                handicapWhsIndex: player.handicapWhsIndex,
                                gender: player.gender,
                                dob: player.dob,
                                picture: player.picture,
                                email: player.email,
                                phone: player.phone,
                                playerCategory: player.playerCategory,
                                handicap: player.handicap,
                                online: player.online,
                                extraData: player.extraData,
                                countryCode: player.countryCode,
                                homeClubId: player.homeClubId,
                                userRole: player.userRole,
                                membershipNumber: player.membershipNumber,
                                membership: {
                                    data: player.playerCategory === 'Professionals' ? [] : player?.membership ?? [],
                                },
                                professionalMembership: {
                                    data: player.playerCategory === 'Professionals' ? player?.membership ?? [] : [],
                                },
                                roles: {
                                    data: [{ roleId: player.userRole }],
                                },
                            },
                        ],
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could not add due to ' + error);
                    },
                );
        });
    }
    public AddTourPlayer(player: Player, tourMember: any): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddTourMemberMutation,
                    variables: {
                        objects: [
                            {
                                id: player.id,
                                adminClubId: null,
                                firebaseUid: player.firebaseUid,
                                fcmToken: player.fcmToken,
                                gemId: player.gemId,
                                firstName: player.firstName,
                                lastName: player.lastName,
                                gender: player.gender,
                                dob: player.dob,
                                picture: player.picture,
                                email: player.email,
                                phone: player.phone,
                                playerCategory: player.playerCategory,
                                handicap: player.handicap,
                                online: player.online,
                                extraData: player.extraData,
                                countryCode: player.countryCode,
                                userRole: player.userRole,
                                membershipNumber: player.membershipNumber,
                            },
                        ],
                        tourMember: tourMember,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could not add due to ' + error);
                    },
                );
        });
    }
    public AddLeaguePlayer(
        player: Player,
        leagueMember: any,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddLeagueMemberMutation,
                    variables: {
                        objects: [
                            {
                                id: player.id,
                                adminClubId: null,
                                firebaseUid: player.firebaseUid,
                                fcmToken: player.fcmToken,
                                gemId: player.gemId,
                                firstName: player.firstName,
                                lastName: player.lastName,
                                gender: player.gender,
                                dob: player.dob,
                                picture: player.picture,
                                email: player.email,
                                phone: player.phone,
                                playerCategory: player.playerCategory,
                                handicap: player.handicap,
                                online: player.online,
                                extraData: player.extraData,
                                countryCode: player.countryCode,
                                userRole: player.userRole,
                                membershipNumber: player.membershipNumber,
                            },
                        ],
                        leagueMember: leagueMember,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could not add due to ' + error);
                    },
                );
        });
    }

    public AddHandicapRemarks(
        handicap_change_log: handicap_change_log,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddMutationHandicapLog,
                    variables: {
                        objects: [
                            {
                                id: handicap_change_log.id,
                                playerId: handicap_change_log.playerId,
                                oldHandicap: handicap_change_log.oldHandicap,
                                newHandicap: handicap_change_log.newHandicap,
                                whs: handicap_change_log.whs,
                                dateTime: handicap_change_log.dateTime,
                                remarks: handicap_change_log.remarks,
                                tournamentId: handicap_change_log.tournamentId,
                                updaterId: handicap_change_log.updaterId,
                            },
                        ],
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could not add due to ' + error);
                    },
                );
        });
    }

    public importPlayerList(
        players: any[],
        clubMembers: any[],
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.SavePlayersList,
                    variables: {
                        playersToSave: players,
                        clubmembers: clubMembers,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log("Could not add due to " + error);
                    },
                );
        });
    }

    public insertClubMember(clubMembers: any[]): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertClubMember,
                    variables: {
                        clubmembers: clubMembers,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log("Could not add due to " + error);
                    },
                );
        });
    }

    public createClubMemberSubscription(subscription: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.apollo.mutate<any>({
                mutation: Query.CreateClubMemberSubscription,
                variables: {
                    object: subscription,
                },
            }).subscribe({
                next: ({ data }) => {
                    resolve(data.insert_club_member_subscription_one);
                },
                error: (error) => {
                    console.error('Error creating club member subscription:', error);
                    reject(error);
                }
            });
        });
    }

    public getClubMemberSubscription(playerId: string, clubId: string, startDate: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.apollo.watchQuery<any>({
                query: Query.GetClubMemberSubscriptionByPlayerAndMonth,
                variables: { playerId, clubId, startDate },
                fetchPolicy: 'network-only',
            }).valueChanges.subscribe({
                next: ({ data }) => {
                    resolve(data.club_member_subscription);
                },
                error: (error) => {
                    console.error('Error fetching club member subscription:', error);
                    reject(error);
                }
            });
        });
    }

    public updateClubMemberSubscription(id: string, subscription: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.apollo.mutate<any>({
                mutation: Query.UpdateClubMemberSubscription,
                variables: {
                    id: id,
                    object: subscription,
                },
            }).subscribe({
                next: ({ data }) => {
                    resolve(data.update_club_member_subscription_by_pk);
                },
                error: (error) => {
                    console.error('Error updating club member subscription:', error);
                    reject(error);
                }
            });
        });
    }

    updatePlayer(player: Player): Promise<boolean> {
        //console.log(player.id);
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UpdateMutation,
                    variables: {
                        where: {
                            id: {
                                _eq: player.id,
                            },
                        },
                        set: {
                            adminClubId: player.adminClubId,
                            firebaseUid: player.firebaseUid,
                            fcmToken: player.fcmToken,
                            gemId: player.gemId,
                            firstName: player.firstName,
                            lastName: player.lastName,
                            gender: player.gender,
                            dob: player.dob,
                            picture: player.picture,
                            email: player.email,
                            phone: player.phone,
                            playerCategory: player.playerCategory,
                            handicap: player.handicap,
                            online: player.online,
                            extraData: player.extraData,
                            countryCode: player.countryCode,
                            userRole: player.userRole,
                            membershipNumber: player.membershipNumber,
                        },
                        playerID: player.id,
                        clubID: player.membership[0].clubId,
                        suspended: player.membership[0].suspended,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could update add due to ' + error);
                    },
                );
        });
    }

    updatePlayerProfile(player: Player, file: File): Observable<string> {
        if (file) {
            const fileName = 'profile/' + player.id + '.png';
            const ref = this.storage.ref(fileName);
            const task = ref.put(file);

            return from(task).pipe(
                switchMap((snapshot: any) => {
                    return ref.getDownloadURL();
                }),
                switchMap((downloadUrl: string) => {
                    // Update the picture URL in the account object
                    player.picture = downloadUrl;

                    // Perform the mutation using Apollo client
                    return this.apollo
                        .mutate<any>({
                            mutation: Query.UpdatePlayerProfileMutation,
                            variables: {
                                where: {
                                    id: {
                                        _eq: player.id ?? 'asdasdasdah7',
                                    },
                                },
                                set: {
                                    adminClubId: player.adminClubId,
                                    firebaseUid: player.firebaseUid,
                                    fcmToken: player.fcmToken,
                                    gemId: player.gemId,
                                    firstName: player.firstName,
                                    lastName: player.lastName,
                                    gender: player.gender,
                                    dob: player.dob,
                                    picture: player.picture,
                                    email: player.email,
                                    phone: player.phone,
                                    playerCategory: player.playerCategory,
                                    handicap: player.handicap,
                                    online: player.online,
                                    extraData: player.extraData,
                                    countryCode: player.countryCode,
                                    homeClubId: player.homeClubId,
                                    userRole: player.userRole,
                                    membershipNumber: player.membershipNumber,
                                },
                            },
                        })
                        .pipe(
                            map((response: any) => {
                                // Return the download URL
                                return downloadUrl;
                            }),
                        );
                }),
            );
        } else {
            return this.apollo
                .mutate<any>({
                    mutation: Query.UpdatePlayerProfileMutation,
                    variables: {
                        where: {
                            id: {
                                _eq: player.id ?? 'asdasdasdah7',
                            },
                        },
                        set: {
                            adminClubId: player.adminClubId,
                            firebaseUid: player.firebaseUid,
                            fcmToken: player.fcmToken,
                            gemId: player.gemId,
                            firstName: player.firstName,
                            lastName: player.lastName,
                            gender: player.gender,
                            dob: player.dob,
                            picture: player.picture,
                            email: player.email,
                            phone: player.phone,
                            playerCategory: player.playerCategory,
                            handicap: player.handicap,
                            online: player.online,
                            extraData: player.extraData,
                            countryCode: player.countryCode,
                            homeClubId: player.homeClubId,
                            userRole: player.userRole,
                            membershipNumber: player.membershipNumber,
                        },
                    },
                })
                .pipe(
                    map((response: any) => {
                        // Return the download URL
                        return response;
                    }),
                );
        }
    }

    updateConguHandicap(id, newHandicap, tournamentId): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UpdateHandicapMutation,
                    variables: {
                        id: id,
                        handicap: newHandicap,
                        tournamentId: tournamentId,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could update add due to ' + error);
                    },
                );
        });
    }

    freezePlayerHandicap(
        playerId: string,
        startDate: string,
        endDate: string,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.FreezePlayerHandicapMutation,
                    variables: {
                        playerId: playerId,
                        startDate: startDate,
                        endDate: endDate,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could update add due to ' + error);
                    },
                );
        });
    }

    unFreezePlayerHandicap(
        playerId: string,
        startDate: string,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.unFreezePlayerHandicapMutation,
                    variables: {
                        playerId: playerId,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could update add due to ' + error);
                    },
                );
        });
    }

    changePlayerTee(id, tournamentId, tee, teeId): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UpdatePlayerTeeMutation,
                    variables: {
                        id: id,
                        tournamentId: tournamentId,
                        tee: tee,
                        teeId: teeId,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could update add due to ' + error);
                    },
                );
        });
    }
    deletePlayer(clubId: string, playerId: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeletePlayer,
                    variables: {
                        where: {
                            _and: [
                                {
                                    clubId: {
                                        _eq: clubId,
                                    },
                                    playerId: {
                                        _eq: playerId,
                                    },
                                },
                            ],
                        },
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could delete add due to ' + error);
                    },
                );
        });
    }

    getPlayerFlightScores(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.PlayerFlightScoresQuery,
                    variables: {
                        playerId: id,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }
    getPlayerFlights(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getPlayerFlightsQuery,
                    variables: {
                        playerId: id,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    getPlayerlistbyName(FirstName: string, LastName: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetPlayerlistbyName,
                    variables: {
                        where: {
                            _or: [
                                {
                                    firstName: {
                                        _ilike: '%' + FirstName + '%',
                                    },
                                },
                                {
                                    lastName: {
                                        _ilike: '%' + LastName + '%',
                                    },
                                },
                            ],
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }
    getPlayerlistbyNameClubWise(
        clubId: string,
        FirstName: string,
        LastName: string,
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.getPlayerlistbyNameClubWise,
                    variables: {
                        where: {
                            membership: {
                                clubId: {
                                    _eq: clubId,
                                },
                            },
                            _or: [
                                {
                                    firstName: {
                                        _ilike: '%' + FirstName + '%',
                                    },
                                },
                                {
                                    lastName: {
                                        _ilike: '%' + LastName + '%',
                                    },
                                },
                            ],
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data.player);
                });
        });
    }

    getPlayerTodayRound(playerId: string, Date: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.GetPlayerTodayRoundQL,
                    variables: {
                        playerId: playerId,
                        toDate: Date,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data.flight);
                });
        });
    }

    public getAllPlayersByCategory(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.AllPlayersByCategoryQL,
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public createTournamentMarshals(marshals: Marshal[]): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.createMarshalQL,
                    variables: {
                        objects: marshals,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        //console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    },
                );
        });
    }
    public updatePlayerCategory(membershipNumber: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.updatePlayerCatQL,
                    variables: {
                        membershipNumber: membershipNumber,
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    getPlayerWHS(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.PlayerHandicapQuery,
                    variables: {
                        playerId: id,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }
    getPlayerAllWHS(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.PlayerHandicapAllWHSQuery,
                    variables: {
                        playerId: id,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }
    getPlayerWHSRound(courseRating: any): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.PlayerHandicapRoundQuery,
                    variables: {
                        courseId: courseRating.courseId,
                        courseHoleSets: courseRating.courseHoleSets,
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    public getPlayerCategories(): Array<PlayerCategory> {
        const CLUB_CATEGORIES: PlayerCategory[] = [
            { id: 1, name: 'Amateurs' },
            { id: 2, name: 'Senior Amateurs' },
            { id: 3, name: 'Junior Amateurs' },
            { id: 4, name: 'Professionals' },
            { id: 5, name: 'Senior Professionals' },
            { id: 6, name: 'Junior Professionals' },
            { id: 7, name: 'Veterans' },
            { id: 8, name: 'Juniors' },
            { id: 9, name: 'Ladies' },
            { id: 10, name: 'Junior Ladies' },
            { id: 11, name: 'Pro-Am' },
            { id: 12, name: 'Caddy' },
            { id: 12, name: 'Masters' },
            //     { id: 12, name: 'AGC Members & PAF Officers' },
            //     { id: 13, name: 'Ladies A' },
            //     { id: 14, name: 'Ladies B' },
            //     { id: 15, name: 'Subsidiary Amateurs' },
            //     { id: 16, name: 'Invitational' },
            //     { id: 17, name: 'Junior Boy(18-21)' },
            //     { id: 18, name: 'Junior Boy(16-18)' },
            //     { id: 19, name: 'Junior Boy(12-16)' },
            //     { id: 20, name: 'Junior Girl(16-21)' },
            //     { id: 21, name: 'Junior Gril(12-16)' },
            // ];
        ];

        return CLUB_CATEGORIES;
    }
    public getPlayerCategoriesKGC(): Array<PlayerCategory> {
        const CLUB_CATEGORIES: PlayerCategory[] = [
            { id: 1, name: 'Amateurs' },
            { id: 2, name: 'Senior' },
            { id: 3, name: 'Junior' },
            { id: 7, name: 'Veterans' },
            { id: 9, name: 'Ladies' },
        ];
        return CLUB_CATEGORIES;
    }

    public verifyUserEmails(userEmails: string[]) {
        return new Promise((resolve) => {
            this.apollo
                .mutate({
                    mutation: Query.verifyUserEmailQL,
                    variables: {
                        request: {
                            emails: userEmails,
                        },
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        //console.log('Could not delete due to: ' + error);
                        //console.log(error);
                        resolve(false);
                    },
                );
        });
    }

    public executeSendResetEmailInBulk(userEmails: any[]) {
        const resetObservables = userEmails.map((account) =>
            this.sendUserResetEmail(account.Email),
        );

        return forkJoin(resetObservables);
    }

    sendUserResetEmail(email: string): Observable<boolean> {
        return from(this.afAuth.sendPasswordResetEmail(email)).pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }

    public getPlayersListByTournament(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersByTournament,
                    variables: {
                        where: { tournamentId: { _eq: id } },
                    },
                })
                .subscribe(({ data }) => {
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    public getPlayerActivityByUserId(userId: string): Observable<any[]> {
        return this.apollo
            .subscribe({
                query: Query.GetPlayerActivityByUserId,
                variables: { userId },
            })
            .pipe(map((res: any) => res.data?.user_activity_log || []));
    }
}
