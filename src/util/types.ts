import {CommandInteraction, SlashCommandBuilder} from "discord.js"

export interface SlashCommand {
    name: string
    builder: SlashCommandBuilder,

    run: (interaction: CommandInteraction) => void,
}

export interface BotEvent {
    name: string,
    once?: boolean | false,

    execute: (...args: any[]) => void
}

export interface Match {
    home: string,
    outside: string,
    home_odd: number,
    neutral_odd: number,
    outside_odd: number,
    day: string,
    hour: string,
    status: number,
    winner: string | null
}

export interface ValuesObject {
    [key: string]: any;
}

export interface Bet {
    id: string,
    odd: number,
    amount: number,
    claimed: number, // 0 = not claimed, 1 = winned, 2 = lost
    winner: string | null
}