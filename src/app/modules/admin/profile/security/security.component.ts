import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'settings-security',
    templateUrl: './security.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSecurityComponent implements OnInit {
    securityForm: UntypedFormGroup;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private afAuth: AngularFireAuth,
        private _snackBar: MatSnackBar,
        private logger: LogsService,
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.logger.log('Admin comes to Profile Security Page', "info");
        // Create the form
        // this.logger.info("User landed on user security page");
        this.securityForm = this._formBuilder.group({
            currentPassword: [''],
            newPassword: ['']
        });
    }
    async changePassword() {
        this.logger.log('Admin Click on Change Password in Profile Security Page', "info");
        try {

            const user = await this.afAuth.currentUser;
            const _formValue = this.securityForm.getRawValue();
            // this.logger.info("User click on update password button", _formValue);

            // this.logger.info("Checking user firebase session", user);

            if (user) {
                // this.logger.info("User firebase session is available", user);
                const _formValue = this.securityForm.getRawValue();
                const credential = await this.afAuth.signInWithEmailAndPassword(user.email, _formValue.currentPassword);

                if (credential) {
                    await user.updatePassword(_formValue.newPassword);
                    this.logger.log('Password changed successfully in Profile Security Page', "info");
                    // this.logger.info("User password updated successfully", credential);
                    this._snackBar.open("Password changed successfully.", "x", {
                        duration: 5 * 3000,
                    });

                } else {
                    this.logger.log('Changing Password Failed in Profile Security Page: incorrect current password', "warn");
                    // this.logger.error("User firebase crendentials are not correct", credential);
                    this._snackBar.open("Incorrect current password.", "x", {
                        duration: 5 * 3000,
                    });
                }
            } else {
                this.logger.log('Changing Password Failed in Profile Security Page: user session is not available', "warn");
                // this.logger.error("User firebase session is not available");
            }
        } catch (error) {
            this.logger.log('Changing Password Failed in Profile Security Page', "error", error?.code || error?.message);
            // this.logger.error("Error in changing password", error);
            // console.error('Error changing password:', error);
            this._snackBar.open("Error changing password.", "x", {
                duration: 5 * 3000,
            });
        }

        // Reset the form after the operation is complete.
        this.securityForm.reset();
    }

}
