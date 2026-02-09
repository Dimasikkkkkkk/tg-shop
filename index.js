const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8489147547:AAFcRMJOIWdR9MmZic6MsmHbCsS8KekgFGc'; // токен бота
const ADMIN_ID = 812092891; // ID админа

const bot = new TelegramBot(TOKEN, { polling: true });

// Кнопка Web App
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Открой магазин 👇', {
    reply_markup: {
      keyboard: [
        [
          {
            text: '🛒 Магазин',
            web_app: { url: `https://dimasikkkkkkk.github.io/tg-shop/?v=${Date.now()}` }
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

    const itemsList = order.items.map((item, i) => `${i + 1}. ${item.name} - ${item.price.toLocaleString()} ₽`).join('\n');

    const userInfo = order.username 
      ? `@${order.username}` 
      : order.firstName 
        ? `${order.firstName}${order.lastName ? ' ' + order.lastName : ''}` 
        : 'Неизвестно';

    const userId = order.userId ? String(order.userId) : null;

    const orderMessage = `🛒 <b>Новый заказ</b>\n\n` +
      `👤 <b>Покупатель:</b> ${userInfo}${userId ? ` (ID: ${userId})` : ''}\n` +
      `📍 <b>Адрес доставки:</b>\n${order.address}\n\n` +
      `🛍️ <b>Товары:</b>\n${itemsList}\n\n` +
      `💰 <b>Итого:</b> ${order.total.toLocaleString()} ₽\n` +
      (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '');

    const buttons = [];

    if (userId) {
      buttons.push([{
        text: '✅ Принять заказ',
        callback_data: `accept_order_${userId}_${msg.chat.id}`
      }]);
    }

    if (order.username) {
      buttons.push([{
        text: '💬 Написать покупателю',
        url: `https://t.me/${order.username}`
      }]);
    } else if (userId) {
      buttons.push([{
        text: '💬 Написать покупателю',
        url: `tg://user?id=${userId}`
      }]);
    }

    bot.sendMessage(ADMIN_ID, orderMessage, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  }
});

// Обработка callback от кнопки "Принять заказ"
bot.on('callback_query', (query) => {
  const data = query.data;

  if (data.startsWith('accept_order_')) {
    const parts = data.split('_');
    if (parts.length >= 4) {
      const userId = parts[2];
      const chatId = parts[3];

      bot.sendMessage(
        parseInt(chatId),
        '✅ <b>Ваш заказ принят!</b>\n\nМы свяжемся с вами для уточнения деталей доставки.',
        { parse_mode: 'HTML' }
      );

      bot.answerCallbackQuery(query.id, {
        text: 'Заказ принят! Пользователю отправлено подтверждение.',
        show_alert: false
      });

      const updatedText = query.message.text + '\n\n✅ <b>Заказ принят админом</b>';

      bot.editMessageText(updatedText, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: query.message.reply_markup.inline_keyboard.filter(
            row => !row.some(btn => btn.callback_data && btn.callback_data.startsWith('accept_order_'))
          )
        }
      });
    }
  }
});
