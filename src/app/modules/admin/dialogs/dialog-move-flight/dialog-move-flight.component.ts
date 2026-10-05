import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-dialog-move-flight',
  templateUrl: './dialog-move-flight.component.html',
  styleUrls: ['./dialog-move-flight.component.scss']
})
export class DialogMoveFlightComponent implements OnInit {
  selectedFlight: number;
  private totalFlights: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogMoveFlightComponent>,
    private logger: LogsService,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit() {
      this.logger.log('Move Flight Dialog Opened', "info", { flights: this.data?.flights });
      for(let flight=1; flight <= this.data.flights; flight++)
      {
        let r: any = {
          Text: "Flight " + flight,
          Value: flight
        }
        this.totalFlights.push(r);
      }

      if(this.data.flights > 0)
        this.selectedFlight = 1;
  }

  changeFlight(item) {
    this.logger.log('Admin Changes Flight in Move Flight Dialog', "info", item?.value);
    //console.log("Selected value: " + item.value);
    this.selectedFlight = item.value;
  }

  onNoClick(): void {
    this.logger.log('Admin Click on Cancel in Move Flight Dialog', "info");
    this.dialogRef.close();
}

}
