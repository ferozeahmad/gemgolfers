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
import { Player, UserSessionModel } from '../../../../shared/models/player.model';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Constants, General } from '../../../../shared/classes/general';
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

    isLoading: boolean = false;
    showtable: boolean = false;
    loggedInuser: UserSessionModel;
    scheduleForm: FormGroup;
    refresh: boolean = false;
    minDate: Date;
    maxDate: Date;
    currentDate: string;
    customValue: boolean;
    dailyStats: any[] = [];
    selectedClub: string = '';
    clubs: string[] = [];
    originalData: any[] = [];

    dataSource: MatTableDataSource<any>;
    displayedColumns = [
        'id',
        'date',
        'roundsPlayed',
        'membersPlayed',
        'submittedCards',
        'clubName',
        // 'nonSubmittedCards',
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

            this.isLoading = true;

            this.showtable = false;

            //  this.scheduleForm = this.fb.group({

            //   BookingDate: ['', [Validators.required]]
            // });

            this.scheduleForm = this.fb.group({
                dateRange: ['Last_Week'],
                startDate: ['', [Validators.required]],
                endDate: ['', [Validators.required]],
            });

            //console.log(this.scheduleForm);

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            var currentDate = new Date();
            // currentDate.setDate(currentDate.getDate());

            // var nxtDate = new Date();
            // nxtDate.setDate(nxtDate.getDate() + 7);
            let lastDate = this.endOfWeek();

            this.getDailyRounds(currentDate, lastDate);


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

    extractClubs(data: any[]) {
        const clubSet = new Set<string>();
        data.forEach((row) => {
            if (row.clubName && row.clubName !== '-') {
                clubSet.add(row.clubName);
            }
        });
        this.clubs = Array.from(clubSet).sort();
    }

    onClubFilterChange(selectedClub: string) {
        this.selectedClub = selectedClub;
        
        if (selectedClub === '' || selectedClub === 'All') {
            // Show all data
            this.dataSource.data = this.originalData;
        } else {
            // Filter by selected club
            this.dataSource.data = this.originalData.filter(row => row.clubName === selectedClub);
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    async getDailyRounds(fromDate: Date, toDate: Date) {
        let dailyRoundsData: any[] = [];

        let dataPlayers: any;
        this.dailyStats = [];
        this.showtable = false;
        this.isLoading = true;
        let counter: number = 0;

        if (this._localStorage.isSuperAdmin()) {
            dataPlayers = await this.facadeService.getDailyTeeTimeReportAdmin(
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        } else {
            dataPlayers = await this.facadeService.getDailyTeeTimeReportClub(
                this.loggedInuser.adminClubId,
                this.datePipe.transform(fromDate.toString(), 'yyyy-MM-dd'),
                this.datePipe.transform(toDate.toString(), 'yyyy-MM-dd')
            );
        }
        console.log(dataPlayers.TournamentsQL);
        //console.log(dataPlayers.TournamentsQL.length);
        if (dataPlayers.TournamentsQL) {
            this.isLoading = false;
            this.showtable = true;
            let myData: any[] = [];
            let prevDate = null;
            let count = 0;
            let memCounter = 0;
            let allPlayers = 0;
            let totalFlights = 0;
            let submittedCards = 0;
            let nonSubmittedCards = 0;
            let submitPer = 0;
            let nonSubmitPer = 0;
            for (let obj of dataPlayers.TournamentsQL) {
                for (let i = 0; i < obj.slots.length; i++) {
                    const dailyStat = {
                        date: obj.teeDate,
                        membersCount:
                            obj.slots[i]?.FlightsQL
                                ? 1
                                : 0,
                        noOfFlights: ++totalFlights,
                        allPlayers:
                            obj.slots[i]?.FlightsQL &&
                                obj.slots[i].FlightsQL.MembersQL
                                    .length > 0
                                ? obj.slots[i].FlightsQL
                                    .MembersQL
                                : [],
                        submittedCards:
                            obj.slots[i]?.FlightsQL &&
                                obj.slots[i].FlightsQL.MembersQL
                                    .length > 0
                                ? obj.slots[i].FlightsQL.MembersQL
                                    .length
                                : 0,
                        nonSubmittedCards:
                            obj.slots[i]?.FlightsQL &&
                                obj.slots[i].FlightsQL.MembersQL
                                    .length > 0
                                ? obj.slots[i].FlightsQL.MembersQL.filter((a) => {
                                    return a.ScoresQL.length == 0;
                                })
                                : [],
                        flights: obj.slots[i]?.FlightsQL ? obj.slots[i].FlightsQL : {},
                        clubName: obj.club ? obj.club.name : '-',
                    };
                    this.dailyStats.push(dailyStat);
                }
            }
            console.log(this.dailyStats);

            for (let stats of this.dailyStats) {
                if (stats.date == prevDate) {
                    memCounter = memCounter + stats.membersCount;
                    totalFlights = stats.noOfFlights;
                    allPlayers = stats.allPlayers;
                    submittedCards =
                        submittedCards + stats.submittedCards;
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
                    if (
                        stats.flights &&
                        typeof stats.flights === 'object' &&
                        Object.keys(stats.flights).length > 0
                    ) {
                        myData[myData.length - 1].flights.push(stats.flights);
                    }
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
                    allPlayers = 0;
                    nonSubmitPer = 0;
                    memCounter = memCounter + stats.membersCount;
                    totalFlights = stats.noOfFlights;
                    submittedCards =
                        submittedCards + stats.submittedCards;
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
                        allPlayers: allPlayers,
                        submittedCards: submittedCards,
                        submittedCardsList: submittedCardsList,
                        allPlayersList: allPlayersList,
                        nonSubmittedCards: nonSubmittedCards,
                        nonSubmittedCardsList: nonSubmittedCardsList,
                        submitPer: submitPer,
                        nonSubmitPer: nonSubmitPer,
                        clubName: stats.clubName,
                        flights: [Object.keys(stats.flights).length > 0 ? stats.flights : {}],
                    };
                    count++;
                    myData.push(obj);
                    //console.log(count);
                    prevDate = stats.date;
                }
            }
            console.log(myData);
            this.isLoading = false;
            this.showtable = true;
            this.dataSource = null;
            this.originalData = myData;
            this.dataSource = new MatTableDataSource(myData);
            //console.log(this.dataSource);

            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.extractClubs(myData);


        }
    }

    public downloadAsPDF(data: any) {
        const doc = new jsPDF('portrait');
        const pageHeight = (doc as any).internal.pageSize.height;
        const pageWidth = (doc as any).internal.pageSize.width;

        /* =======================
           Title Section
        ======================= */
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${this.loggedInuser.club?.name} Tee Times Report`, pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${data.date}`, pageWidth / 2, 22, { align: 'center' });

        /* =======================
           Prepare Flights Data
        ======================= */
        const flightsArray = (data.flights || [])
            .filter(f => Array.isArray(f.MembersQL) && f.MembersQL.length)
            .map((flight, index) => {
                const firstMember = flight.MembersQL[0];
                const playerCategory =
                    firstMember?.PlayerQL?.playerCategory || 'Unknown';

                return {
                    time: flight.time || '',                     // if exists
                    flightNumber: `No. ${index + 1}`,             // fallback
                    startingHole: flight.startingHole || 1,       // fallback
                    players: flight.MembersQL.map(m => ({
                        fullName: `${m.PlayerQL?.firstName || ''} ${m.PlayerQL?.lastName || ''}`.trim(),
                        handicap: m.PlayerQL?.handicap ?? '-'
                    })),
                    playerCategory
                };
            });

        /* =======================
           Split Left / Right
        ======================= */
        const leftFlights = flightsArray.filter(f => f.startingHole < 10);
        const rightFlights = flightsArray.filter(f => f.startingHole >= 10);

        const maxFlights = Math.max(leftFlights.length, rightFlights.length);

        // make arrays equal length
        while (leftFlights.length < maxFlights) leftFlights.push(null);
        while (rightFlights.length < maxFlights) rightFlights.push(null);

        /* =======================
           Layout Settings
        ======================= */
        let startY = 30;
        const blockHeight = 42;

        for (let i = 0; i < maxFlights; i++) {

            if (startY + blockHeight > pageHeight - 10) {
                doc.addPage();
                startY = 30;
            }

            // LEFT COLUMN (Hole 1)
            this.drawFlightBlock(doc, leftFlights[i], 10, startY);

            // RIGHT COLUMN (Hole 10)
            this.drawFlightBlock(doc, rightFlights[i], 102, startY);

            startY += blockHeight;
        }

        doc.save(`Golf_Draws_${data.date}.pdf`);
    }

    private drawFlightBlock(doc, flight, startX, startY) {
        if (!flight) return;

        doc.rect(startX, startY, 90, 40);
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, startY, 90, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Time', startX + 2, startY + 5);
        doc.text('Group', startX + 10, startY + 5);
        doc.text('Tee', startX + 20, startY + 5);
        doc.text('Players', startX + 29, startY + 5);
        doc.text('Hc.', startX + 77, startY + 5);

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(General.formatTime(flight.time), startX + 2, startY + 14);
        doc.text(flight.flightNumber, startX + 10, startY + 14);
        doc.text(flight.startingHole.toString(), startX + 20, startY + 14);

        const maxLineWidth = 44;
        const lineHeight = 6;
        let currentY = startY + 14;

        flight.players.forEach((player) => {
            let splitName = doc.splitTextToSize(player.fullName.toString().toUpperCase(), maxLineWidth);

            splitName.forEach((line, lineIndex) => {
                doc.text(line, startX + 29, currentY + (lineIndex * lineHeight));
            });

            doc.text(player.handicap.toString(), startX + 77, currentY);
            currentY += splitName.length * lineHeight;
        });
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
        this.logger.log('Getting Daily starter Data By date', "info", combinedData);
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
