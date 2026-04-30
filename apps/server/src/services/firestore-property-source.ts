import { inject, injectable } from 'tsyringe';
import {
  IProperty,
  IUpsertPropertyDto,
  defaultPropertyFeatureFlags,
} from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { NotFoundError } from '../errors/http-errors';
import { PropertySource } from './property-source.port';

@injectable()
export class FirestorePropertySource implements PropertySource {
  constructor(@inject(FirestoreService) private firestore: FirestoreService) {}

  private collection() {
    return this.firestore.db.collection('properties');
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private hydrate(payload: IUpsertPropertyDto, base?: IProperty): Omit<IProperty, 'id'> {
    const now = new Date().toISOString();
    return {
      slug: payload.slug || this.toSlug(payload.name),
      name: payload.name,
      shortDescription: payload.shortDescription,
      description: payload.description ?? base?.description,
      kind: payload.kind,
      status: payload.status ?? base?.status ?? 'active',
      branding: payload.branding,
      address: payload.address,
      geo: payload.geo ?? base?.geo,
      contact: payload.contact,
      features: { ...defaultPropertyFeatureFlags, ...(base?.features || {}), ...(payload.features || {}) },
      gallery: payload.gallery ?? base?.gallery ?? [],
      externalRef: payload.externalRef ?? base?.externalRef,
      displayOrder: payload.displayOrder ?? base?.displayOrder,
      createdAt: base?.createdAt ?? now,
      updatedAt: now,
    };
  }

  async list(filter?: { status?: IProperty['status'] }): Promise<IProperty[]> {
    let query: FirebaseFirestore.Query = this.collection();
    if (filter?.status) {
      query = query.where('status', '==', filter.status);
    }
    const snapshot = await query.get();
    const properties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IProperty));
    properties.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    return properties;
  }

  async getById(id: string): Promise<IProperty | null> {
    const doc = await this.collection().doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as IProperty;
  }

  async getBySlug(slug: string): Promise<IProperty | null> {
    const snapshot = await this.collection().where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as IProperty;
  }

  async create(payload: IUpsertPropertyDto): Promise<IProperty> {
    const slug = payload.slug || this.toSlug(payload.name);
    const existingBySlug = await this.getBySlug(slug);
    if (existingBySlug) {
      throw new Error(`A property with slug "${slug}" already exists.`);
    }

    const ref = this.collection().doc();
    const data = this.hydrate({ ...payload, slug });
    await ref.set(data);
    return { id: ref.id, ...data } as IProperty;
  }

  async update(id: string, payload: IUpsertPropertyDto): Promise<IProperty> {
    const existing = await this.getById(id);
    if (!existing) throw new NotFoundError(`Property "${id}" not found.`);

    if (payload.slug && payload.slug !== existing.slug) {
      const slugTaken = await this.getBySlug(payload.slug);
      if (slugTaken && slugTaken.id !== id) {
        throw new Error(`A property with slug "${payload.slug}" already exists.`);
      }
    }

    const data = this.hydrate(payload, existing);
    await this.collection().doc(id).set(data, { merge: true });
    return { id, ...data } as IProperty;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new NotFoundError(`Property "${id}" not found.`);
    await this.collection().doc(id).delete();
  }
}
