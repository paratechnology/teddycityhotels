import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class SwimmingController {

  public getOfferings = async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: ['Memberships', 'Lessons', 'Casual Swim']
    });
  }

  public bookLesson = async (req: Request, res: Response) => {
    const { name, date, time } = req.body;
    res.status(201).json({
      success: true,
      message: `Lesson booked for ${name} on ${date} at ${time}.`
    });
  }
}
