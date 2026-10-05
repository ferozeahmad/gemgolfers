import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

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
        @Inject(MAT_DIALOG_DATA) public data: RemoveMemberResult[],
        private logger: LogsService
    ) {}

    ngOnInit(): void {
        this.logger.log('Admin comes to Remove Members Results Dialog', "info", { resultsCount: this.data?.length });
    }

    onClose(): void {
        this.logger.log('Admin Click on Close in Remove Members Results Dialog', "info");
        this.dialogRef.close();
    }
}
