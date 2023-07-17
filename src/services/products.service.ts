import {IAuth, IConfig} from "../config/config.interface";
import {IResponseProduct} from "../context/context.interface";
import {translater} from "../utils";
const fetch = require('node-fetch')




export  default class ProductsService{
    constructor() {
    }

    async getProducts(data:{shopId:number, token:string, page:number, ctx:any}){
        try{
            const language:string = data.ctx.session.lang||'ru'
            const response_products = await fetch(`${process.env.API}/seller/shop/${data.shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=150&page=${data.page}`, {
                method: 'GET',
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
            });

            if(!response_products.ok) {
                 throw new Error(`URL: ${response_products.url} STATUS: ${response_products.status} TEXT: ${response_products.statusText}`)
            }

            const body:any = await response_products.json();


            return body.productList


        }catch (err:any){
            throw new Error(err)
        }
    }


    async getProductStatistic(data:{token:string, productId:number, shopId:number, ctx:any}){
        const {token, productId, shopId} = data
        try{
            const language:string = data.ctx.session.lang||'ru'
            let page =0;
            let total_pages = 50
            let product_find:any = {}


            for(let i=0; i<total_pages; i++){

                const response_products = await fetch(`${process.env.API}/seller/shop/${shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=150&page=${page}`, {
                    method: 'GET',
                    headers: {'Authorization': `Bearer ${token}`, 'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
                });

                if(!response_products.ok) throw new Error(`URL: ${response_products.url} STATUS: ${response_products.status} TEXT: ${response_products.statusText}`)

                const body:any = await response_products.json();


                if((body?.productList||[]).find((item:any)=>item.productId===productId)){
                    product_find = body?.productList.find((item:any)=>item.productId===productId)
                    break;
                }

            }


            const response1 = await fetch(`${process.env.API_CLIENT}/v2/product/${productId}`, {
                headers: {'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
            });

            if(!response1.ok) throw new Error(`URL: ${response1.url} STATUS: ${response1.status} TEXT: ${response1.statusText}`)

            const actions = await fetch(`${process.env.API_CLIENT}/product/actions/${productId}`, {
                headers: {'accept-language': language==='ru'?'ru-RU':'uz-UZ'}
            });

            if(!actions.ok) throw new Error(`URL: ${actions.url} STATUS: ${actions.status} TEXT: ${actions.statusText}`)


            const bodyProductOne = await response1.json()
            const bodyActions = await actions.json()


            const {payload} = bodyProductOne
            let product_info = payload?.data

            return {...product_find, ...product_info, actions: bodyActions}
        }catch (err){
            return err
        }
    }


    async remainderSku(ctx:any, token:string, productId: number, sku:string, type:string='ACTIVE'){
        try{
            const product:any = ctx.session.products.find((item:any)=>+item.productId===+productId)
            if(product){
                const elem_sku = (product?.skuList||[]).find((item:any)=>item.skuFullTitle===sku)
                if(type==='ACTIVE') return `${elem_sku&&elem_sku?.quantityActive?`${elem_sku?.quantityActive} шт.`:translater(ctx.session.lang, 'NO_MATCH_DATA')}`
                if(type==='CANCELED') return `${elem_sku&&elem_sku?.quantityReturned?`${elem_sku?.quantityReturned}`:translater(ctx.session.lang, 'NO_MATCH_DATA')}`
            }

            return translater(ctx.session.lang, 'NO_MATCH_DATA')

        }catch (err:any){

        }
    }



}