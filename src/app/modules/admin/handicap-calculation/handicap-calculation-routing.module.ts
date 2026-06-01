import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HandicapCalculationComponent } from './handicap-calculation.component';

const routes: Routes = [
    {
        path: '',
        component: HandicapCalculationComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HandicapCalculationRoutingModule {}
