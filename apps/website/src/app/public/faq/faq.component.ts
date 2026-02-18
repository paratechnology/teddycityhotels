import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MaterialModule } from '../../core/services/material.module';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})

export class FaqComponent {
  faqs: FaqItem[] = [
    {
      question: 'Is QuickProLaw suitable for both solo practitioners and law firms?',
      answer: 'Absolutely! QuickProLaw offers scalable plans designed to meet the needs of solo practitioners, small firms, and larger enterprises. Our features are adaptable to various practice sizes and areas of law.'
    },
    {
      question: 'How secure is my data with QuickProLaw?',
      answer: "We prioritize the security of your data. QuickProLaw utilizes robust encryption, secure cloud storage provided by Google Firebase, and strict access controls to safeguard your sensitive information. Our platform adheres to industry best practices and complies with legal and ethical standards."
    },
    {
      question: 'Can QuickProLaw integrate with my existing tools and software?',
      answer: "Yes, QuickProLaw is designed for flexibility. We offer integrations with popular calendars, email providers, and accounting software. We also have a robust API for custom integrations to fit your unique workflow."
    },
    {
      question: 'What devices is QuickProLaw compatible with?',
      answer: "QuickProLaw is available across all your devices. We offer dedicated native applications for Android, iOS, and Desktop (Windows & macOS) for the most powerful and integrated experience. You can also access the full suite of features through any modern web browser on your computer, tablet, or smartphone."
    }
  ];
}