import {IStateManager} from "../config/config.interface";

import {Markup} from "telegraf";
import ReviewsService from "./reviews.service";
import OrdersService from "./orders.service";
import PermissionService from "./permissions.service";
import FinanceSevice from "./finance.sevice";
import {NumReplace, translater} from "../utils";




const ReviewService = new ReviewsService()



export  default class UpdatesService{

    private intervalCheckSubscribe:any
    private intervalPushNotify:any
    private state:IStateManager


    constructor(private readonly stateManager:IStateManager) {
        this.state = stateManager

    }


    async onSubsriptionsEvents(event:string, ctx:any){


        if(event==='check_subscribe'){
            await this.onCheckSubscribeInterval(ctx)
        }
        if(event==='check_push_notify'){
            this.onPushNotify(ctx)
        }

    }

    offSubscriptionsEvents(event:string){

        if(event==='check_subscribe'){
            this.deleteCheckSubscribe()
        }

        if(event==='check_push_notify'){

            this.deletePushNotify()
        }
    }

    async onCheckSubscribe(ctx:any){
        const {userId} = ctx.session
        const PermissionServiceData = new PermissionService(this.state)
        return await PermissionServiceData.checkSubscribe(userId, ctx)
    }

    private async onCheckSubscribeInterval(ctx:any){
        const {userId} = ctx.session
        const PermissionServiceData = new PermissionService(this.state)

        setInterval(async()=>{
            if(this.state.getIsActivate(ctx.session.userId).status){
                await PermissionServiceData.checkSubscribe(userId, ctx)
            }

        }, 300000)
    }


    private async onPushNotify(ctx:any){
        const OrdersServices = new OrdersService(this.state)
        const financeService = new FinanceSevice(this.state)
        await OrdersServices.initData(ctx)
        await financeService.initData(ctx)



        this.intervalPushNotify = setInterval(async()=>{

            if(this.state.getIsActivate(ctx.session.userId).status){

                if(this.state.getClearData(ctx.session.userId)){
                    await OrdersServices.initData(ctx)
                    await financeService.initData(ctx)
                    this.state.setClearData(false, ctx.session.userId)
                }
                const notified_data = await OrdersServices.notificationOrdersNew(ctx)
                const new_reviews = await ReviewService.getReviews({ctx, shopId: undefined, token: ctx.session.token, status: 'NEW'})
                const payment_history = await financeService.notifyRequestHistory(ctx)
                const invoice = await financeService.notifyInvoice(ctx)
                const language = ctx.session.lang||'ru'


                if(notified_data){


                    for(let k=0; k<notified_data.length;k++){
                        if(notified_data[k].type==='new_order'){
                            if(+ctx.session.userId===461310116){
                                await ctx.telegram.sendMessage('@logsUsers', `Запрос: (Уведомления) Новый заказ\nОтвет:\n${JSON.stringify(notified_data[k].order||{})}`)
                            }
                            await ctx.reply(`📢 ${translater(language, 'NEW_ORDER')} ❗️❗️❗️`,  Markup.inlineKeyboard([Markup.button.callback(translater(language, 'VIEW'), `orderView${notified_data[k].order.id}`)]))
                        }else if(notified_data[k].type==='change_status'){
                            const status = notified_data[k].order?.status

                            if(+ctx.session.userId===461310116){
                                await ctx.telegram.sendMessage('@logsUsers', `Запрос: (Уведомления) Статус измене\nОтвет:\n${JSON.stringify(notified_data[k].order||{})}`)
                            }

                            if(status==='CANCELED'){
                                await ctx.reply(`📢 ${translater(language, 'CANCELED_ORDER')} ❌`,  Markup.inlineKeyboard([Markup.button.callback(translater(language, 'VIEW'), `orderView${notified_data[k].order.id}`)]))
                            }

                            if(status==='TO_WITHDRAW'){
                                await ctx.reply(`📢 ${translater(language, 'SUCCESS_ORDER')} ✅`,  Markup.inlineKeyboard([Markup.button.callback(translater(language, 'VIEW'), `orderView${notified_data[k].order.id}`)]))
                            }

                            // await ctx.reply('Заказ изменен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))

                        }else if(notified_data[k].type==='change_date'){
                            if(notified_data[k].order.dateIssued){
                                await ctx.reply(`📢 ${translater(language, 'WITH_DRAW_ORDER')} 🛍`,  Markup.inlineKeyboard([Markup.button.callback(translater(language, 'VIEW'), `orderView${notified_data[k].order.id}`)]))
                            }

                        }
                    }

                }

                if(new_reviews&&new_reviews.length>0){
                    for(let i=0; i<new_reviews.length;i++){
                        await ctx.reply(`📢 ${translater(language, 'NEW_REVIEW')} 💌️`,  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `reviewView${new_reviews[i].reviewId}`)]))
                    }
                }

                if(payment_history){
                    for(let k=0; k<payment_history.length; k++){
                        if(payment_history[k].payments.status==='APPROVED'){
                            await ctx.replyWithHTML(`<strong>📢 ${translater(language, 'CASH_SUCCESS')} 💸</strong>\n${translater(language, 'SUM_TEXT')}: ${NumReplace(payment_history[k].payments.amount+'')} сум`, {parse_mode:'HTML'})
                        }
                    }
                }

                if(invoice){
                    for(let k=0; k<invoice.length; k++){
                        await ctx.replyWithHTML(`<strong>📢 ${translater(language, 'CHANGE_INVOICE')} 📦</strong>\n${translater(language, 'INVOICE_NUMBER')} ${invoice[k].invoice.invoiceNumber}\nСтатус: ${invoice[k].invoice.status}`, {parse_mode:'HTML'})
                    }
                }
            }

        }, 180000)
    }

    private deleteCheckSubscribe(){

        clearInterval(this.intervalCheckSubscribe())
    }


    private deletePushNotify(){
        if(this.intervalPushNotify!==undefined) clearInterval(this.intervalPushNotify)

    }


}

