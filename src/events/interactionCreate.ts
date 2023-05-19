// noinspection JSUnusedGlobalSymbols

import {ButtonStyle, EmbedBuilder, Interaction} from "discord.js";
import {commands, getMatchByID, randomColor} from "../util/functions";
import {ButtonsBox} from "easy-discord-components";

export default {
    name: "interactionCreate",
    once: false,
    execute: function (interaction: Interaction) {
        runAsCommand(interaction);
        runAsModalSubmit(interaction);
    }
}

async function runAsModalSubmit(interaction: Interaction) {
    if (!interaction.isModalSubmit() || !interaction.inGuild()) {
        return;
    }

    interaction.isFromMessage()

    const data = interaction.customId.split(":");

    if (data[0] !== "bet-odd") {
        return;
    }

    const amount = parseInt(interaction.fields.getTextInputValue("amount"));
    const userBalance = db.getBalance(interaction.user.id, interaction.guildId);

    if (isNaN(amount)) {
        interaction.reply({content: "Le montant indiqué n'est pas un nombre", ephemeral: true});
        return;
    } else if (amount < 0) {
        interaction.reply({content: "Le montant indiqué doit être suppérieur à 0", ephemeral: true});
        return;
    } else if (amount > userBalance.money) {
        interaction.reply({content: "Le montant indiqué est inférieur à votre monnaie", ephemeral: true});
        return;
    }

    const id = data[1];
    const match = await getMatchByID(id);

    if (match === null) {
        interaction.reply({
            content: "Le match semble avoir disparu? Ou il s'est simplement terminé",
            ephemeral: true
        });
        return;
    }

    const buttons = new ButtonsBox();

    buttons.addButton({
        customId: interaction.customId,
        label: "Placer le pari",
        style: ButtonStyle.Success
    });

    const bet = data[2] === "neutral" ? "un **match nul**" : "la victoire de **" + (data[2] === "home" ? match.home : match.outside) + "**";
    let odd = data[2] === "neutral" ? match.neutral_odd : (data[2] === "home" ? match.home_odd : match.outside_odd);

    let description = "Bilan sur le pari que vous voulez placer:\n\n**" + match.home + "** vs **" + match.outside + "**\n\nVous avez parié sur " + bet + "\nVous gagner **" + (odd * amount) + "$** si vous gagnez ce pari\nLa cote s'éleve à **" + odd + "**\n\nCliquez sur le bouton ci dessous pour placer le pari ⬇️\nVous ne pourrez ensuite plus récupérer la somme misée";

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

    const reply = await interaction.reply({
        components: buttons.fetch,
        embeds: [embed],
        ephemeral: true
    });

    reply.createMessageComponentCollector().on("collect", async (i) => {
        if (i.customId !== interaction.customId) {
            return;
        }

        const _match = await getMatchByID(id);
        const balance = db.getBalance(interaction.user.id, interaction.guildId);

        if (_match === null) {
            interaction.reply({
                content: "Le match semble avoir disparu? Ou il s'est simplement terminé",
                ephemeral: true
            });
            return;
        } else if (amount > userBalance.money) {
            reply.edit({
                content: "Le montant que vous avez précédemment indiqué est inférieur à votre monnaie",
                components: []
            });
            return;
        }

        let _odd = data[2] === "neutral" ? match.neutral_odd : (data[2] === "home" ? match.home_odd : match.outside_odd);

        if (odd !== _odd) {
            const embed = new EmbedBuilder()
                .setColor(randomColor())
                .setDescription("La cote a changé, elle passe de **" + odd + "** à **" + _odd + "**\nVoulez vous toujours placer le pari ?")
                .setAuthor({
                    iconURL: interaction.user.avatarURL() || "",
                    name: interaction.user.tag
                })
                .setFooter({
                    iconURL: client.user?.avatarURL() || "",
                    text: "Empty Bet"
                })
                .setTimestamp();

            odd = _odd;

            reply.edit({
                components: buttons.fetch,
                embeds: [embed]
            });
        } else {
            reply.delete();

            const embed = new EmbedBuilder()
                .setColor(randomColor())
                .setDescription("Vous venez de placer un pari sur le match **" + match.home + "** vs **" + match.outside + "**\n\nVous avez parié sur " + bet + " **" + amount + "$**\nVous gagner **" + (odd * amount) + "$** si vous gagnez ce pari\nLa cote s'éleve à **" + odd + "**\n\nBonne chance !")
                .setAuthor({
                    iconURL: interaction.user.avatarURL() || "",
                    name: interaction.user.tag
                })
                .setFooter({
                    iconURL: client.user?.avatarURL() || "",
                    text: "Empty Bet"
                })
                .setTimestamp();

            const winner = data[2] === "neutral" ? null : (data[2] === "home" ? match.home : match.outside);
            const bets = typeof balance.bets !== "string" ? balance.bets || [] : [];

            bets.push({
                id: id,
                odd: odd,
                amount: amount,
                winner: winner,
                claimed: 0
            });

            balance.bets = bets;
            balance.money -= amount;

            db.setBalance(balance);

            interaction.message?.edit({
                components: [],
                embeds: [embed]
            });
        }
    });
}

async function runAsCommand(interaction: Interaction) {
    if (!interaction.isCommand()) {
        return;
    }

    try {
        if (Object.keys(commands).includes(interaction.commandName)) {
            const module = require("../commands/" + interaction.commandName + ".js").default;
            module.run(interaction);
        }
    } catch (e) {
        console.log(e);
    }
}