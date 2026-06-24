import { Component, Inject, OnInit, Optional } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlayerRegistrationService } from '../player-registration.service';
import { FacadeService } from 'app/shared/services/facade.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants, UniqueIdGenerator } from 'app/shared/classes/general';
import { UserSessionModel } from 'app/shared/models/player.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    selector: 'app-player-registration-form',
    templateUrl: './player-registration-form.component.html',
    standalone: false,
})
export class PlayerRegistrationFormComponent implements OnInit {
    form: FormGroup;
    isLoading = false;
    isEditMode = false;
    minDate: Date;
    maxDate;
    clubs: any[] = [];
    loggedInUser: UserSessionModel;
    showEmailField = false;
    playerFoundByEmail = false;
    playerNotFound = false;
    playerExistsInClub = false;
    foundPlayerId: string | null = null;
    foundPlayerDetails: any;

    constructor(
        private fb: FormBuilder,
        private _playerRegistrationService: PlayerRegistrationService,
        public dialogRef: MatDialogRef<PlayerRegistrationFormComponent>,
        @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
        private _facadeService: FacadeService,
        private _localStorage: LocalStorageService,
        private _logger: LogsService
    ) {

    }

    async ngOnInit() {
        this._logger.log('PlayerRegistrationFormComponent initialized', "info");
        this.loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.isEditMode = !!this.data?.entry;
        this._logger.log(`Form in edit mode: ${this.isEditMode}`, "info", this.data?.entry);
        this.minDate = new Date(2000, 0, 1);
        this.maxDate = new Date();
        const today = new Date();
        this.form = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.email]],
            handicap: [null, [Validators.required, Validators.min(0), Validators.max(54)]],
            amount: [0, [Validators.required, Validators.min(0)]],
            date: [today, [Validators.required]],
            clubId: ['Guest', [Validators.required]], // Default to 'Guest'
        });

        // Fetch clubs
        let clubs = await this._facadeService.getClubList();
        this.clubs = clubs.club;
        this.clubs.unshift({ id: 'Guest', name: 'Guest' }); // Add Guest option at the beginning
        this._logger.log(`Clubs fetched: ${this.clubs.length} including Guest option.`, "info");

        // Listen for clubId changes
        this.form.get('clubId')?.valueChanges.subscribe((value) => {
            this.showEmailField = value !== 'Guest';
            const emailControl = this.form.get('email');
            if (this.showEmailField) {
                emailControl?.setValidators([Validators.required, Validators.email]);
                this._logger.log('Email field validators set (required, email).', "info");
            } else {
                emailControl?.clearValidators();
                emailControl?.setValue('');
                this.playerFoundByEmail = false;
                this.playerNotFound = false;
                this.playerExistsInClub = false;
                this.foundPlayerId = null;
                this.foundPlayerDetails = null;
                this._logger.log('Email field validators cleared and state reset.', "info");
            }
            emailControl?.updateValueAndValidity();
            this._logger.log(`Club ID changed to: ${value}. Show email field: ${this.showEmailField}`, "info");
        });

        // Listen for email changes
        this.form.get('email')?.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                switchMap(async (email) => {
                    if (email && this.showEmailField && this.form.get('email')?.valid) {
                        this._logger.log(`Email input changed to: ${email}. Checking player...`, "info");
                        await this.checkPlayerByEmail(email);
                    } else {
                        this.playerFoundByEmail = false;
                        this.playerNotFound = false;
                        this.playerExistsInClub = false;
                        this.foundPlayerId = null;
                        this.foundPlayerDetails = null;
                        this._logger.log('Email input invalid or field not shown. Resetting player search state.', "info");
                    }
                    return of(null);
                })
            )
            .subscribe();


        if (this.isEditMode) {
            this.populateForm(this.data.entry);
        }
    }

    /**
     * Populate form with entry data
     */
    private populateForm(entry: any): void {
        this.form.patchValue({
            firstName: entry.firstName,
            lastName: entry.lastName,
            handicap: entry.handicap,
            amount: entry.amount,
            date: new Date(entry.date),
            clubId: entry.playerClubId || 'Guest',
            email: entry.email || '',
        });
        if (entry.playerClubId !== 'Guest') {
            this.showEmailField = true;
            this.form.get('email')?.setValidators([Validators.required, Validators.email]);
            this.form.get('email')?.updateValueAndValidity();
        }
        this._logger.log('Form populated with entry data.', "info", entry);
    }

    /**
     * Check player by email
     */
    private async checkPlayerByEmail(email: string): Promise<void> {
        this.playerFoundByEmail = false;
        this.playerNotFound = false;
        this.playerExistsInClub = false;
        this.foundPlayerId = null;
        this.foundPlayerDetails = null;
        this._logger.log(`Initiating player check for email: ${email}`, "info");

        try {
            const result = await this._facadeService.getPlayerByEmail(email);
            const selectedClubId = this.form.get('clubId')?.value;

            if (result && result.length > 0) {
                this._logger.log(`Player(s) found by email: ${email}`, "info", result);
                this.playerFoundByEmail = true;
                const matchingPlayerInClub = result.find((player: any) =>
                    player.membership?.some((m: any) => m.clubId === selectedClubId)
                );

                if (selectedClubId !== 'Guest') {
                    if (matchingPlayerInClub) {
                        this.foundPlayerId = matchingPlayerInClub.id;
                        this.foundPlayerDetails = matchingPlayerInClub;
                        this.playerExistsInClub = true;
                        this.form.get('email')?.setErrors(null);
                        this.playerNotFound = false;
                        this._logger.log(`Player found and is a member of club ${selectedClubId}`, "info", matchingPlayerInClub);
                    } else {
                        this._logger.log(`Player found by email (${email}), but not in selected club's (${selectedClubId}) membership.`, "warn");
                        this.playerExistsInClub = false;
                        this.playerNotFound = true;
                        this.form.get('email')?.setErrors({ notFound: true });
                        this.foundPlayerId = null;
                        this.foundPlayerDetails = null;
                    }
                } else {
                    // If 'Guest' is selected, we still want to store the first found player's details
                    // in case they are used in a subsequent step (e.g., if we decide to link a guest entry to an existing player).
                    this.foundPlayerId = result[0].id;
                    this.foundPlayerDetails = result[0];
                    this.playerExistsInClub = false;
                    this.playerNotFound = false;
                    this.form.get('email')?.setErrors(null);
                    this._logger.log(`Player found by email (${email}) while 'Guest' is selected. Storing first player's details.`, "info", result[0]);
                }
            } else {
                // No player found at all by email
                this._logger.log(`No player found for email: ${email}`, "warn");
                this.playerFoundByEmail = false;
                this.playerNotFound = true;
                this.form.get('email')?.setErrors({ notFound: true });
                this.foundPlayerId = null;
                this.foundPlayerDetails = null;
            }
        } catch (error) {
            console.error('Error checking player by email:', error);
            this._logger.log(`Error checking player by email (${email}): ${error.message}`, "error", error);
            this.playerNotFound = true;
            this.form.get('email')?.setErrors({ notFound: true });
        }
    }


    /**
     * Submit form
     */
    async onSubmit(): Promise<void> {
        this._logger.log('Form submission initiated.', "info");
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this._logger.log('Form is invalid. Marking all as touched and returning.', "warn", this.form.errors);
            return Promise.resolve();
        }

        this.isLoading = true;
        const formValue = this.form.value;
        this._logger.log('Form is valid. Preparing payload.', "info", formValue);

        const commonPayload = {
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            handicap: formValue.handicap,
            amount: formValue.amount,
            date: this.formatDate(formValue.date),
            adminClubId: this.loggedInUser?.clubId || null,
        };

        if (this.isEditMode) {
            this._logger.log(`Updating existing guest entry with ID: ${this.data.entry.id}`, "info", commonPayload);
            // Update existing entry
            const payload = {
                ...commonPayload,
                playerClubId: formValue.clubId === 'Guest' ? 'Guest' : formValue.clubId,
            };
            this._playerRegistrationService
                .updateGuestEntry(this.data.entry.id, payload)
                .subscribe({
                    next: (result) => {
                        this.isLoading = false;
                        this.dialogRef.close(result);
                        this._logger.log('Guest entry updated successfully.', "info", result);
                    },
                    error: (error) => {
                        console.error('Error updating entry:', error);
                        this.isLoading = false;
                        this._logger.log(`Error updating guest entry: ${error.message}`, "error", error);
                    },
                });
        } else {
            // Create new entry
            if (formValue.clubId === 'Guest') {
                this._logger.log('Creating new guest entry (Guest club selected).', "info", commonPayload);
                let uniqueId = UniqueIdGenerator.generate()
                // Create new player and then guest entry
                const playerPayload = {
                    id: uniqueId, // ID will be generated by backend
                    adminClubId: null,
                    firebaseUid: null,
                    fcmToken: null,
                    gemId: null,
                    addedBy: this.loggedInUser.id,
                    firstName: formValue.firstName,
                    lastName: formValue.lastName,
                    gender: null,
                    dob: null,
                    picture: null,
                    email: formValue.email || '',
                    phone: null,
                    playerCategory: null,
                    handicap: formValue.handicap,
                    online: false,
                    countryCode: null,
                    extraData: null,
                    userRole: 3,
                    membership: null,
                    membershipNumber: '',
                };
                this._logger.log('Player payload for new guest:', "debug", playerPayload);

                try {
                    const playerResult = await this._facadeService.AddPlayer(playerPayload);
                    this._logger.log('New player created successfully.', "info", playerResult);
                    const guestPayload = {
                        ...commonPayload,
                        playerClubId: 'Guest',
                        id: uniqueId, // Use the new player's ID
                        email: formValue.email || '',
                    };
                    this._logger.log('Guest entry payload:', "debug", guestPayload);
                    const guestResult = await this._playerRegistrationService.createGuestEntry(guestPayload).toPromise();
                    this.isLoading = false;
                    this.dialogRef.close(guestResult);
                    this._logger.log('Guest entry created successfully after new player creation.', "info", guestResult);
                } catch (error) {
                    console.error('Error creating player or guest entry:', error);
                    this.isLoading = false;
                    this._logger.log(`Error creating player or guest entry: ${error.message}`, "error", error);
                }
            } else {
                this._logger.log(`Creating new guest entry (Club ${formValue.clubId} selected).`, "info", commonPayload);
                // Club selected, check if player found by email
                if (this.playerFoundByEmail && this.foundPlayerId) {
                    const guestPayload = {
                        ...commonPayload,
                        id: this.foundPlayerId, // Use found player's ID
                        playerClubId: formValue.clubId,
                        firstName: this.foundPlayerDetails.firstName,
                        lastName: this.foundPlayerDetails.lastName,
                        email: this.foundPlayerDetails.email,
                    };
                    this._logger.log('Guest entry payload for existing player:', "debug", guestPayload);
                    this._playerRegistrationService.createGuestEntry(guestPayload).subscribe({
                        next: (result) => {
                            this.isLoading = false;
                            this.dialogRef.close(result);
                            this._logger.log('Guest entry created successfully for existing player.', "info", result);
                        },
                        error: (error) => {
                            console.error('Error creating guest entry:', error);
                            this.isLoading = false;
                            this._logger.log(`Error creating guest entry for existing player: ${error.message}`, "error", error);
                        },
                    });
                } else {
                    console.error('Player not found or no player ID available.');
                    this.isLoading = false;
                    this._logger.log('Player not found by email or no player ID available for guest entry in selected club.', "error");
                    // Optionally, show an error message to the user
                    this.form.get('email')?.setErrors({ notFound: true });
                }
            }
        }
    }

    /**
     * Close dialog
     */
    onCancel(): void {
        this.dialogRef.close();
        this._logger.log('Dialog cancelled.', "info");
    }

    /**
     * Get form field error message
     */
    getErrorMessage(fieldName: string): string {
        const control = this.form.get(fieldName);

        if (!control?.errors) {
            return '';
        }

        if (control.errors['required']) {
            return `${fieldName} is required`;
        }

        if (control.errors['minlength']) {
            return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
        }

        if (control.errors['email']) {
            return `Invalid email format`;
        }

        if (control.errors['notFound']) {
            return `No player found with this email`;
        }

        if (control.errors['playerExistsInClub']) {
            return `Player is already a member of this club`;
        }

        if (control.errors['min']) {
            return `${fieldName} must be at least ${control.errors['min'].min}`;
        }

        if (control.errors['max']) {
            return `${fieldName} cannot exceed ${control.errors['max'].max}`;
        }

        return 'Invalid input';
    }

    /**
     * Format date to YYYY-MM-DD string
     */
    private formatDate(date: Date): string {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    }
}
