import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import {
    AddDailyRound,
    Tournament,
    TournamentCategory,
    TournamentMember,
} from '../models/tournament.model';
import {
    handicap_change_log,
    Player,
    PlayerHanidcap,
} from '../models/player.model';
import * as Query from '../GraphQL/tournament.gql';
import { Observable, tap, from, switchMap, map } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Team } from '../models/team.model';

@Injectable({
    providedIn: 'root',
})
export class TournamentsService {
    constructor(private apollo: Apollo, private storage: AngularFireStorage) { }

    public getTournamentsListForCompleted(endDate: Date): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamentsForAdminCompeleted,

                    variables: {
                        endDate: endDate,
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

    updateTournamentBanner(banner, file: File): Observable<string> {
        if (file) {
            const fileName = 'profile/' + banner.touranmentId + '.png';
            const ref = this.storage.ref(fileName);
            const task = ref.put(file);

            return from(task).pipe(
                switchMap((snapshot: any) => {
                    return ref.getDownloadURL();
                }),
                switchMap((downloadUrl: string) => {
                    // Update the picture URL in the account object
                    banner.ad = downloadUrl;

                    // Perform the mutation using Apollo client
                    return this.apollo
                        .mutate<any>({
                            mutation: Query.insertTournamentBanner,
                            variables: {
                                objects: [
                                    {
                                        tournamentId: banner.touranmentId,
                                        ad: banner.ad,
                                        firstRow: banner.firstRow,
                                        repetitionInterval: banner.repetitionInterval,
                                    }
                                ]
                            },
                        })
                        .pipe(
                            map((response: any) => {
                                // Return the download URL
                                return downloadUrl;
                            })
                        );
                })
            );
        }
    }

    public getTournamentsListReport(): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.GetTournamentsReport,

            })
            .pipe(map((item) => item.data))
    }
    public getTournamentListByDate(fromDate?: any, toDate?: any): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.GetTournamentsReportByDate,
                variables: {
                    fromDate: fromDate,
                    toDate: toDate,
                },
            })
            .pipe(map((item) => item.data))
    }
    public getLeaguesListByDate(fromDate?: any, toDate?: any): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getLeaguesListByDate,
                variables: {
                    fromDate: fromDate,
                    toDate: toDate,
                },
            })
            .pipe(map((item) => item.data))
    }

    public getTournamentsListForLiveByAdmin(endDate: Date): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForLiveByAdmin,

                    variables: {
                        endDate: endDate,
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
    public getTournamentsListForSheduleByAdmin(endDate: Date): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForScheduleByAdmin,

                    variables: {
                        endDate: endDate,
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
    public getTournamentsListForIncompleteByAdmin(endDate: Date): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForIncompleteByAdmin,

                    variables: {
                        endDate: endDate,
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

    public getTournamentsListByClub(
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamentsByClub,
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
    public getTournamentsListByCourse(
        courseId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTournamentsListByCourse,
                    variables: {
                        courseId: courseId,
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

    public getTournamentsListByClubForCompleted(
        endDate: Date,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForCompleted,
                    variables: {
                        endDate: endDate,
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
    public getTournamentsListByAdminForCompleted(
        endDate: Date,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTournamentsListByAdminForCompleted,
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
    public getTournamentsListByTourForCompleted(
        tourId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTournamentsListByTourForCompleted,
                    variables: {
                        tourId: tourId,
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
    public getTournamentsListByLeague(
        tourId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTournamentsListByLeague,
                    variables: {
                        tourId: tourId,
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
    public getTournamentsListForLive(
        endDate: Date,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForLive,
                    variables: {
                        endDate: endDate,
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

    public getTournamentsListByClubForSchedule(
        endDate: Date,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForSchedule,
                    variables: {
                        endDate: endDate,
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

    public getTournamentsListByClubForIncompelete(
        endDate: Date,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamnetListForIncomplete,
                    variables: {
                        endDate: endDate,
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

    public getActiveTournamentsList(todayDate: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetTournamentsByClub,
                    variables: {
                        where: {
                            endDate: {
                                _gte: todayDate,
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

    public getDailyRounds(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {
        //console.log(clubId);
        //console.log(fromDate);
        //console.log(toDate);
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.ClubSingleRoundFlightsQueryQL,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsSingle(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.ClubSingleRoundFlightsQueryQLs,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyCardSingle(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getDailyCardSingle,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyTeeTimeReportClub(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getDailyTeeTimeReportClub,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsSingleAdmin(
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.ClubSingleRoundFlightsAdminQueryQLs,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyCardSingleAdmin(
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getDailyCardSingleAdmin,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyTeeTimeReportAdmin(
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getDailyTeeTimeReportAdmin,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsStat(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.DailyRoundsStatQueryQLs,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsStatAdmin(
        fromDate: string,
        toDate: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.DailyRoundsStatQueryAdminQLs,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsSingleDashboardAll(
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.DailyRoundsSingleDashboardQueryQLsAll,
                    variables: {
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getDailyRoundsSingleDashboard(
        clubId: string,
        fromDate: string,
        toDate: string
    ): Promise<any> {

        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.DailyRoundsSingleDashboardQueryQLs,
                    variables: {
                        clubId: clubId,
                        fromDate: fromDate,
                        toDate: toDate,
                    },
                })
                .subscribe(({ data }) => {
                    // //console.log(data);
                    resolve(data);
                });
        });
    }
    public getSingleDailyRound(
        clubId: string,

        Date: string
    ): Promise<any> {
        //console.log(clubId);
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.ClubSingleRoundFlightsQueryQLA,
                    variables: {
                        clubId: clubId,

                        toDate: Date,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getSingleDailyRoundAdmin(Date: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.ClubSingleRoundFlightsQueryAdminQLA,
                    variables: {
                        toDate: Date,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getTeeTimesSlots(
        clubId: string,

        Date: string
    ): Promise<any> {
        //console.log(clubId);
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getTeeTimesSlots,
                    variables: {
                        clubId: clubId,

                        toDate: Date,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getTeeTimesSlotsAdmin(Date: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getTeeTimesSlotsAdmin,
                    variables: {
                        toDate: Date,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getRoundScore(Id: any): Promise<any> {
        //console.log(Id);
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.RoundScoreQLA,
                    variables: {
                        id: Id,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }
    public getPlayerScorebyID(Id: any): Promise<any> {
        //console.log(Id);
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getPlayerScorebyIDQLA,
                    variables: {
                        id: Id,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }

    public getClubActiveTournamentsList(
        endDate: string,
        clubId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetUpCommingTournamentsByClub,
                    variables: {
                        where: {
                            _and: [
                                {
                                    endDate: {
                                        _gte: endDate,
                                    },
                                    clubId: {
                                        _eq: clubId,
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

    public getLeagues(): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getLeagues,
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getLeaguesReport(): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getLeagues,
            })
            .pipe(map((item) => item.data))
    }
    public getToursListByDate(fromDate?: any, toDate?: any): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getToursListByDate,
                variables: {
                    fromDate: fromDate,
                    toDate: toDate,
                },
            })
            .pipe(map((item) => item.data))
    }
    public getToursReport(): Observable<any> {
        return this.apollo
            .subscribe({
                query: Query.getToursReport,
            })
            .pipe(map((item) => item.data))
    }
    public getLeaguesByClub(id): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getLeaguesByClub,
                    variables: {
                        adminId: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getLeagueById(id): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getLeagueById,
                    variables: {
                        id: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data?.league?.[0]);
                    }
                });
        });
    }
    public getLeaguesMembers(id): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getLeaguesMembers,
                    variables: {
                        adminId: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getTourMembers(id): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTourMembers,
                    variables: {
                        adminId: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getLeageLeaderBoards(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getLeageLeaderBoards,
                    variables: {
                        leagueId: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getLeagueName(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getLeagueName,
                    variables: {
                        leagueId: id,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }



    public LeaderboardSubscription(tournamentId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.LeaderboardSubscription,
                    variables: {
                        tournamentPrefix: tournamentId,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }

    public tournamentDashBoard(tournamentId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.tournamentDashBoard,
                    variables: {
                        tournamentPrefix: tournamentId,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }
    public getTourGuide(tourId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.getTourGuides,
                    variables: {
                        tourId: tourId,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    //console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }

    public LeaderboardSubscriptions(
        tournamentId: string,
        cat: any
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.LeaderboardSubscriptions,
                    variables: {
                        where: {
                            _and: [
                                {
                                    tournamentId: {
                                        _eq: tournamentId,
                                    },
                                },
                                {
                                    category: {
                                        _eq: cat,
                                    },
                                },
                            ],
                        },
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        ////console.log(data);
                        resolve(data);
                    }
                });
        });
    }



    public checkPrefix(prefix: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.GetTournementByFilter,
                    variables: {
                        where: {
                            prefix: {
                                _eq: prefix,
                            },
                        },
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data.tournament);
                });
        });
    }


    public tournamentScoreLoader(tournamentId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.TournamentScoresQuery,
                    variables: {
                        tournamentId: tournamentId,
                    },
                })
                .subscribe(({ data }) => {
                    ////console.log(data.tournament_by_pk);
                    ////console.log(data);
                    if (!data) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
        });
    }

    getTournamentByID(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetTournamentByID,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    getTournamentByIDForSetup(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetTournamentByIDForSetup,
                    fetchPolicy: 'network-only',
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    getTournamentByIDForSignUpUsers(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.getTournamentByIDForSignUpUsers,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .valueChanges.subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    getFlightSettings(tournamentId: string, category: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .watchQuery<any>({
                    query: Query.GetFlightSettings,
                    variables: {
                        where: {
                            tournamentId: {
                                _eq: tournamentId,
                            },
                            category: {
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

    // deleteActiveTournament( tou: string) : Promise<boolean> {

    //   return new Promise( resolve => {
    //     this.apollo.mutate<any>({
    //       mutation: Query.DeletePlayer,
    //       variables: {
    //         'where': {
    //           'clubId': {
    //             '_eq': clubId
    //           },
    //           'playerId': {
    //             '_eq': playerId
    //           }
    //         }
    //       }
    //     }).subscribe(({ data }) => {
    //       //console.log(data);
    //       resolve(true);
    //     }, (error) => {
    //       resolve(false);
    //       //console.log('Could delete add due to ' + error);
    //     });
    //   });
    // }
    public addTour(tour: any, file: File): Observable<string> {
        const fileName = 'tour/' + tour.id + '.png';
        const ref = this.storage.ref(fileName);
        const task = ref.put(file);

        return from(task).pipe(
            switchMap((snapshot: any) => {
                return ref.getDownloadURL();
            }),
            switchMap((downloadUrl: string) => {
                // Update the picture URL in the account object
                tour.logo = downloadUrl;

                // Perform the mutation using Apollo client
                return this.apollo
                    .mutate<any>({
                        mutation: Query.insertTourQL,
                        variables: {
                            tour: tour
                        },
                    })
                    .pipe(
                        map((response: any) => {
                            // Return the download URL
                            return downloadUrl;
                        })
                    );
            })
        );
    }
    public addLeague(league: any, file: File): Observable<string> {
        const fileName = 'league/' + league.id + '.png';
        const ref = this.storage.ref(fileName);
        const task = ref.put(file);

        return from(task).pipe(
            switchMap((snapshot: any) => {
                return ref.getDownloadURL();
            }),
            switchMap((downloadUrl: string) => {
                // Update the picture URL in the account object
                league.logo = downloadUrl;

                // Perform the mutation using Apollo client
                return this.apollo
                    .mutate<any>({
                        mutation: Query.insertLeagueQL,
                        variables: {
                            league: league
                        },
                    })
                    .pipe(
                        map((response: any) => {
                            // Return the download URL
                            return downloadUrl;
                        })
                    );
            })
        );
    }
    public addTournament(tmnt: any, flightId: string = '', slotId: string = '', count = 0): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddMutation,
                    variables: {
                        objects: [
                            {
                                id: tmnt.id,
                                clubId: tmnt.clubId,
                                leagueId: tmnt.leagueId,
                                courseId: tmnt.courseId,
                                adminId: tmnt.adminId,
                                title: tmnt.title,
                                prefix: tmnt.prefix,
                                secondFormat: tmnt.secondFormat,
                                skipCategory: tmnt.skipCategory,
                                courseHoleSets: tmnt.courseHoleSets,
                                teamMatch: tmnt.teamMatch,
                                pairsMatch: tmnt.pairsMatch,
                                interLeague: tmnt.interLeague,
                                approved: tmnt.approved,
                                publicTournament: tmnt.publicTournament,
                                confirmParticipants: tmnt.confirmParticipants,
                                noOfRounds: tmnt.noOfRounds,
                                inviteCode: tmnt.inviteCode ?? null,
                                activeRound: tmnt.activeRound,
                                matchFormat: tmnt.matchFormat,
                                playingOnWhs: tmnt.playingOnWhs,
                                isSetupComplete: tmnt.isSetupComplete,
                                currentTab: tmnt.currentTab,
                                pointsFormats: tmnt.pointsFormats,
                                pointsValues: tmnt.pointsValues,
                                handicapAllocations: tmnt.handicapAllocations,
                                strokeAllocation: tmnt.strokeAllocation,
                                tee: tmnt.tee,
                                scoreManagement: tmnt.scoreManagement,
                                startDate: tmnt.startDate,
                                endDate: tmnt.endDate,
                                tournamentFlight: tmnt.tournamentFlight,
                                started: tmnt.started,
                                invited: tmnt.invited,
                                singleRound: tmnt.singleRound,
                                sponsorName: tmnt.sponsorName,
                                sponsorLogo: tmnt.sponsorLogo,
                                mobileLogoUrl: tmnt.mobileLogoUrl,
                                webLogoUrl: tmnt.webLogoUrl,
                                noOfMarshals: tmnt?.noOfMarshals?.toString() ?? null,
                                marshalsStartWith: tmnt.marshalsStartWith,
                                flightsCategory: tmnt.flightsCategory,
                                subTournament: tmnt.subTournament,
                                multiFormat: tmnt.multiFormat,
                                createdAt: tmnt.createdAt,
                                tourId: tmnt.tourId,
                                categories: {
                                    data: tmnt.categories,
                                },
                                marshals: {
                                    data: tmnt.marshals,
                                },
                                flights: {
                                    data: tmnt.flights,
                                },
                                members: {
                                    data: tmnt.members,
                                },
                                tournament_round_courses: {
                                    data: tmnt.tournament_round_courses ? tmnt.tournament_round_courses : [],
                                },
                            },
                        ],
                        flightId: flightId,
                        slotId: slotId,
                        count: count,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }
    public addSubTournament(obj: any): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.AddSubTournamentMutation,
                    variables: {
                        subTournaments: obj,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    /*
    updateClub(club:Tournament): Promise<boolean> {
      //console.log(club.id);
      return new Promise( resolve => {
        this.apollo.mutate<any>({
          mutation: Query.UpdateMutation,
          variables: {
            'where': {
              'id': {
                '_eq': club.id
              }
            },
            'set':
            {
              'name': club.name,
              'address': club.address,
              'email': club.email,
              'phone': club.phone
            }
          }
        }).subscribe(({ data }) => {
          resolve(true);
        }, (error) => {
          resolve(false);
          //console.log('Could update add due to ' + error);
        });
      });
    } */

    deleteTournamentMember(
        tournamentId: string,
        playerId: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteTournamentMember,
                    variables: {
                        where: {
                            _and: [
                                {
                                    tournamentId: {
                                        _eq: tournamentId,
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
                    }
                );
        });
    }

    updateTournamentMemberHandicap(
        tournamentId: string,
        playerId: string,
        handicap: string // or number
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UpdateTournamentAndFlightHandicap, // Use the updated mutation
                    variables: {
                        tournamentId: tournamentId,
                        playerId: playerId,
                        // Ensure handicap is a number if your DB expects Int/Numeric
                        handicap: handicap
                    },
                })
                .subscribe(
                    ({ data }) => {
                        // Returns true if either update affected at least one row
                        const success =
                            data.update_tournament_member.affected_rows > 0 ||
                            data.update_flight_member.affected_rows > 0;
                        resolve(true);
                    },
                    (error) => {
                        console.error('Update failed', error);
                        resolve(false);
                    }
                );
        });
    }
    deleteTournaments(deletedtournaments: any[]): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteTournaments,
                    variables: {
                        where: {
                            id: {
                                _in: deletedtournaments,
                            },
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
                    }
                );
        });
    }
    deleteFlight(deletedFlight: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteFlights,
                    variables: {
                        where: {
                            id: {
                                _eq: deletedFlight,
                            },
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
                    }
                );
        });
    }
    deleteLeagues(deleteLeagues: any[]): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteLeagues,
                    variables: {
                        where: {
                            id: {
                                _in: deleteLeagues,
                            },
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
                    }
                );
        });
    }

    deleteTours(deleteTours: any[]): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteTour,
                    variables: {
                        where: {
                            id: {
                                _in: deleteTours,
                            },
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
                    }
                );
        });
    }

    deleteScores(deleteScores: any[]): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.deleteScores,
                    variables: {
                        where: {
                            id: {
                                _in: deleteScores,
                            },
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
                    }
                );
        });
    }

    deleteTourGuide(
        id: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteTourGuide,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
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
                    }
                );
        });
    }

    deleteClub(id: string): Promise<boolean> {
        ////console.log(id);
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.DeleteClub,
                    variables: {
                        where: {
                            id: {
                                _eq: id,
                            },
                        },
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could delete add due to ' + error);
                    }
                );
        });
    }

    public savePlayerHandicaps(
        handicaps: PlayerHanidcap[],
        players: Player[],
        handicapChange: handicap_change_log[]
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.SavePlayerHandicapsMutation,
                    variables: {
                        handicaps: handicaps,
                        players: players,
                        handicapChangeLog: handicapChange,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public UndoTournamentRound(
        tournamentId: string,
        flightRound: number,
        resetRound: number,
        cut: any
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UndoTournamentRoundMutation,
                    variables: {
                        tournamentId: tournamentId,
                        flightRound: flightRound,
                        resetRound: resetRound,
                        cut: cut,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    getTournamentMembers(tournamentId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.TournamentMembersQL,
                    variables: {
                        where: {
                            _and: [
                                {
                                    tournamentId: {
                                        _eq: tournamentId,
                                    },
                                    status: {
                                        _eq: true,
                                    },
                                },
                            ],
                        },
                    },
                })
                .subscribe(({ data }) => {
                    resolve(data);
                });
        });
    }

    public markActiveTournamentMembers(
        tournamentId: string,
        tournamentMembers: TournamentMember[]
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.markActiveTournamentMemberQL,
                    variables: {
                        tournamentId: tournamentId,
                        tournamentMembers: tournamentMembers,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public insertTournamentMember(
        tournamentMembers: TournamentMember[]
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertTournamentMemberQL,
                    variables: {
                        tournamentMembers: tournamentMembers,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }
    public insertTourGuide(tourGuide: any, file: File): Observable<string> {
        if (file) {
            const fileName = 'tour_bg/' + tourGuide[0].id + '.png';
            const ref = this.storage.ref(fileName);
            const task = ref.put(file);
            return from(task).pipe(
                switchMap((snapshot: any) => {
                    return ref.getDownloadURL();
                }),
                switchMap((downloadUrl: string) => {
                    if (file) {
                        tourGuide[0].bg_image = downloadUrl;
                    }
                    return this.apollo
                        .mutate<any>({
                            mutation: Query.insertTourGuideQL,
                            variables: {
                                tourGuide: tourGuide,
                            },
                        })
                        .pipe(
                            map((response: any) => {
                                // Return the download URL
                                return downloadUrl;
                            })
                        );

                })
            );
        } else {
            return this.apollo
                .mutate<any>({
                    mutation: Query.insertTourGuideQL,
                    variables: {
                        tourGuide: tourGuide,
                    },
                })
                .pipe(
                    map((response: any) => {
                        // Return the download URL
                        return response;
                    })
                );
        }
    }
    public insertTournamentTeam(
        teamsToSave: Team[], tournamentId, teamsMembersToRemove: any[] = []
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertTournamentTeamQL,
                    variables: {

                        teamsToSave: teamsToSave,
                        teamsMembersToRemove: teamsMembersToRemove,

                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        //console.log('Could not add due to ' + error);
                        resolve(false);
                    }
                );
        });
    }

    public insertTournamentPairs(
        pairsToSave: any[], tournamentId, pairsMembersToRemove: any[] = []
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertTournamentPairsQL,
                    variables: {
                        pairsToSave: pairsToSave,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        //console.log('Could not add due to ' + error);
                        resolve(false);
                    }
                );
        });
    }
    public insertTournamentMemberStatus(
        tournamentMembers: any[]
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertTournamentMemberStatusQL,
                    variables: {
                        tournamentMembers: tournamentMembers,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public insertClubMember(clubId: string, playerId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.insertClubMemberQL,
                    variables: {
                        objects: [
                            {
                                clubId: clubId,
                                playerId: playerId,
                                suspended: false,
                            },
                        ],
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public setScoreUpdateTime(
        tournamentId: string,
        date: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.setScoreUpdateTimeQL,
                    variables: {
                        tournamentId: tournamentId,
                        date: date,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public setTournamentStep(
        tournamentId: string, currentStep: number, isSetupComplete: boolean
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.setTournamentStepQL,
                    variables: {
                        tournamentId: tournamentId,
                        currentStep: currentStep,
                        isSetupComplete: isSetupComplete,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        ////console.log(data);
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        ////console.log('Could not add due to ' + error);
                    }
                );
        });
    }

    public updateFlightSettings(
        tournamentId: string,
        category: string,
        flightSettings: JSON
    ): Promise<any> {
        //console.log(flightSettings);
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.updateTournamentFlightSettings,
                    variables: {
                        where: {
                            tournamentId: {
                                _eq: tournamentId,
                            },
                            category: {
                                _eq: category,
                            },
                        },
                        set: {
                            flightSettings: flightSettings,
                        },
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could not update add due to ' + error);
                    }
                );
        });
    }

    public leaderAllRoundData(tournamentId: string): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.LeaderAllRoundDataQL,
                    variables: {
                        tournamentId: tournamentId,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }

    public eliminateRound(
        oldFlightId: string,
        newFlightId: string,
        playerId: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe<any>({
                    query: Query.eliminateRoundQL,
                    variables: {
                        oldFlightId: oldFlightId,
                        newFlightId: newFlightId,
                        playerId: playerId,
                    },
                })
                .subscribe(({ data }) => {
                    //console.log(data);
                    resolve(data);
                });
        });
    }

    public editTournament(
        tmnt: any,
        category,
        marshals: any
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.apollo
                .mutate<any>({
                    mutation: Query.UpdateMutation,
                    variables: {
                        objects: [
                            {
                                id: tmnt.id,
                                clubId: tmnt.clubId,
                                leagueId: tmnt.leagueId,
                                courseId: tmnt.courseId,
                                adminId: tmnt.adminId,
                                title: tmnt.title,
                                prefix: tmnt.prefix,
                                courseHoleSets: tmnt.courseHoleSets,
                                teamMatch: tmnt.teamMatch,
                                pairsMatch: tmnt.pairsMatch,
                                interLeague: tmnt.interLeague,
                                approved: tmnt.approved,
                                publicTournament: tmnt.publicTournament,
                                confirmParticipants: tmnt.confirmParticipants,
                                noOfRounds: tmnt.noOfRounds,
                                activeRound: tmnt.activeRound,
                                matchFormat: tmnt.matchFormat,
                                playingOnWhs: tmnt.playingOnWhs,
                                pointsFormats: tmnt.pointsFormats,
                                pointsValues: tmnt.pointsValues,
                                handicapAllocations: tmnt.handicapAllocations,
                                strokeAllocation: tmnt.strokeAllocation,
                                tee: tmnt.tee,
                                scoreManagement: tmnt.scoreManagement,
                                startDate: tmnt.startDate,
                                endDate: tmnt.endDate,
                                tournamentFlight: tmnt.tournamentFlight,
                                started: tmnt.started,
                                invited: tmnt.invited,
                                singleRound: tmnt.singleRound,
                                sponsorName: tmnt.sponsorName,
                                sponsorLogo: tmnt.sponsorLogo,
                                mobileLogoUrl: tmnt.mobileLogoUrl,
                                webLogoUrl: tmnt.webLogoUrl,
                                noOfMarshals: tmnt?.noOfMarshals?.toString() ?? null,
                                marshalsStartWith: tmnt.marshalsStartWith,
                                flightsCategory: tmnt.flightsCategory,
                                subTournament: tmnt.subTournament,
                                multiFormat: tmnt.multiFormat,
                                createdAt: tmnt.createdAt,
                                tourId: tmnt.tourId,
                                tournament_round_courses: {
                                    data: tmnt.tournament_round_courses ? tmnt.tournament_round_courses : [],
                                },
                            },
                        ],
                        category: category,
                        marshals: marshals,
                        tournamentId: tmnt.id,
                    },
                })
                .subscribe(
                    ({ data }) => {
                        resolve(true);
                    },
                    (error) => {
                        resolve(false);
                        //console.log('Could Not Update due to' + error);
                    }
                );
        });
    }

    public getPlayersListByTournamentAndCategory(
        id: string,
        category: string
    ): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.GetPlayersByClub,
                    variables: {
                        where: {
                            _and: [
                                {
                                    player: {
                                        playerCategory: {
                                            _eq: category,
                                        },
                                    },
                                },
                                {
                                    tournamentId: {
                                        _eq: id,
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

    public getTournamentLeaderBoard(tournamentId: String): Promise<any> {
        return new Promise((resolve) => {
            this.apollo
                .subscribe({
                    query: Query.LeaderboardSubscription,
                    variables: {
                        tournamentPrefix: tournamentId,
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

    public searchTournamentsByTitle(title: string): Observable<any[]> {
        return this.apollo
            .subscribe({
                query: Query.SearchTournamentsByTitle,
                variables: { title: `%${title}%` },
            })
            .pipe(map((res: any) => res.data?.tournament || []));
    }

    public searchLeaguesByName(name: string): Observable<any[]> {
        return this.apollo
            .subscribe({
                query: Query.SearchLeaguesByName,
                variables: { name: `%${name}%` },
            })
            .pipe(map((res: any) => res.data?.league || []));
    }

    public searchToursByName(name: string): Observable<any[]> {
        return this.apollo
            .subscribe({
                query: Query.SearchToursByName,
                variables: { name: `%${name}%` },
            })
            .pipe(map((res: any) => res.data?.tour || []));
    }
}
