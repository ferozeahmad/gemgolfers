import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Apollo } from 'apollo-angular';
import * as Query from '../../../../shared/GraphQL/player.gql';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    loggedInuser: any;

    /**
     * Constructor
     */
    constructor(
        private apollo: Apollo,
        private _localStorage: LocalStorageService,
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(
        id?: string,
    ): Observable<any> {
        try {
            if (!id) {
                return this.apollo
                    .subscribe<any>({
                        query: Query.GetPlayers,
                    })
                    .pipe(
                        tap((response: any) => {
                            this.logger.log(
                                'Getting Dashboard Data Successfull',
                                'info'
                            );
                            this._data.next(response);
                        })
                    );
            } else {
                // return this.apollo
                //     .subscribe<any>({
                //         query: Query.getAllAdmin,
                //     })
                //     .pipe(
                //         tap((response: any) => {
                //             this.logger.log(
                //                 'Getting Dashboard Data Successfull',
                //                 'info'
                //             );
                //             this._data.next(response);
                //         })
                //     );
            }
        } catch (error) {
            // Handle the error here or re-throw it if necessary
            console.error('An error occurred:', error);
            this.logger.log(
                'Getting Dashboard Data Failed',
                'error',
                error.toString()
            );
            throw error;
        }
    }
}
