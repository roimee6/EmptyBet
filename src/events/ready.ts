// noinspection JSUnusedGlobalSymbols

import { ActivityType } from "discord.js";

export default {
    name: "ready",
    once: true,
    execute: function () {
        console.log(`Logged in as ${client.user?.tag} !`);

        client.user?.setPresence({
            activities: [{
                name: "vos paris",
                type: ActivityType.Watching
            }]
        });
    }
}