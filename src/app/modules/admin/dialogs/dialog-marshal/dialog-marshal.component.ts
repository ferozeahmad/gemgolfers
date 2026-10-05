import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Marshal } from 'app/shared/models/player.model';
import { LogsService } from 'app/shared/services/logs.service';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Component({
    standalone: false,
  selector: 'app-dialog-marshal',
  templateUrl: './dialog-marshal.component.html',
  styleUrls: ['./dialog-marshal.component.scss']
})
export class DialogMarshalComponent implements OnInit {
  dataSource: MatTableDataSource<Marshal>;
  displayedColumns = ['id', 'email', 'password'];
  public response: any;
  marshalList: Marshal[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogMarshalComponent>, private logger: LogsService,
      @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.logger.log('Marshal Dialog Opened', "info", { marshals: this.data?.marshals?.length });
    this.marshalList = this.data.marshals;

    this.dataSource = new MatTableDataSource(this.marshalList);
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
    this.logger.log('Admin dowloads marshals list', "info");
    var doc = new jsPDF()

    doc.setFontSize(18);
    doc.text("Scorers Login Detail:", 15, 15);

    doc.setTextColor(100);

    // From HTML
    (doc as any).autoTable({
      html: '#pdfTable',
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 15 },
      useCss: false,
    });

    // Open PDF document in new tab
    doc.output('dataurlnewwindow');

    // Download PDF document  
    //doc.save('flights.pdf');
  }

  onNoClick(): void {
    this.logger.log('Admin Click on Close in Marshal Dialog', "info");
    this.dialogRef.close();
  }

}