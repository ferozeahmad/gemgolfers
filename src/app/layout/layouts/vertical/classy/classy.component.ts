import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'classy-layout',
    templateUrl: './classy.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    showAvatar: boolean = true;
    navigation: Navigation;
    user: User;
    public loggedInuser: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _localStorage: LocalStorageService,
        private logger: LogsService
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        //Subscribe to the user service
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                console.log(user);
                if (user.avatar ) {
                    this.showAvatar = true;
                }
                this.user = user;
            });

        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to navigation data
        // this._navigationService.navigation$
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((navigation: Navigation) => {
        //         this.navigation = navigation;
        //     });

        // this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
        // if (this._localStorage.isSuperAdmin()) {
        //     this.navigation['default'] = defaultNavigationSuperAdmin;
        // } else if (this._localStorage.isClubAdmin()) {
        //     this.navigation['default'] = defaultNavigation;
        // } else if (this.loggedInuser.userRole == 8) {
        //     this.navigation['default'] = sectaryNavigation;
        // } else if (this.loggedInuser.userRole == 4) {
        //     this.navigation['default'] = tourNavigation;
        //     this.user.avatar = 'assets/images/logo/e2esp.png';
        // } else if (this.loggedInuser.userRole == 9) {
        //     this.navigation['default'] = leagueNavigation;
        //     this.user.avatar = 'assets/images/logo/e2esp.png';
        // } else if (this._localStorage.isSuperAdmin()) {
        //     this.navigation['default'] = tourLeagueNavigation;
        //     this.user.avatar = 'assets/images/logo/e2esp.png';
        // } else {
        //     this.navigation['default'] = userNavigation;
        //     this.user.avatar = 'assets/images/logo/leaderboradlogo-without-pb.png';
        // }
        // //console.log(this.navigation);

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        this.logger.log('User Click on Toggle Navigation', "info", name);
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
