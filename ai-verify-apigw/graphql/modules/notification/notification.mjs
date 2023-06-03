"use strict"
import { NotificationModel } from '#models';

const resolvers = {
    Query: {
        notifications: async () => {
            const docs = await NotificationModel.find({});
            return docs;
        }
    },

    Mutation: {
        createNotification: async (_, {notif}) => {
            const result = await NotificationModel.create(notif);
            return result;
        },
        deleteNotification: async (_, {id}) => {
            const result = await NotificationModel.findByIdAndDelete(id);
            return result.id;
        },
        updateNotificationReadStatus: async (_, {id, readStatus}) => {
            const result = await NotificationModel.findByIdAndUpdate(id,{ readStatus }, { new: true });
            return result;
        }
    }
}

export default resolvers;
