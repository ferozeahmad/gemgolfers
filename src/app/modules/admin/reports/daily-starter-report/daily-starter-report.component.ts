import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { jsPDF } from "jspdf";
import { Player } from '../../../../shared/models/player.model';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Constants } from '../../../../shared/classes/general';
import { of } from 'rxjs';
import { DatePipe, JsonPipe } from '@angular/common';
import { DialogPlayerListComponent } from '../../dialogs/dialog-player-list/dialog-player-list.component';
import { DialogUncompletedComponent } from '../../dialogs/dialog-uncomplete-players/dialog-uncomplete.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
// import { DialogPlayerListComponent } from "../../material-components/dialog-player-list/dialog-player-list.component";

@Component({
    standalone: false,
    selector: 'app-daily-starter-report',
    templateUrl: './daily-starter-report.component.html',
    styleUrls: ['./daily-starter-report.component.scss'],
})
export class DailyStarterReportComponent implements OnInit {
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
    Players: Player[] = [];
    file: File;
    arrayBuffer: any;
    customDate: any;
    customDate2: any;
    customValue: boolean;
    dailyStats: any[] = [];
    tournamentID: string;
    filterPlayer: string = '';
    filterCategory: string;
    HandicapIndex: any[] = [];
    weeklyRounds: any = [];
    nonSubmit: number = 0;
    submit: number = 0;
    singleRound: any[] = [];
    flightPlayers: any[] = [];
    findex = 0;
    showResult: boolean = false;
    showtable: boolean = true;
    matchPlayData: any[] = [];

