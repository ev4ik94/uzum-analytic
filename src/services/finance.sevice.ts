import {IStateManager} from "../config/config.interface";
const fetch = require('node-fetch')

export  default class FinanceSevice {

    constructor() {
    }

    async getFinanceInfo(ctx:any){
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


    async requestHistory(ctx:any):Promise<{inProcessingCount:number, withdrawList:any[]}|undefined>{
        try{
            const {current_shop, token} = ctx.session
            const request_history_response = await fetch(`${process.env.API}/seller/withdraws/latest-short?shopId=${current_shop}&count=5`, {
                headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
            })

            if(!request_history_response.ok) throw new Error(`URL: ${request_history_response.url} STATUS: ${request_history_response.status} TEXT: ${request_history_response.statusText}`)

            const {payload} = await request_history_response.json()

            const {withdrawList, inProcessingCount} = payload

            return {withdrawList, inProcessingCount}

        }catch (err:any){

        }
    }
}