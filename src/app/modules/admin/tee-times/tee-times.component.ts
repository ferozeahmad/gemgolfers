import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Player } from '../../../shared/models/player.model';
import { TeeTime, TeeTimeSlot } from '../../../shared/models/teetime.model';
import { FacadeService } from '../../../shared/services/facade.service';
// import { DialogOverviewComponent } from '../material-components/dialog-overview/dialog-overview.component';
// import { DialogTeeTimeSlotComponent } from '../material-components/dialog-tee-time-slot/dialog-tee-time-slot.component';
import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../shared/classes/general';
import { of } from 'rxjs';
import { DialogTeeTimeSlotComponent } from '../dialogs/dialog-tee-time-slot/dialog-tee-time-slot.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { DialogAddPlayerComponent } from '../dialogs/dialog-add-player/dialog-add-player.component';
import { DialogPlayerListComponent } from '../dialogs/dialog-player-list-flight/dialog-player-list.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    standalone: false,
    selector: 'app-tee-times',
    templateUrl: './tee-times.component.html',
    styleUrls: ['./tee-times.component.scss'],
})
export class TeeTimesComponent implements OnInit {
    dataSource: MatTableDataSource<TeeTime>;
    displayedColumns = [
        'id',
        'bookingDate',
        'bookingTime',
        'club',
        'course',
        'startTime',
        'endTime',
        'interval',
        'allowNineHole',
        'slots',
    ];

    clubItems: Promise<TeeTime[]>;
    noItemsInList = false;
    teeTimes: TeeTime[] = [];
    myPlayer: TeeTime;
    isLoading: Boolean = true;
    loggedInuser: Player;
    pageIndex: number = 0;
    pageSize: number = 20;
    totalSize: number = 0;

    file: File;
    arrayBuffer: any;
    playersData: any;
    savePlayers: TeeTime[] = [];
    duplicatePlayers: any[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    @ViewChild('fileInput') fileInputVariable: ElementRef;

    constructor(
        private location: Router,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private facadeService: FacadeService,
        private _localStorage: LocalStorageService,
        private _fuseConfirmationService: FuseConfirmationService,
    ) { }

    ngAfterViewInit(): void {
        // this.dataSource.sort = this.sort;
        // this.paginator.page.subscribe(() => {
        //     console.log('Pagination ');

        //     this.pageIndex = this.paginator.pageIndex;
        //     this.pageSize = this.paginator.pageSize;
        //     this.ngOnInit();
        // });
    }

    async ngOnInit() {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.teeTimes = [];
        let dataPlayers =
            await this.facadeService.getClubTeeTimeBooking(
                this._localStorage.isClubAdmin() ? this.loggedInuser.adminClubId : null,
                this.pageIndex * this.pageSize,
                this.pageSize
            );
        this.teeTimes = dataPlayers.paginatedData.data.tee_time_booking;
        this.totalSize = dataPlayers.aggregateData.data.tee_time_booking_aggregate.aggregate.count;
        this.isLoading = false;

        console.log(this.teeTimes);

        this.dataSource = new MatTableDataSource(this.teeTimes);
        // this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;


        //this.facadeService.findOne("-LeGr4seWAKipHNVKh_2").subscribe(result => this.myPlayer = result);
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;

        this.ngOnInit();

    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    redirectToDetails = (id: string) => {
        this.location.navigate(['/players/view/' + id]);
    };

    redirectToUpdate = (id: string) => {
        this.location.navigate(['/players/update/' + id]);
    };

    listTeeTimeSlots(row: any): void {
        const dialogRef = this.dialog.open(DialogTeeTimeSlotComponent, {
            width: '600px',
            data: {
                date: row.bookingDate,
                noOfPlayers: row.noOfPlayers,
                slots: row.slots
            },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                this.snackBar.open('Member has been deleted.', 'x', {
                    duration: 5000,
                });

                this.teeTimes = [];
                this.isLoading = true;
                this.dataSource = new MatTableDataSource(this.teeTimes);
                this.ngOnInit();
            } else {
                ////console.log("cancel delete action");
            }
        });
    }
    convertToAMPMFormat(timeString: string): string {
        // Split the time string to extract the hour and minute parts
        if (timeString) {
            const timeParts = timeString.split(':')[0]; // Extracts "09"
            // Convert the hour part to a number
            const hour = parseInt(timeParts, 10);
            // Determine whether it's AM or PM
            const period = hour >= 12 ? 'PM' : 'AM';
            // Convert the hour from 24-hour to 12-hour format
            const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
            // Construct the formatted time string
            return displayHour + ' ' + period;
        } else {
            return '-';
        }
    }


    async openAddPlayersDialog(item: any) {
        let datas = await this.facadeService.getPlayersListForTournament(
            this.loggedInuser.adminClubId
        );
        const dialogRef = this.dialog.open(DialogPlayerListComponent, {
            data: { players: datas.player },
        });

        // Handle dialog close or dismiss if needed
        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }

    redirectToView = (date: string) => {
        this.location.navigate(['/teetimes/view-teetimes/' + date]);
    };

    redirectToEdit = (id: string) => {
        this.location.navigate(['/teetimes/edit/' + id]);
    };

    deleteTeeTime(teeTime) {

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Tee Time',
            message:
                'Are you sure you want to delete this tee time? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });
        confirmation.afterClosed().subscribe(async (result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                this.facadeService.deleteTeeTime(teeTime.id).then(
                    async (result) => {
                        if (result) {
                            //remove all flights for this tee time
                            let flightIds = teeTime.slots.filter((slot: TeeTimeSlot) => slot.flightId != null).map((slot: TeeTimeSlot) => slot.flightId);
                            for (let id of flightIds) {
                                await this.facadeService.deleteFlight(id);
                            }
                            this.snackBar.open('Tee Time has been deleted.', 'x', {
                                duration: 5000,
                            });
                            this.teeTimes = [];
                            this.ngOnInit();
                        } else {
                            this.snackBar.open('Tee Time could not be deleted.', 'x', {
                                duration: 5000,
                            });
                        }
                    }
                );
            }
        });
    }

}
