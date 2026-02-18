import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class BookingController {

  public getRoomAvailability = async (req: Request, res: Response) => {
    // Placeholder logic
    res.status(200).json({
      success: true,
      available: true,
      rooms: ['Standard', 'Deluxe', 'Suite']
    });
  }

  public createBooking = async (req: Request, res: Response) => {
    const { guestName, roomType, dates } = req.body;
    // Assume booking logic here
    res.status(201).json({
      success: true,
      message: `Booking confirmed for ${guestName} in ${roomType}.`
    });
  }
}
