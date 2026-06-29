import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Apollo } from 'apollo-angular';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import gql from 'graphql-tag';

@Component({
    standalone: false,
    selector: 'app-player-subscription-history-dialog',
    templateUrl: './player-subscription-history-dialog.component.html',
    styleUrls: ['./player-subscription-history-dialog.component.scss'],
})
export class PlayerSubscriptionHistoryDialogComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    displayedColumns: string[] = ['firstName', 'membershipNumber', 'type', 'startDate', 'dueDate', 'createdAt'];
    dataSource: MatTableDataSource<any>;
    isLoading = true;

    constructor(
        public dialogRef: MatDialogRef<PlayerSubscriptionHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { player: any },
        private apollo: Apollo
    ) { }

    ngOnInit(): void {
        this.fetchSubscriptionHistory();
    }

    fetchSubscriptionHistory(): void {
        const GET_PLAYER_SUBSCRIPTIONS = gql`
        query GetPlayerSubscriptions($playerId: String!) {
            club_member_subscription(where: { playerId: { _eq: $playerId } }, order_by: { createdAt: desc }) {
            id
            clubId
            dueDate
            createdAt
            type
            startDate
            }
        }
    `;

        this.apollo
            .watchQuery<any>({
                query: GET_PLAYER_SUBSCRIPTIONS,
                variables: {
                    playerId: this.data.player.id,
                },
            })
            .valueChanges.subscribe(
                ({ data, loading }) => {
                    this.isLoading = loading;
                    if (!loading && data) {
                        console.log(data);
                        //loop the data and add player detials in it
                        let dat = data.club_member_subscription.map((subscription: any) => ({
                            ...subscription,
                            Name: this.data.player.Name,
                            MembershipNo: this.data.player.MembershipNo
                        }));
                        this.dataSource = new MatTableDataSource(dat);
                        this.dataSource.paginator = this.paginator;
                        this.dataSource.sort = this.sort;
                    }
                },
                (error) => {
                    console.error('Error fetching subscription history:', error);
                    this.isLoading = false;
                }
            );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
