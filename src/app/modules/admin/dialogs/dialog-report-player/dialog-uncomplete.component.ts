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
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-uncompleted',
    templateUrl: './dialog-uncomplete.component.html',
    styleUrls: ['./dialog-uncomplete.component.scss'],
})
export class DialogPlayersComponent implements OnInit {
    dataSource: MatTableDataSource<Player>;
    displayedColumns = [
        'name',
        'handicap',
        'membershipNumber',
        'cat',
        'email',
       
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
        public dialogRef: MatDialogRef<DialogPlayersComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private facadeService: FacadeService,
        private logger: LogsService,

    ) {}

    ngOnInit() {
        this.logger.log('Report Players Dialog Opened', "info", { players: this.data?.players?.length });
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
        this.logger.log('Admin Click on Download PDF in Report Players Dialog', "info", this.data?.key);
        var doc = new jsPDF();
        let date=new Date(this.data.date).getDate() +'/'+(new Date(this.data.date).getMonth()+1) +'/'+new Date(this.data.date).getFullYear(); 
        var day=new Date(this.data.date).getDay()-1;
        // day=this.monthName[day];
        doc.setFontSize(18);
        if(this.data.key=='non'){
            doc.text("Date: "+date+"-"+this.monthName[day], 74, 15);
            doc.text("Round's Non-Submitted Cards Detail:", 54, 23);
        }else if(this.data.key=='all'){      
            doc.text("Date: "+date+"-"+this.monthName[day], 74, 15);
            doc.text("All Players Detail:", 68, 23);
        }else{
            doc.text("Date: "+date+"-"+this.monthName[day], 74, 15);
            doc.text("Round's Submitted Cards Detail:",62, 23);
        }
        doc.setFontSize(11);
        doc.setTextColor(100);

        // From HTML
        (doc as any).autoTable({
            html: '#playerTables',
            startY: 25,
            theme: 'grid',
            useCss: false,
        });

        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document
        //doc.save('flights.pdf');
    }

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Report Players Dialog', "info");
        this.dialogRef.close();
    }


    close() {
        this.logger.log('Admin Click on Close in Report Players Dialog', "info");
        this.dialogRef.close();
    }

    exportToExcel(): void {
        this.logger.log('Admin Click on Export to Excel in Report Players Dialog', "info", { players: this.dataSource?.data?.length });

        const data = this.dataSource.data.map((item) => {
            // Create a new object without the 'Details' column
            const {  id, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Players_report.xlsx');
        this.logger.log('Players report exported to Excel successfully', "info");
        this.selection.clear();
    }
}
