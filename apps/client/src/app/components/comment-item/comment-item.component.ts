import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonNote, IonButton, IonIcon, IonTextarea } from '@ionic/angular/standalone';
import { IComment } from '@quickprolaw/shared-interfaces';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, checkmark, close } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonItem, IonLabel, IonNote, IonButton, IonIcon, IonTextarea]
})
export class CommentItemComponent {
  @Input({ required: true }) comment!: IComment;
  @Output() editComment = new EventEmitter<{ commentId: string; content: string; }>();
  @Output() deleteComment = new EventEmitter<{ commentId: string; }>();

  private authService = inject(AuthService);

  public isEditing = signal(false);
  public editedContent = signal('');

  public canModify = computed(() => {
    const currentUser = this.authService.userProfile();
    if (!currentUser || !this.comment.createdBy) return false;
    // This assumes the ID on the user profile and the comment are comparable (e.g., both are Firebase Auth UIDs or both are Firestore Doc IDs)
    return currentUser.id === this.comment.createdBy.id;
  });

  constructor() {
    addIcons({ createOutline, trashOutline, checkmark, close });
  }

  onStartEdit() {
    this.editedContent.set(this.comment.content);
    this.isEditing.set(true);
  }

  onCancelEdit() {
    this.isEditing.set(false);
  }

  onSaveEdit() {
    const newContent = this.editedContent().trim();
    if (newContent && newContent !== this.comment.content) {
      // FIX: Emit the structured object, not a generic event.
      this.editComment.emit({
        commentId: this.comment.id,
        content: newContent
      });
    }
    this.isEditing.set(false);
  }

  onDelete() {
    // FIX: Emit the structured object.
    this.deleteComment.emit({ commentId: this.comment.id });
  }
}