import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../core/services/material.module';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [MaterialModule, RouterModule],
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.scss']
})
export class HeroComponent { }
