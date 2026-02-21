export interface Amenity {
  icon: string;
  name: string;
}

export interface Room {
  id: string; // Unique identifier for the room
  name: string; // e.g., "Presidential Suite"
  slug: string; // URL-friendly version of the name
  description: string;
  type: 'Single' | 'Double' | 'Suite' | 'Penthouse';
  maxOccupancy: number;
  beds: {
    type: 'King' | 'Queen' | 'Double' | 'Single';
    count: number;
  }[];
  price: number; // Price per night
  amenities: Amenity[]; // List of amenities
  images: string[]; // URLs of room images
  availability: {
    isAvailable: boolean;
    // can add more complex availability rules here if needed
    // e.g., blocked dates
  };
  features?: string[]; // Optional additional features, e.g., "Ocean View", "Balcony"
}
