import {IStateManager} from "../config/config.interface";

const fetch = require('node-fetch')
import {Users, Statuses} from "../models";
import {IBotContext} from "../context/context.interface";
import moment from "moment";
import {Markup} from "telegraf";
import AuthenticatedService from "./authenticated.service";
import ReviewsService from "./reviews.service";
import OrdersService from "./orders.service";
import PermissionService from "./permissions.service";
import FinanceSevice from "./finance.sevice";
import {NumReplace} from "../utils";




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
        return await PermissionServiceData.checkSubscribe(userId)
    }

    private async onCheckSubscribeInterval(ctx:any){
        const {userId} = ctx.session
        const PermissionServiceData = new PermissionService(this.state)

        setInterval(async()=>{
            await PermissionServiceData.checkSubscribe(userId)
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

                if(+ctx.session.userId===1692592) await ctx.reply('Проверка')


                if(notified_data){

                    for(let k=0; k<notified_data.length;k++){
                        if(notified_data[k].type==='new_order'){
                            await ctx.reply('📢 Новый заказ ❗️❗️❗️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.id}`)]))
                        }else if(notified_data[k].type==='change_status'){
                            const status = notified_data[k].order?.status

                            if(status==='CANCELED'){
                                await ctx.reply('📢 Заказ отменен ❌',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.id}`)]))
                            }

                            if(status==='TO_WITHDRAW'){
                                await ctx.reply('📢 Заказ одобрен ✅',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.id}`)]))
                            }

                            // await ctx.reply('Заказ изменен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))

                        }else if(notified_data[k].type==='change_date'){
                            if(notified_data[k].order.dateIssued){
                                await ctx.reply('📢 Заказ получен 🛍',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.id}`)]))
                            }

                        }
                    }

                }

                if(new_reviews.length>0){
                    for(let i=0; i<new_reviews.length;i++){
                        await ctx.reply('📢 Новый отзыв 💌️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `reviewView${new_reviews[i].reviewId}`)]))
                    }
                }

                if(payment_history){
                    for(let k=0; k<payment_history.length; k++){
                        if(payment_history[k].payments.status==='APPROVED'){
                            await ctx.replyWithHTML(`<strong>📢 Вывод средств одобрен 💸</strong>\nСумма: ${NumReplace(payment_history[k].payments.amount+'')} сум`)
                        }
                    }
                }

                if(invoice){
                    for(let k=0; k<invoice.length; k++){
                        await ctx.replyWithHTML(`<strong>📢 Статус накладной изменен 📦</strong>\nНомер накладной ${invoice[k].invoice.invoiceNumber}\nСтатус: ${invoice[k].invoice.status}`)
                    }
                }
            }

        }, 10000)
    }

    private deleteCheckSubscribe(){

        clearInterval(this.intervalCheckSubscribe())
    }


    private deletePushNotify(){
        if(this.intervalPushNotify!==undefined) clearInterval(this.intervalPushNotify)

    }


}

