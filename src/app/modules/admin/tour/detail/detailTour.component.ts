import { Component, OnInit } from '@angular/core';
import { TourService } from '../tour.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants } from 'app/shared/classes/general';
import { Tour } from 'app/shared/models/tour.model'; // Assuming this path

@Component({
  standalone: false,
  selector: 'app-_detailtour',
  templateUrl: './detailTour.component.html',
  styleUrls: ['./detailTour.component.scss']
})
export class DetailTourComponent implements OnInit {

  tour: Tour;
  private tourId: string;
  activeTab: string = 'Itinerary';
  tabs = ['Itinerary', 'Members', 'Tournaments'];
  constructor(private router: ActivatedRoute, private route: Router, private _tourService: TourService, private _localStorage: LocalStorageService) { }

  ngOnInit(): void {
    this.router.paramMap.subscribe((params) => {
      this.tourId = params.get('id');
      if (this.tourId) {
        this._tourService.getTourById(this.tourId).then(data => {
          this.tour = data.tour[0];
          console.log('Tour data:', this.tour);
        });
      }
    });
  }

  setPrimaryTab(tab: string) {
    this.activeTab = tab;
  }

  activePrimaryTab() {
    return this.activeTab;
  }
}
