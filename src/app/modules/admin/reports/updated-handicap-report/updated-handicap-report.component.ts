import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
// import { Apollo } from "apollo-angular";
import { Player } from '../../../../shared/models/player.model';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Constants } from '../../../../shared/classes/general';
import { of } from 'rxjs';
import { DatePipe, formatDate } from '@angular/common';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-updated-handicap-report',
    templateUrl: './updated-handicap-report.component.html',
    styleUrls: ['./updated-handicap-report.component.scss'],
})
export class UpdatedHandicapReportComponent implements OnInit {
    Leaderboard: any;
    isLoading: boolean = false;
    isClubAdmin: boolean = false;
    lastActiveTab = 1;
    noItemsInList = false;
    loggedInuser: Player;
    scheduleForm: FormGroup;
    refresh: boolean = false;
    minDate: Date;
    maxDate: Date;
    startingHole: string;
    startTime: string;
    RoundDate: string;
    currentDate: string;
    Players: any[] = [];
    file: File;
    arrayBuffer: any;
    customDate: any;
    customDate2: any;
    customValue: boolean;
    dailyStats: any[] = [];
    dailyStatsWHS: any[] = [];
    tournamentID: string;
    filterPlayer: string = '';
    filterCategory: string;
    HandicapIndex: any[] = [];
    showResult: boolean = false;
    showtable: boolean = true;
    weeklyRounds: any = [];
    selected = Constants.DR_YESTERDAY;
    index: any = 0;
    aggregate = 0;
    pageSize: any = 20;
    tabindex: any = 0;
    dataSourceCONGU: MatTableDataSource<any>;
    displayedColumnsCongu = [
        'id',
        'membership',
        'name',
        'date',
        'grossScore',
        'adjustedScore',
        'score',
        'oldHandicap',
        'handicapDifference',
        'handicap',
    ];
    dataSourceWHS: MatTableDataSource<any>;
    displayedColumnsWHS = [
        'id',
        'membership',
        'name',
        'date',
        'Score',
        'adjustedScore',
        'handicapDifferential',
        'handicapIndex',
    ];
    //['id','name', 'dates','updatedHandicap','details'];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginators: MatPaginator;
    @ViewChild(MatSort) sorts: MatSort;
    @ViewChild('fileInput') fileInputletiable: ElementRef;
    conguLength: any;
    WHSLength: any;
    dataPlayers: any;
    dataPlayersWHS: any;
    dataPlayersCongu: any;
    formdate: Date;
    toDate: Date;
    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private router: Router,
        private route: ActivatedRoute,
        private _localStorage: LocalStorageService,
        private _formBuilder: FormBuilder, private logger: LogsService
    ) { }

    ngOnInit() {
        try {

            this.logger.log('Admin Come to Daily Updated Handicap Page', "info");
            this.logger.log('Getting Daily Updated Handicap Data', "info", "Yesterday");
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.Players = [];

            this.route.paramMap.subscribe((params) => {
                this.filterCategory = params.get('category');
            });

            this.showtable = false;
            this.showResult = false;
            this.isLoading = true;

            //  this.scheduleForm = this.fb.group({

            //   BookingDate: ['', [Validators.required]]
            // });

            this.scheduleForm = this.fb.group({
                startDate: ['', [Validators.required]],
                endDate: ['', [Validators.required]],
            });

            //console.log(this.scheduleForm);

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            this.weeklyRounds = [];
            of(this.weeklyRounds)
                .pipe()
                .subscribe(
                    async (data) => {
                        // let currentDate = new Date();
                        // currentDate.setDate(currentDate.getDate());
                        // let nxtDate = new Date();
                        // nxtDate.setDate(nxtDate.getDate() + 7);
                        let yesterdayDate = this.yesterday();
                        let toDate = this.today();
                        this.getPlayerUpdatedHandicapReport(
                            yesterdayDate,
                            yesterdayDate
                        );
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {
            this.logger.log('Getting Daily Updated Handicap Data Failed', "error", error.toString());

        }
    }

    applyFilter(filterValue: string) {
        this.logger.log('Admin Search in Updated Handicap Page', "info", filterValue);
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSourceCONGU.filter = filterValue;

        if (this.dataSourceCONGU.paginator) {
            this.dataSourceCONGU.paginator.firstPage();
        }
    }

    async getPlayerUpdatedHandicapReport(fromDate: Date, toDate: Date) {
        this.dailyStats = [];
        this.isLoading = true;
        this.formdate = fromDate;
        this.toDate = toDate;
        const combinedData = `fromDate=${fromDate}, toDate=${toDate}`;
        if (this._localStorage.isSuperAdmin()) {
            this.dataPlayersCongu =
                await this.facadeService.playerUpdatedHandicapReportAdmin(

                    this.datePipe.transform(
                        fromDate.toString(),
                        'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                    ),
                    this.datePipe.transform(
                        toDate.toString(),
                        'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                    )
                );
            // this.dataPlayersWHS =
            //     await this.facadeService.playerUpdatedHandicapWHSReportAdmin(

            //         this.datePipe.transform(
            //             fromDate.toString(),
            //             'yyyy-MM-ddTHH:mm:SS' + '+00:00'
            //         ),
            //         this.datePipe.transform(
            //             toDate.toString(),
            //             'yyyy-MM-ddTHH:mm:SS' + '+00:00'
            //         )
            //     );
        } else {
            this.dataPlayersCongu =
                await this.facadeService.playerUpdatedHandicapReport(
                    this.loggedInuser.adminClubId,
                    this.datePipe.transform(
                        fromDate.toString(),
                        'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                    ),
                    this.datePipe.transform(
                        toDate.toString(),
                        'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                    )
                );
            // this.dataPlayersWHS =
            //     await this.facadeService.playerUpdatedHandicapWHSReport(
            //         this.loggedInuser.adminClubId,
            //         this.datePipe.transform(
            //             fromDate.toString(),
            //             'yyyy-MM-ddTHH:mm:SS' + '+00:00'
            //         ),
            //         this.datePipe.transform(
            //             toDate.toString(),
            //             'yyyy-MM-ddTHH:mm:SS' + '+00:00'
            //         )
            //     );
        }

        // for (let obj of this.dataPlayersCongu.player_handicap) {
        //  let obja= this.dataPlayersWHS.player_handicap_whs.find(a=>{
        //   obj.tournamentId == a.tournamentId;
        //   })
        //   //console.log(obja);

        //   ////console.log(result);
        // }
        this.logger.log('Getting Daily Updated Handicap Data Sucessfully', "info", combinedData);
        //console.log(this.dataPlayersCongu)
        this.dataPlayersWHS = this.dataPlayersCongu.player_handicap_whs;

        this.conguLength = this.dataPlayersCongu.player_handicap.length;
        this.WHSLength = this.dataPlayersWHS.length;
        //console.log(this.dataPlayersWHS);
        //console.log(this.dataPlayersCongu);

        this.getPlayerUpdatedHandicapReportCongu();
    }
    getPlayerUpdatedHandicapReportCongu() {
        this.dailyStats = [];
        let count = 0;

        if (this.dataPlayersCongu.player_handicap) {
            for (
                this.index;
                this.index < this.dataPlayersCongu.player_handicap.length;
                this.index++
            ) {
                count++;
                const dailyStat = {
                    name:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .PlayerQL.fullName,
                    membership:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .PlayerQL.membershipNumber,
                    date: this.dataPlayersCongu.player_handicap[this.index]
                        .tournament
                        ? this.dataPlayersCongu.player_handicap[this.index]
                            .tournament.endDate
                        : '',
                    handicap:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .handicap,
                    oldHandicap:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .oldHandicap,
                    grossScore:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .grossScore,
                    adjustedScore:
                        this.dataPlayersCongu.player_handicap[this.index]
                            .adjustedScore,
                    score: this.dataPlayersCongu.player_handicap[this.index]
                        .score,
                };

                this.dailyStats.push(dailyStat);
                if (count >= this.pageSize) break;
            }
        }
        this.index = 0;

        //console.log(this.dailyStats);

        this.dataSourceCONGU = new MatTableDataSource(this.dailyStats);
        //console.log(this.dataSourceCONGU);

        //this.dataSourceCONGU.paginator = this.paginators;
        this.dataSourceCONGU.sort = this.sorts;
        this.isLoading = false;
        this.isLoading = false;
        this.showtable = true;
    }
    getPlayerUpdatedHandicapReportWHS() {
        this.dailyStatsWHS = [];
        let count = 0;
        if (this.dataPlayersWHS) {
            for (
                this.index;
                this.index < this.dataPlayersWHS.length;
                this.index++
            ) {
                count++;
                const dailyStat = {
                    name:
                        this.dataPlayersWHS[this.index]
                            .player.fullName,
                    membership:
                        this.dataPlayersWHS[this.index]
                            .player.membershipNumber,
                    date: this.dataPlayersWHS[this.index]
                        .tournament
                        ? this.dataPlayersWHS[this.index]
                            .tournament.endDate
                        : '',
                    handicapIndex:
                        this.dataPlayersWHS[this.index]
                            .handicapIndex,
                    score: this.dataPlayersWHS[this.index]
                        .score,
                    handicapDifferential:
                        this.dataPlayersWHS[this.index]
                            .handicapDifferential,
                    adjustedScore:
                        this.dataPlayersWHS[this.index]
                            .adjustedScore,
                };

                this.dailyStatsWHS.push(dailyStat);
                if (count >= this.pageSize) break;
            }
            this.dataSourceWHS = new MatTableDataSource(this.dailyStatsWHS);
            //console.log(this.dataSourceWHS);
        }
        //this.dataSourceWHS.paginator = this.paginator;
        this.dataSourceWHS.sort = this.sort;
        this.isLoading = false;
        this.showtable = true;
    }
    tabClicked(tab: any) {
        try {

            this.logger.log('Admin Click tab on Updated Handicap Page', "info");
            this.index = 0;
            this.pageSize = 20;
            if (tab.index == 1) {
                this.getPlayerUpdatedHandicapReportWHS();
                this.tabindex = 1;
            } else {
                this.getPlayerUpdatedHandicapReportCongu();
                this.tabindex = 0;
            }
        } catch (error) {

        }
    }
    onPageFired(event) {
        this.logger.log('Admin Change Page in Updated Handicap Report', "info", { pageIndex: event.pageIndex, pageSize: event.pageSize });
        this.index = event.pageIndex * event.pageSize;
        this.pageSize = event.pageSize;
        //console.log(this.index);
        if (this.tabindex == 1) {
            this.getPlayerUpdatedHandicapReportWHS();
        } else {
            this.index = event.pageIndex * event.pageSize;
            this.getPlayerUpdatedHandicapReportCongu();
        }

        //console.log(event);
    }
    async getPlayerInformationByMembershipNumber(filterValue: string) {
        this.logger.log('Admin Search by membershipNo in Updated Handicap Report', "info", filterValue);
        //console.log(filterValue);
        //let membershipNumber : string = (<HTMLInputElement>document.getElementById("membershipNumber")).value;
        filterValue = filterValue.trim().toLowerCase().toString(); // Remove whitespace
        //filterValue = filterValue.toLowerCase(); // Dat
        if (filterValue == '') {
            this.getPlayerUpdatedHandicapReportCongu();
            this.getPlayerUpdatedHandicapReportWHS();
            return;
        }
        this.Players = [];
        if (this.tabindex == 0) {
            if (filterValue.length >= 3) {
                for (let c of this.dataPlayersCongu.player_handicap) {
                    if (c.PlayerQL.membershipNumber == filterValue) {
                        const dailyStat = {
                            name:
                                c.PlayerQL.firstName +
                                ' ' +
                                c.PlayerQL.lastName,
                            membership: c.PlayerQL.membershipNumber,
                            date: c.tournament ? c.tournament.endDate : '',
                            handicap: c.handicap,
                            oldHandicap: c.oldHandicap,
                            grossScore: c.grossScore,
                            adjustedScore: c.adjustedScore,
                            score: c.score,
                        };
                        this.Players.push(dailyStat);
                        //this.selectPlayer = c;
                    }
                }

                this.setDataSource(this.Players);
            }
        } else {
            if (filterValue.length >= 3) {
                for (let c of this.dataPlayersWHS) {
                    if (c.player.membershipNumber == filterValue) {
                        const dailyStat = {
                            name: c.player.firstName + ' ' + c.player.lastName,
                            membership: c.player.membershipNumber,
                            date: c.tournament ? c.tournament.endDate : '',
                            handicapIndex: c.handicapIndex,
                            score: c.score,
                            handicapDifferential: c.handicapDifferential,
                            adjustedScore: c.adjustedScore,
                        };
                        this.Players.push(dailyStat);
                        //this.selectPlayer = c;
                    }
                }

                this.setDataSource(this.Players);
            }
        }
    }
    getPlayerInformationByName(filterValue: string) {
        this.logger.log('Admin Search by name in Updated Handicap Report', "info", filterValue);
        
        //console.log(filterValue);
        if (filterValue == '') {
            this.getPlayerUpdatedHandicapReportCongu();
            this.getPlayerUpdatedHandicapReportWHS();
            return;
        }
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.Players = [];
        if (this.tabindex == 0) {
            if (filterValue.length >= 3) {
                for (let c of this.dataPlayersCongu.player_handicap) {
                    c['fullname'] =
                        c.PlayerQL['firstName'] + ' ' + c.PlayerQL['lastName'];
                    if (
                        (c.PlayerQL.membershipNumber &&
                            c.PlayerQL.membershipNumber
                                .toLowerCase()
                                .toString()
                                .includes(filterValue)) ||
                        c['fullname']
                            .toLowerCase()
                            .toString()
                            .includes(filterValue) ||
                        (c.PlayerQL.email &&
                            c.PlayerQL.email
                                .toLowerCase()
                                .toString()
                                .includes(filterValue)) ||
                        (c.PlayerQL.phone &&
                            c.PlayerQL.phone
                                .toLowerCase()
                                .toString()
                                .includes(filterValue))
                    ) {
                        const dailyStat = {
                            name:
                                c.PlayerQL.firstName +
                                ' ' +
                                c.PlayerQL.lastName,
                            membership: c.PlayerQL.membershipNumber,
                            date: c.tournament ? c.tournament.endDate : '',
                            handicap: c.handicap,
                            oldHandicap: c.oldHandicap,
                            grossScore: c.grossScore,
                            adjustedScore: c.adjustedScore,
                            score: c.score,
                        };
                        this.Players.push(dailyStat);
                        //this.selectPlayer = c;
                    }
                }

                this.setDataSource(this.Players);
            }
        } else {
            if (filterValue.length >= 3) {
                for (let c of this.dataPlayersWHS) {
                    c['fullname'] =
                        c.player['firstName'] + ' ' + c.player['lastName'];
                    if (
                        (c.player.membershipNumber &&
                            c.player.membershipNumber
                                .toLowerCase()
                                .toString()
                                .includes(filterValue)) ||
                        c['fullname']
                            .toLowerCase()
                            .toString()
                            .includes(filterValue) ||
                        (c.player.email &&
                            c.player.email
                                .toLowerCase()
                                .toString()
                                .includes(filterValue)) ||
                        (c.player.phone &&
                            c.player.phone
                                .toLowerCase()
                                .toString()
                                .includes(filterValue))
                    ) {
                        const dailyStat = {
                            name: c.player.firstName + ' ' + c.player.lastName,
                            membership: c.player.membershipNumber,
                            date: c.tournament ? c.tournament.endDate : '',
                            handicapIndex: c.handicapIndex,
                            score: c.score,
                            handicapDifferential: c.handicapDifferential,
                            adjustedScore: c.adjustedScore,
                        };
                        this.Players.push(dailyStat);
                        //this.selectPlayer = c;
                    }
                }

                this.setDataSource(this.Players);
            }
        }
    }
    setDataSource(dataSource: any) {
        if (this.tabindex == 0) {
            this.dataSourceCONGU = new MatTableDataSource(dataSource);
            this.dataSourceCONGU.sort = this.sort;
            //console.log(this.dataSourceCONGU);
        } else {
            this.dataSourceWHS = new MatTableDataSource(dataSource);
            this.dataSourceWHS.sort = this.sort;
            ////console.log(this. this.dataSourceWHS);
        }
    }
    endOfWeek() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 7));
    }

    endOfMonth() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 29));
    }

    Dailysetup(selectedValue) {
        this.logger.log('Getting Updated Handicap Data By Dropdown', "info", selectedValue.value.toString());
        
        //console.log(selectedValue);

        if (selectedValue.value == Constants.DR_TODAY) {
            this.customValue = false;
            let currentDate = new Date();
            this.getPlayerUpdatedHandicapReport(currentDate, currentDate);
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {
            let yesterdayDate = this.yesterday();
            this.getPlayerUpdatedHandicapReport(yesterdayDate, yesterdayDate);
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getPlayerUpdatedHandicapReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getPlayerUpdatedHandicapReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_3_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getPlayerUpdatedHandicapReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_6_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getPlayerUpdatedHandicapReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_CUSTOM) {
            this.customValue = true;
            // let currentDate = this.customDate.value;
            // let lastDate = this.customDate2.value;
            // //console.log(currentDate)
            // //console.log(lastDate)
            // this.getDailyRounds(currentDate,lastDate);
        } else {
        }
    }

    redirectToDetails = (id: string) => {
        this.logger.log('Admin Click on View Player in Updated Handicap Report', "info", id);
        this.location.navigate(['/players/view/' + id]);
    };

    redirectToUpdate = (id: string) => {
        this.logger.log('Admin Click on Update Player in Updated Handicap Report', "info", id);
        this.location.navigate(['/players/update/' + id]);
    };

    public downloadAsPDFCongu() {
        this.logger.log('Admin Click Download Congu Pdf Updated Handicap Report', "info");
        let doc = new jsPDF();
        let col = [
            'Sr.',
            'M.No',
            'Name',
            'Play Date',
            'Gross',
            'Adj.Gross',
            'Net',
            'Cur.H/C',
            "H'Cap Adj.",
            'Exact H/C',
        ];
        let rows = [];
        doc.setFontSize(15);
        doc.text(
            'CONGU-Handicap Change Log From ' +
            this.datePipe.transform(this.toDate.toString(), 'MMM d, y') +
            ' to ' +
            this.datePipe.transform(this.formdate.toString(), 'MMM d, y'),
            20,
            15
        );

        doc.setFontSize(18);
        doc.setTextColor(100);

        let count = 0;
        //console.log(this.dataPlayersCongu.player_handicap);

        this.dataPlayersCongu.player_handicap.forEach((element) => {
            count++;
            let adjhANDICAP = element.handicap - element.oldHandicap;
            let temp = [
                count,
                element.PlayerQL.membershipNumber,
                element.PlayerQL.fullName,
                formatDate(element.tournament.endDate, 'mediumDate', 'en-US'),
                element.grossScore,
                element.adjustedScore,
                element.score,
                element.oldHandicap,
                adjhANDICAP.toFixed(1),
                element.handicap,
            ];
            rows.push(temp);
        });
        // From HTML
        (doc as any).autoTable(col, rows, { startY: 25, theme: 'grid' });

        // Open PDF document in new tab
        //doc.output("dataurlnewwindow");

        // Download PDF document
        doc.save('CONGU-Handicap Change Log.pdf');
        this.logger.log('Congu Pdf Updated Handicap Report downloaded successfully', "info");
    }
    public downloadAsPDFWHS() {
        this.logger.log('Admin Click Download WHS Pdf Updated Handicap Report', "info");
        let doc = new jsPDF();
        let col = [
            'Sr.',
            'M.No',
            'Name',
            'Play Date',
            'Score',
            'Adj.Score',
            'h/diff',
            'h/index',
        ];
        let rows = [];
        doc.setFontSize(22);
        doc.text(
            'WHS-Handicap Change Log' +
            this.datePipe.transform(this.toDate.toString(), 'MMM d, y') +
            ' to ' +
            this.datePipe.transform(this.formdate.toString(), 'MMM d, y'),
            20,
            15
        );

        doc.setFontSize(18);
        doc.setTextColor(100);

        let count = 0;
        //console.log(this.dataPlayersCongu.player_handicap);

        this.dataPlayersWHS.forEach((element) => {
            count++;
            let temp = [
                count,
                element.player.membershipNumber,
                element.player.fullName,
                formatDate(element.tournament.endDate, 'mediumDate', 'en-US'),
                element.score,
                element.adjustedScore,
                element.handicapDifferential,
                element.handicapIndex,
            ];
            rows.push(temp);
        });
        // From HTML
        (doc as any).autoTable(col, rows, { startY: 25, theme: 'grid' });

        // Open PDF document in new tab
        //doc.output("dataurlnewwindow");

        // Download PDF document
        doc.save('WHS-Handicap Change Log.pdf');
        this.logger.log('WHS Pdf Updated Handicap Report downloaded successfully', "info");
    }
    onDatePick() {
        const combinedData = `StartDate=${this.scheduleForm.value.startDate}, EndDate=${this.scheduleForm.value.endDate}`;
        this.logger.log('Getting Updated Handicap Data By date', "info",combinedData);
        //console.log(this.scheduleForm.value.startDate);
        //console.log(this.scheduleForm.value.endDate);
        if (this.scheduleForm.value.startDate) {
            let lastDate = this.scheduleForm.value.endDate;
            let startDate = this.scheduleForm.value.startDate;
            this.isLoading = true;
            this.showtable = false;
            this.dataSourceCONGU = null;
            this.dataSourceWHS = null;
            //console.log(lastDate);
            //console.log(startDate);
            this.getPlayerUpdatedHandicapReport(lastDate, startDate);
        } else {
        }
    }

    today() {
        return new Date();
    }
    tabClickedtabClicked(tab: any) {
        if (tab.index == 1) {
        } else {
        }
    }
    yesterday() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 1));
    }
    // today() {
    //     let date = new Date();
    //     return new Date(date.setDate(date.getDate()));
    // }

    // onDatePick(item){
    //   //console.log(item)
    //   this.customDate = item;
    //   if(this.customDate2){
    //     let currentDate = this.customDate.value;
    //     let lastDate = this.customDate2.value;

    //     //console.log(currentDate)
    //     //console.log(lastDate)
    //     this.getPlayerUpdatedHandicapReport(currentDate,lastDate);
    //     }
    //     else{}

    // }

    // onDatePick2(item){
    //   //console.log(item)
    //   this.customDate2 = item;
    //   if(this.customDate){
    //   let currentDate = this.customDate.value;
    //   let lastDate = this.customDate2.value;

    //   //console.log(currentDate)
    //   //console.log(lastDate)
    //   this.getPlayerUpdatedHandicapReport(currentDate,lastDate);
    //   }
    //   else{}

    // }
}
