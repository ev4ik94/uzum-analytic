import {IConfig} from "../config/config.interface";
const fetch = require('node-fetch')
import {Users, Statuses} from "../models";
import {IBotContext} from "../context/context.interface";
import moment from "moment";
import {Markup} from "telegraf";
import {ConfigService} from "../config/config.service";
import AuthenticatedService from "./authenticated.service";
import ReviewsService from "./reviews.service";
import OrdersService from "./orders.service";
import PermissionService from "./permissions.service";


const configService = new ConfigService()

const ReviewService = new ReviewsService(configService)
const OrdersServices = new OrdersService(configService)
const PermissionServiceData = new PermissionService(configService)

export  default class UpdatesService{

    private intervalCheckSubscribe:any
    private intervalPushNotify:any

    constructor() {
    }


    onSubsriptionsEvents(event:string, ctx:any){


        if(event==='check_subscribe'){
            this.onCheckSubscribe(ctx)
        }
        if(event==='check_push_notify'){
            this.onPushNotify(ctx)
        }

    }

    offSubscriptionsEvents(event:string){
        console.log('off')
        if(event==='check_subscribe'){
            this.deleteCheckSubscribe()
        }

        if(event==='check_push_notify'){
            this.deletePushNotify()
        }
    }

    private onCheckSubscribe(ctx:any){
        this.intervalCheckSubscribe = setInterval(async()=>{
            await PermissionServiceData.checkSubscribe(ctx.message.from.id)
        }, 3600000)
    }

    private onPushNotify(ctx:any){
        this.intervalPushNotify = setInterval(async()=>{
            const notified_data = await OrdersServices.notificationOrdersNew(ctx)
            const new_reviews = await ReviewService.getReviews({shopId: ctx.session.current_shop, token: ctx.session.token, status: 'NEW'})


            if(notified_data){

                for(let k=0; k<notified_data.length;k++){
                    if(notified_data[k].type==='new_order'){
                        await ctx.reply('Новый заказ ❗️❗️❗️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                    }else if(notified_data[k].type==='change_status'){
                        const status = notified_data[k].order?.status

                        if(status==='CANCELED'){
                            await ctx.reply('Заказ отменен ❌',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                        }

                        if(status==='TO_WITHDRAW'){
                            await ctx.reply('Заказ одобрен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                        }

                        // await ctx.reply('Заказ изменен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))

                    }else if(notified_data[k].type==='change_date'){
                        if(notified_data[k].order.dateIssued){
                            await ctx.reply('Заказ получен ✅',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                        }

                    }
                }

            }

            if(new_reviews.length>0){
                for(let i=0; i<new_reviews.length;i++){
                    await ctx.reply('Новый отзыв 🙋‍♀️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `reviewId${new_reviews[i].reviewId}`)]))
                }
            }
        }, 180000)
    }

    private deleteCheckSubscribe(){
        clearInterval(this.intervalCheckSubscribe)
    }


    private deletePushNotify(){
        clearInterval(this.intervalPushNotify)
    }


}

