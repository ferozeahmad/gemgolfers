import { Route } from '@angular/router';
import { PlayersComponent } from './players.component';
import { PlayerResolver } from './players.resolver';

export const playerRoutes: Route[] = [
    {
        path: '',
        component: PlayersComponent,
        // resolve: {
        //     players: PlayerResolver
        // }
    },
];
