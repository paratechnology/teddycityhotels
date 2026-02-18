// src/container.ts
import { container } from 'tsyringe';
import { AttendanceService } from './services/attendance.service'; // Adjust path
import { UserService } from './services/user.service';
import { MailService } from './services/mail.service';
import { CalendarService } from './services/calendar.service';
import { EndorsementsService } from './services/endorsements.service';

// Register services
container.registerSingleton(AttendanceService);
container.registerSingleton('IUsersService', UserService); // Register UsersService with its interface token
container.registerSingleton(MailService);
container.registerSingleton(CalendarService);
container.registerSingleton(EndorsementsService);
container.registerSingleton(EndorsementsService);
