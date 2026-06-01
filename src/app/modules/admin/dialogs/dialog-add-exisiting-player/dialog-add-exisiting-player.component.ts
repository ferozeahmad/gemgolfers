import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../../../shared/models/player.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from '../../../../shared/services/facade.service';

@Component({
    standalone: false,
  selector: 'app-dialog-add-exisiting-player',
  templateUrl: './dialog-add-exisiting-player.component.html',
  styleUrls: ['./dialog-add-exisiting-player.component.scss']
})
export class DialogAddExisitingPlayerComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  displayedColumns = ['firstName', 'lastName', 'handicap', 'phone', 'email','membershipNo', 'club'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public response: any;
    public player: Player[] = [];
    totalFlights: any[] = [];
    selectedFlight: number;
    selectedRowIndex: string;


    constructor(
        public dialogRef: MatDialogRef<DialogAddExisitingPlayerComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public facadeService: FacadeService
    ) {}

    ngOnInit() {
      this.setDataSource(this.data.players);
    }

    async getPlayerInformationByGEMID() {
      let GEMID : string = (<HTMLInputElement>document.getElementById("gemid")).value; 
      
      if(GEMID) {
        this.player = <Player[]>await this.facadeService.getPlayerByGEMID(GEMID);

        this.setDataSource(this.player);

        if(this.player.length > 0) {
          this.response = {
              player: this.player[0],
              flight: Number(this.selectedFlight) - 1
          }
          this.selectPlayer(this.player[0]);
        }
        else {
          this.response = null;
        }
      }
    }



    async getPlayerInformationByMembershipNumber() {
      let membershipNumber : string = (<HTMLInputElement>document.getElementById("membershipNumber")).value; 
      
      if(membershipNumber) {
        this.player = <Player[]>await this.facadeService.getPlayerByMembershipNumber(membershipNumber);

        this.setDataSource(this.player);
        
        if(this.player.length > 0) {
          this.response = {
              player: this.player[0],
              flight: Number(this.selectedFlight) - 1
          }
          this.selectPlayer(this.player[0]);
        }
        else {
          this.response = null;
        }
      }
    }



    async getPlayerInformationByName() {
      let firstName : string = (<HTMLInputElement>document.getElementById("firstName")).value;
      let lastName : string = (<HTMLInputElement>document.getElementById("lastName")).value;
      let handicap : string = (<HTMLInputElement>document.getElementById("handicap")).value;
      
      if(firstName || lastName) {

        if(!firstName) firstName = "NOTHING";
        if(!lastName) lastName = "NOTHING";

        let lowerHandicap = (handicap)? Number(handicap) - 1 : 0;
        let upperHandicap = (handicap)? Number(handicap) + 1 : 0;

        //console.log(lowerHandicap);
        //console.log(upperHandicap);

        let matchingList = <Player>await this.facadeService.searchPlayer(firstName, lastName, "NOTHING", lowerHandicap, upperHandicap);
        this.player = this.getMatchingPlayers(matchingList);

        this.setDataSource(this.player);
        
        if(this.player[0]) {
          this.response = {
              player: this.player[0],
              flight: Number(this.selectedFlight) - 1
          }
        }
        else {
          this.response = null;
        }
      }
    }

    getMatchingPlayers(object) {
      let matching: any[] = [];
      console.log(object); 
      for(let i=1; i<=4; i++) {
        for(let j=1; j<4; j++) {
          //console.log("Result" + i + j);
          //console.log(object["Result" + i + j].length);
          if(object["Result" + i + j] != null && object["Result" + i + j].length < 50) {
            for(let item of object["Result" + i + j]) {
              //console.log(matching);
              //console.log(item);
              let exist = matching.filter((a) => {
                return a.id == item.id;
              }); 
              
              //console.log(exist.length);
              
              if(exist.length == 0)
                matching.push(item);
            }
          }
        }
      }
      //console.log(matching);
      return matching;
    }

    getClubTooltip(membership) {
      //console.log(membership);
      let clubList: string;
      for(let member of membership) {
        clubList += member.club.name + ", ";
      }
      clubList = clubList.trim();
      clubList = clubList.replace(/,\s*$/, "");
    }

    setDataSource(dataSource) {
      this.dataSource = new MatTableDataSource(dataSource);

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    selectPlayer(player) {
      
      this.response = {
        player: player,
        flight: Number(this.selectedFlight) - 1
      }

      this.selectedRowIndex = player.id;
      this.dialogRef.close(this.response);
    }


    changeFlight(item) {
      //console.log("Selected value: " + item.value);
      this.selectedFlight = item.value;
      
      if(this.response)
        this.response.flight = Number(this.selectedFlight) - 1;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
