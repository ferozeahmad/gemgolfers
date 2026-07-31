import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
} from '@angular/core';
import * as XLSX from 'xlsx';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import {
    Player,
    ClubMembership,
    PlayerWHSHanidcap,
    PlayerCategory,
    UserSessionModel,
} from '../../../../shared/models/player.model';
import { FacadeService } from '../../../../shared/services/facade.service';

import {
    UniqueIdGenerator,
    generateGemId,
    Constants,
    General,
} from '../../../../shared/classes/general';
import { of, Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { filter } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { DialogTeeComponent } from '../../dialogs/dialog-tee-change/dialog-tee.component';
import { DialoghandicapFreezeComponent } from '../../dialogs/dialog-handicap-freeze/dialog-handiicap-freeze.component';
import { HandicapService } from 'app/shared/services/handicap.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
@Component({
    standalone: false,
    selector: 'app-handicaps',
    templateUrl: './handicaps.component.html',
})
export class HandicapsComponent implements OnInit {

    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    drawerMode: 'side' | 'over';
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    itemForm: UntypedFormGroup;
    WHSSource: MatTableDataSource<any>;
    WHSColumns = [
        'id',
        'name',
        'email',
        'membershipNumber',
        'category',
        'handicapWhsIndex',
        'handicapFreeze',
        'details',
    ];
    playerCategories: PlayerCategory[] = [];
    count: any = 0;
    showTable: Promise<any>;
    clubItems: Promise<Player[]>;
    public player: any[] = [];
    noItemsInList = false;
    Players: Player[] = [];
    myPlayer: Player;
    isLoading: Boolean = true;
    public response: any;
    loggedInuser: UserSessionModel;
    filterCategory: string;
    playerWHS: PlayerWHSHanidcap;
    playerWHSHistory: any;
    HandicapIndex: any[] = [];
    clubMemberAggregate: Array<any> = [];
    totalMembers: number = 0;
    superAdminstats: Array<any> = [];
    MembersCat: string;
    file: File;
    currentDate: Date;
    arrayBuffer: any;
    playersData: any;
    savePlayers: Player[] = [];
    duplicatePlayers: any[] = [];
    selectedRowIndex: string;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    playerWHSRound: any;
    dataPlayers: any;
    index: any = 0;
    aggregate = 0;
    pageSize: any = 20;
    tabindex: any = 0;
    sorting: any;
    constructor(
        private location: Router,
        private _router: ActivatedRoute,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _facadeService: FacadeService,
        private datepipe: DatePipe,
        private _handicapService: HandicapService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef, private logger: LogsService,
        private _activatedRoute: ActivatedRoute, private _localStorage: LocalStorageService
    ) { }

    ngAfterViewInit(): void {
        //this.dataSource.sort = this.sort;
    }

    async ngOnInit() {
        //this.fecthData();
        try {

            this.logger.log('Admin Come to WHS Handicap Page', "info");
            this.currentDate = new Date();
            this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
            this.Players = [];
            this.itemForm = this._formBuilder.group({
                cat: ['', Validators.required],
                lowerHandicap: [''],
                higherHandicap: [''],
            });
            this._router.paramMap.subscribe((params) => {
                this.filterCategory = params.get('category');
            });
            //console.log(this.filterCategory);

            this.MembersCat = this.filterCategory;
            if (this.loggedInuser) {

                let courseID = this.loggedInuser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
                let courseRating: any = {
                    courseId: courseID,
                    courseHoleSets: 3,
                };
                this.playerWHSRound = await this._facadeService.getPlayerWHSRound(
                    courseRating
                );
            }
            this.playerCategories = this._facadeService.getPlayerCategoriesKGC();
            this.logger.log('Getting WHS Handicap Data', "info");
            if (this._localStorage.isClubAdmin()) {
                if (this.filterCategory)
                    this.dataPlayers =
                        await this._facadeService.getPlayersListByClubAndCategory(
                            this.loggedInuser.adminClubId,
                            General.capitalizeFirstLetter(this.filterCategory)
                        );
                else {
                    this.dataPlayers =
                        await this._facadeService.getPlayersListByClubOnlyWHS(
                            this.loggedInuser.adminClubId
                        );
                    // this.aggregate =
                    //     this.dataPlayers.AggregateQL['aggregate'].totalCount;
                    //console.log(this.aggregate);
                    this.syncHandicapWHS();

                    // this.WHSSource = new MatTableDataSource(this.HandicapIndex);
                    // //console.log(this.WHSSource);
                    // this.WHSSource.sort = this.sort;
                    // setTimeout(() => (this.WHSSource.paginator = this.paginator), 1000);
                }
            } else {
                if (this.filterCategory)
                    this.dataPlayers =
                        await this._facadeService.getPlayerByCategory(
                            General.capitalizeFirstLetter(this.filterCategory)
                        );
                else {
                    this.dataPlayers = await this._facadeService.getPlayersList();
                    //console.log(this.dataPlayers);

                    // this.aggregate =
                    //     this.dataPlayers.AggregateQL['aggregate'].totalCount;
                    //console.log(this.aggregate);
                    this.syncHandicapWHS();
                }
            }
            this.showTable = Promise.resolve(true);
            // Subscribe to MatDrawer opened change
            this.matDrawer.openedChange.subscribe((opened) => {
                if (!opened) {
                    // Remove the selected contact when drawer closed
                    //this.selectedContact = null;
                    //console.log(opened);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });

            this._fuseMediaWatcherService.onMediaChange$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(({ matchingAliases }) => {
                    // Set the drawerMode if the given breakpoint is active
                    if (matchingAliases.includes('lg')) {
                        this.drawerMode = 'side';
                    } else {
                        this.drawerMode = 'over';
                    }

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        } catch (error) {
            this.logger.log('Getting All WHS Handicap Data Failed', "error", error.toString());

        }
        //this.facadeService.findOne("-LeGr4seWAKipHNVKh_2").subscribe(result => this.myPlayer = result);
    }

    freezeHandicap(row: any): void {
        this.logger.log('Freeze Player Handicap WHS Button Click', "info", row);
        // Implement freeze logic here
        const dialogRef = this.dialog.open(DialoghandicapFreezeComponent, {
            data: {
                player: row,
            }
        }).afterClosed().subscribe(async (result) => {
            if (result) {
                // Handle the result from the dialog
            }
        });
    }

    async unFreezeHandicap(row: any) {
        this.logger.log('Unfreeze Player Handicap WHS Button Click', "info", row);
        const confirmation = this._fuseConfirmationService.open({
            title: 'Unfreeze Player Handicap',
            message: 'Are you sure you want to unfreeze this player\'s handicap?',
            actions: {
                confirm: {
                    label: 'Confirm',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe(async (result) => {
            this.logger.log('Dialog for unfreeze handicap whs closed', "info", result);
            if (result != 'confirmed') return;
            let startDate = new Date().toLocaleDateString('en-CA');
            let response = await this._facadeService.unFreezePlayerHandicap(row.id, startDate);
            if (response) {
                let obj = {
                    playerId: row.id,
                    count: 1,
                }
                this._handicapService.calculateHandicapWHS(obj).then((response) => {

                    this.WHSSource.data = this.WHSSource.data.map(player => {
                        if (player.id === row.id) {
                            player.handicapIndexFreezeTill = null;
                        }
                        return player;
                    });
                    this.WHSSource._updateChangeSubscription();
                    this.snackBar.open('Handicap Unfreeze successfully!.', 'x', { duration: 2000 });
                }).catch((error) => {
                    this.logger.log('Error Unfreezing Handicap WHS', "error", error);
                });
            }
        });
    }


    onBackdropClicked(): void {
        // Go back to the list
        this.location.navigate(['./'], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
    updatePlayer(id: string): void {
        this.logger.log('View Player Handicap WHS Button Click', "info", id);

        this.location.navigate(['./', id], {
            relativeTo: this._activatedRoute,
        });
        // });
        // Go to the new contact

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    // onPageFired(event) {
    //     this.index = event.pageIndex * event.pageSize;
    //     this.pageSize = event.pageSize;
    //     //console.log(this.index);

    //     // this.syncHandicapCongu();
    //     this.index = event.pageIndex * event.pageSize;
    //     this.syncHandicapWHS();

    //     //console.log(event);
    // }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    syncHandicapWHS() {
        //console.log(this.index);

        this.WHSSource = new MatTableDataSource(this.dataPlayers.player);
        this.WHSSource.paginator = this.paginator;
        this.WHSSource.sort = this.sort;
        this.isLoading = false;
        this.player = [];
    }
    public onSortChanged(e) {
        if (e.active == 'handicap') {
            this.sorting = e.direction;
        }
    }
    applyFilters() {
        this.syncHandicapWHS();
        const filters = this.itemForm.getRawValue(); // Assuming itemForm contains the filter form
        let { lowerHandicap, higherHandicap, cat } = filters; // Extracting filter values

        // Apply filter on WHSSource data
        const filteredData = this.WHSSource.data.map((player: any) => {
            // Calculate handicap index
            let handicapIndex =
                player.handicapWhsIndex != null
                    ? player.handicapWhsIndex
                    : player.handicap;
            // if (player.id === '-MPn9llt470he1qOULgW') {
            //     console.log(player);

            // }
            // Calculate ratings and determine teeHandicap
            let ratings = this.getTeesRating(handicapIndex);
            let teeHandicap = 0;
            if (cat === 'Amateurs') {
                teeHandicap = ratings['BLUE'];
            } else if (cat === 'Senior') {
                teeHandicap = ratings['WHITE'];
            } else if (cat === 'Veterans') {
                teeHandicap = ratings['Black-Veterans'];
            } else if (cat === 'Ladies' || cat.includes('Junior')) {
                teeHandicap = ratings['RED'];
            }

            // Add the new property to the player object
            return {
                ...player,
                teeHandicap,
            };
        }).filter((player: any) => {

            if (cat == 'Amateurs') {
                const isHandicapInRange =
                    (!lowerHandicap || player.teeHandicap >= lowerHandicap) &&
                    (!higherHandicap || player.teeHandicap <= higherHandicap);
                const isCategoryMatch = !cat || (player?.playerCategory && player.playerCategory == cat);
                return isHandicapInRange && isCategoryMatch;
            } else {
                const isHandicapInRange =
                    (!lowerHandicap || player.teeHandicap >= lowerHandicap) &&
                    (!higherHandicap || player.teeHandicap <= higherHandicap);
                const isCategoryMatch = !cat || (player?.playerCategory && player.playerCategory.includes(cat));
                return isHandicapInRange && isCategoryMatch;
            }

        });

        // Update the MatTableDataSource
        this.WHSSource.data = filteredData;

        console.log('Filtered Data with Tee Handicap:', this.WHSSource.data);
    }



    exportToExcel(): void {

        const data = this.WHSSource.data.map((item) => {
            // Create a new object without the 'Details' column
            const { id, Status, Sr, view, Edit, Delete, ...filteredItem } = item;
            return filteredItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Export the Excel file
        XLSX.writeFile(wb, 'Players_report.xlsx');

    }
    Comparatordsc(a, b) {
        let handicapA =
            a.handicapQL.length > 0
                ? a.handicapQL[a.handicapQL.length - 1].handicap
                : a.handicap;
        let handicapb =
            b.handicapQL.length > 0
                ? b.handicapQL[b.handicapQL.length - 1].handicap
                : b.handicap;
        if (handicapA > handicapb) return -1;
        if (handicapA < handicapb) return 1;

        return 0;
    }
    Comparatorasc(a, b) {
        let handicapA =
            a.handicapQL.length > 0
                ? a.handicapQL[a.handicapQL.length - 1].handicap
                : a.handicap;
        let handicapb =
            b.handicapQL.length > 0
                ? b.handicapQL[b.handicapQL.length - 1].handicap
                : b.handicap;
        if (handicapA < handicapb) return -1;
        if (handicapA > handicapb) return 1;

        return 0;
    }

    ComparatorascMember(a, b) {
        if (a['membershipNumber'] < b['membershipNumber']) return -1;
        if (a['membershipNumber'] > b['membershipNumber']) return 1;

        return 0;
    }
    redirectToHandicapDetails = (id: string) => {
        this.location.navigate(['./', id], {
            relativeTo: this._activatedRoute,
        });
        // });
        // Go to the new contact

        // Mark for check
        this._changeDetectorRef.markForCheck();
    };
    public downloadAsPDFWHS(mode: 'category' | 'overall' = 'category') {
        try {
            this.logger.log(`Download Handicap WHS PDF (${mode})`, "info");
            let doc = new jsPDF();
            const pageWidth = (doc as any).internal.pageSize.width;

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            if (this.loggedInuser && this.loggedInuser.club && this.loggedInuser.club.name) {
                doc.text(this.loggedInuser.club.name.toString().toUpperCase(), pageWidth / 2, 15, { align: "center" });
            } else {
                doc.text('WHS Handicap List', pageWidth / 2, 15, { align: "center" });
            }
            doc.text('WHS Handicap List', pageWidth / 2, 27, { align: "center" });
            doc.setFontSize(10);
            doc.text('W.E.F:', 165, 27);
            doc.text(this.datepipe.transform(this.currentDate.toString(), 'MMM d, y'), 177, 27);

            const sortedTableRows = this.WHSSource?.sort
                ? this.WHSSource.sortData(this.WHSSource.filteredData, this.WHSSource.sort)
                : (this.WHSSource?.filteredData ?? []);

            const originalPlayersMap = new Map<string, any>();
            if (this.dataPlayers && this.dataPlayers.player) {
                this.dataPlayers.player.forEach((p: any) => {
                    originalPlayersMap.set(p.id, p);
                });
            }

            const exportPlayers = sortedTableRows
                .map((row: any) => originalPlayersMap.get(row.id) ?? row)
                .filter((player: any) => {
                    if (!player) {
                        return false;
                    }

                    const category = player.playerCategory;
                    return category !== 'Professionals' && category !== 'Caddie' && category != null;
                });

            const sections = mode === 'category'
                ? (() => {
                    const playersByCategory: { [key: string]: any[] } = {};
                    exportPlayers.forEach((player: any) => {
                        const category = player.playerCategory;
                        if (!playersByCategory[category]) {
                            playersByCategory[category] = [];
                        }
                        playersByCategory[category].push(player);
                    });

                    return Object.keys(playersByCategory).sort().map((category) => ({
                        title: category,
                        players: playersByCategory[category],
                    }));
                })()
                : [{ title: 'Overall', players: exportPlayers }];

            let startY = 40;

            sections.forEach((section, sectionIndex) => {
                const { title, players } = section;

                if (sectionIndex > 0) {
                    doc.addPage();
                }

                doc.setFillColor(41, 128, 185);
                doc.rect(14, startY - 10, 182, 8, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(`${title.toUpperCase()}`, 18, startY - 4.5, { align: 'left' });
                doc.text(`Players: ${players.length}`, 192, startY - 4.5, { align: 'right' });

                let count = 0;
                const rows: any[][] = [];
                players.forEach((element: any) => {
                    count++;
                    const handicapIndex = element.handicapWhsIndex;
                    const ratings = this.getTeesRating(handicapIndex);
                    rows.push([
                        count,
                        element.membershipNumber || '-',
                        (element.firstName || '').toString().toUpperCase() + ' ' + (element.lastName || '').toString().toUpperCase(),
                        element.handicapWhsIndex != null ? element.handicapWhsIndex.toFixed(1) : '-',
                        ratings['BLACK'] ?? '-',
                        ratings['BLUE'] ?? '-',
                        ratings['WHITE'] ?? '-',
                        ratings['Black-Veterans'] ?? '-',
                        ratings['RED'] ?? '-',
                    ]);
                });

                (doc as any).autoTable({
                    startY: startY,
                    head: [['Sr.', 'M.No', 'Name', 'H/C Index', 'Blue Tee', 'White Tee', 'Yellow Tee', 'Black/Vet', 'Red Tee']],
                    body: rows,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, halign: "center" },
                    bodyStyles: { fontSize: 8, halign: "center" },
                    columnStyles: {
                        2: { halign: "left" }
                    },
                    didDrawPage: (data) => {
                        if (data.pageNumber > 1) {
                            doc.setFontSize(11);
                            doc.setTextColor(255, 255, 255);
                            doc.setFillColor(41, 128, 185);
                            doc.rect(14, data.settings.margin.top - 10, 182, 8, "F");
                            doc.setFont('helvetica', 'bold');
                            doc.text(`${title.toUpperCase()}`, 18, data.settings.margin.top - 4.5, { align: 'left' });
                            doc.text(`Players: ${players.length}`, 192, data.settings.margin.top - 4.5, { align: 'right' });
                        }
                    }
                });

                startY = 35;
            });

            doc.save('WHS.pdf');
        } catch (error) {
            this.logger.log('Downloading WHS Handicap Data Failed', "error", error.toString());
        }
    }
    generatePDF() {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode

        // **Header 1: Tournament Title**
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("14TH PAKISTAN JUNIOR AMATEUR GOLF CHAMPIONSHIP", 148, 10, { align: "center" });

        doc.setFontSize(10);
        doc.text("04 - 07 FEBRUARY 2025", 148, 16, { align: "center" });

        // **Header 2: Category Title**
        doc.setFillColor(41, 128, 185); // Blue background
        doc.rect(14, 22, 269, 7, "F"); // Full-width rectangle
        doc.setTextColor(255, 255, 255); // White text
        doc.setFontSize(9);
        doc.text("ALL CATEGORIES HOLE-WISE SCORE - 07 FEBRUARY 2025 FINAL DAY 3", 148, 27, { align: "center" });

        // Reset text color for table
        doc.setTextColor(0, 0, 0);

        // **Multi-Row Header**
        const headers = [
            ["PAR", "", "", "", "", "", "", "", "", "", "36", "", "", "", "", "", "", "", "", "", "36", "", "", "", "", ""],
            ["S.No", "Name", "Club", "1", "2", "3", "4", "5", "6", "7", "8", "9", "OUT",
                "10", "11", "12", "13", "14", "15", "16", "17", "18", "IN", "RD 1", "RD 2", "RD 3", "Total", "Par"]
        ];

        // **Example Data**
        const data = [
            [1, "Saad Habib Malik", "DHA", 4, 4, 5, 3, 4, 5, 3, 4, 2, 37, 4, 4, 3, 6, 4, 5, 3, 4, 3, 37, 66, 66, 71, 203, -13],
            [2, "Shahmeer Maajid", "DRG", 4, 4, 4, 5, 5, 3, 4, 4, 4, 36, 4, 4, 3, 4, 4, 4, 4, 4, 3, 34, 73, 69, 70, 212, -4]
        ];

        // **Generate Table**
        (doc as any).autoTable({
            startY: 30, // Adjust position after second header
            head: headers,
            body: data,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, halign: "center" },
            bodyStyles: { fontSize: 7, halign: "center" },
            columnStyles: { 1: { halign: "left" }, 2: { halign: "left" } } // Align Name & Club to the left
        });

        // **Save PDF**
        doc.save("Golf_ScoreSheet.pdf");
    }
    getPlayerInformationByName(filterValue: string) {
        //console.log(filterValue);
        this.logger.log('Search in Handicap WHS', "info", filterValue);
        if (filterValue == '') {
            this.syncHandicapWHS();
            return;
        }
        filterValue = filterValue.trim();
        // let firstName = filterValue.substr(0,filterValue.indexOf(' '));
        //  let secondName=filterValue.substr(filterValue.indexOf(' ')+1)
        //  //console.log("firstname="+firstName);
        //  //console.log("ScondName="+ secondName);

        filterValue = filterValue.toLowerCase();
        this.player = [];
        if (filterValue.length >= 3) {
            for (let c of this.dataPlayers.player) {
                c['fullname'] = c['firstName'] + ' ' + c['lastName'];
                if (c['fullname'].toLowerCase().includes(filterValue)) {
                    this.player.push(c);
                    //this.selectPlayer = c;
                }
                if (c['membershipNumber'] == filterValue) {
                    this.player.push(c);
                }
            }
            //console.log(this.player);
            this.setDataSource(this.player);
        }
    }

    async getPlayerInformationByMembershipNumber(filterValue: string) {
        //console.log(filterValue);
        if (filterValue == '') {
            this.syncHandicapWHS();
            return;
        }
        filterValue = filterValue.trim();
        this.player = [];
        if (filterValue.length >= 2) {
            for (let c of this.dataPlayers.player) {
                if (c['membershipNumber'] == filterValue) {
                    this.player.push(c);
                    //this.selectPlayer = c;
                }
            }
            //console.log(this.player);
            this.setDataSource(this.player);
        }
    }

    selectPlayer(player) {
        this.response = {
            player: player,
        };

        this.selectedRowIndex = player.id;
    }

    setDataSource(dataSource: Array<any>) {
        this.player = [];

        for (let obj of dataSource) {
            this.player.push(obj);
        }
        this.WHSSource = new MatTableDataSource(dataSource);
        this.WHSSource.sort = this.sort;
        //console.log(this.WHSSource);

        //this.WHSSource = new MatTableDataSource(dataSource);
        //this.WHSSource.sort = this.sort;
        ////console.log(this.WHSSource);
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.WHSSource.filter = filterValue;

        if (this.WHSSource.paginator) {
            this.WHSSource.paginator.firstPage();
        }
    }
    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    applyWHSFilter(filterValue: string) {
        // filterValue = filterValue.trim(); // Remove whitespace
        // filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        // this.WHSSource.filter = filterValue;

        // if (this.WHSSource.paginator) {
        //   this.WHSSource.paginator.firstPage();
        // }
        //console.log(filterValue);
        if (filterValue == '') {
            this.syncHandicapWHS();
            return;
        }
        filterValue = filterValue.trim();
        // let firstName = filterValue.substr(0,filterValue.indexOf(' '));
        //  let secondName=filterValue.substr(filterValue.indexOf(' ')+1)
        //  //console.log("firstname="+firstName);
        //  //console.log("ScondName="+ secondName);

        filterValue = filterValue.toLowerCase();
        this.player = [];
        if (filterValue.length > 3) {
            for (let c of this.dataPlayers.player) {
                c['fullname'] = c['firstName'] + ' ' + c['lastName'];
                if (c['fullname'].toLowerCase().includes(filterValue)) {
                    this.player.push(c);
                    //this.selectPlayer = c;
                }
            }
            //console.log(this.player);
            this.setDataSource(this.player);
        }
    }

    redirectToDetails = (id: string) => {
        //console.log(id);

        this.location.navigate(['/players/view/' + id]);
    };
    getTeesRating(handicapIndex) {
        let rating = this.playerWHSRound['course_rating'];
        let teeRatings = {}; // Object to store handicap index for each tee

        for (let item of rating) {
            let slopeRating = item['slopeRating'];
            let courseRating = item['courseRating'];
            let coursePar = item['coursePar'];
            if (item['tee'] == 'WHITE') {
                let whiteTeeHI =
                    (handicapIndex * (slopeRating / 113.0) +
                        (courseRating - coursePar)) *
                    0.95;
                whiteTeeHI = Math.round(whiteTeeHI);
                teeRatings['WHITE'] = whiteTeeHI; // Store white tee handicap index
            } else if (item['tee'] == 'BLACK') {
                let blackTeeHI =
                    (handicapIndex * (slopeRating / 113.0) +
                        (courseRating - coursePar)) *
                    0.95;
                blackTeeHI = Math.round(blackTeeHI);
                teeRatings['BLACK'] = blackTeeHI; // Store black tee handicap index
            } else if (item['tee'] == 'BLUE') {
                let blueTeeHI =
                    (handicapIndex * (slopeRating / 113.0) +
                        (courseRating - coursePar)) *
                    0.95;
                blueTeeHI = Math.round(blueTeeHI);
                teeRatings['BLUE'] = blueTeeHI; // Store blue tee handicap index
            } else if (item['tee'] == 'RED') {
                let redTeeHI =
                    (handicapIndex * (slopeRating / 113.0) +
                        (courseRating - coursePar)) *
                    0.95;
                redTeeHI = Math.round(redTeeHI);
                teeRatings['RED'] = redTeeHI; // Store red tee handicap index
            } else if (item['tee'] == 'Black') {
                let BlackTeeHI =
                    (handicapIndex * (slopeRating / 113.0) +
                        (courseRating - coursePar)) *
                    0.95;
                BlackTeeHI = Math.round(BlackTeeHI);
                teeRatings['Black-Veterans'] = BlackTeeHI; // Store black(veterans) tee handicap index
            }
        }

        return teeRatings; // Return object containing handicap index for each tee
    }

    openTeeChangeDailog(player) {
        // console.log(player);

        const dialogRef = this.dialog.open(DialogTeeComponent, {
            data: {
                player: player,
                loggedInUser: this.loggedInuser
            }
        });
    }

}
