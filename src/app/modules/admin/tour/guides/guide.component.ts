import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants, General, UniqueIdGenerator } from 'app/shared/classes/general';
import { Player } from 'app/shared/models/player.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, UntypedFormArray, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionPanel } from '@angular/material/expansion';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-tour-guide',
    templateUrl: './guide.component.html'
})
export class TourGuideComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    file: any;
    guides: any[];
    tourID: string = '';
    loggedInuser: Player;
    guideForm: FormGroup;
    @ViewChild('myPanel') myPanel: MatExpansionPanel;

    // quillModules: any = {
    //     toolbar: [
    //         ['bold', 'italic', 'underline'],
    //         [{ align: [] }, { list: 'ordered' }, { list: 'bullet' }],
    //         ['clean']
    //     ]
    // };

    constructor(
        private router: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private facadeService: FacadeService,
        private snackBar: MatSnackBar,
        private _localStorage: LocalStorageService,
        private _fuseConfirmationService: FuseConfirmationService,
        private logger: LogsService,
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to Tour Guide Page', "info");
        this.router.paramMap.subscribe((params) => {
            this.tourID = params.get('id');
        });
        this.guideForm = this._formBuilder.group({
            title: [''],
            script: [''],
            date: [''],
            bg_image: ['']
        });
        if (this.tourID) {
            this.logger.log('Getting Tour Guides Data', "info", this.tourID);
            this.facadeService.getTourGuide(this.tourID).then((res) => {
                console.log(res);
                this.guides = res['tour_guide'];
                this.logger.log('Getting Tour Guides Data Successful', "info", { tourId: this.tourID, count: this.guides?.length });

            })
            //console.log(guides['tour_guide']);

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
    delete(id) {
        this.logger.log('Admin Click on Delete Guide in Tour Guide Page', "info", id);
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete contact',
            message: 'Are you sure you want to delete this guide? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe(async (result) => {

            if (result === 'confirmed') {
                this.logger.log('Delete Guide Confirmed in Tour Guide Page', "info", id);
                let response = await this.facadeService.deleteTourGuide(id);
                if (response) {
                    this.logger.log('Tour Guide Deleted Successfully', "info", id);
                    this.guides = this.guides.filter(a => a.id !== id);
                } else {
                    this.logger.log('Deleting Tour Guide Failed', "error", id);
                }
            } else {
                this.logger.log('Delete Guide Cancelled in Tour Guide Page', "info", id);
            }
        })
    }
    save(id) {
        this.logger.log('Admin Click on Save Guide in Tour Guide Page', "info", id);
        let guide = this.guides.find(a => a.id === id);
        let newGuide = [];
        let obj = {
            id: id,
            tourId: this.tourID,
            date: General.parseToDate(this.guideForm.get('date').getRawValue()),
            details: this.guideForm.get('script').getRawValue() ?? '',
            title: this.guideForm.get('title').getRawValue(),
            bg_image: guide.bg_image,
        }
        newGuide.push(obj);
        this.facadeService.insertTourGuide(newGuide, this.file).subscribe((response) => {
            this.logger.log(response ? 'Tour Guide Saved Successfully' : 'Saving Tour Guide Failed', response ? "info" : "error", { id: id, tourId: this.tourID, title: obj.title });
            if (response) {
                this.snackBar.open('Guide is added.', 'x', {
                    duration: 2000,
                });

                guide.title = obj.title;
                guide.details = obj.details;
                guide.date = obj.date;
                this.myPanel.close();
                // this.file = null;
            }
        })

    }
    onPanelOpened(id: string) {
        this.logger.log('Admin Opened Guide Panel in Tour Guide Page', "info", id);
        let guide = this.guides.find(a => a.id === id);
        if (guide) {
            this.file = null;
            this.guideForm.patchValue({
                title: guide?.title,
                script: guide?.details,
                date: guide?.date,
            });
        }
    }
    addNewGuide() {
        this.logger.log('Admin Click on Add New Guide in Tour Guide Page', "info", this.tourID);
        this.guides.push({ id: UniqueIdGenerator.generate() })
    }

    removeImage(guide: any): void {
        this.logger.log('Admin Click on Remove Image in Tour Guide Page', "info", guide?.id);
        guide.bg_image = null;
    }
    /**
    * Upload image to given note
    *
    * @param note
    * @param fileList
    */
    uploadImage(id: any, fileList: FileList): void {
        this.logger.log('Admin Selected Image to Upload in Tour Guide Page', "info", { id: id, fileName: fileList?.[0]?.name });
        let guide = this.guides.find(a => a.id === id);
        // Return if canceled
        if (!fileList.length) {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        this.file = fileList[0];

        // Return if the file is not allowed
        if (!allowedTypes.includes(this.file.type)) {
            return;
        }

        this._readAsDataURL(this.file).then((data) => {

            // Update the image
            guide.bg_image = data;
            guide.file = this.file;

            // Update the note
            //   this.noteChanged.next(note);
        });
    }
    private _readAsDataURL(file: File): Promise<any> {
        // Return a new promise
        return new Promise((resolve, reject) => {

            // Create a new reader
            const reader = new FileReader();

            // Resolve the promise on success
            reader.onload = (): void => {
                resolve(reader.result);
            };

            // Reject the promise on error
            reader.onerror = (e): void => {
                reject(e);
            };

            // Read the file as the
            reader.readAsDataURL(file);
        });
    }

}
