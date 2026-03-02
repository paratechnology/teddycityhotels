import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-form',
  templateUrl: './room-form.component.html',
  styleUrls: ['./room-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
})
export class RoomFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean;
  imagePreviews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RoomFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { room: Room }
  ) {
    this.isEditMode = !!data.room;
    if (this.isEditMode) {
      this.imagePreviews = [...this.data.room.images];
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.room?.name || '', Validators.required],
      type: [this.data.room?.type || '', Validators.required],
      price: [this.data.room?.price || '', [Validators.required, Validators.min(0)]],
      maxOccupancy: [this.data.room?.maxOccupancy || '', [Validators.required, Validators.min(1)]],
      description: [this.data.room?.description || ''],
      images: this.fb.array(this.data.room?.images || []),
    });
  }

  get images(): FormArray {
    return this.form.get('images') as FormArray;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      this.images.push(this.fb.control(preview));
      this.imagePreviews.push(preview);
    }
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
    this.imagePreviews.splice(index, 1);
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
