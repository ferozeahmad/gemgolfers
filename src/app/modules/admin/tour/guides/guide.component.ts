import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FacadeService } from 'app/shared/services/facade.service';
import { UniqueIdGenerator } from 'app/shared/classes/general';
import { LogsService } from 'app/shared/services/logs.service';
import { addDays, parseDateOnly, stripHtml, toDateOnlyString } from '../tour-utils';

export interface GuideItem {
    id: string;
    title: string;
    date: string | null;
    details: string;
    bg_image: string | null;
    isNew?: boolean;
}

@Component({
    standalone: false,
    selector: 'app-tour-guide',
    templateUrl: './guide.component.html'
})
export class TourGuideComponent implements OnInit, OnChanges, OnDestroy {

    /** The tour the itinerary belongs to (falls back to the `:id` route param). */
    @Input() tourId: string;
    /** Optional tour, used to propose sensible default dates. */
    @Input() tour: any;

    guides: GuideItem[] = [];
    isLoading = true;
    loadFailed = false;
    isSaving = false;

    /** Id of the guide that is currently open in the editor. */
    editingId: string | null = null;
    guideForm: FormGroup;
    /** Image chosen for the guide being edited (uploaded on save). */
    pendingFile: File | null = null;
    imageError = '';
    private originalImage: string | null = null;
    private expandedIds = new Set<string>();

