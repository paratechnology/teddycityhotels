import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

const SUPERUSER_EMAIL = 'parabolictechspace@gmail.com';
const SUPERUSER_NAME = 'Parabolic Cap';

const buildServiceAccount = () => {
  return {
    projectId: "teddycityhotels1",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi0mcs1pDG92WK\njnEKYd3AWdlYTvLoX7/q5UM0AG1XZJm4UIfyAEsF3d7k4IMgAQxbBM5SP6nWnF7K\nulzngNTsU4H5uvm2YVwA9ReJphikHKyMHNa0uJCAAnkkzSVt9ZlsGFMehrgBZ0Wp\nxpWzOy0QXES24X0cv2Enp240MaNqjGffBx+t4XJPJMDaGc+SSL+SDd78F64KDIUN\naW+HKuHmhqY+XK3ntJixSeP4FlNAPiVXBNEQXXgnU18j0nTMgL7/qRAATuHPMUQZ\nkXuUdS+AVx7nOkwusi9HkoflEW64Kl6lMxdq8n/RrpecN8TSPIyXI0ZqKwPJ+eKf\nQQbAE8GBAgMBAAECggEABFfpBS7vG0Onu4e7t7tvGy26aMroW28Mc1Ns1MMLJ6jp\nGdvaGIhN+AjYZJIhpVWp0vbAmzyUBwPSWoWYq1tKMsiyf6svdKBJwEPJfjRGVYBn\nUPCHALiosCWAvkzTqgiCcHoAo6CT4YOz/cisnySdueFAOwGuYPkw+goTHETTt2if\nB62NmwUYMJUH96SkQIp//rHhX610YAsJUqXlH4rtQnNuBnxgrxwkJU1uc43MkzzQ\nDGBSU/FHPwXJBnnaw2JeokKaeS6WXKCg0+540Nzl3EOB62uvTX5QxW2XKaScPq25\n1ve4E1hcBKOkhXgC105SPwTqNjb9DsFIphPybLZvwQKBgQDWu0LqExMfMoS7MYIf\nfIDCzwChJS3LEHM49hDG6mx6TxEM8Qy/qxhcE2jlUuprYSpGmRHkk+Oi6o3Lbwtg\nE1ueuN1VPSGnVxqsQKqJAGjP3uARgCR8wHK9EFNGQ2dTzwEEj1O4DW/uHYLsJq5u\neZGhWYzggPlurkrbSpOPuoolUQKBgQDCHTOQ7lpR113v9goHsq7VFj5SqTcfMg+1\nDlhvlgmERg1OV1IHbMaEq2mdhraq/KMAk6Yp1th5RUKffgeV/OMVIPHqBKjY6fDR\n+NqJrxID3gi5uiuPMa5LC9BIvGKNhlxYHervMFhhTuOjY5gCI1ezgoiQIzmF6rBS\n8lWa8oWNMQKBgGr24UBEvDPAMIonAVC57lIcV43uPT94NE1dlcHgqKTMmgu+T8Fy\nczH6oTgK86cFwc9lFJquaKiQ+o0qBZqYSf1ozShWyVrYcvr3Q3v3bj6OIUPWd1aF\nbyJq7XCExwXiiflBhEyctPMCVGNaaW2ytS6QszJqTNYrkDJoldT08TfhAoGACFyH\npxuNSm8zfa2kevZob4dYwejGFhLq+EqY5p2Y5Vi7I//A6c72sipMD1wJLE5bmx/B\nDZZSls6z8vjTzNMq2PMlWIZA268gD3tftoSTCxWaXJ23WKC0OElW/HsY56289pK7\nVvhHJlHmnlgg6R6qnXHm/gZ2aN1WIQyNQXJm7FECgYEA1ikncuuSLlg7qMMR/ymg\nhRlG3bW/Qvasv4wxiiJoSxtpKy4wsD/H4s2nOOQqADDDGGUZace78NrbdG8JYQYj\ntsyzXpYe09DLComRJcJrltqYgUP/UsbWywgeayIikFfM0K1DNZ7l2DT6AjG/ZZJB\n60YF8yp1vyp6od24i7bg1iE=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
    clientEmail: "firebase-adminsdk-fbsvc@teddycityhotels1.iam.gserviceaccount.com",
  };
};

const generatePassword = () => {
  const raw = randomBytes(12).toString('base64url');
  return `${raw}A!`;
};

async function run() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(buildServiceAccount()),
      projectId: "teddycityhotels1",
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  const adminAccess = {
    dashboard: true,
    rooms: true,
    bookings: true,
    snooker: true,
    financials: true,
    revenue: true,
    kitchen: true,
    notifications: true,
    admins: true,
  };

  let userRecord: UserRecord;
  let generatedPassword = '';
  let isNewUser = false;

  try {
    userRecord = await auth.getUserByEmail(SUPERUSER_EMAIL);
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    generatedPassword = generatePassword();
    userRecord = await auth.createUser({
      email: SUPERUSER_EMAIL,
      password: generatedPassword,
      displayName: SUPERUSER_NAME,
      emailVerified: true,
    });
    isNewUser = true;
  }

  await auth.setCustomUserClaims(userRecord.uid, {
    admin: true,
    isSuperAdmin: true,
    adminAccess,
    fullname: SUPERUSER_NAME,
  });

  const now = new Date().toISOString();
  await db.collection('adminUsers').doc(userRecord.uid).set(
    {
      id: userRecord.uid,
      fullname: SUPERUSER_NAME,
      email: SUPERUSER_EMAIL,
      admin: true,
      isSuperAdmin: true,
      active: true,
      adminAccess,
      fcmTokens: [],
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  console.log('\nSuperuser bootstrap completed.');
  console.log(`Email: ${SUPERUSER_EMAIL}`);
  console.log(`UID: ${userRecord.uid}`);
  if (isNewUser) {
    console.log(`Temporary password (one-time): ${generatedPassword}`);
  } else {
    console.log('User already existed. Password was not changed.');
  }
}

run().catch((error) => {
  console.error('\nFailed to create superuser:', error);
  process.exit(1);
});
