import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedDialogsModule } from '../dialogs/shared-dialogs.module';
import { HandicapCalculationComponent } from './handicap-calculation.component';
import { HandicapCalculationRoutingModule } from './handicap-calculation-routing.module';

@NgModule({
    declarations: [HandicapCalculationComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HandicapCalculationRoutingModule,
        SharedDialogsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatRadioModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
    ],
})
export class HandicapCalculationModule {}
