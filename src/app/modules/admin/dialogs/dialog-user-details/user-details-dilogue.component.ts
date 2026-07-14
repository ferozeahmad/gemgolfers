import { DialogOverviewComponent } from "../dialog-overview/dialog-overview.component";
import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PlayerHanidcap, UserSessionModel } from "../../../../shared/models/player.model";
import { PlayerHandicap } from "../../../../shared/classes/player-hanidcap";
import { FacadeService } from "../../../../shared/services/facade.service";
import { PlayerQL } from "../../../../shared/fragments/player.fragment";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DatePipe, formatDate } from "@angular/common";
import { Constants } from "app/shared/classes/general";
import { LocalStorageService } from "app/shared/services/localStorage";

@Component({
  standalone: false,
  selector: "app-user-details-dilogue",
  templateUrl: "./user-details-dilogue.component.html",
  styleUrls: ["./user-details-dilogue.component.scss"],
})
export class UserDetailsDilogueComponent implements OnInit {
  dataSource: MatTableDataSource<any>;
  displayedColumns = [
    "id",
    "date",
    "playingHandicapCongu",
    "playingHandicapWHS",
    "score",
    "holeSet",
    "playingTee",
    "caddy",
  ];
  public response: any;
  playerId: string;
  loggedInuser: UserSessionModel;
  playerHandicapList: any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialogRef: MatDialogRef<UserDetailsDilogueComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private facadeService: FacadeService,
    private datePipe: DatePipe,
    private _localStorage: LocalStorageService,
  ) { }

  async ngOnInit() {
    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    //console.log(this.data);
    this.playerId = this.data.id;
    //console.log(this.playerId);
    //wwant to remove the playingHandicapWHS from column if id is not 
    if (this.loggedInuser.clubId && this.loggedInuser.clubId !== '-LUFS3FAg4OEhIiK0vgY') {
      this.displayedColumns = this.displayedColumns.filter((column) => {
        if (column === "playingHandicapWHS" || column === "playingTee") {
          return false; // Exclude the column if isWHS is false 
        }
        return true; // Include all other columns
      });
    }
    this.playerHandicapList =
      await this.facadeService.getPlayerHandicapListByPlayer(
        this.playerId,
        this.datePipe.transform(
          this.data.from.toString(),
          "yyyy-MM-ddTHH:mm:SS" + "+00:00"
        ),
        this.datePipe.transform(
          this.data.to.toString(),
          "yyyy-MM-ddTHH:mm:SS" + "+00:00"
        )
      );
    //console.log(this.playerHandicapList);
    this.playerHandicapList = this.playerHandicapList["flight"].sort(
      this.ComparatorDate
    );

    //Calculate the score of each round and show
    this.playerHandicapList.forEach((round) => {
      let scorer = 0
      if (round.members && round.members.length > 0) {
        const member = round.members[0];
        if (member.scores && member.scores.length > 0) {
          member.scores.forEach((score) => {
            scorer += score.grossScore;
          })
        }
      }
      if (round.holeSet) {
        round["holeSetDisplayName"] = round.holeSet.displayName; // Assign holeSet displayName
        round["score"] = scorer; // Assign total score
      }
    });

    console.log(this.playerHandicapList);
    this.dataSource = new MatTableDataSource(this.playerHandicapList);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  ComparatorDate(a, b) {
    if (a["date"] < b["date"]) return 1;
    if (a["date"] > b["date"]) return -1;
    return 0;
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  public downloadAsPDFCongu() {
    var doc = new jsPDF();
    doc.setFontSize(15);
    doc.text(
      this.playerHandicapList[0].members[0]["player"].firstName +
      " " +
      this.playerHandicapList[0].members[0]["player"].lastName +
      " | " +
      this.playerHandicapList[0].members[0]["player"].membershipNumber,
      75,
      15
    );
    doc.text(
      " Rounds Played From " +
      this.datePipe.transform(this.data.to.toString(), "MMM d, y") +
      " to " +
      this.datePipe.transform(this.data.from.toString(), "MMM d, y"),
      40,
      22
    );

    doc.setFontSize(18);
    doc.setTextColor(100);

    // From HTML
    (doc as any).autoTable({
      html: "#pdfTable",
      startY: 25,
      theme: "grid",
      useCss: false,
    });

    // Open PDF document in new tab
    doc.output("dataurlnewwindow");

    // Download PDF document
    //doc.save('flights.pdf');
  }
}
