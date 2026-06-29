import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ImportResult {
    row: number;
    membershipNumber: string;
    status: 'success' | 'error';
    message: string;
}

@Component({
    standalone: false,
    selector: 'app-import-results-dialog',
    templateUrl: './import-results-dialog.component.html',
    styleUrls: ['./import-results-dialog.component.scss'],
})
export class ImportResultsDialogComponent implements OnInit {
    displayedColumns: string[] = ['row', 'membershipNumber', 'status', 'message'];

    constructor(
        public dialogRef: MatDialogRef<ImportResultsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ImportResult[]
    ) { }

    ngOnInit(): void { }

    onClose(): void {
        this.dialogRef.close();
    }
}
