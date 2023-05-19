// noinspection JSUnusedGlobalSymbols

import {ActivityType} from "discord.js";
import {getAllCompetitionsMatchs, matchToID} from "../util/functions";
import {Match, ValuesObject} from "../util/types";

export default {
    name: "ready",
    once: true,
    execute: async function () {
        console.log(`Logged in as ${client.user?.tag} !`);

        const competitions = await getAllCompetitionsMatchs();

        await giveRewards(competitions);
        await setRandomPresence(competitions);

        setInterval(async () => {
            const competitions = await getAllCompetitionsMatchs();

            await giveRewards(competitions);
            await setRandomPresence(competitions);
        }, 5 * 60 * 1000);
    }
}

async function giveRewards(competitions: ValuesObject) {
    const balances = db.getAllUsersBalance();

    for (const [competition, matchs] of Object.entries(competitions)) {
        for (const match of <Match[]>matchs) {
            if (match.status === 0) {
                const id = matchToID(competition, match);

                for (const balance of balances) {
                    const bets = typeof balance.bets !== "string" ? balance.bets || [] : [];

                    for (const bet of bets) {
                        if (bet.id === id && bet.claimed === 0) {
                            if (match.winner === bet.winner) {
                                balance.money += bet.amount * bet.odd;
                                bet.claimed = 1;
                            } else {
                                bet.claimed = 2;
                            }

                            console.log(bet);
                            console.log(balance);
                        }
                    }

                    balance.bets = bets;
                    db.setBalance(balance);
                }
            }
        }
    }
}

async function setRandomPresence(competitions: ValuesObject) {
    for (const [, matchs] of Object.entries(competitions)) {
        for (const match of <Match[]>matchs) {
            if (match.status === 1) {
                setPresence(match.home + " contre " + match.outside);
                return;
            }
        }
    }

    setPresence("vos paris");
}

function setPresence(name: string) {
    client.user?.setPresence({
        activities: [{
            name: name,
            type: ActivityType.Watching
        }]
    });
}