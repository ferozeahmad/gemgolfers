import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightScores } from '../../../../shared/classes/FlightScores';
import {
    Constants,
    General,
    handicapAllocation,
} from '../../../../shared/classes/general';
import {
    Player,
    PlayerWHSHanidcap,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import { Score } from '../../../../shared/classes/score';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Flight } from '../../../../shared/models/flight.model';
import { formatDate, Location } from '@angular/common';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { HandicapsComponent } from '../CONGU/handicaps.component';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-player-handicap',
    templateUrl: './player-handicaps.component.html',
})
export class PlayerHandicapComponent implements OnInit {
    cardsrc = 'assets/images/cards/01-320x200.png';
    dataSource: MatTableDataSource<any>;
    displayedColumns: string[] = [
        'id',
        'updatedAt',
        'grossScore',
        'adjustedScore',
        'score',
        'oldHandicap',
        'handicapDifference',
        'handicap',
    ];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    clubTitle: any;
    showTable: Promise<any>;
    private playerID: string;
    loggedInuser: UserSessionModel;
    currentPlayer: Player;
    playerFlightScores: FlightScores[] = [];
    isLoading: boolean = true;
    redTeeHI: number;
    blueTeeHI: number;
    whiteTeeHI: number;
    blackTeeHI: number;
    pageSize: number = 20;
    playerHandiData: any;
    handicapHistory: any[] = [];
    handicapHistoryDate: any[] = [];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentPlayerHandicap: any;
    length: any;
    personLeads: any;
    memerbershipNumber: any;
    fullName: string;
    constructor(
        private location: Location,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _handicapComponent: HandicapsComponent,
        private _facadeService: FacadeService,
        private _router: Router,
        private _localStorage: LocalStorageService, private logger: LogsService,
    ) { }

    async ngOnInit() {
        try {


            this._handicapComponent.matDrawer.open();
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            this._activatedRoute.paramMap.subscribe(async (params) => {
                this.showTable = Promise.resolve(false);
                this.playerID = params.get('id');
                this.logger.log('Player Congu Handicap Sidebar Open', "info", this.playerID);
                this.fetchData();
            });
        } catch (error) {
            this.logger.log('Getting Player Wise Congu Handicap Data Failed', "error", error.toString());

        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    async fetchData() {
        if (this.loggedInuser) {
            //console.log(clubInfo);

            this.clubTitle = this.loggedInuser.club.name ?? '';
        }
        if (this.playerID) {
            let courseRating: any = {
                courseId: this.loggedInuser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf',
                courseHoleSets: 3,
            };
            let playerscore: any =
                await this._facadeService.getPlayerFlightScores(this.playerID);
            //console.log(playerscore);
            this.currentPlayer = playerscore.PlayerQL;
            //console.log(this.currentPlayer);
            this.currentPlayerHandicap = this.currentPlayer[0];

            this.playerHandiData = playerscore['HandicapQL'];
            //console.log(this.playerHandiData);
            const slicedCongu = this.playerHandiData;
            //console.log(slicedCongu);

            this.dataSource = new MatTableDataSource(slicedCongu);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            let newScores: any[] = [];
            this.logger.log('Getting Player Wise Congu Handicap Data Successful', "info", this.playerID);
            this.showTable = Promise.resolve(true);
        } else {
            this.location.back();
        }
    }
    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._handicapComponent.matDrawer.close();
    }

    isPanelty(flight) {
        ////console.log(this.usedForHandicap);
        if (flight && flight[0] != undefined) {
            let used: boolean = flight[0].members.some((element) => {
                return (
                    element.playerId == this.playerID && element.panelty == true
                );
            });
            return used;
        } else {
            return false;
        }
    }

    cancel() {
        this.logger.log('BackDrop click on Player Congu Handicap', "info");

        this._router.navigate(['../'], { relativeTo: this._activatedRoute });
    }
    public downloadAsPDFCongu() {
        try {
            this.logger.log('Download Player Congu Handicap Button Click', "info");
            var doc = new jsPDF();
            var col = [
                'Sr.',
                'Mem.No',
                'Date',
                'G.Score',
                'Adj.Gross',
                'Net',
                'Crnt H/C',
                "H'Cap Adj",
                'Exact H/C',
            ];
            var rows = [];
            doc.setFontSize(17);
            doc.text(
                'CONGU-Handicap Change-Log of ' +
                this.currentPlayer[0].firstName.toString().toUpperCase() +
                ' ' +
                this.currentPlayer[0].lastName.toString().toUpperCase(),
                14,
                15
            );
            doc.setFontSize(18);
            doc.setTextColor(100);

            let count = 0;
            this.playerHandiData = this.playerHandiData.slice(0, this.pageSize);
            this.playerHandiData.forEach((element) => {
                let panelty: boolean = false;
                count++;
                // if (
                //     element.tournamentQL.flights &&
                //     element.tournamentQL.flights[0] != undefined
                // ) {
                //     panelty = element.tournamentQL.flights[0].members.some(
                //         (element) => {
                //             return (
                //                 element.playerId == this.playerID &&
                //                 element.panelty == true
                //             );
                //         }
                //     );
                // }
                var temp = [
                    count,
                    this.currentPlayer[0].membershipNumber,
                    formatDate(
                        element.tournamentQL.startDate,
                        'mediumDate',
                        'en-US'
                    ),
                    element.grossScore ? element.grossScore : '-',
                    element.adjustedScore ? element.adjustedScore : '-',
                    element.score,
                    element.oldHandicap,
                    Math.round((element.handicap - element.oldHandicap) * 10) / 10,
                    element.handicap,
                    element.panelty,
                ];
                rows.push(temp);
            });
            //From HTML
            (doc as any).autoTable(col, rows, {
                startY: 25,
                theme: 'grid',
                didParseCell: function (data) {
                    if (data.row.raw[9] == true) {
                        data.cell.styles.textColor = [255, 9, 9];
                    }
                },
            });

            // Open PDF document in new tab
            doc.output('dataurlnewwindow');
            this.logger.log('Player Congu Handicap PDF generated successfully', "info", this.playerID);

            // Download PDF document
            //doc.save('flights.pdf');
        } catch (error) {
            this.logger.log('Download Player Handicap Congu Failed', "error", error.toString());
       
        }
    }
    pageEvents(event) {
        this.logger.log('Admin changed page in Player Congu Handicap', "info", { pageIndex: event?.pageIndex, pageSize: event?.pageSize });
        //console.log(event);
        this.pageSize = event.pageSize;
    }
}
