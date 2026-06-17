import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Player, PlayerCategory } from '../models/player.model';
import { Score } from '../models/score.model';
import * as Query from '../GraphQL/matchplay.gql';

@Injectable({
  providedIn: 'root'
})
export class MatchplayService {

  constructor(private apollo: Apollo) { }

  public MatchPlayDataQuery(playerId: string, flightId:string): Promise<any> {
    return new Promise( resolve => {
        this.apollo.subscribe({
        query: Query.MatchPlayDataQuery,
        variables: {
          'playerId': playerId,
          'flightId': flightId
      }
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

  public MatchPlayDataQueryShort(playerId: string, flightId:string): Promise<any> {
    return new Promise( resolve => {
        this.apollo.subscribe({
        query: Query.MatchPlayDataQueryShort,
        variables: {
          'flightId': flightId
      }
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

  public getPlayerTournamentScore(tournamentId: string, playerId:string): Promise<any> {
    return new Promise( resolve => {
        this.apollo.subscribe({
        query: Query.PlayerTournamentScoreQL,
        variables: {
          'tournamentId': tournamentId,
          'playerId': playerId
      }
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

  public SaveScoresMutation(scores:Score[]): Promise<any> {
    return new Promise( resolve => {
        this.apollo.mutate<any>({
        mutation: Query.AddMutation,
        variables: {
          'scores': scores
        }
        }).subscribe(({ data }) => {
          ////console.log(data);
          resolve(true);
        }, (error) => {
          resolve(false);
          //console.log('Could not add due to ' + error);
        });
      
      });
    }
}
