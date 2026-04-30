import { inject, injectable } from 'tsyringe';
import { IProperty, IUpsertPropertyDto } from '@teddy-city-hotels/shared-interfaces';
import { PropertySource, PROPERTY_SOURCE_TOKEN } from './property-source.port';
import { NotFoundError } from '../errors/http-errors';

/**
 * PropertyService is the only thing controllers depend on. It delegates to
 * the configured PropertySource (Firestore today, QuickProHost API later).
 */
@injectable()
export class PropertyService {
  constructor(@inject(PROPERTY_SOURCE_TOKEN) private source: PropertySource) {}

  listPublic(): Promise<IProperty[]> {
    return this.source.list({ status: 'active' });
  }

  listAll(): Promise<IProperty[]> {
    return this.source.list();
  }

  async getById(id: string): Promise<IProperty> {
    const property = await this.source.getById(id);
    if (!property) throw new NotFoundError(`Property "${id}" not found.`);
    return property;
  }

  async getBySlug(slug: string): Promise<IProperty> {
    const property = await this.source.getBySlug(slug);
    if (!property) throw new NotFoundError(`Property "${slug}" not found.`);
    return property;
  }

  create(payload: IUpsertPropertyDto): Promise<IProperty> {
    return this.source.create(payload);
  }

  update(id: string, payload: IUpsertPropertyDto): Promise<IProperty> {
    return this.source.update(id, payload);
  }

  delete(id: string): Promise<void> {
    return this.source.delete(id);
  }
}
