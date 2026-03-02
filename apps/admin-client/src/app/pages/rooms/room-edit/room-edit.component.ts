import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room.service';
import { Room, UpsertRoomDto } from '@teddy-city-hotels/shared-interfaces';

@Component({
  selector: 'app-room-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss'],
})
export class RoomEditComponent implements OnInit {
  roomForm!: FormGroup;
  isEditMode = false;
  roomId: string | null = null;
  error = '';

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roomId;

    this.roomForm = this.fb.group({
      name: ['', Validators.required],
      roomNumber: [''],
      type: ['Single', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      maxOccupancy: [1, [Validators.required, Validators.min(1)]],
      isAvailable: [true],
      beds: this.fb.array([]),
      amenities: this.fb.array([]),
      images: this.fb.array([]),
      features: this.fb.array([]),
    });

    this.addBed();
    this.addAmenity();
    this.addImage();
    this.addFeature();

    if (this.isEditMode && this.roomId) {
      this.roomService.getRoom(this.roomId).subscribe({
        next: (room) => this.patchRoom(room),
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load room.';
        },
      });
    }
  }

  get beds(): FormArray {
    return this.roomForm.get('beds') as FormArray;
  }

  get amenities(): FormArray {
    return this.roomForm.get('amenities') as FormArray;
  }

  get images(): FormArray {
    return this.roomForm.get('images') as FormArray;
  }

  get features(): FormArray {
    return this.roomForm.get('features') as FormArray;
  }

  addBed(): void {
    this.beds.push(
      this.fb.group({
        type: ['Queen', Validators.required],
        count: [1, [Validators.required, Validators.min(1)]],
      })
    );
  }

  removeBed(index: number): void {
    this.beds.removeAt(index);
  }

  addAmenity(): void {
    this.amenities.push(
      this.fb.group({
        icon: ['star'],
        name: ['', Validators.required],
      })
    );
  }

  removeAmenity(index: number): void {
    this.amenities.removeAt(index);
  }

  addImage(): void {
    this.images.push(this.fb.control(''));
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
  }

  addFeature(): void {
    this.features.push(this.fb.control(''));
  }

  removeFeature(index: number): void {
    this.features.removeAt(index);
  }

  onSubmit(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    const value = this.roomForm.getRawValue();
    const payload: UpsertRoomDto = {
      name: value.name,
      roomNumber: value.roomNumber,
      description: value.description,
      type: value.type,
      maxOccupancy: Number(value.maxOccupancy),
      price: Number(value.price),
      beds: value.beds,
      amenities: value.amenities.filter((item: { name: string }) => !!item.name),
      images: value.images.filter((item: string) => !!item),
      features: value.features.filter((item: string) => !!item),
      availability: { isAvailable: !!value.isAvailable },
    };

    if (this.isEditMode && this.roomId) {
      this.roomService.updateRoom(this.roomId, payload).subscribe({
        next: () => this.router.navigate(['/rooms']),
        error: (error) => {
          this.error = error?.error?.message || 'Failed to update room.';
        },
      });
      return;
    }

    this.roomService.addRoom(payload).subscribe({
      next: () => this.router.navigate(['/rooms']),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to create room.';
      },
    });
  }

  private patchRoom(room: Room): void {
    this.roomForm.patchValue({
      name: room.name,
      roomNumber: room.roomNumber || '',
      type: room.type,
      price: room.price,
      description: room.description,
      maxOccupancy: room.maxOccupancy,
      isAvailable: room.availability?.isAvailable !== false,
    });

    this.setFormArray(this.beds, room.beds || [], (item: any) =>
      this.fb.group({
        type: [item.type || 'Queen', Validators.required],
        count: [item.count || 1, [Validators.required, Validators.min(1)]],
      })
    );

    this.setFormArray(this.amenities, room.amenities || [], (item: any) =>
      this.fb.group({
        icon: [item.icon || 'star'],
        name: [item.name || '', Validators.required],
      })
    );

    this.setFormArray(this.images, room.images || [], (item: string) => this.fb.control(item));
    this.setFormArray(this.features, room.features || [], (item: string) => this.fb.control(item));

    if (!this.images.length) this.addImage();
    if (!this.features.length) this.addFeature();
  }

  private setFormArray(formArray: FormArray, data: any[], factory: (item: any) => any) {
    while (formArray.length) {
      formArray.removeAt(0);
    }

    data.forEach((item) => formArray.push(factory(item)));
  }
}
