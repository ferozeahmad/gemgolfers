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
    selector: 'app-team-management',
    templateUrl: './team-management.component.html',
    styleUrls: ['./team-management.component.scss'],
})
export class TeamManagementComponent implements OnInit {
    @Input()
    tournamentID: string;
    index = 0;
    membersColumns: string[] = [
        'select',
        'firstName',
        'handicap',
    ];
    memberSelection = new SelectionModel<Player>(true, []);
    selectedTeams: any[] = [];
    loggedInuser: UserSessionModel;
    teamMembersToSave: any[] = [];
    tournamentMembers: any[] = [];
    membersSource: MatTableDataSource<Player | any>;
    @ViewChild('paginatorLegal') paginator: MatPaginator;
    @ViewChild('dsort') sort: MatSort;
    selectPlayer: any;
    currentTournament: any;
    teamForm!: FormGroup;
    teamColors = [
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];
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
            this.currentTournament.teams.forEach((team) => {
                const newTeam = {
                    id: team.id,
                    name: team.name,
                    color: team.color,
                    members: [] // Initialize an empty array for members
                };

                // Loop through each member in membersQL
                team.teamMembers.forEach((memberQL) => {
                    const playerQL = memberQL.player; // Get the player object from membersQL

                    // Extract relevant properties from the player object
                    const player = {
                        id: playerQL.id,
                        firstName: playerQL.firstName,
                        lastName: playerQL.lastName,
                        handicap: playerQL.handicap,
                        playerCategory: playerQL.playerCategory,
                        membershipNumber: playerQL.membershipNumber,
                    };

                    // Push the player into the new team's members array
                    newTeam.members.push(player);
                });

                // Push the new team into this.selectedTeams
                this.selectedTeams.push(newTeam);
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
        this.logger.log('Admin Click on Select All Players in Team Management Page', "info");
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
        this.logger.log('Admin Click on Team Color in Team Management Page', "info", color);
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
        const teamToUpdate = this.selectedTeams.find(t => t.id === id);
        if (teamToUpdate) {
            teamToUpdate.color = inputElement.value;
        }
    }
    removeTeamPlayer(playerId: string, teamId: string) {
        this.logger.log('Admin Click on Remove Player from Team in Team Management Page', "info", { playerId: playerId, teamId: teamId });
        // Find the team with the given ID
        const teamToUpdate = this.selectedTeams.find(team => team.id === teamId);

        // Check if the team is found
        if (teamToUpdate) {
            // Filter out the player to be removed from the team's members array
            teamToUpdate.members = teamToUpdate.members.filter(member => member.id !== playerId);
        } else {
            // Handle the case where the team with the given ID is not found
            //console.log('Team not found');
        }
    }


    deleteTeam(teamId: string) {
        this.logger.log('Admin Click on Delete Team in Team Management Page', "info", teamId);
        // Find the team being deleted
        const deletedTeam = this.selectedTeams.find(team => team.id === teamId);

        // Remove the team from the list
        this.selectedTeams = this.selectedTeams.filter(team => team.id !== teamId);

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

    editTeam(teamId, index) {
        //console.log(index);
        try {
            this.logger.log('Add New member to Team', "info", teamId);

            let TM = [];
            for (let obj of this.tournamentMembers) {
                let play = {
                    id: obj.id,
                    firstName: obj.firstName,
                    lastName: obj.lastName,
                    handicap: obj.handicap,
                    playerCategory: obj.playerCategory,
                    membershipNumber: obj.membershipNumber,
                    email: obj.email,
                }
                TM.push(play);
            }

            const dialogRef = this.dialog.open(DialogAddMemberComponent, {
                data: {
                    id: teamId,
                    members: TM,
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                this.logger.log('Add New member to Team dialog closed in Team Management Page', "info", teamId);
                //console.log(result);
                if (result.length > 0) {
                    let playerAdded = false; // Flag to track if the player has been added to a team
                    for (let obj of result) {
                        for (let team of this.selectedTeams) {
                            const isPlayerPresent = team.members.some(member => member.id === obj.id);
                            if (!isPlayerPresent) {
                                const teamToUpdate = this.selectedTeams.find(t => t.id === teamId);
                                if (teamToUpdate) {
                                    teamToUpdate.members.push(obj);
                                    playerAdded = true; // Set the flag to true indicating that the player has been added
                                    break; // Exit the loop since the player has been added to a team
                                }
                            }
                        }
                        // if (playerAdded) {
                        //     break; // Exit the outer loop once the player has been added to a team
                        // }
                    }
                    if (!playerAdded) {
                        // Show a message if the player is already present in all teams
                        this.snackBar.open('Player already exists in teams.', 'x', {
                            duration: 2000,
                        });
                    }
                }

            });
        } catch (error) {
            this.logger.log('Getting Tournaments DataAdd New member to flight Failed', "error", error.toString());
        }
    }


    addSelectedPlayersToTeam(teamId: number) {
        this.logger.log('Admin Click on Add Selected Players to Team in Team Management Page', "info", { teamId: teamId, selectedCount: this.memberSelection.selected.length });
        const selectedPlayers = [...this.memberSelection.selected]; // array of selected players
        if (!selectedPlayers.length) return;

        const team = this.selectedTeams.find(t => t.id === teamId);
        if (!team) return;

        // ✅ Ensure no duplicates in team.members
        const existingIds = new Set(this.selectedTeams.flatMap(t => t.members.map(m => m.id)));
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

    async saveTournamentTeams() {
        this.logger.log('Admin Click on Save Teams in Team Management Page', "info", { tournamentId: this.tournamentID, teamsCount: this.selectedTeams.length });
        let tournamentMember: TeamMembers[] = [];
        this.teamMembersToSave = [];
        let teamsToSave: Team[] = [];
        let teamsMembersToRemove: any[] = [];
        // let selectionArray = Object.assign({}, this.selection.selected);
        let flag: boolean = true;
        // if (this.selectedTeams1[0].length !== this.selectedTeams2[0].length) {
        //     this.snackBar.open('Teams Members are not equal.', 'x', {
        //         duration: 2000,
        //     });
        //     return;
        // }
        this.selectedTeams.forEach((team, index) => {
            tournamentMember = [];
            // let name: string = (<HTMLInputElement>(
            //     document.getElementById(
            //         'team_' + index + '_name'
            //     )
            // )).value;

            // let color: string = (<HTMLInputElement>(
            //     document.getElementById(
            //         'team_' + index + '_color'
            //     )
            // )).value;
            // team['name'] = name;
            // team['color'] = color;
            teamsMembersToRemove.push(team.id);
            team.members.forEach((mem) => {
                let member: any = {
                    playerId: mem.id,
                }
                tournamentMember.push(member);
            })
            let teams: any = {
                id: team.id,
                tournamentId: this.tournamentID,
                adminId: this.loggedInuser.id,
                name: team.name,
                color: team.color,
                teamMembers: {
                    data: tournamentMember,
                },
            }
            teamsToSave.push(teams);
        })
        //console.log(teamsToSave);
        // //console.log(this.teamMembersToSave);
        let result = <any>(
            await this.facadeService.insertTournamentTeam(teamsToSave, this.tournamentID, teamsMembersToRemove)
        );

        if (result) {
            this.logger.log('Tournament Teams saved successfully', "info", this.tournamentID);
            this.snackBar.open('Tournament Teams have been saved.', 'x', {
                duration: 2000,
            });
        } else {
            this.logger.log('Saving Tournament Teams Failed', "error", this.tournamentID);
            this.snackBar.open('Error!.Try Again', 'x', {
                duration: 2000,
            });
        }
    }

    addTeam() {
        const teamName = this.teamForm.get('teamName')?.value?.trim();
        const teamColor = this.teamForm.get('teamColor')?.value;
        this.logger.log('Admin Click on Create Team in Team Management Page', "info", { teamName: teamName, teamColor: teamColor });

        this.selectedTeams.push({
            id: UniqueIdGenerator.generate(),
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
        // //console.log(this.selectedTeams);

    }
}
