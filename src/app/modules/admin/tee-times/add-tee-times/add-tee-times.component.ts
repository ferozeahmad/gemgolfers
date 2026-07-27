import { Component, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormBuilder,
    ValidationErrors,
    Validators,
    FormGroup,
} from '@angular/forms';
import { Player, UserSessionModel } from '../../../../shared/models/player.model';
import { TeeTime, TeeTimeSlot } from '../../../../shared/models/teetime.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import {
    General,
    UniqueIdGenerator,
    Constants,
} from '../../../../shared/classes/general';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Course } from 'app/shared/models/course.model';
import { map, startWith } from 'rxjs';
import { Club } from 'app/shared/models/club.model';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-add-tee-times',
    templateUrl: './add-tee-times.component.html',
    styleUrls: ['./add-tee-times.component.scss'],
})
export class AddTeeTimesComponent implements OnInit {
    scheduleForm: FormGroup;
    loggedInuser: UserSessionModel;
    showTeeTime: boolean = false;
    showGuestTee: boolean = false;
    showGuestTime: boolean = false;
    teeSlots: any[] = [];
    minDate: Date;
    maxDate: Date;
    Courses: Course[] = [];
    Clubs: Club[] = [];
    filteredCourseOptions: any;
    filteredClubOptions: any;
    courseHoleSetNames;
    tee: '1' | '10' = '1';
    guestTee: '1' | '10' = '1';
    hideClubs: boolean = true;
    isSaving: boolean = false;
    isLoading: boolean = false;
    selectedOptions: any[] = [];
    editMode: boolean = false;
    editTeeTimeId: string | null = null;
    bookedSlotsCount: number = 0;

    constructor(
        private fb: FormBuilder,
        private facadeService: FacadeService,
        public snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private _localStorage: LocalStorageService,
        private logger: LogsService,
    ) { }