    readonly maxImageSizeMb = 5;
    readonly quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link'],
            ['clean'],
        ],
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private route: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private facadeService: FacadeService,
        private snackBar: MatSnackBar,
        private _fuseConfirmationService: FuseConfirmationService,
        private logger: LogsService,
    ) { }

    ngOnInit(): void {
        this.logger.log('Admin comes to Tour Guide Page', "info");
        this.guideForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(120)]],
            script: [''],
            date: [null, [Validators.required]],
        });
        if (!this.tourId) {
            this.tourId = this.route.snapshot.paramMap.get('id') ?? '';
        }
        this.loadGuides();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tourId'] && !changes['tourId'].firstChange && this.tourId) {
            this.loadGuides();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    trackByFn(index: number, item: GuideItem): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Loading
    // -----------------------------------------------------------------------------------------------------

    async loadGuides(): Promise<void> {
        if (!this.tourId) {
            this.isLoading = false;
            return;
        }
        this.logger.log('Getting Tour Guides Data', "info", this.tourId);
        this.isLoading = true;
        this.loadFailed = false;
        try {
            const res = await this.facadeService.getTourGuide(this.tourId);
            this.guides = ((res?.['tour_guide'] as any[]) || []).map((g) => ({
                id: g.id,
                title: g.title ?? '',
                date: g.date ?? null,
                details: g.details ?? '',
                bg_image: g.bg_image ?? null,
            }));
            this.logger.log('Getting Tour Guides Data Successful', "info", { tourId: this.tourId, count: this.guides.length });
        } catch (error) {
            this.loadFailed = true;
            this.logger.log('Getting Tour Guides Data Failed', "error", error?.toString());
        } finally {
            this.isLoading = false;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ View helpers
    // -----------------------------------------------------------------------------------------------------

    preview(guide: GuideItem): string {
        return stripHtml(guide.details);
    }

    isLong(guide: GuideItem): boolean {
        return this.preview(guide).length > 160;
    }

    isExpanded(guide: GuideItem): boolean {
        return this.expandedIds.has(guide.id);
    }

    toggleExpanded(guide: GuideItem): void {
        this.expandedIds.has(guide.id) ? this.expandedIds.delete(guide.id) : this.expandedIds.add(guide.id);
    }

    get tourStart(): Date | null {
        return parseDateOnly(this.tour?.startDate);
    }

    get tourEnd(): Date | null {
        return parseDateOnly(this.tour?.endDate);
    }

    /** The image currently shown in the editor (existing image or the freshly chosen one). */
    get editingGuide(): GuideItem | undefined {
        return this.guides.find((g) => g.id === this.editingId);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Editing
    // -----------------------------------------------------------------------------------------------------

    addNewGuide(): void {
        this.logger.log('Admin Click on Add New Guide in Tour Guide Page', "info", this.tourId);
        this.discardNewGuide();

        // Propose the day after the last itinerary day, or the first day of the tour.
        const lastDate = this.guides
            .map((g) => parseDateOnly(g.date))
            .filter((d): d is Date => !!d)
            .sort((a, b) => b.getTime() - a.getTime())[0];
        const proposed = lastDate ? addDays(lastDate, 1) : this.tourStart;

        const guide: GuideItem = {
            id: UniqueIdGenerator.generate(),
            title: `Day ${this.guides.length + 1}`,
            date: proposed ? toDateOnlyString(proposed) : null,
            details: '',
            bg_image: null,
            isNew: true,
        };
        this.guides = [...this.guides, guide];
        this.startEdit(guide);
        setTimeout(() => document.getElementById('guide-' + guide.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }

    startEdit(guide: GuideItem): void {
        if (this.editingId && this.editingId !== guide.id) {
            this.revertEditingImage();
            this.discardNewGuide();
        }
        this.logger.log('Admin Opened Guide Editor in Tour Guide Page', "info", guide.id);
        this.editingId = guide.id;
        this.originalImage = guide.bg_image;
        this.pendingFile = null;
        this.imageError = '';
        this.guideForm.reset({
            title: guide.title,
            script: guide.details,
            date: parseDateOnly(guide.date),
        });
    }

    cancelEdit(): void {
        this.logger.log('Admin Click on Cancel Guide in Tour Guide Page', "info", this.editingId);
        this.revertEditingImage();
        this.discardNewGuide();
        this.editingId = null;
        this.pendingFile = null;
        this.imageError = '';
    }

    /** Restores the saved image of the guide being edited when its changes are thrown away. */
    private revertEditingImage(): void {
        const current = this.editingGuide;
        if (current && !current.isNew) {
            current.bg_image = this.originalImage;
        }
    }

    /** An unsaved new day is removed when its editor is closed. */
    private discardNewGuide(): void {
        const current = this.editingGuide;
        if (current?.isNew) {
            this.guides = this.guides.filter((g) => g.id !== current.id);
        }
    }

    save(guide: GuideItem): void {
        if (this.guideForm.invalid) {
            this.guideForm.markAllAsTouched();
            return;
        }
        this.logger.log('Admin Click on Save Guide in Tour Guide Page', "info", guide.id);
        const value = this.guideForm.getRawValue();
        const payload = {
            id: guide.id,
            tourId: this.tourId,
            date: toDateOnlyString(value.date),
            details: value.script ?? '',
            title: (value.title || '').trim(),
            bg_image: guide.bg_image,
        };
        this.isSaving = true;
        this.facadeService.insertTourGuide([payload], this.pendingFile).subscribe({
            next: () => {
                this.isSaving = false;
                this.logger.log('Tour Guide Saved Successfully', "info", { id: guide.id, tourId: this.tourId, title: payload.title });
                this.snackBar.open('Itinerary day saved.', 'Close', { duration: 2500 });
                // `payload.bg_image` now holds the uploaded image URL when a new image was chosen.
                Object.assign(guide, {
                    title: payload.title,
                    details: payload.details,
                    date: payload.date,
                    bg_image: payload.bg_image,
                    isNew: false,
                });
                this.guides = [...this.guides].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                this.editingId = null;
                this.pendingFile = null;
            },
            error: (error) => {
                this.isSaving = false;
                this.logger.log('Saving Tour Guide Failed', "error", { id: guide.id, tourId: this.tourId, error: error?.toString() });
                this.snackBar.open('Could not save this itinerary day. Please try again.', 'Close', { duration: 4000 });
            },
        });
    }

    delete(guide: GuideItem): void {
        this.logger.log('Admin Click on Delete Guide in Tour Guide Page', "info", guide.id);
        if (guide.isNew) {
            // Never saved - nothing to delete on the server.
            this.cancelEdit();
            return;
        }
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete itinerary day',
            message: 'Are you sure you want to delete this itinerary day? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe(async (result) => {
            if (result === 'confirmed') {
                this.logger.log('Delete Guide Confirmed in Tour Guide Page', "info", guide.id);
                const response = await this.facadeService.deleteTourGuide(guide.id);
                if (response) {
                    this.logger.log('Tour Guide Deleted Successfully', "info", guide.id);
                    this.guides = this.guides.filter((g) => g.id !== guide.id);
                    if (this.editingId === guide.id) {
                        this.editingId = null;
                    }
                    this.snackBar.open('Itinerary day deleted.', 'Close', { duration: 2500 });
                } else {
                    this.logger.log('Deleting Tour Guide Failed', "error", guide.id);
                    this.snackBar.open('Could not delete this itinerary day.', 'Close', { duration: 4000 });
                }
            } else {
                this.logger.log('Delete Guide Cancelled in Tour Guide Page', "info", guide.id);
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Image
    // -----------------------------------------------------------------------------------------------------

    removeImage(guide: GuideItem): void {
        this.logger.log('Admin Click on Remove Image in Tour Guide Page', "info", guide?.id);
        guide.bg_image = null;
        this.pendingFile = null;
        this.imageError = '';
    }

    uploadImage(guide: GuideItem, input: HTMLInputElement): void {
        const fileList = input.files;
        this.logger.log('Admin Selected Image to Upload in Tour Guide Page', "info", { id: guide.id, fileName: fileList?.[0]?.name });
        this.imageError = '';
        // Return if canceled
        if (!fileList || !fileList.length) {
            return;
        }

        const file = fileList[0];
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.imageError = 'Please choose a JPG or PNG image.';
            input.value = '';
            return;
        }
        if (file.size > this.maxImageSizeMb * 1024 * 1024) {
            this.imageError = `The image must be smaller than ${this.maxImageSizeMb} MB.`;
            input.value = '';
            return;
        }

        this.pendingFile = file;
        this._readAsDataURL(file).then((data) => {
            guide.bg_image = data;
        });
        input.value = '';
    }

    private _readAsDataURL(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (): void => resolve(reader.result);
            reader.onerror = (e): void => reject(e);
            reader.readAsDataURL(file);
        });
    }
}
