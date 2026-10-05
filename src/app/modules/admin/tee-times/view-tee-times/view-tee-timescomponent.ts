import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
    Input,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import {
    Player,
    TournamentMemberStatus,
    UserSessionModel,
    enumPlayerCategory,
} from '../../../../shared/models/player.model';
import { TeeTime } from '../../../../shared/models/teetime.model';
//import { Score } from '../../shared/models/score.model';
import { Hole } from '../../../../shared/models/hole.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    FormArray,
    FormControl,
    FormBuilder,
    Validators,
    FormGroup,
} from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    Constants,
    handicapAllocation,
    UniqueIdGenerator,
} from '../../../../shared/classes/general';
import {
    TournamentRounds,
    Tournament,
    AddDailyRound,
} from '../../../../shared/models/tournament.model';
//import { Score } from '../../shared/classes/score';
import { Score, ScoreDetail } from '../../../../shared/models/score.model';
import { DatePipe } from '@angular/common';
import { General } from '../../../../shared/classes/general';
import { LogsService } from '../../../../shared/services/logs.service';

import { of } from 'rxjs';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { DialogChangeCourseHoleSetComponent } from '../../dialogs/dialog-change-course-hole-set/dialog-change-course-hole-set.component';
import { HandicapService } from 'app/shared/services/handicap.service';
import { forEach } from 'lodash';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { DialogPlayerListComponent } from '../../dialogs/dialog-player-list-flight/dialog-player-list.component';
import { MatSelectChange } from '@angular/material/select';
import { DialogAddGuestComponent } from '../../dialogs/dialog-add-guest/dialog-add-guest.component';
// import { DialogChangeCourseHoleSetComponent } from "../../material-components/dialog-change-course-hole-set/dialog-change-course-hole-set.component";
// import { DialogOverviewComponent } from "../../material-components/dialog-overview/dialog-overview.component";
@Component({
    standalone: false,
    selector: 'app-view-tee-times',
    templateUrl: './view-tee-times.component.html',
    styleUrls: ['./view-tee-times.component.scss'],
})
export class ViewTeeTimeComponent implements OnInit {
    memberStatusesQLs: TournamentMemberStatus[] = [];
    Leaderboard: any;
    private noOfHolesInCourse: number = 18;
    activeRound: number;
    totalRounds: number;
    flightRound: number;
    fPlayer: any[] = [];
    isLoading: boolean = false;
    showResult: boolean = false;
    tRounds: TournamentRounds[] = [];
    roundFlights: any[] = [];
    matchFormat: string;
    teamMatch: boolean;
    selectedSubTournament: string;
    subTournamentDetail: any[] = [];
    loggedInUser: UserSessionModel;
    players: Player;
    activePlayers: Player[] = [];
    playerScores: Score[];
    allMatchResults: any[] = [];
    allLeadersGross: any[] = [];
    allLeadersCutOffGross: any[] = [];
    allLeadersCutOffNet: any[] = [];
    allLeadersNet: any[] = [];
    grossLeaders: any[] = [];
    netLeaders: any[] = [];
    grossAllLeaders: any[] = [];
    netAllLeaders: any[] = [];
    findex = 0;
    selectedCategory: any;
    selectedCategoryValue: string = '';
    upperCategoryLimit: boolean = false;
    showPairs: boolean;
    fDate: string;
    allRoundGrossScore: boolean = true;
    allRoundNetScore: boolean;
    allRoundCutOff: boolean = false;
    allRoundCutOffNet: boolean = false;
    cuttOffScore: number = 0;
    leaderGrossQL: any;
    leaderNetQL: any;
    selectedMembers: Player[][] = [];
    runningFlights: number = 0;
    isClubAdmin: boolean = false;
    isGross: boolean;
    isNet: boolean;
    lastActiveTab = 1;
    fName: any;
    fArray: any[] = [];
    cutOffList: any;
    clubItems: Promise<TeeTime[]>;
    noItemsInList = false;
    dailyRounds: any = [];
    myPlayer: TeeTime;
    scheduleForm: FormGroup;
    refresh: boolean = false;
    minDate: Date;
    maxDate: Date;
    startingHole: string;
    startTime: string;
    RoundDate: string;
    currentDate: string;
    singleRound: any[] = [];
    roundSlots: string[] = [];
    file: File;
    arrayBuffer: any;
    playersData: any;
    savePlayers: TeeTime[] = [];
    duplicatePlayers: any[] = [];
    matchPlayData: any[] = [];
    matchPlayDataFixed: any[] = [];
    ddSelectedFlight: string = '0';
    copyTeeTimes: any[] = [];
    currentHoleSet: string;
    courseHoleSetNames;
    courseHoleSetNamesDisplay;
    selectedCourseHoleSet: string = '8_false';
    customDate: any;
    customDate2: any;
    customValue: boolean;
    showtable: boolean = true;
    calculateHandicap: boolean = false;
    dailyData: any;
    allRoundData;
    public starterForm: FormGroup;
    routeDate: any;
    duplicateIds: string[] = [];

