import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-add-tour',
    templateUrl: './dialog-add-tour.component.html',
    styleUrls: ['./dialog-add-tour.component.scss'],
})
export class DialogAddTourComponent implements OnInit {
    readonly maxTitleLength = 60;
    private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    private readonly maxFileSizeMb = 5;

    public tourForm: FormGroup;
    pictureUrl: string | null = null;
    file: File | null = null;
    fileError = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<any>,
        private logger: LogsService
    ) { }

    ngOnInit(): void {
        this.logger.log('Add Tour Dialog Opened', "info");
        this.tourForm = new FormGroup({
            title: new FormControl('', [
                Validators.required,
                Validators.maxLength(this.maxTitleLength),
                // reject titles that are only whitespace
                (control) => (control.value && !String(control.value).trim() ? { required: true } : null),
            ]),
            startDate: new FormControl(null, [Validators.required]),
            endDate: new FormControl(null, [Validators.required]),
        });
    }

    get titleLength(): number {
        return (this.tourForm.get('title').value || '').length;
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Add Tour Dialog', "info");
        this.dialogRef.close();
    }

    onSubmit() {
        if (this.tourForm.invalid) {
            this.tourForm.markAllAsTouched();
            return;
        }
        this.createTour(this.tourForm.value);
    }

    createTour(value) {
        this.logger.log('Admin Click on Save in Add Tour Dialog', "info", { title: value?.title, startDate: value?.startDate, endDate: value?.endDate });
        const result = {
            file: this.file,
            title: (value.title || '').trim(),
            startDate: value.startDate,
            endDate: value.endDate,
        };
        this.dialogRef.close(result);
    }

    public hasError = (controlName: string, errorName: string) => {
        return this.tourForm.controls[controlName].hasError(errorName);
    };

    uploadAvatar(input: HTMLInputElement): void {
        const fileList = input.files;
        this.logger.log('Admin Selects Logo File in Add Tour Dialog', "info", fileList?.[0]?.name);
        this.fileError = '';

        // Return if canceled
        if (!fileList || !fileList.length) {
            return;
        }

        const selected = fileList[0];
        if (!this.allowedTypes.includes(selected.type)) {
            this.fileError = 'Please choose a JPG or PNG image.';
            input.value = '';
            return;
        }
        if (selected.size > this.maxFileSizeMb * 1024 * 1024) {
            this.fileError = `The image must be smaller than ${this.maxFileSizeMb} MB.`;
            input.value = '';
            return;
        }

        this.file = selected;
        const reader = new FileReader();
        reader.onload = (event: any) => {
            this.pictureUrl = event.target.result;
        };
        reader.readAsDataURL(selected);
    }

    removeAvatar(input: HTMLInputElement): void {
        this.logger.log('Admin Removes Logo File in Add Tour Dialog', "info");
        this.file = null;
        this.pictureUrl = null;
        this.fileError = '';
        input.value = '';
    }
}
