import {
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewChild,
    OnChanges,
    SimpleChange,
    SimpleChanges,
} from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    FormControl,
    FormArray,
    Validators,
} from '@angular/forms';
import { read, utils } from 'xlsx';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Club } from '../../../../shared/models/club.model';
import { Course, CourseHoles } from '../../../../shared/models/course.model';
import {
    Tournament,
    TournamentRounds,
    TournamentMember,
    matchFormat,
    TournamentCategory,
} from '../../../../shared/models/tournament.model';
import {
    Player,
    PlayerCategory,
    Marshal,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    UniqueIdGenerator,
    passwordGenerator,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { SelectionModel } from '@angular/cdk/collections';
import { of } from 'rxjs';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DialogAddPlayerComponent } from '../../dialogs/dialog-add-player/dialog-add-player.component';
import { DialogPlayerComponent } from '../../dialogs/dialog-player/dialog-player.component';
import { DialogPlayerListComponent } from '../../dialogs/dialog-player-list/dialog-player-list.component';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { DialogMoveFlightComponent } from '../../dialogs/dialog-move-flight/dialog-move-flight.component';
import { ViewTournamentComponent } from '../view-tournament/view-tournament.component';

import { MatDrawer } from '@angular/material/sidenav';
import { DialogAddMemberComponent } from '../../dialogs/dialog-add-member/dialog-add-member.component';
import { DialogCloseRoundComponent } from '../../dialogs/dialog-close-round/dialog-close-round.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { isObject } from 'lodash';

@Component({
    standalone: false,
    selector: 'app-flight-management',
    templateUrl: './flight-management.component.html',
    styleUrls: ['./flight-management.component.scss'],
})
export class FlightManagementComponent implements OnInit, OnChanges {

    @Input() tournamentID: string;
    @Input() activeRound: number;
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    dataSource: MatTableDataSource<any>;
    dataSources: MatTableDataSource<any>;
    drawerMode: 'side' | 'over';
    displayedColumns = [
        'firstName',
        'lastName',
        'handicap',
        'playerCategory',
        'action',
    ];
    membersColumns = [
        'firstName',
        'lastName',
        'handicap',
        'playerCategory',
        'select',
    ];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginators: MatPaginator;
    @ViewChild(MatSort) sorts: MatSort;
    selection = new SelectionModel<Player>(true, []);
    public formGroup: FormGroup;
    public contactList: FormArray;
    showFiller = false;
    showCategory: boolean = true;
    newFlights: any[] = [];
    categoryCounts: any = [];
    loggedInuser: UserSessionModel;
    teetime: number = 0;
    tournamentInfo: any;
    tournamentMember: any[] = [];
    selectedMembers: any[][] = [];
    //tournamentID: string;
    isLoading: boolean = true;
    preFlightTime: string;
    flightRound: number = 0;
    noOfRounds: number;
    tRounds: any[] = [];
    roundFlights: any[] = [];
    copyScoreInfo: any[] = [];
    flightTees: Map<string, any> = new Map<string, any>();
    file: File;
    addFlightNum: number = 0;
    isClubAdmin: boolean = false;
    arrayBuffer: any;
    flightsData: any;
    categories: TournamentCategory[] = [];
    importedFlights: boolean = false;
    playerTee: boolean = false;
    importedFlightsNum: number = 0;
    exist: Player[];
    newPlayers: Player[] = [];
    showTeams: boolean = false;
    showMatchPlay: boolean = false;
    teamName: string;
    dataPlayers: any;
    index: any = 0;
    selectedIndex: any = 0;
    aggregate = 0;
    pageSize: any = 20;
    clubMembers: any[] = [];
    player: any[];

    selectPlayer: any;
    selectedFlights: number[] = [];
    selectedPlayers: { flightIndex: number, playerIndex: number }[] = [];
    showSwapFlightsButton: boolean = false;
    showSwapPlayersButton: boolean = false;
    constructor(
        private _localStorage: LocalStorageService,
        private logger: LogsService,
        private route?: ActivatedRoute,
        private router?: Router,
        public snackBar?: MatSnackBar,
        public dialog?: MatDialog,
        public _viewTournamentComponent?: ViewTournamentComponent,
        private facadeService?: FacadeService,
        public changeDetection?: ChangeDetectorRef,
    ) { }

