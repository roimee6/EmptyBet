// noinspection JSUnusedGlobalSymbols

import {
    BaseInteraction,
    ButtonStyle,
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    TextInputStyle
} from "discord.js";

import {
    getAllCompetitionsMatchsNumber,
    getMatchByID,
    getMatchsByCompetition,
    matchToID,
    randomColor
} from "../util/functions";

import {ButtonsBox, Modal, SelectMenu} from "easy-discord-components";
import {Match} from "../util/types";

export default {
    name: "bet",
    builder: new SlashCommandBuilder()
        .setName("bet")
        .setDescription("Open bet panel"),
    run: async function (interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        await interaction.deferReply();
        let competitions = await getAllCompetitionsMatchsNumber();

        const values = Object.values(competitions);
        const sum = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        let description = "Vous pouvez actuellement parier sur **" + sum + "** matchs de **" + values.length + "** competitions, choisisez la competition grace au menu déroulant\n\n";

        const selectMenu = new SelectMenu({})
            .setCustomId("choose")
            .setPlaceholder("⚽ Cliquez ici pour choisir la compétition !");

        for (const [competition, matchs] of Object.entries(competitions)) {
            selectMenu.addOption({
                label: config.COMPETITIONS[competition],
                value: competition
            });

            description += "- **" + config.COMPETITIONS[competition] + "** (" + matchs + " matchs disponible)\n";
        }

        const embed = new EmbedBuilder()
            .setColor(randomColor())
            .setDescription(description + "\nCliquez sur le menu déroulant puis cliquez sur la compétition ⬇️")
            .setAuthor({
                iconURL: interaction.user.avatarURL() || "",
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user?.avatarURL() || "",
                text: "Empty Bet"
            })
            .setTimestamp();

        const message = await interaction.editReply({
            components: [selectMenu.fetch],
            embeds: [embed]
        });

        message.createMessageComponentCollector().on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                i.reply({content: "Faites la commande /bet vous même pour parier", ephemeral: true});
                return;
            }

            const customId = i.isAnySelectMenu() ? i.customId + ":" + i.values[0] : i.customId;
            const data = customId.split(":");

            if (data[0] === "choose") {
                const competition = data[1];
                const msg = await chooseCompetitionMessage(interaction, competition);

                await i.deferUpdate();
                await interaction.editReply(msg);
            } else if (data[0] === "bet") {
                const id = data[1];
                const match = await getMatchByID(id);

                if (match === null) {
                    await i.reply({
                        content: "Le match semble avoir disparu? Ou il s'est simplement terminé",
                        ephemeral: true
                    });
                    return;
                }

                const msg = await betMessage(interaction, id, match);

                await i.deferUpdate();
                await interaction.editReply(msg);
            } else if (data[0] === "bet-odd") {
                const id = data[1];
                const match = await getMatchByID(id);

                if (match === null) {
                    await i.reply({
                        content: "Le match semble avoir disparu? Ou il s'est simplement terminé",
                        ephemeral: true
                    });
                    return;
                }

                const modal = new Modal()
                    .setCustomId(i.customId)
                    .setTitle(match.home + " vs " + match.outside)
                    .addTextInput({
                        customId: "amount",
                        label: "Combien placez vous sur ce pari ?",
                        style: TextInputStyle.Short
                    });

                await i.showModal(modal);
            }
        });
    }
}

async function chooseCompetitionMessage(interaction: BaseInteraction, competition: string) {
    const matchs = await getMatchsByCompetition(competition, true);
    const selectMenu = new SelectMenu({})
        .setCustomId("bet")
        .setPlaceholder("⚽ Cliquez ici pour choisir le match !");

    let description = "Vous pouvez actuellement parié sur **" + matchs.length + "** matchs, choisissez le match grace au menu déroulant\n\n";

    for (const match of matchs) {
        selectMenu.addOption({
            label: match.home + " vs " + match.outside,
            value: matchToID(competition, match)
        });

        description += "- **" + match.home + " vs " + match.outside + "** (" + match.day + " à " + match.hour + ")\n";
    }

    description += "\nCliquez sur le menu déroulant ci-dessous puis cliquer sur le match  ⬇️"

    const embed = new EmbedBuilder()
        .setColor(randomColor())
        .setDescription(description)
        .setAuthor({
            iconURL: interaction.user.avatarURL() || "",
            name: interaction.user.tag
        })
        .setFooter({
            iconURL: client.user?.avatarURL() || "",
            text: "Empty Bet"
        })
        .setTimestamp();

    return {
        components: [selectMenu.fetch],
        embeds: [embed]
    };
}

async function betMessage(interaction: BaseInteraction, id: string, match: Match) {
    let description = "**" + match.home + " vs " + match.outside + "**\nDate du match: " + match.day + " à " + match.hour + "\n\nCote pour **" + match.home + "** gagnant: **" + match.home_odd + "**\nCote pour **match nul**: **" + match.neutral_odd + "**\nCote pour **" + match.outside + "** gagnant: **" + match.outside_odd + "**\n\nCliquez sur les boutons ci-dessous pour parier ⬇️\nLa cote la plus basse est en rouge et la plus haute en vert";
    const buttons = new ButtonsBox();

    buttons.addButton({
        style: getButtonColor(match.home_odd, match.neutral_odd, match.outside_odd),
        label: match.home_odd.toString(),
        customId: "bet-odd:" + id + ":home"
    });

    buttons.addButton({
        style: getButtonColor(match.neutral_odd, match.home_odd, match.outside_odd),
        label: match.neutral_odd.toString(),
        customId: "bet-odd:" + id + ":neutral"
    });

    buttons.addButton({
        style: getButtonColor(match.outside_odd, match.home_odd, match.neutral_odd),
        label: match.outside_odd.toString(),
        customId: "bet-odd:" + id + ":outside"
    });

    const embed = new EmbedBuilder()
        .setColor(randomColor())
        .setDescription(description)
        .setAuthor({
            iconURL: interaction.user.avatarURL() || "",
            name: interaction.user.tag
        })
        .setFooter({
            iconURL: client.user?.avatarURL() || "",
            text: "Empty Bet"
        })
        .setTimestamp();

    return {
        components: buttons.fetch,
        embeds: [embed]
    }
}

function getButtonColor(actual: number, other1: number, other2: number) {
    const arr = [actual, other1, other2];

    if (Math.min(...arr) === actual) {
        return ButtonStyle.Danger;
    } else if (Math.max(...arr) === actual) {
        return ButtonStyle.Success;
    } else {
        return ButtonStyle.Secondary;
    }
}