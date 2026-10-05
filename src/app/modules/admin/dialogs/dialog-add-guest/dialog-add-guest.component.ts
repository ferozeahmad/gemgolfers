import { Component, Inject, OnInit } from '@angular/core';
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
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-add-guest',
    templateUrl: './dialog-add-guest.component.html',
    styleUrls: ['./dialog-add-guest.component.scss'],
})
export class DialogAddGuestComponent implements OnInit {

    public playerForm: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<DialogAddGuestComponent>,
        private logger: LogsService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) { }

    async ngOnInit() {
        this.logger.log('Add Guest Dialog Opened', "info");
        ////console.log(this.route.snapshot.paramMap.get("id"));


        this.playerForm = new FormGroup({
            firstName: new FormControl('', [
                Validators.required,
                Validators.maxLength(60),
            ]),
            lastName: new FormControl('', [
                Validators.required,
                Validators.maxLength(60),
            ]),
            email: new FormControl('', [Validators.email]),
            handicap: new FormControl('', [Validators.required]),
        });

    }

    public hasError = (controlName: string, errorName: string) => {
        return this.playerForm.controls[controlName].hasError(errorName);
    };

    createPlayer() {
        this.logger.log('Admin Click on Add Guest in Add Guest Dialog', "info", { firstName: this.playerForm?.value?.firstName, lastName: this.playerForm?.value?.lastName, handicap: this.playerForm?.value?.handicap });
        this.dialogRef.close(this.playerForm.value);
    }
    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Add Guest Dialog', "info");
        this.dialogRef.close();
    }
}
