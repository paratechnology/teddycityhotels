import { inject, injectable } from 'tsyringe';
import { IFirm, IFirmUser, IGeneralFile, ILibraryBook, IMatter, IinventoryItem } from '@teddy-city-hotels/shared-interfaces';
import { FirestoreService } from './firestore.service';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/http-errors';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { Readable } from 'stream';
import { EncryptionService } from './encryption.service';
@injectable()
export class UserService {
  constructor(
    @inject(FirestoreService) private firestore: FirestoreService,
    @inject(EncryptionService) private encryptionService: EncryptionService
  ) { }

  private getUsersCollection(firmId: string) {
    return this.firestore.db.collection(`firms/${firmId}/users`);
  }

  async findById(firmId: string, userId: string): Promise<IFirmUser> {
    const doc = await this.getUsersCollection(firmId).doc(userId).get();
    if (!doc.exists) {
      throw new NotFoundError(`User with ID "${userId}" not found.`);
    }
    const user = { id: doc.id, ...doc.data() } as IFirmUser;

    // --- INTERN LOGIC: Auto-deactivate after 6 PM ---
    if (user.designation === 'Intern' && user.active !== false) {
      const now = new Date();
      // Note: This uses Server Time. Ideally, convert 'now' to the Firm's specific timezone.
      const currentHour = now.getHours();
      
      // If it is 6 PM (18:00) or later, deactivate the account.
      if (currentHour >= 18) {
        await this.getUsersCollection(firmId).doc(userId).update({ active: false });
        user.active = false;
      }
    }

    // Block access if inactive
    if (user.active === false) {
      throw new UnauthorizedError('Account is inactive. Please contact your administrator.');
    }

    return user;
  }


