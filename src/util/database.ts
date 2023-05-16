import Database from "better-sqlite3";

import {Snowflake} from "discord.js";
import {Bet} from "./types";

export interface Balance {
    userID: Snowflake;
    serverID: Snowflake;

    money: number;

    bets: Array<Bet> | string;
}

export interface Id {
    id: string;
    data: string;
}

export default class DatabaseHelper {
    private static getBalStatement: Database.Statement;
    private static getAllServerBalsStatement: Database.Statement;
    private static getAllUserBalsStatement: Database.Statement;
    private static setBalStatement: Database.Statement;

    private static getIdStatement: Database.Statement;
    private static getAllIdsStatement: Database.Statement;
    private static setIdStatement: Database.Statement;

    private db: Database.Database;

    constructor(filePath: string) {
        this.db = new Database(filePath);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS balance (
                userID TEXT NOT NULL,
                serverID TEXT NOT NULL,
                money INT NOT NULL,
                bets TEXT NOT NULL,
                UNIQUE(userID, serverID)
            );
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ids (
                id TEXT NOT NULL,
                data TEXT NOT NULL,
                UNIQUE(id, data)
            );
        `);

        if (!DatabaseHelper.getBalStatement) {
            DatabaseHelper.getBalStatement = this.db.prepare(
                "SELECT money,bets FROM balance WHERE userID=? AND serverID=?"
            );
        }

        if (!DatabaseHelper.getIdStatement) {
            DatabaseHelper.getIdStatement = this.db.prepare(
                "SELECT data FROM ids WHERE id=?"
            );
        }

        if (!DatabaseHelper.getAllIdsStatement) {
            DatabaseHelper.getAllIdsStatement = this.db.prepare(
                "SELECT id, data FROM ids"
            );
        }

        if (!DatabaseHelper.getAllUserBalsStatement) {
            DatabaseHelper.getAllUserBalsStatement = this.db.prepare(
                "SELECT userID, serverID, money, bets FROM balance WHERE userID=?"
            );
        }

        if (!DatabaseHelper.getAllServerBalsStatement) {
            DatabaseHelper.getAllServerBalsStatement = this.db.prepare(
                "SELECT userID, serverID, money, bets FROM balance WHERE serverID=?"
            );
        }

        if (!DatabaseHelper.setBalStatement) {
            DatabaseHelper.setBalStatement = this.db.prepare(
                "INSERT INTO balance (userID, serverID, money, bets) VALUES (@userID, @serverID, @money, @bets) ON CONFLICT(userID, serverID) DO UPDATE SET money=@money AND bets=@bets"
            );
        }

        if (!DatabaseHelper.setIdStatement) {
            DatabaseHelper.setIdStatement = this.db.prepare(
                "INSERT INTO ids (id, data) VALUES (@id, @data)"
            );
        }
    }

    getBalance(userID: Snowflake, serverID: Snowflake): Balance {
        const data = <Balance>DatabaseHelper.getBalStatement.get(userID, serverID);

        const money = data ? data.money : 1000;
        const bets = data && typeof data.bets === "string" ? JSON.parse(data.bets) : [];

        const result = {
            userID: userID,
            serverID: serverID,
            money: money,
            bets: bets
        };

        if (!data) {
            this.setBalance(result);
        }
        return result;
    }

    getId(id: string): Id {
        return <Id>DatabaseHelper.getIdStatement.get(id);
    }

    getAllIds(): Id[] {
        return <Id[]>DatabaseHelper.getAllIdsStatement.all();
    }

    getUsersBalanceByServerID(serverID: Snowflake): Balance[] {
        return <Balance[]>DatabaseHelper.getAllServerBalsStatement.all(serverID);
    }

    setBalance(balance: Balance): void {
        balance.bets = JSON.stringify(balance.bets);
        DatabaseHelper.setBalStatement.run(balance);
    }

    createId(id: Id): void {
        DatabaseHelper.setIdStatement.run(id);
    }
}