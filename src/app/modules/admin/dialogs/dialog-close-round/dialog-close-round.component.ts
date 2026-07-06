import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FacadeService } from '../../../../shared/services/facade.service';
import { DatePipe } from '@angular/common';
import { Constants } from 'app/shared/classes/general';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
    standalone: false,
    selector: 'app-dialog-close-round',
    templateUrl: './dialog-close-round.component.html',
    styleUrls: ['./dialog-close-round.component.scss'],
})
export class DialogCloseRoundComponent implements OnInit {
    @ViewChild('tabGroup') tabGroup;
    public collection: any;
    cutOffform: FormGroup;
    copyFlights: boolean = false;
    public categoryList: FormArray;
    allTabsChecked: boolean = false;
    public flightSettings: any;
    public nDate: Date;
    public selectedIndex: number = 0;
    public tournament_member_category: any;
    public playingCat: any[] = [];
    public catArray: any[] = [];
    public PlayingFlight: Boolean;
    flightData: any;
    round: number = 1000;

    constructor(
        private datePipe: DatePipe,
        public dialogRef: MatDialogRef<DialogCloseRoundComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,
        private facadeService: FacadeService
    ) { }

    async ngOnInit() {
        this.cutOffform = this.fb.group({
            category: this.fb.array([]),
        });

        console.log(this.data);
        this.round = this.data.round;
        let sDate = new Date(this.data.startDate);

        this.categoryList = this.cutOffform.get('category') as FormArray;
        if (this.data.categories.length > 0) {
            for (let c of this.data.categories) {
                this.tournament_member_category =
                    await this.facadeService.getFlightSettings(
                        this.data.tournament,
                        c.category
                    );
                this.tournament_member_category = this.tournament_member_category.tournament_member_category;
            }
            this.data.categories.sort(function (a, b) {
                var textA = a.category.toUpperCase();
                var textB = b.category.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
            //console.log(this.data.categories);
            for (let c of this.data.categories) {
                if (c.allowCat) {
                    this.catArray[c.category] = [];
                    this.catArray[c.category]['value'] = true;
                    this.catArray[c.category]['time'] = c.flightSettings[
                        'flightStartTime'
                    ]
                        ? c.flightSettings['flightStartTime']
                        : '"08:00"';
                    if (c.cut) {
                        this.catArray[c.category]['cutshow'] = true;
                        this.catArray[c.category]['showCutCopy'] = false;
                    } else {
                        this.catArray[c.category]['cutshow'] = true;
                        this.catArray[c.category]['showCutCopy'] = false;
                    }
                    ////console.log(this.catArray);
                    this.addCategoryFlightField(c);
                }
            }
        } else {
            this.catArray['All'] = [];
            this.catArray['All']['value'] = true;
            this.catArray['All']['time'] = '"08:00"';
            this.catArray['All']['cutshow'] = false;
            this.catArray['All']['showCutCopy'] = false;

            ////console.log(this.catArray);
            this.addCategoryFlightField('All');
        }




        //this.categoryList.removeAt(0);
        // //console.log(this.categoryList);
    }
    getFlightTime(items: any) {
        let flightTime: string = '00:00';

        try {
            if (items.time) {
                let dateNow: Date = new Date(
                    Constants.DEFAULT_DATE + ' ' + items.time.substr(0, 5)
                );

                var h = dateNow.getHours();
                var m = dateNow.getMinutes();

                flightTime = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
            }
        } catch {
            flightTime = '00:00';
        }

        return flightTime;
    }
    calculateDiff(startDate, endDate) {
        let days = Math.floor(
            (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24
        );
        return days;
    }
    createFlightSettingsForMatchPlay(cat: any): FormGroup {
        return this.fb.group({
            name: [
                cat,
                Validators.compose([Validators.required]),
            ],
            copy: ['0', Validators.required],
            players: [4, Validators.required],
            time: ['09:00', Validators.required],
            interval: [10, Validators.required],
            tee: ['1_10', Validators.required],
            type: ['GROSS', Validators.required],
            order: ['desc', Validators.required],
            copyFlights: [false, Validators.required],
            cuttScore: [''],
            playing: [true],
            lastRoundPlayed: [this.PlayingFlight],
        });
    }
    createFlightSettings(cat: any): FormGroup {

        const FilteredFlight = this.tournament_member_category.filter((a) => {
            return a.category == cat.category;
        });

        if (this.data.round - 1 > 1) {
            //var startDate = new Date(this.datePipe.transform(this.data.startDate, 'dd-MM-yyyy'));
            var startDate = new Date(this.data.startDate);
            startDate.setDate(
                startDate.getDate() - (parseInt(this.data.round) - 1)
            );
            //console.log(startDate);
            ////console.log(new Date(this.datePipe.transform(FilteredFlight[0].flightSettings.playingDate[0].Date, 'dd-MM-yyyy')));
            let sDate = this.datePipe.transform(startDate, 'yyyyMMdd');
            //console.log(sDate);
            if (FilteredFlight.length > 1) {
                this.PlayingFlight =
                    FilteredFlight[0].flightSettings.playingDate.filter((a) => {
                        return (
                            a.Date == sDate &&
                            a.playing == true &&
                            FilteredFlight[0].category == cat.category
                        );
                        //return ((new Date(this.datePipe.transform(a.Date, 'dd-MM-yyyy')).getTime())  == (startDate ).getTime() && (a.playing == true) && (FilteredFlight[0].category == cat))
                    });

                //console.log(this.PlayingFlight);
            } else {
                //console.log('flights No');
            }
            // if(PlayingFlight.length > 0)
            // {
        } else {
            //var startDate = new Date(this.datePipe.transform(this.data.startDate, 'dd-MM-yyyy'));
            var startDate = new Date(this.data.startDate);
            startDate.setDate(startDate.getDate());
            //console.log(startDate);
            ////console.log(new Date(this.datePipe.transform(FilteredFlight[0].flightSettings.playingDate[0].Date, 'dd-MM-yyyy')));
            let sDate = this.datePipe.transform(startDate, 'yyyyMMdd');
            //console.log(sDate);
            if (FilteredFlight.length > 1) {
                this.PlayingFlight =
                    FilteredFlight[0].flightSettings.playingDate.filter((a) => {
                        return (
                            a.Date == sDate &&
                            a.playing == true &&
                            FilteredFlight[0].category == cat.category
                        );
                        //return ((new Date(this.datePipe.transform(a.Date, 'dd-MM-yyyy')).getTime())  == (startDate ).getTime() && (a.playing == true) && (FilteredFlight[0].category == cat))
                    });
                //console.log(this.PlayingFlight);
            } else {
                //console.log('flights No');
            }
        }
        //   this.playingCat = true
        // }
        if (FilteredFlight.length > 0) {
            this.flightData = FilteredFlight[0].flightSettings;
        }
        //console.log(this.flightData);

        return this.fb.group({
            name: [
                cat.category ? cat.category : '',
                Validators.compose([Validators.required]),
            ],
            copy: ['0', Validators.required],
            players: [3, Validators.required],
            time: ['09:00', Validators.required],
            interval: [10, Validators.required],
            tee: ['1_10', Validators.required],
            type: ['GROSS', Validators.required],
            order: ['desc', Validators.required],
            copyFlights: [false, Validators.required],
            cuttScore: [''],
            playing: [this.catArray[cat.category].value],
            lastRoundPlayed: [this.PlayingFlight],
        });
    }

    selectionChangeCopy(evt, cat) {
        //console.log(evt);
        //console.log(evt);
        //console.log(cat);

        evt.checked == true
            ? (this.catArray[cat].showCutCopy = true)
            : (this.catArray[cat].showCutCopy = false);
    }
    selectionChange(evt, cat) {
        //console.log(evt);
        //console.log(cat);

        evt.checked == true
            ? (this.catArray[cat].value = true)
            : (this.catArray[cat].value = false);
    }

    createCategory(cat: any): FormGroup {
        return this.fb.group({
            name: [cat ? cat : '', Validators.compose([Validators.required])],
            value: ['0', Validators.compose([Validators.required])],
        });
    }

    get categoryFormGroup() {
        return this.cutOffform.get('category') as FormArray;
    }

    // addField(category: any) {
    //   const control = this.cutOffform.get("category") as FormArray;
    //   control.push(this.createCategory(category));
    //   //console.log(control)
    // }

    addCategoryFlightField(category: any) {
        const control = this.cutOffform.get('category') as FormArray;
        ////console.log(this.catArray[category.category].value);
        //if(this.catArray[category].value == true)
        //{
        if (category !== 'All') {

            control.push(this.createFlightSettings(category));
        } else {

            control.push(this.createFlightSettingsForMatchPlay(category));
        }
        //console.log(control);
        //}
    }

    onSubmit() {
        // TODO: Use EventEmitter with form value
        // console.warn(this.cutOffform.value);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    saveCutSettings(index, event): void {
        //console.log(this.tabGroup);
        // ///console.log(event);

        // //console.log(document.getElementById('mat-tab-label-5-' + index));
        // //console.log(document.getElementById('mat-tab-label-6-' + index));
        // //console.log(document.getElementById('mat-tab-label-7-' + index));
        // //console.log(document.getElementById('mat-tab-label-8-' + index));
        // if (document.getElementById('mat-tab-label-5-' + index)) {
        //     document
        //         .getElementById('mat-tab-label-5-' + index)
        //         .insertAdjacentHTML(
        //             'beforeend',
        //             '<mat-icon style="padding: 2px;background: green;color: white;border-radius: 14px;margin: 2px;">Saved</mat-icon>'
        //         );
        // } else if (document.getElementById('mat-tab-label-6-' + index)) {
        //     document
        //         .getElementById('mat-tab-label-6-' + index)
        //         .insertAdjacentHTML(
        //             'beforeend',
        //             '<mat-icon style="padding: 2px;background: green;color: white;border-radius: 14px;margin: 2px;">Saved</mat-icon>'
        //         );
        // } else {
        //     document
        //         .getElementById('mat-tab-label-7-' + index)
        //         .insertAdjacentHTML(
        //             'beforeend',
        //             '<mat-icon style="padding: 2px;background: green;color: white;border-radius: 14px;margin: 2px;">Saved</mat-icon>'
        //         );
        // }

        //console.log(this.cutOffform.get('category').value.length);

        //console.log(index);
        if (index < this.cutOffform.get('category').value.length - 1) {
            this.selectedIndex = ++index;
        } else {
            this.allTabsChecked = true;
        }
    }
}
