export interface Amenity {
  icon: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  roomNumber?: string;
  description: string;
  type: 'Single' | 'Double' | 'Suite' | 'Penthouse';
  maxOccupancy: number;
  beds: {
    type: 'King' | 'Queen' | 'Double' | 'Single';
    count: number;
  }[];
  price: number;
  amenities: Amenity[];
  images: string[];
  availability: {
    isAvailable: boolean;
  };
  features?: string[];
}

export interface UpsertRoomDto {
  name: string;
  slug?: string;
  roomNumber?: string;
  description: string;
  type: 'Single' | 'Double' | 'Suite' | 'Penthouse';
  maxOccupancy: number;
  beds: {
    type: 'King' | 'Queen' | 'Double' | 'Single';
    count: number;
  }[];
  price: number;
  amenities: Amenity[];
  images: string[];
  availability?: {
    isAvailable: boolean;
  };
  features?: string[];
}
