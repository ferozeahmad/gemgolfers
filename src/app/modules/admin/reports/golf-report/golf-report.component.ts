import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import 'jspdf-autotable';
// import { UserDetailsDilogueComponent } from "../../material-components/user-details-dilogue/user-details-dilogue.component";
import { MatDialog } from '@angular/material/dialog';
import { UserDetailsDilogueComponent } from '../../dialogs/dialog-user-details/user-details-dilogue.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-golf-report',
    templateUrl: './golf-report.component.html',
    styleUrls: ['./golf-report.component.scss'],
})
export class GolfReportComponent implements OnInit {
    Leaderboard: any;
    isLoading: boolean = true;
    isClubAdmin: boolean = false;
    lastActiveTab = 1;
    noItemsInList = false;
    loggedInuser: any;
    scheduleForm: FormGroup;
    refresh: boolean = true;
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
    selectedClub: string = '';
    clubs: string[] = [];
    HandicapIndex: any[] = [];
    showResult: boolean = false;
    showtable: boolean = true;
    weeklyRounds: any = [];
    selected = Constants.DR_YESTERDAY;
    index: any = 0;
    aggregate = 0;
    pageSize: any = 20;
    tabindex: any = 0;
    dataSource: MatTableDataSource<any>;
    displayedColumnsCongu = [
        'id',
        'name',
        'email',
        'category',
        'memebrship#',
        'handicap',
        'totalRounds',
        'totalLeagues',
        'totalTournament',
        'clubName',
        'details',
    ];

