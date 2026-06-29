import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';

// GraphQL Queries
const GET_GUEST_ENTRIES = gql`
  query GetGuestEntries($clubId: String!, $date: date!) {
    guest(
      where: {
        adminClubId: { _eq: $clubId }
        date: { _eq: $date }
      }
      order_by: [{ date: desc }]
    ) {
      id
      firstName
      lastName
      transactionId
      handicap
      playerClubId
      date
      amount
      adminClubId
    }
  }
`;

const GET_GUEST_ENTRY_BY_ID = gql`
  query GetGuestEntryById($id: uuid!) {
    guest_by_pk(id: $id) {
      id
      firstName
      lastName
      email
      handicap
      playerClubId
      date
      amount
      adminClubId
    }
  }
`;

const INSERT_GUEST_ENTRY = gql`
  mutation InsertGuestEntry(
    $id: String!
    $email: String!
    $firstName: String!
    $lastName: String!
    $handicap: numeric
    $playerClubId: String!
    $adminClubId: String!
    $date: date!
    $amount: numeric
  ) {
    insert_guest_one(
      object: {
        id: $id
        firstName: $firstName
        email: $email
        lastName: $lastName
        handicap: $handicap
        playerClubId: $playerClubId
        adminClubId: $adminClubId
        date: $date
        amount: $amount
      }
    ) {
      id
      firstName
      email
      lastName
      handicap
      playerClubId
      adminClubId
      date
      amount
    }
  }
`;

const UPDATE_GUEST_ENTRY = gql`
  mutation UpdateGuestEntry(
    $id: String!
    $firstName: String!
    $lastName: String!
    $handicap: numeric
    $playerClubId: String!
    $adminClubId: String!
    $date: date!
    $amount: numeric
  ) {
    update_guest_by_pk(
      pk_columns: { id: $id }
      _set: {
        firstName: $firstName
        lastName: $lastName
        handicap: $handicap
        playerClubId: $playerClubId
        adminClubId: $adminClubId
        date: $date
        amount: $amount
      }
    ) {
      id
      firstName
      lastName
      handicap
      playerClubId
      adminClubId
      date
      amount
    }
  }
`;

const DELETE_GUEST_ENTRY = gql`
  mutation DeleteGuestEntry($id: uuid!) {
    delete_guest_by_pk(id: $id) {
      id
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class PlayerRegistrationService {
  private _guestEntries: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _selectedEntry: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private apollo: Apollo) {}

  get guestEntries$(): Observable<any[]> {
    return this._guestEntries.asObservable();
  }

  get selectedEntry$(): Observable<any> {
    return this._selectedEntry.asObservable();
  }

  /**
   * Get guest entries by club and date
   */
  getGuestEntries(
    clubId: string,
    date: string
  ): Observable<any[]> {
    return this.apollo
      .watchQuery<any>({
        query: GET_GUEST_ENTRIES,
        variables: {
          clubId,
          date,
        },
      })
      .valueChanges.pipe(
        map((result) => result.data?.guest || []),
        tap((data) => {
          this._guestEntries.next(data);
        })
      );
  }

  /**
   * Get guest entry by ID
   */
  getGuestEntryById(id: string): Observable<any> {
    return this.apollo
      .watchQuery<any>({
        query: GET_GUEST_ENTRY_BY_ID,
        variables: {
          id,
        },
      })
      .valueChanges.pipe(
        map((result) => result.data?.guest_by_pk),
        tap((data) => {
          this._selectedEntry.next(data);
        })
      );
  }

  /**
   * Create new guest entry
   */
  createGuestEntry(entry: any): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: INSERT_GUEST_ENTRY,
        variables: {
          id: entry.id,
          email: entry.email,
          firstName: entry.firstName,
          lastName: entry.lastName,
          handicap: entry.handicap,
          playerClubId: entry.playerClubId,
          adminClubId: entry.adminClubId,
          date: entry.date,
          amount: entry.amount,
        },
        refetchQueries: [
          {
            query: GET_GUEST_ENTRIES,
            variables: {
              clubId: entry.adminClubId,
              date: entry.date,
            },
          },
        ],
      })
      .pipe(map((result) => result.data?.insert_guest_one));
  }

  /**
   * Update guest entry
   */
  updateGuestEntry(id: string, entry: any): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: UPDATE_GUEST_ENTRY,
        variables: {
          id,
          firstName: entry.firstName,
          lastName: entry.lastName,
          handicap: entry.handicap,
          playerClubId: entry.playerClubId,
          adminClubId: entry.adminClubId,
          date: entry.date,
          amount: entry.amount,
        },
        refetchQueries: [
          {
            query: GET_GUEST_ENTRIES,
            variables: {
              clubId: entry.adminClubId,
              date: entry.date,
            },
          },
        ],
      })
      .pipe(map((result) => result.data?.update_guest_by_pk));
  }

  /**
   * Delete guest entry
   */
  deleteGuestEntry(id: string, clubId: string, date: string): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: DELETE_GUEST_ENTRY,
        variables: {
          id,
        },
        refetchQueries: [
          {
            query: GET_GUEST_ENTRIES,
            variables: {
              clubId,
              date,
            },
          },
        ],
      })
      .pipe(map((result) => result.data?.delete_guest_by_pk));
  }

  /**
   * Set selected entry
   */
  setSelectedEntry(entry: any): void {
    this._selectedEntry.next(entry);
  }

  /**
   * Clear selected entry
   */
  clearSelectedEntry(): void {
    this._selectedEntry.next(null);
  }
}
