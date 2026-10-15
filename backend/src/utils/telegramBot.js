import { query } from "../db/pool.js";
import { sendTelegramMessage } from "../services/telegram.js";

const HELP = "To get UniSwap notifications here, open UniSwap, go to Settings and press \"Connect Telegram\".";

/** Handles one message sent to our bot. The only command is "/start <code>" from the link in Settings. */
export async function handleBotMessage(message) {
  const chatId = String(message.chat.id);
  const code = /^\/start (\w+)$/.exec(message.text ?? "")?.[1];
  if (!code) return sendTelegramMessage(chatId, HELP);

  // The code is used once: clearing it means an old link cannot connect the account again.
  const { rows } = await query(
    `UPDATE users SET telegram_chat_id = $2, telegram_link_code = NULL
     WHERE telegram_link_code = $1 RETURNING name`,
    [code, chatId],
  );
  if (!rows[0]) return sendTelegramMessage(chatId, `That link has expired. ${HELP}`);
  return sendTelegramMessage(chatId, `Connected! Hi ${rows[0].name}, UniSwap notifications will now arrive here too.`);
}