    async ngOnInit() {
        this.logger.log('Admin Come to Add Tee Time Page', "info");
        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        // console.log(this.loggedInuser);

        this.scheduleForm = this.fb.group({
            allowNineHole: [false, Validators.required],
            teeDate: [new Date(), Validators.required],
            bookingDate: [new Date(), Validators.required],
            teeBookingTime: ['09:00', Validators.required],
            interval: [8, Validators.required],
            courseName: ['', Validators.required],
            club: ['', Validators.required],
            noOfPlayers: ['4', Validators.required],
            allowGuest: ['1', Validators.required],
            startingHole: this.fb.array([]),
            guestStartingHole: this.fb.array([]),
            timing: this.fb.array([], Validators.required),
            guestTiming: this.fb.array([]),
        });
        let dataClubs = await this.facadeService.getClubList();
        this.Clubs = dataClubs.club;
        let dataCourses = await this.facadeService.getApprovedCoursesList();
        this.Courses = dataCourses.course;
        this.hideClubs = this._localStorage.isClubAdmin() ? true : false;
        let today: Date = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();

        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

        const currentYear = new Date().getFullYear();
        this.minDate = todayDate;
        this.maxDate = new Date(currentYear + 1, 11, 31);
        if (this._localStorage.isClubAdmin()) {

            let courseName: string = this.loggedInuser.club?.courses?.[0]?.name ?? '-KpFJ5_ODeRpEQCz9Drd';
            let courseId: string = this.loggedInuser?.courseId ?? '-KpFJ5_ODeRpEQCz9Drd';
            this.scheduleForm.get('courseName').setValue({
                id: courseId,
                name: courseName
            })
            this.scheduleForm
                .get('club')
                .setValue({
                    id: this.loggedInuser.club?.id,
                    name: this.loggedInuser.club?.name
                });

            this.getSelectedCourse(courseId ? courseId : '-LUFS3FCQKOGpJ2IEHmf');
        }
        this.filteredCourseOptions = this.scheduleForm
            .get('courseName')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) =>
                    name ? this._filterCourse(name) : this.Courses.slice()
                )
            );


        this.filteredClubOptions = this.scheduleForm
            .get('club')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) => (name ? this._filter(name) : this.Clubs.slice()))
            );

        // Check if we are in edit mode
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.editMode = true;
            this.editTeeTimeId = id;
            await this.loadTeeTimeForEdit(id);
        }
    }

    async loadTeeTimeForEdit(id: string) {
        try {
            this.isLoading = true;
            const data = await this.facadeService.getTeeTimeById(id);
            const tt = data?.tee_time_booking?.[0];
            if (!tt) { this.isLoading = false; return; }

            // Count booked slots
            this.bookedSlotsCount = tt.slots.filter((s: any) => s.flightId != null).length;

            // Set simple fields
            this.scheduleForm.patchValue({
                teeDate: new Date(tt.teeDate),
                bookingDate: new Date(tt.bookingDate),
                teeBookingTime: tt.bookingTime,
                interval: tt.interval,
                noOfPlayers: String(tt.noOfPlayers),
                allowNineHole: tt.allowNineHole,
                club: tt.club,
                courseName: tt.course,
            });

            // Load hole sets for the course, then rebuild timing array from slots
            await new Promise<void>(resolve => {
                this.facadeService.getCourseHoleSets(tt.course.id).subscribe((res: any) => {
                    if (res?.course_hole_sets?.length > 0) {
                        this.courseHoleSetNames = res.course_hole_sets.filter((h: any) => h.isActive);
                    }
                    resolve();
                });
            });

            // Derive unique tee-box configurations from the existing slots
            const seen = new Set<string>();
            const timingGroups: { key: string; courseHoleSets: string; inverted: string; noOfHoles: number; displayName: string }[] = [];
            for (const slot of tt.slots) {
                const key = `${slot.courseHoleSets}_${slot.courseHoleSetsInverted}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    const holeSetMeta = this.courseHoleSetNames?.find(
                        (h: any) => String(h.holeSets) === String(slot.courseHoleSets) &&
                                    String(h.inverted) === String(slot.courseHoleSetsInverted)
                    );
                    timingGroups.push({
                        key,
                        courseHoleSets: String(slot.courseHoleSets),
                        inverted: String(slot.courseHoleSetsInverted),
                        noOfHoles: slot.noOfHoles ?? holeSetMeta?.noOfHoles ?? 18,
                        displayName: holeSetMeta?.displayName ?? key,
                    });
                }
            }

            // Rebuild timing FormArray
            const timingFA = this.scheduleForm.get('timing') as FormArray;
            timingFA.clear();
            for (const tg of timingGroups) {
                const groupSlots = tt.slots.filter((s: any) =>
                    String(s.courseHoleSets) === tg.courseHoleSets &&
                    String(s.courseHoleSetsInverted) === tg.inverted
                );
                const times = groupSlots.map((s: any) => s.slotTime);
                const startTime = times[0] ?? '';
                const endTime = times[times.length - 1] ?? '';
                const group = this.createTimingFormGroup(tg.displayName, tg.courseHoleSets, tg.inverted, tg.noOfHoles);
                group.patchValue({ startTime, endTime });
                timingFA.push(group);
            }

            this.isLoading = false;
        } catch (err) {
            this.isLoading = false;
            console.error('loadTeeTimeForEdit error', err);
        }
    }

    getSelectedCourse(course) {
        this.facadeService
            .getCourseHoleSets(course)
            .subscribe((selectedCourseHoleSet) => {
                //console.log(selectedCourseHoleSet);
                if (selectedCourseHoleSet.course_hole_sets.length > 0) {
                    //console.log(selectedCourseHoleSet);

                    this.courseHoleSetNames =
                        selectedCourseHoleSet.course_hole_sets.filter(
                            (holeSet) => holeSet.isActive == true
                        );
                    //this.showCourseHole = true;
                } else {
                    //this.showCourseHole = false;
                }
            });
    }

    private _filter(value: string): Club[] {
        //console.log(value);

        if (value) {
            const filterValue = value.toLowerCase();

            return this.Clubs.filter(
                (option) => option.name.toLowerCase().indexOf(filterValue) === 0
            );
        }

        return this.Clubs;
    }

    async createSchedule() {
        // TODO: Use EventEmitter with form value
        try {
            this.logger.log('Admin Click on create tee time button', "info", this.scheduleForm.value);
            this.isSaving = true;
            console.log(this.scheduleForm.value);
            let clubId: string = this.loggedInuser.adminClubId;

            // In edit mode, skip the duplicate-date check
            if (!this.editMode) {
                // let isExist: TeeTime[] =
                //     await this.facadeService.isTeeTimeDateExist(
                //         clubId,
                //         General.parseToDate(this.scheduleForm.value.teeDate)
                //     );
                // if (isExist['tee_time_booking'].length > 0) {
                //     this.snackBar.open('Selected date already exists. Choose a different date.', 'x', { duration: 5000 });
                //     this.isSaving = false;
                //     return false;
                // }
            }

            await this.generateTeeTimes();
            console.log(this.teeSlots);

            let teeTimeSlots: TeeTimeSlot[] = [];

            for (let slot of this.teeSlots) {

                let tee1: any = {
                    id: UniqueIdGenerator.generate(),
                    slotTime: (slot.time),
                    joinedMembers: 0,
                    startingHole: slot.startingHole,
                    courseHoleSets: Number(slot.courseHoleSets),
                    courseHoleSetsInverted: slot.inverted,
                    flightId: null,
                    allowGuest: true,
                    noOfHoles: slot.noOfHoles,
                };
                teeTimeSlots.push(tee1);
            }
            console.log(teeTimeSlots);
            const schedule: TeeTime = {
                id: this.editMode ? this.editTeeTimeId : UniqueIdGenerator.generate(),
                clubId: this.scheduleForm.value?.club.id,
                courseId: this.scheduleForm.value?.courseName.id,
                bookingDate: General.parseToDate(this.scheduleForm.value.bookingDate),
                teeDate: General.parseToDate(this.scheduleForm.value.teeDate),
                startTime: this.scheduleForm.value.teeOneStartTime,
                noOfPlayers: Number(this.scheduleForm.value.noOfPlayers),
                endTime: this.scheduleForm.value.startingHole == 'both' ? this.scheduleForm.value.teeTenEndTime : this.scheduleForm.value.teeOneEndTime,
                interval: this.scheduleForm.value.interval,
                teeTimeSlot: teeTimeSlots,
                allowNineHole: this.scheduleForm.value.allowNineHole,
                bookingTime: this.scheduleForm.value.teeBookingTime
            };

            console.log(schedule);

            if (this.editMode) {
                const response = await this.facadeService.updateTeeTimeSchedule(schedule, teeTimeSlots);
                if (response) {
                    this.snackBar.open('Tee Time has been updated.', 'x', { duration: 2000 });
                    this.isSaving = false;
                    this.router.navigate(['/teetimes']);
                }
            } else {
                let response = await this.facadeService.AddTeeTimeSchedule(schedule);
                if (response) {
                    this.snackBar.open('Tee Time has been created.', 'x', { duration: 2000 });
                    this.isSaving = false;
                    this.reset();
                    this.router.navigate(['/teetimes']);
                }
            }
        } catch {
            this.isSaving = false;
            this.snackBar.open('Something went wrong. Try again later.', 'x', {
                duration: 5000,
            });
        }
    }

    private _filterCourse(value: any): Course[] {
        //console.log('value=' + value);

        if (value) {
            if (typeof value === 'object') {
                const filterValue = value.name
                    ? value.name.toLowerCase()
                    : value.course.name.toLowerCase();
                return this.Courses.filter(
                    (option) =>
                        option.name.toLowerCase().indexOf(filterValue) >= 0
                );
            } else {
                const filterValue = value.toLowerCase();
                return this.Courses.filter(
                    (option) =>
                        option.name.toLowerCase().indexOf(filterValue) >= 0
                );
            }
        }

        return this.Courses;
    }
    displayCourseFn(course: any): string {
        //console.log(course);
        return typeof course === 'string'
            ? course
            : course.course
                ? course.course.name
                : course.name;
    }
    displayFn(club: Club): string {
        return typeof club === 'string' ? club : club ? club.name : '';
    }

    generateTeeTimes() {

        try {
            const timingFormArray = this.scheduleForm.get('timing') as FormArray;
            const controls = timingFormArray.controls;
            const guestTimingFormArray = this.scheduleForm.get('guestTiming') as FormArray;
            const guestTimingControls = guestTimingFormArray.controls;
            console.log(controls);

            this.teeSlots = [];
            const createSlot = (courseHoleSets, inverted, startTime, endTime, guestHole, noOfHoles, breakPeriods: { breakStart: string, breakEnd: string }[] = []) => {
                const baseDate = new Date(Constants.DEFAULT_DATE);

                const s = this.parseTime(startTime);
                const e = this.parseTime(endTime);

                let startLimit = new Date(baseDate);
                startLimit.setHours(s.hours, s.minutes, 0, 0);

                const endLimit = new Date(baseDate);
                endLimit.setHours(e.hours, e.minutes, 0, 0);

                // Pre-parse break periods into Date objects
                const parsedBreaks = breakPeriods
                    .filter(bp => bp.breakStart && bp.breakEnd)
                    .map(bp => {
                        const bsP = this.parseTime(bp.breakStart);
                        const beP = this.parseTime(bp.breakEnd);
                        const bStart = new Date(baseDate);
                        bStart.setHours(bsP.hours, bsP.minutes, 0, 0);
                        const bEnd = new Date(baseDate);
                        bEnd.setHours(beP.hours, beP.minutes, 0, 0);
                        return { bStart, bEnd };
                    });

                while (startLimit <= endLimit) {
                    // Skip slots that fall within any break period
                    const inBreak = parsedBreaks.some(({ bStart, bEnd }) =>
                        startLimit >= bStart && startLimit < bEnd
                    );

                    if (!inBreak) {
                        const h = startLimit.getHours();
                        const m = startLimit.getMinutes();
                        const time = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
                        if (noOfHoles == 18) {
                            this.teeSlots.push({ courseHoleSets, startingHole: 10, inverted, time, guestHole, noOfHoles });
                        }
                        if (courseHoleSets === '2') {
                            this.teeSlots.push({ courseHoleSets, startingHole: 10, inverted, time, guestHole, noOfHoles });
                        } else {
                            this.teeSlots.push({ courseHoleSets, startingHole: 1, inverted, time, guestHole, noOfHoles });
                        }
                    }
                    startLimit.setMinutes(startLimit.getMinutes() + this.scheduleForm.value.interval);
                }
            };
            let hole = this.scheduleForm.value.startingHole !== 'both'
                ? Number(this.scheduleForm.value.startingHole) : 1;
            let guesthole = this.scheduleForm.value.guestStartingHole !== 'both'
                ? Number(this.scheduleForm.value.guestStartingHole) : 1;
            // createSlot(hole, this.scheduleForm.value.teeOneStartTime, this.scheduleForm.value.teeOneEndTime, guesthole);
            // if (this.scheduleForm.value.startingHole == 'both') {
            //     createSlot(10, this.scheduleForm.value.teeTenStartTime, this.scheduleForm.value.teeTenEndTime, guesthole);
            // }
            controls?.forEach((form) => {
                const courseHoleSets = form.get('courseHoleSets').value;
                const inverted = form.get('inverted').value;
                const startTime = form.get('startTime').value;
                const endTime = form.get('endTime').value;
                const noOfHoles = form.get('noOfHoles').value;
                const breakPeriods = (form.get('breakPeriods') as FormArray).value ?? [];
                createSlot(courseHoleSets, inverted, startTime, endTime, false, noOfHoles, breakPeriods);
            })
            // guestTimingControls?.forEach((form) => {
            //     const courseHoleSets = form.get('courseHoleSets').value;
            //     const inverted = form.get('inverted').value;
            //     const startTime = form.get('startTime').value;
            //     const endTime = form.get('endTime').value;
            //     const noOfHoles = form.get('noOfHoles').value;
            //     createSlot(courseHoleSets, inverted, startTime, endTime, true, noOfHoles);
            // })

        } catch { }
    }

    parseTime(time: string): { hours: number; minutes: number } {
        const [t, modifier] = time.split(' ');
        let [hours, minutes] = t.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }

        return { hours, minutes };
    }


    public reset() {
        this.scheduleForm.reset();
    }

    public onCancel() { }

    teeChange(event: any) {
        const selectedValues = event.value; // Get the selected values from the event
        console.log(event.value);
        const timingFormArray = this.scheduleForm.get('timing') as FormArray;
        const controls = timingFormArray.controls;

        // Iterate over the existing controls in the timing FormArray
        for (let i = controls.length - 1; i >= 0; i--) {
            const control = controls[i] as FormGroup;
            const name = control.get('name').value;
            const index = selectedValues.indexOf(name);

            // If the name of the control exists in the selectedValues array, do nothing
            // Otherwise, remove the control from the timing FormArray
            if (index === -1) {
                timingFormArray.removeAt(i);
            }
        }

        // Iterate over selected values and add a FormGroup for each if it does not exist
        selectedValues.forEach((value: string) => {
            const [holeSet, inverted] = value.split('_');
            const name = this.courseHoleSetNames.find((holes) => {
                return holes.holeSets == Number(holeSet) && holes.inverted.toString() == inverted;
            });

            // Check if the name is already present in the timing FormArray
            const exists = controls.some(control => control.get('name').value === name?.displayName);

            if (!exists) {
                const newFormGroup = this.createTimingFormGroup(name?.displayName, holeSet, inverted, name?.noOfHoles);
                timingFormArray.push(newFormGroup);
            }
        });
    }


    /** Validator attached to each break-period FormGroup.
     *  Traverses up to the parent timing group to compare against startTime / endTime. */
    breakPeriodValidator(group: AbstractControl): ValidationErrors | null {
        const breakStart: string = group.get('breakStart')?.value;
        const breakEnd: string   = group.get('breakEnd')?.value;

        if (!breakStart && !breakEnd) return null;

        // breakPeriod group → breakPeriods FormArray → timing FormGroup
        const timingGroup = group.parent?.parent;
        const startTime: string = timingGroup?.get('startTime')?.value;
        const endTime: string   = timingGroup?.get('endTime')?.value;

        if (!startTime || !endTime) return null;

        const toMins = (t: { hours: number; minutes: number }) => t.hours * 60 + t.minutes;

        try {
            const errors: ValidationErrors = {};
            const windowStart = toMins(this.parseTime(startTime));
            const windowEnd   = toMins(this.parseTime(endTime));

            if (breakStart && breakEnd) {
                const bpStart = toMins(this.parseTime(breakStart));
                const bpEnd   = toMins(this.parseTime(breakEnd));

                if (bpStart >= bpEnd) {
                    errors['breakOrder'] = true;
                }
                if (bpStart < windowStart) {
                    errors['breakStartTooEarly'] = true;
                }
                if (bpEnd > windowEnd) {
                    errors['breakEndTooLate'] = true;
                }
            } else if (breakStart) {
                const bpStart = toMins(this.parseTime(breakStart));
                if (bpStart < windowStart) errors['breakStartTooEarly'] = true;
            } else if (breakEnd) {
                const bpEnd = toMins(this.parseTime(breakEnd));
                if (bpEnd > windowEnd) errors['breakEndTooLate'] = true;
            }

            return Object.keys(errors).length ? errors : null;
        } catch {
            return null;
        }
    }

    createTimingFormGroup(name: string, holeSet: string, inverted: string, noOfHoles: number): FormGroup {
        const group = this.fb.group({
            name: name,
            courseHoleSets: holeSet,
            inverted: inverted,
            startTime: '',
            endTime: '',
            noOfHoles: noOfHoles,
            breakPeriods: this.fb.array([]),
        });

        // When the main window times change, re-validate every existing break period
        const revalidateBreaks = () => {
            const breaks = group.get('breakPeriods') as FormArray;
            breaks.controls.forEach(c => c.updateValueAndValidity({ emitEvent: false }));
        };
        group.get('startTime')!.valueChanges.subscribe(revalidateBreaks);
        group.get('endTime')!.valueChanges.subscribe(revalidateBreaks);

        return group;
    }

    // Getter for the timing FormArray
    get timingFormArray(): FormArray {
        return this.scheduleForm.get('timing') as FormArray;
    }
    get guestTimingFormArray(): FormArray {
        return this.scheduleForm.get('guestTiming') as FormArray;
    }

    getBreakPeriods(timingIndex: number): FormArray {
        return this.timingFormArray.at(timingIndex).get('breakPeriods') as FormArray;
    }

    addBreakPeriod(timingIndex: number) {
        this.getBreakPeriods(timingIndex).push(
            this.fb.group(
                { breakStart: [''], breakEnd: [''] },
                { validators: (g) => this.breakPeriodValidator(g) }
            )
        );
    }

    removeBreakPeriod(timingIndex: number, breakIndex: number) {
        this.getBreakPeriods(timingIndex).removeAt(breakIndex);
    }
    guestTeeChange(event: any) {
        const selectedValues = event.value; // Get the selected values from the event
        console.log(event.value);

        const timingFormArray = this.scheduleForm.get('guestTiming') as FormArray;
        const controls = timingFormArray.controls;

        // Iterate over the existing controls in the timing FormArray
        for (let i = controls.length - 1; i >= 0; i--) {
            const control = controls[i] as FormGroup;
            const name = control.get('name').value;
            const index = selectedValues.indexOf(name);

            // If the name of the control exists in the selectedValues array, do nothing
            // Otherwise, remove the control from the timing FormArray
            if (index === -1) {
                timingFormArray.removeAt(i);
            }
        }

        // Iterate over selected values and add a FormGroup for each if it does not exist
        selectedValues.forEach((value: string) => {
            const [holeSet, inverted] = value.split('_');
            const name = this.courseHoleSetNames.find((holes) => {
                return holes.holeSets == Number(holeSet) && holes.inverted.toString() == inverted;
            });

            // Check if the name is already present in the timing FormArray
            const exists = controls.some(control => control.get('name').value === name?.displayName);

            if (!exists) {
                const newFormGroup = this.createTimingFormGroup(name?.displayName, holeSet, inverted, name?.noOfHoles);
                timingFormArray.push(newFormGroup);
            }
        });
    }

    public participantsChange(event) {
        console.log(event);
        if (event.value == '1') {
            this.showGuestTime = true;
        } else {
            this.showGuestTime = false;
        }
    }

    convertToUTC(timeString) {
        // Parse the time string
        const [hours, minutes] = timeString.split(':').map(str => parseInt(str));

        // Create a Date object with today's date and the provided time
        const date = new Date(General.parseToDate(this.scheduleForm.value.BookingDate));
        date.setHours(hours);
        date.setMinutes(minutes);

        // Convert the time to UTC by subtracting the timezone offset
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

        // Return the time in UTC format
        return date.toISOString();
    }
    convertToUTCTime(timeString: string): string {
        // Parse the time string
        const [hours, minutes] = timeString.split(':').map(str => parseInt(str));

        // Create a Date object with today's date and the provided time
        const date = new Date();
        date.setUTCHours(hours);
        date.setUTCMinutes(minutes);

        // Convert the time to UTC by subtracting the timezone offset
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

        // Return the time in UTC format
        return date.toISOString().substr(11, 5);
    }


}