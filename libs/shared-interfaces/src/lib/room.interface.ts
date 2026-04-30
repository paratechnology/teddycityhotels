export interface Amenity {
  icon: string;
  name: string;
}

export interface Room {
  id: string;
  /**
   * The property this room belongs to. Optional during the migration to a
   * multi-property model — existing rooms without this field are treated as
   * belonging to the default Teddy City Enugu property.
   */
  propertyId?: string;
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
  propertyId?: string;
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
