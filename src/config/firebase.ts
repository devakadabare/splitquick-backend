import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'splitquick-a447c',
  });
}

export const firebaseAuth = admin.auth();
