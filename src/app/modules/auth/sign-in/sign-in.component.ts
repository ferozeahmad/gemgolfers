import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    showPassword: boolean = false;
    loggedInuser: any;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _localStorage: LocalStorageService,
        private logger: LogsService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.logger.log('User comes to Sign In Page', "info");
        // Create the form
        this.signInForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            rememberMe: ['']
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        this.logger.log('User Click on Sign In in Sign In Page', "info", this.signInForm.get('email').value);
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;
        // this.logger.log('User Logging In', "info");

        // Sign in
        this._authService.signIn(this.signInForm.value)
            .subscribe(
                (data) => {

                    // // Set the redirect url.
                    // // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                    // // to the correct page after a successful sign in. This way, that url can be set via
                    // // routing file and we don't have to touch here.
                    // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                    // this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
                    // // Navigate to the redirect url\

                    // // this.logger.log('User Logged In Succesfully', "info");

                    // if (this.loggedInuser.userRole === 8) {
                    //     this._router.navigateByUrl('/reports/dailyPlayer').catch((error) => {
                    //         console.error('Navigation error:', error);
                    //     });
                    // } else {
                    //     this._router.navigateByUrl(redirectURL).catch((error) => {
                    //         console.error('Navigation error:', error);
                    //     });
                    // }

                    if (data && data.session) {
                        this._localStorage.set(Constants.LOGGED_IN_USER, data.session);
                        this.logger.log("User has been logged in successfully", "info", this.signInForm.value.email);
                        const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                        console.log(redirectURL);

                        // Navigate to the redirect url
                        this._router.navigateByUrl(redirectURL);
                    } else {
                        localStorage.removeItem('accessToken');
                        this.logger.log("Unauthorized access", "error", this.signInForm.value.email);
                        // this._logger.info("Unauthorized access", this.signInForm.value.email);
                        // Set the alert
                        this.alert = {
                            type: 'error',
                            message: 'Unauthorized access'
                        };

                        // Show the alert
                        this.showAlert = true;
                        this.signInForm.enable();

                        return;
                    }

                },
                (response) => {

                    // Re-enable the form
                    this.signInForm.enable();

                    // Reset the form
                    this.signInNgForm.resetForm();

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: 'Wrong email or password'
                    };
                    this.logger.log('User Logging In Failed', "error", response);


                    // Show the alert
                    this.showAlert = true;
                }
            );
    }
}
