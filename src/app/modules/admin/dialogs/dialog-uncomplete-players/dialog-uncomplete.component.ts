import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Player } from '../../../../shared/models/player.model';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SelectionModel } from '@angular/cdk/collections';
import { TournamentMember } from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import * as XLSX from 'xlsx';
import { read, utils } from 'xlsx';
@Component({
    standalone: false,
    selector: 'app-uncompleted',
    templateUrl: './dialog-uncomplete.component.html',
    styleUrls: ['./dialog-uncomplete.component.scss'],
})
export class DialogUncompletedComponent implements OnInit {
    dataSource: MatTableDataSource<Player>;
    displayedColumns = [
        'name',
        // 'handicapWhsIndex',
        'membershipNumber',
        'cat',
        'score',
        'email',
        'caddy',

    ];
    tableColumns = [
        'Name',
        'Handicap Index',
        'M.No',
        'Category',
        'Email',

    ];
    monthName = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];
    public response: any;
    playerList: Player[] = [];
    selection = new SelectionModel<Player>(true, []);
    @ViewChild('MatPaginatorA') paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        public dialogRef: MatDialogRef<DialogUncompletedComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private facadeService: FacadeService,

    ) { }

    ngOnInit() {
        //console.log(this.data);

        this.playerList = this.data.players;

        this.dataSource = new MatTableDataSource(this.playerList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    public downloadAsPDF() {
        const doc = new jsPDF();

        let dateObj = new Date(this.data.date);
        let date = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        let day = dateObj.getDay() - 1;

        doc.setFontSize(18);

        if (this.data.key == 'non') {
            doc.text("Date: " + date + "-" + this.monthName[day], 74, 15);
            doc.text("Round's Non-Submitted Cards Detail:", 54, 23);
        } else if (this.data.key == 'all') {
            doc.text("Date: " + date + "-" + this.monthName[day], 74, 15);
            doc.text("All Players Detail:", 68, 23);
        } else {
            doc.text("Date: " + date + "-" + this.monthName[day], 74, 15);
            doc.text("Round's Submitted Cards Detail:", 62, 23);
        }

        doc.setFontSize(11);
        doc.setTextColor(100);

        // 🔹 Get table columns from the dataSource
        const columns = this.tableColumns.map(col => ({ header: col, dataKey: col }));

        // 🔹 Get table rows
        const rows = this.dataSource.data.map(player => ({
            'Name': player.firstName + ' ' + player.lastName,
            'Handicap Index': player.handicapWhsIndex,
            'M.No': player.membershipNumber,
            'Category': player.playerCategory,
            'Email': player.email,
        }));

        // 🔹 Add table to PDF

        (doc as any).autoTable({
            columns: columns,
            body: rows,
            startY: 30,
            theme: 'grid'
        });

        doc.save('players.pdf');
    }


    onNoClick(): void {
        this.dialogRef.close();
    }


    close() {
        this.dialogRef.close();
    }

    exportToExcel(): void {

        const data = this.dataSource.data.map((item) => {
            // Create a new object without the 'Details' column
            const { id, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Players_report.xlsx');
        this.selection.clear();
    }
}
