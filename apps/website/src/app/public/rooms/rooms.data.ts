import { Room } from '@teddy-city-hotels/shared-interfaces';

export const ROOMS_DATA: Room[] = [
  {
    id: '1',
    name: 'Deluxe King Room',
    slug: 'deluxe-king-room',
    description: 'A spacious room with a king-sized bed, perfect for couples or solo travelers looking for comfort and style.',
    type: 'Double',
    maxOccupancy: 2,
    beds: [{ type: 'King', count: 1 }],
    price: 250,
    amenities: [
      { icon: 'wifi', name: 'Free Wi-Fi' },
      { icon: 'tv', name: 'Flat-screen TV' },
      { icon: 'coffee_maker', name: 'Coffee Maker' },
      { icon: 'local_bar', name: 'Minibar' },
      { icon: 'air', name: 'Air Conditioning' },
    ],
    images: [
      'assets/img/rooms/deluxe-king/1.webp',
      'assets/img/rooms/deluxe-king/2.webp',
    ],
    availability: { isAvailable: true },
    features: ['City View'],
  },
  {
    id: '2',
    name: 'Executive Suite',
    slug: 'executive-suite',
    description: 'Experience luxury in our Executive Suite, featuring a separate living area, premium amenities, and breathtaking ocean views.',
    type: 'Suite',
    maxOccupancy: 4,
    beds: [
      { type: 'King', count: 1 },
      { type: 'Single', count: 2 }
    ],
    price: 450,
    amenities: [
        { icon: 'wifi', name: 'Free Wi-Fi' },
        { icon: 'tv', name: 'Flat-screen TV' },
        { icon: 'coffee_maker', name: 'Coffee Maker' },
        { icon: 'local_bar', name: 'Minibar' },
        { icon: 'air', name: 'Air Conditioning' },
        { icon: 'kitchen', name: 'Kitchenette' },
    ],
    images: [
      'assets/img/rooms/executive-suite/1.webp',
      'assets/img/rooms/executive-suite/2.webp',
    ],
    availability: { isAvailable: true },
    features: ['Ocean View', 'Balcony', 'Jacuzzi'],
  },
  {
    id: '3',
    name: 'Standard Queen Room',
    slug: 'standard-queen-room',
    description: 'A comfortable and affordable room with a queen-sized bed, ideal for a short stay.',
    type: 'Single',
    maxOccupancy: 2,
    beds: [{ type: 'Queen', count: 1 }],
    price: 150,
    amenities: [
        { icon: 'wifi', name: 'Free Wi-Fi' },
        { icon: 'tv', name: 'Flat-screen TV' },
        { icon: 'air', name: 'Air Conditioning' },
    ],
    images: [
      'assets/img/rooms/standard-queen/1.webp',
    ],
    availability: { isAvailable: false },
    features: [],
  },
];
