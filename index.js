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

    // Используем данные из msg.from (всегда доступны) или из заказа
    const userFrom = msg.from || {};
    const userId = String(userFrom.id || order.userId || '');
    const username = userFrom.username || order.username || null;
    const firstName = userFrom.first_name || order.firstName || null;
    const lastName = userFrom.last_name || order.lastName || null;

    // Формируем информацию о покупателе - приоритет: username > имя > ID
    let userInfo = '';
    if (username) {
      userInfo = `@${username}`;
    } else if (firstName) {
      userInfo = `${firstName}${lastName ? ' ' + lastName : ''}`;
    } else if (userId) {
      userInfo = `Пользователь (ID: ${userId})`;
    } else {
      userInfo = 'Пользователь';
    }

    // Формируем информацию о доставке
    const deliveryInfo = order.deliveryType === 'pickup' 
      ? '🚚 <b>Способ получения:</b> Самовывоз'
      : `📍 <b>Адрес доставки:</b>\n${order.address}`;

    const orderMessage = `🛒 <b>Новый заказ</b>\n\n` +
      `👤 <b>Покупатель:</b> ${userInfo}\n` +
      `${deliveryInfo}\n\n` +
      `🛍️ <b>Товары:</b>\n${itemsList}\n\n` +
      `💰 <b>Итого:</b> ${order.total.toLocaleString()} ₽\n` +
      (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '');

    const buttons = [];

    if (userId) {
      // Используем msg.from.id или msg.chat.id для сохранения chatId
      const chatId = msg.from?.id || msg.chat.id;
      buttons.push([{
        text: '✅ Принять заказ',
        callback_data: `accept_order_${userId}_${chatId}`
      }]);
    }

    // Кнопка для связи с покупателем
    if (username) {
      buttons.push([{
        text: '💬 Написать покупателю',
        url: `https://t.me/${username}`
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
    }).catch((err) => {
      console.error('Ошибка при отправке сообщения админу:', err.message);
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
      const chatId = parseInt(parts[3]);

      // Отправляем подтверждение пользователю
      // Пробуем отправить по chatId, если не получается - по userId
      bot.sendMessage(
        chatId,
        '✅ <b>Ваш заказ принят!</b>\n\nМы свяжемся с вами для уточнения деталей доставки.',
        { parse_mode: 'HTML' }
      ).catch((err) => {
        console.error('Ошибка при отправке по chatId:', err.message);
        // Если не удалось отправить по chatId, пробуем отправить по userId
        if (userId && (err.message.includes('chat not found') || err.message.includes('ETELEGRAM'))) {
          bot.sendMessage(
            parseInt(userId),
            '✅ <b>Ваш заказ принят!</b>\n\nМы свяжемся с вами для уточнения деталей доставки.',
            { parse_mode: 'HTML' }
          ).catch((err2) => {
            console.error('Ошибка при отправке по userId:', err2.message);
            // Если и это не сработало, отправляем админу уведомление
            bot.sendMessage(ADMIN_ID, `⚠️ Не удалось отправить подтверждение пользователю (ID: ${userId}). Возможно, пользователь не начал диалог с ботом.`);
          });
        }
      });

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
      }).catch((err) => {
        console.error('Ошибка при редактировании сообщения:', err.message);
      });
    }
  }
});
