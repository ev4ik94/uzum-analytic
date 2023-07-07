import {IStateManager} from "../config/config.interface";

const fetch = require('node-fetch')
import {IOrders} from '../context/context.interface'
import AuthenticatedService from "./authenticated.service";
import {ApiError} from "../utils/ErrorHandler";


const AuthService = new AuthenticatedService()


export  default class OrdersService{
    state:IStateManager
    constructor(stateManager:IStateManager) {
       this.state = stateManager
    }


    async initData(ctx:any){
        try{
            const {token, userId, shops} = ctx.session
            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: undefined, token, page:'1', size: 200})
            const orderItems = orders_uzum?.orderItems||[]


            const orders_with_shop = (orderItems||[]).map((item:any)=>{
                const shop_info = shops.find((sho:any)=>sho.id===item.shopId)
                return{
                    ...item,
                    shop: {
                        title: shop_info.shopTitle,
                        id:  shop_info.id
                    }

                }
            })

            this.state.setOrders(orders_with_shop, userId)

        }catch(err:any){
            throw new Error(err)
        }
    }

    async getOrders(data:{shopId?:number, token:string, status:string, ctx:any, page?:string, size?:number}){
        try{

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
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }else{
                response_orders = await fetch(`${process.env.API}/seller/finance/orders?group=false&size=${params.size}&page=${params.page}&statuses=${params.statuses}${data.shopId?`&shopId=${data.shopId}`:''}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }


            if(!response_orders.ok) {

                if(response_orders.status===401){
                    await AuthService.refreshToken(data.ctx)
                }else{
                    await data.ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(data.ctx, `URL: ${response_orders.url} STATUS: ${response_orders.status} USER_ID: ${data.ctx.session.userId} TEXT: ${response_orders.statusText}`))
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
            await data.ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(data.ctx, JSON.stringify(err)))
            throw new Error(err)
        }
    }


    async notificationOrdersNew(ctx:any){
        try{
            const {token, userId, shops} = ctx.session
            const orders = this.state.getOrders(userId)



            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: undefined, token, page:'1', size: 200})
            let is_notified = false

            let orderItems = orders_uzum?.orderItems || []

            if(orders_uzum){
                // if(date_t<date){
                //     orderItems.push({
                //         amount:1,
                //         amountReturns:0,
                //         cancelled:null,
                //         comment:null,
                //         commission:22350,
                //         date:1687189699403,
                //         dateIssued:null,
                //         id:8039703,
                //         orderId:3769471,
                //         productId:441691,
                //         productImage:{
                //             photo: {
                //                 480:
                //                     {
                //                         high: "https://images.uzum.uz/chf9f6tenntd8rf9a700/t_product_540_high.jpg"
                //                     }
                //             }
                //         },
                //         productTitle:"Футболка женская укороченная оверсайз",
                //         purchasePrice:79500,
                //         returnCause:null,
                //         sellPrice:149000,
                //         sellerProfit:126650,
                //         shopId:11921,
                //         skuTitle:"REDFOXY-RFTOP-ГОЛУБ-M",
                //         status:"PROCESSING",
                //         withdrawnProfit:0
                //     })
                // }



                orderItems = (orderItems||[]).map((item:any)=>{
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


                if((orders&&orderItems)&&(orders.length&&orderItems.length)){

                    const order_ids = (orders||[]).map((item:any)=>item.id)
                    const order_ids_uzum = (orders||[]).map((item:any)=>item.id)

                    for(let i=0; i<order_ids_uzum.length; i++){
                        const data_n:any = {}
                        if(!order_ids.includes(order_ids_uzum[i])){

                            let newOrder = orderItems.find((order:IOrders)=>order.id===order_ids_uzum[i])

                            this.state.setOrders([...this.state.getOrders(userId), newOrder], userId)
                            is_notified = true
                            data_n['type'] = 'new_order'
                            data_n['order'] = newOrder
                            notify_data.push(data_n)


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

                                this.state.setOrders(this.state.getOrders(userId).map((item:IOrders)=>{
                                    if(item.orderId===elem.orderId){
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
                                }), userId)


                            }else if(elem.status!=='CANCELED'&&+elem.dateIssued!==+orders[k].dateIssued){
                                data_n['type'] = 'change_date'
                                data_n['order'] = elem
                                notify_data.push(data_n)
                                is_notified = true

                                this.state.setOrders(this.state.getOrders(userId).map((item:IOrders)=>{
                                    if(item.orderId===elem.orderId){
                                        return {
                                            ...item,
                                            ...elem
                                        }
                                    }

                                    return item
                                }), userId)
                            }
                        }
                    }


                }else {
                    this.state.setOrders(orderItems, userId)
                }

                if(is_notified) return notify_data
            }





            return false

        }catch (err:any){
            throw new Error(err)
        }
    }








}