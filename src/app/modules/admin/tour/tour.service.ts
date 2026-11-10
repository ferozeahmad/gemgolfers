import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, take, tap } from 'rxjs';
import { Apollo } from 'apollo-angular';
import * as Query from '../../../shared/GraphQL/tournament.gql';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Injectable({
    providedIn: 'root',
})
export class TourService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    loggedInuser: any;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private apollo: Apollo,

        private logger: LogsService
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    setData(newData: any) {
        this._data.next(newData);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getTours(id?: String): Observable<any> {
        if (id) {
            return this.apollo
                .subscribe<any>({
                    query: Query.getTours,
                    variables: {
                        adminId: id,
                    },
                })
                .pipe(
                    tap((response: any) => {
                        this.logger.log(
                            'Getting Tour Dashboard Data Successfull',
                            'info'
                        );
                        this._data.next(response['data']['tour']);
                    })
                );

        } else {
            return this.apollo
                .subscribe<any>({
                    query: Query.getAllTours,
                })
                .pipe(
                    tap((response: any) => {
                        this.logger.log(
                            'Getting Tour Dashboard Data Successfull',
                            'info'
                        );
                        this._data.next(response['data']['tour']);
                    })
                );

        }
    }

    /**
     * Loads a single tour (with its tournaments and members). Rejects on network errors so
     * the UI can show an error state instead of staying blank forever.
     */
    public getTourById(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.apollo
                .subscribe<any>({
                    query: Query.GetTourByIdQL,
                    variables: { id },
                })
                .pipe(take(1))
                .subscribe({
                    next: ({ data }) => resolve(data),
                    error: (error) => reject(error),
                });
        });
    }

    /** Loads every tour owned by the given tour operator, with the data the dashboard needs. */
    public getTourOperatorDashboard(adminId: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.apollo
                .subscribe<any>({
                    query: Query.getTourOperatorDashboard,
                    variables: { adminId },
                })
                .pipe(take(1))
                .subscribe({
                    next: ({ data }) => {
                        this.logger.log('Getting Tour Operator Dashboard Data Successful', 'info');
                        resolve(data?.tour ?? []);
                    },
                    error: (error) => {
                        this.logger.log('Getting Tour Operator Dashboard Data Failed', 'error', error?.toString());
                        reject(error);
                    },
                });
        });
    }
}
