import { Component } from '@angular/core';
import { DialogAddTourComponent } from '../dialog-add-tour/dialog-add-tour.component';

/**
 * Same dialog as {@link DialogAddTourComponent}; it is declared separately because it
 * belongs to the dashboard module (an Angular component can only be declared in one module).
 */
@Component({
    standalone: false,
    selector: 'app-dialog-add-tour-main',
    templateUrl: '../dialog-add-tour/dialog-add-tour.component.html',
    styleUrls: ['../dialog-add-tour/dialog-add-tour.component.scss'],
})
export class DialogAddTourMainComponent extends DialogAddTourComponent { }
