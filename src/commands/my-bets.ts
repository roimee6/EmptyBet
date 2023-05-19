// noinspection JSUnusedGlobalSymbols

import {BaseInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {arrayToPage, getMatchByID, randomColor} from "../util/functions";
import {Balance} from "../util/database";
import {Bet} from "../util/types";
import {ButtonsBox} from "easy-discord-components";

export default {
    name: "my-bets",
    builder: new SlashCommandBuilder()
        .setName("my-bets")
        .setDescription("Regardez vos paris en cours"),
    run: async function (interaction: CommandInteraction) {
        await interaction.deferReply();

        if (!interaction.inGuild()) {
            return;
        }

        const balance = db.getBalance(interaction.user.id, interaction.guildId);
        const bets = getBets(balance);

        const buttons = new ButtonsBox();

        const embed = new EmbedBuilder()
            .setColor(randomColor())
            .setDescription("Vous possèdez **" + balance.money + "$**\n\nVous avez actuellement **" + bets.active.length + "** paris en cours\nEt vous avez **" + bets.claimed.length + "** paris réglés\n\nCliquez sur les boutons ci-dessous pour voir vos paris ⬇️")
            .setAuthor({
                iconURL: interaction.user.avatarURL() || "",
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user?.avatarURL() || "",
                text: "Empty Bet"
            })
            .setTimestamp();

        buttons.addButton({
            style: ButtonStyle.Success,
            label: "Paris en cours",
            customId: "active"
        });

        buttons.addButton({
            style: ButtonStyle.Success,
            label: "Paris réglés",
            customId: "claimed"
        });

        const message = await interaction.editReply({
            components: buttons.fetch,
            embeds: [embed]
        });

        let page = 1;
        let category = "";

        const arrows = new ButtonsBox();

        arrows.addButton({
            style: ButtonStyle.Success,
            label: "◀️",
            customId: "before"
        });

        arrows.addButton({
            style: ButtonStyle.Success,
            label: "▶️",
            customId: "next"
        });


        message.createMessageComponentCollector().on("collect", async function (button) {
            await button.deferUpdate();

            if (button.user.id !== interaction.user.id) {
                await button.reply({content: "Vous n'êtes pas autorisé à utiliser ce bouton", ephemeral: true});
                return;
            }

            if (button.customId !== "before" && button.customId !== "next") {
                category = button.customId;
            }
            if (category !== "active" && category !== "claimed") {
                return;
            }

            let data;

            if (button.customId === "before") {
                if (page > 1) {
                    page--;
                }
            } else if (button.customId === "next") {
                if (<number>arrayToPage(bets[category], page, 3)[0] > page) {
                    page++;
                }
            }

            if (category === "active") {
                data = await createActiveEmbedDescription(interaction, page, bets[category]);
            } else if (category === "claimed") {
                // TODO
                data = ["TODO"];
            } else {
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(randomColor())
                .setAuthor({
                    iconURL: interaction.user.avatarURL() || "",
                    name: interaction.user.tag
                })
                .setDescription(<string>data[0])
                .setFooter({
                    iconURL: client.user?.avatarURL() || "",
                    text: page + "/" + data[1] + " ・ Empty Bet"
                })
                .setTimestamp();

            await button.editReply({
                components: arrows.fetch,
                embeds: [embed]
            });
        });
    }
}

async function createActiveEmbedDescription(interaction: BaseInteraction, page: number, bets: Bet[]) {
    const array = arrayToPage(bets, page, 3);

    const maxPage = array[0];
    const result = array[1];

    let description = "Liste de vos paris actifs en ce moment (**" + bets.length + "**)\n";

    for (let [, value] of Object.entries(result)) {
        const bet = <Bet>value;
        const match = await getMatchByID(bet.id);

        if (match === null) {
            continue;
        }

        const str = bet.winner === null ? "un **match nul**" : "la victoire de **" + bet.winner + "**";
        description = description + "\n**" + match.home + " VS " + match.outside + "**\nVous avez misez **" + bet.amount + "$** avec une côte qui s'éleve à **" + bet.odd + "**\nVous avez parié sur " + str + "\n";
    }

    return [
        description + "\nCliquez sur le bouton ◀️ pour revenir à la première page\nCliquez sur le bouton ▶️ pour aller à la prochaine page",
        maxPage
    ];
}

function getBets(balance: Balance) {
    const bets: Bet[] = typeof balance.bets === "string" ? [] : balance.bets;

    const claimed: Bet[] = [];
    const active: Bet[] = [];

    for (const bet of bets) {
        if (bet.claimed === 0) {
            active.push(bet);
        } else {
            claimed.push(bet);
        }
    }

    return {
        "claimed": claimed,
        "active": active
    }
}