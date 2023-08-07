import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IResponseProduct, IReview} from "../context/context.interface";
import ProductsService from "../services/products.service";
import AuthenticatedService from "../services/authenticated.service";
import {DateFormatter, HTMLFormatter, NumReplace, recursiveSymbols, translater} from "../utils";
import {ApiError} from "../utils/ErrorHandler";

const authService = new AuthenticatedService()

const productsService = new ProductsService()


export class ProductsCommand extends Command{
    currentPage:any[] = []

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {


        const action_productId_regexp = new RegExp(/^productId/)
        const action_shopId_regexp = new RegExp(/^shopId/)
        const action_productView_regexp = new RegExp(/^productView/)

        this.bot.hears('/shops', async (ctx)=>{
            try{
                if(ctx.session.token){
                    const shops = await authService.getUserShops(ctx.session.token)
                    ctx.session.shops = shops
                    const buttons_shop = shops.map((item:any)=>{
                        return Markup.button.callback(item.shopTitle, `shopId${item.id}`)
                    })

                    let arr = [],
                        arr1 = [];


                    for(let i=0; i<buttons_shop.length; i++){

                        arr1.push(buttons_shop[i])

                        if(!(i%3)&&i!==0){
                            arr.push(arr1)
                            arr1= []
                        }else if(i===(buttons_shop.length-1)){
                            arr.push(arr1)
                            arr1= []
                        }
                    }

                    const text = translater(ctx.session.lang||'ru', 'CURRENT_SHOP')


                    if(ctx.session.current_shop){
                        const current_shop_data = ctx.session.shops.find((item:any)=>+item.id===+ctx.session.current_shop)

                        if(current_shop_data){
                            await ctx.reply(`${text} ${current_shop_data.shopTitle}`)
                        }else{
                            await ctx.reply(`${text} ${ctx.session.shops[0].shopTitle}`)
                        }

                    }else{
                        await ctx.reply(`${text} ${ctx.session.shops[0].shopTitle}`)
                    }



                    if(buttons_shop.length>1){
                        await ctx.reply(translater(ctx.session.lang||'ru', 'SELECT_SHOP'), Markup.inlineKeyboard(arr))
                    }
                }
            }catch (err:any){
                const err_message = `Метод: Command /shops\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }
        })




        this.bot.action(action_shopId_regexp, async (ctx)=>{
            try{
                const {update} = ctx
                //@ts-ignore
                const data = update.callback_query.data
                const shop_id = data.replace('shopId', '')


                const shop_info = ctx.session.shops.find((item:any)=>item.id===+shop_id)
                if(shop_info){
                    ctx.session.current_shop = +shop_id;
                    await ctx.reply(`${translater(ctx.session.lang||'ru', 'TURN_SHOP')} ${shop_info?.shopTitle}`)
                }else{
                    await ctx.reply(translater(ctx.session.lang||'ru', 'NOT_FOUND_SHOP'))
                }
            }catch (err:any){
                const err_message = `Метод: Command /shopId\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }

        })


        this.bot.hears('/products', async (ctx)=>{
            const {userId} = ctx.session
            try{
                if(ctx.session.current_shop&&ctx.session.token){

                    if(!this.currentPage.find((item:any)=>item.id===userId)){
                        this.currentPage.push({
                            id: userId,
                            page:1
                        })
                    }else{
                        this.currentPage = this.currentPage.map((item:any)=>{
                            if(item.id===userId){
                                return{
                                    ...item,
                                    page: 1
                                }

                            }
                            return item
                        })

                    }


                    ctx.session.products = await productsService.getProducts({shopId: ctx.session.current_shop, token: ctx.session.token, page:0, ctx})
                    let message:string = ''

                    const get_current_page = this.currentPage.find((item:any)=>+item.id===+userId)?.page
                    const current_product = ctx.session.products[get_current_page-1]



                    if(ctx.session.products.length){
                        message  =HTMLFormatter([
                            `/n${current_product.title}/n/n`,
                            `${translater(ctx.session.lang||'ru', 'PRODUCTS_IN_SALE')}: ${current_product.quantityActive}/n`,
                            `${translater(ctx.session.lang||'ru', 'PRODUCTS_IN_PHOTO')}: ${current_product.quantityOnPhotoStudio}/n`,
                            `${translater(ctx.session.lang||'ru', 'READY_TO_SHIP')}: ${current_product.quantityCreated}/n`,
                            `${translater(ctx.session.lang||'ru', 'VIEWS')}: ${current_product.viewers||0}/n`,
                            `ROI: ${current_product.roi}%/n`,
                            `${translater(ctx.session.lang||'ru', 'RAITING')}: ${current_product.rating>0?recursiveSymbols(current_product.rating?+current_product.rating:0, '⭐️'):0}/n`,
                            `${translater(ctx.session.lang||'ru', 'SOLD')}: ${current_product.quantitySold}/n`,
                            `${translater(ctx.session.lang||'ru', 'RETURN')}: ${current_product.quantityReturned}/n`,
                            `${translater(ctx.session.lang||'ru', 'BRAK')}: ${current_product.quantityDefected}/n`,
                            `${translater(ctx.session.lang||'ru', 'STATUS')}: ${current_product.status.title}/n`,
                            `${translater(ctx.session.lang||'ru', 'MODERATION')}: ${current_product.moderationStatus.title}/n`,
                            `${translater(ctx.session.lang||'ru', 'COST')}: ${NumReplace(current_product.price+'')} сум/n`,
                        ])


                    }else{
                        message+=translater(ctx.session.lang||'ru', 'LIST_EMPTY')
                    }

                    const buttons:any[] = []

                    if(get_current_page-1>0){
                        buttons.push( Markup.button.callback(`⬅️ ${translater(ctx.session.lang||'ru', 'BACK')}`, `productId${get_current_page-1}`))
                    }

                    if(ctx.session.products.length) buttons.push( Markup.button.callback(`${get_current_page}/${ctx.session.products.length}`, `no-action`))



                    if(get_current_page-1<ctx.session.products.length){
                        buttons.push( Markup.button.callback(`${translater(ctx.session.lang||'ru', 'FRONT')} ➡️`, `productId${get_current_page+1}`))
                    }



                    if(buttons.length) {
                        return await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons))
                    }

                    return  await ctx.reply(message)

                }
            }catch (err:any){
                const err_message = `Метод: Command /products\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }
        })


        this.bot.action(action_productId_regexp, async (ctx)=>{
            try{
                const {update} = ctx
                const {userId} = ctx.session
                //@ts-ignore
                const data = update.callback_query.data



                const get_page = data.match('productId')?+data.replace('productId', ''):null


                if(!this.currentPage.find((item:any)=>item.id===userId)){
                    this.currentPage.push({
                        id: userId,
                        page:get_page||1
                    })
                }else{
                    this.currentPage = this.currentPage.map((item:any)=>{
                        if(item.id===userId){
                            return{
                                ...item,
                                page: get_page||1
                            }

                        }
                        return item
                    })

                }


                let message:string = ''
                const get_current_page = this.currentPage.find((item:any)=>item.id===userId)?.page
                const current_product = ctx.session.products[get_current_page-1]


                    if(current_product){
                        message  =HTMLFormatter([
                            `/n${current_product?.title}/n/n`,
                            `${translater(ctx.session.lang||'ru', 'PRODUCTS_IN_SALE')}: ${current_product?.quantityActive}/n`,
                            `${translater(ctx.session.lang||'ru', 'PRODUCTS_IN_PHOTO')}: ${current_product?.quantityOnPhotoStudio}/n`,
                            `${translater(ctx.session.lang||'ru', 'READY_TO_SHIP')}: ${current_product?.quantityCreated}/n`,
                            `${translater(ctx.session.lang||'ru', 'VIEWS')}: ${current_product?.viewers||0}/n`,
                            `ROI: ${current_product?.roi}%/n`,
                            `${translater(ctx.session.lang||'ru', 'RAITING')}: ${current_product.rating>0?recursiveSymbols(current_product.rating?+current_product.rating:0, '⭐️'):0}/n`,
                            `${translater(ctx.session.lang||'ru', 'SOLD')}: ${current_product?.quantitySold}/n`,
                            `${translater(ctx.session.lang||'ru', 'RETURN')}: ${current_product?.quantityReturned}/n`,
                            `${translater(ctx.session.lang||'ru', 'BRAK')}: ${current_product?.quantityDefected}/n`,
                            `${translater(ctx.session.lang||'ru', 'STATUS')}: ${current_product?.status.title}/n`,
                            `${translater(ctx.session.lang||'ru', 'MODERATION')}: ${current_product?.moderationStatus.title}/n`,
                            `${translater(ctx.session.lang||'ru', 'COST')}: ${NumReplace((current_product?.price||'0')+'')} сум/n`,
                        ])
                    }else{
                        message = translater(ctx.session.lang||'ru', 'PRODUCT_NOT_FOUND')
                    }

                const buttons:any[] = []

                if(get_current_page-1>0){
                    buttons.push( Markup.button.callback(`⬅️${translater(ctx.session.lang||'ru', 'BACK')}`, `productId${get_current_page-1}`))
                }

                if(ctx.session.products.length) buttons.push( Markup.button.callback(`${get_current_page}/${ctx.session.products.length}`, `no-action`))


                if(get_current_page-1<ctx.session.products.length-1){
                    buttons.push( Markup.button.callback(`${translater(ctx.session.lang||'ru', 'FRONT')} ➡️`, `productId${get_current_page+1}`))
                }



                if(buttons.length){
                    return  await ctx.editMessageText(message, Markup.inlineKeyboard(buttons))
                }

                return  await ctx.editMessageText(message)
            }catch (err:any){
                const err_message = `Метод: Command /productId\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }

        })

    }
}