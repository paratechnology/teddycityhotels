import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonSearchbar, PopoverController } from '@ionic/angular/standalone';
import { IFirmUser } from '@quickprolaw/shared-interfaces';

@Component({
  selector: 'app-mention-popover',
  templateUrl: './mention-popover.component.html',
  styleUrls: ['./mention-popover.component.scss'],
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonSearchbar]
})
export class MentionPopoverComponent {
  @Input() users: IFirmUser[] = [];
  private popoverCtrl = inject(PopoverController);

  private searchTerm = signal('');
  public filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users;
    return this.users.filter(user => user.fullname.toLowerCase().includes(term));
  });

  onSearch(event: any) { this.searchTerm.set(event.detail.value || ''); }

  selectUser(user: IFirmUser) {
    this.popoverCtrl.dismiss({ selectedUser: user });
  }
}