import {load} from "./util/functions";
import {BET_API, CLIENT_ID, COLORS, COMPETITIONS, DB_PATH, TOKEN} from "./config.json";
import {Client} from "discord.js";
import DatabaseHelper from "./util/database";

declare global {
    // noinspection ES6ConvertVarToLetConst
    var config: any, client: Client, db: DatabaseHelper;
}

global.config = {
    BET_API: BET_API,
    CLIENT_ID: CLIENT_ID,
    TOKEN: TOKEN,
    COMPETITIONS: COMPETITIONS,
    COLORS: COLORS
}

global.db = new DatabaseHelper(DB_PATH);

global.client = new Client({
    intents: 25767
});

load(client);

client.login(config.TOKEN);