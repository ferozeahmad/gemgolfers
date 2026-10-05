import {
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewChild,
    OnChanges,
    SimpleChange,
    SimpleChanges,
} from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    FormControl,
    FormArray,
    Validators,
} from '@angular/forms';
import { read, utils } from 'xlsx';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Club } from '../../../../shared/models/club.model';
import { Course, CourseHoles } from '../../../../shared/models/course.model';
import {
    Tournament,
    TournamentRounds,
    TournamentMember,
    matchFormat,
    TournamentCategory,
} from '../../../../shared/models/tournament.model';
import {
    Player,
    PlayerCategory,
    Marshal,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import { Flight, FlightMembers } from '../../../../shared/models/flight.model';
import {
    UniqueIdGenerator,
    passwordGenerator,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { SelectionModel } from '@angular/cdk/collections';
import { of } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DialogAddPlayerComponent } from '../../dialogs/dialog-add-player/dialog-add-player.component';
import { DialogPlayerComponent } from '../../dialogs/dialog-player/dialog-player.component';
import { DialogPlayerListComponent } from '../../dialogs/dialog-player-list/dialog-player-list.component';
import { DialogOverviewComponent } from '../../dialogs/dialog-overview/dialog-overview.component';
import { DialogMoveFlightComponent } from '../../dialogs/dialog-move-flight/dialog-move-flight.component';
import { ViewTournamentComponent } from '../view-tournament/view-tournament.component';
import { isNumber } from 'lodash';
import { MatDrawer } from '@angular/material/sidenav';
import { DialogAddMemberComponent } from '../../dialogs/dialog-add-member/dialog-add-member.component';
import { DialogCloseRoundComponent } from '../../dialogs/dialog-close-round/dialog-close-round.component';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { Team, TeamMembers } from 'app/shared/models/team.model';

@Component({
    standalone: false,
    selector: 'app-pair-management',
    templateUrl: './pair-management.component.html',
    styleUrls: ['./pair-management.component.scss'],
})
export class PairManagementComponent implements OnInit {
    @Input()
    tournamentID: string;
    index = 0;
    membersColumns: string[] = [
        'select',
        'firstName',
        'handicap',
    ];
    memberSelection = new SelectionModel<Player>(true, []);
    selectedPairs: any[] = [];
    loggedInuser: UserSessionModel;
    teamMembersToSave: any[] = [];
    tournamentMembers: any[] = [];
    membersSource: MatTableDataSource<Player | any>;
    @ViewChild('paginatorLegal') paginator: MatPaginator;
    @ViewChild('dsort') sort: MatSort;
    selectPlayer: any;
    currentTournament: any;
    teamForm!: FormGroup;
    selectedTeamColor: string | null = null;
    constructor(
        private _localStorage: LocalStorageService,
        private logger: LogsService,
        private _formBuilder: FormBuilder,
        private route?: ActivatedRoute,
        private router?: Router,
        public snackBar?: MatSnackBar,
        public dialog?: MatDialog,
        private facadeService?: FacadeService,
        public changeDetection?: ChangeDetectorRef,
    ) { }

    async ngOnInit() {
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.route.paramMap.subscribe((params) => {
            this.tournamentID = params.get('id');
        });
        //console.log(this.tournamentID);
        this.teamForm = this._formBuilder.group({
            teamName: [''],
            teamColor: ['']
        });
        let tournamentInfo = await this.facadeService.getTournamentsTeams(
            this.tournamentID
        );
        this.logger.log('Admin comes to View Teams on Tournament Page', "info", this.tournamentID.toString());
        this.logger.log('Getting View Teams on Tournament Page', "info", this.tournamentID.toString());
        this.currentTournament =
            tournamentInfo.tournament.length > 0
                ? tournamentInfo.tournament[0]
                : [];
        if (this.currentTournament.teamMatch) {
            this.currentTournament.pairs.forEach((team) => {
                const newTeam = {
                    id: team.id,
                    pairName: team.pairName,
                    flightId: team.flightId,
                    members: [
                        team.player1,
                        team.player2
                    ] // Initialize an empty array for members
                };

                // Loop through each member in membersQL
                // team.membersQL.forEach((memberQL) => {
                //     const playerQL = memberQL.player; // Get the player object from membersQL

                //     // Extract relevant properties from the player object
                //     const player = {
                //         id: playerQL.id,
                //         firstName: playerQL.firstName,
                //         lastName: playerQL.lastName,
                //         handicap: playerQL.handicap,
                //         playerCategory: playerQL.playerCategory,
                //         membershipNumber: playerQL.membershipNumber,
                //     };

                //     // Push the player into the new team's members array
                //     newTeam.members.push(player);
                // });

                // Push the new team into this.selectedPairs
                this.selectedPairs.push(newTeam);
            })
        }
        if (this.currentTournament.members) {
            for (let p of this.currentTournament.members) {
                this.tournamentMembers.push(p.player);
            }
            this.membersSource = new MatTableDataSource(
                this.tournamentMembers
            );
            this.membersSource.sort = this.sort;
            this.membersSource.paginator = this.paginator;
        }
        //console.log(this.tournamentMembers);


    }

    masterToggleM() {
        this.logger.log('Admin Click on Select All Players in Pair Management Page', "info");
        //console.log(this.selection);
        //console.log(this.selection.selected.length);
        this.isAllSelectedM()
            ? this.memberSelection.clear()
            : this.membersSource.data.forEach((row) => this.memberSelection.select(row));
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelectedM() {
        ////console.log(this.dataSource);
        if (this.membersSource) {
            const numSelected = this.memberSelection.selected.length;
            const numRows = this.membersSource.data.length;
            return numSelected === numRows;
        }
    }

    selectColor(color: string) {
        this.logger.log('Admin Click on Pair Color in Pair Management Page', "info", color);
        this.selectedTeamColor = color;
        this.teamForm.get('teamColor')?.setValue(color);
    }

    // /** The label for the checkbox on the passed row */
    checkboxLabelM(row?: Player): string {
        if (!row) {
            return `${this.isAllSelectedM() ? 'select' : 'deselect'} all`;
        }
        return `${this.memberSelection.isSelected(row) ? 'deselect' : 'select'
            } player ${row.firstName} ${row.lastName}`;
    }

    applyMembersFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        // //console.log(this.membersSource);
        this.membersSource.filter = filterValue;

        if (this.membersSource.paginator) {
            this.membersSource.paginator.firstPage();
        }
    }

    onColorChange(event: Event, id: any) {
        const inputElement = event.target as HTMLInputElement;
        const teamToUpdate = this.selectedPairs.find(t => t.id === id);
        if (teamToUpdate) {
            teamToUpdate.color = inputElement.value;
        }
    }
    removeTeamPlayer(playerId: string, teamId: string) {
        this.logger.log('Admin Click on Remove Player from Pair in Pair Management Page', "info", { playerId: playerId, pairId: teamId });
        // Find the team with the given ID
        const teamToUpdate = this.selectedPairs.find(team => team.id === teamId);

        // Check if the team is found
        if (teamToUpdate) {
            // Filter out the player to be removed from the team's members array
            teamToUpdate.members = teamToUpdate.members.filter(member => member.id !== playerId);
        } else {
            // Handle the case where the team with the given ID is not found
            //console.log('Team not found');
        }
    }


    deletePair(teamId: string) {
        this.logger.log('Admin Click on Delete Pair in Pair Management Page', "info", teamId);
        // Find the team being deleted
        const deletedTeam = this.selectedPairs.find(team => team.id === teamId);

        // Remove the team from the list
        this.selectedPairs = this.selectedPairs.filter(team => team.id !== teamId);

        // If the team existed and had members
        if (deletedTeam && deletedTeam.members && deletedTeam.members.length > 0) {
            const existingMembers = this.membersSource?.data || [];

            // Add back team members that are not already in membersSource
            const updatedMembers = [
                ...existingMembers,
                ...deletedTeam.members.filter(
                    member => !existingMembers.some(m => m.id === member.id)
                )
            ];

            // Update the data source
            this.membersSource.data = updatedMembers;

            // Optional: refresh table visuals (sorting/pagination)
            this.membersSource._updateChangeSubscription();
        }
    }


    addSelectedPlayersToPair(pairId: string) {
        this.logger.log('Admin Click on Add Selected Players to Pair in Pair Management Page', "info", { pairId: pairId, selectedCount: this.memberSelection.selected.length });
        const selectedPlayers = [...this.memberSelection.selected]; // array of selected players
        if (!selectedPlayers.length) return;

        const team = this.selectedPairs.find(t => t.id === pairId);
        if (!team) return;

        if (team.members.length + selectedPlayers.length > 2) {
            this.snackBar.open('Pair can have only 2 members.', 'x', {
                duration: 2000,
            });
            return;
        }

        // ✅ Ensure no duplicates in team.members
        const existingIds = new Set(this.selectedPairs.flatMap(t => t.members.map(m => m.id)));
        const uniqueNewMembers = selectedPlayers.filter(p => !existingIds.has(p.id));

        // ✅ Add only new members
        team.members = [...team.members, ...uniqueNewMembers];

        // ✅ Remove selected members from the main data source
        const remainingMembers = this.membersSource.data.filter(
            (m: any) => !selectedPlayers.some(p => p.id === m.id)
        );
        this.membersSource.data = [...remainingMembers];

        // ✅ Clear selection
        this.memberSelection.clear();
    }

    async saveTournamentPairs() {
        this.logger.log('Admin Click on Save Pairs in Pair Management Page', "info", { tournamentId: this.tournamentID, pairsCount: this.selectedPairs.length });
        let tournamentPairs: any[] = [];
        let teamsMembersToRemove: any[] = [];
        // let selectionArray = Object.assign({}, this.selection.selected);
        let flag: boolean = true;
        this.selectedPairs.forEach((team, index) => {
            let pair = {
                id: team.id,
                tournamentId: this.tournamentID,
                pairName: team.pairName,
                flightId: team?.flightId || null,
                member1Id: team.members[0].id,
                member2Id: team.members[1].id,
            }
            tournamentPairs.push(pair);
            teamsMembersToRemove.push(team.id);
        })
        console.log(tournamentPairs);
        // //console.log(this.teamMembersToSave);
        let result = <any>(
            await this.facadeService.insertTournamentPairs(tournamentPairs, this.tournamentID, teamsMembersToRemove)
        );

        if (result) {
            this.logger.log('Tournament Pairs saved successfully', "info", this.tournamentID);
            this.snackBar.open('Tournament Pairs have been saved.', 'x', {
                duration: 2000,
            });
        } else {
            this.logger.log('Saving Tournament Pairs Failed', "error", this.tournamentID);
            this.snackBar.open('Error!.Try Again', 'x', {
                duration: 2000,
            });
        }
    }

    addPairs() {
        const teamName = this.teamForm.get('teamName')?.value?.trim();
        const teamColor = this.teamForm.get('teamColor')?.value;
        this.logger.log('Admin Click on Create Pair in Pair Management Page', "info", { pairName: teamName, pairColor: teamColor });

        this.selectedPairs.push({
            id: UniqueIdGenerator.generate(),
            flightId: null,
            name: teamName,
            color: teamColor,
            members: []
        });
        if (!teamName) return;

        // Example: print or send to backend
        console.log('✅ Created team:', { teamName, teamColor });

        // Reset form after creation
        this.teamForm.reset();
        this.selectedTeamColor = null;
        // //console.log(this.selectedPairs);

    }
}
