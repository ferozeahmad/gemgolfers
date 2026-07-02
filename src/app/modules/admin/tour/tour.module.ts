import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
// import { AmazingTimePickerModule } from 'amazing-time-picker';
import { MatFormFieldModule } from '@angular/material/form-field';
//import { FlexLayoutModule } from '@angular/flex-layout';
// import { TopPlayerModule } from 'app/shared/modules/top-player-section/top-player.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApolloModule } from 'apollo-angular';
import { TourComponent } from './tour.component';
import { playerRoutes } from '../players/players.routing';
import { tourRoutes } from './tour.routing.module';
import { DialogAddTourComponent } from '../dialogs/dialog-add-tour/dialog-add-tour.component';
import { DetailTourComponent } from './detail/detailTour.component';
import { TourGuideComponent } from './guides/guide.component';
import { TourMembersListComponent } from './tour-members-list/tour-members-list.component';
import { TourTournamentsListComponent } from './tour-tournaments-list/tour-tournaments-list.component';
import { QuillModule } from 'ngx-quill';
@NgModule({
    declarations: [TourComponent,DialogAddTourComponent,DetailTourComponent,TourGuideComponent, TourMembersListComponent, TourTournamentsListComponent],
    imports: [
        CommonModule,
        NgApexchartsModule,
        ReactiveFormsModule,
        MatTableModule,
        NgTemplateOutlet,
        MatFormFieldModule,
        MatInputModule,
        MatButtonToggleModule,
        MatIconModule,
        MatSortModule,
        MatStepperModule,
        MatTabsModule,
        MatMenuModule,
        MatCardModule,
        MatCheckboxModule,
        MatRadioModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        QuillModule.forRoot(),
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatSnackBarModule,
        ApolloModule,
        MatButtonModule,
        MatDialogModule,
        RouterModule.forChild(tourRoutes),
        FormsModule,
  
    ],
})
export class TourModule {}
