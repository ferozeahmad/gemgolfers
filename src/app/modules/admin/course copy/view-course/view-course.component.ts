import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { GoogleMap } from '@angular/google-maps';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { countries, getCity } from 'app/shared/classes/country';
import { Constants, General, UniqueIdGenerator } from 'app/shared/classes/general';
import { FacadeService } from 'app/shared/services/facade.service';
// import { GoogleMapsApiService } from 'app/shared/services/google-map.service';
import { HandicapService } from 'app/shared/services/handicap.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Observable, Subject, map, shareReplay, startWith } from 'rxjs';
import * as XLSX from 'xlsx';
import { read, utils } from 'xlsx';
import { UserSessionModel } from 'app/shared/models/player.model';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-view-course',
    templateUrl: './view-course.component.html',
    styleUrls: ['./view-course.component.scss'],
})
export class ViewCourseComponent implements OnInit, OnDestroy {
    // center: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
    zoom = 18;
    file: File;
    cordinatesData = [];
    // @ViewChild('googleMap', { static: false }) googleMapElement!: GoogleMap;
    // @ViewChild('googleMap', { static: false, read: ElementRef }) googleMapContainer: ElementRef;
    @ViewChild('fileInput') fileInputVariable: ElementRef;
    @ViewChild('pacInput', { static: false }) searchBoxRef!: ElementRef;
    arrayBuffer: any;
    // mapTypeId: google.maps.MapTypeId = google.maps.MapTypeId.TERRAIN;
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = '0';
    courseID: any;
    courseData: any;
    courseTitle: any;
    editForm: boolean = false;
    currentHoleNo: number | null = 1;
    currentHzd: any | null = null;
    currentHzdId: string | null = null;
    currentGreen: number | null = null;
    currentTee: number | null = null;
    currentLatLong: boolean = true;
    countryName: any;
    cityName: any;
    NoOfHoles: any = 18;
    NoOfCols: number = 22;
    url: string;
    Tee = [];
    id = [];
    Hole = [];
    TEES = ['AMATEURS', 'LADIES', 'SENIORS', 'PROFESSIONAL', 'VETERANS'];
    holeSetfor9Hazards = [];
    holeSetfor18Hazards = [];
    holeSetfor27Hazards = [];
    holeSetfor36Hazards = [];
    coursRating = [];
    coursRatingfor18 = [];
    coursRatingfor27 = [];
    coursRatingfor36 = [];
    stepTitle: string = 'Course Setup Form';
    coursRatingHeader = [];
    showCourseTees = [];
    holeSetfor9 = Array(9).fill(null).map((_, index) => ({
        id: UniqueIdGenerator.generate(),
        holeNo: index + 1,
        yardage: null,
        par: null,
        index: null,
        indexForW: null,
        teeDistances: {},
    }));
    holeSetfor18 = Array(9).fill(null).map((_, index) => ({
        id: UniqueIdGenerator.generate(),
        holeNo: index + 10,
        yardage: null,
        par: null,
        index: null,
        indexForW: null,
        teeDistances: {},
    }));
    holeSetfor27 = Array(9).fill(null).map((_, index) => ({
        id: UniqueIdGenerator.generate(),
        holeNo: index + 19,
        yardage: null,
        par: null,
        index: null,
        indexForW: null,
        teeDistances: {},
    }));
    holeSetfor36 = Array(9).fill(null).map((_, index) => ({
        id: UniqueIdGenerator.generate(),
        holeNo: index + 28,
        yardage: null,
        par: null,
        index: null,
        indexForW: null,
        teeDistances: {},
    }));
    holeSetforSelect = [];
    showholeSetfor18: boolean = false;
    showholeSetfor27: boolean = false;
    showholeSetfor36: boolean = false;
    holeMeta = [];
    holeMetafor18 = [];
    holeMetaforSelect = [];
    showholeMetafor18: boolean = false;
    holeMetafor27 = [];
    showholeMetafor27: boolean = false;
    holeMetafor36 = [];
    showholeMetafor36: boolean = false;
    showTees = [];
    showholeindexforWomen: boolean = false;
    isLoading: boolean = false;
    setName9: string = 'Front 9';
    setName18: string = 'Back 9';
    setName27: string;
    setName36: string;
    tees: any;
    courseHoleSet: any;
    markers: any[] = [];
    showratingforwomen: boolean = false;
    tee: any;
    deleteTsee: any[];
    teeRemove: any[] = [];
    holes: any;
    nineHoleTotalPar: number = 0;
    eighteenHoleTotalPar: number = 0;
    twentysevenHoleTotalPar: number = 0;
    thirtySixHoleTotalPar: number = 0;
    loggedInuser: UserSessionModel;
    public courseForm: FormGroup;
    countries: any;
    cities: any;
    listCountries: Observable<any[]>;
    public googleMapsApiLoaded$: Observable<boolean>;
    listCity: Observable<any[]>;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        // private datePipe: DatePipe,
        private router: Router,
        private _localStorage: LocalStorageService,
        private _fuseConfirmationService: FuseConfirmationService,
        private route: ActivatedRoute,
        // private googleMapsApiSerivce: GoogleMapsApiService,
        private _cityService: HandicapService,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        private logger: LogsService,
        public facadeService: FacadeService, // private storage: AngularFireStorage,
    ) {

    }

    async ngOnInit() {
        // this.logger.log('ViewCourseComponent initialized', 'INFO');
        // this.addNewTee()
        // this.setHoles(18);
        // this.googleMapsApiLoaded$ = this.googleMapsApiSerivce.loadApi().pipe(shareReplay());
        this.countries = countries;
        //console.log(this.listCountries);
        this.route.paramMap.subscribe((params) => {
            this.courseID = params.get("id");
        });
        //console.log(this.courseID);
        this.courseForm = new FormGroup({
            courseName: new FormControl("", [
                Validators.required,
                Validators.maxLength(60),
            ]),
            country: new FormControl("", [
                Validators.required,
                Validators.maxLength(30),
            ]),
            city: new FormControl("", [
                Validators.required,
                Validators.maxLength(30),
            ]),
            noOfHoles: new FormControl("18", [Validators.required]),
        });

        this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        this.panels = [
            {
                id: '0',
                icon: 'heroicons_outline:star',
                title: 'Add Course',
                description:
                    'Create you courses by adding them',
            },


        ];

        if (this.courseID) {
            this.courseData = await this.facadeService.getCourseByID(
                this.courseID
            );
            //console.log(this.courseData);
            this.courseTitle = this.courseData['course'][0].name;
            this.countryName = this.courseData['course'][0].country;
            this.cityName = this.courseData['course'][0].city;
            this.NoOfHoles = this.courseData['course'][0].noOfHoles;
            this.courseForm.get('courseName').setValue(this.courseTitle);
            this.courseForm.get('country').setValue(this.countryName);
            this.countrySelected(this.countryName);
            this.courseForm.get('city').setValue(this.cityName);
            this.courseForm.get('noOfHoles').setValue(this.NoOfHoles.toString());

            this.editForm = true;
            this.url = 'golfcourse.jpg';
            // this.setHoles(this.NoOfHoles);
            this.panels = (General.getGolfCourseFeatures());
            await this.setCoursRating();
            this.addIntialsTees();
            this.setHoles(this.NoOfHoles);
            this.getCourseHoleSets();
            //console.log(this.panels);
            const country = this.countries.find(country => country.name === this.countryName);
            //  this.getLatLng(country?.code ?? '');

        } else {
            this.addNewTee();
        }

        this.listCountries = this.courseForm
            .get('country')!
            .valueChanges.pipe(
                startWith(''),
                map((value) =>
                    typeof value === 'string' ? value : value ? value.name : ''
                ),
                map((name) => (name ? this._filter(name) : this.countries.slice()))
            );

    }

    ngOnDestroy(): void {
        // this.logger.log('ViewCourseComponent destroyed', 'INFO');
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ngAfterViewInit() {
    //     this.searchPlace();
    // }

    // searchPlace() {
    //     const request = {
    //         query: this.courseTitle,
    //         fields: ["name", "geometry"],
    //     };
    //     // Access the native Google Maps object
    //     const map = this.googleMapElement.googleMap;

    //     const service = new google.maps.places.PlacesService(map)
    //     console.log(service);

    //     service.findPlaceFromQuery(
    //         request,
    //         (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
    //             if (status === google.maps.places.PlacesServiceStatus.OK && results) {
    //                 for (let i = 0; i < results.length; i++) {
    //                     console.log(results);
    //                 }
    //                 // Use the location from the result to center the map
    //                 if (results[0].geometry?.location) {
    //                     // this.center = {
    //                     //     lat: results[0].geometry.location.lat(),
    //                     //     lng: results[0].geometry.location.lng(),
    //                     // };
    //                     this.markers = [{
    //                         position: {
    //                             lat: results[0].geometry.location.lat(),
    //                             lng: results[0].geometry.location.lng(),
    //                         },
    //                         title: results[0].name,
    //                     }];
    //                     // map.setCenter(this.center);
    //                     this.filterByHole(1);
    //                 } else {
    //                     this.filterByHole(1);
    //                 }
    //             }
    //         }
    //     );
    // }
    // searchBox() {

    //     const input = document.getElementById('pac-input') as HTMLInputElement;
    //     const searchBox = new google.maps.places.Autocomplete(input);

    //     searchBox.bindTo('bounds', this.googleMapElement.googleMap as google.maps.Map);

    //     searchBox.addListener('place_changed', () => {
    //         const place = searchBox.getPlace();
    //         if (!place.geometry || !place.geometry.location) {
    //             console.error('Returned place contains no geometry');
    //             return;
    //         }

    //         // Center the map on the selected place
    //         this.center = {
    //             lat: place.geometry.location.lat(),
    //             lng: place.geometry.location.lng()
    //         };

    //         // Update the markers array to include the selected place
    //         this.markers = [{
    //             position: {
    //                 lat: place.geometry.location.lat(),
    //                 lng: place.geometry.location.lng()
    //             },
    //             title: place.name
    //         }];

    //         // Center the map on the selected place
    //         this.googleMapElement.googleMap?.setCenter(this.center);
    //         this.googleMapElement.googleMap?.setZoom(15); // Optional: zoom in to the place
    //     });

    // }
    getLatLng(address: string) {
        // this.logger.log(`getLatLng called with address: ${address}`, 'DEBUG');
        // this.googleMapsApiSerivce.getLatLng(address).subscribe(
        //     (response) => {
        //         // console.log(response);
        //         // this.center = {
        //         //     lat: response.lat,
        //         //     lng: response.lng
        //         // };
        //     },
        //     (error) => {
        //         console.error('Error fetching location', error);
        //     }
        // );
    }
    ////*******************************************************************COURSE CREATE**************************************************************************************** */
    countrySelected(event) {
        // this.logger.log('countrySelected called', 'INFO', event);
        // let obj = Country.getCity(event);

        const city = new getCity().getCity(event?.name || event);
        if (city) {
            for (let objs of city['cities']) {
                this.cities = objs.split("|");
            }
            // this.courseForm.get('city').setValue(this.cities[1]);
            // console.log(this.cities);
            this.listCity = this.courseForm
                .get('city')!
                .valueChanges.pipe(
                    startWith(''),
                    map((value) =>
                        typeof value === 'string' ? value : value ? value.name : ''
                    ),
                    map((name) => (name ? this._filterCity(name) : this.cities.slice()))
                );
        } else {
            this.courseForm.get('city').setValue(event?.name || event);
        }
    }

    onMapClick(event: any) {
        // this.logger.log('onMapClick called', 'DEBUG', event);
        //  console.log(event);
        if (event.latLng != null) {
            // this.center = event.latLng.toJSON();
            // console.log('Coordinates:', this.center.lat, this.center.lng);
        }
        var clickedHole = undefined;
        if (this.currentHoleNo !== null && this.currentLatLong && this.currentHzd == null) {
            if (this.currentHoleNo < 10) {
                clickedHole = this.holeSetfor9.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 9 && this.currentHoleNo <= 18) {
                clickedHole = this.holeSetfor18.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 18 && this.currentHoleNo <= 27) {
                clickedHole = this.holeSetfor27.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 27 && this.currentHoleNo <= 36) {
                clickedHole = this.holeSetfor36.find(hole => hole.holeNo === this.currentHoleNo);
            }
            if (clickedHole) {
                if (this.currentGreen == 1) {
                    clickedHole.greenStartLatLong = `${event.latLng.lat()}, ${event.latLng.lng()}`;
                } else if (this.currentGreen == 2) {
                    clickedHole.greenCenterLatLong = `${event.latLng.lat()}, ${event.latLng.lng()}`;
                } else {
                    clickedHole.greenEndLatLong = `${event.latLng.lat()}, ${event.latLng.lng()}`;
                }
            }
        } else if (this.currentHoleNo !== null && !this.currentLatLong && this.currentHzd == null) {
            if (this.currentHoleNo < 10) {
                clickedHole = this.holeSetfor9.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 9 && this.currentHoleNo <= 18) {
                clickedHole = this.holeSetfor18.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 18 && this.currentHoleNo <= 27) {
                clickedHole = this.holeSetfor27.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 27 && this.currentHoleNo <= 36) {
                clickedHole = this.holeSetfor36.find(hole => hole.holeNo === this.currentHoleNo);
            }
            if (clickedHole) {
                clickedHole['tee_lat_long'][this.currentTee] = `${event.latLng.lat()}, ${event.latLng.lng()}`;
            }
        } else if (this.currentHzd != null) {
            if (this.currentHoleNo < 10) {
                clickedHole = this.holeSetfor9.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 9 && this.currentHoleNo <= 18) {
                clickedHole = this.holeSetfor18.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 18 && this.currentHoleNo <= 27) {
                clickedHole = this.holeSetfor27.find(hole => hole.holeNo === this.currentHoleNo);
            } else if (this.currentHoleNo > 27 && this.currentHoleNo <= 36) {
                clickedHole = this.holeSetfor36.find(hole => hole.holeNo === this.currentHoleNo);
            }
            let hzard = clickedHole.hazards.find(hole => hole.hazardId === this.currentHzdId);
            hzard['lat_long'] = `${event.latLng.lat()}, ${event.latLng.lng()}`;;
        }
    }

    onGreenStartLat(holeNo: number, latLong): void {
        // this.logger.log(`onGreenStartLat called for holeNo: ${holeNo} with latLong: ${latLong}`, 'DEBUG');
        this.currentHoleNo = holeNo;
        this.currentGreen = 1;
        this.currentLatLong = true;
        if (typeof (latLong) == 'string') {
            const [lat, lng] = latLong.split(',').map(Number);
            if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            }
        }
        // this.focusMap();
    }
    onGreenCenterLat(holeNo: number, latLong): void {
        // this.logger.log(`onGreenCenterLat called for holeNo: ${holeNo} with latLong: ${latLong}`, 'DEBUG');
        this.currentHoleNo = holeNo;
        this.currentGreen = 2;
        if (typeof (latLong) == 'string') {
            const [lat, lng] = latLong.split(',').map(Number);
            if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            }
        }
        // this.focusMap();
    }
    onGreenEndLat(holeNo: number, latLong): void {
        // this.logger.log(`onGreenEndLat called for holeNo: ${holeNo} with latLong: ${latLong}`, 'DEBUG');
        this.currentHoleNo = holeNo;
        this.currentGreen = 3;
        if (typeof (latLong) == 'string') {
            const [lat, lng] = latLong.split(',').map(Number);
            if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            }
        }
        // this.focusMap();
    }
    // focusMap(): void {
    //     if (this.googleMapContainer && this.googleMapContainer.nativeElement) {
    //         const mapDiv = this.googleMapContainer.nativeElement.querySelector('div');
    //         if (mapDiv) {
    //             mapDiv.tabIndex = -1; // Make the div focusable
    //             mapDiv.focus();
    //             this.mapTypeId = google.maps.MapTypeId.SATELLITE;
    //         }
    //     }
    // }
    filterByHole(holeNo) {
        // this.logger.log(`filterByHole called with holeNo: ${holeNo}`, 'DEBUG');
        this.currentHoleNo = holeNo;
        let greenStartLatLong;
        if (this.currentHoleNo < 10) {
            greenStartLatLong = this.holeSetfor9.find(hole => hole.holeNo === this.currentHoleNo);
        } else if (this.currentHoleNo > 9 && this.currentHoleNo <= 18) {
            greenStartLatLong = this.holeSetfor18.find(hole => hole.holeNo === this.currentHoleNo);
        } else if (this.currentHoleNo > 18 && this.currentHoleNo <= 27) {
            greenStartLatLong = this.holeSetfor27.find(hole => hole.holeNo === this.currentHoleNo);
        } else if (this.currentHoleNo > 27 && this.currentHoleNo <= 36) {
            greenStartLatLong = this.holeSetfor36.find(hole => hole.holeNo === this.currentHoleNo);
        }
        if (greenStartLatLong) {
            const [lat, lng] = greenStartLatLong.greenCenterLatLong.split(',').map(Number);
            if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            }
            // this.center = greenStartLatLong.greenCenterLatLong
        }
        // this.focusMap();
    }
    private _filter(value: string) {
        // this.logger.log(`_filter called with value: ${value}`, 'DEBUG');
        if (value) {
            const filterValue = value.toLowerCase();
            return this.countries.filter(
                (option) => option.name.toLowerCase().indexOf(filterValue) === 0
            );
        }
        return this.countries;
    }

    private _filterCity(value: string) {
        // this.logger.log(`_filterCity called with value: ${value}`, 'DEBUG');
        if (value) {
            const filterValue = value.toLowerCase();
            return this.cities.filter(
                (option) => option.toLowerCase().indexOf(filterValue) === 0
            );
        }
        return this.cities;
    }

    displayFn(country): string {
        // this.logger.log(`displayFn called with country: ${JSON.stringify(country)}`, 'DEBUG');
        return typeof country === 'string' ? country : country ? country.name : '';
    }
    displayCity(city): string {
        // this.logger.log(`displayCity called with city: ${JSON.stringify(city)}`, 'DEBUG');
        return typeof city === 'string' ? city : city ? city : '';
    }

    public createCourse = async () => {
        // this.logger.log('createCourse called', 'INFO');
        let playerFormValue = this.courseForm.getRawValue();
        let course = {
            id: UniqueIdGenerator.generate(),
            clubId: this._localStorage.isClubAdmin() ? this.loggedInuser.adminClubId : null,
            name: playerFormValue.courseName,
            country: playerFormValue.country.name || playerFormValue.country,
            noOfHoles: playerFormValue.noOfHoles,
            teeDistanceUnit: "YARDS",
            par: "72",
            city: playerFormValue.city,
            createdBy: this.loggedInuser?.id,
            status: 'In Review',
        };
        const country = this.countries.find(country => country.name === course.country);
        //  this.getLatLng(country?.code ?? '');
        if (this.courseID) {
            let courses = {
                id: this.courseID,
                clubId: this._localStorage.isClubAdmin() ? this.loggedInuser.adminClubId : null,
                name: playerFormValue.courseName,
                country: playerFormValue.country.name || playerFormValue.country,
                noOfHoles: playerFormValue.noOfHoles,
                teeDistanceUnit: "YARDS",
                par: '72',
                countryGeonameId: 565656,
                cityGeonameId: 787878,
                city: playerFormValue.city,
                createdBy: this.loggedInuser?.id,
            };

            const isSuccess = <boolean>(
                await this.facadeService.updateCourse(courses, []));
            if (isSuccess) {
                // this.logger.log('Course updated successfully', 'INFO', courses);
                this.saveTees();
                this.goToPanel('1');
            } else {
                this.snackBar.open("Course Not Updated!", "x", {
                    duration: 5000,
                });
                // this.logger.log('Course update failed', 'ERROR', courses);
            }
        } else {
            const isSuccess = <boolean>await this.facadeService.AddCourse(course);
            if (isSuccess) {
                // this.logger.log('Course created successfully', 'INFO', course);
                this.courseID = course.id;
                this.saveTees();
                this.NoOfHoles = Number(course.noOfHoles);
                this.goToPanel('1');
            } else {
                this.snackBar.open("Error! Please try again later.", "x", {
                    duration: 5000,
                });
                // this.logger.log('Course creation failed', 'ERROR', course);
            }
        }
        // }
    };
    ////*******************************************************************TEE COLOR SAVE**************************************************************************************** */

    get courseName() {
        // this.logger.log('Getting courseName', 'DEBUG');
        return this.courseForm.get("courseName");
    }
    get country() {
        // this.logger.log('Getting country', 'DEBUG');
        return this.courseForm.get("country");
    }
    get city() {
        // this.logger.log('Getting city', 'DEBUG');
        return this.courseForm.get("city");
    }
    /**
     * addIntialsTees
     */
    async addIntialsTees() {
        // this.logger.log('addIntialsTees called', 'INFO');
        let tee = await this.facadeService.getTeesOfCourse(this.courseID);
        console.log(tee);
        this.tees = [];
        this.Tee = [];
        if (tee['course_tees'].length > 0) {
            for (let obj of tee['course_tees']) {
                let tee = {
                    id: UniqueIdGenerator.generate(),
                    name_by_club: obj.name_by_club,
                    color: obj.color,
                    tee_id: obj['tee_name'].key,
                    '18_hole_course_rating': this.coursRating.find(a => a.courseHoleSets == 3 && obj.tee_id==a.tee_id)?.courseRating ?? '',
                    '18_hole_slope_rating': this.coursRating.find(a => a.courseHoleSets == 3 && obj.tee_id==a.tee_id)?.slopeRating ?? '',
                    '9_hole_front_course_rating': this.coursRating.find(a => a.courseHoleSets == 1 && obj.tee_id==a.tee_id)?.courseRating ?? '',
                    '9_hole_front_slope_rating': this.coursRating.find(a => a.courseHoleSets == 1 && obj.tee_id==a.tee_id)?.slopeRating ?? '',
                    '9_hole_back_course_rating': this.coursRating.find(a => a.courseHoleSets == 2 && obj.tee_id==a.tee_id)?.courseRating ?? '',
                    '9_hole_back_slope_rating': this.coursRating.find(a => a.courseHoleSets == 2 && obj.tee_id==a.tee_id)?.slopeRating ?? '',
                };
                this.Tee.push(tee);
            }
            console.log(this.Tee);
            this.tees =
                await this.facadeService.getCourseInformationForForm(
                    this.courseID
                );
            this.showTees = [];
            let item = this.tees['course'][0]['TeesQL'];
            for (let obj of item) {
                item = {
                    name_by_club: obj.name_by_club,
                    id: obj.tee_id,
                };
                this.showTees.push(item);
            }
        } else {
            for (let index = 0; index <= 4; index++) {
                let tee: any = General.getCourseTee(index);
                this.Tee[this.Tee.length] = [];
                this.Tee[this.Tee.length - 1]['id'] = UniqueIdGenerator.generate();
                this.Tee[this.Tee.length - 1]['tee_id'] = tee.tee_id;
                this.Tee[this.Tee.length - 1]['name_by_club'] = tee.name;
                this.Tee[this.Tee.length - 1]['color'] = tee.color;
            }

        }

    }

    /**
     * onTeeAddChange
     */
    addNewTee() {
        // this.logger.log('addNewTee called', 'INFO');
        let tee: any = General.getCourseTee(this.Tee.length);
        this.Tee[this.Tee.length] = [];
        this.Tee[this.Tee.length - 1]['id'] = UniqueIdGenerator.generate();
        this.Tee[this.Tee.length - 1]['tee_id'] = tee.tee_id;
        this.Tee[this.Tee.length - 1]['name_by_club'] = '';
        this.Tee[this.Tee.length - 1]['18_hole_course_rating'] = '';
        this.Tee[this.Tee.length - 1]['18_hole_slope_rating'] = '';
        this.Tee[this.Tee.length - 1]['9_hole_front_course_rating'] = '';
        this.Tee[this.Tee.length - 1]['9_hole_front_slope_rating'] = '';
        this.Tee[this.Tee.length - 1]['9_hole_back_course_rating'] = '';
        this.Tee[this.Tee.length - 1]['9_hole_back_slope_rating'] = '';
        //console.log(this.Tee);
    }

    updateTeeValue(id: string, value: any, field: string) {
        // this.logger.log(`updateTeeValue called for ID: ${id}, value: ${value}, field: ${field}`, 'DEBUG');
        const index = this.Tee.findIndex((t: any) => t.id === id);

        if (index === -1) {
            return;
        }

        // Convert empty string to null for number fields
        if (value === '') {
            value = null;
        }

        value = value !== null ? Number(value) : null

        this.Tee[index][field] = value;

        this.syncCourseRatings();
    }

    /**
     * onTeeColorChange
     */
    public onTeeColor(val, teeID) {
        // this.logger.log(`onTeeColor called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Tee) {
            if (obj.id == teeID) {
                this.Tee[index]['color'] = val;
            }
            index++;
        }
    }
    /**
     * onTeeNameChange
     */
    public onTeeName(val, teeID) {
        // this.logger.log(`onTeeName called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Tee) {
            if (obj.id == teeID) {
                this.Tee[index]['name_by_club'] = val;
            }
            index++;
        }
    }
    /**
     * onTeeSelectionChange
     */
    public teeChange(event, teeID) {
        // this.logger.log(`teeChange called for teeID: ${teeID}, event: ${JSON.stringify(event)}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Tee) {
            if (obj.id == teeID) {
                this.Tee[index]['tee_id'] = event.value;
            }
            index++;
        }
    }
    /**
     * deleteTee
     */
    public deleteTee(teeID) {
        // this.logger.log(`deleteTee called for teeID: ${teeID}`, 'INFO');
        this.deleteTsee = this.Tee.filter((a) => a.id != teeID);
        let deletedTee = this.Tee.filter((a) => a.id == teeID);
        this.teeRemove.push(deletedTee[0]);
        //console.log(this.teeRemove);
        //console.log(this.deleteTsee);
        //console.log(this.Tee);

        this.Tee = this.deleteTsee;
    }
    /**
     * SaveAllTees
     */
    public saveTees = async () => {
        // this.logger.log('saveTees called', 'INFO');
        let today: Date = new Date();
        let teeObj = [];
        let teeObjtoDelete = [];

        //console.log(this.teeRemove);
        //console.log(this.deleteTsee);
        //console.log(this.Tee);

        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);

        this.Tee.forEach((obj, index) => {
            let roundTeeId: any = General.getPlayersTe(obj.tee_id);
            let tee = {
                tee_order: index + 1,
                course_id: this.courseID,
                tee_id: roundTeeId.id,
                color: obj.color ? obj.color : '#ffffff',
                name_by_club: obj.name_by_club,
                created_at: General.parseToDate(todayDate.toDateString())
            };
            teeObj.push(tee);
        });
        if (this.teeRemove) {
            for (let obj of this.teeRemove) {
                let roundTeeId: any = General.getPlayersTe(
                    obj.tee_id ? obj.tee_id : 'Amateurs'
                );
                // let tee = {
                //   tee_id: roundTeeId.id,
                // };
                teeObjtoDelete.push(roundTeeId.id);
            }
        }

        //console.log(teeObjtoDelete);
        //console.log(teeObj);

        try {
            let saveTeeColor = <boolean>(
                await this.facadeService.saveTeeColor(teeObj)
            );
            if (teeObjtoDelete.length > 0) {
                let deleteTeeColor = <boolean>(
                    await this.facadeService.deleteTeeColor(
                        this.courseID,
                        teeObjtoDelete
                    )
                );
                // this.logger.log('Tee colors deleted successfully', 'INFO', teeObjtoDelete);
            }
            if (saveTeeColor) {
                // this.logger.log('Tee colors saved successfully', 'INFO');
                this.goToPanel('2');
                this.saveHoles();
            } else {
                this.snackBar.open('Tees Color has not Saved!', 'x', {
                    duration: 5000,
                });
                // this.logger.log('Tee colors failed to save', 'ERROR');
            }
        } catch (error) {
            // this.logger.log('Error saving tees', 'ERROR', error);
            this.snackBar.open('Error saving tees!', 'x', {
                duration: 5000,
            });
        }
    };
    ////*******************************************************************TEE COLOR SAVE**************************************************************************************** */
    ////*******************************************************************TEE HOLES SAVE**************************************************************************************** */


    holesChange(event: any) {
        // this.logger.log('holesChange called', 'INFO', event);
        const noOfHoles = Number(event.value);
        this.NoOfHoles = noOfHoles;
        if (noOfHoles == 9) {
            this.NoOfCols = noOfHoles + 3;
        } else {
            this.NoOfCols = noOfHoles + 4;
        }
    }

    async setHoles(Number: number) {
        // this.logger.log(`setHoles called with Number: ${Number}`, 'INFO');
        console.log(Number);
        let holes = await this.facadeService.getCourseHole(this.courseID);
        console.log(holes['HolesQL']);

        if (holes['HolesQL'].length > 0) {
            let holeCount = holes['HolesQL'][0].holes;
            if (this.NoOfHoles > 8) {
                this.holeSetfor9 = [];
                this.setName9 = holes['HolesQL'][0].displayName;
                for (let index = 0; index <= 8; index++) {
                    let hazards = holeCount[index].hazards;
                    if (holeCount[index].indexWomen != null) {
                        this.showholeindexforWomen = true;
                    }
                    let hole: any = {
                        displayName: holes['HolesQL'][0].displayName,
                        id: holeCount[index].id,
                        holeNo: holeCount[index].holeNo,
                        par: holeCount[index].par,
                        index: holeCount[index].index,
                        indexForW: holeCount[index].indexWomen,
                        holeSetId: holeCount[index].holeSetId,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${holeCount[index].greenStartLat ?? 0},${holeCount[index].greenStartLong ?? 0} `,
                        greenCenterLatLong: `${holeCount[index].greenCenterLat ?? 0},${holeCount[index].greenCenterLong ?? 0} `,
                        greenEndLatLong: `${holeCount[index].greenEndLat ?? 0},${holeCount[index].greenEndLong ?? 0} `,
                        hazards: this.getHoleHazards(hazards),
                    };
                    for (let meta of holes['HolesQL'][0]['holes'][index].meta) {
                        hole.teeDistances[(meta['tee_name'].name).toUpperCase()] = meta.tee_distance;
                        hole.tee_lat_long[(meta['tee_name'].name).toUpperCase()] = `${meta.tee_lat ?? 0},${meta.tee_long ?? 0}`;
                    }
                    this.nineHoleTotalPar += parseInt(hole.par);
                    this.holeSetfor9.push(hole);
                }
                // const finalHazards = [].concat(...hazards);
                // console.log(finalHazards);
                // const maxHazardNo = finalHazards.reduce((max, hazard) => (hazard.hazardNo > max ? hazard.hazardNo : max), 0);

                // for (let i = 1; i <= maxHazardNo; i++) {
                //     this.addHazards(this.holeSetfor9Hazards, this.holeSetfor9, finalHazards, i);
                // }
                //this.getHoleHazards(this.holeSetfor9, 1, hazards)
            }
            if (this.NoOfHoles > 9) {

                this.setName18 = holes['HolesQL'][1].displayName
                let holeCount = holes['HolesQL'][1].holes;
                this.showholeSetfor18 = true;
                this.holeSetfor18 = [];
                for (let index = 0; index <= 8; index++) {
                    let hazards = (holeCount[index].hazards)
                    let hole: any = {
                        displayName: holes['HolesQL'][1].displayName,
                        id: holeCount[index].id,
                        holeNo: holeCount[index].holeNo,
                        par: holeCount[index].par,
                        index: holeCount[index].index,
                        indexForW: holeCount[index].indexWomen,
                        holeSetId: holeCount[index].holeSetId,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${holeCount[index].greenStartLat ?? 0},${holeCount[index].greenStartLong ?? 0} `,
                        greenCenterLatLong: `${holeCount[index].greenCenterLat ?? 0},${holeCount[index].greenCenterLong ?? 0} `,
                        greenEndLatLong: `${holeCount[index].greenEndLat ?? 0},${holeCount[index].greenEndLong ?? 0} `,
                        hazards: this.getHoleHazards(hazards),
                    };
                    for (let meta of holes['HolesQL'][1]['holes'][index].meta) {
                        hole.teeDistances[(meta['tee_name'].name).toUpperCase()] = meta.tee_distance;
                        hole.tee_lat_long[(meta['tee_name'].name).toUpperCase()] = `${meta.tee_lat ?? 0},${meta.tee_long ?? 0}`;
                    }
                    this.eighteenHoleTotalPar += parseInt(hole.par);
                    this.holeSetfor18.push(hole);
                }
                //     const finalHazards = [].concat(...hazards);
                //     console.log(finalHazards);
                //     const maxHazardNo = finalHazards.reduce((max, hazard) => (hazard.hazardNo > max ? hazard.hazardNo : max), 0);

                //     for (let i = 1; i <= maxHazardNo; i++) {
                //         this.addHazards(this.holeSetfor18Hazards, this.holeSetfor18, finalHazards, i);
                //     }
            }
            if (this.NoOfHoles > 18) {

                this.setName27 = holes['HolesQL'][2].displayName
                let holeCount = holes['HolesQL'][2].holes;
                this.showholeSetfor27 = true;
                this.holeSetfor27 = [];
                for (let index = 0; index <= 8; index++) {
                    let hazards = (holeCount[index].hazards)
                    let hole: any = {
                        displayName: holes['HolesQL'][2].displayName,
                        id: holeCount[index].id,
                        holeNo: holeCount[index].holeNo,
                        par: holeCount[index].par,
                        index: holeCount[index].index,
                        indexForW: holeCount[index].indexWomen,
                        holeSetId: holeCount[index].holeSetId,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${holeCount[index].greenStartLat ?? 0},${holeCount[index].greenStartLong ?? 0} `,
                        greenCenterLatLong: `${holeCount[index].greenCenterLat ?? 0},${holeCount[index].greenCenterLong ?? 0} `,
                        greenEndLatLong: `${holeCount[index].greenEndLat ?? 0},${holeCount[index].greenEndLong ?? 0} `,
                        hazards: this.getHoleHazards(hazards),
                    };
                    for (let meta of holes['HolesQL'][2]['holes'][index].meta) {
                        hole.teeDistances[(meta['tee_name'].name).toUpperCase()] = meta.tee_distance;
                        hole.tee_lat_long[(meta['tee_name'].name).toUpperCase()] = `${meta.tee_lat ?? 0},${meta.tee_long ?? 0}`;
                    }
                    this.twentysevenHoleTotalPar += parseInt(hole.par);
                    this.holeSetfor27.push(hole);
                }
                // const finalHazards = [].concat(...hazards);
                // console.log(finalHazards);
                // const maxHazardNo = finalHazards.reduce((max, hazard) => (hazard.hazardNo > max ? hazard.hazardNo : max), 0);

                // for (let i = 1; i <= maxHazardNo; i++) {
                //     this.addHazards(this.holeSetfor18Hazards, this.holeSetfor18, finalHazards, i);
                // }
            }
            if (this.NoOfHoles > 27) {

                this.setName36 = holes['HolesQL'][3].displayName
                let holeCount = holes['HolesQL'][3].holes;
                this.showholeSetfor36 = true;
                this.holeSetfor36 = [];
                for (let index = 0; index <= 8; index++) {
                    let hazards = (holeCount[index].hazards)
                    let hole: any = {
                        displayName: holes['HolesQL'][3].displayName,
                        id: holeCount[index].id,
                        holeNo: holeCount[index].holeNo,
                        par: holeCount[index].par,
                        index: holeCount[index].index,
                        indexForW: holeCount[index].indexWomen,
                        holeSetId: holeCount[index].holeSetId,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${holeCount[index].greenStartLat ?? 0},${holeCount[index].greenStartLong ?? 0} `,
                        greenCenterLatLong: `${holeCount[index].greenCenterLat ?? 0},${holeCount[index].greenCenterLong ?? 0} `,
                        greenEndLatLong: `${holeCount[index].greenEndLat ?? 0},${holeCount[index].greenEndLong ?? 0} `,
                        hazards: this.getHoleHazards(hazards),
                    };
                    for (let meta of holes['HolesQL'][3]['holes'][index].meta) {
                        hole.teeDistances[(meta['tee_name'].name).toUpperCase()] = meta.tee_distance;
                        hole.tee_lat_long[(meta['tee_name'].name).toUpperCase()] = `${meta.tee_lat ?? 0},${meta.tee_long ?? 0}`;
                    }
                    this.thirtySixHoleTotalPar += parseInt(hole.par);

                    this.holeSetfor36.push(hole);
                }
                // const finalHazards = [].concat(...hazards);
                // console.log(finalHazards);
                // const maxHazardNo = finalHazards.reduce((max, hazard) => (hazard.hazardNo > max ? hazard.hazardNo : max), 0);

                // for (let i = 1; i <= maxHazardNo; i++) {
                //     this.addHazards(this.holeSetfor36Hazards, this.holeSetfor36, finalHazards, i);
                // }
            }
        } else {
            if (Number > 8) {
                this.holeSetfor9 = [];
                for (let index = 1; index <= 9; index++) {
                    let hole: any = {
                        id: UniqueIdGenerator.generate(),
                        holeNo: index,
                        displayName: 'Front-9',
                        par: 0,
                        index: 0,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${0},${0} `,
                        greenCenterLatLong: `${0},${0} `,
                        greenEndLatLong: `${0},${0} `,
                        hazards: [],
                    };

                    this.holeSetfor9.push(hole);
                }
                this.setName9 = 'Front-9';
            }
            if (Number > 9) {
                this.showholeSetfor18 = true;
                this.holeSetfor18 = [];
                for (let index = 10; index <= 18; index++) {
                    let hole: any = {
                        id: UniqueIdGenerator.generate(),
                        holeNo: index,
                        displayName: 'Back-9',
                        par: 0,
                        index: 0,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${0},${0} `,
                        greenCenterLatLong: `${0},${0} `,
                        greenEndLatLong: `${0},${0} `,
                        hazards: [],
                    };

                    this.holeSetfor18.push(hole);
                }
                this.setName18 = 'Back-9';
            }
            if (Number > 18) {
                this.showholeSetfor27 = true;
                this.holeSetfor27 = [];
                for (let index = 19; index <= 27; index++) {
                    let hole: any = {
                        id: UniqueIdGenerator.generate(),
                        holeNo: index,
                        displayName: null,
                        par: 0,
                        index: 0,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${0},${0} `,
                        greenCenterLatLong: `${0},${0} `,
                        greenEndLatLong: `${0},${0} `,
                        hazards: [],
                    };

                    this.holeSetfor27.push(hole);
                }
            }
            if (Number > 27) {
                this.showholeSetfor36 = true;
                this.holeSetfor36 = [];
                for (let index = 28; index <= 36; index++) {
                    let hole: any = {
                        id: UniqueIdGenerator.generate(),
                        holeNo: index,
                        displayName: null,
                        par: 0,
                        index: 0,
                        teeDistances: {},
                        tee_lat_long: {},
                        greenStartLatLong: `${0},${0} `,
                        greenCenterLatLong: `${0},${0} `,
                        greenEndLatLong: `${0},${0} `,
                        hazards: [],
                    };

                    this.holeSetfor36.push(hole);
                }
            }
        }

    }
    /**
     * onParInput
     */
    public onParInput(par: any, holeNo: any) {
        // this.logger.log(`onParInput called for holeNo: ${holeNo}, par: ${par}`, 'DEBUG');
        //console.log(holeNo);
        par = par != '' ? par : 0;
        let index = 0;
        if (holeNo <= 9) {
            this.nineHoleTotalPar = 0;
            for (let obj of this.holeSetfor9) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor9[index]['par'] = par;
                }
                this.nineHoleTotalPar += parseInt(this.holeSetfor9[index]['par'] || 0)
                index++;
            }
        } else if (holeNo <= 18) {
            this.eighteenHoleTotalPar = 0;
            for (let obj of this.holeSetfor18) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor18[index]['par'] = par;
                }
                this.eighteenHoleTotalPar += parseInt(this.holeSetfor18[index]['par'] || 0)
                index++;
            }
        } else if (holeNo <= 27) {
            this.twentysevenHoleTotalPar = 0;
            for (let obj of this.holeSetfor27) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor27[index]['par'] = par;
                }
                this.twentysevenHoleTotalPar += parseInt(this.holeSetfor27[index]['par'] || 0)
                index++;
            }
        } else if (holeNo <= 36) {
            this.thirtySixHoleTotalPar = 0;
            for (let obj of this.holeSetfor36) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor36[index]['par'] = par;
                }
                this.thirtySixHoleTotalPar += parseInt(this.holeSetfor36[index]['par'] || 0)
                index++;
            }
        }
    }

    teeYardageFront9(tee: any): number {
        // this.logger.log(`teeYardageFront9 called with tee: ${JSON.stringify(tee)}`, 'DEBUG');
        if (!this.holeSetfor9?.length) {
            return 0;
        }

        return this.holeSetfor9.reduce((total, hole) => {
            const yardage =
                hole?.teeDistances?.[tee.tee_id];

            return total + (yardage ? Number(yardage) : 0);
        }, 0);
    }

    teeYardageBack9(tee: any): number {
        // this.logger.log(`teeYardageBack9 called with tee: ${JSON.stringify(tee)}`, 'DEBUG');
        if (!this.holeSetfor18?.length) {
            return 0;
        }

        return this.holeSetfor18.reduce((total, hole) => {
            const yardage =
                hole?.teeDistances?.[tee.tee_id];

            return total + (yardage ? Number(yardage) : 0);
        }, 0);
    }

    teeYardageTotal(tee: any): number {
        // this.logger.log(`teeYardageTotal called with tee: ${JSON.stringify(tee)}`, 'DEBUG');
        return this.teeYardageFront9(tee) + this.teeYardageBack9(tee);
    }

    totalParFront9(): number {
        // this.logger.log('totalParFront9 called', 'DEBUG');
        if (!this.holeSetfor9?.length) {
            return 0;
        }

        return this.holeSetfor9.reduce((total, hole) => {
            return total + (hole.par ? Number(hole.par) : 0);
        }, 0);
    }

    totalParBack9(): number {
        // this.logger.log('totalParBack9 called', 'DEBUG');
        if (!this.holeSetfor18?.length) {
            return 0;
        }

        return this.holeSetfor18.reduce((total, hole) => {
            return total + (hole.par ? Number(hole.par) : 0);
        }, 0);
    }

    totalPar(): number {
        // this.logger.log('totalPar called', 'DEBUG');
        return this.totalParFront9() + this.totalParBack9();
    }

    /**
     * onTeeInput
     */
    public onTeeInput(dist: any, tee_id: any, hole_id: any, holeSet: any) {
        // this.logger.log(`onTeeInput called with dist: ${dist}, tee_id: ${tee_id}, hole_id: ${JSON.stringify(hole_id)}, holeSet: ${holeSet}`, 'DEBUG');

        if (holeSet == 9) {
            let hole = this.holeSetfor9.filter((hole) => { return hole.id == hole_id.id });
            hole[0]['teeDistances'][tee_id] = dist;
        } else if (holeSet == 18) {
            let hole = this.holeSetfor18.filter((hole) => { return hole.id == hole_id.id });
            hole[0]['teeDistances'][tee_id] = dist;
        } else if (holeSet == 27) {
            let hole = this.holeSetfor27.filter((hole) => { return hole.id == hole_id.id });
            hole[0]['teeDistances'][tee_id] = dist;
        } else if (holeSet == 36) {
            let hole = this.holeSetfor36.filter((hole) => { return hole.id == hole_id.id });
            hole[0]['teeDistances'][tee_id] = dist;
        }
    }
    /**
     * onTeeInput
     */
    public onTeeLatLong(dist: any, tee_id: any, hole_id: any, holeSet: any) {
        // this.logger.log(`onTeeLatLong called with dist: ${dist}, tee_id: ${tee_id}, hole_id: ${JSON.stringify(hole_id)}, holeSet: ${holeSet}`, 'DEBUG');
        this.currentHoleNo = hole_id.holeNo;
        this.currentLatLong = false;
        this.currentTee = tee_id;
        // this.focusMap();
    }
    private isIndexUnique(val: any, holes): boolean {
        // this.logger.log(`isIndexUnique called with val: ${val}, holes: ${JSON.stringify(holes)}`, 'DEBUG');
        // Extract index values from holeSetfor9
        const indexValues = holes.map(obj => obj['index']);

        // Check if the input value is unique
        return indexValues.indexOf(Number(val)) === indexValues.lastIndexOf(val);
    }
    private areIndexesUnique(...holeSets: any[][]): boolean {
        // this.logger.log(`areIndexesUnique called with ${holeSets.length} hole sets`, 'DEBUG');
        // Check uniqueness for each set of holes
        for (const holeSet of holeSets) {
            // Extract index values from the current holeSet
            const indexValues = holeSet.map(obj => Number(obj['index']));

            // Check if all index values are unique
            if (indexValues.length !== new Set(indexValues).size) {
                return false; // Return false if duplicates found
            }
        }

        // If all sets of holes have unique indexes, return true
        return true;
    }

    addHazards(holeSet: any, holeNo: any) {
        // this.logger.log(`addHazards called for holeNo: ${holeNo}`, 'INFO', holeSet);
        console.log(holeSet);
        let holeHazards;
        if (holeNo < 10) {
            holeHazards = this.holeSetfor9.find(hole => hole.holeNo === holeNo);
        } else if (holeNo > 9 && holeNo <= 18) {
            holeHazards = this.holeSetfor18.find(hole => hole.holeNo === holeNo);
        } else if (holeNo > 18 && holeNo <= 27) {
            holeHazards = this.holeSetfor27.find(hole => hole.holeNo === holeNo);
        } else if (holeNo > 27 && holeNo <= 36) {
            holeHazards = this.holeSetfor36.find(hole => hole.holeNo === holeNo);
        }
        if (holeHazards) {
            holeHazards.hazards.push({
                hazardId: UniqueIdGenerator.generate(),
                hazardNo: holeHazards.hazards.length + 1,
                lat_long: `${0},${0}`,
                holeId: holeHazards.id,
            });
        }
    }
    getHoleHazards(hazards = []) {
        // this.logger.log('getHoleHazards called', 'DEBUG', hazards);
        let updatedHoles = [];
        for (let hzd of hazards) {
            let obj = {
                hazardId: hzd.hazardId,
                hazardNo: hzd.hazardNo,
                lat_long: `${hzd.lat},${hzd.lng}`,
                holeId: hzd.holeId,
            }
            updatedHoles.push(obj)
        }
        return updatedHoles;
    }
    public onHazardsChange(val: any, hzrd: any) {
        // this.logger.log(`onHazardsChange called with val: ${val}, hzrd: ${JSON.stringify(hzrd)}`, 'DEBUG');
        console.log(val);
        console.log(hzrd);
        this.currentHzd = hzrd;
        this.currentHzdId = hzrd.hazardId;
        if (typeof (hzrd.lat_long) == 'string') {
            const [lat, lng] = hzrd.lat_long.split(',').map(Number);
            if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            }
        }
        // this.focusMap();

    }
    /**
     * onIndexInput
     */
    public onIndexInput(val: any, holeNo: any) {
        // this.logger.log(`onIndexInput called for holeNo: ${holeNo}, value: ${val}`, 'DEBUG');
        //console.log(holeNo);
        let index = 0;
        if (holeNo <= 9) {
            const isUnique = this.isIndexUnique(val, this.holeSetfor9);
            const spanElement = document.getElementById(`index_${holeNo} `);
            if (!isUnique && spanElement) {
                spanElement.style.backgroundColor = isUnique ? 'white' : 'red';
            }
            for (let obj of this.holeSetfor9) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor9[index]['index'] = val;
                    // if (this.showholeindexforWomen) {
                    //     this.holeSetfor9[index]['indexForW'] = val;
                    // }
                    break;
                }
                index++;
            }

        } else if (holeNo <= 18) {
            const isUnique = this.isIndexUnique(val, this.holeSetfor18);
            const spanElement = document.getElementById(`index_${holeNo} `);
            if (!isUnique && spanElement) {
                spanElement.style.backgroundColor = isUnique ? 'white' : 'red';
            }
            for (let obj of this.holeSetfor18) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor18[index]['index'] = val;
                    // if (this.showholeindexforWomen) {
                    //     this.holeSetfor18[index]['indexForW'] = val;
                    // }

                    break;
                }
                index++;
            }

        } else if (holeNo <= 27) {
            const isUnique = this.isIndexUnique(val, this.holeSetfor27);
            const spanElement = document.getElementById(`index_${holeNo} `);
            if (!isUnique && spanElement) {
                spanElement.style.backgroundColor = isUnique ? 'white' : 'red';
            }
            for (let obj of this.holeSetfor27) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor27[index]['index'] = val;
                    // if (this.showholeindexforWomen) {
                    //     this.holeSetfor27[index]['indexForW'] = val;
                    // }

                    break;
                }
                index++;
            }

        } else if (holeNo <= 36) {
            const isUnique = this.isIndexUnique(val, this.holeSetfor36);
            const spanElement = document.getElementById(`index_${holeNo} `);
            if (!isUnique && spanElement) {
                spanElement.style.backgroundColor = isUnique ? 'white' : 'red';
            }
            for (let obj of this.holeSetfor36) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor36[index]['index'] = val;
                    // if (this.showholeindexforWomen) {
                    //     this.holeSetfor36[index]['indexForW'] = val;
                    // }

                    break;
                }
                index++;
            }

        }
    }
    /**
     * onIndexInputForWomen
     */
    public onIndexInputForWomen(val: any, holeNo: any) {
        // this.logger.log(`onIndexInputForWomen called for holeNo: ${holeNo}, value: ${val}`, 'DEBUG');
        //console.log(holeNo);

        let index = 0;
        if (holeNo <= 9) {
            for (let obj of this.holeSetfor9) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor9[index]['indexForW'] = val;
                    break;
                }
                index++;
            }
        } else if (holeNo <= 18) {
            for (let obj of this.holeSetfor18) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor18[index]['indexForW'] = val;
                    break;
                }
                index++;
            }
        } else if (holeNo <= 27) {
            for (let obj of this.holeSetfor27) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor27[index]['indexForW'] = val;
                    break;
                }
                index++;
            }
        } else if (holeNo <= 36) {
            for (let obj of this.holeSetfor36) {
                if (holeNo == obj.holeNo) {
                    this.holeSetfor36[index]['indexForW'] = val;
                    break;
                }
                index++;
            }
        }
    }


    /**
   * selectionChange
event   */
    public addLadiesIndex() {
        // this.logger.log('addLadiesIndex called', 'INFO');
        this.showholeindexforWomen = !this.showholeindexforWomen;
        if (this.showholeindexforWomen) {
            this.holeSetfor9.forEach(function (element) {
                element['indexForW'] = null;
            });
            this.holeSetfor18.forEach(function (element) {
                element['indexForW'] = null;
            });
            this.holeSetfor27.forEach(function (element) {
                element['indexForW'] = null;
            });
            this.holeSetfor36.forEach(function (element) {
                element['indexForW'] = null;
            });
        } else {
            this.holeSetfor9.forEach(function (element) {
                delete element['indexForW'];
            });
            this.holeSetfor18.forEach(function (element) {
                delete element['indexForW'];
            });
            this.holeSetfor27.forEach(function (element) {
                delete element['indexForW'];
            });
            this.holeSetfor36.forEach(function (element) {
                delete element['indexForW'];
            });
            //console.log(this.holeSetfor9);
        }
    }

    removeLadiesIndex() {
        // this.logger.log('removeLadiesIndex called', 'INFO');
        this.showholeindexforWomen = !this.showholeindexforWomen;
        this.holeSetfor9.forEach(function (element) {
            delete element['indexForW'];
        });
        this.holeSetfor18.forEach(function (element) {
            delete element['indexForW'];
        });
        this.holeSetfor27.forEach(function (element) {
            delete element['indexForW'];
        });
        this.holeSetfor36.forEach(function (element) {
            delete element['indexForW'];
        });
        //console.log(this.holeSetfor9);

    }
    selectionChangeDistance(event) {
        // this.logger.log('selectionChangeDistance called', 'DEBUG', event);
        //console.log(event);

    }
    /**
     * tableNameInput
     */
    public tableNameInput(val: any, tableindex: any) {
        // this.logger.log(`tableNameInput called with val: ${val}, tableindex: ${tableindex}`, 'DEBUG');
        if (tableindex == 1) {
            this.setName9 = val;
        } else if (tableindex == 10) {
            this.setName18 = val;
        } else if (tableindex == 19) {
            this.setName27 = val;
        } else {
            this.setName36 = val;
        }
    }
    /**
     * saveHoles
     */
    public saveHoles = async () => {
        // this.logger.log('saveHoles called', 'INFO');
        let holeObj = [];
        let holesToSave = [];
        let holesYardageToSave = [];
        let holeHazardsToSave = [];
        let holesSet = [];
        const holeSets = [this.holeSetfor9, this.holeSetfor18, this.holeSetfor27, this.holeSetfor36];
        const isUnique = this.areIndexesUnique(...holeSets);
        if (true) {
            if (this.NoOfHoles == 18) {
                holeObj = this.holeSetfor9.concat(this.holeSetfor18);
            } else if (this.NoOfHoles == 27) {
                holeObj = this.holeSetfor9.concat(
                    this.holeSetfor18,
                    this.holeSetfor27
                );
            } else if (this.NoOfHoles == 36) {
                holeObj = this.holeSetfor9.concat(
                    this.holeSetfor18,
                    this.holeSetfor27,
                    this.holeSetfor36
                );
            } else {
                holeObj = this.holeSetfor9;
            }
            console.log(holeObj);

            // if (this.showholeindexforWomen == false) {
            let count = holeObj.length / 9;
            let set = 1;
            this.id = [];
            let name = this.setName9;
            for (let index = 1; index <= count; index++) {
                if (index == 2) {
                    set = 2;
                    name = this.setName18;
                } else if (index == 3) {
                    set = 4;
                    name = this.setName27;
                } else if (index == 4) {
                    set = 8;
                    name = this.setName36;
                }
                var ids = General.generateUUID();
                this.id.push(ids);
                let holeSet = {
                    id: ids,
                    holeSets: set,
                    courseId: this.courseID,
                    inverted: false,
                    noOfHoles: 9,
                    displayName: name,
                    frontId: set,
                    backId: null,
                };
                holesSet.push(holeSet);
            }
            let number = 0;
            let counter = 0;
            for (let obj of holeObj) {
                let holeYards: any = General.getTeeYard(obj.teeDistances, this.Tee, this.courseID, obj.id);
                // let holeHazards = obj.hazards;
                // const [startLat, startLng, centerLat, centerLng, endLat, endLng] = General.getHoleLatLong(obj.greenStartLatLong, obj.greenCenterLatLong, obj.greenEndLatLong);
                let tee = {
                    id: obj.id,
                    courseId: this.courseID,
                    holeNo: obj.holeNo,
                    teeDistances: {},
                    teeLatLongs: {},
                    indexWomen: obj.indexForW,
                    par: obj.par ? obj.par : 0,
                    index: obj.index ? obj.index : 0,
                    holeSetId: this.id[counter],
                    greenStartLat: null,
                    greenStartLong: null,
                    greenCenterLat: null,
                    greenCenterLong: null,
                    greenEndLat: null,
                    greenEndLong: null,
                    // meta: { data: General.getTeeYards(obj.teeDistances, this.Tee,this.courseID) }
                };

                number++;
                if (number % 9 == 0) {
                    counter++;
                }
                holesToSave.push(tee);
                holesYardageToSave.push(holeYards);
                // holeHazardsToSave.push(General.getHazards(obj.hazards));
            }
            // } else {
            // let count = holeObj.length / 9;
            // let set = 1;
            // this.id = [];
            // let name = this.setName9;
            // for (let index = 1; index <= count; index++) {
            //     if (index == 2) {
            //         set = 2;
            //         name = this.setName18;
            //     } else if (index == 3) {
            //         set = 4;
            //         name = this.setName27;
            //     } else if (index == 4) {
            //         set = 8;
            //         name = this.setName36;
            //     }
            //     var ids = General.generateUUID();
            //     this.id.push(ids);
            //     let holeSet = {
            //         id: ids,
            //         holeSets: set,
            //         courseId: this.courseID,
            //         inverted: false,
            //         noOfHoles: 9,
            //         displayName: name,
            //         frontId: set,
            //         backId: null,
            //     };
            //     holesSet.push(holeSet);
            // }
            // let number = 0;
            // let counter = 0;
            // for (let obj of holeObj) {
            //     // let roundTeeId: any = General.getPlayersTe(obj.Tee);
            //     let tee = {
            //         id: obj.id,
            //         courseId: this.courseID,
            //         holeNo: obj.holeNo,
            //         teeDistances: {},
            //         teeLatLongs: {},
            //         indexWomen: obj.indexForW,
            //         par: obj.par ? obj.par : 0,
            //         index: obj.index ? obj.index : 0,
            //         holeSetId: this.id[counter],
            //     };
            //     number++;
            //     if (number % 9 == 0) {
            //         counter++;
            //     }
            //     holesToSave.push(tee);
            // }
            // }
            //console.log(holesToSave);
            //console.log(holesSet);
            console.log(holesYardageToSave);
            const mergedArray = [].concat(...holesYardageToSave);
            const mergedHazards = [].concat(...holeHazardsToSave);

            // Output the merged array
            console.log(mergedHazards);

            try {
                let succees = <boolean>(
                    await this.facadeService.saveCourseHoles(holesToSave, holesSet, mergedArray, mergedHazards)
                );
                if (succees) {
                    // this.logger.log('Course holes saved successfully', 'INFO');
                    this.initializeHoleSet();
                    this.saveHoleSets();
                } else {
                    this.snackBar.open('Course Holes has not Saved!', 'x', {
                        duration: 5000,
                    });
                    // this.logger.log('Course holes failed to save', 'ERROR');
                }
            } catch (error) {
                // this.logger.log('Error saving course holes', 'ERROR', error);
                this.snackBar.open('Error saving course holes!', 'x', {
                    duration: 5000,
                });
            }
        } else {
            this.snackBar.open('Index duplicates!', 'x', {
                duration: 5000,
            });
            // this.logger.log('Index duplicates detected, preventing save', 'WARN');
        }
    };
    ///*******************************************************************TEE HOLES SAVE**************************************************************************************** */
    ///*******************************************************************TEE HOLES-SETS SAVE**************************************************************************************** */

    /**
     * getCourseHolsSets
     */
    async getCourseHoleSets() {
        this.Hole = [];
        this.courseHoleSet =
            await this.facadeService.getCourseHoleSetsForCourse(this.courseID);
        this.holeSetforSelect = [];

        let HolesSet = this.courseHoleSet['course_hole_sets'];
        if (HolesSet && HolesSet.length > 0) {
            for (let obj of HolesSet) {
                if (obj.noOfHoles == 9) {
                    let hole = {
                        id: obj.holeSets,
                        displayName: obj.displayName,
                    };
                    this.holeSetforSelect.push(hole);
                } else {
                    let backId = this.holeSetforSelect.find(
                        (a) => a.id == obj.backId
                    );
                    let frontId = this.holeSetforSelect.find(
                        (a) => a.id == obj.frontId
                    );
                    ////console.log(id);

                    let holes = {
                        id: obj.holeSets,
                        displayName: obj.displayName,
                        backId: backId.id,
                        frontId: frontId.id,
                    };
                    this.Hole.push(holes);
                }
            }
            if (this.Hole.length == 0) {
                this.initializeHoleSet();
            }
        } else {
            this.Hole = [];
            for (let index = 0; index < 1; index++) {
                this.Hole[this.Hole.length] = [];
                this.Hole[this.Hole.length - 1]['id'] = UniqueIdGenerator.generate();
                this.Hole[this.Hole.length - 1]['displayName'] = 'Front-9 - Back-9';
                this.Hole[this.Hole.length - 1]['frontId'] = '';
                this.Hole[this.Hole.length - 1]['backId'] = '';
            }
        }

        //console.log(this.holeSetforSelect);
        //console.log(this.Hole);
    }
    /**
     * onTeeAddChange
     */
    addNewHoleSet() {
        this.Hole[this.Hole.length] = [];
        this.Hole[this.Hole.length - 1]['id'] = UniqueIdGenerator.generate();
        this.Hole[this.Hole.length - 1]['displayName'] = '';
        this.Hole[this.Hole.length - 1]['frontId'] = '';
        this.Hole[this.Hole.length - 1]['backId'] = '';
        //console.log(this.Hole);
    }
    initializeHoleSet() {
        // this.logger.log('initializeHoleSet called', 'INFO');
        this.Hole = [];
        this.Hole[this.Hole.length] = [];
        this.Hole[this.Hole.length - 1]['id'] = UniqueIdGenerator.generate();
        this.Hole[this.Hole.length - 1]['displayName'] = 'Front-9 - Back-9';
        this.Hole[this.Hole.length - 1]['frontId'] = 1;
        this.Hole[this.Hole.length - 1]['backId'] = 2;
        //console.log(this.Hole);
    }
    /**
     * onDisplayNameChange
     */
    public onDisplayNameChange(event, id) {
        // this.logger.log(`onDisplayNameChange called for id: ${id}, event: ${event}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Hole) {
            if (obj.id == id) {
                this.Hole[index]['displayName'] = event;
            }
            index++;
        }
    }
    /**
     * onfrontID
     */
    public onfrontID(event, id) {
        // this.logger.log(`onfrontID called for id: ${id}, event: ${JSON.stringify(event)}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Hole) {
            if (obj.id == id) {
                this.Hole[index]['frontId'] = event.value;
            }
            index++;
        }
    }
    /**
     * onbackID
     */
    public onbackID(event, id) {
        // this.logger.log(`onbackID called for id: ${id}, event: ${JSON.stringify(event)}`, 'DEBUG');
        let index = 0;
        for (let obj of this.Hole) {
            if (obj.id == id) {
                this.Hole[index]['backId'] = event.value;
            }
            index++;
        }
    }
    async saveHoleSets(
    ) {
        // this.logger.log('saveHoleSets called', 'INFO');
        //console.log(this.Hole);
        let HoleSetObj = [];
        for (let obj of this.Hole) {
            var holesSet = obj.frontId + obj.backId;
            let hole = {
                courseId: this.courseID,
                holeSets: holesSet,
                inverted: obj.frontId > obj.backId ? true : false,
                noOfHoles: 18,
                displayName: obj.displayName,
                frontId: obj.frontId,
                backId: obj.backId,
            };
            HoleSetObj.push(hole);
        }
        //console.log(HoleSetObj);
        try {
            let saveTeeColor = <boolean>(
                await this.facadeService.saveCourseHolesSet(HoleSetObj)
            );
            if (saveTeeColor) {
                // this.logger.log('Course hole sets saved successfully', 'INFO', HoleSetObj);
                this.savecoureRating();
                this.goToPanel('4');
            } else {
                this.snackBar.open('Course HolesSet has not Saved!', 'x', {
                    duration: 5000,
                });
                // this.logger.log('Course hole sets failed to save', 'ERROR', HoleSetObj);
            }
        } catch (error) {
            // this.logger.log('Error saving course hole sets', 'ERROR', error);
            this.snackBar.open('Error saving course hole sets!', 'x', {
                duration: 5000,
            });
        }
    }
    ///*******************************************************************TEE HOLES-SETS SAVE**************************************************************************************** */
    ///*******************************************************************TEE HOLES-META SAVE**************************************************************************************** */
    addNewTeeMeta() {
        // this.logger.log('addNewTeeMeta called', 'INFO');
        this.holeMeta[this.holeMeta.length] = [];
        this.holeMeta[this.holeMeta.length - 1]['id'] =
            UniqueIdGenerator.generate();
        this.holeMeta[this.holeMeta.length - 1]['hole_id'] = '';
        this.holeMeta[this.holeMeta.length - 1]['tee_distances'] = '';
        this.holeMeta[this.holeMeta.length - 1]['tee_lat'] = '';
        this.holeMeta[this.holeMeta.length - 1]['tee_long'] = '';
        this.holeMeta[this.holeMeta.length - 1]['tee_id'] = '';
        //console.log(this.holeMeta);
    }
    async getTeeMeta() {
        // this.logger.log('getTeeMeta called', 'INFO');
        this.holes = this.tees['course'][0]['HolesQL'];
        try {
            let teesMeta = await this.facadeService.getCourseTeeMeta(this.courseID);
            //console.log(teesMeta);
            //console.log(teesMeta['hole_tee_meta']);
            //console.log(this.holes);

            if (teesMeta['hole_tee_meta'] && teesMeta['hole_tee_meta'].length > 0) {
                this.holeMeta = [];
                for (let obj of teesMeta['hole_tee_meta']) {
                    let tee = {
                        id: UniqueIdGenerator.generate(),

                        hole_id: obj.hole_id,
                        tee_id: obj.tee_id,
                        tee_distances: obj.tee_distance,
                        tee_lat: obj.tee_lat,
                        tee_long: obj.tee_long,
                    };
                    this.holeMeta.push(tee);
                }
                // this.logger.log('Tee meta data loaded successfully', 'INFO', teesMeta['hole_tee_meta']);
            }
        } catch (error) {
            // this.logger.log('Error getting tee meta data', 'ERROR', error);
        }
    }
    HolechangeForMeta(val, teeID) {
        // this.logger.log(`HolechangeForMeta called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['hole_id'] = val;
            }
            index++;
        }
    }
    teechangeforMeta(val, teeID) {
        // this.logger.log(`teechangeforMeta called for teeID: ${teeID}, value: ${JSON.stringify(val)}`, 'DEBUG');
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_id'] = val.value;
            }
            index++;
        }
    }
    distanceChange(val, teeID) {
        // this.logger.log(`distanceChange called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_distances'] = val;
            }
            index++;
        }
    }
    LatChange(val, teeID) {
        // this.logger.log(`LatChange called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_lat'] = val;
            }
            index++;
        }
    }
    LongChange(val, teeID) {
        // this.logger.log(`LongChange called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_long'] = val;
            }
            index++;
        }
    }

    async saveTeeMeta() {
        // this.logger.log('saveTeeMeta called', 'INFO');
        let today: Date = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        let todayDate: Date = General.parseToDate(mm + '/' + dd + '/' + yyyy);
        let teeObj = [];
        //console.log(this.holeMeta);
        for (let obj of this.holeMeta) {
            let tee = {
                course_id: this.courseID,
                created_at: General.parseToDate(todayDate.toDateString()),
                hole_id: obj.hole_id,
                tee_id: obj.tee_id,
                tee_distance: obj.tee_distances,
                tee_lat: obj.tee_lat,
                tee_long: obj.tee_long,
            };
            teeObj.push(tee);
        }
        //console.log(teeObj);
        try {
            let saveTeeColor = <boolean>(
                await this.facadeService.saveCourseMetaSet(teeObj)
            );
            if (saveTeeColor) {
                this.snackBar.open('Hole Meta has been Saved!', 'x', {
                    duration: 5000,
                });
                // this.logger.log('Hole meta saved successfully', 'INFO', teeObj);
            } else {
                this.snackBar.open('Hole Meta has not Saved!', 'x', {
                    duration: 5000,
                });
                // this.logger.log('Hole meta failed to save', 'ERROR', teeObj);
            }
        } catch (error) {
            // this.logger.log('Error saving hole meta', 'ERROR', error);
            this.snackBar.open('Error saving hole meta!', 'x', {
                duration: 5000,
            });
        }
    }

    ///*******************************************************************TEE HOLES-META SAVE**************************************************************************************** */
    ///*******************************************************************TEE HOLES-Rating SAVE**************************************************************************************** */

    syncCourseRatings() {
        // this.logger.log('syncCourseRatings called', 'INFO');
        this.coursRating = []; // Reset

        this.Tee.forEach((tee: any) => {

            // 🟢 18 Hole Rating
            if (tee['18_hole_course_rating'] || tee['18_hole_slope_rating']) {
                this.coursRating.push({
                    id: UniqueIdGenerator.generate(),
                    courseHoleSets: 3,   // 18 holes
                    tee: tee.name_by_club,
                    tee_id: tee.tee_id,
                    slopeRating: tee['18_hole_slope_rating'],
                    courseRating: tee['18_hole_course_rating'],
                    coursePar: '72',
                    gender_id: ''
                });
            }

            // 🟢 Front 9 Rating
            if (tee['9_hole_front_course_rating'] || tee['9_hole_front_slope_rating']) {
                this.coursRating.push({
                    id: UniqueIdGenerator.generate(),
                    courseHoleSets: 1,   // Front 9
                    tee: tee.name_by_club,
                    tee_id: tee.tee_id,
                    slopeRating: tee['9_hole_front_slope_rating'],
                    courseRating: tee['9_hole_front_course_rating'],
                    coursePar: '36',
                    gender_id: ''
                });
            }

            // 🟢 Back 9 Rating
            if (tee['9_hole_back_course_rating'] || tee['9_hole_back_slope_rating']) {
                this.coursRating.push({
                    id: UniqueIdGenerator.generate(),
                    courseHoleSets: 2,  // Back 9
                    tee: tee.name_by_club,
                    tee_id: tee.tee_id,
                    slopeRating: tee['9_hole_back_slope_rating'],
                    courseRating: tee['9_hole_back_course_rating'],
                    coursePar: '36',
                    gender_id: ''
                });
            }

        });

        // Optional debug
        // console.log(this.coursRating);
    }

    addNewCourseRating() {
        // this.logger.log('addNewCourseRating called', 'INFO');
        this.coursRating[this.coursRating.length] = [];
        this.coursRating[this.coursRating.length - 1]['id'] =
            UniqueIdGenerator.generate();
        this.coursRating[this.coursRating.length - 1]['courseHoleSets'] = '';
        this.coursRating[this.coursRating.length - 1]['tee'] = '';
        this.coursRating[this.coursRating.length - 1]['tee_id'] = '';
        this.coursRating[this.coursRating.length - 1]['slopeRating'] = '';
        this.coursRating[this.coursRating.length - 1]['courseRating'] = '';
        this.coursRating[this.coursRating.length - 1]['coursePar'] = '';
        this.coursRating[this.coursRating.length - 1]['gender_id'] = '';
        //console.log(this.coursRating);
    }

    deleteRating(id) {
        // this.logger.log(`deleteRating called for ID: ${id}`, 'INFO');
        this.coursRating = this.coursRating.filter((rating) => rating.id !== id);
    }

    public slopeRating(val, teeID) {
        // this.logger.log(`slopeRating called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['slopeRating'] = val;
            }
            index++;
        }
    }
    public teechange(val, teeID) {
        // this.logger.log(`teechange called for teeID: ${teeID}, value: ${JSON.stringify(val)}`, 'DEBUG');
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['tee_id'] = val.value;
                for (let indexa in this.showTees) {
                    if (this.showTees[indexa].id == val.value) {
                        this.coursRating[index]['tee'] =
                            this.showTees[indexa].name;
                        break;
                    }
                }
            }
            index++;
        }
    }
    /**
     * onTeeNameChange
     */
    public courseRating(val, teeID) {
        // this.logger.log(`courseRating called for teeID: ${teeID}, value: ${val}`, 'DEBUG');
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['courseRating'] = val;
            }
            index++;
        }
    }
    /**
     * onTeeSelectionChange
     */
    public coursePar(event, teeID) {
        // this.logger.log(`coursePar called for teeID: ${teeID}, event: ${event}`, 'DEBUG');
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['coursePar'] = event;
            }
            index++;
        }
    }
    /**
     * onTeeSelectionChange
     */
    public courseHoleSets(event, teeID) {
        // this.logger.log(`courseHoleSets called for teeID: ${teeID}, event: ${event}`, 'DEBUG');
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['courseHoleSets'] = event;
            }
            index++;
        }
    }
    /**
     * onTeeSelectionChange
     */
    public gender_id(event, teeID) {
        // this.logger.log(`gender_id called for teeID: ${teeID}, event: ${JSON.stringify(event)}`, 'DEBUG');
        //console.log(event);

        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['gender_id'] = event.value;
            }
            index++;
        }
    }
    async setCoursRating() {
        // this.logger.log('setCoursRating called', 'INFO');
        this.tees = [];
        // this.tees = await this.facadeService.getCourseInformationForForm(
        //     this.courseID
        // );
        try {
            let rating = await this.facadeService.getCourseRating(this.courseID);
            //console.log(rating);
            //console.log(this.tees);
            this.coursRating = [];
            this.showTees = [];
            // let tee = this.tees['course'][0]['TeesQL'];
            // for (let obj of tee) {
            //     let teeObj = {
            //         name: obj.name_by_club,
            //         id: obj.tee_id,
            //     };
            //     this.showTees.push(teeObj);
            // }
            //console.log(this.showTees);

            // let HolesSet = this.courseHoleSet['course_hole_sets'];
            // this.holeSetforSelect = [];
            // for (let index1 in HolesSet) {
            //     let hole = {
            //         id: HolesSet[index1]['holeSets'],
            //         displayName: HolesSet[index1]['displayName'],
            //     };
            //     this.holeSetforSelect.push(hole);
            // }
            //console.log(this.holeSetforSelect);
            if (rating && rating['course_rating'].length > 0) {
                for (let obj of rating['course_rating']) {
                    let teeObj = {
                        id: UniqueIdGenerator.generate(),
                        courseHoleSets: obj.courseHoleSets,
                        tee: obj.tee,
                        tee_id: obj.tee_id,
                        slopeRating: obj.slopeRating,
                        courseRating: obj.courseRating,
                        coursePar: obj.coursePar,
                        gender_id: obj.gender_id,
                    };
                    this.coursRating.push(teeObj);
                }
                // this.logger.log('Course ratings loaded successfully', 'INFO', rating['course_rating']);
            } else {
                // this.coursRating = this.populateRatings(tee, HolesSet)
                // this.logger.log('No course ratings found, populating default', 'INFO');
            }
            //console.log(this.coursRating);
        } catch (error) {
            // this.logger.log('Error setting course ratings', 'ERROR', error);
        }
    }

    async savecoureRating() {
        // this.logger.log('savecoureRating called', 'INFO');
        let teeObj = [];
        //console.log(this.coursRating);
        for (let obj of this.coursRating) {
            let tee = {
                courseId: this.courseID,
                courseHoleSets: obj.courseHoleSets,
                tee: obj.tee,
                tee_id: General.getPlayersTe(obj.tee_id)?.id ?? '1',
                slopeRating: obj.slopeRating,
                courseRating: obj.courseRating,
                coursePar: obj.coursePar,
                gender_id: obj.gender_id,
            };
            teeObj.push(tee);
        }
        //console.log(teeObj);
        try {
            let saveCourseRating = <boolean>(
                await this.facadeService.saveCourseRating(teeObj)
            );
            if (saveCourseRating) {
                // this.logger.log('Course ratings saved successfully', 'INFO', teeObj);
                // this.snackBar.open('Course-Rating has been Saved!', 'x', {
                //     duration: 5000,
                // });
                if (this._localStorage.isSuperAdmin() || this.loggedInuser) {

                    this._fuseConfirmationService.open({
                        title: 'Course Saved Successfully',
                        message: 'Our administrator will review your course and will activate the course.',
                        icon: {
                            name: 'thumb-up',
                            color: 'primary',
                        },
                        actions: {
                            cancel: {
                                show: false,
                            },
                            confirm: {
                                label: 'Close',
                            },
                        },
                    }).afterClosed().subscribe(() => {
                        this.router.navigateByUrl('/courses2');
                    })
                } else {
                    if (!this.editForm) {
                        this._fuseConfirmationService.open({
                            title: 'Course Saved Successfully',
                            message: 'Our administrator will review your course and will activate the course.',
                            icon: {
                                name: 'thumb-up',
                                color: 'primary',
                            },
                            actions: {
                                cancel: {
                                    show: false,
                                },
                                confirm: {
                                    label: 'Close',
                                },
                            },
                        }).afterClosed().subscribe(() => {
                            location.reload();
                        })

                    } else {
                        this._fuseConfirmationService.open({
                            title: 'Course Updated Successfully',
                            message: 'Course has been updated successfully.',
                            icon: {
                                name: 'thumb-up',
                                color: 'primary',
                            },
                            actions: {
                                cancel: {
                                    show: false,
                                },
                                confirm: {
                                    label: 'Close',
                                },
                            },
                        }).afterClosed().subscribe(() => {
                            location.reload();
                        })
                    }
                }
            } else {
                this.snackBar.open('Course-Rating has not Saved!', 'x', {
                    duration: 5000,
                });
                // this.logger.log('Course ratings failed to save', 'ERROR', teeObj);
            }
        } catch (error) {
            // this.logger.log('Error saving course ratings', 'ERROR', error);
            this.snackBar.open('Error saving course ratings!', 'x', {
                duration: 5000,
            });
        }
    }

    populateRatings(tees, holeSets) {
        // this.logger.log(`populateRatings called with tees: ${JSON.stringify(tees)}, holeSets: ${JSON.stringify(holeSets)}`, 'DEBUG');
        let finalArray = [];
        for (const tee of tees) {
            for (const holeSet of holeSets) {
                let mergedObj = {
                    id: UniqueIdGenerator.generate(),
                    courseHoleSets: holeSet.holeSets,
                    tee: tee.name_by_club,
                    tee_id: tee.tee_id,
                    slopeRating: 0,
                    courseRating: 0,
                    coursePar: 0,
                    gender_id: 'COMMON  ',
                };
                finalArray.push(mergedObj);
            }
        }

        return finalArray;
    }

    ///*******************************************************************TEE HOLES-Rating SAVE**************************************************************************************** */
    async getFormData(stepper: MatStepper, action: string) {
        // this.logger.log(`getFormData called with action: ${action}`, 'INFO');
        if (action === 'next') stepper.next();
        else if (action === 'back') stepper.previous();
        else {
            // this.logger.log('Invalid action provided to getFormData', 'WARN', action);
        }
    }
    tournamentSetup() {
        // this.logger.log('tournamentSetup called', 'INFO');
        this.stepTitle = 'Tournament Setup Form';
    }
    setState(control: FormControl, state: boolean) {
        // this.logger.log(`setState called with state: ${state}`, 'DEBUG', control);
        if (state) {
            control.setErrors({ required: true });
            // this.logger.log('Control set to required', 'DEBUG');
        } else {
            control.reset();
            // this.logger.log('Control reset', 'DEBUG');
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

    /**
    * Get the details of the panel
    *
    * @param id
    */
    getPanelInfo(id: string): any {

        return this.panels.find(panel => panel.id === id);
    }

    /**
   * Navigate to the panel
   *
   * @param panel
   */
    goToPanel(panel: string): void {
        // this.nineHoleTotalPar = 0
        // this.eighteenHoleTotalPar = 0
        // this.twentysevenHoleTotalPar = 0
        // this.thirtySixHoleTotalPar = 0
        // this.selectedPanel = panel;
        // this.addIntialsTees();

        // if (panel == '2') {
        //     this.setHoles(this.NoOfHoles);
        // } else if (panel == '3') {
        //     //this.setCoursRating();
        //     this.getCourseHoleSets();
        //     // this.getTeeMeta();
        //     // this.showTees = [];
        // } else if (panel == '4') {
        //     this.getCourseHoleSets();
        //     this.setCoursRating();
        // } else if (panel == '5') {
        //     this.initializeGoogleMapElement();
        //     this.setHoles(this.NoOfHoles);

        // }
        // // Close the drawer on 'over' mode
        // if (this.drawerMode === 'over') {
        //     this.drawer.close();
        // }
    }

    // initializeGoogleMapElement(): void {
    //     if (!this.googleMapElement) {
    //         setTimeout(() => {
    //             this.googleMapElement = this.googleMapElement || this.getGoogleMapElement();
    //             if (this.googleMapElement) {
    //                 this.searchPlace();
    //                 this.searchBox();

    //                 console.log('Google Map element initialized:', this.googleMapElement);
    //             } else {
    //                 console.error('Google Map element could not be initialized.');
    //             }
    //         }, 100); // Adjust the timeout as needed
    //     }
    // }

    // getGoogleMapElement(): GoogleMap {
    //     const mapEl = document.querySelector('google-map');
    //     return mapEl ? (mapEl as unknown as GoogleMap) : null;
    // }

    downloadSample() {
        // Create sample data

        const data = [
            { 'Holes': 'Hole 1', 'Black': '31.536615, 74.356104', 'Blue': '31.536615, 74.356104', 'White': '31.536489, 74.356056', 'Green Start': '31.536489, 74.356056', 'Green Center': '31.536489, 74.356056', 'Green End': '31.536489, 74.356056', 'Hazard Start': '31.536489, 74.356056' },
            { 'Holes': 'Hole 2', 'Black': '31.536615, 74.356104', 'Blue': '31.536615, 74.356104', 'White': '31.536489, 74.356056', 'Green Start': '31.536489, 74.356056', 'Green Center': '31.536489, 74.356056', 'Green End': '31.536489, 74.356056', 'Hazard Start': '31.536489, 74.356056' },
            { 'Holes': 'Hole 3', 'Black': '31.536615, 74.356104', 'Blue': '31.536615, 74.356104', 'White': '31.536489, 74.356056', 'Green Start': '31.536489, 74.356056', 'Green Center': '31.536489, 74.356056', 'Green End': '31.536489, 74.356056', 'Hazard Start': '31.536489, 74.356056' },
            // Add more rows as needed
        ];

        // Create worksheet
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

        // Create workbook
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Save file
        XLSX.writeFile(wb, 'sample_file.xlsx');
    }

    parseFlightsData(event) {
        let fileReader = new FileReader();
        this.cordinatesData = [];
        if (event.target.files.length > 0) {
            this.file = event.target.files[0];
            // this.logger.log(this.file);
        }
        fileReader.onload = (e) => {
            this.arrayBuffer = fileReader.result;
            var data = new Uint8Array(this.arrayBuffer);
            var arr = new Array();
            for (var i = 0; i != data.length; ++i)
                arr[i] = String.fromCharCode(data[i]);
            var bstr = arr.join('');
            var workbook = read(bstr, { type: 'binary' });
            var first_sheet_name = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[first_sheet_name];
            this.cordinatesData = utils.sheet_to_json(worksheet, {
                raw: true,
                defval: '',
            });

            // this.logger.log(this.playersData);
            // console.log(this.cordinatesData);

            this.importExcelData();
            //this.providerservice.importexcel(this.exceljsondata).subscribe(data=>{
            //})
        };
        fileReader.readAsArrayBuffer(this.file);
    }

    importExcelData() {
        try {
            for (let p of this.cordinatesData) {
                // Find the corresponding hole in holesArray based on the hole number
                const keys = Object.keys(p);
                let matchedHole;
                matchedHole = this.holeSetfor9.find(hole => hole.holeNo === parseInt(p.Holes.split(' ')[1], 10));
                if (!matchedHole) {
                    matchedHole = this.holeSetfor18.find(hole => hole.holeNo === parseInt(p.Holes.split(' ')[1], 10));
                }
                if (!matchedHole) {
                    matchedHole = this.holeSetfor27.find(hole => hole.holeNo === parseInt(p.Holes.split(' ')[1], 10));
                }
                if (!matchedHole) {
                    matchedHole = this.holeSetfor36.find(hole => hole.holeNo === parseInt(p.Holes.split(' ')[1], 10));
                }

                if (matchedHole) {
                    // Update properties of the matched hole object
                    // matchedHole.id = p.id;  // Assuming 'id' is directly from the data
                    // this.Tee.find(tee=>tee.name_by_club==p)
                    matchedHole.tee_lat_long = {}
                    keys.forEach(key => {
                        let matchingTee = this.Tee.find(tee => tee.name_by_club.toUpperCase() === key.toUpperCase());
                        if (matchingTee) {
                            matchedHole.tee_lat_long[matchingTee.tee_id] = p[key];
                        } else {
                            // const match = key.match(/(Hazard (Start|End))(_\d+)?/);
                            // if (match) {
                            //     console.log(match); 

                            // }
                        }
                    });

                    matchedHole.greenStartLatLong = p['Green Start'];
                    matchedHole.greenCenterLatLong = p['Green Center'];  // Correcting the spelling mistake
                    matchedHole.greenEndLatLong = p['Green End'];
                }
            }

        } catch {
            // this.importingList = false;
        }
    }
}
