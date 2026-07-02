import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { Club, ClubSchedule } from '../models/club.model';
import { TeeTime } from '../models/teetime.model';
import * as Query from '../GraphQL/clubs.gql';
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {

  constructor(private apollo: Apollo) { }

  public getClubsList(): Promise<any> {
    return new Promise(resolve => {
      this.apollo.subscribe({
        query: Query.GetClubs
      })
        .subscribe(({ data }) => {
          if (!data) {
            resolve(null);
          } else {
            ////console.log(data.club);
            resolve(data);
          }
        });
    });
  }

  findAll(): Observable<any> {
    return this.apollo
      .query<any>({ query: Query.GetClubs })
      .pipe(map(res => res.data));
  }

  findOne(id: string): Observable<any> {
    return this.apollo
      .query<any>({
        query: Query.GetClubByID, variables: {
          'where': {
            'id': {
              '_eq': id
            }
          }
        }
      }).pipe(map(res => res.data));
  }

  getClubByID(id: string): Promise<any> {
    return new Promise(resolve => {
      this.apollo.watchQuery<any>({
        query: Query.GetClubByID,
        variables: {
          'where': {
            'id': {
              '_eq': id
            }
          }
        }
      }).valueChanges
        .subscribe(({ data }) => {
          resolve(data.club);
        });
    });
  }

  public getClubTeeTimeBooking(clubId: string, offset: number, limit: number): Promise<any> {
    return new Promise(async resolve => {
      const paginatedData = await this.apollo.subscribe<any>({
        query: Query.GetTeeTimeBookingQL,
        variables: {
          'where': {
            'clubId': {
              '_eq': clubId
            }
          },
          offset,
          limit
        }
      }).toPromise();

      const aggregateData = await this.apollo.subscribe<any>({
        query: Query.GetTeeTimeBookingAggregateQL,
        variables: {
          'where': {
            'clubId': {
              '_eq': clubId
            }
          }
        }
      }).toPromise();

      resolve({ paginatedData: paginatedData, aggregateData: aggregateData });
    });
  }

  public deleteTeeTime(id: string): Promise<boolean> {
    return new Promise(resolve => {
      this.apollo.mutate<any>({
        mutation: Query.DeleteTeeTimeQL,
        variables: {
          'where': {
            'id': {
              '_eq': id
            }
          }
        }
      }).subscribe(({ data }) => {
        resolve(true);
      }, (error) => {
        resolve(false);
        //console.log('Could not delete due to ' + error);
      });
    });
  }

  public getClubTeeTimeBookingForSuperAdmin(offset, limit): Promise<any> {
    // return new Promise(resolve => {
    //   this.apollo.subscribe<any>({
    //     query: Query.GetTeeTimeBookingSuperAdminQL,

    //   }).subscribe(({ data }) => {
    //     resolve(data);
    //   });
    // });
    return new Promise(async resolve => {
      const paginatedData = await this.apollo.subscribe<any>({
        query: Query.GetTeeTimeBookingSuperAdminQL,
        variables: {
          offset,
          limit
        }
      }).toPromise();

      const aggregateData = await this.apollo.subscribe<any>({
        query: Query.GetTeeTimeBookingAggregateSuperAdminQL,
      }).toPromise();

      resolve({ paginatedData: paginatedData, aggregateData: aggregateData });
    });
  }

  public isTeeTimeDateExist(clubId: string, selectedDate: Date): Promise<TeeTime[]> {
    return new Promise(resolve => {
      this.apollo.subscribe<any>({
        query: Query.GetTeeTimeBookingQL,
        variables: {
          'where': {
            "_and": [
              {
                'clubId': {
                  '_eq': clubId
                }
              },
              {
                'teeDate': {
                  '_eq': selectedDate
                }
              }]
          }
        }
      }).subscribe(({ data }) => {
        resolve(data);
      });
    });
  }

  public getTeeTimeById(id: string): Promise<any> {
    return new Promise(resolve => {
      this.apollo.subscribe<any>({
        query: Query.GetTeeTimeByIdQL,
        variables: { id }
      }).subscribe(({ data }) => resolve(data));
    });
  }

  public async updateTeeTimeSchedule(teeTime: TeeTime, newSlots: any[]): Promise<boolean> {
    try {
      // 1. Update parent record
      await this.apollo.mutate<any>({
        mutation: Query.UpdateTeeTimeParentQL,
        variables: {
          id: teeTime.id,
          set: {
            bookingDate: teeTime.bookingDate,
            teeDate: teeTime.teeDate,
            bookingTime: teeTime.bookingTime,
            interval: teeTime.interval,
            noOfPlayers: teeTime.noOfPlayers,
            allowNineHole: teeTime.allowNineHole,
          }
        }
      }).toPromise();

      // 2. Delete all empty slots (no flight booked)
      await this.apollo.mutate<any>({
        mutation: Query.DeleteEmptyTeeSlotsQL,
        variables: { bookingId: teeTime.id }
      }).toPromise();

      // 3. Insert new slots in chunks of 100
      const slots = newSlots.map(slot => ({ ...slot, bookingId: teeTime.id }));
      const chunkSize = 100;
      for (let i = 0; i < slots.length; i += chunkSize) {
        await this.apollo.mutate<any>({
          mutation: Query.AddTeeTimeSlotsQL,
          variables: { objects: slots.slice(i, i + chunkSize) }
        }).toPromise();
      }
      return true;
    } catch (error) {
      console.error('updateTeeTimeSchedule failed:', error);
      return false;
    }
  }

  public async AddTeeTimeSchedule(teeTime: TeeTime): Promise<boolean> {
    try {
      // 1️⃣ Insert parent (without slots)
      const parentResult = await this.apollo.mutate<any>({
        mutation: Query.AddTeeTimeParentQL,
        variables: {
          object: {
            id: teeTime.id,
            clubId: teeTime.clubId,
            courseId: teeTime.courseId,
            bookingDate: teeTime.bookingDate,
            teeDate: teeTime.teeDate,
            startTime: teeTime.startTime,
            endTime: teeTime.endTime,
            interval: teeTime.interval,
            noOfPlayers: teeTime.noOfPlayers,
            allowNineHole: teeTime.allowNineHole,
            bookingTime: teeTime.bookingTime,
          }
        }
      }).toPromise();

      const parentId = parentResult.data?.insert_tee_time_booking_one?.id;
      if (!parentId) throw new Error("Failed to create tee_time_booking parent");

      // 2️⃣ Insert slots in patches of 100
      const slots = teeTime.teeTimeSlot.map(slot => ({
        ...slot,
        bookingId: parentId,
      }));

      const chunkSize = 100;
      for (let i = 0; i < slots.length; i += chunkSize) {
        const chunk = slots.slice(i, i + chunkSize);
        await this.apollo.mutate<any>({
          mutation: Query.AddTeeTimeSlotsQL,
          variables: {
            objects: chunk
          }
        }).toPromise();
      }

      return true;
    } catch (error) {
      console.error("AddTeeTimeSchedule failed:", error);
      return false;
    }
  }



  updateClub(club: Club): Promise<boolean> {
    //console.log(club.id);
    return new Promise(resolve => {
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
  }

  deleteClub(id: string): Promise<boolean> {
    //console.log(id);
    return new Promise(resolve => {
      this.apollo.mutate<any>({
        mutation: Query.DeleteClub,
        variables: {
          'where': {
            'id': {
              '_eq': id
            }
          }
        }
      }).subscribe(({ data }) => {
        //console.log(data);
        resolve(true);
      }, (error) => {
        resolve(false);
        //console.log('Could delete add due to ' + error);
      });
    });
  }

  public getScheduleList(clubId: string): Promise<any> {
    return new Promise(resolve => {
      this.apollo.subscribe({
        query: Query.GetSchedule,
        variables: {
          'where': {
            'clubId': {
              '_eq': clubId
            }
          }
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

  /*
  public getClubsList(): any {
    const clubsObservable = new Observable(observer => {
           
               observer.next(this.apollo.watchQuery<any>({
                query: Query.GetClubs
                })
                .valueChanges
                .subscribe(({ data }) => {
                    return data;
                }));
           
    });

    return clubsObservable;
} */

}
