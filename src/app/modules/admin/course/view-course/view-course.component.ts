import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { Observable, map, shareReplay, startWith } from 'rxjs';
import * as XLSX from 'xlsx';
import { read, utils } from 'xlsx';
import { UserSessionModel } from 'app/shared/models/player.model';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-view-course',
    templateUrl: './view-course.component.html',
    styleUrls: ['./view-course.component.scss'],
})
export class ViewCourseComponent implements OnInit {
    // center: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
    zoom = 18;
    file: File;
    cordinatesData = [];
    // @ViewChild('googleMap', { static: false }) googleMapElement!: GoogleMap;
    @ViewChild('googleMap', { static: false, read: ElementRef }) googleMapContainer: ElementRef;
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
    currentHoleNo: number | null = 1;
    currentHzd: any | null = null;
    currentHzdId: string | null = null;
    currentGreen: number | null = null;
    currentTee: number | null = null;
    currentLatLong: boolean = true;
    countryName: any;
    cityName: any;
    NoOfHoles: any;
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
    holeSetfor9 = [];
    holeSetfor18 = [];
    holeSetfor27 = [];
    holeSetfor36 = [];
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
    setName9: string;
    setName18: string;
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
    constructor(
        // private datePipe: DatePipe,
        private router: Router,
        private _localStorage: LocalStorageService,
        private route: ActivatedRoute,
        // private googleMapsApiSerivce: GoogleMapsApiService,
        private _cityService: HandicapService,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
        public facadeService: FacadeService, private logger: LogsService // private storage: AngularFireStorage
    ) {

    }

    async ngOnInit() {
        this.logger.log('Admin comes to Course Details Page', "info");
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
            noOfHoles: new FormControl("", [Validators.required]),
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
            this.logger.log('Getting Course Data', "info", this.courseID);
            this.courseData = await this.facadeService.getCourseByID(
                this.courseID
            );
            this.logger.log('Getting Course Data Successful', "info", this.courseID);
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

            this.url = 'golfcourse.jpg';
            // this.setHoles(this.NoOfHoles);
            this.panels = (General.getGolfCourseFeatures());
            //console.log(this.panels);
            const country = this.countries.find(country => country.name === this.countryName);
            //  this.getLatLng(country?.code ?? '');

        } else {

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
    //                     this.center = {
    //                         lat: results[0].geometry.location.lat(),
    //                         lng: results[0].geometry.location.lng(),
    //                     };
    //                     this.markers = [{
    //                         position: {
    //                             lat: results[0].geometry.location.lat(),
    //                             lng: results[0].geometry.location.lng(),
    //                         },
    //                         title: results[0].name,
    //                     }];
    //                     map.setCenter(this.center);
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
        this.logger.log('Country selected in Course Details Page', "info", event?.name || event);
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
        this.logger.log('Admin Click on Map in Course Details Page', "info", this.currentHoleNo);
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
        this.logger.log('Admin Click on Green Start Lat Long in Course Details Page', "info", holeNo);
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
        this.logger.log('Admin Click on Green Center Lat Long in Course Details Page', "info", holeNo);
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
        this.logger.log('Admin Click on Green End Lat Long in Course Details Page', "info", holeNo);
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
        this.logger.log('Admin Click on Hole in Course Details Page', "info", holeNo);
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
        if (value) {
            const filterValue = value.toLowerCase();
            return this.countries.filter(
                (option) => option.name.toLowerCase().indexOf(filterValue) === 0
            );
        }
        return this.countries;
    }

    private _filterCity(value: string) {
        if (value) {
            const filterValue = value.toLowerCase();
            return this.cities.filter(
                (option) => option.toLowerCase().indexOf(filterValue) === 0
            );
        }
        return this.cities;
    }

    displayFn(country): string {
        return typeof country === 'string' ? country : country ? country.name : '';
    }
    displayCity(city): string {
        return typeof city === 'string' ? city : city ? city : '';
    }

