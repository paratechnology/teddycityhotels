import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { MainContentComponent } from './main-content.component';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    MainContentComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    MainContentComponent
  ]
})
export class LayoutModule { }
