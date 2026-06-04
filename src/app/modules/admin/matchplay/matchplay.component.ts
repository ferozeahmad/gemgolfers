import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { Score } from 'app/shared/models/score.model';
import { Hole } from 'app/shared/models/hole.model';
import {
    matchFormat,
    Tournament,
    TournamentRounds,
} from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants, General } from 'app/shared/classes/general';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogPlayerScoreComponent } from '../dialogs/dialog-player-score/dialog-player-score.component';
import { of } from 'rxjs';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { CommonModule } from '@angular/common';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { DialogTournamentComponent } from '../dialogs/dialog-tournament/dialog-tournament.component';

@Component({
    standalone: false,
    selector: 'app-matchplay',
    templateUrl: './matchplay.component.html',
    styleUrls: ['./matchplay.component.scss'],
})
export class MatchplayComponent implements OnInit, OnChanges {
    @Input()
    tournamentID: string;
    @Input()
    courseID: string;
    @Input()
    activeRound: number;
    @Input()
    highlightFlightId: string = null;
    highlightedFlightId: string = null;
    myPlayer: Player;
    isLoading: Boolean = true;
    loggedInuser: UserSessionModel;
    matchPlayData: any;
    totalRounds: number = 0;
    courseHoleSetNames;
    flightRound: number;
    ddSelectedFlight: string = '0';
    tRounds: any[] = [];
    currentRoundFlights: any[] = [];
    roundFlights: any[] = [];
    //scoreHeader: any[] = [];
    //tournamentID: string;
    filterPlayer: string = '';
    coursesList: any[] = [];
    selectedCourse: string = '';
    courseHoleSet: number = 0;
    subTournaments: any[];
    showTaxes: boolean = false;
    showPairs: boolean = false;
    active: boolean = false;
    flightPlayers: any[] = [];
    filters: FormGroup;
    contactList: FormArray;
    selectedTeamName: boolean = false;
    showRound1: boolean = false;
    showRound2: boolean = false;
    showRound3: boolean = false;
    showRound4: boolean = false;
    selectedIndex: any = 0;
    noOfRounds: any = 0;
    constructor(
        private router: Router,
        private location: Router,
        private route: ActivatedRoute,
        private apollo: Apollo, private _localStorage: LocalStorageService,
        private _formBuilder: FormBuilder,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private facadeService: FacadeService,
        private logger: LogsService
    ) { }

    ngOnInit() {
        try {
            console.log(this.courseID);
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.logger.log('Admin comes to Tournament Score Page', "info");
            this.logger.log('Getting Tournament Score Data', "info", this.tournamentID);

            this.filters = this._formBuilder.group({
                name: [null, Validators.compose([Validators.required])],
            });

            this.route.paramMap.subscribe((params) => {
                //this.tournamentID = params.get("id");
            });

            of(this.matchPlayData)
                .pipe()
                .subscribe(
                    async (data) => {
                        let dataLeaderboard =
                            await this.facadeService.MatchPlayDataQuery(
                                '-L6WPki8tSDZ1IAAoRXZ',
                                this.tournamentID
                            );
                        //console.log(dataLeaderboard);


                        this.matchPlayData = dataLeaderboard.TournamentQL;
                        this.isLoading = false;
                        ////console.log('Match play data');
                        console.log(this.matchPlayData);
                        if (
                            this.matchPlayData['matchFormat'] ==
                            matchFormat.TEXAS_SCRAMBLE || this.matchPlayData['matchFormat'] ==
                            matchFormat.BESTBALL || this.matchPlayData['matchFormat'] ==
                            matchFormat.TWO_BALL_SCRAMBLE || this.matchPlayData['matchFormat'] ==
                            matchFormat.THREE_BALL_SCRAMBLE || this.matchPlayData['matchFormat'] ==
                            matchFormat.FOUR_BALL_SCRAMBLE
                        ) {
                            this.showTaxes = true;
                        }
                        if (
                            this.matchPlayData['matchFormat'] == matchFormat.GREENSOME || this.matchPlayData['matchFormat'] == matchFormat.FOURSOME
                        ) {
                            this.showPairs = true;
                        }


                        let tournamentData: any = this.matchPlayData;

                        // this.activeRound = tournamentData.activeRound;
                        this.totalRounds = tournamentData.noOfRounds;
                        if (
                            this.matchPlayData.matchFormat === matchFormat.MATCH_PLAY &&
                            this.matchPlayData.pointsFormats
                        ) {
                            const roundKey =
                                this.activeRound === 1
                                    ? "pointsFormat"
                                    : `pointsFormat${this.activeRound}`;

                            const format = this.matchPlayData.pointsFormats[roundKey];

                            console.log("Format:", format);
                            if (format == matchFormat.GREENSOME || format == matchFormat.FOURSOME) {
                                this.showPairs = true;
                            }
                        }
                        this.selectedIndex = this.activeRound - 1;
                        let roundCourse;
                        this.noOfRounds = tournamentData.noOfRounds;
                        if (this.activeRound > this.noOfRounds) {
                            if (this.noOfRounds == 1) this.showRound1 = true;
                            else if (this.noOfRounds == 2) this.showRound2 = true;
                            else if (this.noOfRounds == 3) this.showRound3 = true;
                            else if (this.noOfRounds == 4) this.showRound4 = true;
                            else this.showRound4 = true;
                        } else {
                            if (this.activeRound == 1) {
                                this.showRound1 = true;
                                roundCourse = tournamentData['CoursesQL'].filter((course) => { return course.round == this.activeRound });
                                console.log(roundCourse);
                                this.courseID = roundCourse[0]?.courseId ?? this.courseID;
                            } else if (this.activeRound == 2) {
                                this.showRound2 = true;
                                roundCourse = tournamentData['CoursesQL'].filter((course) => { return course.round == this.activeRound });
                                console.log(roundCourse);
                                this.courseID = roundCourse[0]?.courseId ?? this.courseID;
                            } else if (this.activeRound == 3) {
                                this.showRound3 = true;
                                roundCourse = tournamentData['CoursesQL'].filter((course) => { return course.round == this.activeRound });
                                console.log(roundCourse);
                                this.courseID = roundCourse[0]?.courseId ?? this.courseID;
                            } else if (this.activeRound == 4) {
                                this.showRound4 = true;
                                roundCourse = tournamentData['CoursesQL'].filter((course) => { return course.round == this.activeRound });
                                console.log(roundCourse);
                                this.courseID = roundCourse[0]?.courseId ?? this.courseID;
                            } else this.showRound4 = true;
                        }

                        let selectedCourseHoleSet =
                            await this.facadeService.getCourseHoleSetsForCourse(
                                this.courseID
                            );
                        this.courseHoleSetNames =
                            selectedCourseHoleSet['course_hole_sets'];
                        this.subTournaments = tournamentData.SubTournamentsQL;

                        if (tournamentData.activeRound > tournamentData.noOfRounds)
                            this.flightRound = tournamentData.noOfRounds;
                        else this.flightRound = this.activeRound;

                        // for (
                        //     let round = 1;
                        //     round <= tournamentData.noOfRounds;
                        //     round++
                        // ) {
                        //     let r: any = {
                        //         Text: 'Round ' + round,
                        //         Value: round,
                        //     };
                        //     this.tRounds.push(r);
                        // }

                        this.tRounds = [];

                        for (let i = 1; i <= this.noOfRounds; i++) {
                            let status = '';

                            if (i < this.activeRound) {
                                status = 'Completed';
                            } else if (i === this.activeRound) {
                                status = 'In Progress';
                            } else {
                                status = 'Pending'; // or "Upcoming"
                            }

                            this.tRounds.push({
                                label: 'Round ' + i,
                                status: status,
                                round: i
                            });
                        }

                        this.parseSubscriptionResponse();
                    },
                    (error) => (this.isLoading = false)
                );
        } catch (error) {
            this.logger.log('Getting Tournament Score Data Failed', "error", error.toString());
        }
    }


    getTeamColor(playerId: string) {
        for (let team of this.matchPlayData.teams) {
            for (let member of team.teamMembers) {
                if (member.playerId === playerId) {
                    return team.color;   // <--- NOW it properly returns
                }
            }
        }
        return null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // ..this.getSelectedPlayers();
        // this.selectedMembers=changes;
        console.log(changes);

        if (changes['activeRound']) {
            this.activeRound = changes['activeRound'].currentValue;
            this.flightRound = changes['activeRound'].currentValue;
            this.changeRound({ round: this.activeRound });
        }

        if (changes['highlightFlightId'] && changes['highlightFlightId'].currentValue) {
            this.highlightedFlightId = changes['highlightFlightId'].currentValue;
        }
    }

    changeFlight(item) {
        ////console.log("Selected value: " + item.value);
        this.ddSelectedFlight = item.value;

        this.roundFlights = [];
        //this.scoreHeader = [];

        this.flightPlayers = [];
        //this.currentRoundFlights = [];

        this.parseSubscriptionResponse();
    }

    changeCourse(item) {
        //console.log('Selected value: ' + item.value);
        this.selectedCourse = item.value;

        this.roundFlights = [];
        //this.scoreHeader = [];

        this.flightPlayers = [];
        //this.currentRoundFlights = [];

        this.parseSubscriptionResponse();
    }

    filterPlayerFlight(query) {
        if (query.length > 3) {
            this.filterPlayer = query;
        } else {
            this.filterPlayer = '';
            this.filters.reset();
        }

        this.selectedTeamName = true;
        this.roundFlights = [];
        //this.scoreHeader = [];

        this.flightPlayers = [];
        this.parseSubscriptionResponse();
    }

