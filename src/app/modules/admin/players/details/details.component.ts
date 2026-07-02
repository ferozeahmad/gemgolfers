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
    ViewContainerRef,
    ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
    FormControl,
    FormGroup,
} from '@angular/forms';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer, MatDrawerToggleResult } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    debounceTime,
    firstValueFrom,
    map,
    Observable,
    startWith,
    Subject,
    takeUntil,
} from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FacadeService } from 'app/shared/services/facade.service';
import {
    ClubMembership,
    handicap_change_log,
    Player,
    PlayerCategory,
    UserSessionModel,
} from 'app/shared/models/player.model';
import {
    Constants,
    General,
    generateGemId,
    UniqueIdGenerator,
} from 'app/shared/classes/general';
import { DatePipe } from '@angular/common';
import { RequireMatch } from 'app/shared/classes/CustomValidator';
import { FuseConfirmationSuccessService } from '@fuse/services/confirmation/confirmationsucces';
import { Club } from 'app/shared/models/club.model';
import { HandicapService } from 'app/shared/services/handicap.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'contacts-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsDetailsComponent implements OnInit, OnDestroy {
    drawerMode: 'over' | 'side' = 'side';
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
    clubTitle: string;
    editMode: boolean = false;
    showPassword: boolean = false;
    showConfirmPassword: boolean = false;
    save: boolean = false;
    golfClubs: Club[] = [];
    tagsEditMode: boolean = false;
    playerCategories: PlayerCategory[] = [];
    contact: any;
    contactForm: FormGroup;
    hideClubs: boolean = true;
    contacts: any[];
    playerID: any;
    cardsrc = 'assets/images/cards/01-320x200.png';
    avatarsrc = 'assets/images/avatars/male-04.jpg';
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentPlayer: any = [];
    tournamentId: any;
    public handicapsWhs: any[] = [];
    loggedInuser: UserSessionModel;
    handicapIndex: number = 0;
    email: string = '';
    membershipNo: string = '';
    filteredClubOptions: Observable<Club[]>;
    filteredCountries: Observable<string[]>;

    readonly allCountries: string[] = [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
        'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
        'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
        'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
        'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
        'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
        'Congo (Congo-Brazzaville)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
        'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
        'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
        'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany',
        'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
        'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
        'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
        'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
        'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
        'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
        'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
        'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
        'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
        'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
        'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
        'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
        'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
        'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
        'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
        'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
        'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
        'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
        'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
        'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
        'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
        'Yemen', 'Zambia', 'Zimbabwe',
    ];
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseConfirmationSuccessService: FuseConfirmationSuccessService,
        private _renderer2: Renderer2,
        private _facadeService: FacadeService,
        private handicapService: HandicapService,
        public snackBar: MatSnackBar,
        private _router: Router,
        private datepipe: DatePipe,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        public _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    async ngOnInit() {
        this.logger.log('ContactsDetailsComponent initialized', 'INFO');
        try {


            const params = await firstValueFrom(this._activatedRoute.paramMap);
            this.playerID = params.get('id');
            this.logger.log('Admin comes to Player Edit Page', "info", this.playerID);
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            let dataClubs: any;
            if (this._localStorage.isClubAdmin()) {
                this.hideClubs = this._localStorage.isClubAdmin() ? true : false;
                this.clubTitle = this.loggedInuser?.club?.name ?? '';
            }
            this.contactForm = new FormGroup({
                firstName: new FormControl('', [Validators.required]),
                lastName: new FormControl('', [Validators.required]),
                gender: new FormControl('male'),
                email: new FormControl('', [Validators.required]),
                phoneNumbers: new FormControl(''),
                dateOfBirth: new FormControl(''),
                category: new FormControl('Amateurs', [Validators.required]),
                handicap: new FormControl('0', [Validators.required]),
                handicapWhsIndex: new FormControl('0'),
                handicapWHS: new FormControl('0', [Validators.required]),
                club: new FormControl(
                    this._localStorage.isClubAdmin() ? this.clubTitle : '',
                    [Validators.required]
                ),
                country: new FormControl('Pakistan'),
                isClubAdmin: new FormControl('3'),
                membershipNo: new FormControl(''),
                status: new FormControl('false', [Validators.required]),
                notes: new FormControl(''),
                password: new FormControl('', !this.editMode ? [Validators.required, Validators.minLength(8)] : []),
                confirmPassword: new FormControl('', !this.editMode ? [Validators.required] : []),
            });
            this.playerCategories = this._facadeService.getPlayerCategories();
            this.filteredCountries = this.contactForm.get('country')!.valueChanges.pipe(
                startWith(this.contactForm.get('country')!.value ?? ''),
                map((value: string) => {
                    const search = (value ?? '').toLowerCase();
                    return search
                        ? this.allCountries.filter(c => c.toLowerCase().includes(search))
                        : this.allCountries.slice();
                }),
            );
            if (this._localStorage.isClubAdmin()) {
                dataClubs = await this._facadeService.getClubByID(
                    this.loggedInuser.adminClubId
                );
                this.golfClubs = dataClubs;
                this.filteredClubOptions = this.contactForm
                    .get('club')!
                    .valueChanges.pipe(
                        startWith(''),
                        map((value) =>
                            typeof value === 'string' ? value : value ? value.name : ''
                        ),
                        map((name) => (name ? this._filter(name) : this.golfClubs))
                    );
                //console.log(this.filteredClubOptions);
            } else if (this._localStorage.isSuperAdmin()) {
                dataClubs = await this._facadeService.getClubList();
                this.golfClubs = dataClubs.club;
                this.filteredClubOptions = this.contactForm
                    .get('club')!
                    .valueChanges.pipe(
                        startWith(''),
                        map((value) =>
                            typeof value === 'string' ? value : value ? value.name : ''
                        ),
                        map((name) => (name ? this._filter(name) : this.golfClubs))
                    );
                //console.log(this.filteredClubOptions);
            }
            if (this.playerID) {
                await this.fetchData();
            }


            if (this._localStorage.isClubAdmin()) {
                this.contactForm.get('club').clearValidators();
                //this.contactForm.get('club').updateValueAndValidity();
            }


        } catch (error) {
            this.logger.log('Getting Players Profile Edit Data Failed', "error", error.toString());
        }
    }

    ngOnDestroy(): void {
        this.logger.log('ContactsDetailsComponent destroyed', 'INFO');
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private _filter(value: string): Club[] {
        this.logger.log(`_filter called with value: ${value}`, 'DEBUG');
        if (value) {
            const filterValue = value.toLowerCase();

            return this.golfClubs.filter(
                (option) => option.name.toLowerCase().indexOf(filterValue) === 0
            );
        }

        return this.golfClubs;
    }

    changeHandicap(item) {
        this.logger.log(`changeHandicap called with item: ${item}`, 'DEBUG');
        if (
            item != null &&
            this.playerID &&
            this.currentPlayer.player[0].handicap !==
            this.contactForm.get('handicap').value
        ) {
            document.getElementById('comment').classList.remove('hidden');
            this.contactForm.get('notes').addValidators([Validators.required]);
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('Handicap changed, notes validator added.', 'INFO');
        } else if (
            this.playerID &&
            this.currentPlayer.player[0].handicap ==
            this.contactForm.get('handicap').value
        ) {
            document.getElementById('comment').classList.add('hidden');
            this.contactForm.get('notes').clearValidators();
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('Handicap not changed, notes validator cleared.', 'INFO');
        }
    }
    changeHandicapWHS(item) {
        this.logger.log(`changeHandicapWHS called with item: ${item}`, 'DEBUG');
        if (
            item != null &&
            this.playerID &&
            this.currentPlayer.player[0].handicapWhsIndex !==
            this.contactForm.get('handicapWhsIndex').value
        ) {
            document.getElementById('comment').classList.remove('hidden');
            this.contactForm.get('notes').addValidators([Validators.required]);
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('WHS Handicap changed, notes validator added.', 'INFO');
        } else if (
            this.playerID &&
            this.currentPlayer.player[0].handicapWhsIndex ==
            this.contactForm.get('handicapWhsIndex').value
        ) {
            document.getElementById('comment').classList.add('hidden');
            this.contactForm.get('notes').clearValidators();
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('WHS Handicap not changed, notes validator cleared.', 'INFO');
        }
    }
    changeHandicapWHSDiff(item) {
        this.logger.log(`changeHandicapWHSDiff called with item: ${item}`, 'DEBUG');
        if (
            item != null &&
            this.playerID &&
            this.handicapIndex !== this.contactForm.get('handicapWHS').value
        ) {
            document.getElementById('comment').classList.remove('hidden');
            this.contactForm.get('notes').addValidators([Validators.required]);
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('WHS Handicap difference changed, notes validator added.', 'INFO');
        } else if (
            this.playerID &&
            this.handicapIndex == this.contactForm.get('handicapWHS').value
        ) {
            document.getElementById('comment').classList.add('hidden');
            this.contactForm.get('notes').clearValidators();
            this.contactForm.get('notes').updateValueAndValidity();
            this.logger.log('WHS Handicap difference not changed, notes validator cleared.', 'INFO');
        }
    }

    displayFn(club: Club): string {
        this.logger.log(`displayFn called with club: ${JSON.stringify(club)}`, 'DEBUG');
        return typeof club === 'string' ? club : club ? club.name : '';
    }
    /**
     * Update the contact
     */
    async updateContact() {
        this.logger.log('updateContact called', 'INFO');
        try {
            if (this.handicapIndex != this.contactForm.get('handicapWHS').value) {
                this.changeWHSHandicap();
                this.logger.log('changeWHSHandicap called from updateContact', 'DEBUG');
            }
            let newFlag = true;
            let checkEmail: any = [];
            let checkPhone: any = [];
            let emailPlayerId: string = '';
            let phonePlayerId: string = '';

            let Hdate = new Date();

            let latest_date: any = this.datepipe.transform(
                Hdate,
                'yyyy-MM-ddThh:mm:ss.SSSSSS+00:00'
            );
            // Get the contact object

            const contact = this.contactForm.getRawValue();
            this.logger.log(`Contact form values: ${JSON.stringify(contact)}`, 'DEBUG');
            if (this.contactForm.valid) {
                if (!this.editMode && contact.email)
                    checkEmail = <Player>(
                        await this._facadeService.getPlayerByEmail(contact.email.toLowerCase())
                    );
                if (this.editMode && (contact.email != this.email))
                    checkEmail = <Player>(
                        await this._facadeService.getPlayerByEmail(contact.email.toLowerCase())
                    );
                if (checkEmail && checkEmail.length > 0) {
                    const alreadyInClub = checkEmail[0].membership?.some(
                        (m) => m.clubId === this.loggedInuser.adminClubId
                    );

                    if (alreadyInClub) {
                        const confirmation = this._fuseConfirmationService.open({
                            title: 'Duplicate Email',
                            message: 'Player already exists in this club.',
                            actions: {
                                confirm: {
                                    label: 'Close',
                                },
                            },
                        })
                        // e.g. this.toastService.show('Player already exists in this club');
                        return; // or continue / break depending on your loop context
                    }
                }
                if (!this.editMode && contact.membershipNo) {
                    checkEmail = [];
                    checkEmail = <Player>(
                        await this._facadeService.getPlayerByMembershipNumber(contact.membershipNo)
                    );
                    if (checkEmail && checkEmail.length > 0) {
                        const confirmation = this._fuseConfirmationService.open({
                            title: 'Duplicate Membership Number',
                            message: 'Player already exists in this club.',
                            actions: {
                                confirm: {
                                    label: 'Close',
                                },
                            },
                        })
                        // e.g. this.toastService.show('Player already exists in this club');
                        return; // or continue / break depending on your loop context

                    }

                }

                // if (checkEmail.length > 0) emailPlayerId = checkEmail[0].id;

                // if (checkPhone.length > 0) phonePlayerId = checkPhone[0].id;

                // if (
                //     checkEmail.length > 0 &&
                //     emailPlayerId !== '' &&
                //     emailPlayerId !== this.playerID
                // ) {
                //     const confirmation = this._fuseConfirmationService.open({
                //         title: 'Duplicate Email',
                //         message: 'Player already exist!. Do you want to add this player to your club?',
                //         actions: {
                //             confirm: {
                //                 label: 'Yes',
                //             },
                //         },
                //     }).afterClosed().subscribe(async (result) => {
                //         if (result === 'confirmed') {
                //             let clubMember: any[] = [];
                //             clubMember.push({
                //                 clubId: this.loggedInuser.adminClubId,
                //                 suspended: false,
                //                 playerId: checkEmail[0].id
                //             })
                //             let response = await this._facadeService.insertClubMember(clubMember);
                //             if (response) {
                //                 this.save = true;
                //                 this.snackBar.open('Player has been added.', 'x', {
                //                     duration: 1000,
                //                 });
                //                 this.reset();
                //                 this._router.navigate(['/players']);
                //             }
                //         }
                //     });


                //     return;
                // } else if (
                //     checkPhone.length > 0 &&
                //     phonePlayerId !== '' &&
                //     phonePlayerId !== this.playerID
                // ) {
                //     const confirmation = this._fuseConfirmationService.open({
                //         title: 'Duplicate Number',
                //         message: 'Player already exist!. Do you want to add this player to your club?',
                //         actions: {
                //             confirm: {
                //                 label: 'Yes',
                //             },
                //         },
                //     }).afterClosed().subscribe(async (result) => {
                //         if (result === 'confirmed') {
                //             let clubMember: any[] = [];
                //             clubMember.push({
                //                 clubId: this.loggedInuser.adminClubId,
                //                 suspended: false,
                //                 playerId: checkEmail[0].id
                //             })
                //             let response = await this._facadeService.insertClubMember(clubMember);
                //             if (response) {
                //                 this.save = true;
                //                 this.snackBar.open('Player has been added.', 'x', {
                //                     duration: 1000,
                //                 });
                //                 this.reset();
                //                 this._router.navigate(['/players']);
                //             }
                //         }
                //     });

                //     return;
                // } else if (
                //     (checkEmail.length > 0 && this.playerID) ||
                //     (checkPhone.length > 0 && this.playerID)
                // ) {
                //     newFlag = false;
                // } else {
                // }
            }
            let clubMember: ClubMembership[] = [];
            let UniqueId: string = '';
            let GEMId: string = '';
            let players: any[] = await this._facadeService.getallPlayersforGGid();
            var sortarray = players['player'];
            //      sortarray.sort(this.Comparator);
            //console.log(sortarray);

            this.playerID
                ? (UniqueId = this.playerID)
                : (UniqueId = UniqueIdGenerator.generate());
            this.playerID
                ? (GEMId = this.currentPlayer.player[0].gemId)
                : (GEMId = generateGemId.generate(sortarray[0].gemId));
            //console.log(GEMId);

            ////console.log(playerFormValue.playerClubMember);
            if (this._localStorage.isClubAdmin()) {
                let member: any = {
                    clubId:
                        typeof contact.club === 'string'
                            ? this.loggedInuser.adminClubId
                            : contact.club
                                ? contact.club.id
                                : '',
                    suspended: this.contactForm.get('status').value,
                };
                //console.log(member);
                clubMember.push(member);
            }
            const player: Player = {
                id: UniqueId,
                adminClubId: null,
                firebaseUid: this.playerID
                    ? this.currentPlayer.player[0].firebaseUid
                    : null,
                addedBy: this.loggedInuser.id,
                fcmToken: this.playerID
                    ? this.currentPlayer.player[0].fcmToken
                    : null,
                gemId: GEMId,
                firstName: contact.firstName,
                lastName: contact.lastName,
                gender: contact.gender,
                dob: General.parseToDate(contact.dateOfBirth),
                picture: null,
                email: contact.email,
                phone: contact.phoneNumbers,
                playerCategory: contact.category,
                handicapWhsIndex: contact.handicapWhsIndex,
                handicap: contact.handicap,
                online: false,
                countryCode: contact.country,
                extraData: contact.notes,
                userRole: 3,
                membership: clubMember,
                membershipNumber: contact.membershipNo,
                homeClubId: clubMember[0].clubId ?? '',
            };
            let password = this.contactForm.get('password').value || `${player.firstName}123`;

            // Validate passwords match for new players
            if (!this.editMode) {
                const confirmPwd = this.contactForm.get('confirmPassword').value;
                if (password !== confirmPwd) {
                    this.snackBar.open('Passwords do not match.', 'x', { duration: 3000 });
                    return;
                }
            }

            if (!this.editMode) {
                if (this._localStorage.isClubAdmin() || this._localStorage.isSuperAdmin()) {
                    // AddPlayer must run FIRST while the admin Firebase session is still
                    // active. Creating the Firebase user account (updateAccountInFirebase)
                    // can change the current auth state to the new player, whose token
                    // lacks Hasura JWT claims — causing the mutation to fail if run after.
                    const isSuccess = <boolean>(await this._facadeService.AddPlayer(player));
                    if (isSuccess) {
                        // Now create the Firebase account (safe to do after Hasura write)
                        this._facadeService.updateAccountInFirebase(player.email, password).subscribe((re) => {
                            if (re) {
                                this._facadeService.sendTransactionalEmail(player.email, player.firstName, password).subscribe();
                            }
                        });
                        this.save = true;
                        this.snackBar.open('Player has been created.', 'x', {
                            duration: 1000,
                        });
                        this.reset();
                        this._router.navigate(['/players']);
                    } else {
                        this.snackBar.open('Error!. Please try again.', 'x', {
                            duration: 1000,
                        });
                    }
                } else {
                    let state = this._localStorage.get(Constants.STATE);
                    if (state == Constants.TOUR) {
                        let tourMember = {
                            tourId: this._localStorage.get(Constants.TOUR_ID),
                            playerId: UniqueId,
                        }
                        const isSuccess = <boolean>(
                            await this._facadeService.AddTourPlayer(player, tourMember)
                        );
                        if (isSuccess) {
                            this.save = true;
                            this.snackBar.open('Player has been created.', 'x', {
                                duration: 1000,
                            });
                            this.reset();
                            this._router.navigate(['/players']);
                        }
                    } else if (state == Constants.LEAGUE) {
                        let leagueMember = {
                            leagueId: this._localStorage.get(Constants.LEAGUE_ID),
                            playerId: UniqueId,
                        }
                        const isSuccess = <boolean>(
                            await this._facadeService.AddLeaguePlayer(player, leagueMember)
                        );
                        if (isSuccess) {
                            this.save = true;
                            this.snackBar.open('Player has been created.', 'x', {
                                duration: 1000,
                            });
                            this.reset();
                            this._router.navigate(['/players']);
                        }
                    }
                }
            } else {
                const isSuccess = <boolean>(
                    await this._facadeService.updatePlayer(player)
                );

                if (this.currentPlayer.player[0].handicap !== contact.handicap) {
                    //console.log(this.tournamentId);

                    const handicap_change_log: handicap_change_log = {
                        id: UniqueIdGenerator.generate(),
                        playerId: this.currentPlayer.player[0].id
                            ? this.currentPlayer.player[0].id
                            : null,
                        newHandicap: contact.handicap ? contact.handicap : 0,
                        oldHandicap: this.currentPlayer.player[0].handicap
                            ? this.currentPlayer.player[0].handicap
                            : 0,
                        whs: false,
                        dateTime: latest_date,
                        remarks: this.contactForm.get('notes').value,
                        tournamentId: null,
                        updaterId: this.loggedInuser.id,
                    };

                    //console.log(handicap_change_log);
                    //this.handicapLog = handicap_change_log;

                    const remarksAdded = <boolean>(
                        await this._facadeService.AddHandicapRemarks(
                            handicap_change_log
                        )
                    );
                    let response = await this._facadeService.updateConguHandicap(
                        this.playerID,
                        contact.handicap ? contact.handicap : 0,
                        this.tournamentId
                    );
                    //console.log(remarksAdded);
                } else if (
                    this.currentPlayer.player[0].handicapWhsIndex !==
                    contact.handicapWhsIndex
                ) {
                    const handicap_change_log: handicap_change_log = {
                        id: UniqueIdGenerator.generate(),
                        playerId: this.currentPlayer.player[0].id
                            ? this.currentPlayer.player[0].id
                            : null,
                        newHandicap: contact.handicapWhsIndex
                            ? contact.handicapWhsIndex
                            : 0,
                        oldHandicap: this.currentPlayer.player[0].handicapWhsIndex
                            ? this.currentPlayer.player[0].handicapWhsIndex
                            : 0,
                        whs: false,
                        dateTime: latest_date,
                        remarks: this.contactForm.get('notes').value,
                        tournamentId: null,
                        updaterId: this.loggedInuser.id,
                    };

                    //console.log(handicap_change_log);
                    //this.handicapLog = handicap_change_log;

                    const remarksAdded = <boolean>(
                        await this._facadeService.AddHandicapRemarks(
                            handicap_change_log
                        )
                    );
                    //console.log(remarksAdded);
                }

                if (
                    this.handicapIndex != this.contactForm.get('handicapWHS').value
                ) {
                    const handicap_change_log: handicap_change_log = {
                        id: UniqueIdGenerator.generate(),
                        playerId: this.currentPlayer.player[0].id
                            ? this.currentPlayer.player[0].id
                            : null,
                        newHandicap: contact.handicap ? contact.handicap : 0,
                        oldHandicap: this.currentPlayer.player[0].handicap
                            ? this.currentPlayer.player[0].handicap
                            : 0,
                        whs: false,
                        dateTime: latest_date,
                        remarks: this.contactForm.get('notes').value,
                        tournamentId: null,
                        updaterId: this.loggedInuser.id,
                    };

                    //console.log(handicap_change_log);
                    //this.handicapLog = handicap_change_log;

                    const remarksAdded = <boolean>(
                        await this._facadeService.AddHandicapRemarks(
                            handicap_change_log
                        )
                    );
                    //console.log(remarksAdded);
                }

                ////console.log(isSuccess);
                if (isSuccess) {
                    this.save = true;
                    this.snackBar.open('Player has been updated.', 'x', {
                        duration: 1000,
                    });
                    //this._router.navigate(['/players']);
                }
            }
        } catch (error) {
            this.logger.log('Updating Players Profile Data Failed', "error", error.toString());
        }
    }

    public Comparator(a, b) {
        //console.log(a);
        //console.log(b);

        try {
            if (a['gemId']?.trim() !== '' && b['gemId']?.trim() !== '') {
                let gemIDA = parseInt(a['gemId'].slice(2));
                let gemIDB = parseInt(b['gemId'].slice(2));
                if (gemIDA < gemIDB) return 1;
                if (gemIDA > gemIDB) return -1;

                return 0;
            }
        } catch (error) {
            //console.log(error);
        }

    }

    public reset() {
        // if (this._localStorage.isClubAdmin()) {
        //   this.playerForm.get("playerClubMember").setValue(this.clubTitle);
        // }

        this.contactForm.get('firstName').setValue('');
        this.contactForm.get('lastName').setValue('');
        this.contactForm.get('email').setValue('');
        this.contactForm.get('phoneNumbers').setValue('');
        this.contactForm.get('dateOfBirth').setValue('');
        this.contactForm.get('category').setValue('');
        this.contactForm.get('handicap').setValue('');
        this.contactForm.get('membershipNo').setValue('');
        this.contactForm.get('notes').setValue('');
        this.contactForm.get('notes').clearValidators();
        this.contactForm.get('notes').updateValueAndValidity();
    }
    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    cancel() {
        //console.log(this.contactForm.value);

        // this._router.navigate(['/players'], {
        //     relativeTo: this._activatedRoute,
        // });
    }

    /**
     * Delete the contact
     */
    deleteContact(): void {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete contact',
            message:
                'Are you sure you want to delete this contact? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Get the current contact's id
                // const id = this.contact.id;

                // // Get the next/previous contact's id
                // const currentContactIndex = this.contacts.findIndex(
                //     (item) => item.id === id
                // );
                // const nextContactIndex =
                //     currentContactIndex +
                //     (currentContactIndex === this.contacts.length - 1 ? -1 : 1);
                // const nextContactId =
                //     this.contacts.length === 1 && this.contacts[0].id === id
                //         ? null
                //         : this.contacts[nextContactIndex].id;

                // Delete the contact
                // this._contactsService.deleteContact(id)
                //     .subscribe((isDeleted) => {

                //         // Return if the contact wasn't deleted...
                //         if ( !isDeleted )
                //         {
                //             return;
                //         }

                //         // Navigate to the next contact if available
                //         if ( nextContactId )
                //         {
                //             this._router.navigate(['../', nextContactId], {relativeTo: this._activatedRoute});
                //         }
                //         // Otherwise, navigate to the parent
                //         else
                //         {
                //             this._router.navigate(['../'], {relativeTo: this._activatedRoute});
                //         }

                //         // Toggle the edit mode off
                //         this.toggleEditMode(false);
                //     });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    async fetchData() {
        if (this.playerID) {
            this.currentPlayer =
                await this._facadeService.getPlayerByIDDetailForm(
                    this.playerID
                );
            this.logger.log('Getting Player Edit Profile Data Successfull', "info", this.currentPlayer?.toString());
        }
        if (this.currentPlayer?.player?.length > 0) {
            const player = this.currentPlayer.player[0];
            this.handicapsWhs = player.handicapWhsIndex;
            this.email = player.email;
            this.membershipNo = player.membershipNumber;
            this.editMode = true;
            this.tournamentId =
                player.handicap_history && player.handicap_history.length > 0
                    ? player.handicap_history[0].tournamentId
                    : null;
            this.contactForm.get('password').clearValidators();
            this.contactForm.get('password').updateValueAndValidity();
            this.contactForm.get('confirmPassword').clearValidators();
            this.contactForm.get('confirmPassword').updateValueAndValidity();
            this.contactForm.patchValue({
                firstName: player.firstName,
                lastName: player.lastName,
                gender: player.gender,
                email: player.email,
                phoneNumbers: player.phone,
                dateOfBirth: player.dob,
                category: player.playerCategory,
                handicap: player.handicap,
                handicapWhsIndex: player.handicapWhsIndex,
                handicapWHS: 0,
                country: player.countryCode,
                notes: '',
                membershipNo: player.membershipNumber,
                club: player.membership[0] ? player.membership[0].club : '',
                isClubAdmin: player.adminClubId ? '1' : '0',
                status: player.membership[0] && player.membership[0].suspended ? 'true' : 'false',
            });
        }
        this._changeDetectorRef.markForCheck();
    }

    async changeWHSHandicap() {
        let newHandicapDifferentils = this.contactForm.get('handicapWHS').value;
        let obj = {
            playerId: this.playerID,
            count: 40,
            diffChange: newHandicapDifferentils,
        };
        await this.handicapService
            .adjustHandicapWHS(obj)
            .then((response) => {
                //console.log(response);
            })
            .catch((err) => {
                //console.log('error' + err);
                this.snackBar.open('Error!.', 'x', {
                    duration: 5000,
                });
            });
    }
}
