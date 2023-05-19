import axios from "axios";
import accents from "remove-accents";

import {Bet, BotEvent, Match, SlashCommand, ValuesObject} from "./types";
import {REST} from "@discordjs/rest";
import {Client} from "discord.js";
import {Routes} from "discord-api-types/v9";
import {readdirSync} from "fs";
import {join} from "path";

export let commands: any = [];

export async function load(client: Client) {
    let eventsDir = join(__dirname, "../events")
    let commandsDir = join(__dirname, "../commands")

    for (const file of readdirSync(eventsDir)) {
        if (!file.endsWith(".js")) {
            return;
        }

        let event: BotEvent = require(`${eventsDir}/${file}`).default;

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args))
        } else {
            client.on(event.name, (...args) => event.execute(...args))
        }
    }

    for (const file of readdirSync(commandsDir)) {
        if (!file.endsWith(".js")) {
            return;
        }

        const module: SlashCommand = require(`${commandsDir}/${file}`).default;
        commands[module.name] = module.builder.toJSON();
    }

    const rest: REST = new REST({version: "9"}).setToken(config.TOKEN);

    await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        {body: Object.values(commands)}
    );
}

export async function getMatchsByCompetition(competition: string, filterFinished: boolean = false): Promise<Array<Match>> {
    try {
        const resp = await axios.get(config.BET_API + "/" + competition);
        const matchs: Array<Match> = Object.values(resp.data);

        return filterFinished ? matchs.filter(match => match.status !== 0) : matchs;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export async function getAllCompetitionsMatchs(): Promise<ValuesObject> {
    let result: any = {};

    for (const competition of Object.keys(config.COMPETITIONS)) {
        const matchs = await getMatchsByCompetition(competition);

        for (const match of matchs) {
            const array = result[competition] || [];
            array.push(match);

            result[competition] = array;
        }
    }

    return result;
}

export async function getAllCompetitionsMatchsNumber(): Promise<ValuesObject> {
    const result: ValuesObject = {};
    const competitions = await getAllCompetitionsMatchs();

    for (const [competition, matchs] of Object.entries(competitions)) {
        for (const match of <Match[]>matchs) {
            if (match.status !== 0) {
                const number = <number>result[competition] || 0;
                result[competition] = number + 1;
            }
        }
    }

    return result;
}

export function randomColor(): any {
    const colors = config.COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
}

export function matchToID(competition: string, match: Match): string {
    const ids = db.getAllIds();
    const data = Buffer.from(accents.remove(competition + "|" + match.home + "|" + match.outside + "|" + match.hour)).toString("base64");

    for (const id of ids) {
        if (id.data === data) {
            return id.id;
        }
    }

    const id = createId();

    db.createId({
        id: id,
        data: data
    });

    return id;
}

function createId(): string {
    const caracters = "abcdefghijklmnopqrstuvwxyz1234567890";

    while (true) {
        let id = "";

        for (let i = 0; i < 5; i++) {
            id += caracters.charAt(Math.floor(Math.random() * caracters.length));
        }

        if (db.getId(id) === undefined) {
            return id;
        }
    }
}

export async function getMatchByID(id: string): Promise<Match | null> {
    const data = Buffer.from(db.getId(id).data, "base64").toString("ascii").split("|");
    const matchs = await getMatchsByCompetition(data[0]);

    for (const match of matchs) {
        if (
            match.status !== 0 &&
            accents.remove(match.home) === accents.remove(data[1]) &&
            accents.remove(match.outside) === accents.remove(data[2]) &&
            match.hour === data[3]
        ) {
            return match;
        }
    }
    return null;
}

export function arrayToPage(array: ValuesObject | Bet[], page: number, seperator: number) {
    const result: ValuesObject = {};
    const pageMax = Math.ceil(Object.keys(array).length / seperator);

    let count = 1;

    let min = (page * seperator) - seperator;
    let max = min + seperator;

    for (const [key, value] of Object.entries(array)) {
        if (count > max) {
            continue;
        } else if (count > min) {
            result[key] = value;
        }

        count++;
    }

    return [pageMax, result];
}