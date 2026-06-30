import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FacadeService } from 'app/shared/services/facade.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface UserPasswordData {
    id: string;
    Name: string;
    Email: string;
    passwordControl: UntypedFormControl;
    status?: 'success' | 'error' | 'pending' | '';
    message?: string;
}

@Component({
    standalone: false,
    selector: 'app-set-password-dialog',
    templateUrl: './set-password-dialog.component.html',
    styleUrls: ['./set-password-dialog.component.scss'],
})
export class SetPasswordDialogComponent implements OnInit {
    passwordForm: FormGroup;
    usersWithPasswords: UserPasswordData[] = [];
    isLoading = false;
    showPasswordField: string = 'password';

    constructor(
        public dialogRef: MatDialogRef<SetPasswordDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any[],
        private _formBuilder: FormBuilder,
        private _facadeService: FacadeService,
        private _snackBar: MatSnackBar
    ) {
        this.passwordForm = this._formBuilder.group({});
        this.data.forEach(user => {
            const passwordControl = new UntypedFormControl('', [Validators.required, Validators.minLength(6)]);
            this.passwordForm.addControl(user.id, passwordControl);
            this.usersWithPasswords.push({
                id: user.id,
                Name: user.Name,
                Email: user.Email,
                passwordControl: passwordControl,
                status: 'pending',
            });
        });
    }

    ngOnInit(): void { }

    async savePasswords(): Promise<void> {
        if (this.passwordForm.invalid) {
            this._snackBar.open('Please fill in all passwords with at least 6 characters.', 'Close', { duration: 3000 });
            return;
        }

        this.isLoading = true;

        for (const user of this.usersWithPasswords) {
            if (user.passwordControl.valid) {
                try {
                    const password = user.passwordControl.value;
                    await this._facadeService.updateAccountInFirebase(user.Email, password).subscribe();
                    user.status = '';
                    user.message = 'Password updated successfully.'; 
                } catch (error) {
                    user.status = 'error';
                    user.message = `Failed to update password: ${error.message}`;
                    console.error(`Error updating password for ${user.Email}:`, error);
                }
            } else {
                user.status = 'error';
                user.message = 'Invalid password.';
            }
        }
        this.isLoading = false;
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
