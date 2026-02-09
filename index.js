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
    
    // Формируем список товаров
    const itemsList = order.items.map((item, index) => 
      `${index + 1}. ${item.name} - ${item.price.toLocaleString()} ₽`
    ).join('\n');

    // Формируем сообщение для админа
    const orderMessage = `🛒 <b>Новый заказ</b>\n\n` +
      `👤 <b>Покупатель:</b> @${order.username} (ID: ${order.userId})\n` +
      `📍 <b>Адрес доставки:</b>\n${order.address}\n\n` +
      `🛍️ <b>Товары:</b>\n${itemsList}\n\n` +
      `💰 <b>Итого:</b> ${order.total.toLocaleString()} ₽\n` +
      (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '');

    // Отправляем сообщение админу с кнопкой для связи
    bot.sendMessage(ADMIN_ID, orderMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💬 Написать покупателю',
              url: `https://t.me/${order.username}`
            }
          ]
        ]
      }
    });

    // Подтверждение пользователю
    bot.sendMessage(
      msg.chat.id,
      '✅ Заказ принят! Мы свяжемся с вами для уточнения деталей доставки.'
    );
  }
});
