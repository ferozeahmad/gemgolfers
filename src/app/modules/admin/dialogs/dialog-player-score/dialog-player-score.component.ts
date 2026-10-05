import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FacadeService } from '../../../../shared/services/facade.service';
import { Hole } from '../../../../shared/models/hole.model';
import { Constants } from '../../../../shared/classes/general';
import { of } from 'rxjs';
import { Player } from 'app/shared/models/player.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LogsService } from 'app/shared/services/logs.service';
@Component({
    standalone: false,
    selector: 'app-dialog-player-score',
    templateUrl: './dialog-player-score.component.html',
    styleUrls: ['./dialog-player-score.component.scss'],
})
export class DialogPlayerScoreComponent implements OnInit {
    public response: any;
    players: any[] = [];
    scoreHeader: any[] = [];
    courseData: any[] = [];
    isLoading: boolean = false;
    isTaxes: boolean = false;
    allScores: any[] = [];
    courseHoleSet = 0;
    loggedInuser: Player;
    courseHoleSetNames;
    playerName: string;
    isTaxesScoreBor: boolean = false;
    constructor(
        public dialogRef: MatDialogRef<DialogPlayerScoreComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private facadeService: FacadeService, private _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    async ngOnInit() {
        this.logger.log('Player Score Dialog Opened', "info", { course: this.data?.course, type: this.data?.type, round: this.data?.round });
        //  //console.log(this.data.course);
        //console.log(this.data);
        if (this.data.players && this.data.players.length > 0) {
            this.isTaxes = true;
        }
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        // let club:any = this.loggedInuser.membership[0].club;
        // let courseID =
        // club.courses.length > 0 ? club.courses[0].id : "-LUFS3FCQKOGpJ2IEHmf";
        let courseID = this.data['course'];
        let selectedCourseHoleSet =
            await this.facadeService.getCourseHoleSetsForCourse(courseID);
        this.courseHoleSetNames = selectedCourseHoleSet['course_hole_sets'];
        //console.log(this.courseHoleSetNames);
        //  //console.log(this.data.allNet);
        //  //console.log(this.data.round);
        if (this.data.flight) {
            this.showName(this.data.flight);
            this.isTaxesScoreBor = true;
            this.isLoading = true;
        }
        this.isLoading = true;
        if (this.data.course) {
            let dataLeaderboard = await this.facadeService.getCourseInformation(
                this.data.course
            );
            this.isLoading = false;
            this.logger.log('Getting Course Information in Player Score Dialog Successful', "info", this.data?.course);
            if (dataLeaderboard.course.length <= 0) return;
            //console.log(this.data.allGross);
            this.courseData = dataLeaderboard.course[0];
            this.isLoading = false;
            this.courseHoleSet = this.data.holeSets;

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

            let courseQLs: any = this.courseData;
            let holesQLs: any = courseQLs.HolesQL;
            //console.log(courseQLs);
            holesQLs = holesQLs.sort(this.Comparator);
            //console.log(holesQLs);
            if (this.data.holeSets == 0) {
                this.data.holeSets = 3;
            }
            // this.removeExtraHoleSets(
            //   this.data.holeSets,
            //   holesQLs,
            //   this.data.courseHoleSetsInverted
            // );
            holesQLs = this.getHolesSets(
                this.data.tee_id,
                this.data.holeSets,
                holesQLs,
                this.data.courseHoleSetsInverted,
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

            this.scoreHeader.push(scoreHeader);
            // //console.log(this.scoreHeader);
            // //console.log(this.scoreHeader[0].courseHoles9[0]['par']);
            if (this.data.type == 'Gross') {
                this.grossScoreCard(scoreHeader);
            } else {
                this.netScoreCard(scoreHeader);
            }
        }
    }
    showName(flight: any) {
        this.players = [];
        for (let member of flight) {
            let obj = {
                firstName: member.name,
            };
            this.players.push(obj);
        }
    }

    public removeExtraHoleSets(
        courseHoleSets: number,
        holes,
        isCourseHoleSetsInverted: boolean
    ) {
        if (courseHoleSets == 0) {
            return;
        }
        let holes1to9: boolean = this.hasHoleSet1to9(courseHoleSets);
        let holes10to18: boolean = this.hasHoleSet10to18(courseHoleSets);
        let holes19to27: boolean = this.hasHoleSet19to27(courseHoleSets);
        let holes28to36: boolean = this.hasHoleSet28to36(courseHoleSets);
        // //console.log(holes1to9);
        // //console.log(holes10to18);
        // //console.log(holes19to27);
        // //console.log(holes28to36);
        for (let i = 0; i < holes.length; i++) {
            //int holeNo = holes.get(i).getHoleNo();
            let holeNo: number = holes[i].holeNo;
            ////console.log("holeNo: " + holeNo);
            if (holeNo >= 1 && holeNo <= 9) {
                if (!holes1to9) {
                    holes.splice(i, 1); //holes.remove(i);
                    i--;
                }
            } else if (holeNo >= 10 && holeNo <= 18) {
                if (!holes10to18) {
                    holes.splice(i, 1);
                    i--;
                } else if (!holes1to9) {
                    //holes.get(i).setHoleNo(holeNo - 9);
                    holes[i].holeNo = holeNo - 9;
                }
            } else if (holeNo >= 19 && holeNo <= 27) {
                if (!holes19to27) {
                    holes.splice(i, 1);
                    i--;
                } else {
                    let setsToRemove: number =
                        (holes1to9 ? 0 : 1) + (holes10to18 ? 0 : 1);
                    if (setsToRemove > 0) {
                        //holes.get(i).setHoleNo(holeNo - 9 * setsToRemove);
                        holes[i].holeNo = holeNo - 9 * setsToRemove;
                    }
                }
            } else if (holeNo >= 28 && holeNo <= 36) {
                if (!holes28to36) {
                    holes.splice(i, 1);
                    i--;
                } else {
                    let setsToRemove: number =
                        (holes1to9 ? 0 : 1) +
                        (holes10to18 ? 0 : 1) +
                        (holes19to27 ? 0 : 1);
                    if (setsToRemove > 0) {
                        //holes.get(i).setHoleNo(holeNo - 9 * setsToRemove);
                        holes[i].holeNo = holeNo - 9 * setsToRemove;
                    }
                }
            }
        }
        ////console.log(holes);
        let holesCount = holes.length;
        if (holesCount == 9) {
            //Collections.sort(holes, (hole1, hole2) -> hole1.getIndex() - hole2.getIndex());
            holes = holes.sort(this.ComparatorHoles);
            for (let i: number = 0; i < holesCount; i++) {
                holes[i].index = i + 1;
            }
            holes.sort(this.Comparator);
        } else if (holesCount == 18 && isCourseHoleSetsInverted) {
            let holesToMove: number = 9;
            while (holesToMove > 0) {
                //holes.add(0, holes.remove(holesCount - 1));
                let removedHole = holes.splice(holesCount - 1, 1);
                holes.unshift(removedHole[0]);
                holesToMove -= 1;
            }

            for (let h of holes) {
                if (h.holeNo < 10) h.holeNo = h.holeNo + 9;
                else h.holeNo = h.holeNo - 9;
            }
        }
        ////console.log(holes);
    }

    grossScoreCard(scoreHeader) {
        this.players=[];
        for (let score of this.data.allGross) {
            //console.log(score);

            let playerHole9Score: any = [];
            let playerHole18Score: any[] = [];
            let playerHole27Score: any[] = [];
            let playerHole36Score: any[] = [];
            let gross9Total = 0;
            let gross18Total = 0;
            let gross27Total = 0;
            let gross36Total = 0;

            //if(this.courseHoleSet == 0 || this.courseHoleSet == 3 || this.courseHoleSet == 9) {
            if (scoreHeader.courseHoles9.length > 0) {
                for (let i = 0; i < 9; i++) {
                    playerHole9Score[i] = score.holeScores[i];
                    gross9Total += playerHole9Score[i];
                }

            }
            //}

            //if(this.courseHoleSet == 3 || this.courseHoleSet == 0) {
            if (scoreHeader.courseHoles18.length > 0) {
                for (let i = 9; i < 18; i++) {
                    playerHole18Score[i - 9] = score.holeScores[i];
                    gross18Total += playerHole18Score[i - 9];
                }
            }
            //}
            

            // if(this.courseHoleSet == 12) {
            //   for(let i=18; i<27; i++) {
            //     playerHole27Score[i - 18] = score.holeScores[i];
            //     gross27Total += playerHole27Score[i - 18];
            //   }
            // }

            // if(this.courseHoleSet == 9 || this.courseHoleSet == 12) {
            //   for(let i=27; i<36; i++) {
            //     playerHole36Score[i - 27] = score.holeScores[i];
            //     gross36Total += playerHole36Score[i - 27];
            //   }
            // }

            this.playerName =
                this.data.team && score.teamName ? score.teamName : score.name;

            let IsRemovedFromScoring =
                this.data.removed.length > 0
                    ? this.data.removed.filter((a) => {
                        return a.playerId == score.playerId;
                    })
                    : [];

            //console.log(gross27Total);
            ////console.log(this.data.removed);
            //(IsRemovedFromScoring)? //console.log("not"): //console.log("yes");

            let grossTotal: number =
                gross9Total + gross18Total + gross27Total + gross36Total;
            let LeaderGross: any = {
                playerId: score.playerId,
                name: score.name,
                Hole9Scores: playerHole9Score,
                Hole18Scores: playerHole18Score,
                Hole27Scores: playerHole27Score,
                Hole36Scores: playerHole36Score,
                hole9Total: gross9Total,
                hole18Total: gross18Total,
                hole27Total: gross27Total,
                hole36Total: gross36Total,
                holesTotal: grossTotal,
                scoring: IsRemovedFromScoring.length > 0 ? false : true,
            };

            this.allScores.push(LeaderGross);
            //console.log(this.allScores);
        }

        if (this.data.players) {
            if (this.data.players.length > 0) {
                for (let player of this.data.players) {
                    let obj = {
                        firstName: player['PlayerQL'].firstName,
                        lastName: player['PlayerQL'].lastName,
                        handicap: player['ScoresQL'][0].playerHandicap
                            ? player['ScoresQL'][0].playerHandicap
                            : 0,
                    };
                    this.players.push(obj);
                }
            }
        }
    }

    netScoreCard(scoreHeader) {
        this.players=[];
        for (let score of this.data.allNet) {
            let playerHole9Score: any = [];
            let playerHole18Score: any[] = [];
            let playerHole27Score: any[] = [];
            let playerHole36Score: any[] = [];
            let net9Total = 0;
            let net18Total = 0;
            let net27Total = 0;
            let net36Total = 0;

            if (this.data.allNet.length > 0) {

                if (scoreHeader.courseHoles9.length > 0) {
                    for (let i = 0; i < 9; i++) {
                        playerHole9Score[i] = score.holeScores[i];
                        net9Total += playerHole9Score[i];
                    }
                }

                if (scoreHeader.courseHoles18.length > 0) {
                    for (let i = 9; i < 18; i++) {
                        playerHole18Score[i - 9] = score.holeScores[i];
                        net18Total += playerHole18Score[i - 9];
                    }
                }

                // if (this.courseData['noOfHoles'] > 18) {
                //     for (let i = 18; i < 27; i++) {
                //         playerHole27Score[i - 18] = score.holeScores[i];
                //         net27Total += playerHole27Score[i - 18];
                //     }
                // }

                // if (this.courseData['noOfHoles'] > 27) {
                //     for (let i = 27; i < 36; i++) {
                //         playerHole36Score[i - 27] = score.holeScores[i];
                //         net36Total += playerHole36Score[i - 27];
                //     }
                // }
                //this.playerName = score.name;
                this.playerName =
                    this.data.team && score.teamName
                        ? score.teamName
                        : score.name;
            }

            let netTotal: number =
                net9Total + net18Total + net27Total + net36Total;

            let LeaderNet: any = {
                playerId: score.playerId,
                name: score.name,
                Hole9Scores: playerHole9Score,
                Hole18Scores: playerHole18Score,
                Hole27Scores: playerHole27Score,
                Hole36Scores: playerHole36Score,
                hole9Total: net9Total,
                hole18Total: net18Total,
                hole27Total: net27Total,
                hole36Total: net36Total,
                holesTotal: netTotal,
            };

            this.allScores.push(LeaderNet);
        }
        if (this.data.players) {
            if (this.data.players.length > 0) {
                for (let player of this.data.players) {
                    let obj = {
                        firstName: player['PlayerQL'].firstName,
                        lastName: player['PlayerQL'].lastName,
                        handicap: player['ScoresQL'][0].playerHandicap
                            ? player['ScoresQL'][0].playerHandicap
                            : 0,
                    };
                    this.players.push(obj);
                }
            }
        }
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
                                        : '0',
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
                                        : '0',
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
                                        : '0',
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

    Comparator(a, b) {
        if (a['holeNo'] < b['holeNo']) return -1;
        if (a['holeNo'] > b['holeNo']) return 1;
        return 0;
    }

    ComparatorHoles(hole1, hole2) {
        return hole1.index - hole2.index;
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
    public downloadAsPDF() {
        this.logger.log('Admin Click on Download PDF in Player Score Dialog', "info", { type: this.data?.type });
        var doc = new jsPDF()

        doc.setFontSize(18);
        doc.text("Score Details", 15, 15);

        doc.setTextColor(100);

        // From HTML
        (doc as any).autoTable({
            html: '#pdfTable',
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: [1, 1] },
            useCss: false,
        });

        // Open PDF document in new tab
        doc.output('dataurlnewwindow');

        // Download PDF document  
        //doc.save('flights.pdf');
    }
}
