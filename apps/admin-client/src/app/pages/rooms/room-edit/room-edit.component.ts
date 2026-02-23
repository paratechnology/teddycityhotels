import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../../services/room.service';
import { Room } from '@teddy-city-hotels/shared-interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {

  roomForm!: FormGroup;
  isEditMode = false;
  roomId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roomId;

    this.roomForm = this.fb.group({
      name: ['', Validators.required],
      type: ['Single', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      maxOccupancy: [1, [Validators.required, Validators.min(1)]],
    });

    if (this.isEditMode && this.roomId) {
      this.roomService.getRoom(this.roomId).subscribe(room => {
        this.roomForm.patchValue(room);
      });
    }
  }

  onSubmit(): void {
    if (this.roomForm.invalid) {
      return;
    }

    const roomData = this.roomForm.value;

    if (this.isEditMode && this.roomId) {
      this.roomService.updateRoom({ ...roomData, id: this.roomId }).subscribe(() => {
        this.router.navigate(['/rooms']);
      });
    } else {
      this.roomService.addRoom(roomData).subscribe(() => {
        this.router.navigate(['/rooms']);
      });
    }
  }
}
