require("dotenv").config();
const fs = require("fs");
const { log } = require("./helperFunctions");


const mongoose = require("mongoose");
const Data = require('./data');
const uri = "mongodb+srv://cakebot:Starbound917@cluster0-bgmxk.mongodb.net/data?retryWrites=true&w=majority";
mongoose.connect(uri, { useUnifiedTopology:true, useNewUrlParser: true })
.then(() => console.log('connected to the database!'))
// .then(Data.findOneAndUpdate({user: 'hafssfjkah'}, {user: 'new guy'}, {new: true, upsert: true}, (err, d) => {
//   console.log(d)
// }))
.catch(err => console.log('DB Connection Error: ' + err));

const prefix = "!shell";
const Discord = require("discord.js");

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();
// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
  console.log("Ready!");
});

client.login(process.env.TOKEN);

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // +1 to account for the space
  const args = message.content.slice(prefix.length + 1).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command || !commandName) {
    let reply = `You didn't provide a valid command!`;
    reply += `\nThese are the usable commands: ${client.commands.map(command => command.name).join(", ")}`;
    return message.channel.send(reply);
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: '${prefix} ${command.name} ${command.usage}'`;
    }

    return message.channel.send(reply);
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  try {
    command.execute(message, args, Data, log);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute that command.");
  }
});

// function myFunction() {
//   setTimeout(function(){message.channel.send("Hello"); }, 3000);
// };

// myFunction();

module.exports = client;
