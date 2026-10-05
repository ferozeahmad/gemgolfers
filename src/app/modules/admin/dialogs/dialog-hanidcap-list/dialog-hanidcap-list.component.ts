import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: "app-dialog-hanidcap-list",
  templateUrl: "./dialog-hanidcap-list.component.html",
  styleUrls: ["./dialog-hanidcap-list.component.scss"],
})
export class DialogHanidcapListComponent implements OnInit {
  dataSource: MatTableDataSource<any>;
  displayedColumns = ["name", "handicap", "oldhandicap", "updatedAt"];
  public response: any;
  handicapList: any[] = [];
  IsWhs: boolean = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  player: any[];

  constructor(
    public dialogRef: MatDialogRef<DialogHanidcapListComponent>,
    private logger: LogsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.logger.log('Handicap List Dialog Opened', "info", { handicaps: this.data?.handicaps?.length, Whs: this.data?.Whs });
    this.handicapList = this.data.handicaps;
    this.IsWhs = this.data.Whs;

    if (this.IsWhs)
      this.displayedColumns = [
        "name",
        "round",
        "score",
        "adjustedScore",
        "handicapDifferential",
        "handicapWhsIndex",
        "updatedAt",
      ];
    else
      this.displayedColumns = ["name", "handicap", "oldhandicap", "updatedAt"];

    for (let item of this.handicapList)
      item["name"] = item.PlayerQL
        ? item.PlayerQL.firstName + " " + item.PlayerQL.lastName
        : "";

    //console.log(this.handicapList);

    this.dataSource = new MatTableDataSource(this.handicapList);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    //console.log(filterValue);
    if (filterValue == "") {
      this.setDataSource(this.handicapList);
      return;
    }
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.player = [];
    if (filterValue.length >= 3) {
      for (let obj of this.handicapList) {
        obj["fullname"] =
          obj.player["firstName"] + " " + obj.player["lastName"];
        if (obj["fullname"].toLowerCase().includes(filterValue)) {
          this.player.push(obj);
        }
      }
      //console.log(this.player);
      this.setDataSource(this.player);
    }
  }

  onNoClick(): void {
    this.logger.log('Admin Click on Close in Handicap List Dialog', "info");
    this.dialogRef.close();
  }

  setDataSource(dataSource) {
    this.dataSource = new MatTableDataSource(dataSource);

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