    //['id','name', 'dates','updatedHandicap','details'];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
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
        public dialog: MatDialog,
        public snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private _localStorage: LocalStorageService,
        private route: ActivatedRoute,
        private logger: LogsService
    ) { }

    async ngOnInit() {
        try {

            this.logger.log('Admin Come to Player Round Page', "info");
            this.logger.log('Getting Player Round Data', "info", "Today");
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.isLoading = false;
            this.refresh = true;
            this.scheduleForm = this.fb.group({
                options: ['',],
                startDate: ['', [Validators.required]],
                endDate: ['', [Validators.required]],
            });
            let todayDate = this.today();

            this.getTotalReport(todayDate, todayDate);
        } catch (error) {
            this.logger.log('Getting Player Round Data Failed', "error", error.toString());
        }
    }

    async getTotalReport(fromDate: Date, toDate: Date) {
        this.formdate = fromDate;
        this.toDate = toDate;
        let players: any;
        if (this._localStorage.isSuperAdmin()) {
            players = await this.facadeService.getTotalFlightPlayedAdmin(

                this.datePipe.transform(
                    fromDate.toString(),
                    'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                ),
                this.datePipe.transform(
                    toDate.toString(),
                    'yyyy-MM-ddTHH:mm:SS' + '+00:00'
                )
            );
        } else {
            players = await this.facadeService.getTotalFlightPlayed(
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
        }
        console.log(players);

        this.Players = [];
        this.dailyStats = [];
        this.Players = players['player'];
        for (let obj of players['player']) {
            let newobj = {
                id: obj.id,
                memebrshipNo: obj.membershipNumber,
                name: obj.firstName + ' ' + obj.lastName,
                category: obj.playerCategory,
                handicap: obj.handicap,
                email: obj.email,
                clubName: obj.membershipQL.length > 0 ? obj.membershipQL[0]?.club?.name : '-',
                totalRounds: obj.DailyRoundAggregateQL
                    ? obj.DailyRoundAggregateQL['aggregate'].count
                    : 1,
                totalLeagues: obj.LeagueAggregateQL
                    ? obj.LeagueAggregateQL['aggregate'].count
                    : 1,
                totalTournament: obj.TournamentAggregateQL
                    ? obj.TournamentAggregateQL['aggregate'].count
                    : 1,
            };
            this.dailyStats.push(newobj);
        }
        this.dailyStats.sort(this.Comparator);
        this.extractClubs();
        this.dataSource = new MatTableDataSource(this.dailyStats);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.refresh = false;
        this.isLoading = true;
        //console.log(this.dataSource);
    }

    redirectToHandicapDetails = (id: string) => {
        //console.log(id);

        if (id) {
            const dialogRef = this.dialog.open(UserDetailsDilogueComponent, {
                data: {
                    id: id,
                    from: this.formdate,
                    to: this.toDate,
                },
            });
            //console.log(id);

            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    ////console.log("record deleted.");
                    //this.delete(id);
                    //this.ngOnInit();
                } else {
                    ////console.log("cancel delete action");
                }
            });
        }
    };

    applyFilter(filterValue: string) {
        //console.log(this.dataSource.data);
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    extractClubs() {
        const clubSet = new Set<string>();
        this.dailyStats.forEach((player) => {
            if (player.clubName && player.clubName !== '-') {
                clubSet.add(player.clubName);
            }
        });
        this.clubs = Array.from(clubSet).sort();
    }

    onClubFilterChange(selectedClub: string) {
        this.selectedClub = selectedClub;
        if (selectedClub === '' || selectedClub === 'All') {
            // Show all players
            this.dataSource.data = this.dailyStats;
        } else {
            // Filter players by selected club
            this.dataSource.data = this.dailyStats.filter(
                (player) => player.clubName === selectedClub
            );
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }
    setDataSource(dataSource) {
        this.dataSource = new MatTableDataSource(dataSource);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    // public downloadAsPDF() {
    //     this.logger.log('Admin Click Download Pdf Daily Player Report', "info");
    //     let doc = new jsPDF();
    //     let res = (doc as any).autoTableHtmlToJson(document.getElementById('a'));
    //     let columns = [
    //         res.columns[0],
    //         res.columns[1],
    //         res.columns[2],
    //         res.columns[3],
    //         res.columns[4],
    //         res.columns[5],
    //     ];
    //     doc.setFontSize(30);
    //     doc.text('KGC Golf Detail:', 15, 15);
    //     doc.setFontSize(13);
    //     doc.setTextColor(100);

    //     // From HTML
    //     // (doc as any).autoTable({
    //     //   html: "#pdfTable",
    //     //   startY: 35,
    //     //   theme: "grid",
    //     // });
    //     (doc as any).autoTable(columns, res.data, { startY: 25, theme: 'grid' });

    //     // Open PDF document in new tab
    //     doc.output('dataurlnewwindow');

    //     // Download PDF document
    //     //doc.save('flights.pdf');
    // }
    exportToExcel(): void {

        const data = this.dataSource.data.map((item) => {
            // Create a new object without the 'Details' column
            const { id, details, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Players_report.xlsx');

    }
    onDatePick() {
        const combinedData = `StartDate=${this.scheduleForm.value.startDate}, EndDate=${this.scheduleForm.value.endDate}`;
        this.logger.log('Getting Daily starter Data By date', "info", combinedData);
        //console.log(this.scheduleForm.value.startDate);
        //console.log(this.scheduleForm.value.endDate);
        if (this.scheduleForm.value.startDate) {
            let lastDate = this.scheduleForm.value.endDate;
            let startDate = this.scheduleForm.value.startDate;

            //console.log(lastDate);
            //console.log(startDate);
            this.isLoading = false;
            this.refresh = true;
            this.dataSource = null;
            this.getTotalReport(lastDate, startDate);
        } else {
        }
    }
    yesterday() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 1));
    }
    today() {
        let date = new Date();
        return date;
    }
    async dailySetup(selectedValue) {
        // this.logger.log('Getting Daily starter Data By Dropdown', "info", selectedValue.value.toString());

        //console.log(selectedValue);
        this.isLoading = false;
        this.refresh = true;
        if (selectedValue.value == Constants.DR_TODAY) {
            this.dataSource = null;
            this.customValue = false;
            let currentDate = new Date();
            await this.getTotalReport(currentDate, currentDate);
        } else if (selectedValue.value == Constants.DR_YESTERDAY) {
            this.dataSource = null;
            let yesterdayDate = this.yesterday();
            await this.getTotalReport(yesterdayDate, yesterdayDate);
        } else if (selectedValue.value == Constants.DR_LAST_WEEK) {
            this.customValue = false;
            this.dataSource = null;
            let currentDate = new Date();
            let lastDate = this.endOfWeek();
            //console.log(currentDate);
            //console.log(lastDate);

            await this.getTotalReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_MONTH) {
            this.dataSource = null;
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            await this.getTotalReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_3_MONTH) {
            this.dataSource = null;
            this.customValue = false;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            await this.getTotalReport(currentDate, lastDate);
        } else if (selectedValue.value == Constants.DR_LAST_6_MONTH) {
            this.customValue = false;
            this.dataSource = null;
            let currentDate = new Date();
            let lastDate = this.endOfMonth();
            //console.log(currentDate);
            //console.log(lastDate);

            await this.getTotalReport(currentDate, lastDate);
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
    endOfWeek() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 7));
    }

    endOfMonth() {
        let date = new Date();
        return new Date(date.setDate(date.getDate() - 29));
    }
    Comparator(a, b) {
        if (a.totalRounds > b.totalRounds) return -1;
        if (a.totalRounds < b.totalRounds) return 1;

        return 0;
    }
}
