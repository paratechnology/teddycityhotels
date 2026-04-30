import { IProperty, IUpsertPropertyDto } from '@teddy-city-hotels/shared-interfaces';

/**
 * Data-source port for properties.
 *
 * Today the only implementation is FirestorePropertySource. When TCH starts
 * delegating management to QuickProHost, add a QuickProHostPropertySource
 * that talks to the QPH API and swap the registration in container.ts. The
 * controller, service, and UI layers do not change.
 */
export interface PropertySource {
  list(filter?: { status?: 'active' | 'draft' | 'archived' }): Promise<IProperty[]>;
  getById(id: string): Promise<IProperty | null>;
  getBySlug(slug: string): Promise<IProperty | null>;
  create(payload: IUpsertPropertyDto): Promise<IProperty>;
  update(id: string, payload: IUpsertPropertyDto): Promise<IProperty>;
  delete(id: string): Promise<void>;
}

export const PROPERTY_SOURCE_TOKEN = 'PropertySource';
