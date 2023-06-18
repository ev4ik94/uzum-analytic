import {IStateManager} from "../config/config.interface";

const fetch = require('node-fetch')
import {IOrders} from '../context/context.interface'


export  default class OrdersService{
    state:IStateManager
    constructor(stateManager:IStateManager) {
       this.state = stateManager
    }


    async initData(ctx:any){
        try{
            const {token, current_shop, userId} = ctx.session
            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: current_shop, token, page:'1', size: 200})
            const {orderItems} = orders_uzum
            this.state.setOrders(orderItems, userId)

        }catch(err:any){
            throw new Error(err)
        }
    }

    async getOrders(data:{shopId:number, token:string, status:string, ctx:any, page?:string, size?:number}){
        try{

            let params:{group:boolean, statuses:string, size: number, page: number} = {
                group: false,
                statuses: data.status,
                size: data?.size?data.size:5,
                page: data?.page?+data.page-1:0
            }



            let response_orders:any;

            if(data.status==='ALL'){
                response_orders = await fetch(`${process.env.API}/seller/finance/orders?group=false&size=${params.size}&page=${params.page}&shopId=${data.shopId}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }else{
                response_orders = await fetch(`${process.env.API}/seller/finance/orders?group=false&size=${params.size}&page=${params.page}&statuses=${params.statuses}&shopId=${data.shopId}`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }


            if(!response_orders.ok) throw new Error(`URL: ${response_orders.url} STATUS: ${response_orders.status} TEXT: ${response_orders.statusText}`)




            const body = await response_orders.json()



            const {orderItems, totalElements}:{orderItems:any[], totalElements:number} = body
            const total_pages:number = +Math.ceil(totalElements/params.size).toFixed(0)



            const pagination = {
                currentPage: params.page+1,
                total_pages:total_pages,
                size: params.size

            }


            return {orderItems, totalElements, pagination}



        }catch (err:any){
            throw new Error(err)
        }
    }


    async notificationOrdersNew(ctx:any){
        try{
            const {token, current_shop, userId} = ctx.session
            const orders = this.state.getOrders(userId)



            const orders_uzum = await this.getOrders({status: 'ALL', ctx, shopId: current_shop, token, page:'1', size: 200})
            let is_notified = false
            let orderItems = []


            if(+current_shop===11921){
                orderItems = [...orders_uzum.orderItems, {
                    amount: 1,
                amountReturns: 0,
                cancelled: null,
                comment: null,
                commission: 17280,
                date: 1687094882798,
                dateIssued: null,
                id: 7899492,
                orderId: 3698678,
                productId: 457915,
                productImage: {
                    photo: {
                            540: {
                            high: "https://images.uzum.uz/chusfcdenntd8rfaq500/t_product_540_high.jpg",
                            low: "https://images.uzum.uz/chusfcdenntd8rfaq500/t_product_540_low.jpg"}
                    }
                },
                productTitle:"Пижама атласная, с шортами",
                purchasePrice:75000,
                returnCause:null,
                sellPrice:144000,
                sellerProfit:126720,
                shopId:11921,
                skuTitle:"REDFOXY-RFPIJAM-M-СИНМЕЛ",
                status:"PROCESSING",
                withdrawnProfit:0
                }]
            }else{
                orderItems = orders_uzum.orderItems
            }





            let notify_data:any = []


            if(orders&&(orders.length&&orderItems.length)){

                const order_ids = orders.map((item:any)=>item.id)
                const order_ids_uzum = orderItems.map((item:any)=>item.id)

                for(let i=0; i<order_ids_uzum.length; i++){
                    const data_n:any = {}
                    if(!order_ids.includes(order_ids_uzum[i])){
                        let newOrder = orderItems.find((order:IOrders)=>order.id===order_ids_uzum[i])
                        this.state.setOrders([...orders, newOrder], userId)
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
                                        dateIssued: elem.dateIssued
                                    }
                                }

                                return {...item}
                            }), userId)
                        }
                    }
                }


            }else {
                this.state.setOrders(orderItems, userId)
            }

            if(is_notified) return notify_data

            return false

        }catch (err:any){
            throw new Error(err)
        }
    }








}