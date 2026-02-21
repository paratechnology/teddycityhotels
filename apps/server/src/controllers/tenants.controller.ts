import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { FirestoreService } from '../services/firestore.service'; // Assuming you have this generic service
import { IFirmUser, ITenant } from '@teddy-city-hotels/shared-interfaces';

@injectable()
export class TenantsController {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService
  ) {}

  /**
   * Helper to get the firm-specific DB reference
   */
  private getCollection(firmId: string) {
    return this.firestore.db.collection('firms').doc(firmId).collection('tenants');
  }

  // GET /tenants
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IFirmUser;
      const snapshot = await this.getCollection(user.firmId)
        .orderBy('fullname')
        .get();

      const tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tenants);
    } catch (error) { next(error); }
  }

  // GET /tenants/search?q=John
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IFirmUser;
      const query = (req.query.q as string || '').toLowerCase();
      
      // Note: Firestore doesn't do "contains" natively. 
      // For scalability, you might use Algolia/Typesense. 
      // For MVP, we fetch all (or limit 100) and filter in memory, 
      // OR use the "startAt" trick for prefix search.
      
      const snapshot = await this.getCollection(user.firmId).get();
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITenant));
      
      const matches = all.filter(t => 
        t.fullname.toLowerCase().includes(query) || 
        t.phone.includes(query) || 
        t.email.toLowerCase().includes(query)
      );

      res.json(matches.slice(0, 20)); // Limit results
    } catch (error) { next(error); }
  }

  // POST /tenants
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IFirmUser;
      const data = req.body;

      const newTenant: Partial<ITenant> = {
        ...data,
        firmId: user.firmId,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const ref = await this.getCollection(user.firmId).add(newTenant);
      res.status(201).json({ id: ref.id, ...newTenant });
    } catch (error) { next(error); }
  }

  // PUT /tenants/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IFirmUser;
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: new Date().toISOString() };

      await this.getCollection(user.firmId).doc(id).update(updates);
      res.json({ id, ...updates });
    } catch (error) { next(error); }
  }

  // DELETE /tenants/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IFirmUser;
      const { id } = req.params;

      // Optional: Check if tenant has active leases before deleting
      // const activeLeases = await ... 
      
      await this.getCollection(user.firmId).doc(id).delete();
      res.status(204).send();
    } catch (error) { next(error); }
  }
}