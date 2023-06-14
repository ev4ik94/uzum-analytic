import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders, IResponseProduct} from "../context/context.interface";
import OrdersService from "../services/orders.service";
import {DateFormatter, HTMLFormatter, month, NumReplace} from "../utils";
import AuthenticatedService from "../services/authenticated.service";
import {IStateManager} from "../config/config.interface";




export class OrdersCommand extends Command{
    state:IStateManager
    constructor(bot:Telegraf<IBotContext>, stateManager:IStateManager) {
        super(bot);
        this.state = stateManager
    }

    handle() {
        const ordersService = new OrdersService(this.state)

        const action_orders_regexp = new RegExp(/^orderstatus/)
        const action_orders_view_regexp = new RegExp(/^orderView/)
        const action_orders_get = new RegExp(/^(orderpage)|(orderstatus)/)

        const buttons_orders = [
            Markup.button.callback('В обработке 🕒', `orderstatusPROCESSING`),
            Markup.button.callback('Одобренные ✅', `orderstatusTO_WITHDRAW`),
            Markup.button.callback('Вернули ❌', `orderstatusCANCELED`)
        ]

        this.bot.hears('/orders', async (ctx)=>{
            if(ctx.session.current_shop){
                await ctx.reply(`Список всех заказов`, Markup.inlineKeyboard(buttons_orders))
            }

        })


        this.bot.action(action_orders_view_regexp, async(ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data
            const orderId = data.replace('orderView', '')

            const elem:any = this.state.getOrders().find((item:IOrders)=>+item.orderId===+orderId)

            if(elem){
                const date:string = DateFormatter(new Date(elem.date))


                let dateIssue:string='';

                if(elem.dateIssued){
                    dateIssue = DateFormatter(new Date(elem.dateIssued))
                }

                let message:string = '';

                if(elem.status==='CANCELED'){

                    message+=HTMLFormatter([
                        `/n/sПричина отказа: ${elem.returnCause || 'Причина не указана'}/s/n/n`,
                        `/bSKU:/b${elem.skuTitle}/n`,
                        `/bТовар:/b ${elem.productTitle}/n`,
                        `/bЦена:/b ${NumReplace(elem.sellPrice)} сум/n`,
                        `/bСумма к выводу:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                        `/bДата заказа:/b ${date}/n`,
                        `/bДата Отказа:/b ${dateIssue}/n/n`,
                    ])

                }else if(elem.dateIssued){
                    message+=HTMLFormatter([
                        `/bSKU:/b${elem.skuTitle}/n`,
                        `/bТовар:/b ${elem.productTitle}/n`,
                        `/bЦена:/b ${NumReplace(elem.sellPrice)} сум/n`,
                        `/bСумма к выводу:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                        `/bДата заказа:/b ${date}/n`,
                        `/bДата Получения:/b ${dateIssue}/n/n`,
                    ])
                }else{
                    message+=HTMLFormatter([
                        `/bSKU:/b${elem.skuTitle}/n`,
                        `/bТовар:/b ${elem.productTitle}/n`,
                        `/bЦена:/b ${NumReplace(elem.sellPrice)} сум/n`,
                        `/bСумма к выводу:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                        `/bДата заказа:/b ${date}/n`,
                        `/bДата Получения:/b --- /n/n`,
                    ])

                }

                return await ctx.sendPhoto(elem.productImage.photo['480'].high, {
                    caption: message,
                    parse_mode: 'HTML'
                })


            }else{
                return ctx.reply('Заказ не найден, попробуйте снова')
            }
        })




        this.bot.action(action_orders_get, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data



            if(data.match('order')) {

                const page = data.match(action_orders_regexp)?undefined:
                    data.replace('orderpage', '').split('-')[1]
                const status = data.match(action_orders_regexp)?
                    data.replace('orderstatus', ''):
                    data.replace('orderpage', '').split('-')[0]

                const dataOrders:any = (await ordersService.getOrders({
                    shopId: ctx.session.current_shop,
                    token: ctx.session.token,
                    status,
                    ctx,
                    page
                }))

                const orders:IOrders[] = dataOrders?.orderItems
                const total:number = dataOrders?.totalElements
                const pagination:{currentPage:number, total_pages:number, size:number} = dataOrders?.pagination



                let message = `\n<strong>Общее кол-во: ${total}</strong>\n`

                if(Array.isArray(orders)){
                    if(orders.length>0){
                        orders.forEach((item:IOrders, index:number)=>{

                            const dateFormater = DateFormatter(new Date(item.date))
                            let dateFormaterIssue:string=item.dateIssued?DateFormatter(new Date(item.dateIssued)):'';

                            let num = pagination.currentPage===1?index+1:
                                (index+1)+(pagination.size*(pagination.currentPage-1))




                            message+=HTMLFormatter([
                                `/n№:${num}`,
                                `${item.status==='CANCELED'?`/n/sВернули Заказ ❌/nпо причине: ${item.returnCause}/s`:item.dateIssued?`/n/sПолучили ✅/s`:''}/n`,
                                `${(item.comment||'').replace(/\./g, '')?`/bКоментарий клиента:/b ${item.comment}/n`:''}`,
                                `/bКол-во товара:/b ${item.status==='CANCELED'?item.amountReturns:item.amount}/n`,
                                `/bSKU:/b ${item.skuTitle}/n`,
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


                const pagination_buttons:any[] = []

                if(pagination.currentPage>1){
                    pagination_buttons.push(Markup.button.callback(`⬅️ Назад`, `orderpage${status}-${pagination.currentPage-1}`))
                }

                pagination_buttons.push(Markup.button.callback(`${pagination.currentPage}/${pagination.total_pages}`, `actionNo`))

                if(pagination.currentPage<pagination.total_pages){
                    pagination_buttons.push(Markup.button.callback(`Вперед ➡️`, `orderpage${status}-${pagination.currentPage+1}`))
                }

                if(pagination.total_pages>1){
                    return await ctx.replyWithHTML(message, Markup.inlineKeyboard(pagination_buttons))
                }else{
                    return await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons_orders))
                }





            }



        })

    }
}