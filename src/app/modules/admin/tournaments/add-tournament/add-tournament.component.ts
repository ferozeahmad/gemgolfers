import { Component, OnInit, ViewChild } from '@angular/core';
import { StepperOrientation } from '@angular/material/stepper';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    FormControl,
    FormArray,
    Validators,
} from '@angular/forms';
import * as XLSX from 'xlsx';
import { read, utils } from 'xlsx';
import { filter } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Club } from '../../../../shared/models/club.model';
import {
    Course,
    CourseHoles,
    CourseHoleSet,
} from '../../../../shared/models/course.model';
import {
    INDIVIDUAL_FORMATS_INFO,
    matchFormat,
    matchFormats,
    Tournament,
    TournamentCategory,
    TournamentMember,
    TournamentRoundCourses,
} from '../../../../shared/models/tournament.model';
import {
    Player,
    PlayerCategory,
    Marshal,
    UserSessionModel,
    ClubMembership,
} from '../../../../shared/models/player.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    UniqueIdGenerator,
    passwordGenerator,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { RequireMatch } from '../../../../shared/classes/CustomValidator';
import { of, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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
import { DatePipe, Location } from '@angular/common';
import { MatStepper } from '@angular/material/stepper';
import { DialogPlayingDatesComponent } from '../../dialogs/dialog-playing-dates/dialog-playing-dates.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DialogAddMemberComponent } from '../../dialogs/dialog-add-member/dialog-add-member.component';
import { LogsService } from 'app/shared/services/logs.service';
import { Team, TeamMembers } from 'app/shared/models/team.model';
import { InvalidCategoryPlayersComponent } from '../../dialogs/dialog-invalid-category-players/invalid-category-players.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
//import { DialogPlayingDatesComponent } from "../../material-components/dialog-playing-dates/dialog-playing-dates.component";

@Component({
    standalone: false,
    selector: 'app-add-tournament',
    templateUrl: './add-tournament.component.html',
    styleUrls: ['./add-tournament.component.scss'],
})
export class AddTournamentComponent implements OnInit {
    valid1 = new FormControl('');
    valid2 = new FormControl('');
    valid3 = new FormControl('');
    valid4 = new FormControl('');
    valid5 = new FormControl('');
    displayedColumns: string[] = [
        'select',
        'firstName',
        'handicap',
        // 'playerCategory',
    ];
    index = 0;
    membersColumns: string[] = [
        'select',
        'firstName',
        'handicap',
    ];
    file: File;
    arrayBuffer: any;
    matchFormats: { name: string; value: string }[] = General.singleFormats();
    dataSource: MatTableDataSource<Player | any>;
    selection = new SelectionModel<Player>(true, []);
    memberSelection = new SelectionModel<Player>(true, []);
    memberTMSelection = new SelectionModel<Player>(true, []);
    isLoading = true;
    isTournamentLoading = false;
    duplicatePlayers = [];
    intervalPerFlight = 0;
    stepTitle: string = 'Tournament Setup Form';
    PLcats: Player[] = [];
    tournamentCourses: any[] = [];
    formGroup: FormGroup;
    filteredClubOptions: Observable<Club[]>;
    filteredCourseOptions: any;
    selectedIndex: any = 0;
    nameFormGroup: FormGroup;
    emailFormGroup: FormGroup;
    loggedInuser: UserSessionModel;
    Clubs: Club[] = [];
    showCategory: boolean = true;
    clubMembers: Player[] = [];
    selectedMembers: any = [];
    categoryCounts: any = [];
    TMcategoryCounts: any = [];
    Courses: Course[] = [];
    _courseHoles: CourseHoles[] = [];
    Categories: PlayerCategory[] = [];
    isAmateur: boolean;
    isSAmateur: boolean;
    tournamentMembers: Player[] = [];
    selectedTeams1: any[][] = [];
    selectedTeams2: any[][] = [];
    selectedTeams: any[] = [];
    selectedPairs: any[] = [];
    assignedOpponents: Set<string> = new Set<string>();
    teamMembersToSave: any[] = [];
    isSenior: boolean
    membersSource: MatTableDataSource<Player | any>;
    membersTeamSource: MatTableDataSource<Player | any>;
    isVeterans: boolean;
    isCreatingFlights: boolean = false;
    skipCat: boolean = false;
    isJuniors: boolean;
    isLadies: boolean;
    isProfessionals: boolean;
    isProAm: boolean;
    selected: boolean;
    isMarshals: boolean;
    hideClubs: boolean = true;
    showTexas: boolean = false;
    copied: boolean = false;
    copiedC: boolean = false;
    showSuccessPopup: boolean = false;
    showMatchPlay: boolean = false;
    showMultipleCourses: boolean = false;
    multiCourse: boolean = false;
    noOfRounds: number[] = [1];
    showShambles: boolean = false;
    showBest: boolean = false;
    clubTitle: string;
    sDate: Date;
    registrationLink: string = '';
    joinCode: string = '';
    tournamentID: string;
    subTournamentID: string = '';
    public selectedTime = '08:00 AM';
    public preFlightTime = this.selectedTime;
    minDate: Date;
    maxDate: Date;
    courseIndex: number = 0;
    courseFlag: boolean = true;;
    currentTournament: any;
    classifiedPlayers: any[] = [];
    setupInitialized: boolean = false;
    playingFlight: any[] = [];
    bannerPreview: string | ArrayBuffer | null = null;
    courseHoleSetNames: any[];
    courseHoleSetName: any[] = [];
    courseChange: boolean = false;
    bannerForm: FormGroup;
    courseHoleSetCount: number = 0;
    showCourseHole: boolean = false;
    atpTime: any;
    stepperOrientation: Observable<StepperOrientation>;
    editTournament: boolean = false;
    playingDat: any[] = [];
    @ViewChild('paginatorLegal') paginator: MatPaginator;
    @ViewChild('dsort') sort: MatSort;
    currentTitle: string = 'Tournament Setup';
    currentStep: number = 1;
    steps = [
        { number: 1, title: 'Tournament Setup', description: 'Basic details & rules' },
        { number: 2, title: 'Select Players', description: 'Add members to event' },
        { number: 3, title: 'Groups Setup', description: 'Arrange player groups' },
        { number: 4, title: 'Banner Setup', description: 'Arrange player groups' },
        { number: 5, title: 'Review & Confirm', description: 'Final arrangement' },
    ];
    @ViewChild('paginatorGSTN') Mempaginator: MatPaginator;
    @ViewChild('msort') Memsort: MatSort;
    showDates: boolean = false;
    dates: any[] = [];
    datesPlaying: any[] = [];
    showCat: boolean = true;
    showSubtournament: boolean = false;
    onHoleChange($event, i, j) {
        //console.log(i);

        let flight_1_hole: string = (<HTMLInputElement>(
            document.getElementById('flight_' + i + '_hole')
        )).value;
        //console.log(flight_1_hole);
    }

    drop(event: CdkDragDrop<string[]>) {
        ////console.log(event);
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
    swapArrayElements<T>(arr: T[], indexA: number, indexB: number): void {
        if (indexA < 0 || indexB < 0 || indexA >= arr.length || indexB >= arr.length) {
            // Check if the indices are within the valid range of the array
            return;
        }

        const temp = arr[indexA];
        arr[indexA] = arr[indexB];
        arr[indexB] = temp;
    }
    swapOuterObjects(previousArray: any[], newArray: any[], index1: number, index2: number): void {
        let newindex = 0;
        let newindex2 = 0;
        if (index2 < 2) {
            newindex = 0
        } else {
            newindex = 1;
        }
        if (index1 < 2) {
            newindex2 = 0
        } else {
            newindex2 = 1;
        }
        index2 = index2 % 2;
        index1 = index1 % 2;
        const temp = previousArray[newindex2][index1];
        previousArray[newindex2][index1] = newArray[newindex][index2];
        newArray[newindex][index2] = temp;
    }
    swapInnerObjects(mainArray: any[], index1: number, index2: number): void {
        // Assuming mainArray[index1] and mainArray[index2] are arrays with the 'PairName' property
        index2 = index2 % 2;
        const temp = mainArray[0][index1];
        mainArray[0][index1] = mainArray[1][index2];
        mainArray[1][index2] = temp;
    }
    dragDroppedShambles(event: CdkDragDrop<string[]>) {
        const newIndex = event.currentIndex;
        const previousIndex = event.previousIndex;
        //console.log(newIndex);
        //console.log(previousIndex);
        if (event.previousContainer === event.container) {
            if (previousIndex == 0 && newIndex == 1) {
                //console.log('No changes');
            } else if ((previousIndex == 0 || previousIndex == 1) && (newIndex == 2 || newIndex == 3)) {
                this.swapInnerObjects(event.container.data, previousIndex, newIndex);
            } else if ((previousIndex == 2 || previousIndex == 3) && (newIndex == 0 || newIndex == 1)) {
                this.swapInnerObjects(event.container.data, newIndex, previousIndex);
            }
        }
        else {
            if (previousIndex == 0 && newIndex == 1) {
                //console.log('No changes');
            } else if ((previousIndex == 0 || previousIndex == 1) && (newIndex == 2 || newIndex == 3)) {
                this.swapOuterObjects(event.previousContainer.data, event.container.data, previousIndex, newIndex)
            } else if ((previousIndex == 2 || previousIndex == 3) && (newIndex == 0 || newIndex == 1)) {
                this.swapOuterObjects(event.previousContainer.data, event.container.data, newIndex, previousIndex)
            }
        }

    }

    teamForm!: FormGroup;
    teamColors = [
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];

    selectedTeamColor: string | null = null;

    onPlayerDrop(event: CdkDragDrop<any[]>, team: 'A' | 'B', flightIndex: number) {
        const teamKey = team === 'A' ? 'teamA' : 'teamB';

        const previousList = event.previousContainer.data;
        const currentList = event.container.data;

        const previousIndex = event.previousIndex;
        const currentIndex = event.currentIndex;

        // 👉 Case 1: Same list → reorder
        if (event.previousContainer === event.container) {
            moveItemInArray(currentList, previousIndex, currentIndex);
            return;
        }

        // 👉 Case 2: Different flights of SAME team → transfer
        if (previousList && currentList) {
            transferArrayItem(
                previousList,
                currentList,
                previousIndex,
                currentIndex
            );
            return;
        }
    }


    /** Returns a FormArray with the name 'formArray'. */
    get formArray(): AbstractControl | null {
        return this.formGroup.get('formArray');
    }

    private marshalValidators = [Validators.maxLength(3)];

    constructor(
        private breakpointObserver: BreakpointObserver,
        private datePipe: DatePipe,
        private router: Router,
        private location: Location,
        private _fuseConfirmationService: FuseConfirmationService,
        private route: ActivatedRoute,
        public snackBar: MatSnackBar,
        private _formBuilder: FormBuilder, private logger: LogsService,
        public dialog: MatDialog, private _localStorage: LocalStorageService,
        private facadeService: FacadeService
    ) {
        this.setState(this.valid1, true);
        this.setState(this.valid2, true);
        this.setState(this.valid3, true);
        this.setState(this.valid4, true);
        this.setState(this.valid5, true);
        this.stepperOrientation = breakpointObserver
            .observe('(min-width: 800px)')
            .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));

        // Set loading immediately if editing an existing tournament
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isTournamentLoading = true;
        }
    }



    async ngOnInit() {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);


        this.route.paramMap.subscribe((params) => {
            this.tournamentID = params.get('id');
        });

        // if (this.tournamentID) {
        //     this.steps = this.steps.filter((a) => a.title == 'Tournament Setup')

        // }

        this.bannerForm = this._formBuilder.group({
            repetitions: [5, [Validators.required, Validators.min(1)]],
            startIndex: [0, [Validators.required, Validators.min(0)]]
        });

        if (this.loggedInuser) {
            this.hideClubs = this._localStorage.isClubAdmin() ? true : false;
            this.clubTitle = this.loggedInuser?.club?.name ?? '';
        }
        this.teamForm = this._formBuilder.group({
            teamName: [''],
            teamColor: ['']
        });

        this.formGroup = this._formBuilder.group({
            formArray: this._formBuilder.array([
                this._formBuilder.group({
                    titleFormCtrl: ['', [Validators.required]],
                    prefixFormCtrl: ['', [Validators.required]],
                    numOfRounds: ['1', Validators.required],
                    typeFormCtrl: ['2', Validators.required],
                    handicapAllocations: ['AS_IS', Validators.required],
                    secondFormat: ['STROKE_PLAY', Validators.required],
                    strokeAllocations: ['AT_START', Validators.required],
                    pointsFormats: this._formBuilder.array([
                        this._formBuilder.group({
                            format: [''],
                        }),
                    ]),
                    pointValue: ['1', Validators.required],
                    startDateFormCtrl: ['', Validators.required],
                    endDateFormCtrl: ['', Validators.required],
                    teamMatch: ['1', Validators.required],
                    clubsFormCtrl: [
                        this._localStorage.isClubAdmin()
                            ? this.loggedInuser.club
                                ? this.loggedInuser.club
                                : ''
                            : '',
                        [],
                    ],
                    courseInfo: this._formBuilder.array([
                        this._formBuilder.group({
                            courseName: ['', Validators.required],
                            matchFormat: [Constants.MF_STROKE_PLAY],
                            multiFormat: ['SINGLE'],
                        }),
                    ]),
                    courseHoleSet: [''],
                    subTournament: this._formBuilder.array([
                        this._formBuilder.group({
                            title: [''],
                            prefix: [''],
                            matchFormat: [Constants.MF_BESTBALL],
                        }),
                    ]),
                    clubctgies: this._formBuilder.array([]),
                    scoreManagement: ['ONLY_PLAYERS'],
                    marshalStart: ['', this.marshalValidators],
                    noofMarshals: ['', this.marshalValidators],
                    handicapCats: [false],
                    handicapRatio: [''],
                    prizeCategoryA: [''],
                    prizeCategoryB: [''],
                    prizeCategoryC: [''],
                    prizeCategoryD: [''],
                    amateursGT: [''],
                    amateursNT: [''],
                    seniorsGT: [''],
                    seniorsNT: [''],
                    veteransGT: [''],
                    veteransNT: [''],
                    juniorsGT: [''],
                    juniorsNT: [''],
                    ladiesGT: [''],
                    ladiesNT: [''],
                    professionalsGT: [''],
                    professionalsNT: [''],
                    spLongestDriveOne: [''],
                    spLongestDriveTwo: [''],
                    spNearestDrive: [''],
                    askConfirmation: [false],
                    courses: this._formBuilder.array([]),
                }),
                this._formBuilder.group({
                    category: this._formBuilder.array([]),
                }),
            ]),
        });
        let playerCategoryList = this.facadeService.getPlayerCategories();
        const clubCtgiesFA = this.formArray.get([0]).get('clubctgies') as FormArray;
        for (let p of playerCategoryList) {
            let checkBoxCat: any = {
                id: p.id,
                name: p.name,
                checked: false,
                startDate: '',
                endDate: '',
                // checked: founded.length > 0 ? true : false,
            };
            clubCtgiesFA.push(
                this._formBuilder.group({
                    id: p.id,
                    name: p.name,
                    checked: false,
                    startDate: null,
                    endDate: null,
                })
            );

            this.Categories.push(checkBoxCat);
        }

        this.route.paramMap.subscribe((params) => {
            this.tournamentID = params.get('id');
        });

        this._courseHoles = this.facadeService.getCourseHoles('');

        let today: Date = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

        // Run all independent API calls in parallel
        const parallelCalls: Promise<any>[] = [
            this.facadeService.getApprovedCoursesList(),
        ];
        if (this._localStorage.isSuperAdmin() || this._localStorage.isClubAdmin()) {
            parallelCalls.push(this.facadeService.getClubList());
        }
        if (this.tournamentID) {
            parallelCalls.push(this.facadeService.getTournamentByIDForSetup(this.tournamentID));
        }

        const results = await Promise.all(parallelCalls);

        this.Courses = results[0].course;
        let resultIdx = 1;
        if (this._localStorage.isSuperAdmin() || this._localStorage.isClubAdmin()) {
            this.Clubs = results[resultIdx].club;
            resultIdx++;
        }

        let tournamentInfo: any = null;
        if (this.tournamentID) {
            tournamentInfo = results[resultIdx];
        }

        if (this.tournamentID) {
            this.registrationLink = 'https://app.gemgolfers.com/signUpForm/' + this.tournamentID;
            this.joinCode = '';
            this.valid1.reset();
            this.editTournament = true;
            //console.log(tournamentInfo);
            this.currentTournament =
                tournamentInfo.tournament.length > 0
                    ? tournamentInfo.tournament[0]
                    : [];

            console.log(this.currentTournament);
            //console.log(this.currentTournament.teams);

            // this.getSelectedCourse(this.currentTournament['CourseQL']);

            if (this.currentTournament) {

                this.skipCat = this.currentTournament.skipCategory ? this.currentTournament.skipCategory : false;
                if (this.currentTournament.leaderboard_ad) {
                    this.bannerPreview = this.currentTournament?.leaderboard_ad?.ad;
                    this.bannerForm.patchValue({
                        repetitions: this.currentTournament?.leaderboard_ad?.repetitionInterval,
                        startIndex: this.currentTournament?.leaderboard_ad?.firstRow
                    });
                }
                this.noOfRounds = Array.from({ length: this.currentTournament.noOfRounds }, (_, i) => i + 1);
                this.joinCode = this.currentTournament.inviteCode;
                this.maxDate = new Date(this.currentTournament.endDate);
                this.minDate = new Date(this.currentTournament.startDate);
                this.formArray.get([0]).patchValue({
                    titleFormCtrl: this.currentTournament.title,
                    prefixFormCtrl: this.currentTournament.prefix,
                    startDateFormCtrl: this.currentTournament.startDate,
                    endDateFormCtrl: this.currentTournament.endDate,
                    numOfRounds: this.currentTournament.noOfRounds,
                    teamMatch: this.currentTournament.teamMatch == true ? '2' : '1',
                    courseHoleSet:
                        this.currentTournament.courseHoleSets +

                        '_' +
                        this.currentTournament.courseHoleSetsInverted,
                    scoreManagement: this.currentTournament.scoreManagement,
                    marshalStart: this.currentTournament.marshalsStartWith,
                    noofMarshals: this.currentTournament.noOfMarshals,
                });
                if (this.currentTournament.matchFormat == matchFormat.MATCH_PLAY && this.currentTournament.pointsFormats) {

                    const formatsArray = this.formArray.get([0]).get('pointsFormats') as FormArray;
                    formatsArray.clear();

                    const formatsList = Object.values(this.currentTournament.pointsFormats);

                    formatsList.forEach(item => {
                        formatsArray.push(
                            this._formBuilder.group({
                                format: [item, Validators.required]
                            })
                        );
                    });

                    console.log('Points Formats Assigned:', formatsArray.value);
                }

                if (this.currentTournament.scoreManagement != Constants.SM_ONLY_PLAYERS) {
                    this.isMarshals = true;
                }
                if (this.currentTournament.teamMatch) {
                    this.currentTournament.teams.forEach((team) => {
                        const newTeam = {
                            id: team.id,
                            name: team.name,
                            color: team.color,
                            members: [] // Initialize an empty array for members
                        };

                        // Loop through each member in membersQL
                        team.teamMembers.forEach((memberQL) => {
                            const playerQL = memberQL.player; // Get the player object from membersQL

                            // Extract relevant properties from the player object
                            const player = {
                                id: playerQL.id,
                                firstName: playerQL.firstName,
                                lastName: playerQL.lastName,
                                handicap: playerQL.handicap,
                                playerCategory: playerQL.playerCategory,
                                membershipNumber: playerQL.membershipNumber,
                            };

                            // Push the player into the new team's members array
                            newTeam.members.push(player);
                        });

                        // Push the new team into this.selectedTeams
                        this.selectedTeams.push(newTeam);
                    })
                    this.currentTournament.pairs.forEach((pair) => {
                        const newPair = {
                            id: pair.id,
                            name: pair.pairName,
                            members: [] // Initialize an empty array for members
                        };
                        newPair.members.push(pair?.player1)
                        newPair.members.push(pair?.player2)

                        // Loop through each member in membersQL


                        // Push the new team into this.selectedTeams
                        this.selectedPairs.push(newPair);
                    })

                    this.matchFormats = General.teamFormats();
                }
                if (this.currentTournament.matchFormat == matchFormat.MATCH_PLAY ||
                    this.currentTournament.matchFormat == matchFormat.BEST_TWO ||
                    this.currentTournament.matchFormat == matchFormat.BEST_THREE
                ) {
                    if (this.currentTournament.matchFormat == matchFormat.BEST_TWO ||
                        this.currentTournament.matchFormat == matchFormat.BEST_THREE
                    ) {
                        this.showBest = true;
                    } else {
                        this.showMatchPlay = true;
                    }

                    this.showCat = false;
                    this.steps = this.steps.filter(
                        s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
                    );
                    this.showShambles = false;
                    const hasTeamStep = this.steps.some(s => s.title === 'Select Teams');
                    if (!hasTeamStep) {
                        const teamStep = {
                            number: 3,
                            title: 'Select Teams',
                            description: 'Create and manage teams',
                        };

                        // Insert before "Groups Setup"
                        const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                        this.steps.splice(insertIndex, 0, teamStep);

                        // 🔹 Renumber all steps after insertion
                        this.steps.forEach((s, index) => (s.number = index + 1));
                    }
                } else if (this.currentTournament.matchFormat == matchFormat.TEXAS_SCRAMBLE || this.currentTournament.matchFormat == matchFormat.THREE_BALL_SCRAMBLE
                    || this.currentTournament.matchFormat == matchFormat.TWO_BALL_SCRAMBLE ||
                    this.currentTournament.matchFormat == matchFormat.FOUR_BALL_SCRAMBLE) {
                    this.showCat = false;
                    this.showTexas = true;
                } else if (this.currentTournament.matchFormat == matchFormat.SHAMBLES ||
                    this.currentTournament.matchFormat == matchFormat.GREENSOME ||
                    this.currentTournament.matchFormat == matchFormat.FOURSOME ||
                    this.currentTournament.matchFormat == matchFormat.TWO_BALL_BEST_BALL
                ) {
                    this.showCat = false;
                    this.showShambles = true;
                    this.showMatchPlay = false;
                    this.steps = this.steps.filter(
                        s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
                    );
                    const hasTeamStep = this.steps.some(s => s.title === 'Select Pairs');
                    if (!hasTeamStep) {
                        const teamStep = {
                            number: 3,
                            title: 'Select Pairs',
                            description: 'Create and manage pairs',
                        };

                        // Insert before "Groups Setup"
                        const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                        this.steps.splice(insertIndex, 0, teamStep);

                        // 🔹 Renumber all steps after insertion
                        this.steps.forEach((s, index) => (s.number = index + 1));
                    }
                } else if (this.currentTournament.matchFormat == matchFormat.STABLE_FORD || this.currentTournament.matchFormat == matchFormat.MODIFIED_STABLEFORD || this.currentTournament.matchFormat == matchFormat.SPLIT_SIXES) {
                    this.showCat = false;
                } else if (this.currentTournament.matchFormat == matchFormat.BEST_THREE || this.currentTournament.matchFormat == matchFormat.LIV ||
                    this.currentTournament.matchFormat == matchFormat.BEST_TWO) {
                    this.showBest = true;
                    this.showCat = false;
                }

                //this.stepIndex = 1;

                //console.log(this.currentTournament);

                if (this.currentTournament.members) {
                    for (let p of this.currentTournament.members) {

                        const playerQL = p['PlayerQL'];  // reference to player object
                        const updatedPlayer = { ...playerQL };

                        if (p.category !== undefined && p.category !== null) {
                            updatedPlayer.playerCategory = p.category;
                        }


                        // // If category exists on parent object, update PlayerQL
                        // if (p.category !== undefined && p.category !== null) {
                        //     playerQL['playerCategory'] = p.category;   // <-- update PlayerQL prop
                        // }

                        // Push updated object
                        this.tournamentMembers.push(<Player>updatedPlayer);
                    }
                }


                this.syncTournamentMembers();
                this.syncTournamentTeamMembers();

                //this.selection = new SelectionModel<Player>(true, this.tournamentMembers);
                let TM = [];
                //console.log(this.tournamentMembers);
                // for (let obj of this.tournamentMembers) {
                //     if (this.currentTournament.opponents.length > 0) {
                //         for (let objA of this.currentTournament.opponents) {
                //             if (objA.team1MemberId == obj.id && objA.team1Id == this.selectedTeams1[0]['id']) {
                //                 this.selectedTeams1[0].push(obj);
                //             }
                //             if (objA.team2MemberId == obj.id && objA.team2Id == this.selectedTeams2[0]['id']) {
                //                 this.selectedTeams2[0].push(obj);
                //             }
                //         }
                //     }
                // }

                let selectedClubId: string;
                if (this._localStorage.isClubAdmin()) {
                    selectedClubId = this.loggedInuser.adminClubId;
                } else if (this._localStorage.isSuperAdmin() && this.loggedInuser.adminClubId) {
                    selectedClubId = this.formArray.get([0]).value.clubsFormCtrl.id;
                }
                // Defer player list loading so the form shows immediately
                setTimeout(() => this.refreshPlayerList(selectedClubId), 0);
                // this.clubMembers = [];
                // //console.log(selectedClubId);
                // let clubMembersData: any =
                //     await this.facadeService.getPlayerByClub(selectedClubId);

                // for (let i = 0; i < clubMembersData.club_member.length; i++) {
                //     this.clubMembers.push(
                //         clubMembersData.club_member[i].player
                //     );
                // }
                this.tournamentCourses = this.currentTournament['CoursesQL'];
                if (this.tournamentCourses.length > 0) {
                    this.showMultipleCourses = true;
                    // this.multiCourse = true;
                    for (let course of this.tournamentCourses) {
                        const chkArray = this.formArray.get([0]).get('courses') as FormArray;
                        let holeSet = course.courseHoleSets + '_' + course.inverted;
                        chkArray.push(
                            this._formBuilder.group({
                                courseName: [course.course, Validators.required],
                                round: [course.round, Validators.required],
                                courseHolSet: [holeSet, Validators.required]
                            })
                        );
                    }
                } else {
                    this.formArray
                        .get([0])
                        .get('courseInfo')!
                        .get([0])
                        .get('courseName')
                        .setValue({
                            name: this.currentTournament['CourseQL'].name,
                            id: this.currentTournament['CourseQL'].id,
                        });
                }

                //console.log(this.clubMembers);

                // this.syncClubMembers();

                //this.dataSource = new MatTableDataSource(this.clubMembers);


                this.formGroup.get('formArray')!
                    .get([0])
                    .get('courseInfo')!
                    .get([0])
                    .get('matchFormat')!
                    .setValue(this.currentTournament.matchFormat);

                if (this.currentTournament.clubId) {
                    this.formArray
                        .get([0])
                        .get('clubsFormCtrl')!
                        .setValue(
                            this._filterClub(this.currentTournament?.clubId)?.[0],
                        );
                }



                // this.formArray
                // .get([0])
                // .get("courseInfo")!
                // .get([0])
                // .get("matchFormat")
                // .setValue({value: this.currentTournament.matchFormat})
                //console.log(this.currentTournament['CategoriesQL']);

                for (let savedCat of this.currentTournament['CategoriesQL']) {
                    // get index of category in formArray
                    let idx = playerCategoryList.findIndex(
                        (x) => x.name === savedCat.category
                    );
                    if (idx !== -1) {
                        const control = clubCtgiesFA.at(idx);

                        control.patchValue({
                            checked: true,
                            startDate: new Date(savedCat.flightSettings?.[0]?.dates) || null,
                            endDate: new Date(savedCat.flightSettings?.[savedCat.flightSettings.length - 1]?.dates) || null,
                        });

                        this.Categories[idx]['checked'] = true;
                        // this.Categories[idx].startDate = savedCat.flightSettings?.[0]?.startDate || '';
                        // this.Categories[idx].endDate = savedCat.flightSettings?.[0]?.endDate || '';
                    }
                }

                // if (founded[0].flightSettings.length > 0) {
                //     for (let obj of founded[0].flightSettings) {
                //         let objA = {
                //             id: p.id,
                //             name: p.name,
                //             playingDates: obj,
                //         };
                //         this.dates.push(objA);
                //     }
                // }

                // let obj = {
                //     id: 1,
                //     name: p.name,
                //     // playingDates: result[i]['dates'],
                // };
                // this.dates.push(obj);

                if (!this.currentTournament.isSetupComplete && this.currentTournament.currentTab) {
                    const step = this.steps.find(s => s.number === this.currentTournament.currentTab + 1);
                    this.currentTitle = step ? step.title : this.currentTitle;
                    this.currentStep = step ? step.number : this.currentStep;
                    this.goToStep(this.currentTitle, this.currentStep)

                }

                this.minDate = tournamentInfo.startDate;
                //const chkArray = <FormArray>this.formArray.get([0]).get("clubctgies");
                //chkArray.push(new FormControl({ id: 1, name: "Amateurs", checked: false }));
            }
            this.isTournamentLoading = false;
        } else {
            // for (let p of playerCategoryList) {
            //     let checkBoxCat: any = {
            //         id: p.id,
            //         name: p.name,
            //         checked: false,
            //     };

            //     this.Categories.push(checkBoxCat);
            // }
        }

        this.filteredClubOptions = this.formArray
            .get([0])
            .get('clubsFormCtrl')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) => (name != undefined ? this._filter(name) : this.Clubs.slice()))
            );
        console.log(this.filteredClubOptions);

        // this.formArray
        // .get([0])
        // .get('courseInfo')
        // .get([0])
        // .get('courseName').valueChanges.subscribe(newValue=>{
        //     this.filteredCourseOptions = this.filterValues(newValue);
        // })
        this.filteredCourseOptions = this.formArray
            .get([0])
            .get('courseInfo')!
            .get([0])
            .get('courseName')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) =>
                    name ? this._filterCourse(name) : this.Courses.slice()
                )
            );

        //console.log(this.filteredCourseOptions);

        const currentYear = new Date().getFullYear();
        if (!this.tournamentID) {
            this.maxDate = new Date(currentYear + 1, 11, 31);
            this.minDate = todayDate;

            // Pre-select course for club admins
            if (this._localStorage.isClubAdmin() && this.loggedInuser?.adminClubId) {
                // Find a course associated with the club admin's club
                const clubAdminCourse = this.Courses.find(
                    (course) => course.clubId === this.loggedInuser.adminClubId
                );

                if (clubAdminCourse) {
                    // Set the course as default
                    this.formArray
                        .get([0])
                        .get('courseInfo')!
                        .get([0])
                        .get('courseName')
                        .setValue({
                            name: clubAdminCourse.name,
                            id: clubAdminCourse.id,
                        });
                    console.log('Pre-selected course for club admin:', clubAdminCourse.name);
                    this.getSelectedCourses(clubAdminCourse);
                }
            }
        }

        if (this._localStorage.isClubAdmin()) {
            this.formArray.get([0]).get('clubsFormCtrl').clearValidators();
            this.formArray
                .get([0])
                .get('clubsFormCtrl')
                .updateValueAndValidity();
        }
    }

    get clubctgies(): FormArray {
        return this.formArray.get([0]).get('clubctgies') as FormArray;
    }

    filterValues(search: string): any {
        //console.log('aaa');
    }

    closePopupAndProceed(): void {
        this.showSuccessPopup = false;
        this.currentStep += 1;
        this.currentTitle = 'Select Players';
    }

    createCourses(round: any): FormGroup {
        return this._formBuilder.group({
            courseName: [
                '',
                [Validators.required, RequireMatch],
            ],
            round: [round],
            courseHolSet: [''],
        });
    }

    toggleFlights(event, index) {
        console.log(event);
        console.log(this.formArray.get([1]).get('category').get([index]));
        if (event.checked) {
            this.formArray.get([1]).get('category').get([index]).get('enabled').setValue(true);
        } else {
            this.formArray.get([1]).get('category').get([index]).get('enabled').setValue(false);
        }


    }

    copyLink(): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.registrationLink).then(() => {
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
            });
        }
    }
    copyCode(): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.joinCode).then(() => {
                this.copiedC = true;
                setTimeout(() => this.copiedC = false, 2000);
            });
        }
    }

    backStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            let step = this.steps.find(a => a.number == this.currentStep);
            this.currentTitle = step?.title;
        }
    }

    handleNextStep(): void {
        switch (this.currentTitle) {
            case 'Tournament Setup':
                this.editTournament ? this.editTournaments() : this.createTournament();
                break;
            case 'Select Players':
                this.saveTournamentMember();
                break;
            case 'Select Teams':
                this.saveTournamentTeams();
                break;
            case 'Select Pairs':
                this.goToStep('Groups Setup', 4);
                break;
            case 'Groups Setup':
                this.getSelectedPlayers();
                break;
            case 'Banner Setup':
                this.addBanner();
                break;
            case 'Review & Confirm':
                this.createFlights();
                break;
        }
    }

    get nextStepLabel(): string {
        return this.currentTitle === 'Review & Confirm' ? 'Start Tournament' : 'Next Step';
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.file = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.bannerPreview = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }

    get repetitions() { return this.bannerForm.get('repetitions'); }
    get startIndex() { return this.bannerForm.get('startIndex'); }

    goToStep(stepTitle: string, stepNumber: number): void {

        const currentGroup = this.formArray?.get([0]) as FormGroup;
        // // 1️⃣ Mark all fields touched to show errors
        if (currentGroup) {
            currentGroup.markAllAsTouched();
        }
        if (currentGroup?.valid) {
            if (stepNumber == 3) {
                this.flightsSetup();
            }
            if (stepTitle == 'Banner Setup') {
                this.getSelectedPlayers();
            }
            if (stepTitle == 'Groups Setup' && this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.STROKE_PLAY) {
                this.saveTournamentMember();
            } else {
                this.currentStep = stepNumber;
                this.currentTitle = stepTitle;
            }
        } else {
            const invalidFields = this.getInvalidControls(currentGroup);
            console.warn('Invalid fields:', invalidFields);
            // Optionally, show a toast or inline error message
            console.warn('Please complete this step before continuing.');
        }
    }

    getInvalidControls(formGroup: FormGroup, parentKey = ''): string[] {
        let invalid = [];

        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            const controlPath = parentKey ? `${parentKey} → ${key}` : key;

            if (control instanceof FormGroup) {
                invalid = invalid.concat(this.getInvalidControls(control, controlPath));
            } else if (control instanceof FormArray) {
                control.controls.forEach((ctrl, idx) => {
                    invalid = invalid.concat(this.getInvalidControls(ctrl as FormGroup, `${controlPath}[${idx}]`));
                });
            } else if (control?.invalid) {
                invalid.push(controlPath);
            }
        });

        return invalid;
    }



    selectColor(color: string) {
        this.selectedTeamColor = color;
        this.teamForm.get('teamColor')?.setValue(color);
    }

    createCategory(cat: any): FormGroup {
        let playersperFlight = '2';
        if (cat != 'Teams') {
            return this._formBuilder.group({
                name: [
                    cat?.name ?? cat,
                    Validators.compose([Validators.required]),
                ],
                playersperFlight: [
                    '2',
                    Validators.compose([Validators.required]),
                ],
                flightStartTime: ['08:00', Validators.required],
                arrangeBy: ['handicap', Validators.required],
                selectedcategories: [
                    this.formArray.get([0]).get('clubctgies').value,
                ],
                arrangements: ['0', Validators.required],
                startingHole: ['1_10', Validators.required],
                flightsInterval: ['10'],
                enabled: [true],
                playingDate: this.checkDate(cat),
            });
        } else {
            if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.TEXAS_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.FOUR_BALL_SCRAMBLE) {
                playersperFlight = '4'
            } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.TWO_BALL_SCRAMBLE) {
                playersperFlight = '2'

            } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.THREE_BALL_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.SPLIT_SIXES) {
                playersperFlight = '3'
            } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.SHAMBLES || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.FOUR_BALL_SCRAMBLE) {
                playersperFlight = '4'
            }
            return this._formBuilder.group({
                name: [
                    cat ? cat : '',
                    Validators.compose([Validators.required]),
                ],
                playersperFlight: [
                    playersperFlight,
                    Validators.compose([Validators.required]),
                ],
                flightStartTime: ['08:00', Validators.required],
                arrangeBy: ['handicap', Validators.required],
                arrangements: ['0', Validators.required],
                startingHole: ['1_10', Validators.required],
                flightsInterval: ['10'],
                playingDate: null,
                enabled: true,
            });

        }
    }
    setState(control: FormControl, state: boolean) {
        if (state) {
            control.setErrors({ required: true });
        } else {
            control.reset();
        }
    }
    get courseFormGroup() {
        return <FormArray>this.formArray.get([0]).get('courses');
    }
    get categoryFormGroup() {
        return <FormArray>this.formArray.get([1]).get('category');
    }

    PlayingDateFormGroup(index) {
        let catControls = this.categoryFormGroup;
        ////console.log(catControls);
        //console.log(catControls.controls[index].get('playingDate'));

        return <FormArray>catControls.controls[index].get('playingDate');
    }

    calculateDiff(startDate, endDate) {
        let days = Math.floor(
            (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24
        );
        return days;
    }

    getplayingDate() {
        this.playingDat = [];
        let sDate = new Date(this.formArray.get([0]).value.startDateFormCtrl);
        let eDate = new Date(this.formArray.get([0]).value.endDateFormCtrl);
        //sDate.setDate(sDate.getDate() + 1);

        //console.log(sDate);
        //console.log(eDate);
        //console.log(this.calculateDiff(sDate, eDate));

        let noOfDays: any = this.calculateDiff(sDate, eDate);
        return this.playingDat;
    }
    getplayingDates() {
        this.playingDat = [];
        let sDate = new Date(this.formArray.get([0]).value.startDateFormCtrl);
        let eDate = new Date(this.formArray.get([0]).value.endDateFormCtrl);
        //sDate.setDate(sDate.getDate() + 1);

        //console.log(sDate);
        //console.log(eDate);
        //console.log(this.calculateDiff(sDate, eDate));

        let noOfDays: any = this.calculateDiff(sDate, eDate);
        for (let i = 0; i <= noOfDays; i++) {
            let dte = new Date(sDate);
            dte.setDate(sDate.getDate() + i);
            //console.log(dte);
            let dteday = this.datePipe.transform(dte, 'yyyyMMdd');
            //console.log(dteday);
            this.playingDat[i] =
                dteday.substring(8, 6) +
                '-' +
                dteday.substring(6, 4) +
                '-' +
                +dteday.substring(0, 4);
            //selectedDate [i] = this.datePipe.transform(selectedDate[i], 'dd-MM-yyyy')

            //   this.selectedMembers.push(person);
            //console.log(this.playingDat[i]);
        }
        //console.log(this.playingDat);
        return this.playingDat;
    }

    addFlightField(category: any) {
        const control = this.formArray.get([1]).get('category') as FormArray;

        // Find existing category
        const existingIndex = control.controls.findIndex(
            (fg: FormGroup) => fg.get('name')?.value === (category.name ?? category)
        );

        if (existingIndex !== -1) {
            // Category already exists → reuse old settings
            const existingGroup = control.at(existingIndex) as FormGroup;

            // Return or use it however you want  
            return existingGroup;
        }

        // Otherwise add NEW category
        control.push(this.createCategory(category));
    }

    addCourseField(round: any) {
        const control = this.formArray.get([0]).get('courses') as FormArray;
        control.push(this.createCourses(round));

        // Get the index of the newly added control
        const index = control.length - 1;

        // Set up value change observable for the newly added control
        const courseNameControl = control.at(index).get('courseName');
        this.setupValueChangeObservable(courseNameControl);
    }

    setupValueChangeObservable(control: AbstractControl) {
        control.valueChanges.pipe(
            startWith(''),
            map((value) =>
                typeof value === 'string' ? value : value ? value.name : ''
            ),
            map((name) =>
                name ? this._filterCourse(name) : this.Courses.slice()
            )
        );
    }
    displayFn(club: Club): string {
        return typeof club === 'string' ? club : club ? club.name : '';
    }

    displayCourseFn(course: any): string {
        //console.log(course);
        return typeof course === 'string'
            ? course
            : course.course
                ? course.course.name
                : course.name;
    }

    private _filter(value: string): Club[] {
        //console.log(value);

        if (value) {
            const filterValue = value.toLowerCase();

            return this.Clubs.filter(
                (option) => option.name.toLowerCase().indexOf(filterValue) === 0
            );
        }

        return this.Clubs;
    }
    private _filterClub(value: string) {
        //console.log(value);

        if (value) {
            const filterValue = value.toLowerCase();

            return this.Clubs.filter(
                (option) => option.id.toLowerCase().indexOf(filterValue) === 0
            );
        }

    }

    private _filterCourse(value: any): Course[] {
        //console.log('value=' + value);

        if (value) {
            if (typeof value === 'object') {
                const filterValue = value.name
                    ? value.name.toLowerCase()
                    : value.course.name.toLowerCase();
                return this.Courses.filter(
                    (option) =>
                        option.name.toLowerCase().indexOf(filterValue) >= 0
                );
            } else {
                const filterValue = value.toLowerCase();
                return this.Courses.filter(
                    (option) =>
                        option.name.toLowerCase().indexOf(filterValue) >= 0
                );
            }
        }

        return this.Courses.slice();
    }

    checkDate(cat: any) {
        const result = [];

        const start = new Date(cat.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(cat.endDate);
        end.setHours(0, 0, 0, 0);

        let current = new Date(start);

        while (current <= end) {
            result.push({
                dates: this.formatDate(current)
            });

            current.setDate(current.getDate() + 1); // move to next day
        }

        return result;
    }

    formatDate(date: Date): string {
        const d = ("0" + date.getDate()).slice(-2);
        const m = ("0" + (date.getMonth() + 1)).slice(-2);
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    }

    updateCategoryDates(cat) {
        const chkArray = this.formArray.get([0]).get('clubctgies') as FormArray;

        const idx = chkArray.value.findIndex((x) => x.id === cat.id);
        if (idx !== -1) {
            chkArray.at(idx).patchValue({
                startDate: cat.startDate,
                endDate: cat.endDate,
            });
        }
    }

    // updateChkbxArray(chk, index, isChecked, key) {
    //     const chkArray = <FormArray>this.formArray.get([0]).get(key);
    //     if (isChecked) {
    //         this.Categories[index]['checked'] = true;
    //         //sometimes inserts values already included creating double records for the same values -hence the defence
    //         if (chkArray.controls.findIndex((x) => x.value.id == chk.id) == -1)
    //             chkArray.push(
    //                 this._formBuilder.group({
    //                     id: [chk.id],
    //                     name: [chk.name],
    //                     startDate: [this.formArray.get([0]).value.startDateFormCtrl, Validators.required],
    //                     endDate: [this.formArray.get([0]).value.endDateFormCtrl, Validators.required],
    //                 })
    //             );
    //         //console.log(chkArray);
    //         //this.dateSetup();
    //         // this.getplayingDates();
    //         this.showDates = true;
    //         let category;
    //         category = this.formArray.get([0]).get('clubctgies').value;
    //         //console.log(category);

    //         // const dialogRef = this.dialog.open(DialogPlayingDatesComponent, {
    //         //     width: '800px',

    //         //     data: {
    //         //         dates: this.playingDat,
    //         //         category: chk,
    //         //     },
    //         // });

    //         // dialogRef.afterClosed().subscribe((result) => {
    //         //     //console.log(result);
    //         //     if (result) {
    //         //         for (let i = 0; i < result.length; i++) {
    //         //             let obj = {
    //         //                 id: result[i]['id'],
    //         //                 name: result[i]['name'],
    //         //                 playingDates: result[i]['dates'],
    //         //             };
    //         //             this.dates.push(obj);
    //         //         }
    //         //         //console.log(this.dates);
    //         //     } else {
    //         //         this.snackBar.open('Dates have not been saved', 'x', {
    //         //             duration: 3000,
    //         //         });
    //         //     }
    //         // });
    //         //this.PlayingDateFormGroup(index)
    //     } else {
    //         let idx = chkArray.controls.findIndex(
    //             (x) => x.value.name == chk.name
    //         );
    //         this.Categories[index]['checked'] = false;
    //         chkArray.removeAt(idx);
    //         this.dates = this.dates.filter((x) => x.name != chk.name);
    //         //console.log(this.dates);
    //     }

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 1) != -1)
    //     //     this.selected = this.isAmateur = true;
    //     // else {
    //     //     this.isAmateur = false;
    //     //     this.formArray.get([0]).get('handicapCats').setValue(false);
    //     // }

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 2) != -1)
    //     //     this.selected = true;
    //     // else {
    //     //     this.isSAmateur = this.isSAmateur = false;
    //     //     this.formArray.get([0]).get('handicapCats').setValue(false);
    //     // }

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 2) != -1)
    //     //     this.isSenior = true;
    //     // else this.isSenior = false;

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 3) != -1)
    //     //     this.isVeterans = true;
    //     // else this.isVeterans = false;

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 4) != -1)
    //     //     this.isJuniors = true;
    //     // else this.isJuniors = false;

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 5) != -1)
    //     //     this.isLadies = true;
    //     // else this.isLadies = false;

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 6) != -1)
    //     //     this.isProfessionals = true;
    //     // else this.isProfessionals = false;

    //     // if (chkArray.controls.findIndex((x) => x.value.id == 7) != -1)
    //     //     this.isProAm = true;
    //     // else this.isProAm = false;

    //     ////console.log(chkArray.controls);
    //     ////console.log(chkArray.controls.findIndex(x => x.value.id == 1));
    // }

    updateChkbxArray(chk, index, checked, key) {
        const arr = this.formArray.get([0]).get(key) as FormArray;
        const group = arr.at(index) as FormGroup;

        if (checked) {
            group.patchValue({
                id: chk.id,
                name: chk.name,
                startDate: null,
                endDate: null,
                checked: true,
            });
            group.get('startDate').setValidators(Validators.required);
            group.get('endDate').setValidators(Validators.required);
            group.get('startDate').updateValueAndValidity();
            group.get('endDate').updateValueAndValidity();
        } else {
            group.get('startDate').removeValidators([Validators.required]);
            group.get('endDate').removeValidators([Validators.required]);
            group.get('startDate').updateValueAndValidity();
            group.get('endDate').updateValueAndValidity();
            group.reset(); // Unselect
        }

        this.Categories[index]['checked'] = checked;
    }

    updateCourseHolSet(chk, isChecked, key) {
        const chkArray = <FormArray>this.formArray.get([0]).get(key);
        if (isChecked) {
            //sometimes inserts values already included creating double records for the same values -hence the defence
            if (chkArray.controls.findIndex((x) => x.value.id == chk.id) == -1)
                chkArray.push(
                    new FormControl({
                        id: chk.id,
                        name: chk.name,
                        checked: true,
                    })
                );
        } else {
            let idx = chkArray.controls.findIndex((x) => x.value.id == chk.id);
            chkArray.removeAt(idx);
        }
    }

    onChangeEventFunc(name: string, isChecked: boolean) {
        const courseHoleSet = this.formArray
            .get([0])
            .get('courseHoleSet') as FormArray;
        //console.log(isChecked['checked']);
        if (isChecked['checked']) {
            courseHoleSet.controls.push(new FormControl(name));
            this.courseHoleSetCount += 1;
        } else {
            const index = courseHoleSet.controls.findIndex(
                (x) => x.value === name
            );
            courseHoleSet.removeAt(index);
            this.courseHoleSetCount -= 1;
        }
        //console.log(courseHoleSet);
    }

    existInList(name: string) {
        let courseHoles = this.formArray
            .get([0])
            .get('courseHoleSet') as FormArray;
        let founded: boolean = false;

        for (let a of courseHoles.controls) {
            if (name == a.value) founded = true;
        }
        return founded;
    }

    public datechangeS(event) {
        this.minDate = event.value;
        console.log(event);
    }

    public datechangeE(event) {
        this.maxDate = event.value;
        console.log(event);
    }

    getSelectedCourse(course) {
        this.courseHoleSetNames = [];

        this.facadeService
            .getCourseHoleSets(course.id)
            .subscribe((selectedCourseHoleSet) => {
                console.log(selectedCourseHoleSet);
                if (selectedCourseHoleSet.course_hole_sets.length > 0) {
                    this.courseHoleSetNames =
                        selectedCourseHoleSet.course_hole_sets;
                    this.showCourseHole = true;
                } else {
                    this.showCourseHole = false;

                    this.formArray.get([0]).patchValue({
                        courseHoleSet: [],
                    });
                }
            });
    }

    getSelectedCourses(course) {
        this.courseHoleSetNames = [];
        this.courseChange = true;

        this.formArray.get([0]).get('courseInfo').get([0]).get('courseName').setValue({ course });

        this.facadeService.getCourseHoleSets(course.id).subscribe((selectedCourseHoleSet) => {
            const sets = selectedCourseHoleSet.course_hole_sets || [];

            if (sets.length > 0) {
                this.courseHoleSetNames = sets;
                // 🔹 Find the one with noOfHoles === 18
                const defaultHoleSet = sets.find((set) => set.noOfHoles === 18);

                // 🔹 Fallback: use first one if not found
                const selectedSet = defaultHoleSet || sets[0];

                // 🔹 Set the value directly in the form
                this.formArray.get([0]).get('courseHoleSet').setValue(
                    selectedSet.holeSets + '_' + selectedSet.inverted
                );
                this.showCourseHole = true;
            } else {
                this.showCourseHole = false;
                this.formArray.get([0]).patchValue({ courseHoleSet: [], });
            }
        });
    }
    getSelectedCoursesMulti(course, index) {

        this.courseChange = true;
        //console.log(this.courseChange);
        this.facadeService
            .getCourseHoleSets(course.id)
            .subscribe((selectedCourseHoleSet) => {
                //console.log(selectedCourseHoleSet);
                if (selectedCourseHoleSet.course_hole_sets.length > 0) {
                    this.courseHoleSetName.push(selectedCourseHoleSet.course_hole_sets)
                    // this.filteredCourseOptions = this.Courses.slice();
                    this.filteredCourseOptions = of(this._filterCourse(''));
                } else {
                }
            });
    }
    courseChnage(values, i) {
        if (this.courseIndex != i) {
            this.courseFlag = true;
        }
        if (this.courseFlag) {
            this.filteredCourseOptions = this.formArray.get([0])
                .get('courses')
                .get([i])
                .get('courseName')!
                .valueChanges.pipe(
                    startWith(''),
                    map((value) =>
                        typeof value === 'string' ? value : value ? value.name : ''
                    ),
                    map((name) =>
                        name ? this._filterCourse(name) : this.Courses.slice()
                    )
                );
            this.courseIndex = i;
            this.courseFlag = false;
        } else if (this.courseIndex != i) {
            this.courseFlag = true;
        }
    }

    checkCatToUpdate(cat, check: boolean) {
        //console.log(cat);
        let flag: boolean = false;
        if (check) {
            for (let i of this.currentTournament['CategoriesQL']) {
                if (i.category == cat) {
                    return i.id;
                }
            }
            return UniqueIdGenerator.generate();
        } else {
            for (let i of this.currentTournament['CategoriesQL']) {
                if (i.category == cat.name) {
                    flag = this.checkUpdatesofDates(cat);
                    //console.log(flag);
                    if (flag) {
                        return i.flightSettings;
                    }
                }
            }

            this.datesPlaying = [];
            for (let j of this.dates) {
                if (j.name == cat.name) {
                    this.datesPlaying.push(j['playingDates']);
                }
            }
            //console.log(this.datesPlaying);
            return this.datesPlaying;
        }
    }

    public checkUpdatesofDates(cat): boolean {
        for (let j of this.dates) {
            if (j.name == cat.name) {
                return false;
            }
        }
        return true;
    }

    hasHoleSet1to9(courseHoleSetTitle): boolean {
        if (!this.currentTournament) return false;

        let courseHoleSets = this.currentTournament
            ? this.currentTournament.courseHoleSets
            : 0;
        let founded =
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes1to9) != 0;

        if (founded) {
            const courseHoleSet = this.formArray
                .get([0])
                .get('courseHoleSet') as FormArray;
            courseHoleSet.controls.push(new FormControl(courseHoleSetTitle));
            this.courseHoleSetCount += 1;
        }

        return founded;
    }

    hasHoleSet10to18(courseHoleSetTitle): boolean {
        if (!this.currentTournament) return false;

        let courseHoleSets = this.currentTournament
            ? this.currentTournament.courseHoleSets
            : 0;
        let founded =
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes10to18) != 0;

        if (founded) {
            const courseHoleSet = this.formArray
                .get([0])
                .get('courseHoleSet') as FormArray;
            courseHoleSet.controls.push(new FormControl(courseHoleSetTitle));
            this.courseHoleSetCount += 1;
        }

        return founded;
    }

    hasHoleSet19to27(courseHoleSetTitle): boolean {
        if (!this.currentTournament) return false;

        let courseHoleSets = this.currentTournament
            ? this.currentTournament.courseHoleSets
            : 0;
        let founded =
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes19to27) != 0;

        if (founded) {
            const courseHoleSet = this.formArray
                .get([0])
                .get('courseHoleSet') as FormArray;
            courseHoleSet.controls.push(new FormControl(courseHoleSetTitle));
            this.courseHoleSetCount += 1;
        }

        return founded;
    }

    hasHoleSet28to36(courseHoleSetTitle): boolean {
        if (!this.currentTournament) return false;

        let courseHoleSets = this.currentTournament
            ? this.currentTournament.courseHoleSets
            : 0;
        let founded =
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes28to36) != 0;

        if (founded) {
            const courseHoleSet = this.formArray
                .get([0])
                .get('courseHoleSet') as FormArray;
            courseHoleSet.controls.push(new FormControl(courseHoleSetTitle));
            this.courseHoleSetCount += 1;
        }

        return founded;
    }

    handicapCategoriesSelection(isChecked) {
        if (isChecked) {
            for (let index in this.formArray.get([0]).value.clubctgies) {
                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_AMATEURS.replace(/\s/g, '').toLowerCase()
                ) {
                    this.isAmateur = true;
                } else if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_SENIORS_AMATEUR.replace(/\s/g, '').toLowerCase()
                ) {
                    this.isSAmateur = true;
                }
            }
        } else {
            this.isAmateur = false;
            this.isSAmateur = false;
            // this.selected = false;
        }
    }

    setupMarshals(selectedValue) {
        if (selectedValue != Constants.SM_ONLY_PLAYERS) {
            this.isMarshals = true;

            // add required validator
            this.formArray
                .get([0])
                .get('marshalStart')
                .setValidators(Validators.required);
            this.formArray
                .get([0])
                .get('noofMarshals')
                .setValidators(Validators.required);
            this.formArray
                .get([0])
                .get('marshalStart')
                .updateValueAndValidity();
            this.formArray
                .get([0])
                .get('noofMarshals')
                .updateValueAndValidity();
        } else {
            this.isMarshals = false;

            // remove required validator
            this.formArray.get([0]).get('marshalStart').clearValidators();
            this.formArray.get([0]).get('noofMarshals').clearValidators();
            this.formArray
                .get([0])
                .get('marshalStart')
                .updateValueAndValidity();
            this.formArray
                .get([0])
                .get('noofMarshals')
                .updateValueAndValidity();
        }
    }

    resetClubMembers(selectedValue) {
        //console.log(selectedValue);
        this.clubMembers = [];
        this.selectedMembers = [];
        this.selection.clear();
        this.isLoading = true;
        ////console.log(this.selectedMembers);
    }

    get courseFileds() {
        return <FormArray>this.formArray.get([0]).get('courseInfo');
    }
    get subTournamentFileds() {
        return <FormArray>this.formArray.get([0]).get('subTournament');
    }

    get flightFileds() {
        return <FormArray>this.formArray.get([3]).get('flightInfo');
    }

    getCourseControl() {
        return this._formBuilder.group({
            courseName: ['', [Validators.required, RequireMatch]],
            matchFormat: [Constants.MF_STROKE_PLAY],
        });
    }

    addField() {
        const control = this.formArray.get([0]).get('courseInfo') as FormArray;
        control.push(this.getCourseControl());
    }

    deleteCourseInfo(index) {
        this.courseFileds.removeAt(index);
    }


    getSelectedPlayers() {
        //console.log(index);
        // this.flightArrangementSetup();
        this.selectedMembers = [];
        this.assignedOpponents = new Set<string>();
        for (
            let i = 0;
            i < this.formArray.get([1]).get('category').value.length;
            i++
        ) {
            if (!this.formArray.get([1]).get('category').value[i].enabled) {
                continue;
            }
            const person = {
                title: this.formArray.get([1]).get('category').value[i].name,
                Members: this.getFilteredCategory(
                    this.formArray.get([1]).get('category').value[i].name
                ),
            };

            if (typeof person.Members !== 'undefined') {
                this.selectedMembers.push(person);
            }
            //console.log(person);


            // this.formArray.get([1]).get('category').value[i].playingDate =
            //     this.checkDate(
            //         this.formArray.get([1]).get('category').value[i]
            //     );
        }
        this.currentTitle = 'Banner Setup';
        this.currentStep++;
        // if (index < this.formArray.get([1]).get('category').value.length - 1) {
        //     this.selectedIndex = ++index;
        // } else {
        //     this.valid2.reset();
        //     stepper.next();
        // }
        console.log(this.selectedMembers);
    }

    addBanner() {

        if (this.file) {
            console.log(this.file);
            console.log(this.bannerForm.getRawValue());

            let banner = {
                touranmentId: this.tournamentID,
                firstRow: this.bannerForm.get('startIndex').value,
                repetitionInterval: this.bannerForm.get('repetitions').value,
            }
            this.facadeService.updateTournamentBanner(banner, this.file).subscribe((res) => {
                if (res) {
                    this.currentTitle = 'Review & Confirm';
                    this.currentStep++;
                }
            })

        } else {
            this.currentTitle = 'Review & Confirm';
            this.currentStep++;
        }


    }

    // getFC(event, category: any) {
    //     const selectedATP = this.atp.open();
    //     selectedATP.afterClose().subscribe((t) => {
    //         this.atpTime = t;
    //         //console.log(t);
    //         //console.log(category);
    //         this.getFilteredCategory(category);
    //     });
    // }

    getFilteredCategory(PLcategory: any) {
        let selMembers: any = [];

        let FilteredPL: Player[] = [];
        let flightTime: any = '9:00 AM';
        let flightTee: any = 'AMATEURS';
        let flightTeeID: any = '1';

        let cnter = 0;
        let lanter = 0;
        let outer = 0;

        let Pdate: any = this.datePipe.transform(
            this.formArray.get([0]).value.startDateFormCtrl,
            'dd-MM-yyyy'
        );
        //console.log(Pdate);
        //Pdate=Pdate.replace('-');

        if (
            this.formArray.get([0]).value.courseInfo[0].matchFormat == 'STROKE_PLAY'
        ) {
            if (PLcategory && PLcategory != 'All') {
                FilteredPL = this.tournamentMembers.filter((a) => {
                    return a.playerCategory == PLcategory;
                });
            } else {
                FilteredPL = [...this.tournamentMembers];
            }
        } else {
            if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.TEXAS_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.FOUR_BALL_SCRAMBLE) {
                this.showTexas = true;
            } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.MATCH_PLAY) {
                this.showMatchPlay = true;
            } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.BEST_THREE
                || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.LIV || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.BEST_TWO) {
                this.showBest = true;
            }
            FilteredPL = [...this.tournamentMembers];
            if (this.showBest) {
                const teamMemberIds = this.selectedTeams
                    .flatMap(team => team.members.map(m => m.id));
                FilteredPL = FilteredPL.filter(player => teamMemberIds.includes(player.id));
            }
        }

        const FilteredFlight = this.formArray
            .get([1])
            .get('category')
            .value.filter((a) => {
                return a.name == PLcategory;
            });

        //console.log(FilteredFlight);
        //console.log(this.teamMembersToSave);
        if (FilteredFlight.length > 0) {
            let PperFlight = FilteredFlight[0].playersperFlight;
            let halfFlight = parseInt(PperFlight) / 2;

            //console.log(FilteredPL);


            if (this.showMatchPlay) {
                const validTeams = this.selectedTeams.filter(t => t.members?.length);

                if (validTeams.length === 2) {
                    const teamA = [...validTeams[0].members]; // clone array
                    const teamB = [...validTeams[1].members];

                    const perTeam = PperFlight / 2; // players per team in each flight

                    while (teamA.length >= perTeam && teamB.length >= perTeam) {

                        const flightAPlayers = teamA.splice(0, perTeam);
                        const flightBPlayers = teamB.splice(0, perTeam);

                        selMembers.push({
                            teamA: {
                                teamId: validTeams[0].id,
                                teamName: validTeams[0].name,
                                teamColor: validTeams[0].color,
                                members: flightAPlayers
                            },
                            teamB: {
                                teamId: validTeams[1].id,
                                teamName: validTeams[1].name,
                                teamColor: validTeams[1].color,
                                members: flightBPlayers
                            }
                        });
                    }
                    if (teamA.length || teamB.length) {
                        selMembers.push({
                            teamA: {
                                teamId: validTeams[0].id,
                                teamName: validTeams[0].name,
                                teamColor: validTeams[0].color,
                                members: teamA  // leftover (1)
                            },
                            teamB: {
                                teamId: validTeams[1].id,
                                teamName: validTeams[1].name,
                                teamColor: validTeams[1].color,
                                members: teamB  // leftover (1)
                            }
                        });
                    }
                }
            } else if (this.showShambles) {
                const validPairs = this.selectedPairs.filter(p => p.members?.length);

                // Sorting or leave as is
                // validPairs.sort((a, b) => a.id - b.id);

                for (let i = 0; i < validPairs.length; i += 2) {

                    // Check we have 2 pairs available for this flight
                    const pairA = validPairs[i];
                    const pairB = validPairs[i + 1];

                    if (!pairB) break; // Odd pair left without match

                    selMembers.push({
                        pairA: {
                            pairId: pairA.id,
                            pairName: pairA.name,
                            members: [...pairA.members]
                        },
                        pairB: {
                            pairId: pairB.id,
                            pairName: pairB.name,
                            members: [...pairB.members]
                        }
                    });
                }

            } else {
                FilteredPL.forEach((filteredPlayer: any) => {
                    if (cnter == 0) selMembers[outer] = [];
                });
                for (let obj of FilteredPL) {
                    if (!this.showShambles) {
                        if (cnter == 0) selMembers[outer] = [];
                        selMembers[outer][cnter] = obj;
                        if (cnter == parseInt(PperFlight) - 1) {
                            cnter = 0;
                            outer++;
                        } else {
                            cnter++;
                        }
                    }
                    // else if (this.showShambles) {
                    //     if (cnter == 0 && lanter == 0) {
                    //         selMembers[outer] = [];
                    //         selMembers[outer][cnter] = [];
                    //         selMembers[outer][cnter]['PairName'] = obj.firstName + '/' + obj.lastName;
                    //     }
                    //     if (cnter == 0 && lanter !== 0) {
                    //         selMembers[outer][lanter] = [];
                    //         selMembers[outer][lanter]['PairName'] = obj.firstName + '/' + obj.lastName;
                    //     }
                    //     selMembers[outer][lanter].push(obj);
                    //     if (cnter == 1 && lanter == 0 && selMembers[outer].length != 2) {
                    //         cnter = 0;
                    //         //outer++;
                    //         lanter++;
                    //     } else if (selMembers[outer][lanter].length == 2) {
                    //         cnter = 0;
                    //         outer++;
                    //         lanter = 0;
                    //     } else {
                    //         cnter++;
                    //     }
                    // }
                }

            }
            // ── Per-group tee & time assignment ──────────────────────────────
            const flightSettings = FilteredFlight[0];
            const startingHole: string = flightSettings.startingHole ?? '1';
            const intervalMins: number = parseInt(flightSettings.flightsInterval) || 0;
            const rawStartTime: string = flightSettings.flightStartTime ?? '08:00';

            // Parse start time into a base Date so we can add minutes arithmetically
            const baseDate = new Date(Constants.DEFAULT_DATE + ' ' + rawStartTime);

            let tempSelMembers: any[] = [];
            for (const index in selMembers) {
                tempSelMembers = [];
                tempSelMembers = selMembers;
                const groupIdx = parseInt(index);

                // ── Tee ──────────────────────────────────────────────────────
                let groupTee: number;
                if (startingHole === '1_10') {
                    groupTee = groupIdx % 2 === 0 ? 1 : 10;
                } else if (startingHole === '10') {
                    groupTee = 10;
                } else if (startingHole === 'shotgun') {
                    // Cycle through holes 1-18
                    groupTee = (groupIdx % 18) + 1;
                } else {
                    // '1' or anything else
                    groupTee = 1;
                }

                // ── Time ─────────────────────────────────────────────────────
                let groupTime: string;
                if (this.atpTime) {
                    groupTime = this.atpTime;
                } else {
                    let minutesToAdd: number;
                    if (startingHole === '1_10') {
                        // Two groups share the same slot, interval per pair
                        minutesToAdd = Math.floor(groupIdx / 2) * intervalMins;
                    } else {
                        minutesToAdd = groupIdx * intervalMins;
                    }
                    const slotDate = new Date(baseDate.getTime() + minutesToAdd * 60000);
                    const h = slotDate.getHours();
                    const m = slotDate.getMinutes();
                    groupTime = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
                }

                tempSelMembers[index]['tee'] = groupTee;
                tempSelMembers[index]['tee_id'] = groupTee;
                tempSelMembers[index]['name'] = 'Team' + index;
                tempSelMembers[index]['time'] = groupTime;
                selMembers = tempSelMembers;
            }
            //console.log(selMembers);

        }

        // }
        return selMembers;
    }

    getTeamColor(item) {
        for (const team of this.selectedTeams) {
            for (const member of team.members) {
                if (member.id === item.id) {
                    const style = {};
                    style['background-color'] = team.color;
                    return style;// Return the color of the team containing the member
                }
            }
        }
        return ''; // Return an empty string if the member is not found in any team
    }

    async refreshCourseList() {
        let dataCourses = await this.facadeService.getApprovedCoursesList();
        this.Courses = dataCourses.course;

        this.filteredCourseOptions = this.formArray
            .get([0])
            .get('courseInfo')!
            .get([0])
            .get('courseName')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) =>
                    name ? this._filterCourse(name) : this.Courses.slice()
                )
            );
    }

    openAddCourse() {
        const url = this.location.prepareExternalUrl('/courses2/add');
        window.open(url, '_blank');
    }


    multiCourseChange(value) {
        if (value) {
            this.formArray.get([0]).get('courseInfo')!.get([0]).get('courseName').clearValidators();
            const control = this.formArray.get([0]).get('courses') as FormArray;
            control.clear();
            for (let i = 1; i <= Number(this.formArray.get([0]).value.numOfRounds); i++) {
                this.addCourseField(i);
            }
        } else {
            const control = this.formArray.get([0]).get('courses') as FormArray;
            control.clear();
            this.formArray.get([0]).get('courseInfo')!.get([0]).get('courseName').addValidators(Validators.required);
        }
        this.formArray.get([0]).get('courseInfo')!.get([0]).get('courseName').updateValueAndValidity()
        value ? this.showMultipleCourses = true : this.showMultipleCourses = false;
    }



    getNextFlighttee(k: number, index: number, category, flightData?) {
        let startingHoleOption: any;
        const FilteredFlight = this.formArray
            .get([1])
            .get('category')
            .value.filter((a) => {
                return a.name == category;
            });

        startingHoleOption = FilteredFlight[0].startingHole;

        if (startingHoleOption == '1') {
            flightData.tee = 1;
            return 1;
        } else if (startingHoleOption == '10') {
            flightData.tee = 10;
            return 10;
        } else if (startingHoleOption == '1_10') {
            if (index == 0 || index % 2 == 0) {
                flightData.tee = 1;
                return 1;
            } else {
                flightData.tee = 10;
                return 10;
            }
        } else if (startingHoleOption == 'shotgun') {
            if (index == 0) {
                flightData.tee = 1;
                return 1;
            }
            let startingHole: number = parseFloat(
                (<HTMLInputElement>(
                    document.getElementById(
                        'flight_' + k + '_' + (index - 1) + '_hole'
                    )
                )).value
            );

            if (startingHole == 18) {
                flightData.tee = 1;
                return 1;
            } else flightData.tee = startingHole + 1;
            return startingHole + 1;
        } else {
        }
    }

    trackByMethod(index: number, el: any): number {
        return el.id;
    }

    getNextFlightTime(k: number, index: number, category, flightData?) {
        const FilteredFlight = this.formArray
            .get([1])
            .get('category')
            .value.filter((a) => {
                return a.name == category;
            });
        // //console.log(FilteredFlight);

        // let startingHoleOption: any = this.formArray.get([0]).value.startDateFormCtrl;

        let makeInterval: boolean = true;

        if (FilteredFlight[0].startingHole == '1_10') {
            let tee = this.getNextFlighttee(k, index, category, flightData);

            if (tee == 1) makeInterval = true;
            else makeInterval = false;
        } else if (FilteredFlight[0].startingHole == '10') {
            let tee = this.getNextFlighttee(k, index, category, flightData);
            if (tee == 10) makeInterval = true;
            else makeInterval = false;
        } else if (FilteredFlight[0].startingHole == '1') {
            let tee = this.getNextFlighttee(k, index, category, flightData);
            if (tee == 1) makeInterval = true;
            else makeInterval = false;
        }
        ////console.log("2020-01-01 " + ((index == 0)? this.formArray.get([1]).value.flightStartTime : this.preFlightTime) + "");
        let dateNow: Date = new Date(
            Constants.DEFAULT_DATE +
            ' ' +
            (index == 0
                ? FilteredFlight[0].flightStartTime
                : this.preFlightTime) +
            ''
        );
        // //console.log(FilteredFlight[0].flightStartTime);

        let arrangements: string = FilteredFlight[0].arrangements;
        if (arrangements == '0') {
            makeInterval
                ? dateNow.setMinutes(
                    dateNow.getMinutes() +
                    (FilteredFlight[0].flightsInterval && index > 0
                        ? parseInt(FilteredFlight[0].flightsInterval)
                        : 0)
                )
                : '';
            // //console.log(dateNow);

            let h = dateNow.getHours();
            let m = dateNow.getMinutes();

            this.preFlightTime =
                ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
        } else {
            makeInterval
                ? dateNow.setMinutes(
                    dateNow.getMinutes() -
                    (FilteredFlight[0].flightsInterval && index > 0
                        ? parseInt(FilteredFlight[0].flightsInterval)
                        : 0)
                )
                : '';
            // //console.log(dateNow);

            let h = dateNow.getHours();
            let m = dateNow.getMinutes();

            this.preFlightTime =
                ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
            // //console.log(this.preFlightTime);
            flightData.time = this.preFlightTime;
            return this.preFlightTime;
        }
        flightData.time = this.preFlightTime;
        return this.preFlightTime;
    }

    tournamentSetup() {
        this.stepTitle = 'Tournament Setup Form';
    }

    public close() {
        this.showDates = false;
        //console.log('sd');
    }

    flightsSetup() {
        // this.stepTitle = 'flights Setup Form';
        //this.saveTournamentMembers();
        //console.log(this.formArray.get([0]).value.courseInfo[0].matchFormat);
        if (
            this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.STROKE_PLAY
        ) {
            // let sDate = new Date(
            //     this.formArray.get([0]).value.startDateFormCtrl
            // );
            // let dteday = this.datePipe.transform(sDate, 'yyyyMMdd');
            // let date =
            //     dteday.substring(8, 6) +
            //     '-' +
            //     dteday.substring(6, 4) +
            //     '-' +
            //     +dteday.substring(0, 4);
            //console.log(this.formArray.get([0]).get('clubctgies').value);
            //console.log(date);

            if (!this.setupInitialized) {
                for (
                    let i = 0;
                    i < this.formArray.get([0]).get('clubctgies').value.length;
                    i++
                ) {
                    // for (let obj of this.dates) {
                    // if (
                    //     obj.playingDates['dates'] == date &&
                    //     this.formArray.get([0]).get('clubctgies').value[i]
                    //         .name == obj.name
                    // ) {
                    //     this.addFlightField(
                    //         this.formArray.get([0]).get('clubctgies').value[
                    //         i
                    //         ]
                    //     );
                    // }
                    if (this.formArray.get([0]).get('clubctgies').value[i].checked) {
                        this.addFlightField(this.formArray.get([0]).get('clubctgies').value[i]);
                    }
                    // }
                }
                if (this.skipCat) {
                    this.addFlightField('All');
                }

                //console.log(
                //     this.formArray.get([0]).get('clubctgies').value.length
                // );
            }
        } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat !== matchFormat.MATCH_PLAY) {
            this.addFlightField('Teams');
        }

        // //console.log(this.formArray.get([1]).get('category'));
        // if (action === 'next') stepper.next();
        // else if (action === 'back') stepper.previous();
        // else {
        // }
        //this.router.navigate(["/tournaments/view/" + this.tournamentID]);
    }

    datechanged(event, t) {
        //console.log(event);
        //console.log(t);
    }

    tournamentMembersSetup() {
        //console.log(this.stepTitle);

        this.stepTitle = 'Select Tournament Members';
        this.syncClubMembers();
        this.syncTournamentMembers();
    }

    flightArrangementSetup() {
        this.stepTitle = 'flights Arrangement';
    }

    getGrossNetTop(selectedCTName, type) {
        if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_AMATEURS.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT') return +this.formArray.get([0]).value.amateursGT;
            else return +this.formArray.get([0]).value.amateursNT;
        } else if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_SENIORS.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT') return +this.formArray.get([0]).value.seniorsGT;
            else return +this.formArray.get([0]).value.seniorsNT;
        } else if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_VETERANS.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT') return +this.formArray.get([0]).value.veteransGT;
            else return +this.formArray.get([0]).value.veteransNT;
        } else if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_JUNIORS.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT') return +this.formArray.get([0]).value.juniorsGT;
            else return +this.formArray.get([0]).value.juniorsNT;
        } else if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_LADIES.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT') return +this.formArray.get([0]).value.ladiesGT;
            else return +this.formArray.get([0]).value.ladiesNT;
        } else if (
            selectedCTName.replace(/\s/g, '').toLowerCase() ==
            Constants.CATEGORY_PROFESSIONALS.replace(/\s/g, '').toLowerCase()
        ) {
            if (type == 'GT')
                return +this.formArray.get([0]).value.professionalsGT;
            else return +this.formArray.get([0]).value.professionalsNT;
        } else return 0;
    }

    getCourseHoleSetValue() {
        let selectedHoleSet = this.formArray
            .get([0])
            .get('courseHoleSet') as FormArray;
        //console.log(this.formArray.get([0]).get('courseHoleSet'));
        let courseHoleSet: number = 0;
        for (let a of selectedHoleSet.controls) {
            let option = this.courseHoleSetNames.filter((f) => {
                return f.name == a.value;
            });
            courseHoleSet += option[0].id;
        }

        return courseHoleSet;
    }

    getFlightTime(items: any) {
        let flightTime: string = '08:00';

        try {
            if (items.time) {
                let dateNow: Date = new Date(
                    Constants.DEFAULT_DATE + ' ' + items.time.substr(0, 5)
                );

                let h = dateNow.getHours();
                let m = dateNow.getMinutes();

                flightTime = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
            }
        } catch {
            flightTime = '08:00';
        }

        return flightTime;
    }

    generateTMCode(): string {
        const prefix = 'TM';
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        return prefix + randomNumber;
    }

    async createTournament() {

        const currentGroup = this.formArray?.get([0]) as FormGroup;
        // // 1️⃣ Mark all fields touched to show errors
        if (currentGroup.invalid) {
            currentGroup.markAllAsTouched();
            return;
        }
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

        let tournamentCats: TournamentCategory[] = [];
        let tournamentRoundCourses: TournamentRoundCourses[] = [];

        let marshalsData: Marshal[] = [];

        //const tc:TournamenCategory = [];
        if (!this.tournamentID)
            this.tournamentID = UniqueIdGenerator.generate();

        if (this.showMultipleCourses) {
            if (this.formArray.get([0]).value.numOfRounds > 1) {
                for (let index in this.formArray.get([0]).value.courses) {
                    console.log(this.formArray.get([0]).value.courses[index]);
                    let course = this.formArray.get([0]).value.courses[index];
                    let courseHoleSet = course.courseHolSet?.split('_');

                    let obj: TournamentRoundCourses = {
                        round: course.round,
                        courseId: course?.courseName?.id ?? '',
                        courseHoleSets: courseHoleSet ? Number(courseHoleSet[0]) : 3,
                        inverted: courseHoleSet[1] == 'false' ? false : true,
                    }
                    tournamentRoundCourses.push(obj);
                }
            }

        }
        console.log(tournamentRoundCourses);

        for (let index in this.formArray.get([0]).value.clubctgies) {
            let TCdata: any;
            if (this.formArray.get([0]).value.clubctgies[index].checked) {
                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_AMATEURS.replace(/\s/g, '').toLowerCase()
                ) {
                    //this.TCdata.lowerLimitStart = 1;
                    //this.TCdata.lowerLimitEnd = this.formArray.get([0]).value.prizeCategoryA;

                    if (
                        this.formArray.get([0]).value.handicapCats &&
                        this.formArray.get([0]).value.prizeCategoryA != '' &&
                        this.formArray.get([0]).value.prizeCategoryB != ''
                    ) {
                        TCdata = {
                            lowerLimitStart: -1,
                            lowerLimitEnd: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryA
                                : '',
                            upperLimitStart: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryB
                                : '',
                            upperLimitEnd: 18,
                        };
                    }
                }
                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_SENIORS_AMATEUR.replace(/\s/g, '').toLowerCase()
                ) {
                    //this.TCdata.lowerLimitStart = 1;
                    //this.TCdata.lowerLimitEnd = this.formArray.get([0]).value.prizeCategoryA;

                    if (
                        this.formArray.get([0]).value.handicapCats &&
                        this.formArray.get([0]).value.prizeCategoryC != '' &&
                        this.formArray.get([0]).value.prizeCategoryD != ''
                    ) {
                        TCdata = {
                            lowerLimitStart: -1,
                            lowerLimitEnd: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryC
                                : '',
                            upperLimitStart: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryD
                                : '',
                            upperLimitEnd: 18,
                        };
                    }
                }

                let prizeInfo: any;

                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_PRO_AM.replace(/\s/g, '').toLowerCase()
                ) {
                    if (this.formArray.get([0]).value.handicapRatio) {
                        prizeInfo = {
                            handicapratio: this.formArray.get([0]).value
                                .handicapRatio,
                        };
                    }
                } else {
                    if (
                        this.getGrossNetTop(
                            this.formArray.get([0]).value.clubctgies[index].name,
                            'GT'
                        ) ||
                        this.getGrossNetTop(
                            this.formArray.get([0]).value.clubctgies[index].name,
                            'NT'
                        )
                    ) {
                        prizeInfo = {
                            noofgrosstop: this.getGrossNetTop(
                                this.formArray.get([0]).value.clubctgies[index]
                                    .name,
                                'GT'
                            ),
                            noofnettop: this.getGrossNetTop(
                                this.formArray.get([0]).value.clubctgies[index]
                                    .name,
                                'NT'
                            ), //,
                        };
                    }
                }

                let tc: any = {
                    id: UniqueIdGenerator.generate(),
                    //tournamentId: this.tournamentID,
                    category: this.formArray.get([0]).value.clubctgies[index].name,
                    handicapLimits: TCdata ? TCdata : null,
                    prizeInformation: prizeInfo ? prizeInfo : null,
                    flightSettings: this.checkDate(
                        this.formArray.get([0]).value.clubctgies[index]
                    ),
                    default: true,
                    //flightSettings: null,
                };

                tournamentCats.push(tc);
            }
        }

        for (let i = 1; i <= this.formArray.get([0]).value.noofMarshals; i++) {
            let uniquePassword: string = passwordGenerator.generate();

            let mshl: any = {
                id: UniqueIdGenerator.generate(),
                //tournamentId: this.tournamentID,
                email:
                    this.formArray.get([0]).value.marshalStart +
                    (i + '').padStart(2, '0') +
                    '@gem.com',
                password: uniquePassword,
                dateValidTill: General.parseToDate(
                    this.formArray.get([0]).value.endDateFormCtrl
                ),
                firstHole: 1,
                lastHole: 18,
            };

            marshalsData.push(mshl);
        }

        let courseHoleSetsData = this.formArray.get([0]).value.courseHoleSet;
        let handicapAllocations = {
            handicapAllocation: this.formArray.get([0]).value
                .handicapAllocations,
        };
        let arr = this.formArray.get([0]).value.pointsFormats;

        let pointsFormatsObj: any = {};

        arr.forEach((control, index) => {
            const key = index === 0 ? 'pointsFormat' : `pointsFormat${index + 1}`;
            pointsFormatsObj[key] = control.format;
        });


        // let pointsFormats { "pointsFormat": "BOTH" },
        let pointsValues = { pointsValue: this.formArray.get([0]).value.pointValue };
        //console.log(handicapAllocations);

        if (
            this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.TEXAS_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.TWO_BALL_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.THREE_BALL_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.FOUR_BALL_SCRAMBLE
        ) {
            this.showTexas = true;
        }
        if (this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.SHAMBLES || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.GREENSOME || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.FOURSOME || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormats.TWO_BALL_BEST_BALL
        ) {
            this.showShambles = true;
        }
        if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormats.MATCH_PLAY) {
            this.showMatchPlay = true;
        } else if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormats.BEST_THREE || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormats.LIV
            || this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormats.BEST_TWO) {
            this.showBest = true;
        }
        courseHoleSetsData.length > 0
            ? (courseHoleSetsData = courseHoleSetsData.split('_', 2))
            : (courseHoleSetsData = []);

        console.log(this.formArray);
        let state = this._localStorage.get(Constants.STATE);

        let courseId = this.formArray.get([0]).value.courseInfo[0]?.courseName?.course?.id ?? this.formArray.get([0]).value.courses[0]?.courseName?.id;
        if (!courseId) {
            this._fuseConfirmationService.open({
                title: 'Error',
                message: 'Please select a course to proceed or add a new course.',
                actions: {
                    cancel: {
                        show: false,
                    },
                    confirm: {
                        label: 'Add Course',
                    },
                },
            }).afterClosed().subscribe((result) => {
                if (result === 'confirmed') {
                    this.openAddCourse();
                }
            })
        } else {
            this.joinCode = this.generateTMCode();
            let tournament = {
                id: (this.tournamentID) ? this.tournamentID : UniqueIdGenerator.generate(),
                clubId: !this._localStorage.isClubAdmin() && !this._localStorage.isSuperAdmin() ? null : this.formArray.get([0]).value.clubsFormCtrl.id,
                leagueId: state == Constants.LEAGUE ? this._localStorage.get(Constants.LEAGUE_ID) : null,
                courseId: courseId,
                adminId: this.loggedInuser.id,
                title: this.formArray.get([0]).value.titleFormCtrl,
                prefix: this.formArray.get([0]).value.prefixFormCtrl,
                courseHoleSets:
                    courseHoleSetsData.length > 0
                        ? Number(courseHoleSetsData[0])
                        : 0,
                teamMatch: this.formArray.get([0]).value.teamMatch == '1' ? false : true,
                pairsMatch: false,
                inviteCode: this.joinCode,
                interLeague: false,
                playingOnWhs: false,
                publicTournament: false,
                confirmParticipants: this.formArray.get([0]).value.askConfirmation,
                noOfRounds: this.formArray.get([0]).value.numOfRounds,
                activeRound: 1,
                skipCategory: this.skipCat,
                matchFormat: this.formArray.get([0]).value.courseInfo[0].matchFormat,
                multiFormat: this.formArray.get([0]).value.courseInfo[0].multiFormat ==
                    'SINGLE'
                    ? false
                    : true,
                pointsFormats: this.showMatchPlay ? pointsFormatsObj : null,
                subTournament: false,
                pointsValues: pointsValues,
                handicapAllocations: handicapAllocations,
                tee: 'AMATEURS',
                marshalsStartWith: this.formArray.get([0]).value.marshalStart,
                noOfMarshals: this.formArray.get([0]).value.noofMarshals,
                tee_id: 1,
                scoreManagement: this.formArray.get([0]).value.scoreManagement,
                startDate: General.parseToDate(
                    this.formArray.get([0]).value.startDateFormCtrl
                ),
                endDate: General.parseToDate(
                    this.formArray.get([0]).value.endDateFormCtrl
                ),
                flightsCategory: null,
                started: true,
                invited: false,
                singleRound: false,
                sponsorName: '',
                sponsorLogo: '',
                mobileLogoUrl: '',
                strokeAllocation: this.formArray.get([0]).value.strokeAllocations,
                webLogoUrl: '',
                courseHoleSetsInverted:
                    courseHoleSetsData.length > 0
                        ? courseHoleSetsData[1] == 'true'
                            ? true
                            : false
                        : false,
                categories: tournamentCats,
                isSetupComplete: false,
                currentTab: 1,
                createdAt: new Date().toISOString(),
                marshals: marshalsData,
                flights: [],
                members: [],
                tourId: state == Constants.TOUR ? this._localStorage.get(Constants.TOUR_ID) : null,
                tournament_round_courses: tournamentRoundCourses,
                secondFormat: this.showSubtournament ? this.formArray.get([0]).value.secondFormat : null,
            };

            //console.log(tournament);

            let result = <any>(
                await this.facadeService.createTournamentMarshals(marshalsData)
            );

            if (this.formArray.get([0]).value.prefixFormCtrl) {
                let checkPrfix: any = [];
                checkPrfix = <Tournament>(
                    await this.facadeService.checkPrefix(
                        this.formArray.get([0]).value.prefixFormCtrl
                    )
                );

                //console.log(checkPrfix);

                if (checkPrfix.length > 0) {
                    this.snackBar.open('Prefix already exist.', 'x', {
                        duration: 5000,
                    });
                } else {
                    let result = <any>(
                        await this.facadeService.addTournament(tournament)
                        // //console.log('a')
                    );
                    this.currentTournament = tournament;
                    //console.log(result);
                    if (result) {
                        this.editTournament = true

                        // this.valid2.reset();
                        this.setState(this.valid1, false);
                        this.setState(this.valid2, false);

                        // if (
                        //     this.showSubtournament == true
                        // ) {
                        //     this.createSubtournament(this.tournamentID);
                        // }
                        this.valid1.reset();
                        this.valid2.reset();
                        this.registrationLink = 'https://app.gemgolfers.com/signUpForm/' + this.tournamentID;
                        this.showSuccessPopup = true;
                        // this.snackBar.open('Tournament has been created.', 'x', {
                        //     duration: 3000,
                        // });
                        // this.valid2.reset();


                        let selectedClubId: string =
                            this._localStorage.isClubAdmin()
                                ? this.loggedInuser.adminClubId
                                : this.formArray.get([0]).value.clubsFormCtrl
                                    .id;
                        //console.log(selectedClubId);
                        //console.log(
                        //     this.formArray.get([0]).get('clubctgies').value
                        // );


                        this.refreshPlayerList(selectedClubId)

                        //console.log(this.clubMembers);

                        this.currentTournament = tournament;

                        // stepper.next();
                        // this.currentTitle = 'Select Players';
                        // this.currentStep++;
                        console.log(this.clubMembers);

                        //this.dataSource = new MatTableDataSource(this.clubMembers);

                    }
                    // if (result) {


                    //   const dialogRef = this.dialog.open(DialogOverviewComponent, {
                    //     width: "350px",
                    //     data: "Do you want to Add Members Now ?",
                    //   });
                    //   dialogRef.afterClosed().subscribe((result) => {
                    //     if (result) {
                    //       this.snackBar.open("Tournament has been created.", "x", {
                    //         duration: 5000,
                    //       });
                    //       this.router.navigate([
                    //         "/tournaments/manage/" + this.tournamentID,
                    //       ]);
                    //     } else {
                    //       this.snackBar.open("Tournament has been created.", "x", {
                    //         duration: 5000,
                    //       });
                    //       this.router.navigate(["/tournaments/view/" + this.tournamentID]);
                    //     }
                    //   });

                    //   this.reset();
                    //   this.router.navigate(['/tournaments/view/' + this.tournamentID]);
                    // }
                }
            }
        }

    }

    async refreshPlayerList(selectedClubId: string) {
        let state = this._localStorage.get(Constants.STATE);
        // this.clubMembers = [];

        const addUniquePlayer = (player: any) => {
            const existsInClubMembers = this.clubMembers.some(p => p.id === player.id);
            const existsInTable = this.membersSource?.data?.some(p => p.id === player.id);

            if (!existsInClubMembers && !existsInTable) {
                this.clubMembers.push(player);
            }
        };

        if (this._localStorage.isTourAdmin() || this._localStorage.isLeagueAdmin()) {

            if (state === Constants.TOUR) {
                selectedClubId = this._localStorage.get(Constants.TOUR_ID);
                const data: any = await this.facadeService.getPlayersListByTour(selectedClubId);

                data.tour_member.forEach(m => addUniquePlayer(m.player));

            } else if (state === Constants.LEAGUE) {
                selectedClubId = this._localStorage.get(Constants.LEAGUE_ID);
                const data: any = await this.facadeService.getPlayersListByLeague(selectedClubId);

                data.league_member.forEach(m => addUniquePlayer(m.player));
            }

        } else if (this._localStorage.isSuperAdmin() || this._localStorage.isClubAdmin()) {
            const data: any = await this.facadeService.getPlayerByClub(selectedClubId);
            const professionalData: any = await this.facadeService.getProfessionalByClub(selectedClubId);

            data.club_member.forEach(m => addUniquePlayer(m.player));
            professionalData.club_professional.forEach(m => addUniquePlayer(m.player));

        } else if (this._localStorage.isTournamentManager()) {
            const data: any = await this.facadeService.getPlayersByID(this.loggedInuser.id);

            data.player.forEach(p => addUniquePlayer(p));

            let dataFullTournaments: any;

            dataFullTournaments =
                await this.facadeService.getTournamentMembers(
                    this.tournamentID
                );
            //console.log(dataFullTournaments);
            // this.tournamentMembers = [];
            for (let p of dataFullTournaments.TournamentMemberQL) {
                const player = p.player;

                const exists =
                    this.tournamentMembers.some(m => m.id === player.id) ||
                    this.membersSource?.data?.some(m => m.id === player.id);

                if (!exists) {
                    this.tournamentMembers.push(player);
                }
            }

            //Add the tournament members to membersSource table and also need to get previous data in table
            const tournamentIds = new Set(
                this.tournamentMembers.map(p => p.id)
            );

            const filteredMembersSource = (this.membersSource?.data ?? []).filter(
                p => !tournamentIds.has(p.id)
            );

            this.membersSource = new MatTableDataSource([
                ...this.tournamentMembers,
                ...filteredMembersSource
            ]);

        }

        this.syncClubMembers();
        // this.syncTournamentMembers();
    }


    async editTournaments() {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        let tournamentCats: TournamentCategory[] = [];
        let tournamentRoundCourses: TournamentRoundCourses[] = [];

        let marshalsData: Marshal[] = [];

        if (this.showMultipleCourses) {
            if (this.formArray.get([0]).value.numOfRounds > 1) {
                for (let index in this.formArray.get([0]).value.courses) {
                    console.log(this.formArray.get([0]).value.courses[index]);
                    let course = this.formArray.get([0]).value.courses[index];
                    let courseHoleSet = course.courseHolSet?.split('_');

                    let obj: TournamentRoundCourses = {
                        round: course.round,
                        courseId: course?.courseName?.id ?? '',
                        courseHoleSets: courseHoleSet ? Number(courseHoleSet[0]) : 3,
                        inverted: courseHoleSet[1] == 'false' ? false : true,
                    }
                    tournamentRoundCourses.push(obj);
                }
            }

        }
        for (let index in this.formArray.get([0]).value.clubctgies) {
            if (this.formArray.get([0]).value.clubctgies[index].checked) {
                let TCdata: any;
                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_AMATEURS.replace(/\s/g, '').toLowerCase()
                ) {
                    //this.TCdata.lowerLimitStart = 1;
                    //this.TCdata.lowerLimitEnd = this.formArray.get([0]).value.prizeCategoryA;

                    if (this.formArray.get([0]).value.handicapCats) {
                        TCdata = {
                            lowerLimitStart: 1,
                            lowerLimitEnd: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryA
                                : '',
                            upperLimitStart: this.formArray.get([0]).value
                                .handicapCats
                                ? this.formArray.get([0]).value.prizeCategoryB
                                : '',
                            upperLimitEnd: 18,
                        };
                    }
                }

                let prizeInfo: any;

                if (
                    this.formArray
                        .get([0])
                        .value.clubctgies[index].name.replace(/\s/g, '')
                        .toLowerCase() ==
                    Constants.CATEGORY_PRO_AM.replace(/\s/g, '').toLowerCase()
                ) {
                    if (this.formArray.get([0]).value.handicapRatio) {
                        prizeInfo = {
                            handicapratio: this.formArray.get([0]).value
                                .handicapRatio,
                        };
                    }
                } else {
                    if (
                        this.getGrossNetTop(
                            this.formArray.get([0]).value.clubctgies[index].name,
                            'GT'
                        ) ||
                        this.getGrossNetTop(
                            this.formArray.get([0]).value.clubctgies[index].name,
                            'NT'
                        )
                    ) {
                        prizeInfo = {
                            noofgrosstop: this.getGrossNetTop(
                                this.formArray.get([0]).value.clubctgies[index]
                                    .name,
                                'GT'
                            ),
                            noofnettop: this.getGrossNetTop(
                                this.formArray.get([0]).value.clubctgies[index]
                                    .name,
                                'NT'
                            ), //,
                        };
                    }
                }

                let tc: any = {
                    id: this.tournamentID
                        ? this.checkCatToUpdate(
                            this.formArray.get([0]).value.clubctgies[index].name,
                            true
                        )
                        : UniqueIdGenerator.generate(),
                    tournamentId: this.tournamentID,
                    category: this.formArray.get([0]).value.clubctgies[index].name,
                    handicapLimits: TCdata ? TCdata : null,
                    prizeInformation: prizeInfo ? prizeInfo : null,
                    flightSettings: this.checkDate(
                        this.formArray.get([0]).value.clubctgies[index]
                    ),
                    default: true,
                    //flightSettings: null,
                };
                //console.log(tc);
                // let json= JSON.stringify(tc.flightSettings);

                // tc["flightSettings"]=json;
                //console.log(tc);
                tournamentCats.push(tc);
                //console.log(tournamentCats);
            }
        }
        if (
            this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.TEXAS_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.TWO_BALL_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.THREE_BALL_SCRAMBLE || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.FOUR_BALL_SCRAMBLE

        ) {
            this.showTexas = true;
        }
        if (this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.SHAMBLES || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.GREENSOME || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.FOURSOME || this.formArray.get([0]).value.courseInfo[0].matchFormat ==
            matchFormat.TWO_BALL_BEST_BALL
        ) {
            this.showShambles = true;
        }
        for (let i = 1; i <= this.formArray.get([0]).value.noofMarshals; i++) {
            let uniquePassword: string = passwordGenerator.generate();

            let mshl: any = {
                id: UniqueIdGenerator.generate(),
                tournamentId: this.tournamentID,
                email:
                    this.formArray.get([0]).value.marshalStart +
                    (i + '').padStart(2, '0') +
                    '@gem.com',
                password: uniquePassword,
                dateValidTill: General.parseToDate(
                    this.formArray.get([0]).value.endDateFormCtrl
                ),
                firstHole: 1,
                lastHole: 18,
            };

            marshalsData.push(mshl);
        }

        let courseHoleSetsData = this.formArray.get([0]).value.courseHoleSet;

        courseHoleSetsData.length > 0
            ? (courseHoleSetsData = courseHoleSetsData.split('_', 2))
            : (courseHoleSetsData = []);
        let handicapAllocations = {
            handicapAllocation: this.formArray.get([0]).value
                .handicapAllocations,
        };

        let arr = this.formArray.get([0]).value.pointsFormats;

        let pointsFormatsObj: any = {};

        arr.forEach((control, index) => {
            const key = index === 0 ? 'pointsFormat' : `pointsFormat${index + 1}`;
            pointsFormatsObj[key] = control.format;
        });
        let state = this._localStorage.get(Constants.STATE);
        let tournament = {
            id: this.tournamentID,
            clubId: !this._localStorage.isClubAdmin() && !this._localStorage.isSuperAdmin() ? null : this.formArray.get([0]).value.clubsFormCtrl.id,
            leagueId: state == Constants.LEAGUE ? this._localStorage.get(Constants.LEAGUE_ID) : null,
            courseId: this.formArray.get([0]).value.courseInfo[0]?.courseName?.id ?? this.formArray.get([0]).value.courseInfo[0]?.courseName?.course?.id,
            adminId: this.loggedInuser.id,
            title: this.formArray.get([0]).value.titleFormCtrl,
            prefix: this.formArray.get([0]).value.prefixFormCtrl,
            courseHoleSets:
                courseHoleSetsData.length > 0
                    ? Number(courseHoleSetsData[0])
                    : 0,
            teamMatch: this.formArray.get([0]).value.courseInfo[0].teamMatch == '1' ? false : true,
            pairsMatch: false,
            interLeague: false,
            playingOnWhs: false,
            publicTournament: false,
            confirmParticipants: this.formArray.get([0]).value.askConfirmation,
            noOfRounds: this.formArray.get([0]).value.numOfRounds,
            activeRound: 1,
            matchFormat: this.formArray.get([0]).value.courseInfo[0]
                .matchFormat,
            multiFormat:
                this.formArray.get([0]).value.courseInfo[0].multiFormat ==
                    'SINGLE'
                    ? false
                    : true,
            pointsFormats: this.showMatchPlay ? pointsFormatsObj : null,
            pointsValues: { "pointsValue": 1 },
            handicapAllocations: handicapAllocations,
            tee: 'AMATEURS',
            tee_id: 1,
            scoreManagement: this.formArray.get([0]).value.scoreManagement,
            marshalsStartWith: this.formArray.get([0]).value.marshalStart,
            noOfMarshals: this.formArray.get([0]).value.noofMarshals,
            startDate: General.parseToDate(
                this.formArray.get([0]).value.startDateFormCtrl
            ),
            endDate: General.parseToDate(
                this.formArray.get([0]).value.endDateFormCtrl
            ),
            flightsCategory: null,
            started: true,
            invited: false,
            singleRound: false,
            sponsorName: '',
            sponsorLogo: '',
            mobileLogoUrl: '',
            webLogoUrl: '',
            courseHoleSetsInverted:
                courseHoleSetsData.length > 0
                    ? courseHoleSetsData[1] == 'true'
                        ? true
                        : false
                    : false,
            tourId: state == Constants.TOUR ? this._localStorage.get(Constants.TOUR_ID) : null,
            tournament_round_courses: tournamentRoundCourses,
        };
        //console.log(tournament);
        //console.log(tournamentCats);
        //console.log(marshalsData);

        let result = <boolean>(
            await this.facadeService.editTournament(
                tournament,
                tournamentCats,
                marshalsData
            )
        );
        if (result) {
            this.snackBar.open('Tournament has been updated.', 'x', {
                duration: 5000,
            });
            this.goToStep('Select Players', 2);
        } else {
            this.snackBar.open('Error! Try Again later.', 'x', {
                duration: 5000,
            });
        }
    }

    syncTournamentMembers() {
        of(this.tournamentMembers)
            .pipe()
            .subscribe(
                (data) => {
                    this.isLoading = false;
                    //console.log(this.tournamentMembers);
                    // this.tournamentMembers.forEach(
                    //   (obj, i) => (obj["fullName"] = obj.firstName + " " + obj.lastName)
                    // );
                    this.membersSource = new MatTableDataSource(
                        this.tournamentMembers
                    );
                    this.membersSource.sort = this.Memsort;
                    this.membersSource.paginator = this.Mempaginator;

                    this.updateTMCategorySelection();
                },
                (error) => (this.isLoading = false)
            );
    }

    syncTournamentTeamMembers() {
        this.isLoading = true;

        of(this.tournamentMembers)
            .pipe()
            .subscribe(
                (data) => {
                    this.isLoading = false;

                    // 1️⃣ Collect all player IDs that are already in selectedTeams
                    const teamMemberIds = new Set<any>();
                    this.selectedTeams.forEach((team) => {
                        team.members.forEach((member) => {
                            teamMemberIds.add(member.id);
                        });
                    });

                    // 2️⃣ Filter tournamentMembers to exclude those already in teams
                    const availableMembers = this.tournamentMembers.filter(
                        (member) => !teamMemberIds.has(member.id)
                    );

                    // 3️⃣ Assign to MatTableDataSource
                    this.membersTeamSource = new MatTableDataSource(availableMembers);
                    this.membersTeamSource.sort = this.Memsort;
                    this.membersTeamSource.paginator = this.Mempaginator;
                },
                (error) => {
                    this.isLoading = false;
                }
            );
    }

    downloadSample() {
        // Create sample data
        // this.logger.info("User click on bulk import sample");
        const data = [
            { FirstName: 'John', LastName: 'David', Email: 'jhon@gmail.com', Category: 'Amateurs', Handicap: '12' },
            { FirstName: 'Ana', LastName: 'Fed', Email: 'ana@gmail.com', Category: 'Ladies', Handicap: '11' }, // Add more rows as needed
        ];

        // Create worksheet
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

        // Create workbook
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Save file
        XLSX.writeFile(wb, 'sample_file.xlsx');
        // this.logger.info("Bulk import sample downloaded successfully");
    }

    parseFlightsData(event) {
        try {
            this.logger.log("User click on bulk import", 'info', event);

            if (event.target.files.length > 0) {
                this.file = event.target.files[0];
                // this.logger.log(this.file);
            }
            let fileReader = new FileReader();
            // this.accounts = [];

            fileReader.onload = (e) => {
                this.arrayBuffer = fileReader.result;
                var data = new Uint8Array(this.arrayBuffer);
                var arr = new Array();
                for (var i = 0; i != data.length; ++i)
                    arr[i] = String.fromCharCode(data[i]);
                var bstr = arr.join('');
                var workbook = read(bstr, { type: 'binary' });
                var first_sheet_name = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[first_sheet_name];
                this.arrayBuffer = utils.sheet_to_json(worksheet, {
                    raw: true,
                    defval: '',
                });

                // this.logger.log(this.playersData);
                console.log(this.arrayBuffer);

                // this.importExcelData();
                //this.providerservice.importexcel(this.exceljsondata).subscribe(data=>{
                //})
            };
            fileReader.readAsArrayBuffer(this.file);
        } catch (error) {
            this.logger.log("Error in bulk import", 'error', error);
        }
    }

    // async importExcelData() {
    //     try {
    //         this.importingList = true;

    //         this.savePlayers = [];
    //         this.duplicatePlayers = [];
    //         let clubMember: ClubMembership[] = [];

    //         // for (let p of this.playersData) {
    //         //   // this.logger.logObject(p);
    //         //   console.log(p);

    //         //   let exist: any = [];

    //         //   if (p.membershipNumber) {
    //         //     // this.logger.log(p.membershipNumber);
    //         //     console.log(p.membershipNumber);

    //         //     exist = await this.facadeService.getPlayerByMembershipNumber(
    //         //       p.membershipNumber.toString()
    //         //     );

    //         //     if (exist.length > 0) {
    //         //       if (exist[0].handicapQL.length > 0) {
    //         //         let handicapHistory = exist[0].handicapQL;
    //         //         let lastTournamentID =
    //         //           handicapHistory[handicapHistory.length - 1].tournamentId;
    //         //         console.log(lastTournamentID);

    //         //         const handicapChangeLog =
    //         //           await this.facadeService.updateLastHandicap(
    //         //             exist[0].id,
    //         //             lastTournamentID,
    //         //             p.handicap
    //         //           );
    //         //         console.log(handicapChangeLog);
    //         //       }

    //         //       let succes = await this.facadeService.updatePlayerHandicap(
    //         //         exist[0].id,
    //         //         p.handicap
    //         //       );

    //         //       this.duplicatePlayers.push(exist);
    //         //       //continue;
    //         //     }
    //         //   }
    //         // }
    //         // console.log(this.duplicatePlayers);

    //         for (let p of this.arrayBuffer) {
    //             // this.logger.logObject(p);
    //             console.log(p);

    //             let exist: any = [];

    //             // if (p.membershipNumber) {
    //             //     // this.logger.log(p.membershipNumber);
    //             //     console.log(p.membershipNumber);

    //             //     exist = await this.facadeService.getPlayerByMembershipNumber(
    //             //         p.membershipNumber.toString()
    //             //     );

    //             //     if (exist.length > 0) {
    //             //         this.duplicatePlayers.push(p);
    //             //         //continue;
    //             //     }
    //             // }

    //             // if (p.phone && exist.length == 0) {
    //             //     // this.logger.log(p.phone);
    //             //     console.log(p.phone);
    //             //     let phone;
    //             //     if (p.phone.toString().indexOf("+92") === 0) {
    //             //         phone = p.phone.toString();
    //             //     } else if (p.phone.toString().indexOf("0") === 0) {
    //             //         phone = p.phone.toString().replace(0, "+92");
    //             //     } else if (p.phone.toString().indexOf("3") === 0) {
    //             //         phone = "+92" + p.phone.toString();
    //             //     }
    //             //     console.log(phone);

    //             //     exist = await this.facadeService.getPlayerByPhone(phone);
    //             //     // p.phone.toString().indexOf("+") !== -1
    //             //     // ? p.phone.toString()
    //             //     // : "+" + p.phone.toString()
    //             //     if (exist.length > 0) {
    //             //         this.duplicatePlayers.push(p);
    //             //         //continue;
    //             //     }
    //             // }

    //             if (p.email && exist.length == 0) {
    //                 exist = await this.facadeService.getPlayerByEmail(p.email.toString());

    //                 if (exist.length > 0) {
    //                     // this.logger.log("email yes");
    //                     console.log("email Yes");

    //                     this.duplicatePlayers.push(p);
    //                     //continue;
    //                 }
    //             }

    //             // this.logger.log(exist);
    //             console.log(exist);

    //             let UniqueId: string =
    //                 exist && exist.length > 0
    //                     ? exist[0].id
    //                     : UniqueIdGenerator.generate();

    //             //if(p.club) {
    //             if (this._localStorage.isClubAdmin()) {
    //                 let member: any = {
    //                     clubId: this.loggedInuser.clubId,
    //                     playerId: UniqueId,
    //                 };
    //                 clubMember.push(member);
    //             }

    //             if (this._localStorage.isSuperAdmin()) {
    //                 let member: any = {
    //                     clubId: this.formArray.get([0]).value.clubsFormCtrl.id;
    //                     playerId: UniqueId,
    //                 };
    //                 clubMember.push(member);
    //             }
    //             //}

    //             let player: any = {
    //                 id: UniqueId,
    //                 adminClubId: null,
    //                 firebaseUid: null,
    //                 fcmToken: null,
    //                 gemId: null,
    //                 firstName: p.firstName,
    //                 lastName: p.lastName,
    //                 gender: p.gender ? p.gender : null,
    //                 dob: p.dob ? p.dob : null,
    //                 picture: p.picture ? p.picture : null,
    //                 email: p.email ? p.email : null,
    //                 phone: p.phone ? p.phone : null,
    //                 playerCategory: p.category ? p.category : null,
    //                 handicap: p.hc ? p.hc : 0,
    //                 online: false,
    //                 countryCode: p.code ? p.code : null,
    //                 extraData: p.extra ? p.extra : null,
    //                 membershipNumber: p.membershipNumber,
    //                 userRole: 3,
    //                 membership: null,
    //             };

    //             this.savePlayers.push(player);
    //         }

    //         // this.logger.log(this.savePlayers);
    //         // this.logger.log(this.duplicatePlayers);
    //         console.log(this.savePlayers);

    //         let status = await this.facadeService.importPlayerList(
    //             this.savePlayers,
    //             clubMember
    //         );

    //         if (status) {
    //             let newProfiles =
    //                 Number(this.savePlayers.length) -
    //                 Number(this.duplicatePlayers.length);
    //             this.snackBar.open(
    //                 (newProfiles < 0 ? 0 : newProfiles) +
    //                 " players have been created. " +
    //                 this.duplicatePlayers.length +
    //                 " player(s) were already exist.",
    //                 "x",
    //                 {
    //                     duration: 5000,
    //                 }
    //             );

    //             // this.importingList = false;
    //             this.file = null;
    //             // this.fileInputVariable.nativeElement.value = "";

    //             // await this.delay(5000);
    //             //window.location.reload();
    //         } else {
    //             this.snackBar.open("There was an Error while loading file", "x", {
    //                 duration: 3000,
    //             });
    //             // this.importingList = false;
    //         }
    //     } catch {
    //         // this.importingList = false;
    //     }
    // }

    async saveTournamentMember() {
        let tournamentMember: TournamentMember[] = [];
        let invalidPlayers = [];
        let selectedCategories = this.formArray.get([0]).get('clubctgies').value.filter(a => a.checked == true).map(z => z.name);
        console.log(selectedCategories);

        // let selectionArray = Object.assign({}, this.selection.selected);

        for (let index in this.membersSource.data) {
            if (this.membersSource.data[index]) {
                const player = this.membersSource.data[index];

                if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.STROKE_PLAY && selectedCategories.length > 0) {
                    if (!player) continue;

                    const allowedCategory = selectedCategories.includes(player.playerCategory);

                    if (!allowedCategory) {
                        invalidPlayers.push(player);
                        continue; // Skip this player
                    }
                }

                let founded = this.tournamentMembers.filter((a) => {
                    return a.id == this.membersSource.data[index].id;
                });
                // console.log(this.membersSource.data[index]);

                if (founded.length == 0) {
                    let member: any = {
                        tournamentId: this.tournamentID,
                        playerId: this.membersSource.data[index].id,
                        category: this.membersSource.data[index].playerCategory,
                        status: true,
                    };
                    this.tournamentMembers.push(this.membersSource.data[index]);
                    tournamentMember.push(member);
                }

                // if (this.showSubtournament) {
                //     let member: any = {
                //         tournamentId: this.subTournamentID,
                //         playerId: this.membersSource.data[index].id,
                //         category: this.membersSource.data[index].playerCategory,
                //         status: true,
                //     };
                //     tournamentMember.push(member);
                // }

                //console.log(counter);

                //console.log(selectionArray);
            }
        }

        if (this.formArray.get([0]).value.courseInfo[0].matchFormat == matchFormat.STROKE_PLAY && invalidPlayers.length > 0) {
            this.tournamentMembers = [];
            this.dialog.open(InvalidCategoryPlayersComponent, {
                width: '600px',
                data: {
                    players: invalidPlayers,
                    categories: selectedCategories,
                }
            }).afterClosed().subscribe((res) => {
                console.log(res);

                if (res && res.length > 0) {
                    res.forEach(resPlayer => {
                        const memberIndex = this.membersSource.data.findIndex(
                            player => player.id === resPlayer.id
                        );
                        if (memberIndex !== -1) {
                            this.membersSource.data[memberIndex].playerCategory = resPlayer.playerCategory;
                        }
                    });
                    this.membersSource._updateChangeSubscription();
                }
            });
            // this.currentStep = 2;
            // this.currentTitle = 'Select Players';
            return; // stop saving process
        }
        this.showCategory = false;
        ////console.log(this.categoryCounts[0]);

        //this.categoryCounts[0].value = this.categoryCounts[0].value - counter;
        ////console.log(this.categoryCounts[0].value);

        //console.log(tournamentMember);

        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentMember)
        );
        if (this.dataSource.data.length > 0) {
            this.dataSource.data.forEach(async (element) => {
                await this.facadeService.deleteTournamentMember(this.tournamentID, element.id)
            });
        }

        if (result) {
            // const dialogRef = this.dialog.open(DialogOverviewComponent, {
            //     width: '350px',
            //     data: 'Do you want to add more members?',
            // });
            // dialogRef.afterClosed().subscribe((resultA) => {
            //     if (!resultA) {
            //         const control = this.formArray.get([1]).get('category') as FormArray;

            //         //console.log(control.length);

            //         control.clear();
            //         if (
            //             this.formArray.get([0]).value.courseInfo[0]
            //                 .matchFormat == matchFormat.STROKE_PLAY
            //         ) {

            //             let sDate = new Date(
            //                 this.formArray.get([0]).value.startDateFormCtrl
            //             );
            //             let dteday = this.datePipe.transform(sDate, 'yyyyMMdd');
            //             let date =
            //                 dteday.substring(8, 6) +
            //                 '-' +
            //                 dteday.substring(6, 4) +
            //                 '-' +
            //                 +dteday.substring(0, 4);
            //             //console.log(date);

            //             for (
            //                 let i = 0;
            //                 i <
            //                 this.formArray.get([0]).get('clubctgies').value
            //                     .length;
            //                 i++
            //             ) {
            //                 for (let obj of this.dates) {
            //                     if (
            //                         obj.playingDates['dates'] == date &&
            //                         this.formArray
            //                             .get([0])
            //                             .get('clubctgies').value[i].name ==
            //                         obj.name
            //                     ) {
            //                         this.addFlightField(
            //                             this.formArray
            //                                 .get([0])

            //                                 .get('clubctgies').value[i]
            //                         );

            //                     }
            //                 }
            //             }
            //             this.setupInitialized = true;

            //         } else if (this.formArray.get([0]).value.courseInfo[0]
            //             .matchFormat != matchFormat.MATCH_PLAY) {
            //             this.addFlightField('Teams');
            //         }

            //         stepper.next();
            //     }
            // });
            // this.snackBar.open('Tournament members have been saved.', 'x', {
            //     duration: 5000,
            // });
            if (!this.currentTournament.isSetupComplete) {
                await this.facadeService.setTournamentStep(this.tournamentID, 2, false);
            }
            if (this.showMatchPlay || this.showBest) {
                this.currentTitle = 'Select Teams';
            } else if (this.showShambles) {
                this.currentTitle = 'Select Pairs';
            } else {
                this.currentTitle = 'Groups Setup';
            }
            this.currentStep++;
            await this.flightsSetup();
            // this.valid1.reset();
            this.syncTournamentMembers();
            this.syncTournamentTeamMembers();
            this.syncClubMembers();
            this.categoryCounts = [];

            // //console.log(
            //     this.formArray.get([0]).get('clubctgies').value.length
            // );
            // for (
            //     let i = 0;
            //     i < this.formArray.get([0]).get('clubctgies').value.length;
            //     i++
            // ) {
            //     this.addplayingDate(i);
            // }

            //}
        }
    }

    paneltToggle(event) {
        this.skipCat = !this.skipCat;
    }

    saveTournamentMembers() {
        let selectionArray = Object.assign({}, this.selection.selected);
        let members: any[] = [];

        for (let index in selectionArray) {
            if (selectionArray[index]) {
                // Check if member is already in this.membersSource.data and tournamentMembers

                const founded = this.tournamentMembers.filter((a) => {
                    return a.id == selectionArray[index].id;
                });
                const founded2 = (this.membersSource?.data || []).filter((a) => {
                    return a.id == selectionArray[index].id;
                });
                if (founded.length === 0 && founded2.length === 0) {
                    members.push(selectionArray[index]);
                }
            }
        }

        // 🔹 Merge existing data with new members
        const existingData = this.membersSource?.data || [];
        const updatedData = [...existingData, ...members];
        if (!this.membersSource) {
            this.membersSource = new MatTableDataSource(updatedData);
        } else {
            // 🔹 Reassign merged data to the data source
            this.membersSource.data = updatedData;
        }

        // Optional: update sorting and pagination references
        this.membersSource.sort = this.Memsort;
        this.membersSource.paginator = this.Mempaginator;

        this.clubMembers = this.clubMembers.filter(
            (clubMember) => !members.some((added) => added.id === clubMember.id)
        );

        if (this.dataSource) {
            this.dataSource.data = this.dataSource.data.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
            this.dataSource._updateChangeSubscription();
        }
        this.selection.clear();
    }

    saveAllTournamentMembers() {
        let clubMembers = this.dataSource.data;
        let members = [];
        for (let index in clubMembers) {
            if (clubMembers[index]) {
                let founded = this.tournamentMembers.filter((a) => {
                    return a.id == clubMembers[index].id;
                });
                if (founded.length == 0) {
                    members.push(clubMembers[index]);
                }
            }
        }
        // 🔹 Merge existing data with new members
        const existingData = this.membersSource?.data || [];
        const updatedData = [...existingData, ...members];

        if (!this.membersSource) {
            this.membersSource = new MatTableDataSource(updatedData);

        } else {
            // 🔹 Reassign merged data to the data source
            this.membersSource.data = updatedData;
        }
        this.membersSource.data.forEach(member => {
            this.countCategoryMember(true, member);
        });
        // Optional: update sorting and pagination references
        this.membersSource.sort = this.Memsort;
        this.membersSource.paginator = this.Mempaginator;

        this.clubMembers = this.clubMembers.filter(
            (clubMember) => !members.some((added) => added.id === clubMember.id)
        );
        this.selection.clear();
        if (this.dataSource) {
            this.dataSource.data = this.dataSource.data.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
            this.dataSource._updateChangeSubscription();
        }
    }

    removeSelectedMembers() {
        let selectionArray = Object.assign({}, this.memberSelection.selected);
        let members = [];
        for (let index in selectionArray) {
            if (selectionArray[index]) {
                let founded = this.clubMembers.filter((a) => {
                    return a.id == selectionArray[index].id;
                });
                if (founded.length == 0) {
                    members.push(selectionArray[index]);
                }
            }
        }
        // 🔹 Merge existing data with new members
        const existingData = this.dataSource?.data || [];
        const updatedData = [...existingData, ...members];


        if (!this.dataSource) {
            this.dataSource = new MatTableDataSource(updatedData);
        } else {
            // 🔹 Reassign merged data to the data source
            this.dataSource.data = updatedData;
        }


        // Optional: update sorting and pagination references
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;

        if (this.membersSource) {
            this.membersSource.data = this.membersSource.data.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
            this.categoryCounts = []
            this.membersSource.data.forEach(member => {
                this.countCategoryMember(true, member);
            });
            this.membersSource._updateChangeSubscription();
        }



        // (Optional) If you also maintain a tournamentMembers array:
        if (this.tournamentMembers) {
            this.tournamentMembers = this.tournamentMembers.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
        }
        this.memberSelection.clear();
    }

    removeAllTournamentMembers() {
        let tournamentMembers = this.membersSource.data;
        let members = [];
        for (let index in tournamentMembers) {
            if (tournamentMembers[index]) {
                let founded = this.clubMembers.filter((a) => {
                    return a.id == tournamentMembers[index].id;
                });
                if (founded.length == 0) {
                    members.push(tournamentMembers[index]);
                }
            }
        }
        // 🔹 Merge existing data with new members
        const existingData = this.dataSource?.data || [];
        const updatedData = [...existingData, ...members];

        if (!this.dataSource) {
            this.dataSource = new MatTableDataSource(updatedData);
        } else {
            // 🔹 Reassign merged data to the data source
            this.dataSource.data = updatedData;
        }

        // Optional: update sorting and pagination references
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;

        if (this.membersSource) {
            this.membersSource.data = this.membersSource.data.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
            this.membersSource._updateChangeSubscription();
        }
        this.memberSelection.clear();

        this.categoryCounts = []
        // (Optional) If you also maintain a tournamentMembers array:
        if (this.tournamentMembers) {
            this.tournamentMembers = this.tournamentMembers.filter(
                (member) => !members.some((removed) => removed.id === member.id)
            );
        }
    }

    async saveTournamentTeams() {
        let tournamentMember: TeamMembers[] = []
        this.teamMembersToSave = [];
        let teamsToSave: Team[] = [];
        let teamsMembersToRemove: any[] = [];
        // let selectionArray = Object.assign({}, this.selection.selected);
        let flag: boolean = true;
        // if (this.selectedTeams1[0].length !== this.selectedTeams2[0].length) {
        //     this.snackBar.open('Teams Members are not equal.', 'x', {
        //         duration: 2000,
        //     });
        //     return;
        // }
        this.selectedTeams.forEach((team, index) => {
            tournamentMember = [];
            // let name: string = (<HTMLInputElement>(
            //     document.getElementById(
            //         'team_' + index + '_name'
            //     )
            // )).value;

            // let color: string = (<HTMLInputElement>(
            //     document.getElementById(
            //         'team_' + index + '_color'
            //     )
            // )).value;
            // team['name'] = name;
            // team['color'] = color;
            teamsMembersToRemove.push(team.id);
            team.members.forEach((mem) => {
                let member: any = {
                    playerId: mem.id,
                }
                tournamentMember.push(member);
            })
            let teams: any = {
                id: team.id,
                tournamentId: this.tournamentID,
                adminId: this.loggedInuser.id,
                name: team.name,
                color: team.color,
                teamMembers: {
                    data: tournamentMember,
                },
            }
            teamsToSave.push(teams);
        })
        //console.log(teamsToSave);
        // //console.log(this.teamMembersToSave);
        let result = <any>(
            await this.facadeService.insertTournamentTeam(teamsToSave, this.tournamentID, teamsMembersToRemove)
        );

        if (result) {
            if (
                this.formArray.get([0]).value.courseInfo[0].matchFormat === matchFormat.STROKE_PLAY
            ) {

                let sDate = new Date(
                    this.formArray.get([0]).value.startDateFormCtrl
                );
                let dteday = this.datePipe.transform(sDate, 'yyyyMMdd');
                let date =
                    dteday.substring(8, 6) +
                    '-' +
                    dteday.substring(6, 4) +
                    '-' +
                    +dteday.substring(0, 4);
                // //console.log(date);
                if (!this.setupInitialized) {
                    for (
                        let i = 0;
                        i <
                        this.formArray.get([0]).get('clubctgies').value
                            .length;
                        i++
                    ) {
                        for (let obj of this.dates) {
                            if (
                                obj.playingDates['dates'] == date &&
                                this.formArray
                                    .get([0])
                                    .get('clubctgies').value[i].name ==
                                obj.name
                            ) {
                                this.addFlightField(
                                    this.formArray
                                        .get([0])
                                        .get('clubctgies').value[i]
                                );
                            }
                        }
                    }
                    this.setupInitialized = true;
                }
            } else {
                const control = this.formArray.get([1]).get('category') as FormArray;

                //console.log(control.length);

                control.clear();
                this.addFlightField('Teams');
            }
            this.snackBar.open('Tournament Teams have been saved.', 'x', {
                duration: 2000,
            });
            this.currentTitle = 'Groups Setup';
            this.currentStep++;
            if (!this.currentTournament.isSetupComplete) {
                await this.facadeService.setTournamentStep(this.tournamentID, 3, false);
            }
            // stepper.next();
        } else {
            this.snackBar.open('Error!.Try Again', 'x', {
                duration: 2000,
            });
        }


        this.valid1.reset();
        this.syncTournamentMembers();
        this.syncTournamentTeamMembers();
        this.syncClubMembers();
        this.categoryCounts = [];
    }

    addTeam() {
        const teamName = this.teamForm.get('teamName')?.value?.trim();
        const teamColor = this.teamForm.get('teamColor')?.value;

        this.selectedTeams.push({
            id: UniqueIdGenerator.generate(),
            name: teamName,
            color: teamColor,
            members: []
        });
        if (!teamName) return;

        // Example: print or send to backend
        console.log('✅ Created team:', { teamName, teamColor });

        // Reset form after creation
        this.teamForm.reset();
        this.selectedTeamColor = null;
        // //console.log(this.selectedTeams);

    }

    addPairs() {
        const teamName = this.teamForm.get('teamName')?.value?.trim();
        const teamColor = this.teamForm.get('teamColor')?.value;

        this.selectedPairs.push({
            id: UniqueIdGenerator.generate(),
            name: teamName,
            color: teamColor,
            members: []
        });
        if (!teamName) return;

        // Example: print or send to backend
        console.log('✅ Created team:', { teamName, teamColor });

        // Reset form after creation
        this.teamForm.reset();
        this.selectedTeamColor = null;
        // //console.log(this.selectedTeams);

    }
    onColorChange(event: Event, id: any) {
        const inputElement = event.target as HTMLInputElement;
        const teamToUpdate = this.selectedTeams.find(t => t.id === id);
        if (teamToUpdate) {
            teamToUpdate.color = inputElement.value;
        }
    }

    addSelectedPlayersToTeam(teamId: number) {
        const selectedPlayers = [...this.memberTMSelection.selected]; // array of selected players
        if (!selectedPlayers.length) return;

        const team = this.selectedTeams.find(t => t.id === teamId);
        if (!team) return;

        // ✅ Ensure no duplicates in team.members
        const existingIds = new Set(this.selectedTeams.flatMap(t => t.members.map(m => m.id)));
        const uniqueNewMembers = selectedPlayers.filter(p => !existingIds.has(p.id));

        // ✅ Add only new members
        team.members = [...team.members, ...uniqueNewMembers];

        // ✅ Remove selected members from the main data source
        const remainingMembers = this.membersTeamSource.data.filter(
            (m: any) => !selectedPlayers.some(p => p.id === m.id)
        );
        this.membersTeamSource.data = [...remainingMembers];

        // ✅ Clear selection
        this.memberTMSelection.clear();
    }

    addSelectedPlayersToPair(pairId: string) {
        const selectedPlayers = [...this.memberTMSelection.selected]; // array of selected players
        if (!selectedPlayers.length) return;

        const team = this.selectedPairs.find(t => t.id === pairId);
        if (!team) return;

        if (team.members.length >= 2) {
            this.snackBar.open('Pair can have only 2 members.', 'x', {
                duration: 2000,
            });
            return;
        }

        // ✅ Ensure no duplicates in team.members
        const existingIds = new Set(this.selectedPairs.flatMap(t => t.members.map(m => m.id)));
        const uniqueNewMembers = selectedPlayers.filter(p => !existingIds.has(p.id));

        // ✅ Add only new members
        team.members = [...team.members, ...uniqueNewMembers];

        // ✅ Remove selected members from the main data source
        const remainingMembers = this.membersTeamSource.data.filter(
            (m: any) => !selectedPlayers.some(p => p.id === m.id)
        );
        this.membersTeamSource.data = [...remainingMembers];

        // ✅ Clear selection
        this.memberTMSelection.clear();
    }


    editTeam(teamId, index) {
        //console.log(index);
        try {
            this.logger.log('Add New member to Team', "info", teamId);

            let TM = [];
            for (let obj of this.tournamentMembers) {
                let play = {
                    id: obj.id,
                    firstName: obj.firstName,
                    lastName: obj.lastName,
                    handicap: obj.handicap,
                    playerCategory: obj.playerCategory,
                    membershipNumber: obj.membershipNumber,
                    email: obj.email,
                }
                TM.push(play);
            }

            const dialogRef = this.dialog.open(DialogAddMemberComponent, {
                data: {
                    id: teamId,
                    members: TM,
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                //console.log(result);
                if (result.length > 0) {
                    let playerAdded = false; // Flag to track if the player has been added to a team
                    for (let obj of result) {
                        for (let team of this.selectedTeams) {
                            const isPlayerPresent = team.members.some(member => member.id === obj.id);
                            if (isPlayerPresent) {
                                playerAdded = true;
                            }
                        }
                        if (!playerAdded) {
                            const teamToUpdate = this.selectedTeams.find(t => t.id === teamId);
                            if (teamToUpdate) {
                                teamToUpdate.members.push(obj);
                            }
                        }
                    }
                    if (playerAdded) {
                        // Show a message if the player is already present in all teams
                        this.snackBar.open('Player already exists in teams.', 'x', {
                            duration: 2000,
                        });
                    }
                }

            });
        } catch (error) {
            this.logger.log('Getting Tournaments DataAdd New member to flight Failed', "error", error.toString());
        }
    }
    async getFormData(stepper: MatStepper, action: string) {
        // let courseHoleSetValue = this.getCourseHoleSetValue();
        // let validateValue: boolean = false;

        // if(courseHoleSetValue == 0 || courseHoleSetValue == 3 || courseHoleSetValue == 9 || courseHoleSetValue == 12)
        //   validateValue = true;
        // else {
        //   alert("You must select a valid 18 holes combination.");
        //   return validateValue;
        // }
        // //console.log(this.formArray.get([0]).get('clubctgies').value);
        this.tournamentMembersSetup();
        // if (!this.currentTournament && action != "back") {
        //  this.createTournament();
        // } else if(action != "back") {
        //   // //console.log(this.formArray.get([0]).value.prefixFormCtrl);
        //   // //console.log(this.formArray.get([0]).value.titleFormCtrl);
        //   // //console.log(this.formGroup.value["formArray"]);
        //   // //console.log(this.formGroup.get("formArray"));

        //   //console.log(this.formArray.get("formArray"));
        //   //this.editTournaments();
        // }

        if (action === 'next') stepper.next();
        else if (action === 'back') stepper.previous();
        else {
        }

        if (this.formArray.get([0]).value.clubsFormCtrl) {
            let selectedClubId: string =
                this._localStorage.isClubAdmin()
                    ? this.loggedInuser.adminClubId
                    : this.formArray.get([0]).value.clubsFormCtrl.id;
            this.clubMembers = [];
            // //console.log(selectedClubId);
            // //console.log(this.formArray.get([0]).get('clubctgies').value);

            let clubMembersData: any = await this.facadeService.getPlayerByClub(
                selectedClubId
            );

            for (let i = 0; i < clubMembersData.club_member.length; i++) {
                this.clubMembers.push(clubMembersData.club_member[i].player);
            }

            // //console.log(this.clubMembers);

            this.syncClubMembers();

            ////console.log(this.clubMembers);

            //this.dataSource = new MatTableDataSource(this.clubMembers);
        } else {
            alert('Select Club');
        }

        // this.tournamentMembersSetup();

        // //console.log(this.formArray.get([1]).value.category);

        // if (this.formArray.get([0]).value.clubsFormCtrl) {
        //   let selectedClubId: string = (this._localStorage.isClubAdmin()) ? this.loggedInuser.adminClubId : this.formArray.get([0]).value.clubsFormCtrl.id;
        //   this.clubMembers = [];
        //   //console.log(selectedClubId);
        //   let clubMembersData: any = await this.facadeService.getPlayerByClub(selectedClubId);

        //   for (let i = 0; i < clubMembersData.length; i++) {
        //     this.clubMembers.push(clubMembersData[i].player);
        //   }

        //   this.syncClubMembers();
        //   ////console.log(this.clubMembers);

        //   //this.dataSource = new MatTableDataSource(this.clubMembers);
        // }
    }

    syncClubMembers() {
        of(this.clubMembers)
            .pipe()
            .subscribe(
                (data) => {
                    this.isLoading = false;
                    // //console.log(this.clubMembers);

                    this.clubMembers = this.clubMembers.filter(
                        (ar) =>
                            !this.tournamentMembers.find(
                                (rm) => rm.id === ar.id
                            )
                    );
                    // //console.log(this.clubMembers);

                    this.dataSource = new MatTableDataSource(this.clubMembers);
                    this.dataSource.sort = this.sort;
                    this.dataSource.paginator = this.paginator;
                    this.dataSource._updateChangeSubscription();
                },
                (error) => (this.isLoading = false)
            );
    }

    getSecondOpponent(teams: any[], player: any): string {
        for (const team of teams) {
            const isPlayerInTeam = team.members.some(member => member.id === player.id);
            if (!isPlayerInTeam) { // Check if the player is not in this team
                for (const member of team.members) {
                    if (member.id !== player.id && !this.assignedOpponents.has(member.id)) {
                        this.assignedOpponents.add(member.id); // Mark this member as assigned
                        return member.id; // Return the ID of the first member that is not the current player
                    }
                }
            }
        }
        return ''; // Return empty string if no available opponent is found
    }

    checkTeamMembers(teamMembersToSave, playerId): boolean {

        for (let data of teamMembersToSave) {
            if (data.team1MemberId == playerId) {
                return true;
            } else if (data.team2MemberId == playerId) {
                return true;
            }
        }
        return true;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        // //console.log(this.dataSource);
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    applyMembersFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        // //console.log(this.membersSource);
        this.membersSource.filter = filterValue;

        if (this.membersSource.paginator) {
            this.membersSource.paginator.firstPage();
        }
    }

    async createFlights() {
        this.isCreatingFlights = true;
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        let tournamentFlights: Flight[] = [];
        let tournamentMember: TournamentMember[] = [];
        let flightName: any[] = [];
        let fcnter = 0;
        let createPairs: boolean = false;
        let ind: number = 0;

        let tournamentFlightMembers: FlightMembers[];
        let tournamentPairs: any[];
        let tournamentTeamOpponents: any[] = [];

        let arr = this.formArray.get([0]).value.pointsFormats;
        arr.forEach((control, index) => {
            if (index == 0 && (control.format == 'GREENSOME' || control.format == 'FOURSOME')) {
                createPairs = true;
            }
        });
        if (this.currentTournament)
            this.tournamentID = this.currentTournament.id;
        for (let index in this.selectedMembers) {
            let counter: number = 0;

            tournamentFlightMembers = [];
            tournamentPairs = [];
            const FilteredFlight = this.formArray
                .get([1])
                .get('category')
                .value.filter((a) => {
                    return a.name == this.selectedMembers[index].title;
                });

            // //console.log(FilteredFlight);
            // //console.log(this.selectedMembers);

            for (let index2 in this.selectedMembers[index]) {
                if (index2 != 'title') {

                    for (var index3 in this.selectedMembers[index][index2]) {
                        tournamentPairs = [];
                        ind = 0;
                        for (var index4 in this.selectedMembers[index][index2][index3]) {

                            if (this.showShambles) {
                                if (index4 == 'pairA' || index4 == 'pairB') {
                                    let pair = {
                                        id: UniqueIdGenerator.generate(),
                                        tournamentId: this.tournamentID,
                                        pairName: this.selectedMembers[index][index2][index3][index4].pairName,
                                        member1Id: this.selectedMembers[index][index2][index3][index4].members[0].id,
                                        member2Id: this.selectedMembers[index][index2][index3][index4].members[1].id,
                                    }
                                    tournamentPairs.push(pair);


                                    for (var index5 in this.selectedMembers[index][index2][index3][index4].members) {
                                        if (Number.isInteger(Number(index5))) {
                                            //console.log(this.selectedMembers[index][index2][index3][index4][index5].playerCategory);

                                            let roundTeeId: any = General.getPlayersTe(
                                                this.selectedMembers[index][index2][index3][index4].members[index5].playerCategory
                                            );
                                            //console.log(roundTeeId.id);
                                            let FM: any = {
                                                playerId:
                                                    this.selectedMembers[index][index2][index3][index4].members[index5].id,
                                                attendance: false,
                                                playingTee: roundTeeId.result,
                                                tee_id: roundTeeId.id,
                                            };
                                            //console.log(FM);
                                            tournamentFlightMembers.push(FM);
                                        }
                                    }
                                }

                                // if (Number.isInteger(Number(index4))) {
                                //     let pair = {
                                //         id: UniqueIdGenerator.generate(),
                                //         tournamentId: this.tournamentID,
                                //         pairName: this.selectedMembers[index][index2][index3][index4].PairName,
                                //         member1Id: this.selectedMembers[index][index2][index3][index4][0].id,
                                //         member2Id: this.selectedMembers[index][index2][index3][index4][1].id,
                                //     }
                                //     tournamentPairs.push(pair);
                                //     for (var index5 in this.selectedMembers[index][index2][index3][index4]) {
                                //         if (Number.isInteger(Number(index5))) {
                                //             //console.log(this.selectedMembers[index][index2][index3][index4][index5].playerCategory);

                                //             let roundTeeId: any = General.getPlayersTe(
                                //                 this.selectedMembers[index][index2][index3][index4][index5].playerCategory
                                //             );
                                //             //console.log(roundTeeId.id);
                                //             let FM: any = {
                                //                 playerId:
                                //                     this.selectedMembers[index][index2][index3][index4][index5].id,
                                //                 attendance: false,
                                //                 playingTee: roundTeeId.result,
                                //                 tee_id: roundTeeId.id,
                                //             };
                                //             //console.log(FM);
                                //             tournamentFlightMembers.push(FM);
                                //         }
                                //     }
                                // }
                            } else if (this.showMatchPlay) {

                                for (let index5 in this.selectedMembers[index][index2][index3][index4].members) {
                                    const currentMember = this.selectedMembers[index][index2][index3][index4].members[index5];
                                    const nextMember = this.selectedMembers[index][index2][index3][index4].members[Number(index5) + 1];
                                    const existsInPairs = tournamentPairs.some(p =>
                                        p.member1Id === currentMember.id || p.member2Id === currentMember.id
                                    );
                                    if (index4 == 'teamA') {
                                        let teamOpponent = {
                                            id: UniqueIdGenerator.generate(),
                                            team1Id: this.selectedMembers[index][index2][index3][index4].teamId,
                                            team2Id: this.selectedMembers[index][index2][index3]['teamB'].teamId,
                                            team1MemberId: this.selectedMembers[index][index2][index3][index4].members[index5].id,
                                            team2MemberId: this.selectedMembers[index][index2][index3]['teamB'].members[index5].id,
                                            tournamentId: this.tournamentID,
                                        }
                                        tournamentTeamOpponents.push(teamOpponent);
                                    }
                                    if (createPairs && nextMember && !existsInPairs) {
                                        let pair = {
                                            id: UniqueIdGenerator.generate(),
                                            tournamentId: this.tournamentID,
                                            pairName: currentMember.firstName + '/' + nextMember.firstName,
                                            member1Id: currentMember.id,
                                            member2Id: nextMember.id,
                                        };
                                        tournamentPairs.push(pair);
                                    }
                                    let roundTeeId: any = General.getPlayersTe(this.selectedMembers[index][index2][index3][index4].members[index5].playerCategory
                                    );

                                    let FM: any = {
                                        playerId: this.selectedMembers[index][index2][index3][index4].members[index5].id,
                                        attendance: false,
                                        playingTee: roundTeeId.result,
                                        tee_id: roundTeeId.id,
                                    };

                                    tournamentFlightMembers.push(FM);
                                }
                            } else {
                                if (Number.isInteger(Number(index4))) {

                                    let roundTeeId: any = General.getPlayersTe(
                                        this.selectedMembers[index][index2][index3][
                                            index4
                                        ].playerCategory
                                    );
                                    let FM: any = {
                                        playerId:
                                            this.selectedMembers[index][index2][
                                                index3
                                            ][index4].id,
                                        attendance: false,
                                        playingTee: roundTeeId.result,
                                        tee_id: roundTeeId.id,
                                    };

                                    tournamentFlightMembers.push(FM);
                                }
                            }
                        }
                        // let roundTeeId1: any = General.getPlayersTees(
                        //     tournamentFlightMembers[0].playingTee
                        // );
                        if (tournamentFlightMembers.length > 0) {
                            // //console.log(tournamentFlightMembers);
                            fcnter++;
                            let flight: any = {
                                id: UniqueIdGenerator.generate(),
                                tournamentId: this.tournamentID,
                                courseId: this.currentTournament.courseId,
                                adminId: this.loggedInuser.id,
                                courseHoleSets: this.currentTournament
                                    .courseHoleSets
                                    ? this.currentTournament.courseHoleSets
                                    : 3,
                                flightNo: fcnter,
                                flightRound: 1,
                                categoryRound: 1,
                                tee_id: 1,
                                startingHole:
                                    this.selectedMembers[index][index2][index3]
                                        .tee,
                                tee: 'AMATEURS',
                                category: this.selectedMembers[index].title,
                                date: General.parseToDate(
                                    this.formArray.get([0]).value
                                        .startDateFormCtrl
                                ),
                                time: this.selectedMembers[index][index2][
                                    index3
                                ].time,
                                ended: false,
                                courseHoleSetsInverted: this.currentTournament
                                    .courseHoleSetsInverted
                                    ? this.currentTournament
                                        .courseHoleSetsInverted
                                    : false,
                                members: {
                                    data: tournamentFlightMembers,
                                },
                                pairs: {
                                    data: tournamentPairs,
                                },
                                team: {
                                    data: tournamentTeamOpponents,
                                }
                            };
                            tournamentTeamOpponents = [];
                            if (this.showTexas) {
                                let name: string = (<HTMLInputElement>(
                                    document.getElementById(
                                        'flight_' + counter + '_name'
                                    )
                                )).value;
                                //console.log(name);

                                let flightNames: any = {
                                    flightId: flight.id,
                                    name: name,
                                };

                                flightName.push(flightNames);
                            }
                            counter = counter + 1;

                            //console.log(flight);
                            tournamentFlights.push(flight);
                            //console.log(tournamentFlights);
                            tournamentFlightMembers = [];

                            //break;
                        }

                    }
                }
            }
        }
        let flightIds = this.currentTournament.flights.filter((slot: any) => slot.id != null).map((slot: any) => slot.id);
        for (let id of flightIds) {
            if (id && id != '') {
                await this.facadeService.deleteFlight(id);
            }
        }

        let result = <any>(
            await this.facadeService.createNextRoundFlights(tournamentFlights)
        );
        if (this.showTexas == true) {
            await this.facadeService.addFlightName(flightName);
        }

        if (result) {
            if (!this.currentTournament.isSetupComplete) {
                await this.facadeService.setTournamentStep(this.tournamentID, 4, true);
            }
            this.isCreatingFlights = false;
            this.snackBar.open('Tournament has been setup.', 'x', {
                duration: 5000,
            });
            this.reset();
            this.router.navigate(['/tournaments/view/' + this.tournamentID]);
        } else {
            this.isCreatingFlights = false;

        }
    }

    removeTeamPlayer(playerId: string, teamId: string) {
        // Find the team
        const teamToUpdate = this.selectedTeams.find(team => team.id === teamId);

        if (teamToUpdate) {
            // Find the player being removed
            const removedPlayer = teamToUpdate.members.find(member => member.id === playerId);

            // Remove from the team
            teamToUpdate.members = teamToUpdate.members.filter(member => member.id !== playerId);

            // Add the removed player back to the dataSource (if found)
            if (removedPlayer) {
                const existingData = this.membersTeamSource?.data || [];

                // 🔹 Check for duplicates before adding back
                const alreadyExists = existingData.some(member => member.id === removedPlayer.id);
                if (!alreadyExists) {
                    this.membersTeamSource.data = [...existingData, removedPlayer];
                    this.membersTeamSource._updateChangeSubscription();
                }
            }
        } else {
            console.warn('Team not found');
        }
    }

    removePairPlayer(playerId: string, teamId: string) {
        // Find the team
        const teamToUpdate = this.selectedPairs.find(team => team.id === teamId);

        if (teamToUpdate) {
            // Find the player being removed
            const removedPlayer = teamToUpdate.members.find(member => member.id === playerId);

            // Remove from the team
            teamToUpdate.members = teamToUpdate.members.filter(member => member.id !== playerId);

            // Add the removed player back to the dataSource (if found)
            if (removedPlayer) {
                const existingData = this.membersTeamSource?.data || [];

                // 🔹 Check for duplicates before adding back
                const alreadyExists = existingData.some(member => member.id === removedPlayer.id);
                if (!alreadyExists) {
                    this.membersTeamSource.data = [...existingData, removedPlayer];
                    this.membersTeamSource._updateChangeSubscription();
                }
            }
        } else {
            console.warn('Team not found');
        }
    }


    deleteTeam(teamId: string) {
        // Find the team being deleted
        const deletedTeam = this.selectedTeams.find(team => team.id === teamId);

        // Remove the team from the list
        this.selectedTeams = this.selectedTeams.filter(team => team.id !== teamId);

        // If the team existed and had members
        if (deletedTeam && deletedTeam.members && deletedTeam.members.length > 0) {
            const existingMembers = this.membersSource?.data || [];

            // Add back team members that are not already in membersSource
            const updatedMembers = [
                ...existingMembers,
                ...deletedTeam.members.filter(
                    member => !existingMembers.some(m => m.id === member.id)
                )
            ];

            // Update the data source
            this.membersTeamSource.data = updatedMembers;

            // Optional: refresh table visuals (sorting/pagination)
            this.membersTeamSource._updateChangeSubscription();
        }
    }

    deletePair(teamId: string) {
        // Find the team being deleted
        const deletedTeam = this.selectedPairs.find(team => team.id === teamId);

        // Remove the team from the list
        this.selectedPairs = this.selectedPairs.filter(team => team.id !== teamId);

        // If the team existed and had members
        if (deletedTeam && deletedTeam.members && deletedTeam.members.length > 0) {
            const existingMembers = this.membersTeamSource?.data || [];

            // Add back team members that are not already in membersSource
            const updatedMembers = [
                ...existingMembers,
                ...deletedTeam.members.filter(
                    member => !existingMembers.some(m => m.id === member.id)
                )
            ];

            // Update the data source
            this.membersTeamSource.data = updatedMembers;

            // Optional: refresh table visuals (sorting/pagination)
            this.membersTeamSource._updateChangeSubscription();
        }
    }


    removePlayer(playerId: string) {

        //console.log(playerId);
        //console.log(this.tournamentMembers);
        let data: any = this.tournamentMembers;
        //console.log(data);
        let DelplayerIndex: any = data.findIndex((a) => {
            return a.id == playerId;
        });
        //console.log(DelplayerIndex);

        let DelplayerInfo: any = data.filter((a) => {
            return a.id == playerId;
        });
        //console.log(DelplayerInfo);

        ////console.log(flight + "<- ->" + player);
        const dialogRef = this.dialog.open(DialogOverviewComponent, {
            width: '350px',
            data: 'Do you want to remove this player from group?',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                data.splice(DelplayerIndex, 1);
                //data.splice(playerId, 1);
                this.clubMembers.splice(0, 0, DelplayerInfo[0]);

                //console.log(this.selection);

                this.tournamentMembers = data;
                this.selection.clear();
                this.syncClubMembers();
                this.syncTournamentMembers();

                this.facadeService.deleteTournamentMember(
                    this.tournamentID,
                    playerId
                );
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    roundChange(event: any) {
        const rounds = Number(event.value);
        this.multiCourse = rounds > 1;
        this.noOfRounds = Array.from({ length: rounds }, (_, i) => i + 1);

        const array = this.formArray.get([0]).get('pointsFormats') as FormArray;
        array.clear(); // Reset

        for (let i = 0; i < rounds; i++) {
            array.push(
                this._formBuilder.group({
                    format: ['', this.showMatchPlay ? Validators.required : Validators.nullValidator],
                })
            );
        }
    }

    movePlayer(flight: number, cplayer: number) {
        ////console.log(flight + "<- ->" + player);
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
                ////console.log(result);
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

    public reset() {
        this.formGroup.reset();
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelected()
            ? this.selection.clear()
            : this.dataSource.data.forEach((row) => this.selection.select(row));
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        ////console.log(this.dataSource);
        if (this.dataSource) {
            const numSelected = this.selection.selected.length;
            const numRows = this.dataSource.data.length;
            return numSelected === numRows;
        }
    }
    // /** The label for the checkbox on the passed row */
    checkboxLabel(row?: Player): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggleM() {
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelectedM()
            ? this.memberSelection.clear()
            : this.membersSource.data.forEach((row) => this.memberSelection.select(row));
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelectedM() {
        ////console.log(this.dataSource);
        if (this.membersSource) {
            const numSelected = this.memberSelection.selected.length;
            const numRows = this.membersSource.data.length;
            return numSelected === numRows;
        }
    }
    // /** The label for the checkbox on the passed row */
    checkboxLabelM(row?: Player): string {
        if (!row) {
            return `${this.isAllSelectedTM() ? 'select' : 'deselect'} all`;
        }
        return `${this.memberSelection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }
    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggleTM() {
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelectedTM()
            ? this.memberTMSelection.clear()
            : this.membersTeamSource.data.forEach((row) => this.memberTMSelection.select(row));
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelectedTM() {
        ////console.log(this.dataSource);
        if (this.membersTeamSource) {
            const numSelected = this.memberTMSelection.selected.length;
            const numRows = this.membersTeamSource.data.length;
            return numSelected === numRows;
        }
    }
    // /** The label for the checkbox on the passed row */
    checkboxLabelTM(row?: Player): string {
        if (!row) {
            return `${this.isAllSelectedTM() ? 'select' : 'deselect'} all`;
        }
        return `${this.memberTMSelection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }

    addFlight() {
        ////console.log(this.selectedMembers.length);
        this.selectedMembers[this.selectedMembers.length] = [];
        this.selectedMembers[this.selectedMembers.length - 1]['id'] =
            UniqueIdGenerator.generate();
        this.selectedMembers[this.selectedMembers.length - 1]['time'] = '09:00';
        this.selectedMembers[this.selectedMembers.length - 1]['startingHole'] =
            '1';
        ////console.log(this.selectedMembers.length);
        //this.selectedMembers[this.selectedMembers.length - 1].push(player);
        ////console.log(this.selectedMembers);
    }

    addFlightPlayer() {
        const dialogRef = this.dialog.open(DialogPlayerComponent, {
            width: '350px',
            data: { flights: this.selectedMembers.length },
        });

        dialogRef.afterClosed().subscribe((result) => {
            //console.log(result);
            if (result) {
                ////console.log("record deleted.");
                //console.log(result.player);
                this.selectedMembers[result.flight].splice(
                    this.selectedMembers[result.flight].length - 3,
                    0,
                    result.player
                );
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    addPlayer() {
        const dialogRef = this.dialog.open(DialogAddPlayerComponent, {
            data: { flights: this.selectedMembers.length, tournamentID: this.tournamentID },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                ////console.log("record deleted.");
                console.log(result);
                // this.clubMembers.push(result);
                //Need to check that player is already exist in the this.membersSource or not



                let isExist = false;
                for (let member of this.membersSource.data) {
                    if (member.id === result.id) {
                        isExist = true;
                        break;
                    }
                }

                if (!isExist) {
                    const existingData = this.membersSource?.data || [];
                    const updatedData = [...existingData, ...[result]];
                    if (!this.membersSource) {
                        this.membersSource = new MatTableDataSource(updatedData);
                    } else {
                        // 🔹 Reassign merged data to the data source
                        this.membersSource.data = updatedData;
                    }
                    this.membersSource._updateChangeSubscription();

                } else {
                    this.snackBar.open('Player already exist in the list.', 'x', {
                        duration: 3000,
                    });
                }

                ////console.log(this.clubMembers);
                this.syncClubMembers();
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    playerList() {
        const dialogRef = this.dialog.open(DialogPlayerListComponent, {
            data: { players: this.tournamentMembers },
        });

        dialogRef.afterClosed().subscribe((result) => {
            //console.log(result);
            if (result) {
                ////console.log("record deleted.");
                //console.log(result);
                this.clubMembers.push(result);
                //console.log(this.clubMembers);
                this.syncClubMembers();
            } else {
                ////console.log("cancel delete action");
            }
        });
    }

    async searchPlayer() {
        // const dialogRef = this.dialog.open(DialogPlayerComponent, {
        //     width: '740px',
        //     data: { flights: this.selectedMembers.length },
        // });
        // if(this.subTournamentID==''){

        // }
        let datas = await this.facadeService.getPlayersListForTournament(
            this.loggedInuser.adminClubId
        );
        const dialogRef = this.dialog.open(DialogPlayerListComponent, {
            data: { players: datas.player, tournamentID: this.tournamentID, subTournamentID: this.subTournamentID },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            //console.log(result);
            if (result) {
                let dataFullTournaments: any;

                dataFullTournaments =
                    await this.facadeService.getTournamentMembers(
                        this.tournamentID
                    );
                //console.log(dataFullTournaments);
                this.tournamentMembers = [];
                for (let p of dataFullTournaments.TournamentMemberQL)
                    this.tournamentMembers.push(p['player']);

                this.syncClubMembers();
                this.syncTournamentMembers();
            }
            // if (result.length == 1) {
            //     ////console.log("record deleted.");
            //     //console.log(result);

            //     let founded = this.tournamentMembers.filter((a) => {
            //         return a.id == result[0].player.id;
            //     });
            //     //console.log(founded);

            //     if (founded.length == 0) {
            //         let tournamentMember: TournamentMember[] = [];

            //         let member: any = {
            //             tournamentId: this.tournamentID,
            //             playerId: result[0].player.id,
            //             status: true,
            //         };

            //         tournamentMember.push(member);
            //         this.saveMembers(tournamentMember);
            //         this.tournamentMembers.push(result[0].player);
            //         this.syncTournamentMembers();
            //     } else {
            //         this.snackBar.open(
            //             'Player already exist in the list.',
            //             'x',
            //             {
            //                 duration: 5000,
            //             }
            //         );
            //     }
            // } else if (result.length > 1) {
            //     result.forEach((element) => {
            //         let founded = this.tournamentMembers.filter((a) => {
            //             return a.id == element.player.id;
            //         });
            //         //console.log(founded);

            //         if (founded.length == 0) {
            //             let tournamentMember: TournamentMember[] = [];

            //             let member: any = {
            //                 tournamentId: this.tournamentID,
            //                 playerId: element.player.id,
            //                 status: true,
            //             };

            //             tournamentMember.push(member);
            //             this.saveMembers(tournamentMember);
            //             this.tournamentMembers.push(element.player);
            //             this.syncTournamentMembers();
            //         } else {
            //             this.snackBar.open(
            //                 'Player already exist in the list.',
            //                 'x',
            //                 {
            //                     duration: 5000,
            //                 }
            //             );
            //         }
            //     });
            // } else {
            // }
        });
    }

    openFormatInfo(index: number) {
        const selectedFormat = this.courseFileds.controls[index].value.matchFormat;

        const infoText = INDIVIDUAL_FORMATS_INFO[selectedFormat]
            || "No information available.";

        // this.dialog.open(DialogOverviewComponent, {
        //     width: '350px',
        //     data: infoText
        // });

        this._fuseConfirmationService.open({
            title: selectedFormat,
            message: infoText,
            icon: {
                name: 'info',
                color: 'primary',
            },
            actions: {
                cancel: {
                    show: false,
                },
                confirm: {
                    label: 'Close',
                },
            },
        });
    }

    openInfo(text: string) {

        // this.dialog.open(DialogOverviewComponent, {
        //     width: '350px',
        //     data: infoText
        // });

        this._fuseConfirmationService.open({
            title: 'Information',
            message: text,
            icon: {
                name: 'info',
                color: 'primary',
            },
            actions: {
                cancel: {
                    show: false,
                },
                confirm: {
                    label: 'Close',
                },
            },
        });
    }
    async saveMembers(tournamentMember: TournamentMember[]) {
        let result = <any>(
            await this.facadeService.insertTournamentMember(tournamentMember)
        );

        if (result) {
            this.snackBar.open('Tournament member have been added.', 'x', {
                duration: 5000,
            });
        }
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
            return a.name == row.playerCategory;
        });
        //console.log(founded);

        if (status) {
            if (founded.length > 0) {
                founded[0].value = founded[0].value + 1;
            } else {
                let obj = {
                    name: row.playerCategory,
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

    async createSubtournament(tournamentID) {
        let subTournamentId = UniqueIdGenerator.generate();
        this.subTournamentID = subTournamentId;

        let courseHoleSetsData = this.formArray.get([0]).value.courseHoleSet;
        let handicapAllocations = {
            handicapAllocation: this.formArray.get([0]).value
                .handicapAllocations,
        };
        courseHoleSetsData.length > 0
            ? (courseHoleSetsData = courseHoleSetsData.split('_', 2))
            : (courseHoleSetsData = []);
        let tournament = {
            id: subTournamentId, //(this.tournamentID)? this.tournamentID : UniqueIdGenerator.generate(),
            clubId:
                this._localStorage.isClubAdmin()
                    ? this.loggedInuser.adminClubId
                    : this.formArray.get([0]).value.clubsFormCtrl.id,
            leagueId: null,
            courseId: this.formArray.get([0]).value.courseInfo[0]
                ? this.formArray.get([0]).value.courseInfo[0].courseName.course
                    .id
                : '',
            adminId: this.loggedInuser.id,
            title: this.formArray.get([0]).value.subTournament[0].title,
            prefix: this.formArray.get([0]).value.subTournament[0].prefix,
            subTournament: true,
            multiFormat: false,
            courseHoleSets:
                courseHoleSetsData.length > 0
                    ? Number(courseHoleSetsData[0])
                    : 0,
            teamMatch: false,
            pairsMatch: false,
            interLeague: false,
            playingOnWhs: false,
            publicTournament: false,
            confirmParticipants: this.formArray.get([0]).value.askConfirmation,
            noOfRounds: this.formArray.get([0]).value.numOfRounds,
            activeRound: 1,
            matchFormat: this.formArray.get([0]).value.subTournament[0]
                .matchFormat,

            pointsFormats: null,
            pointsValues: null,
            handicapAllocations: handicapAllocations,
            tee: 'AMATEURS',
            tee_id: 1,
            scoreManagement: 'ONLY_PLAYERS',
            startDate: General.parseToDate(
                this.formArray.get([0]).value.startDateFormCtrl
            ),
            endDate: General.parseToDate(
                this.formArray.get([0]).value.endDateFormCtrl
            ),
            flightsCategory: null,
            started: true,
            invited: false,
            singleRound: false,
            sponsorName: '',
            sponsorLogo: '',
            mobileLogoUrl: '',
            webLogoUrl: '',
            courseHoleSetsInverted:
                courseHoleSetsData.length > 0
                    ? courseHoleSetsData[1] == 'true'
                        ? true
                        : false
                    : false,
            categories: [],
            marshals: [],
            flights: [],
            members: [],
            tourId: this._localStorage.isTourAdmin() ? this._localStorage.get(Constants.TOUR_ID) : null,
        };
        let result = <any>await this.facadeService.addTournament(tournament);
        // //console.log(tournament)
        if (result) {
            let obj = {
                tournamentId: tournamentID,
                subTournamentId: subTournamentId,
            };
            let response = <any>await this.facadeService.addSubTournament(obj);
            if (response) {
                this.snackBar.open('Sub Tournament has been created.', 'x', {
                    duration: 3000,
                });
            }
        }
    }

    updateTMCategorySelection() {
        this.TMcategoryCounts = [];
        if (this.tournamentMembers.length > 0) {
            for (let catCount of this.tournamentMembers) {
                //console.log(catCount);
                let founded = this.TMcategoryCounts.filter((a) => {
                    return a.name == catCount.playerCategory;
                });

                if (founded.length > 0) {
                    founded[0].value = founded[0].value + 1;
                } else {
                    let obj = {
                        name: catCount.playerCategory,
                        value: 1,
                    };
                    this.TMcategoryCounts.push(obj);
                }
            }
        }
        //console.log(this.TMcategoryCounts);
        return this.TMcategoryCounts;
    }
    deletedTMcategorySelection(PLcategory) {
        //console.log(PLcategory);
        let founded = this.updateTMCategorySelection();
        if (founded.length > 0) {
            for (let catCount in founded) {
                //console.log(catCount);
                if (founded[catCount].name == PLcategory) {
                    founded[catCount].value = founded[catCount].value - 1;
                } else {
                }
            }
            //console.log(founded);
            this.TMcategoryCounts = founded;
        }
    }
    selectedTee(event, playerId) {
        let target = event.source.selected._element.nativeElement;
        let selectedData = {
            value: event.value,
            text: target.innerText.trim(),
        };
    }
    formatChange(event) {
        this.showSubtournament = false;
        if (event.value == matchFormat.STROKE_PLAY || event.vlaue == matchFormat.STABLE_FORD) {
            this.showCat = true;
            this.showMatchPlay = false;
            this.showShambles = false;
        } else {
            this.showCat = false;
        }
        if (event.value == matchFormat.MATCH_PLAY) {
            this.steps = this.steps.filter(
                s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
            );
            this.showMatchPlay = true;
            this.showShambles = false;
            const hasTeamStep = this.steps.some(s => s.title === 'Select Teams');
            if (!hasTeamStep) {
                const teamStep = {
                    number: 3,
                    title: 'Select Teams',
                    description: 'Create and manage teams',
                };

                // Insert before "Groups Setup"
                const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                this.steps.splice(insertIndex, 0, teamStep);

                // 🔹 Renumber all steps after insertion
                this.steps.forEach((s, index) => (s.number = index + 1));
            }
        } else if (event.value == matchFormat.SHAMBLES ||
            event.value == matchFormat.GREENSOME ||
            event.value == matchFormat.FOURSOME ||
            event.value == matchFormat.TWO_BALL_BEST_BALL
        ) {
            this.showShambles = true;
            this.showMatchPlay = false;
            this.steps = this.steps.filter(
                s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
            );
            const hasTeamStep = this.steps.some(s => s.title === 'Select Pairs');
            if (!hasTeamStep) {
                const teamStep = {
                    number: 3,
                    title: 'Select Pairs',
                    description: 'Create and manage pairs',
                };

                // Insert before "Groups Setup"
                const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                this.steps.splice(insertIndex, 0, teamStep);

                // 🔹 Renumber all steps after insertion
                this.steps.forEach((s, index) => (s.number = index + 1));
            }

        } else if (event.value == matchFormat.BEST_THREE || event.value == matchFormat.BEST_TWO) {
            this.steps = this.steps.filter(
                s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
            );
            this.showSubtournament = true;
            this.showShambles = false;
            this.showBest = true;
            this.showMatchPlay = false;
            const hasTeamStep = this.steps.some(s => s.title === 'Select Teams');
            if (!hasTeamStep) {
                const teamStep = {
                    number: 3,
                    title: 'Select Teams',
                    description: 'Create and manage teams',
                };

                // Insert before "Groups Setup"
                const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                this.steps.splice(insertIndex, 0, teamStep);

                // 🔹 Renumber all steps after insertion
                this.steps.forEach((s, index) => (s.number = index + 1));
            }
        } else {
            this.steps = this.steps.filter(
                s => s.title !== 'Select Teams' && s.title !== 'Select Pairs'
            );
            this.steps.forEach((s, index) => (s.number = index + 1));
            this.showMatchPlay = false;
            this.showShambles = false;
        }

    }
    teamMatchChange(event) {
        this.matchFormats = [];

        if (event.value == '1') {
            // 🔹 Single (Stroke Play)
            this.showMatchPlay = false;
            this.matchFormats = General.singleFormats();
            this.showCat = true;
            this.formGroup.get('formArray')!
                .get([0])
                .get('courseInfo')!
                .get([0])
                .get('matchFormat')!
                .setValue("STROKE_PLAY");

            // 🔹 Remove "Select Teams" step if it exists
            this.steps = this.steps.filter(s => s.title !== 'Select Teams');
            this.steps.forEach((s, index) => (s.number = index + 1));
        } else if (event.value == '2') {
            // 🔹 Team Match Play
            this.showMatchPlay = true;
            this.matchFormats = General.teamFormats();
            this.showCat = false;
            this.formGroup.get('formArray')!
                .get([0])
                .get('courseInfo')!
                .get([0])
                .get('matchFormat')!
                .setValue("MATCH_PLAY");

            // 🔹 Add "Select Teams" step if not already present
            const hasTeamStep = this.steps.some(s => s.title === 'Select Teams');
            if (!hasTeamStep) {
                const teamStep = {
                    number: 3,
                    title: 'Select Teams',
                    description: 'Create and manage teams',
                };

                // Insert before "Groups Setup"
                const insertIndex = this.steps.findIndex(s => s.title === 'Groups Setup');
                this.steps.splice(insertIndex, 0, teamStep);

                // 🔹 Renumber all steps after insertion
                this.steps.forEach((s, index) => (s.number = index + 1));
            }
        }
    }


    typeChange(event) {
        if (event.value == 'SINGLE') {
            this.showSubtournament = false;
        } else {
            this.showSubtournament = true;
        }
    }

}
