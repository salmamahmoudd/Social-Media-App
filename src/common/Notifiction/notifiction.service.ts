import { title } from 'node:process';
import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import path from "node:path";

class NotificationService {
  private _client: admin.app.App;
    constructor() {
        const serviceAccount = JSON.parse(
            readFileSync(
                path.resolve("social-media-a1072-firebase-adminsdk-fbsvc-59a0c62c64.json",),
            ) as unknown as string
        );
        this._client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    async sendNotification({
        token,
        data,
    }:{
        token: string;
        data: {title: string; body: string};
    }) {
        return await this._client.messaging().send({
            token,
            data,
        })
    }
    async sendNotifications({
        tokens,
        data,
    }:{
        tokens: string[];
        data: {title: string; body: string};
    }) {
        return await Promise.all(
            tokens.map((token) => {
            return this.sendNotification({
                token,
                data,
            })
        }))
    }
}

export default new NotificationService();