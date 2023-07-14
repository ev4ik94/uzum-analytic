import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders} from "../context/context.interface";
import OrdersService from "../services/orders.service";
import {DateFormatter, HTMLFormatter, NumReplace, translater} from "../utils";
import {IStateManager} from "../config/config.interface";
import {ApiError} from "../utils/ErrorHandler";




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



        this.bot.hears('/orders', async (ctx)=>{
            const buttons_orders = [
                Markup.button.callback(`${translater(ctx.session.lang||'ru', 'PROCESSING_HISTORY')} 🕒`, `orderstatusPROCESSING`),
                Markup.button.callback(`${translater(ctx.session.lang||'ru', 'SUCCESS_STATUS')} ✅`, `orderstatusTO_WITHDRAW`),
                Markup.button.callback(`${translater(ctx.session.lang||'ru', 'CANCELED_STATUS_ORDER')} ❌`, `orderstatusCANCELED`)
            ]
            if(ctx.session.current_shop){
                await ctx.reply(`${translater(ctx.session.lang||'ru', 'LIST_ORDERS')}`, Markup.inlineKeyboard(buttons_orders))
            }

        })


        this.bot.action(action_orders_view_regexp, async(ctx)=>{
            try{
                const {update} = ctx
                const {userId} = ctx.session
                //@ts-ignore
                const data = update.callback_query.data
                const orderId = data.replace('orderView', '')


                const elem:any = this.state.getOrders(userId).find((item:IOrders)=>+item.id===+orderId)


                if(+userId===461310116||+userId===424705333){
                    await ctx.telegram.sendMessage('@logsUsers', `Запрос: (orderView) ${data}\nОтвет:\n${JSON.stringify(elem||{})}`)
                }

                if(elem){
                    const date:string = DateFormatter(new Date(elem.date))


                    let dateIssue:string='';

                    if(elem.dateIssued){
                        dateIssue = DateFormatter(new Date(elem.dateIssued))
                    }

                    let message:string = '';



                    if(elem.status==='CANCELED'){

                        message+=HTMLFormatter([
                            `/n/s${translater(ctx.session.lang||'ru', 'SHOP')}: ${elem.shop.title}/s/n`,
                            `/n/s${translater(ctx.session.lang||'ru', 'CANCELED_REASON')}: ${elem.returnCause || `${translater(ctx.session.lang||'ru', 'NO_REASON')}`}/s/n`,
                            `/s${translater(ctx.session.lang||'ru', 'CUSTOMER_COMMENT')}: ${elem.comment || `${translater(ctx.session.lang||'ru', 'NO_REASON')}`}/s/n/n`,
                            `/n/s${translater(ctx.session.lang||'ru', 'AMOUNT_ITEMS')}: ${elem?.amountReturns||' '}/s/n`,
                            `/bSKU:/b${elem.skuTitle}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'ITEM')}:/b ${elem.productTitle}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'COST')}:/b ${NumReplace(elem.sellPrice)} сум/n`,
                            `/b${translater(ctx.session.lang||'ru', 'SELLER_COST')}:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_BUY')}:/b ${date}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_CANCELED')}:/b ${dateIssue}/n/n`,
                        ])

                    }else if(elem.dateIssued){
                        message+=HTMLFormatter([
                            `/n/s${translater(ctx.session.lang||'ru', 'SHOP')}: ${elem.shop.title}/s/n`,
                            `/bSKU:/b${elem.skuTitle}/n`,
                            `/n/s${translater(ctx.session.lang||'ru', 'AMOUNT_ITEMS')}: ${elem?.amount||' '}/s/n`,
                            `/b${translater(ctx.session.lang||'ru', 'ITEM')}:/b ${elem.productTitle}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'COST')}:/b ${NumReplace(elem.sellPrice)} сум/n`,
                            `/b${translater(ctx.session.lang||'ru', 'SELLER_COST')}:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_BUY')}:/b ${date}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_ISSUED')}:/b ${dateIssue}/n/n`,
                        ])
                    }else{
                        message+=HTMLFormatter([
                            `/n/s${translater(ctx.session.lang||'ru', 'SHOP')}: ${elem.shop.title}/s/n`,
                            `/bSKU:/b${elem.skuTitle}/n`,
                            `/n/s${translater(ctx.session.lang||'ru', 'AMOUNT_ITEMS')}: ${elem?.amount||' '}/s/n`,
                            `/b${translater(ctx.session.lang||'ru', 'ITEM')}:/b ${elem.productTitle}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'COST')}:/b ${NumReplace(elem.sellPrice)} сум/n`,
                            `/b${translater(ctx.session.lang||'ru', 'SELLER_COST')}:/b ${NumReplace(elem.sellerProfit)} сум/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_BUY')}:/b ${date}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_ISSUED')}:/b --- /n/n`,
                        ])

                    }

                    return await ctx.sendPhoto(elem.productImage.photo['480'].high, {
                        caption: message,
                        parse_mode: 'HTML',
                    })


                }else{
                    return ctx.reply(translater(ctx.session.lang||'ru', 'NOT_FINED_ORDER'))
                }
            }catch(err:any){
                const err_message = `Метод: Command /orderView\n\nОШИБКА: ${err}`
                ctx.reply(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                throw new Error(err)
            }
        })




        this.bot.action(action_orders_get, async (ctx)=>{
            try{
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


                    const buttons_orders = [
                        Markup.button.callback(`${translater(ctx.session.lang||'ru', 'PROCESSING_HISTORY')} 🕒`, `orderstatusPROCESSING`),
                        Markup.button.callback(`${translater(ctx.session.lang||'ru', 'SUCCESS_STATUS')} ✅`, `orderstatusTO_WITHDRAW`),
                        Markup.button.callback(`${translater(ctx.session.lang||'ru', 'CANCELED_STATUS_ORDER')} ❌`, `orderstatusCANCELED`)
                    ]



                    let message = `\n<strong>${translater(ctx.session.lang||'ru', 'ALL_ITEMS')}: ${total}</strong>\n`

                    if(Array.isArray(orders)){
                        if(orders.length>0){
                            orders.forEach((item:IOrders, index:number)=>{

                                const dateFormater = DateFormatter(new Date(item.date))
                                let dateFormaterIssue:string=item.dateIssued?DateFormatter(new Date(item.dateIssued)):'';

                                let num = pagination.currentPage===1?index+1:
                                    (index+1)+(pagination.size*(pagination.currentPage-1))




                                message+=HTMLFormatter([
                                    `/n№:${num}`,
                                    `/n/s${translater(ctx.session.lang||'ru', 'SHOP')} : ${item.shop.title}/s/n`,
                                    `${item.status==='CANCELED'?`/n/s${translater(ctx.session.lang||'ru', 'RETURN_ORDER')} ❌/n${translater(ctx.session.lang||'ru', 'CAUSE')}: ${item.returnCause||'---'}/s`:item.dateIssued?`/n/s${translater(ctx.session.lang||'ru', 'GET_ORDER')} ✅/s`:''}/n`,
                                    `${(item.comment||'').replace(/\./g, '')?`/b${translater(ctx.session.lang||'ru', 'CUSTOMER_COMMENT')}:/b ${item.comment}/n`:''}`,
                                    `/b${translater(ctx.session.lang||'ru', 'AMOUNT_ITEMS')}:/b ${item.status==='CANCELED'?item.amountReturns:item.amount}/n`,
                                    `/bSKU:/b ${item.skuTitle}/n`,
                                    `/b${translater(ctx.session.lang||'ru', 'ITEM')}:/b ${item.productTitle}/n`,
                                    `/b${translater(ctx.session.lang||'ru', 'COST')}:/b ${NumReplace(item.sellPrice)} сум/n`,
                                    `/b${translater(ctx.session.lang||'ru', 'SELLER_COST')}:/b ${NumReplace(item.sellerProfit)} сум/n`,
                                    `/b${translater(ctx.session.lang||'ru', 'DATE_BUY')}:/b ${dateFormater}/n`,
                                    `/b${translater(ctx.session.lang||'ru', 'DATE_ISSUED')}:/b ${dateFormaterIssue}/n`,
                                    `-------------------------------------`,
                                ])
                            })
                        }else{
                            message = `${translater(ctx.session.lang||'ru', 'LIST_EMPTY')} ⭕️`
                        }

                    }else{
                        message = `${translater(ctx.session.lang||'ru', 'LIST_EMPTY')} ⭕️`
                    }


                    const pagination_buttons:any[] = []

                    if(pagination.currentPage>1){
                        pagination_buttons.push(Markup.button.callback(`⬅️ ${translater(ctx.session.lang||'ru', 'BACK')}`, `orderpage${status}-${pagination.currentPage-1}`))
                    }

                    pagination_buttons.push(Markup.button.callback(`${pagination.currentPage}/${pagination.total_pages}`, `actionNo`))

                    if(pagination.currentPage<pagination.total_pages){
                        pagination_buttons.push(Markup.button.callback(`${translater(ctx.session.lang||'ru', 'FRONT')} ➡️`, `orderpage${status}-${pagination.currentPage+1}`))
                    }

                    if(pagination.total_pages>1){
                        return await ctx.replyWithHTML(message, Markup.inlineKeyboard(pagination_buttons))
                    }else{
                        return await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons_orders))
                    }





                }
            }catch(err:any){
                const err_message = `Метод: Command /orderpage|orderstatus\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }



        })

    }
}