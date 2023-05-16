// noinspection JSUnusedGlobalSymbols

import {BaseInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {ValuesObject} from "../util/types";
import {arrayToPage, randomColor} from "../util/functions";
import {ButtonsBox} from "easy-discord-components";

export default {
    name: "leaderboard",
    builder: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Membres le plus riche du serveur"),
    run: async function (interaction: CommandInteraction) {
        await interaction.deferReply();

        if (!interaction.inGuild() || !interaction.isChatInputCommand()) {
            return;
        }

        const balances = db.getUsersBalanceByServerID(interaction.guildId);

        const valuesObject: ValuesObject = {};
        const leaderboard: ValuesObject = {};

        for (const balance of balances) {
            valuesObject[balance.userID] = balance.money;
        }

        let keys = Object.keys(valuesObject);
        const len = keys.length;

        let i;

        keys = keys.sort();
        keys = keys.reverse();

        for (i = 0; i < len; i++) {
            const k = keys[i];
            leaderboard[k] = valuesObject[k];
        }

        let page = 1;

        const buttons = new ButtonsBox();

        buttons.addButton({
            style: ButtonStyle.Success,
            label: "◀️",
            customId: "before"
        });

        buttons.addButton({
            style: ButtonStyle.Success,
            label: "▶️",
            customId: "next"
        });

        const message = await interaction.editReply({
            components: buttons.fetch,
            embeds: [createEmbed(interaction, 1, leaderboard)]
        });

        message.createMessageComponentCollector().on("collect", async (button) => {
            if (button.customId === "before") {
                if (page > 1) {
                    page--;
                }
            } else if (button.customId === "next") {
                if (<number>arrayToPage(leaderboard, page, 10)[0] > page) {
                    page++;
                }
            }

            await button.deferUpdate();

            await interaction.editReply({
                components: buttons.fetch,
                embeds: [createEmbed(interaction, page, leaderboard)]
            });
        });
    }
}

function createEmbed(interaction: BaseInteraction, page: number, leaderboard: ValuesObject) {
    const array = arrayToPage(leaderboard, page, 10);

    const maxPage = array[0];
    const result = array[1];

    let description = "Membres les plus riches de ce serveur **(" + Object.keys(leaderboard).length + " membres enregistrés)**\n";
    let i = 0;

    for (const [key, value] of Object.entries(result)) {
        i++;
        description = description + "\n" + (i + ((page - 1) * 10)) + ". <@" + key + "> : " + value + "$";
    }

    description = description + "\n\nCliquez sur le bouton ◀️ pour revenir à la première page\nCliquez sur le bouton ▶️ pour aller à la prochaine page";

    return new EmbedBuilder()
        .setColor(randomColor())
        .setAuthor({
            iconURL: interaction.user.avatarURL() || "",
            name: interaction.user.tag
        })
        .setDescription(description)
        .setFooter({
            iconURL: client.user?.avatarURL() || "",
            text: page + "/" + maxPage + " ・ Empty Bet"
        })
        .setTimestamp();
}