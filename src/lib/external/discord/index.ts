import { DISCORD_WEBHOOK_URL } from "$env/static/private";
import axios from "axios";
import z from "zod";

const config = z
  .object({ DISCORD_WEBHOOK_URL: z.url().optional() })
  .parse({ DISCORD_WEBHOOK_URL });

const msg = async (content: string) => {
  if (!config.DISCORD_WEBHOOK_URL) {
    console.warn("Discord webhook URL is not configured.");
    console.log("Discord.msg content", content);
    return;
  }

  try {
    const { data } = await axios.post(config.DISCORD_WEBHOOK_URL, {
      content,
    });

    console.log("Discord.msg data", data);
  } catch (error) {
    console.log("Discord.msg error", error);
  }
};

export const Discord = {
  msg,
};