    dailyStats: any[] = [];

    //scoreHeader: any[] = [];
    tournamentID: string;
    filterPlayer: string = '';
    coursesList: any[] = [];
    selectedCourse: string = '';
    courseHoleSet: number = 0;
    flightMembers: FlightMembers[] = [];
    playerTees: Map<string, any> = new Map<string, any>();
    flightPlayers: any[] = [];
    filters: FormGroup;
    contactList: FormArray;
    dailyDate: any;

    dataSource: MatTableDataSource<any>;
    public response: any;
    teeTimes: any[] = [];
    courseData: any[] = [];
    allScores: any[] = [];
    playerName: string;
    Dvalue: Date;
    flightCourseHoleSets: Map<string, any> = new Map<string, any>();
    flightCourseTees: Map<String, any> = new Map<string, any>();
    //scoreHeader: any[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('fileInput') fileInputVariable: ElementRef;
    index: number = 0;
    pageIndex: number = 0;
    lenght: any;
    pageSize: number = 20;
    categories = [{ id: 0, title: 'All' }, { id: 1, title: 'Empty' }, { id: 2, title: 'Partail' }, { id: 3, title: 'Completed' }]
    displayedColumns = [
        'firstName',
        'lastName',
        'email',
        'handicap',
        'action',
    ];

    constructor(
        private datePipe: DatePipe,
        private location: Router,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private handicapService: HandicapService,
        private router: Router,
        private route: ActivatedRoute,
        private apollo: Apollo,
        private _formBuilder: FormBuilder, private _fuseConfirmationService: FuseConfirmationService,
        public dialog: MatDialog,
        private logger: LogsService, private _localStorage: LocalStorageService
    ) { }