    dataSource: MatTableDataSource<any>;
    displayedColumns = [
        'id',
        'date',
        'roundsPlayed',
        'membersPlayed',
        'submittedCards',
        'nonSubmittedCards',
        'details',
    ];
    //['id','name', 'dates','updatedHandicap','details'];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('fileInput') fileInputVariable: ElementRef;

    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private router: Router,
        private route: ActivatedRoute,
        private _formBuilder: FormBuilder,
        public dialog: MatDialog,
        private _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    ngOnInit() {
        try {
            this.logger.log('Admin Come to Daily Starter Report', "info");
            this.logger.log('Getting Daily Starter Report Data', "info", "Today");

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.Players = [];

            this.route.paramMap.subscribe((params) => {
                this.filterCategory = params.get('category');
            });

            this.isLoading = true;
            this.showResult = false;
            this.showtable = false;

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
                        var currentDate = new Date();
                        currentDate.setDate(currentDate.getDate() - 1);

                        //var nxtDate = new Date();
                        //nxtDate.setDate(nxtDate.getDate() + 7);

                        this.getDailyRounds(currentDate, currentDate);
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {
            this.logger.log('Getting Daily Starter Data Failed', "error", error.toString());
        }
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    async getDailyRounds(fromDate: Date, toDate: Date) {
        let dailyRoundsData: any[] = [];
        this.singleRound.length = 0;
        let dataPlayers: any;
        this.flightPlayers = [];
        this.findex = 0;
        this.dailyStats = [];
        this.showtable = false;
        this.showResult = false;
        this.isLoading = true;
        let counter: number = 0;

        if (this._localStorage.isSuperAdmin()) {
            dataPlayers = await this.facadeService.getDailyCardSingleAdmin(
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        } else {
            dataPlayers = await this.facadeService.getDailyCardSingle(
                this.loggedInuser.adminClubId,
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        }
        this.logger.log('Getting Daily Starter Report Data Successfully', "info", dataPlayers?.TournamentsQL?.length);
        //console.log(dataPlayers.TournamentsQL);
        //console.log(dataPlayers.TournamentsQL.length);
        if (dataPlayers.TournamentsQL) {
            this.isLoading = false;
            this.showtable = true;
            let myData: any[] = [];
            let prevDate = null;
            let count = 0;
            let memCounter = 0;
            let totalFlights = 0;
            let submittedCards = 0;
            let nonSubmittedCards = 0;
            let submitPer = 0;
            let nonSubmitPer = 0;
            for (let i = 0; i < dataPlayers.TournamentsQL.length; i++) {
                const dailyStat = {
                    date: dataPlayers.TournamentsQL[i].startDate,
                    membersCount:
                        dataPlayers.TournamentsQL[i].FlightsQL.length > 0
                            ? dataPlayers.TournamentsQL[i].FlightsQL[0]
                                .MembersQL.length
                            : 0,
                    noOfFlights: dataPlayers.TournamentsQL[i].FlightsQL.length,
                    allPlayers:
                        dataPlayers.TournamentsQL[i].FlightsQL.length > 0 &&
                            dataPlayers.TournamentsQL[i].FlightsQL[0].MembersQL
                                .length > 0
                            ? dataPlayers.TournamentsQL[i].FlightsQL[0]
                                .MembersQL
                            : [],
                    submittedCards:
                        dataPlayers.TournamentsQL[i].FlightsQL.length > 0 &&
                            dataPlayers.TournamentsQL[i].FlightsQL[0].MembersQL
                                .length > 0
                            ? dataPlayers.TournamentsQL[
                                i
                            ].FlightsQL[0].MembersQL.filter((a) => {
                                return a.ScoresQL.length > 0;
                            })
                            : [],
                    nonSubmittedCards:
                        dataPlayers.TournamentsQL[i].FlightsQL.length > 0 &&
                            dataPlayers.TournamentsQL[i].FlightsQL[0].MembersQL
                                .length > 0
                            ? dataPlayers.TournamentsQL[
                                i
                            ].FlightsQL[0].MembersQL.filter((a) => {
                                return a.ScoresQL.length == 0;
                            })
                            : [],
                };
                this.dailyStats.push(dailyStat);
                this.dailyStats = this.dailyStats.sort(this.Comparator);
            }
            console.log(this.dailyStats);

            for (let stats of this.dailyStats) {
                if (stats.date == prevDate) {
                    memCounter = memCounter + stats.membersCount;
                    totalFlights = totalFlights + stats.noOfFlights;
                    submittedCards =
                        submittedCards + stats.submittedCards.length;
                    nonSubmittedCards =
                        nonSubmittedCards + stats.nonSubmittedCards.length;
                    submitPer = (submittedCards / memCounter) * 100;
                    nonSubmitPer = (nonSubmittedCards / memCounter) * 100;
                    submitPer = Math.round(submitPer);
                    nonSubmitPer = Math.round(nonSubmitPer);
                    myData[myData.length - 1].membersCount = memCounter;
                    myData[myData.length - 1].totalFlights = totalFlights;
                    myData[myData.length - 1].submittedCards = submittedCards;
                    myData[myData.length - 1].nonSubmittedCards =
                        nonSubmittedCards;
                    myData[myData.length - 1].submitPer = submitPer;
                    myData[myData.length - 1].nonSubmitPer = nonSubmitPer;
                    ////console.log(myData);

                    if (stats.nonSubmittedCards.length) {
                        for (let p of stats.nonSubmittedCards)
                            myData[
                                myData.length - 1
                            ].nonSubmittedCardsList.push(p.PlayerQL);
                    }
                    if (stats.submittedCards.length) {
                        for (let p of stats.submittedCards)
                            myData[myData.length - 1].submittedCardsList.push(
                                p.PlayerQL
                            );
                    }
                    if (stats.allPlayers.length) {
                        for (let p of stats.allPlayers)
                            myData[myData.length - 1].allPlayersList.push(
                                p.PlayerQL
                            );
                    }
                    prevDate = stats.date;
                } else {
                    memCounter = 0;
                    totalFlights = 0;
                    submittedCards = 0;
                    nonSubmittedCards = 0;
                    submitPer = 0;
                    nonSubmitPer = 0;
                    memCounter = memCounter + stats.membersCount;
                    totalFlights = totalFlights + stats.noOfFlights;
                    submittedCards =
                        submittedCards + stats.submittedCards.length;
                    nonSubmittedCards =
                        nonSubmittedCards + stats.nonSubmittedCards.length;
                    submitPer = submitPer + (submittedCards / memCounter) * 100;
                    nonSubmitPer =
                        nonSubmitPer + (nonSubmittedCards / memCounter) * 100;
                    submitPer = Math.round(submitPer);
                    nonSubmitPer = Math.round(nonSubmitPer);

                    let nonSubmittedCardsList = [];
                    let submittedCardsList = [];
                    let allPlayersList = [];
                    if (stats.nonSubmittedCards.length) {
                        for (let p of stats.nonSubmittedCards)
                            nonSubmittedCardsList.push(p.PlayerQL);
                    }
                    if (stats.submittedCards.length) {
                        for (let p of stats.submittedCards)
                            submittedCardsList.push(p.PlayerQL);
                    }
                    if (stats.allPlayers.length) {
                        for (let p of stats.allPlayers)
                            allPlayersList.push(p.PlayerQL);
                    }

                    let obj = {
                        date: stats.date,
                        membersCount: memCounter,
                        totalFlights: totalFlights,
                        submittedCards: submittedCards,
                        submittedCardsList: submittedCardsList,
                        allPlayersList: allPlayersList,
                        nonSubmittedCards: nonSubmittedCards,
                        nonSubmittedCardsList: nonSubmittedCardsList,
                        submitPer: submitPer,
                        nonSubmitPer: nonSubmitPer,
                    };
                    count++;
                    myData.push(obj);
                    //console.log(count);
                    //console.log(myData);
                    prevDate = stats.date;
                }
            }
            this.isLoading = false;
            this.showtable = true;
            this.dataSource = null;
            this.dataSource = new MatTableDataSource(myData);
            //console.log(this.dataSource);

            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;

            if (dataPlayers.TournamentsQL.length) {
                this.matchPlayData = dataPlayers.TournamentsQL;
            }
        }
        // //console.log(this.dailyStats);
        // let myData: any[] = [];
        // let prevDate = null;
        // let count = 0;
        // let memCounter = 0;
        // let totalFlights = 0;
        // let submittedCards = 0;
        // let nonSubmittedCards = 0;
        // let submitPer = 0;
        // let nonSubmitPer = 0;

        // for (let stats of this.dailyStats) {
        //   if (stats.date == prevDate) {
        //     memCounter = memCounter + stats.membersCount;
        //     totalFlights = totalFlights + stats.noOfFlights;
        //     submittedCards = submittedCards + stats.submittedCards.length;
        //     nonSubmittedCards = nonSubmittedCards + stats.nonSubmittedCards.length;
        //     submitPer = (submittedCards / memCounter) * 100;
        //     nonSubmitPer = (nonSubmittedCards / memCounter) * 100;
        //     submitPer = Math.round(submitPer);
        //     nonSubmitPer = Math.round(nonSubmitPer);
        //     myData[myData.length - 1].membersCount = memCounter;
        //     myData[myData.length - 1].totalFlights = totalFlights;
        //     myData[myData.length - 1].submittedCards = submittedCards;
        //     myData[myData.length - 1].nonSubmittedCards = nonSubmittedCards;
        //     myData[myData.length - 1].submitPer = submitPer;
        //     myData[myData.length - 1].nonSubmitPer = nonSubmitPer;
        //     //console.log(myData);

        //     if (stats.nonSubmittedCards.length) {
        //       for (let p of stats.nonSubmittedCards)
        //         myData[myData.length - 1].nonSubmittedCardsList.push(p.PlayerQL);
        //     }

        //     prevDate = stats.date;
        //   } else {
        //     memCounter = 0;
        //     totalFlights = 0;
        //     submittedCards = 0;
        //     nonSubmittedCards = 0;
        //     submitPer = 0;
        //     nonSubmitPer = 0;
        //     memCounter = memCounter + stats.membersCount;
        //     totalFlights = totalFlights + stats.noOfFlights;
        //     submittedCards = submittedCards + stats.submittedCards.length;
        //     nonSubmittedCards = nonSubmittedCards + stats.nonSubmittedCards.length;
        //     submitPer = submitPer + (submittedCards / memCounter) * 100;
        //     nonSubmitPer = nonSubmitPer + (nonSubmittedCards / memCounter) * 100;
        //     submitPer = Math.round(submitPer);
        //     nonSubmitPer = Math.round(nonSubmitPer);

        //     let nonSubmittedCardsList = [];
        //     if (stats.nonSubmittedCards.length) {
        //       for (let p of stats.nonSubmittedCards)
        //         nonSubmittedCardsList.push(p.PlayerQL);
        //     }

        //     let obj = {
        //       date: stats.date,
        //       membersCount: memCounter,
        //       totalFlights: totalFlights,
        //       submittedCards: submittedCards,
        //       nonSubmittedCards: nonSubmittedCards,
        //       nonSubmittedCardsList: nonSubmittedCardsList,
        //       submitPer: submitPer,
        //       nonSubmitPer: nonSubmitPer,
        //     };
        //     myData.push(obj);
        //     //console.log(myData);
        //     // this.submit=((myData[stats].submittedCards/myData[stats]["membersCount"])*100);
        //     // this.nonSubmit=(myData[stats]["nonSubmittedCards"]/myData[stats]["membersCount"])*100;
        //     // this.nonSubmit=Math.round(this.nonSubmit);
        //     // this.submit=Math.round(this.submit)
        //     prevDate = stats.date;
        //   }
        // }

        // //console.log(myData);

        //this.dataSource = null;
        // this.submit =
        //   (myData[0]["submittedCards"] / myData[0]["membersCount"]) * 100;
        // this.nonSubmit =
        //   (myData[0]["nonSubmittedCards"] / myData[0]["membersCount"]) * 100;
        // this.nonSubmit = Math.round(this.nonSubmit);
        // this.submit = Math.round(this.submit);
        //this.dataSource = new MatTableDataSource(myData);
        // this.nonSubmit=0;
        // this.submit=0;
        // //console.log(this.dataSource);

        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.sort;

        // if (dataPlayers.TournamentsQL.length) {
        //   this.matchPlayData = dataPlayers.TournamentsQL;
        // }
    }
    public downloadAsPDF() {
        this.logger.log('Admin Click Download Pdf Daily Starter Report', "info");
        let doc = new jsPDF();
        let res = (doc as any).autoTableHtmlToJson(document.getElementById('pdfTable'));
        let columns = [
            res.columns[0],
            res.columns[1],
            res.columns[2],
            res.columns[3],
            res.columns[4],
            res.columns[5],
        ];
        doc.setFontSize(30);
        doc.text('KGC Daily Starter Report:', 15, 15);
        doc.setFontSize(13);
        doc.setTextColor(100);

        // From HTML
        // (doc as any).autoTable({
        //   html: "#pdfTable",
        //   startY: 35,
        //   theme: "grid",
        // });
        (doc as any).autoTable(columns, res.data, { startY: 25, theme: 'grid' });

        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document
        //doc.save('flights.pdf');
    }
    Comparator(a, b) {
        if (a['date'] < b['date']) return -1;
        if (a['date'] > b['date']) return 1;
        return 0;
    }

    endOfWeek() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 7));
    }

    endOfMonth() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 29));
    }
    yesterday() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 1));
    }
    Dailysetup(selectedValue) {
        this.logger.log('Getting Daily starter Data By Dropdown', "info", selectedValue.value.toString());
        //console.log(selectedValue);
        if (selectedValue.value == Constants.DR_TODAY) {
            this.customValue = false;
            let currentDate = new Date();
            this.getDailyRounds(currentDate, currentDate);
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {
            this.customValue = false;

            let yesterdayDate = this.yesterday();
            this.getDailyRounds(yesterdayDate, yesterdayDate);
        } else if (selectedValue.value == Constants.DR_LAST_3_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_6_MONTH) {
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            this.getDailyRounds(currentDate, lastDate);
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

    onDatePick() {
        const combinedData = `StartDate=${this.scheduleForm.value.startDate}, EndDate=${this.scheduleForm.value.endDate}`;
        this.logger.log('Getting Daily starter Data By date', "info",combinedData);
        //console.log(this.scheduleForm.value.startDate);
        //console.log(this.scheduleForm.value.endDate);
        if (this.scheduleForm.value.startDate) {
            let lastDate = this.scheduleForm.value.endDate;
            let startDate = this.scheduleForm.value.startDate;

            if (lastDate == '') {
                lastDate = startDate;
            }
            if (startDate == '') {
                startDate = lastDate;
            }
            //console.log(lastDate);
            //console.log(startDate);
            this.getDailyRounds(lastDate, startDate);
        } else {
        } 
    }

    playerList(players, key, date) {
        this.logger.log('Getting Daily Starter Report Player Wise', "info", date);
        const dialogRef = this.dialog.open(DialogUncompletedComponent, {
            data: { players: players, key: key, date: date },
        });
    }
}