    // returns all form groups under flights
    get contactFormGroup() {
        return this.formGroup.get('flights') as FormArray;
    }
    /**
     * On changes
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        // ..this.getSelectedPlayers();
        // this.selectedMembers=changes;
        console.log(changes);

        if (changes['activeRound']) {
            this.activeRound = changes['activeRound'].currentValue;
            this.flightRound = changes['activeRound'].currentValue;
            this.getSelectedPlayers();
            // console.log('Active round changed:', changes['activeRound'].currentValue);
            // Reload data / logic here
        }
        if ('selectedMembers' in changes) {
            this.getSelectedPlayers();
        }

        // changes.prop contains the old and the new value...
    }
    async ngOnInit() {
        console.log(this.activeRound);

        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        //console.log(this.loggedInuser);
        if (this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin()) {
            this.isClubAdmin = true;
        }
        this.route.paramMap.subscribe((params) => {
            this.tournamentID = params.get('id');
        });
        //console.log(this.tournamentID);

        let dataFullTournament = await this.facadeService.getTournamentsFlights(
            this.tournamentID
        );
        this.logger.log('Admin comes to View Flights on Tournament Page', "info", this.tournamentID.toString());
        this.logger.log('Getting View Flights on Tournament Page', "info", this.tournamentID.toString());

        this.tournamentInfo = dataFullTournament.TournamentQL;
        // this.activeRound = this.tournamentInfo[0].activeRound;
        this.noOfRounds = this.tournamentInfo[0].noOfRounds;
        this.selectedIndex = this.activeRound - 1;
        this.categories = this.tournamentInfo[0]['CategoriesQL'];
        //console.log(this.activeRound);

        //console.log(this.tournamentInfo[0]);
        let selectedClubId: string =
            this._localStorage.isClubAdmin()
                ? this.loggedInuser.adminClubId
                : this.tournamentInfo[0].clubId;
        this.clubMembers = [];
        //console.log(selectedClubId);
        let dataFullTournaments = await this.facadeService.getTournamentMembers(
            this.tournamentID
        );
        //console.log(dataFullTournaments);

        this.tournamentMember = dataFullTournaments.TournamentMemberQL;
        // this.clubMembers = await this.facadeService.getPlayerByClub(
        //     selectedClubId
        // );
        // this.aggregate =
        //     this.clubMembers['AggregateQL']['aggregate'].totalCount;

        // this.syncClubMembers();

        if (
            this.tournamentInfo[0]['matchFormat'] ==
            matchFormat.TEXAS_SCRAMBLE || this.tournamentInfo[0]['matchFormat'] ==

            matchFormat.TWO_BALL_SCRAMBLE || this.tournamentInfo[0]['matchFormat'] ==
            matchFormat.THREE_BALL_SCRAMBLE || this.tournamentInfo[0]['matchFormat'] ==
            matchFormat.FOUR_BALL_SCRAMBLE

        ) {
            // this.flightRound = this.tournamentInfo[0].noOfRounds;
            // else this.flightRound = this.tournamentInfo[0].activeRound;
            this.showTeams = true;
        }
        if (
            this.tournamentInfo[0]['matchFormat'] == matchFormat.MATCH_PLAY
        ) {
            // this.flightRound = this.tournamentInfo[0].noOfRounds;
            // else this.flightRound = this.tournamentInfo[0].activeRound;
            this.showMatchPlay = true;
        }
        this.flightRound = this.activeRound;
        this.getSelectedPlayers();

        //this.syncTournamentMembers();
        // //console.log(clubMembersData);

        // for (let i = 0; i < clubMembersData.length; i++) {
        //   this.clubMembers.push(clubMembersData[i].player);
        // }
        ////console.log(this.clubMembers);

        this.isLoading = false;

        ////console.log(this.tournamentInfo[0]);
        if (this.tournamentInfo[0]) {

            this.tRounds = [];

            for (let i = 1; i <= this.noOfRounds; i++) {
                let status = '';

                if (i < this.activeRound) {
                    status = 'Completed';
                } else if (i === this.activeRound) {
                    status = 'In Progress';
                } else {
                    status = 'Pending'; // or "Upcoming"
                }

                this.tRounds.push({
                    label: 'Round ' + i,
                    status: status,
                    round: i
                });
            }
        }


    }


    createAutoFlights() {
        let allowCat: boolean = false;
        //  let flights = this.dataFullTournament['TournamentQL'][0].FlightsQL;
        let startDate = this.tournamentInfo[0].startDate;
        startDate = new Date(startDate);
        startDate.setDate(startDate.getDate());
        //console.log(startDate);

        let newstartDate = startDate.getDate();

        //console.log(newstartDate);

        for (let newObj of this.categories) {
            let flightSettings: any = newObj.flightSettings;
            newObj['cut'] = false;
            if (
                Object.prototype.toString
                    .call(flightSettings)
                    .indexOf('Array') > -1 &&
                flightSettings.length > 0
            ) {
                for (let obj of flightSettings) {
                    let chngDate = obj.dates.replaceAll('-', '').toString();
                    let newDate =
                        chngDate.substring(0, 4) +
                        '-' +
                        chngDate.substring(4, 6) +
                        '-' +
                        chngDate.substring(6, 8);
                    // //console.log(newDate);

                    let flightDate = new Date(newDate).getDate();
                    //console.log(flightDate);
                    if (flightDate == newstartDate) {
                        allowCat = true;
                        newObj['allowCat'] = true;
                        break;
                    }

                    ////console.log(this.calculateDiff(newstartDate,flightDate));
                }
                if (!allowCat) {
                    newObj['allowCat'] = false;
                }
            } else if (
                Object.prototype.toString
                    .call(flightSettings)
                    .indexOf('Object') > -1
            ) {
                for (let obj of flightSettings['playingDate']) {
                    let chngDate = obj.dates.replaceAll('-', '').toString();
                    let newDate =
                        chngDate.substring(0, 4) +
                        '-' +
                        chngDate.substring(4, 6) +
                        '-' +
                        chngDate.substring(6, 8);

                    let flightDate = new Date(newDate).getDate();
                    //console.log(flightDate);
                    if (flightDate == newstartDate) {
                        allowCat = true;
                        newObj['allowCat'] = true;
                        break;
                    }
                    ////console.log(this.calculateDiff(newstartDate,flightDate));
                }
                if (!allowCat) {
                    newObj['allowCat'] = false;
                }
            } else {
                newObj['allowCat'] = true;
            }
        }
        const dialogRef = this.dialog.open(DialogCloseRoundComponent, {
            width: '800px',
            data: {
                round: 1000,
                categories: this.categories,
                tournament: this.tournamentID,
                startDate: this.tournamentInfo[0].startDate,
            },
        });
        dialogRef.afterClosed().subscribe(async (result) => {
            //console.log(result);
            // console.log(allowCat);

            if (result && result.category) {
                let teeBox: number;

                let outer = 0;
                let category = '';
                let indexA = 0;
                this.teetime = 0;
                for (let obj of result.category) {
                    let selMembers: Player[][] = [];
                    let cnter = 0;
                    outer = this.selectedMembers.length;
                    let FilteredPL: Player[] = [];
                    let flightTime: any = '9:00';
                    let flightTee: any = 'AMATEURS';
                    let flightTeeID: any = '1';


                    if (
                        this.tournamentInfo[0].matchFormat != 'TEXAS_SCRAMBLE' && allowCat
                    ) {
                        FilteredPL = this.tournamentMember.filter((a) => {
                            return a.player.playerCategory == obj.name;
                        });
                    } else {
                        FilteredPL = this.tournamentMember;
                    }

                    if (FilteredPL.length > 0) {
                        let PperFlight = obj.players;
                        FilteredPL.forEach((filteredPlayer: any) => {
                            if (cnter == 0) this.selectedMembers[outer] = [];
                        });

                        for (const index in FilteredPL) {
                            ////console.log(outer + "<--->" + cnter);
                            //console.log(FilteredPL);
                            if (cnter == 0) this.selectedMembers[outer] = [];

                            this.selectedMembers[outer][cnter] =
                                FilteredPL[index]['player'];

                            if (cnter == parseInt(PperFlight) - 1) {
                                cnter = 0;
                                outer++;
                            } else {
                                cnter++;
                            }
                        }
                        category = obj.name;
                        let tempSelMembers: any[] = [];
                        // let index = 0;

                        for (let index in this.selectedMembers) {
                            if (indexA < this.selectedMembers.length) {
                                this.teetime++;
                                teeBox = this.getNextTeeBox(obj.tee, this.teetime);
                                tempSelMembers = [];
                                tempSelMembers = this.selectedMembers;
                                tempSelMembers[indexA]['tee'] = flightTee;
                                tempSelMembers[indexA]['id'] =
                                    UniqueIdGenerator.generate();
                                tempSelMembers[indexA]['tournamentId'] =
                                    this.tournamentID;
                                tempSelMembers[indexA]['startingHole'] = teeBox;
                                tempSelMembers[indexA]['flightNo'] = this.teetime;
                                tempSelMembers[indexA]['categoryRound'] = 1;
                                tempSelMembers[indexA]['courseHoleSets'] = this.tournamentInfo[0].courseHoleSets;
                                tempSelMembers[indexA]['tee_id'] = 1;
                                tempSelMembers[indexA]['name'] = 'Team' + indexA;
                                tempSelMembers[indexA]['time'] = obj.time;
                                tempSelMembers[indexA]['flightsInterval'] = obj.interval;
                                indexA++;
                                this.selectedMembers = tempSelMembers;
                            }
                        }
                        //console.log(this.selectedMembers);
                    }
                }
            }
        });
    }

    convertToAMPMFormat(timeString: string): string {
        // Split the time string to extract the hour, minute, and second parts
        if (timeString) {
            const timeParts = timeString.split(':'); // Split into ["14", "30", "00+00"]
            // Extract hour, minute, and convert them to numbers
            const hour = parseInt(timeParts[0], 10);
            const minute = parseInt(timeParts[1], 10);
            // Determine whether it's AM or PM
            const period = hour >= 12 ? 'PM' : 'AM';
            // Convert the hour from 24-hour to 12-hour format
            const displayHour = (hour % 12) || 12; // Convert 0 to 12 for 12 AM
            // Construct the formatted time string
            return displayHour + ':' + (minute < 10 ? '0' + minute : minute) + ' ' + period;
        } else {
            return '-';
        }
    }

    createflight(flight) {
        let selMembers: Player[][] = [];

        let FilteredPL: Player[] = [];
        let flightTime: any = '9:00';
        let flightTee: any = 'AMATEURS';
        let flightTeeID: any = '1';
        let teeBox: number;
        let cnter = 0;
        let outer = 0;

        if (this.tournamentInfo[0].matchFormat != 'TEXAS_SCRAMBLE') {
            FilteredPL = this.tournamentMember.filter((a) => {
                return a.player.playerCategory == flight.name;
            });
        } else {
            FilteredPL = this.tournamentMember;
        }

        if (FilteredPL.length > 0) {
            let PperFlight = flight.players;
            FilteredPL.forEach((filteredPlayer: any) => {
                if (cnter == 0) this.selectedMembers[outer] = [];
            });

            for (const index in FilteredPL) {
                ////console.log(outer + "<--->" + cnter);
                //console.log(FilteredPL);
                if (cnter == 0) this.selectedMembers[outer] = [];

                this.selectedMembers[outer][cnter] =
                    FilteredPL[index]['player'];

                if (cnter == parseInt(PperFlight) - 1) {
                    cnter = 0;
                    outer++;
                } else {
                    cnter++;
                }
            }
            let tempSelMembers: any[] = [];

            for (const index in this.selectedMembers) {
                this.teetime++;
                teeBox = this.getNextTeeBox(flight.tee, this.teetime);
                tempSelMembers = [];
                tempSelMembers = this.selectedMembers;
                tempSelMembers[index]['tee'] = flightTee;
                tempSelMembers[index]['id'] = UniqueIdGenerator.generate();
                tempSelMembers[index]['tournamentId'] = this.tournamentID;
                tempSelMembers[index]['startingHole'] = teeBox;
                tempSelMembers[index]['flightNo'] = this.teetime;
                tempSelMembers[index]['categoryRound'] = 1;
                tempSelMembers[index]['tee_id'] = 1;
                tempSelMembers[index]['name'] = 'Team' + index;
                tempSelMembers[index]['time'] = flight.time;
                this.selectedMembers = tempSelMembers;
            }
            //console.log(this.selectedMembers);
        }
    }

    getTeamColor(playerId: string) {
        for (let team of this.tournamentInfo[0].teams) {
            for (let member of team.teamMembers) {
                if (member.playerId === playerId) {
                    return team.color;   // <--- NOW it properly returns
                }
            }
        }
        return null;
    }


    getNextTeeBox(startingHoleOption: string, flight: number): number {
        if (startingHoleOption == '1_10') {
            //console.log('In Function' + flight);

            if (flight !== 1 && flight % 2 === 0) return 10;
            else return 1;
        } else if (startingHoleOption == '10') {
            return 10;
        } else {
            return 1;
        }
    }
    getPlayerInformationByNameClub(filterValue: string) {
        //console.log(filterValue);
        if (filterValue == '') {
            this.syncClubMembers();
            return;
        }
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.player = [];
        for (let c of this.clubMembers['club_member']) {
            c['fullname'] = c.player['firstName'] + ' ' + c.player['lastName'];
            if (c['fullname'].toLowerCase().includes(filterValue)) {
                this.player.push(c);
                this.selectPlayer = c;
            }
        }
        //console.log(this.player);
        this.setDataSources(this.player);
    }
    setDataSources(dataSource: Array<Player>) {
        this.dataSources = new MatTableDataSource(dataSource);
        this.dataSources.sort = this.sort;
        //console.log(this.dataSource);
    }
    getPlayerInformationByNameTournament(filterValue: string) {
        //console.log(filterValue);
        if (filterValue == '') {
            this.syncTournamentMembers();

            return;
        }
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.player = [];
        for (let c of this.tournamentMember) {
            c['fullname'] = c.player['firstName'] + ' ' + c.player['lastName'];
            if (c['fullname'].toLowerCase().includes(filterValue)) {
                this.player.push(c);
                this.selectPlayer = c;
            }
        }
        //console.log(this.player);
        this.setDataSource(this.player);
    }
    setDataSource(dataSource: Array<Player>) {
        this.dataSource = new MatTableDataSource(dataSource);
        this.dataSource.sort = this.sort;
        //console.log(this.dataSource);
    }

    public downloadAsPDFCat(noOfRounds) {
        const doc = new jsPDF('portrait');
        const pageHeight = (doc as any).internal.pageSize.height;
        const pageWidth = (doc as any).internal.pageSize.width;

        // **Title**
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(this.tournamentInfo[0].club?.name, pageWidth / 2, 15, { align: "center" });
        doc.text(this.tournamentInfo[0].title, pageWidth / 2, 22, { align: "center" });

        doc.setFontSize(12);
        doc.text(`DAY ${this.tournamentInfo[0].activeRound} DRAWS`, pageWidth / 2, 27, { align: "center" });

        // **Group flights by playerCategory**
        const groupedByCategory = this.selectedMembers.reduce((acc, member) => {
            const key = `${member['time']}_${member['flightNo']}`;

            // Extract the playerCategory from the first player in the flight
            const firstPlayer = member?.[0];
            const category = firstPlayer ? firstPlayer.playerCategory : 'Unknown Category';

            if (!acc[category]) acc[category] = {};
            if (!acc[category][key]) {
                acc[category][key] = {
                    time: member['time'],
                    flightNumber: `No. ${member['flightNo']}`,
                    startingHole: member['startingHole'],
                    players: member
                        .filter(player => typeof player === 'object' && player !== null) // Ensure player is an object
                        .map(player => ({
                            fullName: `${player['firstName']} ${player['lastName']}`,
                            handicap: player['handicap']
                        })),

                    playerCategory: category
                };
            }

            return acc;
        }, {});

        let startY = 30;
        const blockHeight = 42;
        const blockWidth = 92;

        // **Loop through categories**
        Object.keys(groupedByCategory).forEach((category) => {
            // **Show category header before flights**
            if (startY + 10 > pageHeight - 10) {
                doc.addPage();
                startY = 30;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 185);
            doc.text(category, pageWidth / 2, startY + 5, { align: "center" });
            startY += 10;

            // **Sort flights into left and right columns**
            const flightsArray = Object.values(groupedByCategory[category]);
            const leftFlights = flightsArray.filter(flight => flight['startingHole'] < 10);
            const rightFlights = flightsArray.filter(flight => flight['startingHole'] >= 10);

            // **Ensure both columns have equal length**
            const maxFlights = Math.max(leftFlights.length, rightFlights.length);
            while (leftFlights.length < maxFlights) leftFlights.push(null);
            while (rightFlights.length < maxFlights) rightFlights.push(null);

            for (let i = 0; i < maxFlights; i++) {
                let startX = 10; // Left column position

                if (startY + blockHeight > pageHeight - 10) {
                    doc.addPage();
                    startY = 30;
                }

                // **Left Column (Starting Hole 1)**
                if (leftFlights[i]) {
                    this.drawFlightBlock(doc, leftFlights[i], startX, startY);
                }

                // **Right Column (Starting Hole 10)**
                if (rightFlights[i]) {
                    this.drawFlightBlock(doc, rightFlights[i], startX + blockWidth, startY);
                }

                startY += blockHeight;
            }
        });

        doc.save('Golf_Draws.pdf');
    }
    public downloadAsPDF(noOfRounds) {
        const doc = new jsPDF('portrait');
        const pageHeight = (doc as any).internal.pageSize.height;
        const pageWidth = (doc as any).internal.pageSize.width;

        // **Title**
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(this.tournamentInfo[0].club?.name, pageWidth / 2, 15, { align: "center" });
        doc.text(this.tournamentInfo[0].title, pageWidth / 2, 22, { align: "center" });

        doc.setFontSize(12);
        doc.text(`DAY ${this.tournamentInfo[0].activeRound} DRAWS`, pageWidth / 2, 27, { align: "center" });

        // **Group flights by playerCategory**
        const groupedByFlight = this.selectedMembers.reduce((acc, member) => {
            const key = `${member['time']}_${member['flightNo']}`;
            const firstPlayer = member?.[0];
            const category = firstPlayer ? firstPlayer.playerCategory : 'Unknown Category';
            if (!acc[key]) {
                acc[key] = {
                    time: member['time'],
                    flightNumber: `No. ${member['flightNo']}`,
                    startingHole: member['startingHole'],
                    players: member
                        .filter(player => typeof player === 'object' && player !== null) // Ensure valid players
                        .map(player => ({
                            fullName: `${player['firstName']} ${player['lastName']}`,
                            handicap: player['handicap']
                        })),
                    playerCategory: category
                };
            }

            return acc;
        }, {});

        // Convert grouped flights into an array
        const flightsArray = Object.values(groupedByFlight);

        // **Sort into Left & Right Columns**
        const leftFlights = flightsArray.filter(flight => flight['startingHole'] < 10);
        const rightFlights = flightsArray.filter(flight => flight['startingHole'] >= 10);

        // **Ensure both columns have equal length**
        const maxFlights = Math.max(leftFlights.length, rightFlights.length);
        while (leftFlights.length < maxFlights) leftFlights.push(null);
        while (rightFlights.length < maxFlights) rightFlights.push(null);

        let startY = 30;
        const blockHeight = 42;
        const blockWidth = 92;

        for (let i = 0; i < maxFlights; i++) {
            let startX = 10; // Left column position

            if (startY + blockHeight > pageHeight - 10) {
                doc.addPage();
                startY = 30;
            }

            // **Left Column (Starting Hole 1)**
            if (leftFlights[i]) {
                this.drawFlightBlock(doc, leftFlights[i], startX, startY);
            }

            // **Right Column (Starting Hole 10)**
            if (rightFlights[i]) {
                this.drawFlightBlock(doc, rightFlights[i], startX + blockWidth, startY);
            }

            startY += blockHeight;
        }

        doc.save('Golf_Draws.pdf');
    }

    // **Reusable Function to Draw Flight Block**
    private drawFlightBlock(doc, flight, startX, startY) {
        if (!flight) return;

        doc.rect(startX, startY, 90, 40);
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, startY, 90, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Time', startX + 4, startY + 5);
        doc.text('Flight', startX + 15, startY + 5);
        doc.text('Players', startX + 29, startY + 5);
        doc.text('Hc.', startX + 77, startY + 5);

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(General.formatTime(flight.time), startX + 4, startY + 14);
        doc.text(flight.flightNumber, startX + 15, startY + 14);

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




    tabClicked(tab: any) {
        if (tab.index == 1) {
            this.syncTournamentMembers();
        } else {
            this.masterToggle();
            this.syncClubMembers();
        }
        // this.index = 0;
        // this.pageSize = 20;
        // if (tab.index == 1) {
        //   this.syncHandicapWHS();
        // } else {
        //   this.syncHandicapCongu();
        // }
    }
    onPageFired(event) {
        this.index = event.pageIndex * event.pageSize;
        this.pageSize = event.pageSize;
        //console.log(this.index);
        this.syncClubMembers();

        //console.log(event);
    }
    syncClubMembers() {
        let count = 0;
        this.player = [];
        for (
            this.index;
            this.index < this.clubMembers['club_member'].length;
            this.index++
        ) {
            ////console.log(this.index);

            let flag: boolean = false;
            for (let c of this.tournamentMember) {
                if (
                    c.playerId ==
                    this.clubMembers['club_member'][this.index]['player'].id
                ) {
                    flag = true;
                    break;
                }
            }
            if (flag == false) {
                count++;
                this.player.push(this.clubMembers['club_member'][this.index]);
                if (count >= this.pageSize) break;
            }
        }

        this.index = 0;
        this.dataSources = new MatTableDataSource(this.player);
        this.dataSources.sort = this.sorts;
        this.isLoading = false;
        this.player = [];
        //setTimeout(() => (this.dataSources.paginator = this.paginators), 2000);
    }

    syncTournamentMembers() {
        // //console.log(this.tournamentMember);
        // //console.log(this.selectedMembers);
        let count = 0;
        let flightPlayers: any[] = [];
        if (this.selectedMembers.length > 0) {
            for (let member of this.tournamentMember) {
                for (
                    let index = 0;
                    index < this.selectedMembers[count].length;
                    index++
                ) {
                    if (
                        this.selectedMembers[count][index].id == member.playerId
                    ) {
                        let obj = {
                            playerId: member.playerId,
                        };
                        flightPlayers.push(obj);
                        break;
                    }

                    if (
                        this.selectedMembers.length - 1 > count &&
                        this.selectedMembers[count].length <= index + 1
                    ) {
                        count++;
                        index = -1;
                    }
                }
                count = 0;
            }
        }
        //console.log(flightPlayers);
        if (flightPlayers.length > 0) {
            for (let member of flightPlayers) {
                let index = 0;
                for (let mem of this.tournamentMember) {
                    if (mem.playerId == member.playerId) {
                        this.tournamentMember[index].status = true;
                    }

                    index++;
                }
            }
        }
        //console.log(this.tournamentMember);

        this.dataSource = new MatTableDataSource(this.tournamentMember);
        this.dataSource.sort = this.sort;
        setTimeout(() => (this.dataSource.paginator = this.paginator), 1000);
        this.isLoading = false;
    }

    onHoleChange($event, i, j) {
        ////console.log(i);
        ////console.log(this.stages[i]);
        ////console.log(this.stages[i][j]);
        //this.stages[i][j][1] = $event.target.value;
        let flight_1_hole: string = (<HTMLInputElement>(
            document.getElementById('flight_' + i + '_hole')
        )).value;
        ////console.log(flight_1_hole);
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
    }

    getNextFlightTime(k: number, index: number, items) {
        let flightTime: string = '00:00';
        let makeInterval: boolean = true;

        try {
            if (items.startingHole == '1_10') {
                let tee = this.getNextFlighttee(k, index, items);

                if (tee == 1) makeInterval = true;
                else makeInterval = false;
            } else if (items.startingHole == '10') {
                let tee = this.getNextFlighttee(k, index, items);
                if (tee == 10) makeInterval = true;
                else makeInterval = false;
            } else if (items.startingHole == '1') {
                let tee = this.getNextFlighttee(k, index, items);
                if (tee == 1) makeInterval = true;
                else makeInterval = false;
            }
            let dateNow: Date = new Date(
                Constants.DEFAULT_DATE +
                ' ' +
                (index == 0
                    ? items.time : items.time) +
                ''
            );
            makeInterval
                ? dateNow.setMinutes(
                    dateNow.getMinutes() +
                    (items.flightsInterval && index > 0
                        ? parseInt(items.flightsInterval)
                        : 0)
                )
                : '';
            ////console.log(dateNow);

            let h = dateNow.getHours();
            let m = dateNow.getMinutes();

            let preFlightTime =
                ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
            return preFlightTime;
        } catch {
            return '00:00';
        }


    }

    getNextFlighttee(k: number, index: number, items) {
        let startingHoleOption: any;
        startingHoleOption = items.startingHole;

        if (startingHoleOption == '1') {
            // items.tee = 1;
            return 1;
        } else if (startingHoleOption == '10') {
            // items.tee = 10;
            return 10;
        } else if (startingHoleOption == '1_10') {
            if (index == 0 || index % 2 == 0) {
                // items.tee = 1;
                return 1;
            } else {
                // items.tee = 10;
                return 10;
            }
        }
    }
    changeRound(item) {
        // console.log("Selected value: " + item.value);

        this.flightRound = item.round;
        this.activeRound = item.round;
        this.roundFlights = [];
        this.selectedMembers = [];

        this.getSelectedPlayers();

    }

    isAllSelected() {
        ////console.log(this.dataSource);
        if (this.dataSources) {
            const numSelected = this.selection.selected.length;
            const numRows = this.dataSources.data.length;
            return numSelected === numRows;
        }
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.selection.clear();
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: Player): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }

    updateCategorySelection(event, row) {
        //console.log(this.selection.isSelected(row));
        let status = false;

        if (typeof event.checked !== 'undefined')
            status = event.checked ? true : false;
        else {
            //console.log(this.selection.isSelected(row));
            status = this.selection.isSelected(row) ? false : true;
        }
        this.showCategory = true;
        this.countCategoryMember(status, row);

        //console.log(this.categoryCounts);
    }

    countCategoryMember(status, row) {
        let founded = this.categoryCounts.filter((a) => {
            return a.name == row['player'].playerCategory;
        });
        //console.log(founded);

        if (status) {
            if (founded.length > 0) {
                founded[0].value = founded[0].value + 1;
            } else {
                let obj = {
                    name: row['player'].playerCategory,
                    value: 1,
                };
                this.categoryCounts.push(obj);
            }
        } else {
            if (founded.length > 0) {
                status
                    ? (founded[0].value = founded[0].value - 1)
                    : (founded[0].value = founded[0].value - 1);
                //console.log(this.categoryCounts);
            }
        }
    }
    public trackByFn(item: any, index: number) {
        return item.id || index;
    }

    toggleFlightSelection(flightIndex: number) {
        const indexInSelected = this.selectedFlights.indexOf(flightIndex);
        if (indexInSelected > -1) {
            this.selectedFlights.splice(indexInSelected, 1);
            // Deselect all players in this flight
            this.selectedPlayers = this.selectedPlayers.filter(p => p.flightIndex !== flightIndex);
        } else {
            this.selectedFlights.push(flightIndex);
            // Select all players in this flight
            this.selectedMembers[flightIndex].forEach((player, playerIndex) => {
                if (typeof player === 'object' && player !== null) {
                    this.selectedPlayers.push({ flightIndex, playerIndex });
                }
            });
        }
        this.updateSwapButtonVisibility();
    }

    isFlightSelected(flightIndex: number): boolean {
        return this.selectedFlights.includes(flightIndex);
    }

    togglePlayerSelection(flightIndex: number, playerIndex: number) {
        const playerIdentifier = { flightIndex, playerIndex };
        const indexInSelected = this.selectedPlayers.findIndex(p =>
            p.flightIndex === playerIdentifier.flightIndex && p.playerIndex === playerIdentifier.playerIndex
        );

        if (indexInSelected > -1) {
            this.selectedPlayers.splice(indexInSelected, 1);
        } else {
            this.selectedPlayers.push(playerIdentifier);
        }
        this.updateSwapButtonVisibility();
    }

    isPlayerSelected(flightIndex: number, playerIndex: number): boolean {
        return this.selectedPlayers.some(p => p.flightIndex === flightIndex && p.playerIndex === playerIndex);
    }

    updateSwapButtonVisibility() {
        this.showSwapFlightsButton = this.selectedFlights.length === 2;
        this.showSwapPlayersButton = this.selectedPlayers.length === 2 &&
            this.selectedPlayers[0].flightIndex !== this.selectedPlayers[1].flightIndex;
    }

    swapSelectedFlights() {
        if (this.selectedFlights.length === 2) {
            const [idx1, idx2] = this.selectedFlights;
            const tempFlight = this.selectedMembers[idx1];
            this.selectedMembers[idx1] = this.selectedMembers[idx2];
            this.selectedMembers[idx2] = tempFlight;

            // Optionally swap flight numbers for display purposes if they are part of the object
            const tempFlightNo = this.selectedMembers[idx1]['flightNo'];
            this.selectedMembers[idx1]['flightNo'] = this.selectedMembers[idx2]['flightNo'];
            this.selectedMembers[idx2]['flightNo'] = tempFlightNo;

            this.snackBar.open(
                `Flights ${this.selectedMembers[idx1]['flightNo']} and ${this.selectedMembers[idx2]['flightNo']} have been swapped successfully.`,
                'x',
                { duration: 5000 }
            );

            this.selectedFlights = [];
            this.selectedPlayers = []; // Clear player selections as well
            this.updateSwapButtonVisibility();
        } else {
            this.snackBar.open('Please select exactly two flights to swap.', 'x', { duration: 3000 });
        }
    }

    swapSelectedPlayers() {
        if (this.selectedPlayers.length === 2 &&
            this.selectedPlayers[0].flightIndex !== this.selectedPlayers[1].flightIndex) {

            const player1 = this.selectedMembers[this.selectedPlayers[0].flightIndex][this.selectedPlayers[0].playerIndex];
            const player2 = this.selectedMembers[this.selectedPlayers[1].flightIndex][this.selectedPlayers[1].playerIndex];

            // Perform the swap
            this.selectedMembers[this.selectedPlayers[0].flightIndex][this.selectedPlayers[0].playerIndex] = player2;
            this.selectedMembers[this.selectedPlayers[1].flightIndex][this.selectedPlayers[1].playerIndex] = player1;

            this.snackBar.open(
                `Players have been swapped successfully.`,
                'x',
                { duration: 5000 }
            );

            this.selectedFlights = []; // Clear flight selections as well
            this.selectedPlayers = [];
            this.updateSwapButtonVisibility();

        } else {
            this.snackBar.open('Please select exactly two players from different flights to swap.', 'x', { duration: 3000 });
        }
    }

    async deleteSelectedFlights() {
        if (this.selectedFlights.length === 0) {
            this.snackBar.open('Please select at least one flight to delete.', 'x', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to delete the selected flight(s)?',
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                const flightsToDeleteIds: string[] = [];
                const membersFromFlightsToRemove: string[] = [];
                const playersToRemove: string[] = [];

                for (const flightIndex of this.selectedFlights) {
                    const flight = this.selectedMembers[flightIndex];
                    if (flight && flight['id']) {
                        flightsToDeleteIds.push(flight['id']);

                        // Also gather members within these flights to remove them
                        for (const member of flight) {
                            if (member && member['id']) {
                                playersToRemove.push(member['id']);
                                membersFromFlightsToRemove.push(flight['id']);
                            }
                        }
                    }
                }

                try {
                    const success = await this.facadeService.DeleteFlightsAndMembers(
                        flightsToDeleteIds,
                        membersFromFlightsToRemove,
                        playersToRemove
                    );

                    if (success) {
                        this.snackBar.open('Selected flight(s) and their members have been deleted successfully.', 'x', { duration: 5000 });
                        this.selectedFlights = [];
                        this.selectedPlayers = [];
                        this.updateSwapButtonVisibility();
                        // this.getSelectedPlayers(); // Refresh the flights
                        flightsToDeleteIds.forEach((id) => this.deleteEmptyFlight(id, 1));
                    } else {
                        this.snackBar.open('Failed to delete selected flight(s).', 'x', { duration: 5000 });
                    }
                } catch (error) {
                    this.logger.log('Deleting selected flights failed', 'error', error.toString());
                    this.snackBar.open('An error occurred while deleting flights.', 'x', { duration: 5000 });
                }
            } else {
                this.snackBar.open('Flight deletion cancelled.', 'x', { duration: 3000 });
            }
        });
    }

    getSelectedPlayers() {
        try {

            this.selectedMembers = [];
            this.changeDetection.detectChanges();
            if (this.tournamentInfo[0].FlightManagerQLi.length > 0) {
                if (this.flightRound == 0) {
                    this.roundFlights = this.tournamentInfo[0].FlightManagerQLi;
                } else {
                    this.roundFlights =
                        this.tournamentInfo[0].FlightManagerQLi.filter((a) => {
                            return a.flightRound == this.flightRound;
                        });
                }

                let outer = 0;

                for (let index in this.roundFlights) {
                    //console.log(this.roundFlights);

                    ////console.log(outer + "<--->" + cnter);

                    let cnter = 0;
                    this.selectedMembers[outer] = [];

                    this.selectedMembers[outer]['id'] = this.roundFlights[index].id;
                    if (this.showTeams) {
                        this.selectedMembers[this.selectedMembers.length - 1][
                            'firstName'
                        ] = this.roundFlights[index]['FlightName'].name;
                    }
                    this.selectedMembers[outer]['tournamentId'] =
                        this.roundFlights[index].tournamentId;
                    this.selectedMembers[outer]['time'] =
                        this.roundFlights[index].time;
                    this.selectedMembers[outer]['startingHole'] =
                        this.roundFlights[index].startingHole;
                    this.selectedMembers[outer]['tee'] =
                        this.roundFlights[index].tee;
                    this.selectedMembers[outer]['tee_id'] =
                        this.roundFlights[index].tee_id;
                    this.selectedMembers[outer]['flightNo'] =
                        this.roundFlights[index].flightNo;
                    this.selectedMembers[outer]['categoryRound'] =
                        this.roundFlights[index].categoryRound;

                    if (this.roundFlights[index].MembersQL.length > 0)
                        this.selectedMembers[outer][cnter] =
                            this.roundFlights[index].MembersQL;

                    for (let member of this.roundFlights[index].MembersQL) {
                        const player: Player = {
                            ...member.PlayerQL,                 // copy player data
                            handicap: member.playingHandicap
                        };

                        this.selectedMembers[outer][cnter] = player;
                        cnter++;
                    }

                    outer++;
                }
            }

            //console.log(this.selectedMembers);
            ////console.log(this.groups);
        } catch (error) {
            this.logger.log('Making Tournament Flights Data Failed', "error", error.toString());
        }
    }

    OnChange($event, i: number, j: number) {
        // //console.log(i);
        // //console.log(j);
        // //console.log($event.checked);
        // this.selectedMembers[i][j]["attendance"] = $event.checked;
    }

    async saveFlights() {

        try {

            this.logger.log('Saving Tournaments Flights Data', "info");
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            let tournamentFlights: Flight[] = [];
            let flightName: any[] = [];
            let flightsToRemove: string[] = [];
            let tournamentTeamOpponents: any[] = [];
            let tournamentPairs: any[];
            let flightMembersToRemove: string[] = [];
            let membersFromFlightToRemove: string[] = [];
            let flightMembersToSave: any[] = [];
            let tournamentFlightMembers: FlightMembers[];
            let fcnter = 0;
            let runningFlightcounter = 0;
            this.copyScoreInfo = [];
            let createPairs: boolean = false;

            const roundKey = this.activeRound == 1 ? 'pointsFormat' : `pointsFormat${this.activeRound}`;

            const format = this.tournamentInfo[0]?.pointsFormats?.[roundKey] ?? null;

            // console.log("Format:", format);
            if (format == matchFormat.GREENSOME || format == matchFormat.FOURSOME) {
                createPairs = true;
            }
            ////console.log(this.selectedMembers);
            ////console.log(this.roundFlights);

            for (let index in this.selectedMembers) {
                tournamentFlightMembers = [];
                tournamentPairs = [];

                for (let index2 in this.selectedMembers[index]) {
                    if (Number.isInteger(Number(index2))) {
                        if (!this.playerTee) {
                            let roundTeeId: any = General.getPlayersTe(
                                this.selectedMembers[index][index2].playerCategory
                                    ? this.selectedMembers[index][index2]
                                        .playerCategory
                                    : 'AMATEURS'
                            );

                            let FM: any = {
                                playerId: this.selectedMembers[index][index2].id,
                                flightId: this.selectedMembers[index]['id'],
                                attendance: this.selectedMembers[index][index2][
                                    'attendance'
                                ]
                                    ? this.selectedMembers[index][index2][
                                    'attendance'
                                    ]
                                    : false,
                                playingTee: roundTeeId?.result
                                    ? roundTeeId?.result
                                    : 'AMATEURS',
                                tee_id: roundTeeId?.id ?? '1',
                            };

                            const existsInPairs = tournamentPairs.some(p =>
                                p.member1Id === FM.playerId || p.member2Id === FM.playerId
                            );

                            if (this.showMatchPlay && this.check(tournamentTeamOpponents, FM.playerId)) {

                                let team1Id = this.getTeamId(FM.playerId);
                                let { oppoentId, opponentTeamId } = this.findOpponentFlightWise(team1Id, tournamentTeamOpponents, this.selectedMembers[index])
                                if (team1Id != opponentTeamId) {
                                    let teamOpponent = {
                                        id: UniqueIdGenerator.generate(),
                                        team1Id: team1Id,
                                        team2Id: opponentTeamId,
                                        team1MemberId: FM.playerId,
                                        team2MemberId: oppoentId,
                                        tournamentId: this.tournamentID,
                                    }
                                    tournamentTeamOpponents.push(teamOpponent);
                                }

                            }

                            if (createPairs && !existsInPairs) {
                                let nextMember = this.getTeamMemberInFlight(this.selectedMembers[index], FM.playerId)
                                let pair = {
                                    id: UniqueIdGenerator.generate(),
                                    tournamentId: this.tournamentID,
                                    pairName: 'Pair',
                                    member1Id: FM.playerId,
                                    member2Id: nextMember.id,
                                };
                                tournamentPairs.push(pair);
                            }
                            tournamentFlightMembers.push(FM);
                            flightMembersToSave.push(FM);
                        } else if (this.selectedMembers[index][index2].id) {
                            let FM: any = {
                                playerId: this.selectedMembers[index][index2].id,
                                flightId: this.selectedMembers[index]['id'],
                                attendance: this.selectedMembers[index][index2][
                                    'attendance'
                                ]
                                    ? this.selectedMembers[index][index2][
                                    'attendance'
                                    ]
                                    : false,
                                playingTee: this.selectedMembers[index][index2]
                                    .playingTee
                                    ? this.selectedMembers[index][index2].playingTee
                                    : 'AMATEURS',
                                tee_id: this.selectedMembers[index][index2].tee_id,
                            };
                            tournamentFlightMembers.push(FM);
                            flightMembersToSave.push(FM);
                        }

                    }
                }

                ////console.log(this.selectedMembers[index].length);
                fcnter++;
                if (this.selectedMembers[index].length > 0) {
                    runningFlightcounter++;
                    // //console.log(tournamentFlightMembers);

                    // let startingHole = parseFloat(
                    //     (<HTMLInputElement>(
                    //         document.getElementById('flight_' + index + '_hole')
                    //     )).value
                    // );
                    // let startTime: string = (<HTMLInputElement>(
                    //     document.getElementById('flight_' + index + '_time')
                    // )).value;

                    // let flightNumber = parseFloat(
                    //     (<HTMLInputElement>(
                    //         document.getElementById('flight_' + index + '_number')
                    //     )).value

                    // );
                    // let categoryFlight = parseFloat(
                    //     (<HTMLInputElement>(
                    //         document.getElementById('flight_' + index + '_catnumber')
                    //     )).value
                    // );

                    if (this.showTeams) {
                        // this.teamName = (<HTMLInputElement>(
                        //     document.getElementById('flight_' + index + '_name')
                        // )).value;
                        this.teamName = this.selectedMembers[index]['firstName'];
                    }
                    //console.log(this.teamName);



                    //let stTime: Time;
                    //stTime.hours = 9;
                    //stTime.minutes = 0;


                    let roundFlightData = this.roundFlights.filter((a) => {
                        return (
                            a.flightRound == this.flightRound &&
                            a.id == this.selectedMembers[index]['id']
                        );
                    });


                    //console.log(roundFlightData);
                    //console.log(this.selectedMembers[index]);

                    let currentFlightId: string;

                    if (roundFlightData && roundFlightData.length > 0)
                        currentFlightId =
                            roundFlightData.length > 0
                                ? roundFlightData[0].id
                                : UniqueIdGenerator.generate();
                    else if (this.selectedMembers[index]['id'])
                        currentFlightId = this.selectedMembers[index]['id']
                            ? this.selectedMembers[index]['id']
                            : UniqueIdGenerator.generate();

                    let flight: any = {
                        id: currentFlightId,
                        tournamentId: this.tournamentID,
                        courseId:
                            roundFlightData.length > 0
                                ? roundFlightData[0].courseId
                                : this.tournamentInfo[0].courseId,
                        adminId:
                            roundFlightData.length > 0
                                ? roundFlightData[0].adminId
                                : this.tournamentInfo[0].adminId,
                        courseHoleSets:
                            roundFlightData.length > 0
                                ? roundFlightData[0].courseHoleSets
                                : 3,
                        flightNo: this.selectedMembers[index]['flightNo'],
                        categoryRound: 1,
                        flightRound: this.flightRound,
                        startingHole: this.selectedMembers[index]['startingHole'],
                        tee:
                            roundFlightData.length > 0
                                ? roundFlightData[0].tee
                                : 'AMATEURS',
                        tee_id:
                            roundFlightData.length > 0
                                ? roundFlightData[0].tee_id
                                : '1',
                        date:
                            roundFlightData.length > 0
                                ? roundFlightData[0].date
                                : this.tournamentInfo[0].startDate,
                        time: this.selectedMembers[index]['time'],
                        ended: false,
                        team: {
                            data: tournamentTeamOpponents,
                        }, pairs: {
                            data: tournamentPairs,
                        },
                    };
                    tournamentTeamOpponents = [];
                    if (this.showTeams) {
                        let flightNames: any = {
                            flightId: currentFlightId,
                            name: this.teamName,
                        };

                        flightName.push(flightNames);
                    }
                    //console.log(flight);
                    tournamentFlights.push(flight);

                    //console.log(tournamentFlights);

                    //break;
                    //console.log(roundFlightData.length);

                    let oldMembers: any;

                    if (roundFlightData && roundFlightData.length > 0) {
                        if (roundFlightData[0].MembersQL) {
                            oldMembers = roundFlightData[0].MembersQL;
                        } else {
                            oldMembers = roundFlightData[0];
                        }
                    } else oldMembers = [];

                    //console.log(oldMembers);
                    //   for (let ids of oldMembers) {
                    //   let FM: any = {
                    //     playerId: ids.playerId,
                    //     flightId: currentFlightId,
                    //     attendance: false,
                    //     playingTee: ids.playingTee,
                    //     tee_id: ids.tee_id,
                    //   };
                    //   flightMembersToSave.push(FM);
                    // }
                    //console.log(tournamentFlightMembers);

                    //console.log(flightMembersToSave);

                    let removed = oldMembers.filter(
                        (n) =>
                            !tournamentFlightMembers.some(
                                (n2) => n.playerId == n2.playerId
                            )
                    );
                    //console.log(removed);

                    for (let ids of removed) {
                        flightMembersToRemove.push(ids.playerId);
                        membersFromFlightToRemove.push(currentFlightId);

                        let newFlight: any = this.selectedMembers.filter((n) =>
                            n.some((n2) => n2.id == ids.playerId)
                        );

                        //console.log(newFlight);
                        //console.log(newFlight.length);

                        //if(newFlight.length > 0) {
                        let copy: any = {
                            playerId: ids.playerId,
                            fromFlight: currentFlightId,
                            toFlight:
                                newFlight.length > 0
                                    ? newFlight[0].id
                                    : currentFlightId,
                        };

                        this.copyScoreInfo.push(copy);
                        //}
                    }

                    // let added = tournamentFlightMembers.filter(
                    //   (n) => !oldMembers.some((n2) => n.playerId == n2.playerId)
                    // );
                    // //console.log(added);

                    // if (added.length > 0) {
                    //   for (let ids of added) {
                    //     let FM: any = {
                    //       playerId: ids.playerId,
                    //       flightId: currentFlightId,
                    //       attendance: false,
                    //       playingTee: ids.playingTee,
                    //       tee_id: ids.tee_id,
                    //     };

                    //     flightMembersToSave.push(FM);
                    //     //console.log(flightMembersToSave);
                    //  }
                    //}
                    //break;
                } else {
                    ////console.log("deleting");
                    ////console.log(this.roundFlights);
                    let roundFlightData = this.roundFlights.filter((a) => {
                        return (
                            a.flightRound == this.flightRound &&
                            a.id == this.selectedMembers[index]['id']
                        );
                    });
                    ////console.log(roundFlightData);
                    if (roundFlightData.length > 0) {
                        let oldMembers: any = roundFlightData[0].MembersQL;
                        // //console.log(oldMembers);

                        for (let ids of oldMembers) {
                            flightMembersToRemove.push(ids.playerId);
                            membersFromFlightToRemove.push(roundFlightData[0].id);
                        }

                        //for(let ids of oldMembers) {
                        //flightMembersToRemove.push(ids.playerId);
                        //}

                        flightsToRemove.push(roundFlightData[0].id);
                    }
                    //fcnter--;
                }
            }

            //console.log(this.tournamentInfo[0].id);
            //console.log(flightsToRemove);
            //console.log(flightName);

            //console.log(flightMembersToRemove);
            //console.log(tournamentFlights);
            //console.log(flightMembersToSave);
            //console.log(membersFromFlightToRemove);
            //console.log(this.copyScoreInfo);
            let save: boolean;
            if (this.showTeams == true) {
                //console.log(true);

                save = <boolean>(
                    await this.facadeService.SaveTournamentFlightforTaxes(
                        this.tournamentInfo[0].id,
                        flightName,
                        tournamentFlights,
                        flightMembersToSave
                    )
                );
            } else {
                //console.log(false);

                save = <boolean>(
                    await this.facadeService.SaveTournamentFlight(
                        this.tournamentInfo[0].id,
                        tournamentFlights,
                        flightMembersToSave
                    )
                );
            }
            this.newFlights = [];
            this.addFlightNum = 0;
            this.importedFlightsNum = 0;
            this.importedFlights = false;

            for (let copy of this.copyScoreInfo) {
                await this.facadeService.copyPlayerScore(
                    copy.playerId,
                    copy.fromFlight,
                    copy.toFlight
                );
            }

            let update = <boolean>(
                await this.facadeService.DeleteFlightsAndMembers(
                    flightsToRemove,
                    membersFromFlightToRemove,
                    flightMembersToRemove
                )
            );
            //console.log(save);
            //console.log(update);

            if (save && update) {
                this.snackBar.open(
                    'Flights have been saved and updated successfully.',
                    'x',
                    {
                        duration: 5000,
                    }
                );
            } else if (save && !update) {
                this.snackBar.open('Something Went Wrong.', 'x', {
                    duration: 5000,
                });
            } else {
                this.snackBar.open('Something Went Wrong.', 'x', {
                    duration: 5000,
                });
            }

            let dataFullTournament = await this.facadeService.getTournamentsFlights(
                this.tournamentID
            );
            this.tournamentInfo = dataFullTournament.TournamentQL;

            this.roundFlights = this.tournamentInfo[0].FlightManagerQLi.filter(
                (a) => {
                    return a.flightRound == this.flightRound;
                }
            );
        } catch (error) {
            this.logger.log('Saving Tournaments Data Failed', "error", error.toString());
        }
        ////console.log(tournamentFlights);
    }
    async saveTournamentMembers() {
        let tournamentmember: TournamentMember[] = [];
        let counter: number;
        let DelplayerIndex: any;
        let DelplayerInfo: any;
        let selectionArray = Object.assign({}, this.selection.selected);

        for (let index in selectionArray) {
            if (selectionArray[index]) {
                let founded = this.tournamentMember.filter((a) => {
                    return a.playerId == selectionArray[index]['player'].id;
                });

                if (founded.length == 0) {
                    //this.tournamentMember.push(selectionArray[index]);

                    let obj = {
                        fullName: selectionArray[index]['player']['fullName'],
                        player: {
                            firstName:
                                selectionArray[index]['player']['firstName'],
                            id: selectionArray[index]['player']['id'],
                            handicap:
                                selectionArray[index]['player']['handicap'],
                            lastName:
                                selectionArray[index]['player']['lastName'],
                            playerCategory:
                                selectionArray[index]['player'][
                                'playerCategory'
                                ],
                        },
                        playerId: selectionArray[index]['player']['id'],
                        tournamentId: this.tournamentID,
                        status: false,
                    };
                    //console.log(obj);
                    this.tournamentMember.push(obj);

                    let member: any = {
                        tournamentId: this.tournamentID,
                        playerId: selectionArray[index]['player'].id,
                        status: true,
                    };
                    tournamentmember.push(member);
                }
                counter = parseInt(index) + 1;
                //console.log(counter);

                //console.log(selectionArray);
            }
        }
        this.showCategory = false;
        ////console.log(this.categoryCounts[0]);

        //this.categoryCounts[0].value = this.categoryCounts[0].value - counter;
        ////console.log(this.categoryCounts[0].value);

        //console.log(tournamentmember);

        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentmember)
        );

        if (result) {
            this.snackBar.open('Tournament members have been saved.', 'x', {
                duration: 5000,
            });
            this.syncTournamentMembers();
            this.syncClubMembers();

            this.masterToggle();
        }
    }

    async saveSingleFlight(flightData: any, flightNo: number) {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        let tournamentFlights: Flight[] = [];
        let flightName: any[] = [];
        let flightsToRemove: string[] = [];
        let flightMembersToRemove: string[] = [];
        let membersFromFlightToRemove: string[] = [];
        let flightMembersToSave: FlightMembers[] = [];
        let tournamentFlightMembers: FlightMembers[];
        let fcnter = flightNo;
        let runningFlightcounter = flightNo;
        this.copyScoreInfo = [];

        ////console.log(this.selectedMembers);
        ////console.log(flightData);

        for (let index in flightData) {
            tournamentFlightMembers = [];

            for (let index2 in flightData[index]) {
                if (Number.isInteger(Number(index2))) {
                    let roundTeeId: any = General.getPlayersTe(
                        flightData[index][index2].playerCategory
                    );

                    let FM: any = {
                        playerId: flightData[index][index2].id,
                        attendance: flightData[index][index2]['attendance'],
                        playingTee: roundTeeId.result,
                        tee_id: roundTeeId.id,
                    };

                    tournamentFlightMembers.push(FM);
                }
            }

            ////console.log(flightData[index].length);
            fcnter++;
            if (flightData[index].length > 0) {
                runningFlightcounter++;
                ////console.log(tournamentFlightMembers);

                // let startingHole = parseFloat(
                //     (<HTMLInputElement>(
                //         document.getElementById('flight_' + flightNo + '_hole')
                //     )).value
                // );
                // let startTime: string = (<HTMLInputElement>(
                //     document.getElementById('flight_' + flightNo + '_time')
                // )).value;

                // let name: string = (<HTMLInputElement>(
                //     document.getElementById('flight_' + flightNo + '_name')
                // )).value;

                //let stTime: Time;
                //stTime.hours = 9;
                //stTime.minutes = 0;

                let roundFlightData = this.roundFlights.filter((a) => {
                    return (
                        a.flightRound == this.flightRound &&
                        a.flightNo == fcnter
                    );
                });

                ////console.log(roundFlightData);
                ////console.log(this.selectedMembers[index]);

                let currentFlightId: string;

                if (roundFlightData && roundFlightData.length > 0)
                    currentFlightId =
                        roundFlightData.length > 0
                            ? roundFlightData[0].id
                            : UniqueIdGenerator.generate();
                else if (this.selectedMembers[index]['id'])
                    currentFlightId = this.selectedMembers[index]['id']
                        ? this.selectedMembers[index]['id']
                        : UniqueIdGenerator.generate();

                let flight: any = {
                    id: currentFlightId,
                    tournamentId: this.tournamentInfo[0].id,
                    courseId:
                        roundFlightData.length > 0
                            ? roundFlightData[0].courseId
                            : this.tournamentInfo[0].courseId,
                    adminId:
                        roundFlightData.length > 0
                            ? roundFlightData[0].adminId
                            : this.tournamentInfo[0].adminId,
                    courseHoleSets:
                        roundFlightData.length > 0
                            ? roundFlightData[0].courseHoleSets
                            : 0,
                    flightNo: runningFlightcounter,
                    flightRound: this.flightRound,
                    startingHole: flightData[index]['startingHole'],
                    tee:
                        roundFlightData.length > 0
                            ? roundFlightData[0].tee
                            : 'AMATEURS',
                    date:
                        roundFlightData.length > 0
                            ? roundFlightData[0].date
                            : this.tournamentInfo[0].startDate,
                    time: flightData[index]['time'],
                    ended: false,
                };

                let flightNames: any = {
                    flightId: currentFlightId,
                    name: name,
                };
                ////console.log(flight);
                tournamentFlights.push(flight);
                flightName.push(flightNames);
                //break;
                ////console.log(roundFlightData.length);

                let oldMembers: any;

                if (roundFlightData && roundFlightData.length > 0) {
                    oldMembers = roundFlightData[0].MembersQL;
                } else oldMembers = [];

                // //console.log(oldMembers);
                // //console.log(tournamentFlightMembers);

                let removed = oldMembers.filter(
                    (n) =>
                        !tournamentFlightMembers.some(
                            (n2) => n.playerId == n2.playerId
                        )
                );
                ////console.log(removed);

                for (let ids of removed) {
                    flightMembersToRemove.push(ids.playerId);
                    membersFromFlightToRemove.push(currentFlightId);

                    let newFlight: any = this.selectedMembers.filter((n) =>
                        n.some((n2) => n2.id == ids.playerId)
                    );
                    ////console.log(newFlight);

                    if (newFlight.length > 0) {
                        let copy: any = {
                            playerId: ids.playerId,
                            fromFlight: currentFlightId,
                            toFlight: newFlight[0].id,
                        };

                        this.copyScoreInfo.push(copy);
                    }
                }

                let added = tournamentFlightMembers.filter(
                    (n) => !oldMembers.some((n2) => n.playerId == n2.playerId)
                );
                ////console.log(added);

                for (let ids of added) {
                    let FM: any = {
                        playerId: ids.playerId,
                        flightId: currentFlightId,
                        attendance: ids.attendance,
                    };

                    flightMembersToSave.push(FM);
                }

                //break;
            } else {
                ////console.log("deleting");
                ////console.log(this.roundFlights);
                let roundFlightData = this.roundFlights.filter((a) => {
                    return (
                        a.flightRound == this.flightRound &&
                        a.flightNo == fcnter
                    );
                });
                ////console.log(roundFlightData);
                if (roundFlightData.length > 0) {
                    let oldMembers: any = roundFlightData[0].MembersQL;
                    ////console.log(oldMembers);

                    for (let ids of oldMembers) {
                        flightMembersToRemove.push(ids.playerId);
                        membersFromFlightToRemove.push(roundFlightData[0].id);
                    }

                    //for(let ids of oldMembers) {
                    //flightMembersToRemove.push(ids.playerId);
                    //}

                    flightsToRemove.push(roundFlightData[0].id);
                }
                //fcnter--;
            }
        }

        // //console.log(this.tournamentInfo.id);
        // //console.log(flightsToRemove);
        // //console.log(flightMembersToRemove);
        // //console.log(tournamentFlights);
        // //console.log(flightMembersToSave);

        //this.facadeService.SaveTournamentFlights(this.tournamentInfo.id, flightsToRemove, membersFromFlightToRemove, flightMembersToRemove, tournamentFlights, flightMembersToSave);
        let save: boolean;
        if (this.showTeams) {
            save = <boolean>(
                await this.facadeService.SaveTournamentFlightforTaxes(
                    this.tournamentInfo[0].id,
                    flightName,
                    tournamentFlights,

                    flightMembersToSave
                )
            );
        } else {
            save = <boolean>await this.facadeService.SaveTournamentFlight(
                this.tournamentInfo[0].id,
                tournamentFlights,

                flightMembersToSave
            );
        }
        this.newFlights = [];

        for (let copy of this.copyScoreInfo) {
            await this.facadeService.copyPlayerScore(
                copy.playerId,
                copy.fromFlight,
                copy.toFlight
            );
        }

        await this.facadeService.DeleteFlightsAndMembers(
            flightsToRemove,
            membersFromFlightToRemove,
            flightMembersToRemove
        );

        let dataFullTournament = await this.facadeService.getTournamentsFlights(
            this.tournamentID
        );
        this.tournamentInfo = dataFullTournament.TournamentQL;

        this.roundFlights = this.tournamentInfo[0].FlightManagerQLi.filter(
            (a) => {
                return a.flightRound == this.flightRound;
            }
        );

        this.snackBar.open('Flights have been saved successfully.', 'x', {
            duration: 5000,
        });

        ////console.log(tournamentFlights);
    }

    getTeamId(playerId) {
        if (this.tournamentInfo[0].teams.length > 0) {
            let playerTeamId;
            for (let data of this.tournamentInfo[0].teams) {
                data.teamMembers.forEach(element => {
                    if (element.playerId == playerId) {
                        playerTeamId = data.id;
                    }
                });
            }
            return playerTeamId;
        }
    }

    findOpponentFlightWise(teamId, tournamentTeamOpponents, members) {

        let oppoentId;
        let opponentTeamId;
        for (let data of members) {
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                opponentTeamId = this.getTeamId(data.id);
                if (opponentTeamId != teamId && this.check(tournamentTeamOpponents, data.id)) {
                    oppoentId = data.id;
                    continue;
                }
            }
        }
        return { oppoentId, opponentTeamId };

    }

    getTeamMemberInFlight(members, playerId) {
        if (!members || members.length === 0) return null;

        // 1. Get current player’s Team ID
        const teamId = this.getTeamId(playerId);
        if (!teamId) return null;

        // 2. Find another member in the flight with the SAME teamId
        for (let m of members) {
            if (typeof m === 'object') {
                if (m.id !== playerId) {
                    const memberTeamId = this.getTeamId(m.id);
                    if (memberTeamId === teamId) {
                        return m; // Found teammate in the same flight
                    }
                }

            }
        }

        return null; // No teammate found
    }

    check(tournamentTeamOpponents, playerId) {

        let boolean = true;
        tournamentTeamOpponents.forEach(element => {
            if (element.team1MemberId == playerId || element.team2MemberId == playerId) {
                boolean = false;
            }
        });
        return boolean;
    }
    deleteEmptyFlight(id, index) {
        //console.log(id);
        //console.log(index);
        //console.log(this.selectedMembers);
        let find = this.selectedMembers.find((a) => {
            return a['id'] == id;
        });
        //console.log(find);
        //console.log(this.selectedMembers.indexOf(find));
        let num = this.selectedMembers.indexOf(find);
        if (num != undefined) {
            this.selectedMembers.splice(num, 1);
        }
    }



    editFlight(id, index) {
        //console.log(index);
        try {



            this.logger.log('Add New member to flight', "info", id);

            let TM = [];
            for (let obj of this.tournamentMember) {
                let teamColor = this.getTeamColor(obj.playerId);
                //Check that the obj is not in all selectedMembers just

                let existsInSelectedMembers = this.selectedMembers.some((members) => members.some((member) => member.id == obj.playerId));
                if (existsInSelectedMembers) {
                    continue;
                }

                obj.player = {
                    ...obj.player,
                    teamColor
                }
                TM.push(obj.player);
            }

            const dialogRef = this.dialog.open(DialogAddMemberComponent, {
                data: {
                    id: id,
                    members: TM,
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result.length > 0) {
                    for (let obj of result) {
                        this.exist = this.selectedMembers.find((item) =>
                            item.some((f) => f.id == obj.id)
                        );
                        if (this.exist) {
                            this.snackBar.open(
                                'Player already exist in the list.',
                                'x',
                                {
                                    duration: 5000,
                                }
                            );

                            return;
                        } else {
                            this.selectedMembers[index].push(obj);
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.log('Getting Tournaments DataAdd New member to flight Failed', "error", error.toString());
        }
    }
    addFlight(index: any) {
        //const dialogRef = this.dialog.open(DialogPlayerScoreComponent, {
        ////console.log(this.selectedMembers.length);
        // //console.log(this.selectedMembers);
        // this._viewTournamentComponent.getTournamentMembers();
        // this._viewTournamentComponent.createFlight(index);
        // this._viewTournamentComponent.matDrawer.open();
        this.logger.log('Add New Flight', "info");
        this.selectedMembers[this.selectedMembers.length] = [];
        this.selectedMembers[this.selectedMembers.length - 1]['id'] =
            UniqueIdGenerator.generate();
        this.selectedMembers[this.selectedMembers.length - 1]['time'] = '09:00';
        this.selectedMembers[this.selectedMembers.length - 1]['firstName'] =
            'Team Name';
        this.selectedMembers[this.selectedMembers.length - 1]['adminId'] = this
            .roundFlights.length
            ? this.roundFlights[0]['adminId']
            : this.tournamentInfo[0].adminId;
        this.selectedMembers[this.selectedMembers.length - 1][
            'courseHoleSets'
        ] = this.roundFlights.length
                ? this.roundFlights[0]['courseHoleSets']
                : this.tournamentInfo[0].courseHoleSets;
        this.selectedMembers[this.selectedMembers.length - 1][
            'courseHoleSetsInverted'
        ] = this.roundFlights.length
                ? this.roundFlights[0]['courseHoleSetsInverted']
                : this.tournamentInfo[0].courseHoleSetsInverted;
        this.selectedMembers[this.selectedMembers.length - 1]['courseId'] = this
            .roundFlights.length
            ? this.roundFlights[0]['courseId']
            : this.tournamentInfo[0].courseId;
        this.selectedMembers[this.selectedMembers.length - 1]['tournamentId'] =
            this.roundFlights.length
                ? this.roundFlights[0]['tournamentId']
                : this.tournamentInfo[0].id;
        this.selectedMembers[this.selectedMembers.length - 1]['startingHole'] =
            '1';
        this.selectedMembers[this.selectedMembers.length - 1]['tee'] =
            'AMATEURS';
        this.selectedMembers[this.selectedMembers.length - 1]['flightRound'] =
            this.flightRound;
        this.selectedMembers[this.selectedMembers.length - 1]['categoryRound'] =
            this.flightRound;
        this.selectedMembers[this.selectedMembers.length - 1]['date'] = this
            .roundFlights.length
            ? this.roundFlights[0]['date']
            : this.tournamentInfo[0].startDate;
        this.selectedMembers[this.selectedMembers.length - 1]['flightNo'] = this
            .selectedMembers.length
            ? this.selectedMembers.length
            : 1;
        this.selectedMembers[this.selectedMembers.length - 1]['tee_id'] = '1';

        //this.newFlight.push(this.selectedMembers[this.selectedMembers.length - 1]);
        ////console.log(this.newFlight.id);
        this.newFlights[this.addFlightNum] =
            this.selectedMembers[this.selectedMembers.length - 1];
        //console.log(this.newFlights[this.addFlightNum]);
        this.addFlightNum++;
        ////console.log(this.selectedMembers.length);
        //this.selectedMembers[this.selectedMembers.length - 1].push(player);
        ////console.log(this.selectedMembers);
    }

    saveFlight(index: number) {
        ////console.log(index);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to save group ' + (index + 1) + '?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log(this.selectedMembers[index]);
                let singleFlight: any[] = [];
                singleFlight.push(this.selectedMembers[index]);
                this.saveSingleFlight(singleFlight, index);
                //this.selectedMembers.splice(index, 1);
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    addExistingPlayer() {
        let tournamentMember: TournamentMember[] = [];
        const dialogRef = this.dialog.open(DialogPlayerComponent, {
            width: '900px',
            data: {
                flights: this.selectedMembers.length,
                tournament: this.tournamentID,
            },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            //console.log(result);
            let lookup = [];

            if (result) {
                //console.log('record deleted.');
                for (let i in result) {
                    this.exist = this.selectedMembers.find((item) =>
                        item.some((f) => f.id == result[i].player.id)
                    );
                }
                if (this.exist) {
                    this.snackBar.open(
                        'Player already exist in the list.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );

                    return;
                }

                this.newPlayers = [];
                for (let m of result) {
                    let obj = {
                        fullName: m.player['fullName'],
                        player: {
                            firstName: m.player['firstName'],
                            id: m.player['id'],
                            handicap: m.player['handicap'],
                            lastName: m.player['lastName'],
                            playerCategory: m.player['playerCategory'],
                        },
                        playerId: m.player['id'],
                        tournamentId: this.tournamentID,
                        status: false,
                    };
                    //console.log(obj);
                    this.tournamentMember.push(obj);

                    let objs: Player = {
                        id: m.player['id'],
                        adminClubId: m.player['adminClubId']
                            ? m.player['adminClubId']
                            : null,
                        firebaseUid: m.player['firebaseUid']
                            ? m.player['firebaseUid']
                            : null,
                        fcmToken: m.player['fcmToken']
                            ? m.player['fcmToken']
                            : null,
                        gemId: m.player['gemId'] ? m.player['gemId'] : null,
                        firstName: m.player['firstName']
                            ? m.player['firstName']
                            : null,
                        lastName: m.player['lastName']
                            ? m.player['lastName']
                            : null,
                        gender: m.player['gender'] ? m.player['gender'] : null,
                        dob: m.player['dob'] ? m.player['dob'] : null,
                        picture: m.player['picture']
                            ? m.player['picture']
                            : null,
                        email: m.player['email'] ? m.player['email'] : null,
                        phone: m.player['phone'] ? m.player['phone'] : null,
                        playerCategory: m.player['playerCategory']
                            ? m.player['playerCategory']
                            : null,
                        handicap: m.player['handicap']
                            ? m.player['handicap']
                            : null,
                        online: false,
                        countryCode: m.player['countryCode']
                            ? m.player['countryCode']
                            : null,
                        extraData: m.player['extraData']
                            ? m.player['extraData']
                            : null,
                        userRole: m.player['userRole']
                            ? m.player['userRole']
                            : null,
                        membershipNumber: m.player['membershipNumber']
                            ? m.player['membershipNumber']
                            : null,
                        membership: [],
                    };
                    this.newPlayers.push(objs);
                }
                //console.log(this.newPlayers);

                for (let i of result) {
                    let member: any = {
                        tournamentId: this.tournamentID,
                        playerId: i.player['id'],
                        status: true,
                    };
                    tournamentMember.push(member);
                }

                let results = <any>(
                    await this.facadeService.insertTournamentMember(
                        tournamentMember
                    )
                );

                if (results) {
                    this.snackBar.open(
                        'Tournament members have been saved.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );
                    this.syncTournamentMembers();
                }

                if (result[0].flight != 10000) {
                    ////console.log(this.selectedMembers[result[0].flight]);
                    //console.log(result[0].flight);

                    this.selectedMembers[result[0].flight - 1].splice(
                        this.selectedMembers[result[0].flight - 1].length,
                        0,
                        ...this.newPlayers
                    );
                }
                //console.log(this.selectedMembers);
            } else {
                ////console.log("cancel delete action");
            }
        });
    }
    selectedTee(event, playerId) {
        //console.log(playerId);
        let target = event.source.selected._element.nativeElement;
        let selectedData = {
            value: event.value,
            text: target.innerText.trim(),
        };
        //console.log(this.roundFlights);
        if (this.roundFlights) {
            let roundTeeId: any = General.getPlayersTe(selectedData.text);
            for (let index in this.roundFlights) {
                if (this.roundFlights[index].id === playerId) {
                    this.roundFlights[index].tee = selectedData.value;
                    this.roundFlights[index].tee_id = roundTeeId.id;
                }
            }
        }

        let roundTeeId: any = General.getPlayersTe(selectedData.text);
        for (let index = 0; index < this.addFlightNum; index++) {
            if (this.newFlights && this.newFlights[index]['id'] == playerId) {
                this.newFlights[index]['tee'] = selectedData.value;
                this.newFlights[index]['tee_id'] = roundTeeId.id;
                this.roundFlights.push(this.newFlights[index]);
                //console.log(this.newFlights[index]);
                //console.log(this.roundFlights);
            }
        }
        if (this.importedFlights == true) {
            let roundTeeId: any = General.getPlayersTe(selectedData.text);
            for (let index = 0; index < this.importedFlightsNum; index++) {
                if (this.newFlights[index]['id'] == playerId) {
                    this.newFlights[index]['tee'] = selectedData.value;
                    this.newFlights[index]['tee_id'] = roundTeeId.id;
                    this.roundFlights.push(this.newFlights[index]);
                    //console.log(this.newFlights[index]);
                    //console.log(this.roundFlights);
                    return;
                }
            }
        }
    }
    selectedPlayerTee(event, playerId) {
        //console.log(playerId);
        let target = event.source.selected._element.nativeElement;
        let selectedData = {
            value: event.value,
            text: target.innerText.trim(),
        };
        //console.log(selectedData);
        //console.log(this.selectedMembers);
        let roundTeeId: any = General.getPlayersTe(selectedData.text);
        for (let index in this.selectedMembers) {
            for (let index2 in this.selectedMembers[index]) {
                if (this.selectedMembers[index][index2].id == playerId) {
                    this.selectedMembers[index][index2].playingTee =
                        selectedData.value;
                    this.selectedMembers[index][index2].tee_id = roundTeeId.id;
                    //console.log(this.selectedMembers[index][index2]);
                    this.playerTee = true;
                }
            }
        }
    }

    addPlayer(id, index) {
        const dialogRef = this.dialog.open(DialogAddPlayerComponent, {
            data: {
                flights: this.selectedMembers.length,
                tournamentID: this.tournamentID
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                console.log(result);
                this.selectedMembers[index].push(result);
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    removePlayer(flight: number, player: number) {
        ////console.log(flight + "<- ->" + player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to remove this player from group?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                this.selectedMembers[flight].splice(player, 1);
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    movePlayer(flight: number, cplayer: number) {
        //console.log(flight + '<- ->' + cplayer);
        let player: Player = this.selectedMembers[flight][cplayer];
        const dialogRef = this.dialog.open(DialogMoveFlightComponent, {
            width: '350px',
            panelClass: 'transparent',
            disableClose: true,
            data: {
                flights: this.selectedMembers.length,
                name: player.firstName + ' ' + player.lastName,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                //console.log(result);
                //let player: Player = this.selectedMembers[flight][cplayer];
                ////console.log(player);
                this.selectedMembers[flight].splice(cplayer, 1);
                ////console.log(this.selectedMembers);
                this.selectedMembers[result - 1].splice(
                    this.selectedMembers[result - 1].length - 3,
                    0,
                    player
                );
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    moveTournamentMember(player: Player) {
        const dialogRef = this.dialog.open(DialogMoveFlightComponent, {
            width: '350px',
            panelClass: 'transparent',
            disableClose: true,
            data: {
                flights: this.selectedMembers.length,
                name: player.firstName + ' ' + player.lastName,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                let exist = this.selectedMembers.find((item) =>
                    item.some((f) => f.id == player.id)
                );
                if (exist) {
                    this.snackBar.open(
                        'Player already exist in the list.',
                        'x',
                        {
                            duration: 5000,
                        }
                    );

                    return;
                }

                //let player: Player = this.selectedMembers[flight][cplayer];
                ////console.log(player);
                ////console.log(this.selectedMembers);
                this.selectedMembers[result - 1].splice(
                    this.selectedMembers[result - 1].length - 3,
                    0,
                    player
                );
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    onFileChange(event) {
        //console.log(event.target.files.length);
        if (event.target.files.length > 0) {
            this.file = event.target.files[0];

            //console.log(this.file);
        }
    }

    parseFlightsData() {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            this.arrayBuffer = fileReader.result;
            let data = new Uint8Array(this.arrayBuffer);
            let arr = new Array();
            for (let i = 0; i != data.length; ++i)
                arr[i] = String.fromCharCode(data[i]);
            let bstr = arr.join('');
            let workbook = read(bstr, { type: 'binary' });
            let first_sheet_name = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[first_sheet_name];
            this.flightsData = utils.sheet_to_json(worksheet, {
                raw: true,
                defval: '',
            });

            //console.log(this.flightsData);
            this.importExcelData();
            //this.providerservice.importexcel(this.exceljsondata).subscribe(data=>{
            //})
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    async importExcelData() {
        //console.log(this.flightsData);
        let tournamentMember: TournamentMember[] = [];
        let index = 0;
        for (let flight of this.flightsData) {
            let player = await this.facadeService.getPlayerByMembershipNumber(
                flight.membershipNumber + ''
            );
            //console.log(player);

            if (player.length == 0) {
                player = await this.facadeService.getPlayerByPhone(
                    flight.phone + ''
                );
            }

            if (player.length > 5) {
                //console.log(flight.membershipNumber);
                continue;
            }
            ////console.log(flight.membershipNumber);
            let roundTeeId: any = General.getPlayersTe(flight.tee);
            if (!this.showTeams) {
                if (flight.flightNo > this.selectedMembers.length) {
                    this.selectedMembers[this.selectedMembers.length] = [];
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'id'
                    ] = UniqueIdGenerator.generate();
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'time'
                    ] = flight.time;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'startingHole'
                    ] = flight.startingHole;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'flightRound'
                    ] = flight.flightRound
                            ? flight.flightRound
                            : this.flightRound;

                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee_id'
                    ] = roundTeeId.id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'date'
                    ] = flight.date
                            ? flight.date
                            : this.tournamentInfo[0][0].startDate;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee'
                    ] = '';
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'flightNo'
                    ] = this.selectedMembers.length
                            ? this.selectedMembers.length
                            : 1;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tournamentId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['tournamentId']
                            : this.tournamentInfo[0].id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'adminId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['adminId']
                            : this.tournamentInfo[0].adminId;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSets'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSets']
                            : this.tournamentInfo[0].courseHoleSets;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSetsInverted'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSetsInverted']
                            : this.tournamentInfo[0].courseHoleSetsInverted;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseId']
                            : this.tournamentInfo[0][0].courseId;
                }
                this.selectedMembers[flight.flightNo - 1].splice(
                    this.selectedMembers[flight.flightNo - 1].length - 3,
                    0,
                    player[0]
                );
                this.selectedMembers[flight.flightNo - 1]['time'] = flight.time;
                this.selectedMembers[flight.flightNo - 1]['startingHole'] =
                    flight.startingHole;
                this.selectedMembers[this.selectedMembers.length - 1][
                    'flightRound'
                ] = flight.flightRound ? flight.flightRound : this.flightRound;

                this.selectedMembers[this.selectedMembers.length - 1][
                    'tee_id'
                ] = roundTeeId.id;
                this.selectedMembers[this.selectedMembers.length - 1]['tee'] =
                    '';
                (this.selectedMembers[this.selectedMembers.length - 1]['date'] =
                    flight.date
                        ? flight.date
                        : this.tournamentInfo[0].startDate),
                    (this.selectedMembers[this.selectedMembers.length - 1][
                        'flightNo'
                    ] = this.selectedMembers.length
                            ? this.selectedMembers.length
                            : 1);
                this.selectedMembers[this.selectedMembers.length - 1][
                    'tournamentId'
                ] = this.roundFlights.length
                        ? this.roundFlights[0]['tournamentId']
                        : this.tournamentInfo[0].id;
                this.selectedMembers[this.selectedMembers.length - 1][
                    'adminId'
                ] = this.roundFlights.length
                        ? this.roundFlights[0]['adminId']
                        : this.tournamentInfo[0].adminId;
                this.selectedMembers[this.selectedMembers.length - 1][
                    'courseHoleSets'
                ] = this.roundFlights.length
                        ? this.roundFlights[0]['courseHoleSets']
                        : this.tournamentInfo[0].courseHoleSets;
                this.selectedMembers[this.selectedMembers.length - 1][
                    'courseHoleSetsInverted'
                ] = this.roundFlights.length
                        ? this.roundFlights[0]['courseHoleSetsInverted']
                        : this.tournamentInfo[0].courseHoleSetsInverted;
                this.selectedMembers[this.selectedMembers.length - 1][
                    'courseId'
                ] = this.roundFlights.length
                        ? this.roundFlights[0]['courseId']
                        : this.tournamentInfo[0].courseId;
                this.newFlights[index] =
                    this.selectedMembers[this.selectedMembers.length - 1];
                index++;
                this.importedFlights = true;
                this.importedFlightsNum++;
                //console.log(this.newFlights[index]);
            } else {
                if (flight.teamNo > this.selectedMembers.length) {
                    this.selectedMembers[this.selectedMembers.length] = [];
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'id'
                    ] = UniqueIdGenerator.generate();
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'time'
                    ] = flight.time;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'startingHole'
                    ] = flight.startingHole;
                    // this.selectedMembers[this.selectedMembers.length - 1]["flightRound"] =
                    //   flight.flightRound ? flight.flightRound : this.flightRound;

                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee_id'
                    ] = roundTeeId.id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'firstName'
                    ] = flight.teamName;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'date'
                    ] = flight.date
                            ? flight.date
                            : this.tournamentInfo[0].startDate;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee'
                    ] = '';
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'flightNo'
                    ] = this.selectedMembers.length
                            ? this.selectedMembers.length
                            : 1;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tournamentId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['tournamentId']
                            : this.tournamentInfo[0].id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'adminId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['adminId']
                            : this.tournamentInfo[0].adminId;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSets'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSets']
                            : this.tournamentInfo[0].courseHoleSets;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSetsInverted'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSetsInverted']
                            : this.tournamentInfo[0].courseHoleSetsInverted;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseId']
                            : this.tournamentInfo[0].courseId;
                }
                {
                    this.selectedMembers[flight.teamNo - 1].splice(
                        this.selectedMembers[flight.teamNo - 1].length - 3,
                        0,
                        player[0]
                    );
                    this.selectedMembers[flight.teamNo - 1]['time'] =
                        flight.time;
                    this.selectedMembers[flight.teamNo - 1]['startingHole'] =
                        flight.startingHole;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'flightRound'
                    ] = flight.flightRound
                            ? flight.flightRound
                            : this.flightRound;

                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee_id'
                    ] = roundTeeId.id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'firstName'
                    ] = flight.teamName;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tee'
                    ] = '';
                    (this.selectedMembers[this.selectedMembers.length - 1][
                        'date'
                    ] = flight.date
                            ? flight.date
                            : this.tournamentInfo[0].startDate),
                        (this.selectedMembers[this.selectedMembers.length - 1][
                            'flightNo'
                        ] = this.selectedMembers.length
                                ? this.selectedMembers.length
                                : 1);
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'tournamentId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['tournamentId']
                            : this.tournamentInfo[0].id;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'adminId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['adminId']
                            : this.tournamentInfo[0].adminId;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSets'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSets']
                            : this.tournamentInfo[0].courseHoleSets;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseHoleSetsInverted'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseHoleSetsInverted']
                            : this.tournamentInfo[0].courseHoleSetsInverted;
                    this.selectedMembers[this.selectedMembers.length - 1][
                        'courseId'
                    ] = this.roundFlights.length
                            ? this.roundFlights[0]['courseId']
                            : this.tournamentInfo[0].courseId;
                    this.newFlights[index] =
                        this.selectedMembers[this.selectedMembers.length - 1];

                    this.importedFlights = true;
                    this.importedFlightsNum++;
                    //console.log(this.newFlights[index]);
                    //console.log(player);
                    index++;
                }
            }
            //console.log(player);

            let find: boolean = true;
            if (this.tournamentMember.length > 0) {
                for (let member of this.tournamentMember) {
                    if (member.playerId != player[0].id) {
                        find = false;
                    }
                }

                if (!find) {
                    let obj = {
                        fullName: player[0]['fullName'],
                        player: {
                            firstName: player[0]['firstName'],
                            id: player[0]['id'],
                            handicap: player[0]['handicap'],
                            lastName: player[0]['lastName'],
                            playerCategory: player[0]['playerCategory'],
                        },
                        playerId: player[0]['id'],
                        tournamentId: this.tournamentID,
                        status: false,
                    };
                    let member: any = {
                        tournamentId: this.tournamentID,
                        playerId: player[0]['id'],
                        status: true,
                    };
                    this.tournamentMember.push(obj);
                    tournamentMember.push(member);
                }
            } else {
                let obj = {
                    fullName: player[0]['fullName'],
                    player: {
                        firstName: player[0]['firstName'],
                        id: player[0]['id'],
                        handicap: player[0]['handicap'],
                        lastName: player[0]['lastName'],
                        playerCategory: player[0]['playerCategory'],
                    },
                    playerId: player[0]['id'],
                    tournamentId: this.tournamentID,
                    status: false,
                };
                let member: any = {
                    tournamentId: this.tournamentID,
                    playerId: player[0]['id'],
                    status: true,
                };
                this.tournamentMember.push(obj);
                tournamentMember.push(member);
            }
        }
        if (tournamentMember.length > 0) {
            let results = <any>(
                await this.facadeService.insertTournamentMember(
                    tournamentMember
                )
            );

            if (results) {
                this.snackBar.open(
                    'Tournament members from Files have been saved.',
                    'x',
                    {
                        duration: 5000,
                    }
                );
                this.syncTournamentMembers();
            }
        }
        //console.log(this.importedFlightsNum);
        //console.log(this.newFlights);

        //console.log(this.selectedMembers);
    }

    redirectToScores() {
        this.router.navigate(['/matchplay/' + this.tournamentID]);
    }

    redirectToDetail() {
        this.router.navigate(['/tournaments/view/' + this.tournamentID]);
    }
    redirectToAttendance() {
        this.router.navigate(['/tournaments/attendance/' + this.tournamentID]);
    }
}