  // Add this method to the UserService class
  async findAllByFirm(firmId: string): Promise<IFirmUser[]> {
    const usersCollection = this.getUsersCollection(firmId);
    const snapshot = await usersCollection.orderBy('firstName').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IFirmUser));
  }

  async updateUserStatus(firmId: string, userId: string, active: boolean): Promise<void> {
    await this.getUsersCollection(firmId).doc(userId).update({ active });
  }

  async markTourAsSeen(firmId: string, userId: string, tourId: string): Promise<void> {
    await this.getUsersCollection(firmId).doc(userId).update({
      seenTours: admin.firestore.FieldValue.arrayUnion(tourId),
    });
  }

  async findMyPossessions(firmId: string, userId: string): Promise<IinventoryItem[]> {
    // 1. Find Matter Files in my possession
    const mattersQuery = this.firestore.db.collection(`firms/${firmId}/matters`)
      .where('physicalFile.currentPossessor.id', '==', userId);
    const mattersSnapshot = await mattersQuery.get();
    const matterFiles: IinventoryItem[] = mattersSnapshot.docs.map(doc => {
      const data = doc.data() as IMatter;
      return {
        id: data.id,
        type: 'Matter File',
        name: data.title,
        code: data.fileNo,
        link: `/app/matters/${data.id}`,
        lastMoved: data.physicalFile?.lastMoved
      };
    });

    // 2. Find General Files in my possession
    const generalFilesQuery = this.firestore.db.collection(`firms/${firmId}/generalFiles`)
      .where('currentPossessor.id', '==', userId);
    const generalFilesSnapshot = await generalFilesQuery.get();
    const generalFiles: IinventoryItem[] = generalFilesSnapshot.docs.map(doc => {
      const data = doc.data() as IGeneralFile;
      return { id: data.id, type: 'General File', name: data.fileName, code: data.fileCode, link: `/app/file-room` };
    });

    // 3. Find Library Books in my possession
    const booksQuery = this.firestore.db.collection(`firms/${firmId}/libraryBooks`)
      .where('currentPossessor.id', '==', userId);
    const booksSnapshot = await booksQuery.get();
    const libraryBooks: IinventoryItem[] = booksSnapshot.docs.map(doc => {
      const data = doc.data() as ILibraryBook;
      return { id: data.id, type: 'Library Book', name: data.title, code: data.isbn, link: `/app/library` };
    });

    // 4. Combine and sort all items
    const combined = [...matterFiles, ...generalFiles, ...libraryBooks];
    combined.sort((a, b) => {
      const dateA = a.lastMoved ? new Date(a.lastMoved).getTime() : 0;
      const dateB = b.lastMoved ? new Date(b.lastMoved).getTime() : 0;
      return dateB - dateA; // Sort by most recently moved first
    });

    return combined;
  }


  /**
   * Generates a signed URL for uploading a profile picture directly to Google Cloud Storage.
   * @param firmId The ID of the firm the user belongs to.
   * @param userId The ID of the user uploading the picture.
   * @param contentType The MIME type of the file to be uploaded.
   * @returns An object containing the signed `uploadUrl` and the final `publicUrl`.
   */
  public async generateProfilePictureUploadUrl(firmId: string, userId: string, contentType: string): Promise<{ uploadUrl: string, publicUrl: string }> {
    if (!firmId || !userId) {
      throw new BadRequestError('Firm ID and User ID are required.');
    }

    const bucket = this.firestore.storage.bucket('quickprolaw-cloud.firebasestorage.app'); // Get default bucket
    const filePath = `firms/${firmId}/users/${userId}/profile-picture`; // Use a consistent name to allow overwriting
    const file = bucket.file(filePath);

    // Generate a v4 signed URL for writing (uploading) the file.
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });

    // The public URL is predictable.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return { uploadUrl, publicUrl };
  }

  public async generateSignatureUploadUrl(firmId: string, userId: string): Promise<{ uploadUrl: string }> {
    const userRef = this.getUsersCollection(firmId).doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new NotFoundError('User not found.');
    const accessToken = await this.getPersonalAccessToken(userDoc.data() as IFirmUser);
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Get the user's personal drive ID
    const driveResponse = await axios.get('https://graph.microsoft.com/v1.0/me/drive', { headers });
    const driveId = driveResponse.data.id;

    // 1. Find or create "QuickProLaw" folder
    const qplFolder = await this.findOrCreateGraphFolder(accessToken, driveId, 'root', 'QuickProLaw');

    // 2. Find or create "Signatures" folder
    const signaturesFolder = await this.findOrCreateGraphFolder(accessToken, driveId, qplFolder.id, 'Signatures');

    // 3. Create an upload session for the user's signature file
    const fileName = `${userId}.png`;
    const uploadSessionUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${signaturesFolder.id}:/${fileName}:/createUploadSession`;

    const response = await axios.post(uploadSessionUrl, {
      item: { '@microsoft.graph.conflictBehavior': 'replace' }
    }, { headers });

    // The 'createUploadSession' response gives us a temporary URL to upload to.
    // It does NOT create the item yet, so we can't get a preview link here.
    // The client will upload the file, and then call back to a 'finalize' endpoint.
    return { uploadUrl: response.data.uploadUrl };
  }

  public async finalizeSignatureUpload(firmId: string, userId: string, itemId: string): Promise<void> {
    const userRef = this.getUsersCollection(firmId).doc(userId);
    
    // STRICT UPDATE: We only save the ID. We do NOT save the URL.
    await userRef.update({ 
      signatureItemId: itemId,
      signatureUrl: admin.firestore.FieldValue.delete() 
    });
  }

  public async getSignatureStream(firmId: string, userId: string): Promise<{ stream: Readable, contentType: string }> {
    const userRef = this.getUsersCollection(firmId).doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new NotFoundError('User not found.');

    const userData = userDoc.data() as IFirmUser;
    
    if (!userData.signatureItemId) {
      throw new NotFoundError('No signature found.');
    }

    const accessToken = await this.getPersonalAccessToken(userData);

    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${userData.signatureItemId}/content`;
    
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        responseType: 'stream'
      });

      return {
        stream: response.data,
        contentType: response.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Graph API Error:', error.message);
      throw new Error('Failed to retrieve signature.');
    }
  }

  public async removeSignature(firmId: string, userId: string): Promise<void> {
    const userRef = this.getUsersCollection(firmId).doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new NotFoundError('User not found.');

    const userData = userDoc.data() as IFirmUser;
    const signatureItemId = userData.signatureItemId;

    if (!signatureItemId) return; // Nothing to remove

    const accessToken = await this.getPersonalAccessToken(userData);
    const deleteUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${signatureItemId}`;

    try {
      await axios.delete(deleteUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    } catch (error: any) {
      // If the file is already gone (404), we don't care.
      if (error.response?.status !== 404) {
        console.error('Graph API Error (removeSignature):', error.response?.data || error.message);
        throw new Error('Failed to delete signature from OneDrive.');
      }
    }

    // Clear the fields from the user's profile
    await userRef.update({
      signatureItemId: admin.firestore.FieldValue.delete(),
      signatureUrl: admin.firestore.FieldValue.delete()
    });
  }

  public async connectPersonalMicrosoftAccount(firmId: string, userId: string, authCode: string, redirectUri: string): Promise<void> {
    const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', process.env['MS_APP_ID']!);
    params.append('client_secret', process.env['MS_APP_SECRET']!);
    params.append('scope', 'offline_access files.readwrite.all user.read');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await axios.post(tokenEndpoint, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { refresh_token, access_token } = tokenResponse.data;
    if (!refresh_token) {
      throw new BadRequestError('Could not obtain a refresh token from Microsoft. Please ensure offline_access scope is granted.');
    }

    // 1. Fetch the Microsoft Profile to get the email
    const msProfileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const msEmail = (msProfileResponse.data.mail || msProfileResponse.data.userPrincipalName || '').toLowerCase();

    // 2. Check against the Firm's Storage Integration
    const firmDoc = await this.firestore.db.collection('firms').doc(firmId).get();
    const firm = firmDoc.data() as IFirm;

    if (firm.microsoftIntegration?.configuredBy?.email && firm.microsoftIntegration.configuredBy.email.toLowerCase() === msEmail) {
      throw new BadRequestError('This Microsoft account is already connected as the Firm\'s storage provider. Please use a different personal account for your signature.');
    }

    // 3. Check if ANY other user IN THIS FIRM has already connected this Microsoft account
    // Using a firm-scoped query avoids the need for a global collectionGroup index.
    const duplicateUserQuery = await this.getUsersCollection(firmId)
      .where('signatureEmail', '==', msEmail)
      .get();

    const isUsedByOther = duplicateUserQuery.docs.some(doc => doc.id !== userId);
    if (isUsedByOther) {
      throw new BadRequestError('This Microsoft account is already connected to another user profile in this firm. Please use a unique account.');
    }

    // Encrypt the refresh token
    const encryptedRefreshToken = this.encryptionService.encrypt(refresh_token);

    // 4. Securely store the user-specific refresh token AND the email for future checks
    const userRef = this.getUsersCollection(firmId).doc(userId);
    await userRef.update({ signatureRefreshToken: encryptedRefreshToken, signatureEmail: msEmail });
  }

  public async removePersonalMicrosoftAccount(firmId: string, userId: string): Promise<void> {
    const userRef = this.getUsersCollection(firmId).doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new NotFoundError('User not found.');

    const userData = userDoc.data() as IFirmUser;
    const signatureItemId = userData.signatureItemId;

    // If there's a signature file, attempt to delete it from OneDrive first.
    if (signatureItemId && userData.signatureRefreshToken) {
      try {
        const accessToken = await this.getPersonalAccessToken(userData);
        const deleteUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${signatureItemId}`;
        await axios.delete(deleteUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      } catch (error: any) {
        // Log the error but don't prevent clearing the Firestore record
        // if the file is already gone or there's a transient issue.
        if (error.response?.status !== 404) {
          console.warn('Failed to delete signature file from OneDrive during integration removal:', error.response?.data || error.message);
        }
      }
    }

    // Clear all personal Microsoft integration related fields from the user's profile
    await userRef.update({
      signatureItemId: admin.firestore.FieldValue.delete(),
      signatureUrl: admin.firestore.FieldValue.delete(),
      signatureRefreshToken: admin.firestore.FieldValue.delete(),
      signatureEmail: admin.firestore.FieldValue.delete()
    });
  }


  // --- PRIVATE HELPERS ---

  private async getPersonalAccessToken(user: IFirmUser): Promise<string> {
    const refreshToken = user.signatureRefreshToken;
    if (!refreshToken) {
      throw new BadRequestError('Personal Microsoft account is not connected. Please connect your account in your profile to use this feature.');
    }

    // Decrypt the token
    const plainTextRefreshToken = this.encryptionService.decrypt(refreshToken);

    const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', process.env['MS_APP_ID']!);
    params.append('scope', 'offline_access files.readwrite.all user.read');
    params.append('refresh_token', plainTextRefreshToken);
    params.append('grant_type', 'refresh_token');
    params.append('client_secret', process.env['MS_APP_SECRET']!);

    const response = await axios.post(tokenEndpoint, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data.access_token;
  }

  private async findOrCreateGraphFolder(accessToken: string, driveId: string, parentItemId: string, folderName: string): Promise<any> {
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const searchUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItemId}/children?$filter=name eq '${folderName}'`;

    const searchResponse = await axios.get<{ value: any[] }>(searchUrl, { headers });

    if (searchResponse.data.value && searchResponse.data.value.length > 0) {
      return searchResponse.data.value[0];
    } else {
      const createUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItemId}/children`;
      const body = { name: folderName, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' };
      const createResponse = await axios.post(createUrl, body, { headers });
      return createResponse.data;
    }
  }

  getAllActiveUsersService(firmId: string) {
    return
  }
}
