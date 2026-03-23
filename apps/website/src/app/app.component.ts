import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./public/header/header.component";
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./public/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Teddy City Hotel';

  navLinks = [
    { label: 'Rooms & Suites', href: '/rooms', isExternal: false },
    { label: 'Kitchen', href: '/menu', isExternal: false },
    { label: 'Snooker League', href: '/snooker', isExternal: false },
    { label: 'Swimming', href: '/swimming', isExternal: false },
    { label: 'Contact', href: '/contact', isExternal: false }
  ];
}
