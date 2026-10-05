import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogClose,
} from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../../../shared/models/club.model';
import {
    Player,
    PlayerCategory,
    ClubMembership,
} from '../../../../shared/models/player.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-dialog-add-tour',
    templateUrl: './dialog-add-tour.component.html',
    styleUrls: ['./dialog-add-tour.component.scss'],
})
export class DialogAddTourComponent implements OnInit {

    public tourForm: FormGroup;
    pictureUrl: any;
    file: any;
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    minDate: Date;
    maxDate: Date;
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<DialogAddTourComponent>,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Add Tour Dialog Opened', "info");
        this.tourForm = new FormGroup({
            title: new FormControl('', [
                Validators.required,
                Validators.maxLength(60),
            ]),
            logo: new FormControl(''),
            startDate: new FormControl('', [Validators.required]),
            endDate: new FormControl('', [Validators.required]),
        });
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Add Tour Dialog', "info");
        this.dialogRef.close();
    }
    onSubmit() {
    }
    createTour(value) {
        this.logger.log('Admin Click on Save in Add Tour Dialog', "info", { title: value?.title, startDate: value?.startDate, endDate: value?.endDate });
        let result = {
            file: this.file,
            title: value.title,
            startDate:value.startDate,
            endDate:value.endDate,
        }
        this.dialogRef.close(result);
    }

    public hasError = (controlName: string, errorName: string) => {
        return this.tourForm.controls[controlName].hasError(errorName);
    };
    uploadAvatar(fileList: FileList): void {
        this.logger.log('Admin Selects Logo File in Add Tour Dialog', "info", fileList?.[0]?.name);
        // Return if canceled
        if (!fileList.length) {
            this.pictureUrl = null;
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        this.file = fileList[0];
        //console.log(this.file);

        const reader = new FileReader();
        reader.onload = (event: any) => {
            // Set the selectedImage variable with the data URL
            this.pictureUrl = event.target.result;
        };

        // Return if the file is not allowed
        if (!allowedTypes.includes(this.file.type)) {
            return;
        }
        reader.readAsDataURL(this.file);


        // Upload the avatar
        // if (this.account.picture) {
        //     this._facadeService.updateAvatar(this.account, file).subscribe(() => {
        //         this._snackBar.open("Profile picture has been updated.", "Close", {
        //             duration: 3000, // Display snackbar for 5 seconds
        //         });
        //     });
        //     //this.toggleEditMode(false);
        // } else {
        //     this._facadeService.addAvatar(this.account, file).subscribe(() => {
        //         this._snackBar.open("Profile picture has been updated.", "Close", {
        //             duration: 3000, // Display snackbar for 5 seconds
        //         });
        //     });
        //     // this.toggleEditMode(false);
        // }
        //this.account.picture=
    }
}
