import {IStateManager} from "../config/config.interface";
const fetch = require('node-fetch')
import {ApiError} from "../utils/ErrorHandler";
import {IOrders} from "../context/context.interface";

export  default class FinanceSevice {

    state:IStateManager
    constructor(stateManager:IStateManager) {
        this.state = stateManager
    }

    async initData(ctx:any){
        try{
            const {userId} = ctx.session
            const payments_uzum = await FinanceSevice.requestHistory(ctx, true)
            const invoice = await FinanceSevice.getInvoiceInfo(ctx)

            if(payments_uzum) this.state.setPayments(payments_uzum?.withdrawList||[], userId)
            if(invoice) this.state.setInvoice(invoice||[], userId)

        }catch(err:any){
            throw new Error(err)
        }
    }

    static async getFinanceInfo(ctx:any){
        try{
            const {current_shop, token} = ctx.session
            const finance_response = await fetch(`${process.env.API}/seller/finance/statement?shopId=${current_shop}`, {
                headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
            })

            if(!finance_response.ok) throw new Error(`URL: ${finance_response.url} STATUS: ${finance_response.status} TEXT: ${finance_response.statusText}`)

            return  await finance_response.json()

        }catch(err:any){
            throw new Error(err)
        }
    }

    static async getInvoiceInfo(ctx:any){
        try{
            const {current_shop, token} = ctx.session
            const invoice_response = await fetch(`${process.env.API}/seller/shop/${current_shop}/invoice?page=0&size=20`, {
                headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
            })

            if(!invoice_response.ok) throw new Error(`URL: ${invoice_response.url} STATUS: ${invoice_response.status} TEXT: ${invoice_response.statusText}`)

            return  await invoice_response.json()

        }catch(err:any){
            throw new Error(err)
        }
    }




    static async requestHistory(ctx:any, all?:boolean):Promise<{inProcessingCount:number, withdrawList:any[]}|undefined>{
        try{
            const {current_shop, token} = ctx.session
            const request_history_response = await fetch(`${process.env.API}/seller/withdraws/latest-short?count=10${!all?`&shopId=${current_shop}`:''}`, {
                headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
            })

            if(!request_history_response.ok) {
                return undefined
            }

            const {payload} = await request_history_response.json()

            const {withdrawList, inProcessingCount} = payload

            return {withdrawList, inProcessingCount}

        }catch (err:any){
            throw new Error(err)
        }
    }


    async notifyRequestHistory(ctx:any){
        try{
            const {userId} = ctx.session
            const finance_request = await FinanceSevice.requestHistory(ctx,true)
            const payments_history = this.state.getPayments(userId)
            let is_notified = false

            let notify_data:any = []





            if(finance_request?.withdrawList&&finance_request?.withdrawList.length&&payments_history.length){
                const payments_ids = payments_history.map((item:any)=>item.id)
                const payments_ids_uzum = finance_request?.withdrawList.map((item:any)=>item.id)

                for(let i=0; i<payments_ids_uzum.length; i++){
                    if(!payments_ids.includes(payments_ids_uzum[i])){
                        let newOrder = finance_request?.withdrawList.find((payment:any)=>payment.id===payments_ids_uzum[i])

                        this.state.setPayments([...this.state.getPayments(userId), newOrder], userId)
                    }
                }

                for(let k=0; k<payments_history.length;k++){
                    const data_n:any = {}
                    let elem = finance_request?.withdrawList.find((item:any)=>item.id===payments_history[k].id)

                    if(elem){

                        if(elem.status!==payments_history[k].status){
                            data_n['type'] = 'change_payment'
                            data_n['payments'] = elem
                            notify_data.push(data_n)
                            is_notified = true


                            this.state.setPayments(this.state.getPayments(userId).map((item:any)=>{
                                if(item.id===elem.id){
                                    return {...item, ...elem}
                                }

                                return {...item}
                            }), userId)


                        }
                    }
                }
            }

            if(is_notified) return notify_data

            return false

        }catch (err:any){
            throw new Error(err)
        }
    }



    async notifyInvoice(ctx:any){
        try{
            const {userId} = ctx.session
            const invoice_request = await FinanceSevice.getInvoiceInfo(ctx)
            const invoice = this.state.getInvoice(userId)
            let is_notified = false

            let notify_data:any = []



            if(invoice_request&&invoice_request.length&&invoice.length){
                const invoice_ids = invoice.map((item:any)=>item.id)
                const invoice_ids_uzum = invoice_request.map((item:any)=>item.id)


                for(let i=0; i<invoice_ids_uzum.length; i++){
                    if(!invoice_ids.includes(invoice_ids_uzum[i])){
                        let newOrder = invoice_request.find((payment:any)=>payment.id===invoice_ids_uzum[i])

                        this.state.setInvoice([...this.state.getInvoice(userId), newOrder], userId)
                    }
                }

                for(let k=0; k<invoice.length;k++){
                    const data_n:any = {}
                    let elem = invoice_request.find((item:any)=>item.id===invoice[k].id)

                    if(elem){


                        if(elem.invoiceStatus.value!==invoice[k].invoiceStatus.value){
                            data_n['type'] = 'change_invoice'
                            data_n['invoice'] = elem
                            notify_data.push(data_n)
                            is_notified = true


                            this.state.setInvoice(this.state.getInvoice(userId).map((item:any)=>{
                                if(item.id===elem.id){
                                    return {...item, ...elem}
                                }

                                return {...item}
                            }), userId)


                        }
                    }
                }
            }

            if(is_notified) return notify_data

            return false

        }catch (err:any){
            throw new Error(err)
        }
    }





}