    public createCourse = async (playerFormValue: any) => {
        this.logger.log('Admin Click on Save Course in Course Details Page', "info", this.courseID);
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
                this.logger.log('Course updated successfully', "info", { id: courses.id, name: courses.name });
                this.snackBar.open("Course has been Updated.", "x", {
                    duration: 5000,
                });
                this.goToPanel('1');
            } else {
                this.logger.log('Course update Failed', "error", { id: courses.id, name: courses.name });
                this.snackBar.open("Course Not Updated!", "x", {
                    duration: 5000,
                });
            }
        } else {
            const isSuccess = <boolean>await this.facadeService.AddCourse(course);
            if (isSuccess) {
                this.logger.log('Course created successfully', "info", { id: course.id, name: course.name });
                this.courseID = course.id;
                this.snackBar.open("Course has been created.", "x", {
                    duration: 5000,
                });
                this.panels = (General.getGolfCourseFeatures());
                // if (course.noOfHoles <= 18) {
                //     this.panels = this.panels.filter(panel => panel.id !== '3');
                // }
                //this.addIntialsTees();
                this.NoOfHoles = course.noOfHoles;
                this.goToPanel('1');
                // this.router.navigate(["/courses/view/" + this.courseID]);
            } else {
                this.logger.log('Course creation Failed', "error", { id: course.id, name: course.name });
                this.snackBar.open("Error! Please try again later.", "x", {
                    duration: 5000,
                });
            }
        }
        // }
    };
    ////*******************************************************************TEE COLOR SAVE**************************************************************************************** */

    get courseName() {
        return this.courseForm.get("courseName");
    }
    get country() {
        return this.courseForm.get("country");
    }
    get city() {
        return this.courseForm.get("city");
    }
    /**
     * addIntialsTees
     */
    async addIntialsTees() {
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
        this.logger.log('Admin Click on Add New Tee in Course Details Page', "info");
        this.Tee[this.Tee.length] = [];
        this.Tee[this.Tee.length - 1]['id'] = UniqueIdGenerator.generate();
        this.Tee[this.Tee.length - 1]['tee_id'] = General.addNewTee(this.Tee);
        this.Tee[this.Tee.length - 1]['name_by_club'] = '';
        this.Tee[this.Tee.length - 1]['color'] = '';
        //console.log(this.Tee);
    }
    /**
     * onTeeColorChange
     */
    public onTeeColor(val, teeID) {
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
        this.logger.log('Admin changes Tee in Course Details Page', "info", { teeID: teeID, value: event?.value });
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
        this.logger.log('Admin Click on Delete Tee in Course Details Page', "info", teeID);
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
    public saveTees = async (control: FormControl, state: boolean) => {
        this.logger.log('Admin Click on Save Tees in Course Details Page', "info", this.courseID);
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
        }
        if (saveTeeColor) {
            this.logger.log('Course Tees saved successfully', "info", this.courseID);
            this.snackBar.open('Tees Color has been Saved!', 'x', {
                duration: 5000,
            });
            this.goToPanel('2');
            // if (state) {
            //     control.setErrors({ required: true });
            // } else {
            //     control.reset();
            // }
        } else {
            this.logger.log('Saving Course Tees Failed', "error", this.courseID);
            this.snackBar.open('Tees Color has not Saved!', 'x', {
                duration: 5000,
            });
        }
    };
    ////*******************************************************************TEE COLOR SAVE**************************************************************************************** */
    ////*******************************************************************TEE HOLES SAVE**************************************************************************************** */

    async setHoles(Number: number) {
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
                    let hole: any = {
                        displayName: holes['HolesQL'][0].displayName,
                        id: holeCount[index].id,
                        holeNo: holeCount[index].holeNo,
                        par: holeCount[index].par,
                        index: holeCount[index].index,
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
    /**
     * onTeeInput
     */
    public onTeeInput(dist: any, tee_id: any, hole_id: any, holeSet: any) {

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
        this.logger.log('Admin Click on Tee Lat Long in Course Details Page', "info", { holeNo: hole_id?.holeNo, tee: tee_id });
        this.currentHoleNo = hole_id.holeNo;
        this.currentLatLong = false;
        this.currentTee = tee_id;
        // this.focusMap();
    }
    private isIndexUnique(val: any, holes): boolean {
        // Extract index values from holeSetfor9
        const indexValues = holes.map(obj => obj['index']);

        // Check if the input value is unique
        return indexValues.indexOf(Number(val)) === indexValues.lastIndexOf(val);
    }
    private areIndexesUnique(...holeSets: any[][]): boolean {
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
        this.logger.log('Admin Click on Add Hazard in Course Details Page', "info", holeNo);
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
        this.logger.log('Admin Click on Hazard Lat Long in Course Details Page', "info", hzrd?.hazardId);
        console.log(val);
        console.log(hzrd);
        this.currentHzd = hzrd;
        this.currentHzdId = hzrd.hazardId;
        if (typeof (hzrd.lat_long) == 'string') {
            const [lat, lng] = hzrd.lat_long.split(',').map(Number);
            // if (lat !== 0 && lng !== 0) {
                // this.center = { lat, lng };
            // }
        }
        // this.focusMap();

    }
    /**
     * onIndexInput
     */
    public onIndexInput(val: any, holeNo: any) {
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
    public selectionChange(event) {
        this.logger.log('Admin changes Index For Genders option in Course Details Page', "info", event);
        if (event == 1) {
            this.showholeindexforWomen = true;
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
            //console.log(this.holeSetfor9);
        } else {
            this.showholeindexforWomen = false;
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
    selectionChangeDistance(event) {
        //console.log(event);

    }
    /**
     * tableNameInput
     */
    public tableNameInput(val: any, tableindex: any) {
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
    public saveHoles = async (control: FormControl, state: boolean, panelNo: number) => {
        this.logger.log('Admin Click on Save Holes in Course Details Page', "info", this.courseID);
        let holeObj = [];
        let holesToSave = [];
        let holesYardageToSave = [];
        let holeHazardsToSave = [];
        let holesSet = [];
        const holeSets = [this.holeSetfor9, this.holeSetfor18, this.holeSetfor27, this.holeSetfor36];
        const isUnique = this.areIndexesUnique(...holeSets);
        if (isUnique) {
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

            if (this.showholeindexforWomen == false) {
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
                    let holeYards: any = General.getTeeYards(obj.teeDistances, this.Tee, this.courseID, obj.id, obj.tee_lat_long);
                    // let holeHazards = obj.hazards;
                    const [startLat, startLng, centerLat, centerLng, endLat, endLng] = General.getHoleLatLong(obj.greenStartLatLong, obj.greenCenterLatLong, obj.greenEndLatLong);
                    let tee = {
                        id: obj.id,
                        courseId: this.courseID,
                        holeNo: obj.holeNo,
                        teeDistances: {},
                        teeLatLongs: {},
                        indexWomen: null,
                        par: obj.par ? obj.par : 0,
                        index: obj.index ? obj.index : 0,
                        holeSetId: this.id[counter],
                        greenStartLat: startLat,
                        greenStartLong: startLng,
                        greenCenterLat: centerLat,
                        greenCenterLong: centerLng,
                        greenEndLat: endLat,
                        greenEndLong: endLng,
                        // meta: { data: General.getTeeYards(obj.teeDistances, this.Tee,this.courseID) }
                    };

                    number++;
                    if (number % 9 == 0) {
                        counter++;
                    }
                    holesToSave.push(tee);
                    holesYardageToSave.push(holeYards);
                    holeHazardsToSave.push(General.getHazards(obj.hazards));
                }
            } else {
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
                    // let roundTeeId: any = General.getPlayersTe(obj.Tee);
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
                    };
                    number++;
                    if (number % 9 == 0) {
                        counter++;
                    }
                    holesToSave.push(tee);
                }
            }
            //console.log(holesToSave);
            //console.log(holesSet);
            console.log(holesYardageToSave);
            const mergedArray = [].concat(...holesYardageToSave);
            const mergedHazards = [].concat(...holeHazardsToSave);

            // Output the merged array
            console.log(mergedHazards);

            let succees = <boolean>(
                await this.facadeService.saveCourseHoles(holesToSave, holesSet, mergedArray, mergedHazards)
            );
            if (succees) {
                this.logger.log('Course Holes saved successfully', "info", this.courseID);
                this.snackBar.open('Course Holes are Saves!', 'x', {
                    duration: 2000,
                });
                if (state) {
                    this.goToPanel(panelNo.toString())
                }
                // if (this.NoOfHoles <= 18) {
                //     this.goToPanel('4')
                // } else {
                //     this.goToPanel('3')
                // }
            } else {
                this.logger.log('Saving Course Holes Failed', "error", this.courseID);
                this.snackBar.open('Course Holes has not Saved!', 'x', {
                    duration: 5000,
                });
            }
        } else {
            this.logger.log('Course Holes not saved, Index duplicates', "warn", this.courseID);
            this.snackBar.open('Index duplicates!', 'x', {
                duration: 5000,
            });
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
            for (let index = 0; index < 1; index++) {
                this.Hole[this.Hole.length] = [];
                this.Hole[this.Hole.length - 1]['id'] = UniqueIdGenerator.generate();
                this.Hole[this.Hole.length - 1]['displayName'] = '';
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
        this.logger.log('Admin Click on Add New Hole Set in Course Details Page', "info");
        this.Hole[this.Hole.length] = [];
        this.Hole[this.Hole.length - 1]['id'] = UniqueIdGenerator.generate();
        this.Hole[this.Hole.length - 1]['displayName'] = '';
        this.Hole[this.Hole.length - 1]['frontId'] = '';
        this.Hole[this.Hole.length - 1]['backId'] = '';
        //console.log(this.Hole);
    }
    initializeHoleSet() {
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
        this.logger.log('Admin changes Front Hole Set in Course Details Page', "info", { id: id, value: event?.value });
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
        this.logger.log('Admin changes Back Hole Set in Course Details Page', "info", { id: id, value: event?.value });
        let index = 0;
        for (let obj of this.Hole) {
            if (obj.id == id) {
                this.Hole[index]['backId'] = event.value;
            }
            index++;
        }
    }
    async saveHoleSets(
        control: FormControl,
        control1: FormControl,
        control2: FormControl,
        state: boolean
    ) {
        this.logger.log('Admin Click on Save Hole Sets in Course Details Page', "info", this.courseID);
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
        let saveTeeColor = <boolean>(
            await this.facadeService.saveCourseHolesSet(HoleSetObj)
        );
        if (saveTeeColor) {
            this.logger.log('Course Hole Sets saved successfully', "info", this.courseID);
            this.snackBar.open('Course HoleSets has been Saved!', 'x', {
                duration: 5000,
            });
            // 
            this.goToPanel('4');
        } else {
            this.logger.log('Saving Course Hole Sets Failed', "error", this.courseID);
            this.snackBar.open('Course HolesSet has not Saved!', 'x', {
                duration: 5000,
            });
        }
    }
    ///*******************************************************************TEE HOLES-SETS SAVE**************************************************************************************** */
    ///*******************************************************************TEE HOLES-META SAVE**************************************************************************************** */
    addNewTeeMeta() {
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
        this.holes = this.tees['course'][0]['HolesQL'];
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
        }
    }
    HolechangeForMeta(val, teeID) {
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['hole_id'] = val;
            }
            index++;
        }
    }
    teechangeforMeta(val, teeID) {
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_id'] = val.value;
            }
            index++;
        }
    }
    distanceChange(val, teeID) {
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_distances'] = val;
            }
            index++;
        }
    }
    LatChange(val, teeID) {
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_lat'] = val;
            }
            index++;
        }
    }
    LongChange(val, teeID) {
        let index = 0;
        for (let obj of this.holeMeta) {
            if (obj.id == teeID) {
                this.holeMeta[index]['tee_long'] = val;
            }
            index++;
        }
    }

    async saveTeeMeta() {
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
        let saveTeeColor = <boolean>(
            await this.facadeService.saveCourseMetaSet(teeObj)
        );
        if (saveTeeColor) {
            this.snackBar.open('Hole Meta has been Saved!', 'x', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('Hole Meta has not Saved!', 'x', {
                duration: 5000,
            });
        }
    }

    ///*******************************************************************TEE HOLES-META SAVE**************************************************************************************** */
    ///*******************************************************************TEE HOLES-Rating SAVE**************************************************************************************** */

    addNewCourseRating() {
        this.logger.log('Admin Click on Add New Course Rating in Course Details Page', "info");
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
        this.logger.log('Admin Click on Delete Rating in Course Details Page', "info", id);
        this.coursRating = this.coursRating.filter((rating) => rating.id !== id);
    }

    public slopeRating(val, teeID) {
        let index = 0;
        for (let obj of this.coursRating) {
            if (obj.id == teeID) {
                this.coursRating[index]['slopeRating'] = val;
            }
            index++;
        }
    }
    public teechange(val, teeID) {
        this.logger.log('Admin changes Rating Tee in Course Details Page', "info", { id: teeID, value: val?.value });
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
        this.logger.log('Admin changes Rating Hole Set in Course Details Page', "info", event?.value);
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
        this.logger.log('Admin changes Rating Gender in Course Details Page', "info", { id: teeID, value: event?.value });
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
        this.tees = [];
        this.tees = await this.facadeService.getCourseInformationForForm(
            this.courseID
        );
        let rating = await this.facadeService.getCourseRating(this.courseID);
        //console.log(rating);
        //console.log(this.tees);
        this.coursRating = [];
        this.showTees = [];
        let tee = this.tees['course'][0]['TeesQL'];
        for (let obj of tee) {
            let teeObj = {
                name: obj.name_by_club,
                id: obj.tee_id,
            };
            this.showTees.push(teeObj);
        }
        //console.log(this.showTees);

        let HolesSet = this.courseHoleSet['course_hole_sets'];
        this.holeSetforSelect = [];
        for (let index1 in HolesSet) {
            let hole = {
                id: HolesSet[index1]['holeSets'],
                displayName: HolesSet[index1]['displayName'],
            };
            this.holeSetforSelect.push(hole);
        }
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
        } else {
            this.coursRating = this.populateRatings(tee, HolesSet)
        }
        //console.log(this.coursRating);


    }

    async savecoureRating() {
        this.logger.log('Admin Click on Save Course Rating in Course Details Page', "info", this.courseID);
        let teeObj = [];
        //console.log(this.coursRating);
        for (let obj of this.coursRating) {
            let tee = {
                courseId: this.courseID,
                courseHoleSets: obj.courseHoleSets,
                tee: obj.tee,
                tee_id: obj.tee_id,
                slopeRating: obj.slopeRating,
                courseRating: obj.courseRating,
                coursePar: obj.coursePar,
                gender_id: obj.gender_id,
            };
            teeObj.push(tee);
        }
        //console.log(teeObj);

        let saveCourseRating = <boolean>(
            await this.facadeService.saveCourseRating(teeObj)
        );
        if (saveCourseRating) {
            this.logger.log('Course Ratings saved successfully', "info", this.courseID);
            this.snackBar.open('Course-Rating has been Saved!', 'x', {
                duration: 5000,
            });
            if (this._localStorage.isSuperAdmin()) {
                this.goToPanel('5')
            } else {
                this.router.navigateByUrl('/courses');
            }
        } else {
            this.logger.log('Saving Course Ratings Failed', "error", this.courseID);
            this.snackBar.open('Course-Rating has not Saved!', 'x', {
                duration: 5000,
            });
        }
    }

    populateRatings(tees, holeSets) {
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
        if (action === 'next') stepper.next();
        else if (action === 'back') stepper.previous();
        else {
        }
    }
    tournamentSetup() {
        this.stepTitle = 'Tournament Setup Form';
    }
    setState(control: FormControl, state: boolean) {
        if (state) {
            control.setErrors({ required: true });
        } else {
            control.reset();
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
        this.logger.log('Going to Panel in Course Details Page', "info", panel);
        this.nineHoleTotalPar = 0
        this.eighteenHoleTotalPar = 0
        this.twentysevenHoleTotalPar = 0
        this.thirtySixHoleTotalPar = 0
        this.selectedPanel = panel;
        this.addIntialsTees();
        if (panel == '2') {
            this.setHoles(this.NoOfHoles);
        } else if (panel == '3') {
            //this.setCoursRating();
            this.getCourseHoleSets();
            // this.getTeeMeta();
            // this.showTees = [];
        } else if (panel == '4') {
            this.getCourseHoleSets();
            this.setCoursRating();
        } else if (panel == '5') {
            // this.initializeGoogleMapElement();
            this.setHoles(this.NoOfHoles);

        }
        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
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
        this.logger.log('Admin Click on Download Sample in Course Details Page', "info");
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
        this.logger.log('Admin selects Coordinates file in Course Details Page', "info", event?.target?.files?.[0]?.name);
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
            console.log(this.cordinatesData);

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
