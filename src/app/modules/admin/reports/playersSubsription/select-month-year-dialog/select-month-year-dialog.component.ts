import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    standalone: false,
    selector: 'app-select-month-year-dialog',
    templateUrl: './select-month-year-dialog.component.html',
})
export class SelectMonthYearDialogComponent implements OnInit {
    months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ];

    years: number[] = [];
    selectedMonth: number;
    selectedYear: number;

    constructor(public dialogRef: MatDialogRef<SelectMonthYearDialogComponent>) {}

    ngOnInit(): void {
        const currentDate = new Date();
        this.selectedMonth = currentDate.getMonth();
        this.selectedYear = currentDate.getFullYear();

        // Populate years: current year - 3 to current year + 5
        const currentYear = currentDate.getFullYear();
        for (let y = currentYear - 3; y <= currentYear + 5; y++) {
            this.years.push(y);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        // Calculate the last date of the selected month
        // In JavaScript, passing 0 as the day to Date constructor returns the last day of the previous month.
        // So passing selectedMonth + 1 and day 0 gives the last day of selectedMonth.
        const lastDay = new Date(Date.UTC(this.selectedYear, this.selectedMonth + 1, 0));
        
        // Format to YYYY-MM-DD
        const year = lastDay.getFullYear();
        const month = (lastDay.getMonth() + 1).toString().padStart(2, '0');
        const day = lastDay.getDate().toString().padStart(2, '0');
        const dueDateString = `${year}-${month}-${day}`;

        this.dialogRef.close({
            month: this.selectedMonth,
            year: this.selectedYear,
            dueDate: dueDateString
        });
    }
}
