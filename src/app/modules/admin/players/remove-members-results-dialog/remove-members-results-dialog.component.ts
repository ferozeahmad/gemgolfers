import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RemoveMemberResult {
    row: number;
    membershipNumber: string;
    status: 'success' | 'error';
    message: string;
}

@Component({
    standalone: false,
    selector: 'app-remove-members-results-dialog',
    templateUrl: './remove-members-results-dialog.component.html',
    styleUrls: ['./remove-members-results-dialog.component.scss'],
})
export class RemoveMembersResultsDialogComponent implements OnInit {
    displayedColumns: string[] = ['row', 'membershipNumber', 'status', 'message'];

    constructor(
        public dialogRef: MatDialogRef<RemoveMembersResultsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: RemoveMemberResult[]
    ) {}

    ngOnInit(): void {}

    onClose(): void {
        this.dialogRef.close();
    }
}
