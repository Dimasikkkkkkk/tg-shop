const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8489147547:AAFcRMJOIWdR9MmZic6MsmHbCsS8KekgFGc'; // твой настоящий токен
const ADMIN_ID = 1129108122; // твой Telegram ID
const bot = new TelegramBot(TOKEN, { polling: true });

// Кнопка Web App
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Открой магазин 👇', {
    reply_markup: {
      keyboard: [
        [
          {
            text: '🛒 Магазин',
            web_app: {
              url: 'https://dimasikkkkkkk.github.io/tg-shop/' // твоя ссылка
            }
          }
        ]
      ],
      resize_keyboard: true
    }
  });
});

// Обработка Web App данных
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    const order = JSON.parse(msg.web_app_data.data);

    bot.sendMessage(
      ADMIN_ID,
      `🛒 Новый заказ\nТовар: ${order.product}\nЦена: ${order.price}`
    );
  }
});
