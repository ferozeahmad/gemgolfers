import {
    AfterViewInit,
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
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
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
import { HandicapsComponent } from '../WHS/handicaps.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { DialogTeeComponent } from '../../dialogs/dialog-tee-change/dialog-tee.component';
@Component({
    standalone: false,
    selector: 'app-player-handicap',
    templateUrl: './player-handicaps.component.html',
})
export class PlayerHandicapComponent implements OnInit, AfterViewInit {
    cardsrc = 'assets/images/cards/01-320x200.png';
    WHSSource: MatTableDataSource<any>;
    WHSColumns = [
        'id',
        'playedAt',
        /* "round", */
        'score',
        'adjustedScore',
        'handicapDifferential',
        'handicapIndex',
        'tee',
        'handicapChange'
    ];
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
        this.paginator = paginator;
        if (this.WHSSource) {
            this.WHSSource.paginator = paginator;
        }
    }

    @ViewChild(MatSort) set matSort(sort: MatSort) {
        this.sort = sort;
        if (this.WHSSource) {
            this.WHSSource.sort = sort;
        }
    }

    clubTitle: any;
    handicapsToUse: number;
    private _tagsPanelOverlayRef: OverlayRef;
    private playerID: string;
    loggedInuser: UserSessionModel;
    currentPlayer: Player;
    playerFlightScores: FlightScores[] = [];
    isLoading: boolean = true;
    redTeeHI: number;
    balckVetTeeHI: number;
    blueTeeHI: number;
    whiteTeeHI: number;
    blackTeeHI: number;
    playerHandiData: any;
    handicapHistory: any[] = [];
    handicapHistoryDate: any[] = [];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentPlayerHandicap: any;
    length: any;
    personLeads: any;
    memerbershipNumber: any;
    showTable: Promise<any>;
    fullName: string;
    playerWHSRound: any;
    playerWHS: PlayerWHSHanidcap;
    playerWHSHistory: any;
    palyerWHSHandDif: number;
    topDiff: any;
    bottomDiff: any;
    topDiff20: any;
    bottomDiff20: any;
    playerHandicapWhsList: any[] = [];
    usedForHandicap = [];
    handicapsAvailable: number;
    memberQLs = [];
    constructor(
        private location: Location,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _handicapComponent: HandicapsComponent,
        private _facadeService: FacadeService,
        private _router: Router, private _localStorage: LocalStorageService, private logger: LogsService,
    ) { }

    async ngOnInit() {
        try {

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            this._activatedRoute.paramMap.subscribe((params) => {
                this.showTable = Promise.resolve(false);
                this.playerID = params.get('id');
                this.logger.log('Player WHS Handicap Sidebar Open', "info", this.playerID);
                this.fecthData();
            });
        } catch (error) {
            this.logger.log('Getting Player Wise WHS Handicap Data Failed', "error", error.toString());

        }
    }

    ngAfterViewInit(): void {
        // if (this.WHSSource) {
        //     this.WHSSource.paginator = this.paginator;
        //     this.WHSSource.sort = this.sort;
        // }

        // // If WHSSource might be created later (after API call), handle that:
        // setTimeout(() => {
        //     if (this.WHSSource) {
        //         this.WHSSource.paginator = this.paginator;
        //         this.WHSSource.sort = this.sort;
        //     }
        // });
    }

    async fecthData() {
        if (this.loggedInuser) {

            this.clubTitle = this.loggedInuser.club.name ?? '';
        }

        if (this.playerID) {

            // this.currentPlayerHandicap = <Player>(
            //   await this.facadeService.getPlayerByID(this.playerID)
            // );
            // //console.log(this.currentPlayerHandicap);
            let courseID = this.loggedInuser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
            let courseRating: any = {
                courseId: courseID,
                courseHoleSets: 3,
            };
            let playerscore = <Player>(
                await this._facadeService.getPlayerByIDDetailForm(this.playerID)
            );
            //console.log(playerscore);

            this.playerWHS = await this._facadeService.getPlayerAllWHS(
                this.playerID
            );
            let membersQL = await this._facadeService.getPlayerFlights(this.playerID);
            this.memberQLs = membersQL.MemberQL;
            ////console.log(this.playerWHS);
            this.currentPlayer = playerscore['player'];

            this.playerWHSHistory =
                this.playerWHS['HandicapHistoryWhsQL'];
            //console.log(this.playerWHSHistory);

            this.usedForHandicap =
                this.playerWHSHistory && this.playerWHSHistory.length > 0
                    ? (this.playerWHSHistory.find(h => !h.isFreezed)?.used_handicaps || [])
                    : [];
            this.playerHandicapWhsList = this.playerWHSHistory.slice(0, 40);
            this.topDiff20 =
                this.playerHandicapWhsList.length > 0
                    ? this.playerHandicapWhsList[0].handicapDifferential
                    : null;
            //console.log('Lowest Handicap=' + this.topDiff20);

            // this.topDiff = this.playerHandicapWhsList.sort(
            //     this.ComparatorHandicapDifferentialAsc
            // );

            this.handicapsAvailable = this.playerHandicapWhsList.length;

            switch (this.handicapsAvailable) {
                case 20:
                    this.handicapsToUse = 8;
                    break;
                case 19:
                    this.handicapsToUse = 7;
                    break;
                case 18:
                case 17:
                    this.handicapsToUse = 6;
                    break;
                case 16:
                case 15:
                    this.handicapsToUse = 5;
                    break;
                case 14:
                case 13:
                case 12:
                    this.handicapsToUse = 4;
                    break;
                case 11:
                case 10:
                case 9:
                    this.handicapsToUse = 3;
                    break;
                case 8:
                case 7:
                case 6:
                    this.handicapsToUse = 2;
                    break;
                case 5:
                case 4:
                case 3:
                    this.handicapsToUse = 1;
                    break;
                default:
                    this.handicapsToUse = 0;
                    break;
            }
            // this.topDiff =
            //     this.topDiff.length > this.handicapsToUse
            //         ? this.topDiff[this.handicapsToUse].handicapDifferential
            //         : 0;
            // //console.log('TopDiffer' + this.topDiff);
            // //console.log('Available Handicaps' + this.playerHandicapWhsList);
            // //console.log('Available Handicaps' + this.handicapsAvailable);
            // //console.log('Available Handicaps' + this.handicapsToUse);
            //console.log(this.playerWHSHistory);
            // let slicedWhs = this.playerWHSHistory.slice(0, 20);
            const slicedWhs = this.playerWHSHistory;
            //console.log(slicedWhs);
            this.memerbershipNumber =
                this.currentPlayer[0].membershipNumber;
            this.fullName =
                this.currentPlayer[0].firstName +
                ' ' +
                this.currentPlayer[0].lastName;
            for (let whsItem of slicedWhs) {
                if (whsItem.combined_handicap) {
                    const index = slicedWhs.indexOf(whsItem);
                    slicedWhs.splice(index + 1, 0, whsItem.combined_handicap);
                    whsItem.combined_handicap = null;
                    whsItem.noBorder = true;
                    whsItem.highlight = true;
                    slicedWhs[index].highlight = true;
                    slicedWhs[index + 1].highlight = true;
                }
            }
            //console.log(slicedWhs);
            this.length = slicedWhs.length;

            this.personLeads = slicedWhs.filter(function (a) {
                return !a.is_combined;
            }, 0);
            //console.log(this.personLeads);

            this.WHSSource = new MatTableDataSource(this.personLeads);

            // if (this.paginator) {
            //     this.WHSSource.paginator = this.paginator;
            //     this.WHSSource.sort = this.sort;
            // }
            this.isLoading = false;
            this._handicapComponent.matDrawer.open();
            this.playerWHSRound = await this._facadeService.getPlayerWHSRound(
                courseRating
            );

            //console.log(this.playerWHS);
            console.log(this.playerWHSRound);
            let handicapIndex = this.currentPlayer[0]['handicapWhsIndex'];
            let rating = this.playerWHSRound['course_rating'];
            for (let item of rating) {
                let slopeRating = item['slopeRating'];
                let courseRating = item['courseRating'];
                let coursePar = item['coursePar'];
                if (item['tee'] == 'WHITE') {
                    this.whiteTeeHI =
                        (handicapIndex * (slopeRating / 113.0) +
                            (courseRating - coursePar)) *
                        0.95;
                    this.whiteTeeHI = Math.round(this.whiteTeeHI);
                } else if (item['tee'] == 'BLACK') {
                    this.blackTeeHI =
                        (handicapIndex * (slopeRating / 113.0) +
                            (courseRating - coursePar)) *
                        0.95;
                    this.blackTeeHI = Math.round(this.blackTeeHI);
                } else if (item['tee'] == 'BLUE') {
                    this.blueTeeHI =
                        (handicapIndex * (slopeRating / 113.0) +
                            (courseRating - coursePar)) *
                        0.95;
                    this.blueTeeHI = Math.round(this.blueTeeHI);
                } else if (item['tee'] == 'RED') {
                    this.redTeeHI =
                        (handicapIndex * (slopeRating / 113.0) +
                            (courseRating - coursePar)) *
                        0.95;
                    this.redTeeHI = Math.round(this.redTeeHI);
                } else if (item['tee'] == 'Black') {
                    this.balckVetTeeHI =
                        (handicapIndex * (slopeRating / 113.0) +
                            (courseRating - coursePar)) *
                        0.95;
                    this.balckVetTeeHI = Math.round(this.balckVetTeeHI);
                }
            }
            //console.log(this.redTeeHI);
            //console.log(this.balckVetTeeHI);
            //console.log(this.blackTeeHI);
            //console.log(this.whiteTeeHI);
            //console.log(this.blueTeeHI);
            this.logger.log('Getting Player Wise WHS Handicap Data Successful', "info", this.playerID);
            this.showTable = Promise.resolve(true);
            let newScores: any[] = [];

            let flag: boolean = false;
        } else {
            this.location.back();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        //Dispose the overlays if they are still on the DOM
        if (this._tagsPanelOverlayRef) {
            this._tagsPanelOverlayRef.dispose();
        }
    }
    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._handicapComponent.matDrawer.close();
    }
    ComparatorHandicapDifferentialAsc(a, b) {
        if (a['handicapDifferential'] < b['handicapDifferential']) return -1;
        if (a['handicapDifferential'] > b['handicapDifferential']) return 1;
        return 0;
    }
    isHandicapUsed(id: string) {
        ////console.log(this.usedForHandicap);
        let used: boolean = this.usedForHandicap.some((handicap) => {
            return (
                handicap.used_handicap_id == id ||
                handicap.combine_handicap_id == id
            );
        });
        return used;
    }
    cancel() {
        this.logger.log('BackDrop click on Player WHS Handicap', "info");

        this._router.navigate(['../'], { relativeTo: this._activatedRoute });
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

    public downloadAsPDFWHS() {
        try {
            this.logger.log('Download Player WHS Handicap Button Click', "info", this.playerID);
            var doc = new jsPDF();
            var col = [
                'Sr.',
                'Mem.No',
                'Date',
                'Score',
                'Adj.Score',
                'h/diff',
                'h/index',
                'tee'
            ];
            var rows = [];
            var rows = [];
            doc.setFontSize(17);
            doc.text(
                'WHS-Handicap Change-Log of ' +
                this.currentPlayer[0].firstName +
                ' ' +
                this.currentPlayer[0].lastName,
                14,
                15
            );
            doc.setFontSize(18);
            // doc.setTextColor(100);

            let count = 0;
            this.personLeads.forEach((element) => {
                count++;
                // let flag = true;
                // if (element.combined_handicap_id) {

                //   for (let index in this.personLeads) {
                //     if (this.personLeads[index].Handicap_id==element.combined_handicap_id) {
                //       this.personLeads[index].noBorder=false;
                //       element.noBorder=false;
                //       break;
                //     }
                //   }

                // }
                let tee = this.playingTee(element.tournamentId);
                let panelty: boolean = false;
                let used: boolean = this.usedForHandicap.some((handicap) => {
                    return (
                        handicap.used_handicap_id == element.Handicap_id ||
                        handicap.combine_handicap_id == element.Handicap_id
                    );
                });
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
                        element.playedAt,
                        'mediumDate',
                        'en-US'
                    ),
                    element.score,
                    element.adjustedScore,
                    Math.round(element.handicapDifferential * 10) / 10,
                    Math.round(element.handicapIndex * 10) / 10,
                    tee,
                    element.highlight,
                    used,
                    element.panelty,

                ];
                rows.push(temp);
            });
            // From HTML
            let a = 1;
            (doc as any).autoTable(col, rows, {
                startY: 25,
                theme: 'grid',
                didParseCell: function (data) {
                    if (data.row.raw[8] == true) {
                        data.cell.styles.fillColor = [195, 249, 230];
                    }
                    if (data.row.raw[10] == true) {
                        data.cell.styles.textColor = [255, 9, 9];
                    }
                    a++;
                    if (data.row.raw[9] == true && a == 5) {
                        data.cell.styles.fillColor = [249, 187, 147];
                        ////console.log(1);
                        //a=false;
                    }
                    if (data.row.index == 1) {
                        ////console.log('assssssssssss');
                    }
                    //console.log(data.row.index);

                    ////console.log(a);
                },
            });
            // (doc as any).autoTable({
            //   html: "#pdfTable",
            //   startY: 25,
            //   theme: "grid",
            // });
            // Open PDF document in new tab
            doc.output('dataurlnewwindow');
            this.logger.log('Player WHS Handicap PDF generated successfully', "info", this.playerID);
        } catch (error) {
            this.logger.log('Download Player Handicap WHS Failed', "error", error.toString());

        }
        // Download PDF document
        //doc.save('flights.pdf');
    }
    playingTee(id: string) {
        // console.log(id);
        let used = this.memberQLs.find((handicap) => {
            return handicap.FlightQL.tournamentId == id;
        });
        if (used) {
            let tee = this.playerWHSRound['course_tees'].filter(tee => { return tee.tee_id == used.tee_id });
            if (tee && tee.length > 0) {
                return tee[0].name_by_club ?? 'White';
            }
        }
        return 'White';
        // return used
        //     ? General.getPlayersTeesColour(used.playingTee)
        //     : used
        //         ? used.FlightQL.tee
        //         : 'White';
    }

    openTeeChangeDailog(player) {
        this.logger.log('Admin Click on Change Tee in Player WHS Handicap', "info", this.playerID);
        console.log(player);

        const dialogRef = this.dialog.open(DialogTeeComponent, {
            data: {
                player: player,
                loggedInUser: this.loggedInuser
            }
        });
        dialogRef.afterClosed().subscribe((result) => {
            this.logger.log('Change Tee dialog closed in Player WHS Handicap', "info", { playerId: this.playerID, confirmed: !!result });
            if (result) {
                this.WHSSource = null;
                this.fecthData()
            }
        })
    }
}
