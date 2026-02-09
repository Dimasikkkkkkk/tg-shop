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
              url: `https://dimasikkkkkkk.github.io/tg-shop/?v=${Date.now()}` // твоя ссылка с версией для обхода кеша
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

    // Формируем информацию о покупателе
    const userName = order.username 
      ? `@${order.username}` 
      : order.firstName 
        ? `${order.firstName}${order.lastName ? ' ' + order.lastName : ''}`
        : 'Неизвестно';
    
    const userInfo = order.username 
      ? `@${order.username}` 
      : order.firstName 
        ? `${order.firstName}${order.lastName ? ' ' + order.lastName : ''}`
        : 'Неизвестно';
    
    const userId = order.userId || 'неизвестно';

    // Формируем сообщение для админа
    const orderMessage = `🛒 <b>Новый заказ</b>\n\n` +
      `👤 <b>Покупатель:</b> ${userInfo} (ID: ${userId})\n` +
      `📍 <b>Адрес доставки:</b>\n${order.address}\n\n` +
      `🛍️ <b>Товары:</b>\n${itemsList}\n\n` +
      `💰 <b>Итого:</b> ${order.total.toLocaleString()} ₽\n` +
      (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '');

    // Формируем кнопку для связи с покупателем
    let contactButton = null;
    if (order.username) {
      // Если есть username, используем его
      contactButton = {
        text: '💬 Написать покупателю',
        url: `https://t.me/${order.username}`
      };
    } else if (order.userId) {
      // Если нет username, используем tg://user для открытия чата
      contactButton = {
        text: '💬 Написать покупателю',
        url: `tg://user?id=${order.userId}`
      };
    }

    // Отправляем сообщение админу с кнопкой для связи
    const messageOptions = {
      parse_mode: 'HTML'
    };

    if (contactButton) {
      messageOptions.reply_markup = {
        inline_keyboard: [[contactButton]]
      };
    }

    bot.sendMessage(ADMIN_ID, orderMessage, messageOptions);

    // Подтверждение пользователю
    bot.sendMessage(
      msg.chat.id,
      '✅ Заказ принят! Мы свяжемся с вами для уточнения деталей доставки.'
    );
  }
});
