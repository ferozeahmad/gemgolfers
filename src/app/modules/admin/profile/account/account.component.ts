import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { LogsService } from 'app/shared/services/logs.service';
import { FacadeService } from 'app/shared/services/facade.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants } from 'app/shared/classes/general';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

@Component({
    standalone: false,
    selector: 'settings-account',
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsAccountComponent implements OnInit {

    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    accountForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    // account: AccountModel;
    phoneValidator: boolean = false;
    emailValidator: boolean = false;
    filteredOptions: Observable<string[]>;
    options: any[] = [];
    currentPlayer: any;
    _loggedInUser: UserSessionModel;
    pictureUrl: string = '';
    file: any;
    user: User;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: MatSnackBar,
        private _userService: UserService,
        private logger: LogsService,
        private _facadeService: FacadeService,
        private _localStorage: LocalStorageService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    async ngOnInit() {
        // Create the form
        // Create the form
        try {

            this.logger.log("User landed on user profile page", 'info');
            this.logger.log("Fetching user profile data", 'info');
            this.accountForm = this._formBuilder.group({
                firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
                lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
                phone: [''],
                // password: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
            });

            this._loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);

            let currentID: string = this._loggedInUser ? this._loggedInUser?.id : "";

            this.currentPlayer =
                await this._facadeService.getPlayerByIDDetailForm(
                    currentID
                );
            console.log(this.currentPlayer);

            if (this.currentPlayer.player.length > 0) {
                this.accountForm.setValue({
                    firstName: this.currentPlayer.player[0].firstName,
                    lastName: this.currentPlayer.player[0].lastName,
                    email: this.currentPlayer.player[0].email,
                    phone: this.currentPlayer.player[0].phone,
                })
                this.pictureUrl = this.currentPlayer.player[0].picture
            }
            this.logger.log("Fetching user profile data successful", 'info');

        } catch (error) {
            this.logger.log("Fetching user profile data failed", 'error', error?.toString());
            // this.logger.error("Fetching user profile data failed", error);
        }
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

    async validateEmail(email: string) {

        this.emailValidator = false;
        // this._facadeService.getPlayerByEmail(email).subscribe((account: AccountModel) => {
        //     if (account && (Object.keys(account).length !== 0))
        //         this.emailValidator = true;
        // });
        let exist = await this._facadeService.getPlayerByEmail(email);
        if (exist) {
            this.phoneValidator = true;
        }
    }

    async validatePhone(phone: string) {

        this.phoneValidator = false;
        let exist = await this._facadeService.getPlayerByPhone(phone);
        if (exist) {
            this.phoneValidator = true;
        }
        // .subscribe((account: AccountModel) => {
        //     if (account && (Object.keys(account).length !== 0))
        //         this.phoneValidator = true;
        // });
    }


    /**
    * Update the contact
    */
    async updateContact(): Promise<void> {
        this.logger.log("User click on Save in user profile page", 'info');
        try {

            if (this.phoneValidator) {
                this.logger.log("User profile update blocked: phone number already exists", 'warn');
                this._fuseConfirmationService.open({
                    title: 'Duplicate Number',
                    message: 'Phone number already exist!.',
                    actions: {
                        confirm: {
                            label: 'Close',
                        },
                    },
                })
            } else if (this.emailValidator) {
                this.logger.log("User profile update blocked: email already exists", 'warn');
                this._fuseConfirmationService.open({
                    title: 'Duplicate Email',
                    message: 'Email already exist!.',
                    actions: {
                        confirm: {
                            label: 'Close',
                        },
                    },
                })
            } else {
                // Get the contact object
                const _account = this.accountForm.getRawValue();

                const player: Player = {
                    id: this.currentPlayer.player[0].id,
                    adminClubId: null,
                    firebaseUid: this.currentPlayer.player[0].firebaseUid,
                    addedBy: this._loggedInUser.id,
                    fcmToken: this.currentPlayer.player[0].fcmToken,
                    gemId: null,
                    firstName: _account.firstName,
                    lastName: _account.lastName,
                    gender: null,
                    dob: null,
                    picture: this.pictureUrl,
                    email: _account.email,
                    phone: _account.phone,
                    playerCategory: this.currentPlayer.player[0].playerCategory,
                    handicapWhsIndex: this.currentPlayer.player[0].handicapWhsIndex,
                    handicap: this.currentPlayer.player[0].handicap,
                    online: false,
                    countryCode: this.currentPlayer.player[0].countryCode,
                    extraData: null,
                    userRole: null,
                    membership: null,
                    membershipNumber: this.currentPlayer.player[0].membershipNo,
                    homeClubId: null,
                };

                this.logger.log("Updating user profile", 'info', { playerId: player.id, hasNewPicture: !!this.file });
                this._facadeService.updatePlayerProfile(player, this.file).subscribe((res) => {
                    // if(res){
                    //     this.
                    // }
                    console.log(res);

                    this._userService.update({
                        ...this.user,
                        avatar: res
                    }).subscribe();

                    this.logger.log("User profile updated successfully", 'info');
                    this._snackBar.open("Account has been updated.", "x", {
                        duration: 5 * 3000,
                    });
                });

            }

        } catch (error) {
            this.logger.log("User profile updating failed", 'error', error?.toString());
            // this.logger.error("User profile updating failed", error);

        }

    }

    /**
    * Upload avatar
    *
    * @param fileList
    */
    uploadAvatar(fileList: FileList): void {
        this.logger.log("User selected a profile picture in user profile page", 'info', fileList?.[0]?.name);
        // Return if no file is selected
        if (!fileList || fileList.length === 0) {
            this.pictureUrl = null;
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const file = fileList[0];

        // Validate the file type
        if (!allowedTypes.includes(file.type)) {
            this.logger.log("Invalid profile picture file type in user profile page", 'warn', file.type);
            console.error('Invalid file type');
            return;
        }

        this.file = file;

        // Use FileReader to read the file and update the preview URL
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            this.pictureUrl = event.target?.result as string;
            this._changeDetectorRef.detectChanges();
        };
        reader.readAsDataURL(this.file);
    }

    /**
     * Remove the avatar
     */
    removeAvatar(): void {
        this.logger.log("User click on Remove profile picture in user profile page", 'info');
        // Get the form control for 'avatar'
        // const avatarFormControl = this.personnelForm.get('avatar');
        // // Set the avatar as null
        // avatarFormControl.setValue(null);
        // Set the file input value as null
        this._avatarFileInput.nativeElement.value = null;
        this.pictureUrl = null;
        this.file = null;
        // Update the contact
        // this.contact.avatar = null;
    }
}