    async changeRound(item) {
        ////console.log("Selected value: " + item.value);
        let roundCourse;
        // if (this.active) {
        this.flightRound = item.round;
        this.activeRound = item.round;
        if (
            this.matchPlayData.matchFormat === matchFormat.MATCH_PLAY &&
            this.matchPlayData.pointsFormats
        ) {
            const roundKey =
                this.activeRound === 1
                    ? "pointsFormat"
                    : `pointsFormat${this.activeRound}`;

            const format = this.matchPlayData.pointsFormats[roundKey];

            console.log("Format:", format);
            if (format == matchFormat.GREENSOME || format == matchFormat.FOURSOME) {
                this.showPairs = true;
            } else {
                this.showPairs = false;
            }
        }
        if (this.flightRound == 1) {
            this.showRound1 = true;
            roundCourse = this.matchPlayData['CoursesQL'].filter((course) => { return course.round == this.flightRound });
            console.log(roundCourse);
            this.courseID = roundCourse[0]?.courseId ?? this.courseID;
        } else if (this.flightRound == 2) {
            this.showRound2 = true;
            roundCourse = this.matchPlayData['CoursesQL'].filter((course) => { return course.round == this.flightRound });
            console.log(roundCourse);
            this.courseID = roundCourse[0]?.courseId ?? this.courseID;
        } else if (this.flightRound == 3) {
            this.showRound3 = true;
            roundCourse = this.matchPlayData['CoursesQL'].filter((course) => { return course.round == this.flightRound });
            console.log(roundCourse);
            this.courseID = roundCourse[0]?.courseId ?? this.courseID;
        } else if (this.flightRound == 4) {
            this.showRound4 = true;
            roundCourse = this.matchPlayData['CoursesQL'].filter((course) => { return course.round == this.flightRound });
            console.log(roundCourse);
            this.courseID = roundCourse[0]?.courseId ?? this.courseID;
        } else this.showRound4 = true;
        let selectedCourseHoleSet =
            await this.facadeService.getCourseHoleSetsForCourse(
                this.courseID
            );
        this.courseHoleSetNames =
            selectedCourseHoleSet['course_hole_sets'];
        this.ddSelectedFlight = '0';
        this.roundFlights = [];
        //this.scoreHeader = [];

        this.flightPlayers = [];
        //this.currentRoundFlights = [];

        await this.parseSubscriptionResponse();
        // }
    }
    async generatePDFGross() {
        const doc = new jsPDF("l", "mm", "a4"); // Landscape mode
        const pageWidth = (doc as any).internal.pageSize.width;

        // **Header 1: Tournament Title**
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(this.matchPlayData["club"]?.name.toString().toUpperCase(), pageWidth / 2, 15, { align: "center" });
        doc.text(this.matchPlayData["title"].toString().toUpperCase(), pageWidth / 2, 22, { align: "center" });
        doc.setFontSize(12);
        // doc.text(`Day ${this.matchPlayData["activeRound"]} Score`, pageWidth / 2, 27, { align: "center" });

        // **Header 2: Category Title**
        doc.setFillColor(41, 128, 185); // Blue background
        doc.rect(14, 30, 269, 7, "F"); // Full-width rectangle
        doc.setTextColor(255, 255, 255); // White text
        doc.setFontSize(9);
        doc.text("ALL CATEGORIES HOLE-WISE SCORE(GROSS)", 148, 35, { align: "center" });

        // Reset text color for table
        doc.setTextColor(0, 0, 0);

        // Fetch the first flight's course par data
        let pars9 = this.flightPlayers[0]?.header.courseHoles9.map((a) => a.par) || [];
        let pars18 = this.flightPlayers[0]?.header.courseHoles18.map((a) => a.par) || [];

        // **Multi-Row Header**
        const headers = [
            ["PAR", "", "", ...pars9, "36", ...pars18, "36", "", "", "", ""],
            [
                "S.No",
                "Name",
                "MemNo.",
                "1", "2", "3", "4", "5", "6", "7", "8", "9", "OUT",
                "10", "11", "12", "13", "14", "15", "16", "17", "18", "IN",
                "RD 1", "RD 2", "RD 3", "Total"
            ]
        ];

        // **Step 1: Fetch Data for All Rounds**
        let playerScores = {}; // Store player scores grouped by category

        for (let round = 1; round <= this.activeRound; round++) {
            await this.changeRound({ index: round - 1 }); // Change round data
            await new Promise((resolve) => setTimeout(resolve, 1000));

            this.flightPlayers.flatMap((flight) =>
                flight
                    .filter((player) => typeof player === "object" && player !== null) // Ensure it's an object
                    .forEach((player) => {
                        const category = player.playerCategory || "Uncategorized"; // Fallback category
                        if (!playerScores[category]) {
                            playerScores[category] = {}; // Create category if not exists
                        }
                        if (!playerScores[category][player.playerId]) {
                            playerScores[category][player.playerId] = {
                                name: player.name.toString().toUpperCase(),
                                membershipNumber: player.membershipNumber,
                                Hole9Scores: [...player.Hole9Scores], // Clone scores to avoid reference issues
                                gross9Total: player.gross9Total,
                                Hole18Scores: [...player.Hole18Scores],
                                gross18Total: player.gross18Total,
                                rounds: [null, null, null], // Placeholder for RD1, RD2, RD3
                            };
                        }
                        playerScores[category][player.playerId].rounds[round - 1] = player.grossTotal; // Store round score
                    })
            );
        }

        // **Step 2: Convert Data into Table Format with Categories**
        let startY = 38;
        let categoryIndex = 0;

        Object.keys(playerScores).forEach((category, index) => {
            const players = Object.values(playerScores[category]);

            if (index > 0) {
                doc.addPage(); // Add a new page for each new category
                startY = 38; // Reset start position for new page
            }
            // **Step 2.1: Add Category Header**
            // if (categoryIndex > 0) startY += 10; // Add spacing between categories
            doc.setFillColor(200, 200, 200);
            doc.rect(14, startY, 269, 6, "F"); // Gray background for category
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(category.toUpperCase(), 148, startY + 4, { align: "center" });
            startY += 8; // Move position down for table

            let count = 0;
            const dataA = players
                .map((player) => {
                    let totalScore = player["rounds"].reduce((sum, score) => sum + (score || 0), 0);
                    return {
                        count: 0, // Placeholder for S.No
                        playerData: [
                            player["name"], // Player Name
                            player["membershipNumber"], // Membership Number
                            ...player["Hole9Scores"], // Front 9 Scores
                            player["gross9Total"], // OUT Score
                            ...player["Hole18Scores"], // Back 9 Scores
                            player["gross18Total"], // IN Score
                            ...player["rounds"], // RD 1, RD 2, RD 3 values
                            totalScore, // Total of all rounds
                        ],
                        totalScore, // Used for sorting
                    };
                })
                .sort((a, b) => a.totalScore - b.totalScore) // Sorting from low to high
                .map((item, index) => {
                    item.playerData.unshift(index + 1); // Add S.No based on sorted order
                    return item.playerData;
                });

            // **Step 3: Generate Table for Current Category**
            (doc as any).autoTable({
                startY: startY,
                head: headers,
                body: dataA,
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, halign: "center" },
                bodyStyles: { fontSize: 7, halign: "center" },
                columnStyles: { 1: { halign: "left" }, 2: { halign: "left" } }, // Align Name & Club to the left
            });

            startY = (doc as any).lastAutoTable.finalY + 10; // Move startY below the table
            categoryIndex++;
        });

