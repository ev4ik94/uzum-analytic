import {IAuth, IConfig} from "../config/config.interface";
import {Markup} from "telegraf";
const fetch = require('node-fetch')
import moment from "moment";
import {IOrders} from "../context/context.interface";


export  default class OrdersService{
    constructor(private readonly configService: IConfig, private readonly authService: IAuth) {
    }

    async getOrders(data:{shopId:number, token:string, status:string, ctx:any}){
        try{

            let params = {
                group: false,
                statuses: data.status,
                size: 20,
                page: 0,
                dateFrom: moment().subtract(2, 'week').unix(),
                dateTo: moment().unix()
            }

            let response_orders:any;

            if(data.status==='ALL'){
                response_orders = await fetch(`${this.configService.get('API')}/seller/finance/orders?group=false&size=${params.size}&page=0&dateFrom=${params.dateFrom}&dateTo=${params.dateTo}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }else{
                response_orders = await fetch(`${this.configService.get('API')}/seller/finance/orders?group=false&size=${params.size}&page=0&statuses=${params.statuses}&dateFrom=${params.dateFrom}&dateTo=${params.dateTo}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }




            const body = await response_orders.json()


            if(body.status>300){
                throw new Error(`ОШИБКА ${body.status}\n${this.configService.get('API')}/seller/finance/orders?size=100&page=0&group=false`)
            }else if(body.errors||body.error){

                if(body.error){
                    if(body.error==='invalid_token'){
                        return this.authService.refreshToken(data.ctx)
                    }
                    throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/finance/orders\n${body.error}`)
                }
                throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/finance/orders?group=false&statuses=${params.statuses}&size=100&page=0&dateFrom=${params.dateFrom}&dateTo=${params.dateTo}`)
            }



            const {orderItems, totalElements} = body


            let amount = orderItems.reduce((accumulator:any, currentValue:any)=>{
                if(data.status==='PROCESSING'||data.status==='TO_WITHDRAW'){
                    return accumulator+(+currentValue.sellerProfit)
                }else{
                    return accumulator+(+currentValue.sellPrice)
                }


            }, 0)

            return {orderItems, totalElements, amount}





        }catch (err:any){
            throw new Error(err)
        }
    }


    async notificationOrdersNew(ctx:any){
        try{
            const {token, current_shop, orders} = ctx.session



            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: current_shop, token})
            let is_notified = false

            const {orderItems} = orders_uzum

            let notify_data:any = []



            if(orders&&(orders.length&&orderItems.length)){

                const order_ids = orders.map((item:any)=>item.orderId)
                const order_ids_uzum = orderItems.map((item:any)=>item.orderId)

                for(let i=0; i<order_ids_uzum.length; i++){
                    const data_n:any = {}
                    if(!order_ids.includes(order_ids_uzum[i])){
                        let newOrder = orderItems.find((order:IOrders)=>order.orderId===order_ids_uzum[i])
                        ctx.session.orders = [...orders, newOrder]
                        is_notified = true
                        data_n['type'] = 'new_order'
                        data_n['order'] = newOrder
                        notify_data.push(data_n)

                    }
                }


                for(let k=0; k<orders.length;k++){
                    const data_n:any = {}
                    let elem = orderItems.find((item:IOrders)=>item.orderId===orders[k].orderId)

                    if(elem){
                        if(elem.status!==orders[k].status){
                            console.log('CHANGE')
                            data_n['type'] = 'change_status'
                            data_n['order'] = elem
                            notify_data.push(data_n)
                            is_notified = true

                            ctx.session.orders = ctx.session.orders.map((item:IOrders)=>{
                                if(item.orderId===elem.orderId){
                                    if(elem.status==='CANCELED'){
                                        return {
                                            ...item,
                                            status: elem.status,
                                            returnCause: elem.returnCause,
                                            amountReturns: elem.amountReturns,
                                            comment: elem.comment,
                                            amount: elem.amount,
                                        }
                                    }else{
                                        return {
                                            ...item,
                                            status: elem.status,
                                            amount: elem.amount
                                        }
                                    }
                                }

                                return {...item}
                            })
                        }else if(+elem.dateIssued!==+orders[k].dateIssued){
                            data_n['type'] = 'change_date'
                            data_n['order'] = elem
                            notify_data.push(data_n)
                            is_notified = true

                            ctx.session.orders = ctx.session.orders.map((item:IOrders)=>{
                                if(item.orderId===elem.orderId){
                                    return {
                                        ...item,
                                        dateIssued: elem.dateIssued
                                    }
                                }

                                return {...item}
                            })
                        }
                    }
                }


            }else {
                ctx.session.orders = orderItems
            }

            if(is_notified) return notify_data

            return false

        }catch (err:any){

        }
    }








}