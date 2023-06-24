import {Command} from "./command.class";
import {Telegraf, Markup} from "telegraf";
import {IBotContext} from "../context/context.interface";





export class StartCommand extends Command{

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        this.bot.start(async(ctx)=>{


            if(!ctx.session.token){

                // if(ctx.message.from.username==='eva_4eva'||ctx.message.from.username==='Akhadov') {
                //     ctx.session.token = 'ZvF2QEdLAhGxEOXeM3yO0KKmOOM'
                //
                // }

                return await ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
                    reply_markup:{
                        inline_keyboard: [
                            [{text: 'Авторизоваться', web_app:{url:process.env.FRONT_URL!}}]
                        ]
                    },

                })

            }else{
                await ctx.replyWithHTML('В обновленной версии были добавлены новые возможности:\n-Кабинет продавца\n-Исправлен баг с оповещаниями после истечения срока подписки')
                //await ctx.replyWithHTML('Бот снова готов работать!')
            }


        })


        this.bot.action('sign-out', async(ctx)=>{
            //@ts-ignore

            //ctx.session = null
            await ctx.reply('Вы действительно хотите выйти из аккаунта? Yes/No')
        })

        this.bot.action('support', async(ctx)=>{
            await ctx.reply('Заполните форму обратной связи и наши менеджеры свяжутся с вами', {
                reply_markup:{
                    inline_keyboard: [
                        [{text: 'Заполнить форму', web_app:{url:process.env.FRONT_URL!}}]
                    ]
                },

            })
        })

        this.bot.action('directory', async(ctx)=>{
            await ctx.replyWithHTML('<strong>Меню</strong>\n' +
                '<b>Активные товары</b> - те товары которые в продаже магазина на котором находитесь.\n' +
                ' \n' +
                '                                              Уведомление\n' +
                '<b>Новый заказ ❗️❗️❗</b>️ - заказ нового товара каждого\n' +
                '\n' +
                '<b>Заказ получен 🛍</b> -  Клиент забрал с ПВЗ ваш товар.\n' +
                '\n' +
                '<b>Заказ одобрен ✅</b> - Деньги за текущий товар доступны к выводу.\n' +
                '\n' +
                '<b>Заказ отменен ❌</b> - отмена заказа клиентом либо клиент не забрал в срок свой товар с ПВЗ\n' +
                '\n' +
                '<b>Новый отзыв 💌</b> -  отзыв на товар оставленный клиентом\n' +
                '\n' +
                '<b>Вывод средств одобрен 💸</b> - ваш запрос на вывод средств одобрен.\n' +
                '\n' +
                '<b>Товар принят на складе 📦</b> - ваши товары приняли на складе и готовы к продаже.\n' +
                '\n' +
                '<b>📢 Были добавлены обновления:</b> При добавлении нового функционала или правки выявленных багов в работе бота. Бот будет уведомлять вас о необходимости перезапуска, для получения всех обновлений')
        })


        this.bot.hears('/cabinet', async(ctx)=>{
            const buttons = Markup.inlineKeyboard([
                [Markup.button.callback('🙍‍♂️ Служба поддержки', 'support')],
               [Markup.button.callback('📒 Справочник', 'directory')],
                [Markup.button.callback('⬅️ Выйти из аккаунта', 'sign-out')]
            ])
            await ctx.reply('Кабинет продавца, здесь вы можете выйти из аккаунта, обратиться в службу поддержки или ознакомится со справочником бота', buttons)
        })





        this.bot.action('actionNo', ()=>{
            return
        })
    }
}