        // **Save PDF**
        doc.save("Golf_ScoreSheet.pdf");
    }
    async generatePDFNet() {
        const doc = new jsPDF("l", "mm", "a4"); // Landscape mode
        const pageWidth = (doc as any).internal.pageSize.width;

        // **Header 1: Tournament Title**
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(this.matchPlayData["club"]?.name, pageWidth / 2, 15, { align: "center" });
        doc.text(this.matchPlayData["title"], pageWidth / 2, 22, { align: "center" });
        doc.setFontSize(12);
        // doc.text(`Day ${this.matchPlayData["activeRound"]} Score`, pageWidth / 2, 27, { align: "center" });

        // **Header 2: Category Title**
        doc.setFillColor(41, 128, 185); // Blue background
        doc.rect(14, 30, 269, 7, "F"); // Full-width rectangle
        doc.setTextColor(255, 255, 255); // White text
        doc.setFontSize(9);
        doc.text("ALL CATEGORIES HOLE-WISE SCORE(NET)", 148, 35, { align: "center" });

        // Reset text color for table
        doc.setTextColor(0, 0, 0);

        // Fetch the first flight's course par data
        let pars9 = this.flightPlayers[0]?.header.courseHoles9.map((a) => a.par) || [];
        let pars18 = this.flightPlayers[0]?.header.courseHoles18.map((a) => a.par) || [];

        // **Multi-Row Header**
        const headers = [
            ["PAR", "", "", ...pars9, "36", ...pars18, "36", "", "", "", ""],
            [
                "S.No",
                "Name",
                "MemNo.",
                "1", "2", "3", "4", "5", "6", "7", "8", "9", "OUT",
                "10", "11", "12", "13", "14", "15", "16", "17", "18", "IN",
                "RD 1", "RD 2", "RD 3", "Total"
            ]
        ];

        // **Step 1: Fetch Data for All Rounds**
        let playerScores = {}; // Store player scores grouped by category

        for (let round = 1; round <= this.activeRound; round++) {
            await this.changeRound({ index: round - 1 }); // Change round data
            await new Promise((resolve) => setTimeout(resolve, 1000));

            this.flightPlayers.flatMap((flight) =>
                flight
                    .filter((player) => typeof player === "object" && player !== null) // Ensure it's an object
                    .forEach((player) => {
                        const category = player.playerCategory || "Uncategorized"; // Fallback category
                        if (!playerScores[category]) {
                            playerScores[category] = {}; // Create category if not exists
                        }
                        if (!playerScores[category][player.playerId]) {
                            playerScores[category][player.playerId] = {
                                name: player.name,
                                membershipNumber: player.membershipNumber,
                                Hole9NetScores: [...player.Hole9NetScores], // Clone scores to avoid reference issues
                                net9Total: player.net9Total,
                                Hole18NetScores: [...player.Hole18NetScores],
                                net18Total: player.net18Total,
                                rounds: [null, null, null], // Placeholder for RD1, RD2, RD3
                            };
                        }
                        playerScores[category][player.playerId].rounds[round - 1] = player.netTotal; // Store round score
                    })
            );
        }

        // **Step 2: Convert Data into Table Format with Categories**
        let startY = 38;
        let categoryIndex = 0;

        Object.keys(playerScores).forEach((category, index) => {
            const players = Object.values(playerScores[category]);
            if (index > 0) {
                doc.addPage(); // Add a new page for each new category
                startY = 38; // Reset start position for new page
            }
            // **Step 2.1: Add Category Header**
            // if (categoryIndex > 0) startY += 10; // Add spacing between categories
            doc.setFillColor(200, 200, 200);
            doc.rect(14, startY, 269, 6, "F"); // Gray background for category
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(category.toUpperCase(), 148, startY + 4, { align: "center" });
            startY += 8; // Move position down for table

            let count = 0;
            const dataA = players
                .map((player) => {
                    let totalScore = player["rounds"].reduce((sum, score) => sum + (score || 0), 0);
                    return {
                        count: 0, // Placeholder for S.No
                        playerData: [
                            player["name"], // Player Name
                            player["membershipNumber"], // Membership Number
                            ...player["Hole9NetScores"], // Front 9 Scores
                            player["net9Total"], // OUT Score
                            ...player["Hole18NetScores"], // Back 9 Scores
                            player["net18Total"], // IN Score
                            ...player["rounds"], // RD 1, RD 2, RD 3 values
                            totalScore, // Total of all rounds
                        ],
                        totalScore, // Used for sorting
                    };
                })
                .sort((a, b) => a.totalScore - b.totalScore) // Sorting from low to high
                .map((item, index) => {
                    item.playerData.unshift(index + 1); // Add S.No based on sorted order
                    return item.playerData;
                });

            // **Step 3: Generate Table for Current Category**
            (doc as any).autoTable({
                startY: startY,
                head: headers,
                body: dataA,
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, halign: "center" },
                bodyStyles: { fontSize: 7, halign: "center" },
                columnStyles: { 1: { halign: "left" }, 2: { halign: "left" } }, // Align Name & Club to the left
            });

            startY = (doc as any).lastAutoTable.finalY + 10; // Move startY below the table
            categoryIndex++;
        });

        // **Save PDF**
        doc.save("Golf_ScoreSheet.pdf");
    }


    private parseSubscriptionResponse(): boolean {
        try {
            if (this.matchPlayData == null) {
                return false;
            }
            let tournamentData: any = this.matchPlayData;

            if (tournamentData.noOfRounds > 0) {
                if (this.ddSelectedFlight != '0') {
                    this.roundFlights = tournamentData.FlightsQL.filter((a) => {
                        return (
                            a.flightRound == this.flightRound &&
                            a.id == this.ddSelectedFlight
                        );
                    });
                } else {
                    this.roundFlights = tournamentData.FlightsQL.filter((a) => {
                        return a.flightRound == this.flightRound;
                    });

                    if (this.selectedCourse != '') {
                        this.roundFlights = this.roundFlights.filter((a) => {
                            return a.courseId == this.selectedCourse;
                        });
                    }

                    this.currentRoundFlights = [];
                    for (let flight of this.roundFlights) {
                        ////console.log(flight);
                        if (!this.showTaxes) {
                            let r: any = {
                                Text: 'Flight ' + flight.flightNo,
                                Value: flight.id,
                            };
                            this.currentRoundFlights.push(r);
                        } else {
                            let r: any = {
                                Text: 'Team ' + flight.flightNo,
                                Value: flight.id,
                            };
                            this.currentRoundFlights.push(r);
                        }
                    }
                    ////console.log(this.currentRoundFlights);
                }
                ////console.log(this.roundFlights);
                //console.log(this.filterPlayer);
                if (!this.showTaxes && this.filterPlayer != '') {
                    var filteredArray: any = this.roundFlights
                        .filter((element) =>
                            element.MembersQL.some(
                                (MembersQL) =>
                                    MembersQL.PlayerQL.firstName
                                        .toLowerCase()
                                        .includes(
                                            this.filterPlayer.toLowerCase()
                                        ) ||
                                    MembersQL.PlayerQL.lastName
                                        .toLowerCase()
                                        .includes(this.filterPlayer.toLowerCase())
                            )
                        )
                        .map((element) => {
                            let n = Object.assign({}, element, {
                                MembersQL: element.MembersQL.filter(
                                    (subElement) =>
                                        subElement.PlayerQL.firstName
                                            .toLowerCase()
                                            .includes(
                                                this.filterPlayer.toLowerCase()
                                            ) ||
                                        subElement.PlayerQL.lastName
                                            .toLowerCase()
                                            .includes(
                                                this.filterPlayer.toLowerCase()
                                            )
                                ),
                            });
                            return n;
                        });

                    // let filteredArray = this.roundFlights
                    // .filter((element) =>
                    //   element.MembersQL.some((subElement) => subElement.PlayerQL.firstName === this.filterPlayer))
                    // .map(element => {
                    //   let newElt = Object.assign({}, element); // copies element
                    //   return newElt.MembersQL.filter(subElement => subElement.PlayerQL.firstName === this.filterPlayer);
                    // });

                    ////console.log(filteredArray);
                } else if (this.filterPlayer != '') {
                    if (!this.selectedTeamName) {
                        var filteredArray: any = this.roundFlights;
                    } else {
                        var filteredArray: any = this.roundFlights.filter(
                            (element) => {
                                if (
                                    element.FlightName.name
                                        .toLowerCase()
                                        .includes(this.filterPlayer.toLowerCase())
                                ) {
                                    return element;
                                } else {
                                    return '';
                                }
                            }
                        );
                    }

                    // .filter((element) =>
                    //   element.FlightName.some(
                    //     (member) =>
                    //     member.name
                    //         .toLowerCase()
                    //         .includes(this.filterPlayer.toLowerCase()) ||
                    //         member.name
                    //         .toLowerCase().includes(this.filterPlayer.toLowerCase())
                    //   )
                    // )
                    // .map((element) => {
                    //   let n = Object.assign({}, element, {
                    //     MembersQL: element.MembersQL.filter(
                    //       (subElement) =>
                    //         subElement.PlayerQL.firstName
                    //           .toLowerCase()
                    //           .includes(this.filterPlayer.toLowerCase()) ||
                    //         subElement.PlayerQL.lastName
                    //           .toLowerCase()
                    //           .includes(this.filterPlayer.toLowerCase())
                    //     ),
                    //   });
                    //   return n;
                    // });
                }

                ////console.log(this.roundFlights);
                if (filteredArray) {
                    this.active = true;
                    this.setupMatchplayData(filteredArray, 2, true);
                } else if (this.roundFlights.length > 0) {
                    ////console.log("not null");
                    this.setupMatchplayData(this.roundFlights, 2, true);
                }
            }
        } catch (error) {
            this.logger.log('Getting Tournaments Score Data Failed', "error", error.toString());
        }
    }
    private async setupMatchplayData(
        flightsQLs: any[],
        round: number,
        flag: boolean
    ) {
        try {

            const pairLookup = new Map();
            const memberToPair = new Map();

            if (this.matchPlayData?.pairs?.length) {
                for (const p of this.matchPlayData.pairs) {
                    pairLookup.set(p.id, p);
                }
            }

            for (const p of this.matchPlayData.pairs) {
                memberToPair.set(p.member1Id, p);
                memberToPair.set(p.member2Id, p);
            }

            this.active = true;
            let findex = 0;
            for (let flightData of flightsQLs) {
                ////console.log(flightData);
                ////console.log("Flight ID: " + flightData.id);
                let membersQLs: any = flightData.MembersQL;
                let singleFlight: any[] = [];
                let courseHoleSetTitle;
                let flightHeader = await this.setupMatchplayHeader(
                    flightData.tee_id,
                    this.noOfRounds > 1 ? this.matchPlayData['CourseQL'] : this.matchPlayData['CourseQL'],
                    flightData.courseHoleSets !== 0 ? flightData.courseHoleSets : 3,
                    flightData.courseHoleSetsInverted
                );

                ////console.log(par9);
                ////console.log(par18);
                ////console.log(flightData);
                if (!this.showTaxes && !this.showPairs) {
                    for (let membersQL of membersQLs) {
                        let player: Player = membersQL.PlayerQL;
                        let playerScore: any[] = membersQL.ScoresQL;

                        let playerId: String = player.id;

                        if (player == null) {
                            continue;
                        }

                        let playerHole9Score: any = [];
                        let playerHole18Score: any[] = [];
                        let playerHole9NetScore: any = [];
                        let playerHole18NetScore: any[] = [];
                        let gross9Total = 0;
                        let gross18Total = 0;
                        let net9Total = 0;
                        let net18Total = 0;
                        let holePlayed: number = 0;

                        for (let i = 0; i < 9; i++) {
                            let courseHole = flightHeader.courseHoles9.filter(
                                (el) => {
                                    return el.holeNo == i + 1;
                                }
                            );

                            // //console.log(courseHole);

                            let hole = playerScore.find((a) => {
                                return (
                                    a.holeId ==
                                    (courseHole.length > 0 ? courseHole[0].id : '')
                                );
                            });
                            console.log(hole);

                            if (hole) {
                                playerHole9Score[i] = hole.grossScore;
                                playerHole9NetScore[i] = hole.netScore;
                                gross9Total += hole.grossScore;
                                net9Total += hole.netScore;
                                holePlayed++;

                            } else {
                                playerHole9Score[i] = '';
                                playerHole9NetScore[i] = '';
                            }
                        }

                        for (let i = 0; i < 9; i++) {
                            if (flightHeader.courseHoles18.length > 0) {
                                let courseHole = flightHeader.courseHoles18.filter(
                                    (el) => {
                                        return el.holeNo == i + 9 + 1;
                                    }
                                );

                                // //console.log(i + 9 + 1);
                                // //console.log(courseHole);

                                let hole = playerScore.find((a) => {
                                    // //console.log(a.holeId + "<---->" + courseHole[0].id);
                                    // //console.log(courseHole.length > 0 ? courseHole[0].id : "");
                                    return (
                                        a.holeId ==
                                        (courseHole.length > 0
                                            ? courseHole[0].id
                                            : '')
                                    );
                                });

                                ////console.log(hole);

                                if (hole) {
                                    playerHole18Score[i] = hole.grossScore;
                                    playerHole18NetScore[i] = hole.netScore;
                                    gross18Total += hole.grossScore;
                                    net18Total += hole.netScore;
                                    holePlayed++;
                                } else {
                                    playerHole18Score[i] = '';
                                    playerHole18NetScore[i] = '';
                                }
                            }
                        }

                        let grossTotal: number = gross9Total + gross18Total;
                        let netTotal: number = net9Total + net18Total;

                        ////console.log(playerHole9Score);
                        ////console.log(playerHole18Score);

                        if (this.courseHoleSetNames) {
                            courseHoleSetTitle = this.courseHoleSetNames.find(
                                (a) => {
                                    return (
                                        a.holeSets == flightData.courseHoleSets &&
                                        a.inverted ==
                                        flightData.courseHoleSetsInverted
                                    );
                                }
                            );
                        }
                        let LeaderGross: any = {
                            flightId: flightData.id,
                            courseId: flightData.courseId,
                            playerId: player.id,
                            name: player.firstName + ' ' + player.lastName,
                            picture: player.picture,
                            membershipNumber: player.membershipNumber,
                            playerCategory: player.playerCategory,
                            handicap: player.handicap,
                            Hole9Scores: playerHole9Score,
                            scoreSaved: playerScore.length > 0 ? true : false,
                            Hole18Scores: playerHole18Score,
                            Hole9NetScores: playerHole9Score,
                            Hole18NetScores: playerHole18NetScore,
                            gross9Total: gross9Total,
                            gross18Total: gross18Total,
                            net9Total: net9Total,
                            net18Total: net18Total,
                            grossTotal: grossTotal,
                            netTotal: netTotal,
                            holesPlayed: holePlayed,
                        };

                        singleFlight.push(LeaderGross);
                    }
                } else if (this.showTaxes) {
                    for (let membersQL of membersQLs) {
                        let player: Player = membersQL.PlayerQL;

                        let playerScore: any[] = membersQL.ScoresQL;

                        let playerId: String = player.id;

                        if (player == null) {
                            continue;
                        }

                        let playerHole9Score: any = [];
                        let playerHole18Score: any[] = [];
                        let playerHole9NetScore: any = [];
                        let playerHole18NetScore: any[] = [];
                        let gross9Total = 0;
                        let gross18Total = 0;
                        let net9Total = 0;
                        let net18Total = 0;
                        let holePlayed: number = 0;

                        for (let i = 0; i < 9; i++) {
                            let courseHole = flightHeader.courseHoles9.filter(
                                (el) => {
                                    return el.holeNo == i + 1;
                                }
                            );

                            ////console.log(courseHole);

                            let hole = playerScore.find((a) => {
                                return (
                                    a.holeId ==
                                    (courseHole.length > 0 ? courseHole[0].id : '')
                                );
                            });
                            ////console.log(hole);

                            if (hole) {
                                playerHole9Score[i] = hole.grossScore;
                                playerHole9NetScore[i] = hole.netScore;
                                gross9Total += hole.grossScore;
                                net9Total += hole.netScore;
                                holePlayed++;
                            } else {
                                playerHole9Score[i] = '';
                                playerHole9NetScore[i] = '';
                            }
                        }

                        for (let i = 0; i < 9; i++) {
                            let courseHole = flightHeader.courseHoles18.filter(
                                (el) => {
                                    return el.holeNo == i + 9 + 1;
                                }
                            );

                            // //console.log(i + 9 + 1);
                            // //console.log(courseHole);

                            let hole = playerScore.find((a) => {
                                // //console.log(a.holeId + '<---->' + courseHole[0].id);
                                // //console.log(
                                //     courseHole.length > 0 ? courseHole[0].id : ''
                                // );
                                return (
                                    a.holeId ==
                                    (courseHole.length > 0 ? courseHole[0].id : '')
                                );
                            });

                            ////console.log(hole);

                            if (hole) {
                                playerHole18Score[i] = hole.grossScore;
                                playerHole18NetScore[i] = hole.netScore;
                                gross18Total += hole.grossScore;
                                net18Total += hole.netScore;
                                holePlayed++;
                            } else {
                                playerHole18Score[i] = '';
                                playerHole18NetScore[i] = '';
                            }
                        }

                        let grossTotal: number = gross9Total + gross18Total;
                        let netTotal: number = net9Total + net18Total;

                        ////console.log(playerHole9Score);
                        ////console.log(playerHole18Score);

                        if (this.courseHoleSetNames) {
                            courseHoleSetTitle = this.courseHoleSetNames.find(
                                (a) => {
                                    return (
                                        a.holeSets == flightData.courseHoleSets &&
                                        a.inverted ==
                                        flightData.courseHoleSetsInverted
                                    );
                                }
                            );
                        }

                        let LeaderGross: any = {
                            teamName: flightData['FlightName'].name,
                            flightId: flightData.id,
                            courseId: flightData.courseId,
                            playerId: player.id,
                            name: player.firstName + ' ' + player.lastName,
                            picture: player.picture,
                            handicap: player.handicap,
                            Hole9Scores: playerHole9Score,
                            Hole18Scores: playerHole18Score,
                            Hole9NetScores: playerHole9Score,
                            Hole18NetScores: playerHole18NetScore,
                            gross9Total: gross9Total,
                            scoreSaved: playerScore.length > 0 ? true : false,
                            membershipNumber: player.membershipNumber,
                            playerCategory: player.playerCategory,
                            gross18Total: gross18Total,
                            grossTotal: grossTotal,
                            net9Total: net9Total,
                            net18Total: net18Total,
                            netTotal: netTotal,
                            holesPlayed: holePlayed,
                        };

                        singleFlight.push(LeaderGross);
                    }
                } else if (this.showPairs) {
                    const addedPairs = new Set();

                    for (let membersQL of membersQLs) {
                        let player: Player = membersQL.PlayerQL;
                        let playerScore: any[] = membersQL.ScoresQL;

                        if (!player) continue;

                        const pair = memberToPair.get(player.id);
                        if (!pair) continue;

                        // ⛔ Skip if this pair is already processed
                        if (addedPairs.has(pair.id)) continue;

                        // ✅ Mark pair as processed
                        addedPairs.add(pair.id);

                        // We will use this player's score for the whole PAIR
                        let playerHole9Score: any = [];
                        let playerHole18Score: any[] = [];
                        let playerHole9NetScore: any = [];
                        let playerHole18NetScore: any[] = [];
                        let gross9Total = 0;
                        let gross18Total = 0;
                        let net9Total = 0;
                        let net18Total = 0;
                        let holePlayed = 0;

                        // ---------- 9 Holes ----------
                        for (let i = 0; i < 9; i++) {
                            let courseHole = flightHeader.courseHoles9.filter(el => el.holeNo == i + 1);

                            let hole = playerScore.find(a =>
                                a.holeId == (courseHole.length > 0 ? courseHole[0].id : '')
                            );

                            if (hole) {
                                playerHole9Score[i] = hole.grossScore;
                                playerHole9NetScore[i] = hole.netScore;
                                gross9Total += hole.grossScore;
                                net9Total += hole.netScore;
                                holePlayed++;
                            } else {
                                playerHole9Score[i] = '';
                                playerHole9NetScore[i] = '';
                            }
                        }

                        // ---------- Back 9 Holes (10–18) ----------
                        for (let i = 0; i < 9; i++) {
                            let courseHole = flightHeader.courseHoles18.filter(
                                el => el.holeNo == i + 10
                            );

                            let hole = playerScore.find(a =>
                                a.holeId == (courseHole.length > 0 ? courseHole[0].id : '')
                            );

                            if (hole) {
                                playerHole18Score[i] = hole.grossScore;
                                playerHole18NetScore[i] = hole.netScore;
                                gross18Total += hole.grossScore;
                                net18Total += hole.netScore;
                                holePlayed++;
                            } else {
                                playerHole18Score[i] = '';
                                playerHole18NetScore[i] = '';
                            }
                        }

                        let grossTotal = gross9Total + gross18Total;
                        let netTotal = net9Total + net18Total;

                        ////console.log(playerHole9Score);
                        ////console.log(playerHole18Score);

                        if (this.courseHoleSetNames) {
                            courseHoleSetTitle = this.courseHoleSetNames.find(
                                (a) => {
                                    return (
                                        a.holeSets == flightData.courseHoleSets &&
                                        a.inverted ==
                                        flightData.courseHoleSetsInverted
                                    );
                                }
                            );
                        }

                        let LeaderGross: any = {
                            teamName: pair.pairName,
                            flightId: flightData.id,
                            pairId: pair.id,
                            pairName: pair.pairName,
                            courseId: flightData.courseId,
                            playerId: player.id,
                            name: player.firstName + ' ' + player.lastName,
                            picture: player.picture,
                            handicap: player.handicap,
                            Hole9Scores: playerHole9Score,
                            Hole18Scores: playerHole18Score,
                            Hole9NetScores: playerHole9Score,
                            Hole18NetScores: playerHole18NetScore,
                            gross9Total: gross9Total,
                            scoreSaved: playerScore.length > 0 ? true : false,
                            membershipNumber: player.membershipNumber,
                            playerCategory: player.playerCategory,
                            gross18Total: gross18Total,
                            grossTotal: grossTotal,
                            net9Total: net9Total,
                            net18Total: net18Total,
                            netTotal: netTotal,
                            holesPlayed: holePlayed,
                        };

                        singleFlight.push(LeaderGross);
                    }
                }

                this.flightPlayers.push(singleFlight);
                this.flightPlayers[findex]['header'] = flightHeader;
                (this.flightPlayers[findex]['FlightName'] = this.showTaxes ? flightData['FlightName'].name : '');
                (this.flightPlayers[findex]['flightId'] = flightData.id);
                this.flightPlayers[findex]['courseHoleSetTitle'] =
                    courseHoleSetTitle ? courseHoleSetTitle.displayName : '';
                this.flightPlayers[findex]['courseHoleSetKey'] = courseHoleSetTitle
                    ? flightData.courseHoleSets +
                    '_' +
                    flightData.courseHoleSetsInverted
                    : '';
                this.flightPlayers[findex]['courseTee'] = courseHoleSetTitle
                    ? flightData.tee
                    : '';
                this.flightPlayers[findex]['Hole9Scores'] =
                    this.flightPlayers[findex][0]?.Hole9Scores;
                this.flightPlayers[findex]['Hole18Scores'] =
                    this.flightPlayers[findex][0]?.Hole18Scores;
                this.flightPlayers[findex]['gross9Total'] =
                    this.flightPlayers[findex][0]?.gross9Total;
                this.flightPlayers[findex]['gross18Total'] =
                    this.flightPlayers[findex][0]?.gross18Total;
                this.flightPlayers[findex]['grossTotal'] =
                    this.flightPlayers[findex][0]?.grossTotal;
                console.log(this.flightPlayers);

                findex++;
            }
            console.log(this.flightPlayers);
            this.logger.log('Getting Tournament Score Data Successfully.', "info",);
            this.active = true;
            if (this.highlightedFlightId) {
                setTimeout(() => {
                    const el = document.getElementById('flight-' + this.highlightedFlightId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => { this.highlightedFlightId = null; }, 2500);
                }, 100);
            }
        } catch (error) {
            this.logger.log('Getting Tournament Score Data Failed', "error", error.toString());
        }
    }
    private async setupMatchplayHeader(
        tee_id: string,
        course: any,
        holeSets: number,
        courseHoleSetsInverted: boolean
    ) {
        // let dataLeaderboard = await this.facadeService.getCourseInformation(
        //     courseId
        // );
        try {

            // console.log(course);
            if (Array.isArray(course)) {
                // course is an array
                // console.log('Array:', course);
                let selectedCourse: any = course.filter((cour) => { return cour.round == this.flightRound })
                course = selectedCourse[0].course;
            }
            this.isLoading = false;
            // if (course.length <= 0) return;

            let flightHeader: any[] = [];
            this.isLoading = false;
            this.courseHoleSet = holeSets;

            //if(this.courseHoleSet == 3) this.courseHoleSet = 12;

            let courseHoles9: Hole[] = [];
            let courseHoles18: Hole[] = [];
            let courseHoles27: Hole[] = [];
            let courseHoles36: Hole[] = [];

            let yardage9: number[] = [];
            let yardage18: number[] = [];
            let yardage27: number[] = [];
            let yardage36: number[] = [];

            let yardage9Total: number = 0;
            let yardage18Total: number = 0;
            let yardage27Total: number = 0;
            let yardage36Total: number = 0;

            let par9: number = 0;
            let par18: number = 0;
            let par27: number = 0;
            let par36: number = 0;

            let courseQLs: any = course;
            let holesQLs: any = course.HolesQL;

            var isPresent = this.coursesList.some(function (el) {
                return el.id === course.id;
            });

            if (!isPresent) {
                let courseInfo: any = {
                    id: course.id,
                    name: course.name,
                };
                this.coursesList.push(courseInfo);
            }

            ////console.log(this.coursesList);

            holesQLs = holesQLs.sort(this.Comparator);

            //this.removeExtraHoleSets(holeSets, holesQLs, courseHoleSetsInverted);
            ////console.log(holesQLs);
            // let courseID: any = this.matchPlayData['courseId'];

            // this.courseHoleSetNames = selectedCourseHoleSet['course_hole_sets'];
            holesQLs = this.getHolesSets(
                tee_id,
                holeSets,
                holesQLs,
                courseHoleSetsInverted,
                this.courseHoleSetNames
            );
            for (let holeQL of holesQLs) {
                //let teeDistance = JSON.parse(holeQL.teeDistances);
                let teeDistance = holeQL.teeDistances;

                if (holeQL.holeNo < 10) {
                    yardage9Total += parseInt(teeDistance);
                    par9 += holeQL.par;
                    yardage9.push(parseInt(teeDistance));

                    courseHoles9.push(holeQL);
                } else if (holeQL.holeNo > 9 && holeQL.holeNo < 19) {
                    yardage18.push(parseInt(teeDistance));
                    yardage18Total += parseInt(teeDistance);
                    par18 += holeQL.par;

                    courseHoles18.push(holeQL);
                } else {
                }
            }

            let parTotal: number =
                Number(par9) + Number(par18) + Number(par27) + Number(par36);
            let yardageTotal: number =
                Number(yardage9Total) +
                Number(yardage18Total) +
                Number(yardage27Total) +
                Number(yardage36Total);

            let scoreHeader: any = {
                courseHoles9: courseHoles9,
                courseHoles18: courseHoles18,
                courseHoles27: courseHoles27,
                courseHoles36: courseHoles36,
                yardage9: yardage9,
                yardage18: yardage18,
                yardage27: yardage27,
                yardage36: yardage36,
                yardage9Total: yardage9Total,
                yardage18Total: yardage18Total,
                yardage27Total: yardage27Total,
                yardage36Total: yardage36Total,
                par9: par9,
                par18: par18,
                par27: par27,
                par36: par36,
                parTotal: parTotal,
                yardageTotal: yardageTotal,
            };
            ////console.log(scoreHeader);
            flightHeader.push(scoreHeader);
            return scoreHeader;
        } catch (error) {
            this.logger.log('Getting Tournament Score Data Failed', "error", error.toString());
        }
        ////console.log(this.scoreHeader);
    }

    public getHolesSets(
        tee_id: string,
        courseHoleSets: number,
        holes,
        isCourseHoleSetsInverted: boolean,
        holesSets
    ) {
        let arrayOfHoleSet: any = [];
        if (courseHoleSets == 0) {
            return;
        }
        for (let obj of holesSets) {
            if (
                obj.holeSets == courseHoleSets &&
                isCourseHoleSetsInverted == obj.inverted
            ) {
                if (obj.backId == null) {
                    let counter = 1;
                    for (let i of holes) {
                        if (obj.id == i.holeSetId) {
                            let tee_distance = i.HoleMetaQL.filter((a) => {
                                return a.tee_id == tee_id;
                            });
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counter,
                                par: i.par,
                                index: i.index,
                                teeDistances:
                                    tee_distance.length > 0
                                        ? tee_distance[0].tee_distance
                                        : 0,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counter++;
                        }
                    }
                } else {
                    let holesSetA = holesSets.find(
                        (x) => x.holeSets == obj.frontId
                    );
                    let holesSetB = holesSets.find(
                        (x) => x.holeSets == obj.backId
                    );
                    //console.log(holesSetA);
                    //console.log(holesSetB);
                    let counter = 1;
                    for (let i of holes) {
                        if (holesSetA.id == i.holeSetId) {
                            let tee_distance = i.HoleMetaQL.filter((a) => {
                                return a.tee_id == tee_id;
                            });
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counter,
                                par: i.par,
                                index: i.index,
                                teeDistances:
                                    tee_distance.length > 0
                                        ? tee_distance[0].tee_distance
                                        : 0,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counter++;
                        }
                    }
                    let counterA = 10;
                    for (let i of holes) {
                        if (holesSetB.id == i.holeSetId) {
                            let tee_distance = i.HoleMetaQL.filter((a) => {
                                return a.tee_id == tee_id;
                            });
                            let singleHole: any = {
                                id: i.id,
                                courseId: i.courseId,
                                holeNo: counterA,
                                par: i.par,
                                index: i.index,
                                teeDistances:
                                    tee_distance.length > 0
                                        ? tee_distance[0].tee_distance
                                        : 0,
                                holeSetId: i.holeSetId,
                            };
                            arrayOfHoleSet.push(singleHole);
                            counterA++;
                        }
                    }
                }
            }
        }
        return arrayOfHoleSet;
    }

    viewPlayerScore(flight: any) {
        //console.log(flight);

        let player: any[] = flight.filter((a) => a);
        //console.log(player);

        const dialogRef = this.dialog.open(DialogPlayerScoreComponent, {
            data: {
                flight: player,
            },
        });
    }

    async saveFlightScore(flightId: string) {
        //var startingHole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_-L613n4gp3nF0QiXiCt1")).value);
        ////console.log(flightId);
        try {
            this.logger.log('Tournament Group Score Save btn Clicked', "info", flightId);

            const memberToPair = new Map();
            for (const p of this.matchPlayData?.pairs) {
                memberToPair.set(p.member1Id, p);
                memberToPair.set(p.member2Id, p);
            }

            let selectedFlight: any = this.flightPlayers.find((a) => {
                return a.flightId == flightId;
            });

            //console.log(selectedFlight);

            let today: Date = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

            //let tournamentData: any = this.matchPlayData;
            //let courseQLs: any = tournamentData.CourseQL;
            //let holesQLs: any = courseQLs.HolesQL;
            let playerScores: Score[] = [];



            let courseQLs = null;
            let courseHoleQLs = null;
            if (selectedFlight.length > 0)
                courseQLs = await this.facadeService.getCourseInformation(
                    selectedFlight[0].courseId
                );

            if (courseQLs && courseQLs.course && courseQLs.course.length > 0)
                courseHoleQLs = courseQLs.course[0].HolesQL;

            let allSubTournamentMember = this.getSubTournamentPlayers();

            if (!this.showTaxes) {
                for (let player of selectedFlight) {
                    let totalPlayed = 0;
                    let playerScoresIds: string[] = [];
                    let playerScoreEqual: string[] = [];
                    let playerScoreEagle: string[] = [];
                    let playerScoreBirdy: string[] = [];
                    let playerScoreBoogey: string[] = [];
                    let playerScoreDBoogey: string[] = [];
                    let playerEmptyScoresIds: string[] = [];
                    let player1DigitIds: string[] = [];
                    let player2DigitIds: string[] = [];

                    for (let hole of courseHoleQLs) {
                        ////console.log(hole.id);
                        let holeObj = <HTMLInputElement>(
                            document.getElementById(hole.id + '&' + player.playerId)
                        );
                        if (holeObj) {
                            let grossScore = parseFloat(
                                (<HTMLInputElement>(
                                    document.getElementById(
                                        hole.id + '&' + player.playerId
                                    )
                                )).value
                            );

                            //console.log(grossScore);
                            if (grossScore) {
                                player.scoreSaved = true;
                                let playerScore: Score = {
                                    playerId: player.playerId,
                                    flightId: player.flightId,
                                    holeId: hole.id,
                                    playerHandicap: this.precisionRound(
                                        player.handicap,
                                        0
                                    ),
                                    grossScore: grossScore,
                                    updatedAt: General.parseToDate(
                                        todayDate.toDateString()
                                    ),
                                    updaterId: this.loggedInuser.id,
                                    updaterName:
                                        this.loggedInuser.firstName +
                                        ' ' +
                                        this.loggedInuser.lastName,
                                    detailId: null,
                                };
                                if (this.showPairs) {
                                    const pair = memberToPair.get(player.playerId); // find pair for this player
                                    if (pair) {
                                        // find the other member
                                        const otherPlayerId =
                                            pair.member1Id === player.playerId
                                                ? pair.member2Id
                                                : pair.member1Id;

                                        let newPlayerScore: Score = {
                                            playerId: otherPlayerId,
                                            flightId: player.flightId,
                                            holeId: hole.id,
                                            playerHandicap: this.precisionRound(
                                                player.handicap,
                                                0
                                            ),
                                            grossScore: grossScore,
                                            updatedAt: General.parseToDate(
                                                todayDate.toDateString()
                                            ),
                                            updaterId: this.loggedInuser.id,
                                            updaterName:
                                                this.loggedInuser.firstName +
                                                ' ' +
                                                this.loggedInuser.lastName,
                                            detailId: null,
                                        };
                                        playerScores.push(newPlayerScore);

                                    }
                                }


                                //console.log(playerScore);

                                playerScores.push(playerScore);

                                let subTournamentMember =
                                    allSubTournamentMember.filter(
                                        (x) => x.playerId == player.playerId
                                    );

                                if (subTournamentMember.length > 0) {
                                    for (let subScore of subTournamentMember) {
                                        let subFlightScore = Object.assign(
                                            {},
                                            playerScore
                                        );
                                        subFlightScore.flightId = subScore.flightId;
                                        //console.log(
                                        //     subFlightScore.flightId +
                                        //     ' ### ' +
                                        //     playerScore.flightId
                                        // );
                                        playerScores.push(subFlightScore);
                                    }
                                }

                                // playerScoresIds.push(
                                //     hole.id + '&' + player.playerId
                                // );
                                if (grossScore - hole.par == -2) {
                                    playerScoreEagle.push(
                                        hole.id + '&' + player.playerId
                                    );
                                }
                                if (grossScore - hole.par == -1) {
                                    playerScoreBirdy.push(
                                        hole.id + '&' + player.playerId
                                    );
                                }
                                if (grossScore - hole.par == 1) {
                                    playerScoreBoogey.push(
                                        hole.id + '&' + player.playerId
                                    );
                                }
                                if (grossScore - hole.par == 2) {
                                    playerScoreDBoogey.push(
                                        hole.id + '&' + player.playerId
                                    );
                                }
                                if (grossScore - hole.par == 0) {
                                    playerScoreEqual.push(
                                        hole.id + '&' + player.playerId
                                    );
                                }
                                playerScoresIds.push(
                                    hole.id + '&' + player.playerId
                                );

                                if (grossScore > 9)
                                    player2DigitIds.push(
                                        hole.id + '&' + player.playerId
                                    );
                                else
                                    player1DigitIds.push(
                                        hole.id + '&' + player.playerId
                                    );

                                totalPlayed++;
                            } else
                                playerEmptyScoresIds.push(
                                    hole.id + '&' + player.playerId
                                );
                        }
                    }

                    //console.log(playerScoresIds);
                    //console.log(playerEmptyScoresIds);

                    if (totalPlayed > 0) {
                        if (playerEmptyScoresIds.length > 0) {
                            for (let id of playerEmptyScoresIds) {
                                var element = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                element.classList.add('empty');
                            }
                        }
                        if (playerScoresIds.length > 0) {
                            for (let id of playerScoresIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.remove('empty');
                            }
                        }
                        if (player2DigitIds.length > 0) {
                            for (let id of player2DigitIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.add('warn');
                            }
                        }
                        if (player1DigitIds.length > 0) {
                            for (let id of player1DigitIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.remove('warn');

                            }
                        }
                        // if (playerScoreEagle.length > 0) {
                        //     for (let id of playerScoreEagle) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('eagle');
                        //     }
                        // }
                        // if (playerScoreBirdy.length > 0) {
                        //     for (let id of playerScoreBirdy) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('birdy');
                        //     }
                        // }
                        // if (playerScoreBoogey.length > 0) {
                        //     for (let id of playerScoreBoogey) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('bogey');
                        //     }
                        // }
                        // if (playerScoreDBoogey.length > 0) {
                        //     for (let id of playerScoreDBoogey) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('doublebogey');
                        //     }
                        // }
                        // if (playerScoreEqual.length > 0) {
                        //     for (let id of playerScoreEqual) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.remove('eagle');
                        //         a.classList.remove('birdy');
                        //         a.classList.remove('bogey');
                        //         a.classList.remove('doublebogey');
                        //     }
                        // }
                    }
                }
            } else {
                for (let player of selectedFlight) {
                    let totalPlayed = 0;
                    let playerScoresIds: string[] = [];
                    let playerEmptyScoresIds: string[] = [];
                    let player1DigitIds: string[] = [];
                    let player2DigitIds: string[] = [];

                    let playerScoreEqual: string[] = [];
                    let playerScoreEagle: string[] = [];
                    let playerScoreBirdy: string[] = [];
                    let playerScoreBoogey: string[] = [];
                    let playerScoreDBoogey: string[] = [];

                    for (let hole of courseHoleQLs) {
                        ////console.log(hole.id);
                        let holeObj = <HTMLInputElement>(
                            document.getElementById(hole.id + '&' + flightId)
                        );
                        if (holeObj) {
                            let grossScore = parseFloat(
                                (<HTMLInputElement>(
                                    document.getElementById(
                                        hole.id + '&' + flightId
                                    )
                                )).value
                            );

                            //console.log(grossScore);
                            if (grossScore) {
                                let playerScore: Score = {
                                    playerId: player.playerId,
                                    flightId: player.flightId,
                                    holeId: hole.id,
                                    playerHandicap: this.precisionRound(
                                        player.handicap,
                                        0
                                    ),
                                    grossScore: grossScore,
                                    updatedAt: General.parseToDate(
                                        todayDate.toDateString()
                                    ),
                                    updaterId: this.loggedInuser.id,
                                    updaterName:
                                        this.loggedInuser.firstName +
                                        ' ' +
                                        this.loggedInuser.lastName,
                                    detailId: null,
                                };
                                //console.log(playerScore);

                                playerScores.push(playerScore);

                                let subTournamentMember =
                                    allSubTournamentMember.filter(
                                        (x) => x.playerId == player.playerId
                                    );

                                if (subTournamentMember.length > 0) {
                                    for (let subScore of subTournamentMember) {
                                        let subFlightScore = Object.assign(
                                            {},
                                            playerScore
                                        );
                                        subFlightScore.flightId = subScore.flightId;
                                        //console.log(
                                        //     subFlightScore.flightId +
                                        //     ' ### ' +
                                        //     playerScore.flightId
                                        // );
                                        playerScores.push(subFlightScore);
                                    }
                                }
                                if (grossScore - hole.par == -2) {
                                    playerScoreEagle.push(
                                        hole.id + '&' + flightId
                                    );
                                }
                                if (grossScore - hole.par == -1) {
                                    playerScoreBirdy.push(
                                        hole.id + '&' + flightId
                                    );
                                }
                                if (grossScore - hole.par == 1) {
                                    playerScoreBoogey.push(
                                        hole.id + '&' + flightId
                                    );
                                }
                                if (grossScore - hole.par == 2) {
                                    playerScoreDBoogey.push(
                                        hole.id + '&' + flightId
                                    );
                                }
                                if (grossScore - hole.par == 0) {
                                    playerScoreEqual.push(
                                        hole.id + '&' + flightId
                                    );
                                }
                                playerScoresIds.push(hole.id + '&' + flightId);

                                if (grossScore > 9)
                                    player2DigitIds.push(hole.id + '&' + flightId);
                                else player1DigitIds.push(hole.id + '&' + flightId);

                                totalPlayed++;
                            } else
                                playerEmptyScoresIds.push(hole.id + '&' + flightId);
                        }
                    }
                    //console.log(playerScores);
                    //console.log(playerScoresIds);
                    //console.log(playerEmptyScoresIds);

                    if (totalPlayed > 0) {
                        if (playerEmptyScoresIds.length > 0) {
                            for (let id of playerEmptyScoresIds) {
                                var element = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                element.classList.add('empty');
                            }
                        }
                        if (playerScoresIds.length > 0) {
                            for (let id of playerScoresIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.remove('empty');
                            }
                        }
                        if (player2DigitIds.length > 0) {
                            for (let id of player2DigitIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.add('warn');
                            }
                        }
                        if (player1DigitIds.length > 0) {
                            for (let id of player1DigitIds) {
                                var a = document.getElementById(id)
                                    .parentNode as HTMLElement;
                                a.classList.remove('warn');
                            }
                        }
                        // if (playerScoreEagle.length > 0) {
                        //     for (let id of playerScoreEagle) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('eagle');
                        //     }
                        // }
                        // if (playerScoreBirdy.length > 0) {
                        //     for (let id of playerScoreBirdy) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('birdy');
                        //     }
                        // }
                        // if (playerScoreBoogey.length > 0) {
                        //     for (let id of playerScoreBoogey) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('bogey');
                        //     }
                        // }
                        // if (playerScoreDBoogey.length > 0) {
                        //     for (let id of playerScoreDBoogey) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.add('doublebogey');
                        //     }
                        // }
                        // if (playerScoreEqual.length > 0) {
                        //     for (let id of playerScoreEqual) {
                        //         var a = document.getElementById(id)
                        //             .parentNode as HTMLElement;
                        //         a.classList.remove('eagle');
                        //         a.classList.remove('birdy');
                        //         a.classList.remove('bogey');
                        //         a.classList.remove('doublebogey');
                        //     }
                        // }
                    }
                }
            }
            console.log(playerScores);
            let result = <any>(
                await this.facadeService.SaveScoresMutation(playerScores)
            );

            if (result) {
                // if (!this.showTaxes) {
                //     for (let obj of playerScores) {
                //         document.getElementById('savePlayer_' + obj.playerId).classList.add('active')
                //     }
                // }
                this.snackBar.open('Score has been submitted.', 'x', {
                    duration: 5000,
                });

                let todayString: Date = new Date();
                let timeupdated: any = await this.facadeService.setScoreUpdateTime(
                    this.tournamentID,
                    todayString.toISOString().slice(0, -5) + "Z"
                );
                this.logger.log('Tournament Score Data Saved', "info");

                if (timeupdated) return;
            }
        } catch (error) {
            this.logger.log('Saving Tournament Score Data Failed', "error", error.toString());
        }
    }

    async savePlayerScore(flightId: string, playerId: string) {
        //var startingHole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_-L613n4gp3nF0QiXiCt1")).value);
        ////console.log(this.flightPlayers);
        try {
            const combinedData = `flightId=${flightId}, playerId=${playerId}`;
            this.logger.log('Tournament Group Player Score Save btn Clicked', "info", combinedData);
            let selectedFlight: any = this.flightPlayers.find((a) => {
                return a.flightId == flightId;
            });

            console.log(selectedFlight);
            //return false;

            let today: Date = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

            //let tournamentData: any = this.matchPlayData;
            //let courseQLs: any = tournamentData.CourseQL;
            //let holesQLs: any = courseQLs.HolesQL;
            let playerScores: Score[] = [];

            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

            let courseQLs = null;
            let courseHoleQLs = null;
            if (selectedFlight.length > 0)
                courseQLs = await this.facadeService.getCourseInformation(
                    selectedFlight[0].courseId
                );

            if (courseQLs && courseQLs.course && courseQLs.course.length > 0)
                courseHoleQLs = courseQLs.course[0].HolesQL;

            let allSubTournamentMember = this.getSubTournamentPlayers();

            for (let player of selectedFlight) {
                ////console.log(player.playerId);

                if (player.playerId == playerId) {
                    for (let hole of courseHoleQLs) {
                        let holeObj = <HTMLInputElement>(
                            document.getElementById(hole.id + '&' + player.playerId)
                        );
                        //console.log(holeObj);
                        if (holeObj) {
                            let grossScore = holeObj
                                ? parseFloat(
                                    (<HTMLInputElement>(
                                        document.getElementById(
                                            hole.id + '&' + player.playerId
                                        )
                                    )).value
                                )
                                : 0;

                            if (!grossScore) {
                                var element = document.getElementById(
                                    hole.id + '&' + player.playerId
                                ).parentNode as HTMLElement;
                                element.classList.add('empty');
                            } else {
                                var element = document.getElementById(
                                    hole.id + '&' + player.playerId
                                ).parentNode as HTMLElement;
                                element.classList.remove('empty');
                            }

                            if (grossScore && grossScore > 9) {
                                var element = document.getElementById(
                                    hole.id + '&' + player.playerId
                                ).parentNode as HTMLElement;
                                element.classList.add('warn');
                            } else {
                                var element = document.getElementById(
                                    hole.id + '&' + player.playerId
                                ).parentNode as HTMLElement;
                                element.classList.remove('warn');
                            }

                            ////console.log(grossScore);
                            if (grossScore) {
                                let playerScore: Score = {
                                    playerId: player.playerId,
                                    flightId: player.flightId,
                                    holeId: hole.id,
                                    playerHandicap: this.precisionRound(
                                        player.handicap,
                                        0
                                    ),
                                    grossScore: grossScore,
                                    updatedAt: General.parseToDate(
                                        todayDate.toDateString()
                                    ),
                                    updaterId: this.loggedInuser.id,
                                    updaterName:
                                        this.loggedInuser.firstName +
                                        ' ' +
                                        this.loggedInuser.lastName,
                                    detailId: null,
                                };
                                playerScores.push(playerScore);

                                let subTournamentMember =
                                    allSubTournamentMember.filter(
                                        (x) => x.playerId == player.playerId
                                    );

                                if (subTournamentMember.length > 0) {
                                    for (let subScore of subTournamentMember) {
                                        let subFlightScore = Object.assign(
                                            {},
                                            playerScore
                                        );
                                        subFlightScore.flightId = subScore.flightId;
                                        //console.log(
                                        //     subFlightScore.flightId +
                                        //     ' ### ' +
                                        //     playerScore.flightId
                                        // );
                                        playerScores.push(subFlightScore);
                                    }
                                }
                                // if (grossScore - hole.par == -2) {
                                //     var element = document.getElementById(
                                //         hole.id + '&' + player.playerId
                                //     ).parentNode as HTMLElement;
                                //     element.classList.add('eagle');
                                // }
                                // if (grossScore - hole.par == -1) {
                                //     var element = document.getElementById(
                                //         hole.id + '&' + player.playerId
                                //     ).parentNode as HTMLElement;
                                //     element.classList.add('birdy');
                                // }
                                // if (grossScore - hole.par == 1) {
                                //     var element = document.getElementById(
                                //         hole.id + '&' + player.playerId
                                //     ).parentNode as HTMLElement;
                                //     element.classList.add('bogey');
                                // }
                                // if (grossScore - hole.par == 2) {
                                //     var element = document.getElementById(
                                //         hole.id + '&' + player.playerId
                                //     ).parentNode as HTMLElement;
                                //     element.classList.add('doublebogey');
                                // }
                                // if (grossScore - hole.par == 0) {
                                //     var a = document.getElementById(
                                //         hole.id + '&' + player.playerId
                                //     ).parentNode as HTMLElement;
                                //     a.classList.remove('eagle');
                                //     a.classList.remove('birdy');
                                //     a.classList.remove('bogey');
                                //     a.classList.remove('doublebogey');
                                // }
                            }
                        }
                    }
                }
            }
            //console.log(playerScores);
            ////console.log(playerScores.length);

            let result: any;

            if (playerScores.length > 0) {
                result = <any>(
                    await this.facadeService.SaveScoresMutation(playerScores)
                );
            }

            if (result) {
                document.getElementById('savePlayer_' + playerId).classList.add('active')
                this.snackBar.open('Score has been submitted.', 'x', {
                    duration: 5000,
                });

                let todayString: Date = new Date();
                let timeupdated: any = await this.facadeService.setScoreUpdateTime(
                    this.tournamentID,
                    todayString.toISOString().slice(0, -5) + "Z"
                );

                if (timeupdated) return;
            }
        } catch (error) {
            this.logger.log('Saving Tournament Score Data Failed', "error", error.toString());
        }
    }

    copyRoundScore(round) {

        this.facadeService.getTournamentsListByCourse(this.matchPlayData.courseId).then((res) => {
            let rows = [];
            let count = 0;
            console.log(res);
            for (let item of res?.tournament) {
                let obj = {
                    id: item.id,
                    count: ++count,
                    name: item.title,
                    date: item.createdAt?.substring(0, 10),
                    startDate: item.startDate?.substring(0, 10),
                    endDate: item.endDate?.substring(0, 10),
                    rounds: item.noOfRounds,
                    flights: '-',
                    matchFormat: item.matchFormat,
                    owner: '-',
                };
                rows.push(obj)
            }
            const dialogRef = this.dialog.open(DialogTournamentComponent, {
                data: { tournaments: rows },
            });
            dialogRef.afterClosed().subscribe(async (resp) => {
                console.log(resp);

                if (resp) {
                    let selectedTournament = res.tournament.find(a => a.id == resp[0].id);
                    console.log(selectedTournament);
                    let roundFlights = [];
                    for (let flight of selectedTournament.flights) {
                        if (
                            round == flight.flightRound
                        ) {
                            roundFlights.push(flight);
                            //subTournamentsFlightMembers.push(playerIds);
                        }
                    }

                    let playerScores: Score[] = [];
                    let today: Date = new Date();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                    var yyyy = today.getFullYear();

                    let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

                    for (let flight of this.flightPlayers) {
                        for (let fligh of flight) {
                            let flightId = fligh.flightId;
                            if (fligh && typeof fligh === "object" && fligh.flightId) {
                                let getPlayerScore = this.getCopyScore(fligh.playerId, roundFlights);
                                console.log(getPlayerScore);
                                if (getPlayerScore && getPlayerScore.length > 0) {
                                    getPlayerScore.forEach((score, index) => {
                                        let playerScore: Score = {
                                            playerId: fligh.playerId,
                                            flightId: fligh.flightId,
                                            holeId: score.holeId, // Assuming holeId is index-based (adjust if needed)
                                            playerHandicap: this.precisionRound(fligh.handicap, 0),
                                            grossScore: score.grossScore, // Assign the actual score
                                            updatedAt: General.parseToDate(todayDate.toDateString()),
                                            updaterId: this.loggedInuser.id,
                                            updaterName: `${this.loggedInuser.firstName} ${this.loggedInuser.lastName}`,
                                            detailId: null,
                                        };
                                        playerScores.push(playerScore);
                                    });
                                }
                            }
                        }

                    }

                    let result: any;

                    if (playerScores.length > 0) {
                        result = <any>(
                            await this.facadeService.SaveScoresMutation(playerScores)
                        );
                    }

                    if (result) {
                        this.snackBar.open('Score has been copied.', 'x', {
                            duration: 5000,
                        });
                    }
                }
            })
        })
    }

    getCopyScore(playerId, flights) {
        console.log("Searching for player ID:", playerId);
        console.log("Flights Data:", flights);

        // Find the flight that contains the playerId
        const foundFlight = flights.find(flight =>
            flight.members.some(member => member.playerId === playerId)
        );

        if (!foundFlight) {
            console.log(`Player ${playerId} not found in any flight.`);
            return null; // or return empty scores []
        }

        // Find the specific member and return their scores
        const playerData = foundFlight.members.find(member => member.playerId === playerId);

        console.log(`Scores for player ${playerId}:`, playerData.scores);
        return playerData.scores;
    }

    keytab(e) {
        var code = e.keyCode || e.which;

        if (code === 13) {
            e.preventDefault();
            let control: HTMLInputElement = <HTMLInputElement>e.srcElement;

            while (control) {
                let nextControl = <HTMLInputElement>control.nextElementSibling;

                if (nextControl) {
                    control = nextControl;

                    while (nextControl) {
                        control = nextControl;

                        nextControl = <HTMLInputElement>(
                            nextControl.firstElementChild
                        );

                        if (
                            nextControl &&
                            nextControl.type == 'text' &&
                            !nextControl.disabled
                        )
                            break;
                    }

                    if (nextControl) {
                        control = nextControl;
                        break;
                    }
                } else {
                    control = <HTMLInputElement>control.parentElement;
                }
            }

            if (control && control.focus) {
                control.focus();
            }
        }
    }
    getSubTournamentPlayers() {
        let subTournamentsFlightMembers: any = [];
        if (this.subTournaments.length > 0) {
            let currentflightRound: number = this.flightRound;
            for (let subTournamentsQL of this.subTournaments) {
                let subTournamentFlightsQLs =
                    subTournamentsQL.SubTournamentQL.SubTournamentFlightsQL;
                for (let subTournamentFlightsQL of subTournamentFlightsQLs) {
                    if (
                        currentflightRound == subTournamentFlightsQL.flightRound
                    ) {
                        var flightId: string = subTournamentFlightsQL.id;
                        var playerIds: string[] = [];
                        var subTournamentMembersQLs =
                            subTournamentFlightsQL.SubTournamentMembersQL;
                        for (let subTournamentMembersQL of subTournamentMembersQLs) {
                            var playerId = subTournamentMembersQL.playerId;
                            //console.log(playerId);
                            let flightPlayer: any = {
                                flightId: flightId,
                                playerId: playerId,
                            };
                            //playerIds.push(flightPlayer);
                            subTournamentsFlightMembers.push(flightPlayer);
                        }
                        //subTournamentsFlightMembers.push(playerIds);
                    }
                }
            }
        }

        return subTournamentsFlightMembers;
    }

    onGross9Change(grossValue: string, playerId: string, header: any): void {
        let total9: number = 0;

        for (let hole of header.courseHoles9) {
            if (
                <HTMLInputElement>(
                    document.getElementById(hole.id + '&' + playerId)
                )
            )
                total9 +=
                    (<HTMLInputElement>(
                        document.getElementById(hole.id + '&' + playerId)
                    )).value != ''
                        ? parseFloat(
                            (<HTMLInputElement>(
                                document.getElementById(
                                    hole.id + '&' + playerId
                                )
                            )).value
                        )
                        : 0;
        }

        // var hole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_1_" + playerId)).value);
        // var hole2 = parseFloat((<HTMLInputElement>document.getElementById("hole_2_" + playerId)).value);
        // var hole3 = parseFloat((<HTMLInputElement>document.getElementById("hole_3_" + playerId)).value);
        // var hole4 = parseFloat((<HTMLInputElement>document.getElementById("hole_4_" + playerId)).value);
        // var hole5 = parseFloat((<HTMLInputElement>document.getElementById("hole_5_" + playerId)).value);
        // var hole6 = parseFloat((<HTMLInputElement>document.getElementById("hole_6_" + playerId)).value);
        // var hole7 = parseFloat((<HTMLInputElement>document.getElementById("hole_7_" + playerId)).value);
        // var hole8 = parseFloat((<HTMLInputElement>document.getElementById("hole_8_" + playerId)).value);
        // var hole9 = parseFloat((<HTMLInputElement>document.getElementById("hole_9_" + playerId)).value);
        var gross9total = <HTMLInputElement>(
            document.getElementById('gross9total_' + playerId)
        );
        var gross18total = <HTMLInputElement>(
            document.getElementById('gross18total_' + playerId)
        );
        var grosstotal = <HTMLInputElement>(
            document.getElementById('grosstotal_' + playerId)
        );

        //let total9 = ((Number(hole1))? Number(hole1) : 0) + ((Number(hole2))? Number(hole2) : 0) + ((Number(hole3))? Number(hole3) : 0) + ((Number(hole4))? Number(hole4) : 0) + ((Number(hole5))? Number(hole5) : 0) + ((Number(hole6))? Number(hole6) : 0) + ((Number(hole7))? Number(hole7) : 0) + ((Number(hole8))? Number(hole8) : 0) + ((Number(hole9))? Number(hole9) : 0);
        gross9total.value = total9.toString();

        let total: number =
            (Number(gross9total.value) ? Number(gross9total.value) : 0) +
            (Number(gross18total.value) ? Number(gross18total.value) : 0);
        grosstotal.value = total.toString();
        //console.log(total);
    }

    Comparator(a, b) {
        if (a['holeNo'] < b['holeNo']) return -1;
        if (a['holeNo'] > b['holeNo']) return 1;
        return 0;
    }
    //Collections.sort(holes, (hole1, hole2) -> hole1.getIndex() - hole2.getIndex());
    ComparatorHoles(hole1, hole2) {
        return hole1.index - hole2.index;
    }

    onGross18Change(grossValue: string, playerId: string, header: any): void {
        let total18: number = 0;

        for (let hole of header.courseHoles18) {
            if (
                <HTMLInputElement>(
                    document.getElementById(hole.id + '&' + playerId)
                )
            )
                total18 +=
                    (<HTMLInputElement>(
                        document.getElementById(hole.id + '&' + playerId)
                    )).value != ''
                        ? parseFloat(
                            (<HTMLInputElement>(
                                document.getElementById(
                                    hole.id + '&' + playerId
                                )
                            )).value
                        )
                        : 0;
        }
        // var hole1 = parseFloat((<HTMLInputElement>document.getElementById("hole_10_" + playerId)).value);
        // var hole2 = parseFloat((<HTMLInputElement>document.getElementById("hole_11_" + playerId)).value);
        // var hole3 = parseFloat((<HTMLInputElement>document.getElementById("hole_12_" + playerId)).value);
        // var hole4 = parseFloat((<HTMLInputElement>document.getElementById("hole_13_" + playerId)).value);
        // var hole5 = parseFloat((<HTMLInputElement>document.getElementById("hole_14_" + playerId)).value);
        // var hole6 = parseFloat((<HTMLInputElement>document.getElementById("hole_15_" + playerId)).value);
        // var hole7 = parseFloat((<HTMLInputElement>document.getElementById("hole_16_" + playerId)).value);
        // var hole8 = parseFloat((<HTMLInputElement>document.getElementById("hole_17_" + playerId)).value);
        // var hole9 = parseFloat((<HTMLInputElement>document.getElementById("hole_18_" + playerId)).value);
        var gross9total = <HTMLInputElement>(
            document.getElementById('gross9total_' + playerId)
        );
        var gross18total = <HTMLInputElement>(
            document.getElementById('gross18total_' + playerId)
        );
        var grosstotal = <HTMLInputElement>(
            document.getElementById('grosstotal_' + playerId)
        );

        //let total18 = ((Number(hole1))? Number(hole1) : 0) + ((Number(hole2))? Number(hole2) : 0) + ((Number(hole3))? Number(hole3) : 0) + ((Number(hole4))? Number(hole4) : 0) + ((Number(hole5))? Number(hole5) : 0) + ((Number(hole6))? Number(hole6) : 0) + ((Number(hole7))? Number(hole7) : 0) + ((Number(hole8))? Number(hole8) : 0) + ((Number(hole9))? Number(hole9) : 0);
        gross18total.value = total18.toString();

        let total: number =
            (Number(gross9total.value) ? Number(gross9total.value) : 0) +
            (Number(gross18total.value) ? Number(gross18total.value) : 0);
        grosstotal.value = total.toString();
    }

    numberOnly(event): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    redirectToScores() {
        this.router.navigate(['/matchplay/' + this.tournamentID]);
    }

    redirectToflightManagement() {
        this.router.navigate(['/tournaments/manage/' + this.tournamentID]);
    }
    redirectToDetail() {
        this.router.navigate(['/tournaments/view/' + this.tournamentID]);
    }

    redirectToAttendance() {
        this.router.navigate(['/tournaments/attendance/' + this.tournamentID]);
    }

    redirectToLeaderboard() {
        //this.router.navigate(['/leaderboard/' + this.tournamentID]);

        let url = this.router.createUrlTree([
            '/leaderboard',
            this.matchPlayData['prefix'],
        ]);
        window.open(url.toString(), '_blank');
    }

    precisionRound(number: number, precision: number) {
        if (precision < 0) {
            let factor = Math.pow(10, precision);
            return Math.round(number * factor) / factor;
        } else
            return +(
                Math.round(Number(number + 'e+' + precision)) +
                'e-' +
                precision
            );
    }

    public hasHoleSet1to9(courseHoleSets): boolean {
        //console.log(Constants.Holes1to9);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes1to9) != 0
        );
    }

    public hasHoleSet10to18(courseHoleSets): boolean {
        //console.log(Constants.Holes10to18);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes10to18) != 0
        );
    }

    public hasHoleSet19to27(courseHoleSets): boolean {
        //console.log(Constants.Holes19to27);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes19to27) != 0
        );
    }

    public hasHoleSet28to36(courseHoleSets): boolean {
        //console.log(Constants.Holes28to36);
        return (
            courseHoleSets > 0 && (courseHoleSets & Constants.Holes28to36) != 0
        );
    }
}
