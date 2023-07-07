import {IAuth, IConfig} from "../config/config.interface";
const fetch = require('node-fetch')




export  default class ProductsService{
    constructor(private readonly authService: IAuth) {
    }

    async getProducts(data:{shopId:number, token:string, page:number, ctx:any}){
        try{

            const response_products = await fetch(`${process.env.API}/seller/shop/${data.shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=150&page=${data.page}`, {
                method: 'GET',
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
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

            let page =0;
            let total_pages = 50
            let product_find:any = {}


            for(let i=0; i<total_pages; i++){

                const response_products = await fetch(`${process.env.API}/seller/shop/${shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=150&page=${page}`, {
                    method: 'GET',
                    headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
                });

                if(!response_products.ok) throw new Error(`URL: ${response_products.url} STATUS: ${response_products.status} TEXT: ${response_products.statusText}`)

                const body:any = await response_products.json();


                if((body?.productList||[]).find((item:any)=>item.productId===productId)){
                    product_find = body?.productList.find((item:any)=>item.productId===productId)
                    break;
                }

            }


            const response1 = await fetch(`${process.env.API_CLIENT}/v2/product/${productId}`, {
                headers: {'accept-language': 'ru-RU'}
            });

            if(!response1.ok) throw new Error(`URL: ${response1.url} STATUS: ${response1.status} TEXT: ${response1.statusText}`)

            const actions = await fetch(`${process.env.API_CLIENT}/product/actions/${productId}`, {
                headers: {'accept-language': 'ru-RU'}
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



}