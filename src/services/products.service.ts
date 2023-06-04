import {IAuth, IConfig} from "../config/config.interface";
import {Markup} from "telegraf";
const fetch = require('node-fetch')




export  default class ProductsService{
    constructor(private readonly configService: IConfig, private readonly authService: IAuth) {
    }

    async getProducts(data:{shopId:number, token:string, page:number, ctx:any}){
        try{

            const response_products = await fetch(`${this.configService.get('API')}/seller/shop/${data.shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=30&page=${data.page}`, {
                method: 'GET',
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
            });

            const body:any = await response_products.json();

            if(body.status>300){
                throw new Error(`${this.configService.get('API')}/seller/shop/${data.shopId}/product/getProducts`)
            }

            if(body.errors){
                if(body.errors.length){
                    throw new Error(body.errors[0].code + ': ' + body.errors[0].detailMessage)
                }else if(body.error==='invalid_token'){
                    return this.authService.refreshToken(data.ctx)

                }
            }

            const buttons = body.productList.map((item:any)=>{
                return Markup.button.callback(item.title, `productId${item.productId}`)
            })



            let arr = [],
                arr1 = [];

            for(let i=0; i<buttons.length; i++){

                arr1.push(buttons[i])

                if(!(i%3)&&i!==0){
                    arr.push(arr1)
                    arr1= []
                }else if(i===(buttons.length-1)){
                    arr.push(arr1)
                    arr1= []
                }
            }



            return arr


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

                const response_products = await fetch(`${this.configService.get('API')}/seller/shop/${shopId}/product/getProducts?searchQuery=&filter=active&sortBy=id&order=descending&size=30&page=${page}`, {
                    method: 'GET',
                    headers: {'Authorization': `Bearer ${token}`, 'accept-language': 'ru-RU'}
                });
                const body:any = await response_products.json();

                if(body.status>300){
                    throw new Error(`${this.configService.get('API')}/seller/shop/${data.shopId}/product/getProducts`)
                    break;
                }

                if(body.errors||body.error){
                    if(body.errors.length){
                        throw new Error(body.errors[0].code + ': ' + body.errors[0].detailMessage)
                        break;
                    }else if(body.error==='invalid_token'){
                        return this.authService.refreshToken(data.ctx)

                    }
                }



                if((body?.productList||[]).find((item:any)=>item.productId===productId)){
                    product_find = body?.productList.find((item:any)=>item.productId===productId)
                    break;
                }

            }


            const response1 = await fetch(`${this.configService.get('API_CLIENT')}/v2/product/${productId}`, {
                headers: {'accept-language': 'ru-RU'}
            });
            const actions = await fetch(`${this.configService.get('API_CLIENT')}/product/actions/${productId}`, {
                headers: {'accept-language': 'ru-RU'}
            });


            const bodyProductOne = await response1.json()
            const bodyActions = await actions.json()


            if(bodyProductOne.status>300) throw new Error(`ОШИБКА ${bodyProductOne.status}\n${this.configService.get('API')}/v2/product/${productId}`)
            if(bodyActions.status>300) throw new Error( `ОШИБКА ${bodyActions.status}\n${this.configService.get('API')}/product/actions/${productId}`)


            const {payload} = bodyProductOne
            let product_info = payload?.data

            return {...product_find, ...product_info, actions: bodyActions}
        }catch (err){
            return err
        }
    }



}