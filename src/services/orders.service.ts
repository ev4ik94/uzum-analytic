import {IStateManager} from "../config/config.interface";

const fetch = require('node-fetch')
import {IOrders} from '../context/context.interface'
import AuthenticatedService from "./authenticated.service";

import {Orders, Users} from "../models";
import {StateManager} from "../state";

const stateManagers = new StateManager()
const AuthService = new AuthenticatedService(stateManagers)


export  default class OrdersService{
    state:IStateManager
    constructor(stateManager:IStateManager) {
       this.state = stateManager
    }


    async initData(ctx:any){
        try{
            const {token, userId, shops} = ctx.session
            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: undefined, token, page:'1', size: 1500})
            const orderItems = orders_uzum?.orderItems||[]


            const orders_with_shop = (orderItems||[]).map((item:any)=>{
                const shop_info = shops.find((sho:any)=>sho.id===item.shopId)
                return{
                    ...item,
                    // productImage: item.productImage.photo['480'].high,
                    // shopTitle: shop_info.shopTitle,
                    shop: {
                        title: shop_info.shopTitle,
                        id:  shop_info.id
                    }

                }
            })

            //await this.addOrders(userId, orders_with_shop)

            ctx.session.orders = orders_with_shop

            //this.state.setOrders(orders_with_shop, userId)

        }catch(err:any){
            throw new Error(err)
        }
    }



    async getOrders(data:{shopId?:number, token:string, status:string, ctx:any, page?:string, size?:number}){
        try{
            const language:string = data.ctx.session.lang||'ru'
            const {shops} = data.ctx.session

            let params:{group:boolean, statuses:string, size: number, page: number} = {
                group: false,
                statuses: data.status,
                size: data?.size?data.size:5,
                page: data?.page?+data.page-1:0
            }



            let response_orders:any;

            if(data.status==='ALL'){
                response_orders = await fetch(`${process.env.API}/seller/finance/orders?group=false&size=${params.size}&page=${params.page}${data.shopId?`&shopId=${data.shopId}`:''}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
                });
            }else{
                response_orders = await fetch(`${process.env.API}/seller/finance/orders?group=false&size=${params.size}&page=${params.page}&statuses=${params.statuses}${data.shopId?`&shopId=${data.shopId}`:''}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
                });
            }


            if(!response_orders.ok) {

                if(response_orders.status===401){
                    await AuthService.refreshToken(data.ctx)
                    return
                }else{
                    //await data.ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(data.ctx, `URL: ${response_orders.url} STATUS: ${response_orders.status} USER_ID: ${data.ctx.session.userId} TEXT: ${response_orders.statusText}`))
                    return
                }

                //throw new Error(`URL: ${response_orders.url} STATUS: ${response_orders.status} TEXT: ${response_orders.statusText}`)

            }


            const body = await response_orders.json()



            const {orderItems, totalElements}:{orderItems:any[], totalElements:number} = body
            const total_pages:number = +Math.ceil(totalElements/params.size).toFixed(0)

            const orders_with_shop = orderItems.map((item:any)=>{
                const shop_info = shops.find((sho:any)=>sho.id===item.shopId)
                return{
                    ...item,
                    shop: {
                       title: shop_info.shopTitle,
                       id:  shop_info.id
                    }

                }
            })



            const pagination = {
                currentPage: params.page+1,
                total_pages:total_pages,
                size: params.size

            }


            return {orderItems:orders_with_shop, totalElements, pagination}



        }catch (err:any){
            //await data.ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(data.ctx, JSON.stringify(err)))
            throw new Error(err)
        }
    }


    async notificationOrdersNew(ctx:any){
        try{

            const {token, userId, shops} = ctx.session
            const orders = ctx.session.orders||[]



            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: undefined, token, page:'1', size: 1500})
            let is_notified = false

            let orderItems:any[] = orders_uzum?.orderItems || []

            if(orders_uzum){

                orderItems = orderItems.map((item:any)=>{
                    const shop_info = shops.find((sho:any)=>sho.id===item.shopId)
                    return{
                        ...item,
                        shop: {
                            title: shop_info.shopTitle,
                            id:  shop_info.id
                        }

                    }
                })




                let notify_data:any = []


                if(orders&&(orders.length&&orderItems.length)){

                    const order_ids:any[] = orders.map((item:any)=>item.id)
                    const order_ids_uzum:any[] = orderItems.map((item:any)=>item.id)

                    for(let i=0; i<order_ids_uzum.length; i++){
                        const data_n:any = {}
                        if(!order_ids.includes(order_ids_uzum[i])){

                            let newOrder = orderItems.find((order:IOrders)=>order.id===order_ids_uzum[i])

                            if(newOrder.status==='PROCESSING'&&!newOrder.dateIssued){
                                ctx.session.orders = [...ctx.session.orders, newOrder]
                                //this.state.setOrders([...this.state.getOrders(userId), newOrder], userId)
                                is_notified = true
                                data_n['type'] = 'new_order'
                                data_n['order'] = newOrder
                                notify_data.push(data_n)
                            }

                        }
                    }


                    for(let k=0; k<orders.length;k++){
                        const data_n:any = {}
                        let elem = orderItems.find((item:IOrders)=>item.id===orders[k].id)

                        if(elem){


                            if(elem.status!==orders[k].status){
                                data_n['type'] = 'change_status'
                                data_n['order'] = elem
                                notify_data.push(data_n)
                                is_notified = true

                                ctx.session.orders = (ctx.session.orders||[]).map((item:IOrders)=>{
                                    if(item.id===elem.id){
                                        if(elem.status==='CANCELED'){
                                            return {
                                                ...item,
                                                ...elem
                                            }
                                        }else{
                                            return {
                                                ...item,
                                                ...elem
                                            }
                                        }
                                    }

                                    return item
                                })

                                // this.state.setOrders(this.state.getOrders(userId).map((item:IOrders)=>{
                                //     if(item.orderId===elem.orderId){
                                //         if(elem.status==='CANCELED'){
                                //             return {
                                //                 ...item,
                                //                 ...elem
                                //             }
                                //         }else{
                                //             return {
                                //                 ...item,
                                //                 ...elem
                                //             }
                                //         }
                                //     }
                                //
                                //     return item
                                // }), userId)


                            }else if(elem.status!=='CANCELED'&&+elem.dateIssued!==+orders[k].dateIssued){
                                data_n['type'] = 'change_date'
                                data_n['order'] = elem
                                notify_data.push(data_n)
                                is_notified = true

                                ctx.session.orders = (ctx.session.orders||[]).map((item:IOrders)=>{
                                    if(item.id===elem.id){
                                        return {
                                            ...item,
                                            ...elem
                                        }
                                    }

                                    return item
                                })

                                // this.state.setOrders(this.state.getOrders(userId).map((item:IOrders)=>{
                                //     if(item.orderId===elem.orderId){
                                //         return {
                                //             ...item,
                                //             ...elem
                                //         }
                                //     }
                                //
                                //     return item
                                // }), userId)
                            }
                        }
                    }


                }else {
                    ctx.session.orders = orderItems
                    //this.state.setOrders(orderItems, userId)
                }

                if(is_notified) return notify_data
            }





            return false

        }catch (err:any){
            throw new Error(err)
        }
    }


    async addOrders(userId:number, orders:any[]){
        try{
            const user = await Users.findOne({where: {userId:userId}})

            if(!user) throw new Error('Пользователь не найден')


            await Orders.bulkCreate(orders.map((item:any)=>{return {...item, userId:+userId}}))
                .then((result)=>{

                })
                .catch((err:any)=>{
                    throw new Error(err)
                })

            // for(let k=0; k<orders.length; k++){
            //     await Orders.bulkCreate({...orders[k], userId:userId})
            // }


        }catch (err:any){
            throw new Error(err)
        }
    }


    async deleteAllOrdersByUser(userId:number){

        try{
            await Orders.destroy({
                where: {userId:userId}
            })
        }catch (err:any){

        }

    }








}