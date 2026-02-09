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

    // Формируем кнопки для админа
    const buttons = [];
    
    // Кнопка "Принять заказ" с callback_data, содержащим userId
    if (order.userId) {
      buttons.push([{
        text: '✅ Принять заказ',
        callback_data: `accept_order_${order.userId}_${msg.chat.id}`
      }]);
    }
    
    // Кнопка для связи с покупателем
    if (order.username) {
      buttons.push([{
        text: '💬 Написать покупателю',
        url: `https://t.me/${order.username}`
      }]);
    } else if (order.userId) {
      buttons.push([{
        text: '💬 Написать покупателю',
        url: `tg://user?id=${order.userId}`
      }]);
    }

    // Отправляем сообщение админу с кнопками
    const messageOptions = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buttons
      }
    };

    bot.sendMessage(ADMIN_ID, orderMessage, messageOptions);
  }
});

// Обработка callback от кнопки "Принять заказ"
bot.on('callback_query', (query) => {
  const data = query.data;
  
  if (data.startsWith('accept_order_')) {
    // Парсим данные: accept_order_userId_chatId
    const parts = data.split('_');
    if (parts.length >= 4) {
      const userId = parts[2];
      const chatId = parts[3];
      
      // Отправляем подтверждение пользователю
      bot.sendMessage(
        parseInt(chatId),
        '✅ <b>Ваш заказ принят!</b>\n\nМы свяжемся с вами для уточнения деталей доставки.',
        { parse_mode: 'HTML' }
      );
      
      // Обновляем сообщение админа - убираем кнопку "Принять заказ"
      bot.answerCallbackQuery(query.id, {
        text: 'Заказ принят! Пользователю отправлено подтверждение.',
        show_alert: false
      });
      
      // Редактируем сообщение админа, убирая кнопку "Принять заказ"
      const originalText = query.message.text;
      const updatedText = originalText + '\n\n✅ <b>Заказ принят админом</b>';
      
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
