import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Apollo } from 'apollo-angular';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import gql from 'graphql-tag';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-player-subscription-history-dialog',
    templateUrl: './player-subscription-history-dialog.component.html',
    styleUrls: ['./player-subscription-history-dialog.component.scss'],
})
export class PlayerSubscriptionHistoryDialogComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    displayedColumns: string[] = ['firstName', 'membershipNumber', 'amountWithGst', 'amountWithoutGst', 'locker', 'capitation', 'startDate', 'dueDate', 'createdAt'];
    dataSource: MatTableDataSource<any>;
    isLoading = true;

    constructor(
        public dialogRef: MatDialogRef<PlayerSubscriptionHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { player: any },
        private apollo: Apollo,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin Open Player Subscription History Dialog', "info", this.data?.player?.id);
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
            capitation
            amountWithGst
            amountWithoutGst
            locker
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
                        this.logger.log('Getting Player Subscription History Successfully', "info", data.club_member_subscription?.length);
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
                    this.logger.log('Getting Player Subscription History Failed', "error", error?.toString());
                    console.error('Error fetching subscription history:', error);
                    this.isLoading = false;
                }
            );
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Close in Player Subscription History Dialog', "info");
        this.dialogRef.close();
    }
}