    ngOnInit() {
        try {
            this.logger.log('Admin Come to View Tee Time Page', "info");

            this.showtable = false;
            this.showResult = false;
            this.isLoading = true;

            this.loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);

            // this.dailyRounds = [];
            this.filters = this._formBuilder.group({
                name: [null, Validators.compose([Validators.required])],
            });
            this.route.paramMap.subscribe((params) => {
                this.routeDate = params.get('id');
            });
            this.logger.log('Getting View Tee Time Data By Date', "info", this.routeDate);

            //console.log(this.routeDate);

            of(this.dailyRounds)
                .pipe()
                .subscribe(
                    async (data) => {
                        this.getTeeTime(this.routeDate);
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {
            this.logger.log('Getting View Tee Time Data Failed', "error", error.toString());

        }
    }

    async getTeeTime(date) {
        this.flightMembers = [];
        this.isLoading = true;
        let dataPlayers: any;
        this.teeTimes = [];
        let club: any = this.loggedInUser.clubId;
        let courseId = this.loggedInUser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
        this.getSelectedCourse(courseId ? courseId : '-LUFS3FCQKOGpJ2IEHmf');
        //console.log(this.loggedInUser);
        if (this._localStorage.isClubAdmin()) {
            dataPlayers = await this.facadeService.getTeeTimesSlots(
                this.loggedInUser.adminClubId,
                date
            );
        } else {
            dataPlayers = await this.facadeService.getTeeTimesSlotsAdmin(
                date
            );
        }
        let newDate = General.parseToDate(date);
        //console.log(newDate);
        this.fDate = newDate.toString().substring(0, 16);
        console.log(dataPlayers);
        if (dataPlayers?.TournamentsQL?.length) {

            this.teeTimes = [];

            for (let tournament of dataPlayers.TournamentsQL) {

                for (let slot of tournament.slots) {

                    let membersTable = new MatTableDataSource(
                        this.getMembers(slot.FlightsQL)
                    );

                    membersTable.paginator = this.paginator;
                    membersTable.sort = this.sort;

                    let teeTimeObj = {
                        id: slot.id,
                        title: 'Tee-' + slot.startingHole,
                        slotTime: this.convertToAMPMFormat(slot.slotTime),
                        slotTimes: slot.slotTime,
                        joinedMembers: slot.joinedMembers,
                        members: membersTable.data.length > 0 ? membersTable : undefined,
                        flightId: slot.flightId,
                        noOfPlayers: tournament.noOfPlayers,
                        status: this.getStatus(
                            tournament.noOfPlayers,
                            slot.joinedMembers
                        ),
                        courseHoleSets: slot.courseHoleSets,
                        noOfHoles: slot.noOfHoles,
                        startingHole: slot.startingHole,
                        available: slot.available,
                        admin: slot?.FlightsQL?.admin?.fullName ?? '',
                        courseHoleSetsInverted: slot.courseHoleSetsInverted,
                        displayName: this.getSelectedHoleSet(
                            slot.courseHoleSets,
                            slot.courseHoleSetsInverted
                        ),

                        // Optional: add tournament info
                        tournamentId: tournament.id,
                        tournamentName: tournament.name
                    };

                    this.teeTimes.push(teeTimeObj);
                }
            }

            this.teeTimes.sort((a, b) => {

                const timeA = new Date(`1970-01-01T${a.slotTimes}:00`);
                const timeB = new Date(`1970-01-01T${b.slotTimes}:00`);

                if (timeA.getTime() !== timeB.getTime()) {
                    return timeA.getTime() - timeB.getTime();
                }

                if (a.courseHoleSets < b.courseHoleSets) return -1;
                if (a.courseHoleSets > b.courseHoleSets) return 1;

                return 0;
            });

            this.copyTeeTimes = [...this.teeTimes];

            console.log(this.teeTimes);
        }
        this.logger.log('Getting View Tee Time Data Successfull', "info", { date: date, slots: this.teeTimes.length });
    }

    async addGuest(item) {
        this.logger.log('Admin Click on Add Guest in View Tee Time Page, Dialog Open', "info", { slotId: item?.id, flightId: item?.flightId });


        const dialogRef = this.dialog.open(DialogAddGuestComponent);
        dialogRef.afterClosed().subscribe(async (result) => {
            console.log(result);
            if (!result) {
                this.logger.log('Add Guest Dialog cancelled on View Tee Time Page', "info", item?.id);
            }
            if (result) {
                this.logger.log('Add Guest Dialog confirmed on View Tee Time Page', "info", { slotId: item?.id, guestName: result.firstName + ' ' + result.lastName });
                let guest: any = {
                    flightId: item.flightId,
                    guestId: UniqueIdGenerator.generate(),
                    name: result.firstName + ' ' + result.lastName,
                    handicap: result.handicap,
                    email: result.email,
                    firstName: result.firstName,
                    lastName: result.lastName,
                };
                let count = item.joinedMembers + 1;
                if (!item.flightId) {
                    this.createTournament(item, [guest], true);
                } else {
                    let result = <any>await this.facadeService.insertFlightGuest(item.id, [guest], count);
                    console.log(result);
                    if (result) {
                        this.logger.log('Guest added to Tee Time Slot successfully', "info", { slotId: item?.id, guestId: guest.guestId });
                        let members = [];
                        item.joinedMembers = Number(count);
                        members.push(guest)
                        if (item.members) {
                            item.members.data = [...item.members.data, ...members];
                        } else {
                            item.members = new MatTableDataSource(members);
                        }
                        item.members._updateChangeSubscription();
                    }
                }

            }

        })
    }

    getSelectedCourse(course) {
        this.facadeService
            .getCourseHoleSets(course)
            .subscribe((selectedCourseHoleSet) => {
                //console.log(selectedCourseHoleSet);
                if (selectedCourseHoleSet.course_hole_sets.length > 0) {
                    //console.log(selectedCourseHoleSet);

                    this.courseHoleSetNames =
                        selectedCourseHoleSet.course_hole_sets.filter(
                            (holeSet) => holeSet.isActive == true
                        );
                    this.courseHoleSetNames.unshift({ holeSets: 0, inverted: false, displayName: 'All' });
                    this.selectedCourseHoleSet = this.courseHoleSetNames[0]
                    //this.showCourseHole = true;
                } else {
                    //this.showCourseHole = false;
                }
            });
    }

    getSelectedHoleSet(holeSet, inverted) {
        const name = this.courseHoleSetNames.find((holes) => {
            return holes.holeSets == (holeSet) && holes.inverted == inverted;
        });
        return name?.displayName;
    }
    getStatus(noOfPlayers, joinedMembers) {
        if (joinedMembers == 0) {
            return 'Empty';
        } else if (joinedMembers < noOfPlayers) {
            return 'Partial';
        } else {
            return 'Completed';
        }
    }

    getMembers(flight: any): any {
        const members: any[] = [];
        if (flight) {
            flight?.MembersQL.forEach(member => {
                let mem = {
                    id: member.playerId,
                    firstName: member.PlayerQL.firstName,
                    lastName: member.PlayerQL.lastName,
                    email: member.PlayerQL.email,
                    handicap: member.PlayerQL.handicap,
                    guest: false,
                }
                members.push(mem)
            });
            flight?.guest.forEach(member => {
                let mem = {
                    id: member.guestId,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    email: member.email,
                    handicap: member.handicap,
                    guest: true,
                }
                members.push(mem)
            });
            console.log(members);
            return members
        } else {
            return members
        }
    }
    filterByCategory(event: MatSelectChange): void {
        this.logger.log('Admin filter by Category on View Tee Time Page', "info", event.value);

        const filterOption = event.value;

        switch (filterOption) {
            case 0:
                // Show all events
                this.teeTimes = this.copyTeeTimes;
                break;

            case 1:

                this.teeTimes = this.copyTeeTimes.filter(event =>
                    (event.joinedMembers) == 0
                );
                break;

            case 2:
                // Show only events that have ended
                this.teeTimes = this.copyTeeTimes.filter(event =>
                    (event.joinedMembers) > 0
                );
                break;

            case 3:
                // Show only upcoming events
                const upcomingDate = new Date();
                this.teeTimes = this.copyTeeTimes.filter(event =>
                    (event.joinedMembers) == 4
                );
                break;

            default:
                break;
        }
    }
    filterByHoleSet(event: MatSelectChange): void {
        this.logger.log('Admin filter by Hole Set on View Tee Time Page', "info", event.value?.displayName);
        const filterOption = event.value;
        if (event.value.displayName == 'All') {
            this.teeTimes = this.copyTeeTimes;
        } else {
            this.teeTimes = this.copyTeeTimes.filter(event =>
                (event.courseHoleSets) == filterOption.holeSets && event.courseHoleSetsInverted == filterOption.inverted
            );
        }
    }

    hideResult() {
        this.logger.log('Admin Click on Back to list in View Tee Time Page', "info");
        this.router.navigate(['/teetimes']);

    }
    applyFilter(query: string) {
        if (query.length > 2) {
            this.teeTimes = this.teeTimes.filter((teeTime) => {
                // Check if the title matches the query
                if (teeTime.title.toLowerCase().includes(query.toLowerCase())) {
                    return true;
                }
                if (teeTime.members) {
                    // Check if any member in the MatTableDataSource matches the query
                    const filteredMembers = teeTime?.members.data.filter((member) =>
                        Object.values(member).some((val) =>
                            val.toString().toLowerCase().includes(query.toLowerCase())
                        )
                    );
                    // filterValue = filterValue.trim(); // Remove whitespace
                    // filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
                    // //console.log(this.dataSource);
                    // this.dataSource.filter = filterValue;
                    // If any member matches the query, include the teeTime
                    return filteredMembers.length > 0;
                }
            });
        } else if (query === '') {
            // Reset the filter if the query is empty
            this.teeTimes = this.copyTeeTimes;
        }
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
    async openAddPlayersDialog(item: any) {
        this.logger.log('Admin Click on Add Player in View Tee Time Page', "info", { slotId: item?.id, flightId: item?.flightId });
        console.log(item);

        let datas = await this.facadeService.getPlayersListForTournament(
            this.loggedInUser.adminClubId
        );
        const dialogRef = this.dialog.open(DialogPlayerListComponent, {
            data: { players: datas.player },
        });

        // Handle dialog close or dismiss if needed
        dialogRef.afterClosed().subscribe(result => {
            console.log(result);
            if (!result) {
                this.logger.log('Add Player Dialog cancelled on View Tee Time Page', "info", item?.id);
            }
            if (result) {
                let membersCount = Object.keys(result).length;
                this.logger.log('Add Player Dialog confirmed on View Tee Time Page', "info", { slotId: item?.id, selectedPlayers: membersCount });
                let flag: boolean = this.checkMembersCount(membersCount, item?.noOfPlayers);
                // if (flag) {
                for (var index in result) {
                    let member: any = {
                        playerId: result[index].id,
                        attendance: false,
                    };
                    this.flightMembers.push(member);
                    let playerTee = result[index].playerCategory;
                    if (playerTee == 'Senior Amateurs') {
                        playerTee = 'Seniors';
                    }
                    result[index]['playingTee'] = playerTee.toUpperCase();
                    let selectedData = {
                        value: result[index]['playingTee'],
                        text: result[index]['playingTee'],
                    };
                    this.playerTees.set(result[index].id, selectedData);
                }
                if (!item.flightId) {
                    this.createTournament(item, result, false);
                } else {
                    this.insertFlightMember(item, this.flightMembers, result);
                }
                // } else {
                //     this.snackBar.open(
                //         "Incorrect number of members selected. Please choose the correct count."
                //         ,
                //         'x',
                //         {
                //             duration: 5000,
                //         }
                //     );

                //     return;
                // }
            }
            console.log('The dialog was closed');
        });
    }

    async createTournament(item, players, guestCheck) {
        this.logger.log('Creating Round for Tee Time Slot', "info", { slotId: item?.id, guest: guestCheck });

        let courseId = this.loggedInUser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
        // starterFormValue.roundDate = this.datepipe.transform(
        //   starterFormValue.roundDate.toString(),
        //   'yyyy-MM-dd'
        // );

        for (let member of this.flightMembers) {
            let founded = await this.facadeService.getPlayerTodayRound(
                member.playerId,
                this.routeDate
            );
            if (founded && founded.length > 0) {
                this.logger.log('Creating Round for Tee Time Slot stopped, Player already played in a round today', "warn", member.playerId);
                this.snackBar.open(
                    'Player already played in a round today.',
                    'x',
                    {
                        duration: 5000,
                    }
                );
                this.flightMembers = [];
                return;
            }
        }

        let tournamentFlights: Flight[] = [];
        let fcnter = 0;
        let roundMembers: any[] = [];
        let guests: any[] = [];

        if (!guestCheck) {
            for (let member of this.flightMembers) {
                let playerTee: any = this.playerTees.get(member.playerId);
                //console.log(playerTee);
                let Tee;
                if (playerTee == undefined) {
                    Tee = 'AMATEURS';
                }
                let playerTeeId: any = General.getCourseTeeId(Tee);
                let playerTeeName = playerTee
                    ? playerTee.value
                    : Tee;
                let flightMember = {
                    playerId: member.playerId,
                    attendance: false,
                    playingTee: playerTeeName,
                    tee_id: General.getCourseTeeId(playerTeeName)
                        ? General.getCourseTeeId(playerTeeName).id
                        : 1,
                    guest: null,
                };
                //console.log(flightMember);

                roundMembers.push(flightMember);
            }
        }
        if (guestCheck) {
            for (let member of players) {
                let guest: any = {
                    guestId: UniqueIdGenerator.generate(),
                    name: 'Guest A',
                    handicap: '0',
                    email: '',
                    firstName: 'Guest',
                    lastName: 'A',
                };
                //console.log(flightMember);

                guests.push(guest);
            }
        }

        fcnter++;

        let roundTee = 'AMATEURS';
        let roundTeeId: any = General.getCourseTeeId(roundTee)
            ? General.getCourseTeeId(roundTee).id
            : 1;
        let flight: any = {
            id: UniqueIdGenerator.generate(),
            courseId: courseId ? courseId : '-LUFS3FCQKOGpJ2IEHmf',
            adminId: this.loggedInUser.id,
            courseHoleSets: item?.courseHoleSets ? item?.courseHoleSets : 3,
            flightNo: 1,
            flightRound: 0,
            startingHole: item?.startingHole,
            tee_id: roundTeeId,
            tee: roundTee,
            category: null,
            date: this.routeDate,
            time: item.slotTime,
            ended: false,
            courseHoleSetsInverted: item.courseHoleSetsInverted ? item.courseHoleSetsInverted : false,
            members: {
                data: roundMembers,
            },
            guest: {
                data: guests,
            },
        };

        //console.log(flight);
        tournamentFlights.push(flight);
        //console.log(tournamentFlights);

        let tournament: Tournament = {
            id: UniqueIdGenerator.generate(),
            clubId: this.loggedInUser.adminClubId,
            leagueId: null,
            courseId: courseId ? courseId : '-LUFS3FCQKOGpJ2IEHmf',
            adminId: this.loggedInUser.id,
            title:
                this.routeDate.toString().substring(0, 10) +
                ' ' +
                this.loggedInUser.club.name,
            prefix: null,
            courseHoleSets: item?.courseHoleSets ? item?.courseHoleSets : 3,
            teamMatch: false,
            pairsMatch: false,
            interLeague: false,
            publicTournament: false,
            confirmParticipants: false,
            noOfRounds: 1,
            activeRound: 1,
            playingOnWhs: true,
            matchFormat: 'STROKE_PLAY',
            pointsFormats: null,
            pointsValues: null,
            handicapAllocations: null,
            tee: roundTee,
            tee_id: roundTeeId,
            scoreManagement: 'ONLY_PLAYERS',
            startDate: this.routeDate,
            endDate: this.routeDate,
            flightsCategory: null,
            started: true,
            invited: false,
            singleRound: true,
            sponsorName: '',
            approved: false,
            sponsorLogo: '',
            mobileLogoUrl: '',
            webLogoUrl: '',
            createdAt: new Date(this.routeDate).toISOString(),
            courseHoleSetsInverted: item.courseHoleSetsInverted ? item.courseHoleSetsInverted : false,
            categories: [],
            marshals: [],
            flights: tournamentFlights,
            members: [],
        };

        //console.log(tournament);
        let count = item.joinedMembers + this.flightMembers.length;
        let result = <any>await this.facadeService.addTournament(tournament, flight.id, item.id, count);
        if (result) {
            this.logger.log('Round for Tee Time Slot created successfully', "info", { slotId: item?.id, tournamentId: tournament.id, flightId: flight.id });
            let members = [];
            item.joinedMembers = Number(count);
            for (var index in players) {
                let mem = {
                    id: players[index].id,
                    firstName: players[index].firstName,
                    lastName: players[index].lastName,
                    email: players[index].email,
                    handicap: players[index].handicap,
                    guest: guestCheck ? true : false
                }
                members.push(mem)
            }
            if (item.members) {
                item.members.data = [...item.members.data, ...members];
            } else {
                item.members = new MatTableDataSource(members);
            }
            this.getTeeTime(this.routeDate);
            item.members._updateChangeSubscription();
        }
    }

    async insertFlightMember(item, member, players) {
        this.logger.log('Adding Players to Tee Time Slot', "info", { slotId: item?.id, flightId: item?.flightId, players: this.flightMembers.length });
        let roundMembers: any[] = [];
        for (let member of this.flightMembers) {
            let founded = await this.facadeService.getPlayerTodayRound(
                member.playerId,
                this.routeDate
            );
            if (founded && founded.length > 0) {
                this.logger.log('Adding Players to Tee Time Slot stopped, Player already played in a round today', "warn", member.playerId);
                this.snackBar.open(
                    'Player already played in a round today.',
                    'x',
                    {
                        duration: 5000,
                    }
                );

                return;
            } else {
                let FM: any = {
                    playerId: member.playerId,
                    flightId: item.flightId,
                    attendance: false,
                };

                roundMembers.push(FM);
            }
        }
        let count = item.joinedMembers + this.flightMembers.length;
        let result = <any>await this.facadeService.insertFlightMembers(item.id, roundMembers, count);
        console.log(result);
        if (result) {
            this.logger.log('Players added to Tee Time Slot successfully', "info", { slotId: item?.id, flightId: item?.flightId, players: roundMembers.length });
            let members = [];
            item.joinedMembers = Number(count);
            for (var index in players) {
                let mem = {
                    id: players[index].id,
                    firstName: players[index].firstName,
                    lastName: players[index].lastName,
                    email: players[index].email,
                    handicap: players[index].handicap,
                }
                members.push(mem)
            }

            if (item.members) {
                item.members.data = [...item.members.data, ...members];
            } else {
                item.members = new MatTableDataSource(members);
            }
            this.getTeeTime(this.routeDate);
            item.members._updateChangeSubscription();
        }
    }
    deleteUser(item, slote: any) {
        this.logger.log('Admin Click on Delete User in View Tee Time Page, Confirmation Dialog Open', "info", { memberId: item?.id, slotId: slote?.id, guest: item?.guest });
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete member',
            message:
                'Are you sure you want to delete this member? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe(async (result) => {
            // If the confirm button pressed...
            if (result !== 'confirmed') {
                this.logger.log('Admin cancelled Delete User in View Tee Time Page', "info", item?.id);
            }
            if (result === 'confirmed') {
                this.logger.log('Admin confirmed Delete User in View Tee Time Page', "info", item?.id);
                const count = slote.joinedMembers - 1;
                if (!item.guest) {
                    let result = await this.facadeService.DeleteFlightMembers(slote.flightId, item.id, count);
                    if (result) {
                        this.logger.log('Member deleted from Tee Time Slot successfully', "info", { memberId: item.id, flightId: slote.flightId });
                        const slot = this.teeTimes.find((slots) => slots.id == slote.id);
                        slot.joinedMembers--;
                        const index = slote.members.data.findIndex(member => member.id === item.id);
                        // If the item is found, remove it from the array
                        if (index !== -1) {
                            slote.members.data.splice(index, 1);
                            // Update the data source
                            slote.members._updateChangeSubscription();
                        }
                    }
                } else {
                    let result = await this.facadeService.DeleteGuestMembers(slote.flightId, item.id, count);
                    if (result) {
                        this.logger.log('Guest deleted from Tee Time Slot successfully', "info", { guestId: item.id, flightId: slote.flightId });
                        const slot = this.teeTimes.find((slots) => slots.id == slote.id);
                        slot.joinedMembers--;
                        const index = slote.members.data.findIndex(member => member.id === item.id);
                        // If the item is found, remove it from the array
                        if (index !== -1) {
                            slote.members.data.splice(index, 1);
                            // Update the data source
                            slote.members._updateChangeSubscription();
                        }
                    }
                }
            }
        })
    }

    checkMembersCount(count, noOfPlayers): boolean {
        if (noOfPlayers == 2 && (count < 2 || count > 4)) {
            return false;
        } else if (noOfPlayers == 3 && (count < 3 || count > 4)) {
            return false;
        } else if (noOfPlayers == 4 && count !== 4) {
            return false;
        }
        return true;
    }

}
