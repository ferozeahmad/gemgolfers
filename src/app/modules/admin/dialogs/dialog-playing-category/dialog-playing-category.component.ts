import { Component, Inject, OnInit, ViewChild } from "@angular/core";

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Player } from "app/shared/models/player.model";
import { of } from "rxjs";
import { FacadeService } from "app/shared/services/facade.service";
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: "app-dialog-playing-category",
  templateUrl: "./dialog-playing-category.component.html",
  styleUrls: ["./dialog-playing-category.component.scss"],
})
export class DialogPlayingCategoryComponent implements OnInit {
  Player: Player[] = [];
  Players: Player[] = [];
  dataSource: MatTableDataSource<Player>;
  displayedColumns = [
    "id",
    "name",
    "phone",
    "email",
    "membershipNumber",
    "category",
    "club",
    "handicap",
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  category: any[] = [];
  dataFullTournament: any;
  fullTournament: any;
  tournamnet: any;
  dates:boolean=true;
  constructor(
    public dialogRef: MatDialogRef<DialogPlayingCategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private facadeService: FacadeService,
    private logger: LogsService
  ) {}

  async ngOnInit() {
    this.logger.log('Playing Category Dialog Opened', "info", { tournament: this.data?.tournament, category: this.data?.cat?.title });
    //console.log(this.data);

    this.dataFullTournament = await this.facadeService.LeaderboardSubscriptions(
      this.data.tournament,
      this.data["cat"].title
    );
    //console.log(this.dataFullTournament);

    let dataPlayers: any;
    dataPlayers =
      await this.facadeService.getPlayersListByTournamentAndCategory(
        this.data.tournament,
        this.data["cat"].title
      );
    this.Player = dataPlayers.tournament_member;
    this.logger.log('Getting Players List in Playing Category Dialog Successful', "info", { players: this.Player?.length });
    this.dataSource = new MatTableDataSource(this.Player);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // for (let i of this.dataFullTournament["tournament_member_category"]) {
    //   //console.log(i["flightSettings"]);
      
    // }
    //console.log(this.dataFullTournament["tournament_member_category"][0].flightSettings);
    ////console.log(this.dataFullTournament["tournament_member_category"]["flightSettings"]);
    
    
    for (let index = 0; index < this.dataFullTournament["tournament_member_category"][0].flightSettings.length; index++) {
      this.dates=true;
      let obj=this.dataFullTournament["tournament_member_category"][0].flightSettings[index];
      //console.log(this.dataFullTournament["tournament_member_category"][0].flightSettings[index]);
      this.category.push(obj)

    }
    //console.log(this.category);
  }
}
