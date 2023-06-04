import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders, IResponseProduct} from "../context/context.interface";
import {ConfigService} from "../config/config.service";
import OrdersService from "../services/orders.service";
import {DateFormatter, HTMLFormatter, month, NumReplace} from "../utils";
import AuthenticatedService from "../services/authenticated.service";

const ordersService = new OrdersService(new ConfigService(), new AuthenticatedService(new ConfigService()))


export class OrdersCommand extends Command{
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        const action_orders_regexp = new RegExp(/^order/)
        const action_orders_view_regexp = new RegExp(/^orderView/)

        const buttons_orders = [
            Markup.button.callback('В обработке 🕒', `orderPROCESSING`),
            Markup.button.callback('Одобренные ✅', `orderTO_WITHDRAW`),
            Markup.button.callback('Вернули ❌', `orderCANCELED`)
        ]

        this.bot.hears('/orders', async (ctx)=>{
            if(ctx.session.current_shop){
                await ctx.reply(`Заказы за последние 2 недели`, Markup.inlineKeyboard(buttons_orders))
            }

        })


        this.bot.action(action_orders_view_regexp, async(ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data
            const orderId = data.replace('orderView', '')

            const elem:any = ctx.session.orders.find((item:IOrders)=>+item.orderId===+orderId)

            if(elem){
                const date:Date = new Date(elem.date)
                const dateFormater:string = `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()} года, ${date.getHours()}:${date.getMinutes()}`

                let dateIssue:Date;
                let dateFormaterIssue:string = '-'

                if(elem.dateIssued){
                    dateIssue = new Date(elem.dateIssued)
                    dateFormaterIssue = `${dateIssue.getDate()} ${month[dateIssue.getMonth()]} ${dateIssue.getFullYear()} года, ${dateIssue.getHours()}:${dateIssue.getMinutes()}`
                }

                let message:string;

                if(elem.status==='CANCELED'){

                    message = `\n<strong>Причина отказа: ${elem.returnCause||'Причина не указана'}</strong>\n\n<b>SKU:</b> ${elem.skuTitle}\n<b>Товар:</b> ${elem.productTitle}\n<b>Цена:</b> ${NumReplace(elem.sellPrice)} сум\n<b>Сумма к выводу:</b> ${NumReplace(elem.sellerProfit)} сум\n\n<b>Дата заказа:</b> ${dateFormater}\n<b>Дата Получения:</b> ${dateFormaterIssue}\n\n-------------------------------------`
                }else if(elem.dateIssued){
                   message = `\n<b>SKU:</b> ${elem.skuTitle}\n<b>Товар:</b> ${elem.productTitle}\n<b>Цена:</b> ${NumReplace(elem.sellPrice)} сум\n<b>Сумма к выводу:</b> ${NumReplace(elem.sellerProfit)} сум\n\n<b>Дата заказа:</b> ${dateFormater}\n<b>Дата Получения:</b> ${dateFormaterIssue}\n\n-------------------------------------`
                }else{
                    message = `\n<b>SKU:</b> ${elem.skuTitle}\n<b>Товар:</b> ${elem.productTitle}\n<b>Цена:</b> ${NumReplace(elem.sellPrice)} сум\n<b>Сумма к выводу:</b> ${NumReplace(elem.sellerProfit)} сум\n\n<b>Дата заказа:</b> ${dateFormater}\n<b>Дата Получения:</b> ${dateFormaterIssue}\n\n-------------------------------------`
                }

                await ctx.sendPhoto(elem.productImage.photo['480'].high)
                await ctx.replyWithHTML(message)

            }
        })



        this.bot.action(action_orders_regexp, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data


            if(data.match('order')) {

                const status = data.replace('order', '')
                const dataOrders:any = (await ordersService.getOrders({
                    shopId: ctx.session.current_shop,
                    token: ctx.session.token,
                    status,
                    ctx
                }))

                const orders:IOrders[] = dataOrders?.orderItems
                const total:number = dataOrders?.totalElements
                const amount:number = dataOrders?.amount



                let message = `\n<strong>Общее кол-во: ${total}</strong>\n\n<strong>Общая сумма: ${NumReplace(amount+'')}</strong>\n`

                if(Array.isArray(orders)){
                    if(orders.length>0){
                        orders.forEach((item:IOrders, index:number)=>{

                            const dateFormater = DateFormatter(new Date(item.date))
                            let dateFormaterIssue:string=item.dateIssued?DateFormatter(new Date(item.dateIssued)):'';


                            message+=HTMLFormatter([
                                `/n№:${index+1}`,
                                `${item.status==='CANCELED'?`/n/sВернули Заказ ❌/nпо причине: ${item.returnCause}/s`:item.dateIssued?`/n/sПолучили ✅/s`:''}/n`,
                                `${(item.comment||'').replace(/\./g, '')?`/bКоментарий клиента:/b ${item.comment}/n`:''}`,
                                `/bКол-во товара:/b ${item.status==='CANCELED'?item.amountReturns:item.amount}/n`,
                                `/bSKU:/b ${item.skuTitle}`,
                                `/bТовар:/b ${item.productTitle}/n`,
                                `/bЦена:/b ${NumReplace(item.sellPrice)} сум/n`,
                                `/bСумма к выводу:/b ${NumReplace(item.sellerProfit)} сум/n`,
                                `/bДата заказа:/b ${dateFormater}/n`,
                                `/bДата Получения:/b ${dateFormaterIssue}/n`,
                                `-------------------------------------`,
                            ])
                        })
                    }else{
                        message = 'Список пуст ⭕️'
                    }

                }else{
                    message = 'Список пуст ⭕️'
                }
                //@ts-ignore
                await ctx.reply(message, {parse_mode:'HTML'})
                return  await ctx.reply(`Заказы за последние 2 недели`, Markup.inlineKeyboard(buttons_orders))


            }



        })

    }
}