import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {
  testimonials = [
    {
      quote: "QuickProLaw has been a game-changer for our firm. The ability to see all case details in one dashboard has saved us countless hours and significantly reduced administrative errors.",
      author: "Barr. D.N Chigbo-Okeke ",
      title: "Associate, Saxum Legal"
    },
    {
      quote: "The financial management and trust accounting features are incredibly robust and intuitive. It has simplified our billing process and given us a clearer picture of our firm's financial health.",
      author: "Stanley Afuba",
      title: "Solo Practitioner"
    },
    {
      quote: "As a paralegal, the task management and collaboration tools are phenomenal. I can easily see my assignments, deadlines, and communicate with the team, all within the context of the case.",
      author: "Ezenwadi Valentine",
      title: "Senior Paralegal, B&O Legal"
    }
  ];
}