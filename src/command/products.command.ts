import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IResponseProduct} from "../context/context.interface";
import ProductsService from "../services/products.service";
import AuthenticatedService from "../services/authenticated.service";

const productsService = new ProductsService(new AuthenticatedService())


export class ProductsCommand extends Command{
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {


        const action_productId_regexp = new RegExp(/^productId/)

        this.bot.hears('/shops', async (ctx)=>{
            if(ctx.session.shops){
                const buttons_shop = ctx.session.shops.map((item:any)=>{
                    return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
                })

                await ctx.reply(`На данный момент вы находитесь в магазине ${ctx.session.shops[0].shopTitle}`)

                if(buttons_shop.length>1){
                    await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))
                }
            }

        })

        this.bot.hears(/^'shop-'/g, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const shop_id = update.message.text.replace('shop-', '')


            ctx.session.current_shop = +shop_id;
           if(ctx.session.shops){
               const shop_info = ctx.session.shops.find((item:any)=>item.id===+shop_id)
               if(shop_info){
                   await ctx.reply(`Вы переключились на магазин ${shop_info?.shopTitle}`)
               }else{
                   await ctx.reply(`Что-то пошло не так, такой магазин не найден`)
               }
           }

        })


        this.bot.hears('/products', async (ctx)=>{
            console.log(ctx.session)
            if(ctx.session.current_shop&&ctx.session.token){
               const data_products = await productsService.getProducts({shopId: ctx.session.current_shop, token: ctx.session.token, page:0, ctx})

                await ctx.reply(`Выберите товар`, Markup.inlineKeyboard(data_products))


            }

        })


        this.bot.action(action_productId_regexp, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data


            if(data.match('productId')){

                const productId = data.replace('productId', '')
                const productInfo = await productsService.getProductStatistic({productId: +productId, shopId: ctx.session.current_shop, token: ctx.session.token, ctx })
                const data_keys = ['rating', 'reviewsAmount', 'ordersAmount', 'viewers', 'roi', 'quantitySold', 'image', 'title', 'totalAvailableAmount']


                const responseData:IResponseProduct|any = {};

                let message = ''

                for(let key in productInfo){
                    if(data_keys.includes(key)){
                        responseData[key] = productInfo[key]
                    }
                    if(key==='actions'){
                        responseData[key] = productInfo[key].map((item:any)=>item.text)
                    }

                    if(key==='status'){
                        responseData[key] = productInfo[key]?.title
                    }

                    if(key==='moderationStatus'){
                        responseData[key] = productInfo[key]?.title
                    }
                }

                if(Object.keys(responseData).length===0){
                    return
                }

                const data_products = await productsService.getProducts({shopId: ctx.session.current_shop, token: ctx.session.token, page:0, ctx})



                message = `<strong>${responseData['title']}</strong> \n--------------------\n<b>В продаже:</b> ${responseData.totalAvailableAmount}\n<b>Просмотры:</b> ${responseData.viewers||0}\n<b>ROI:</b> ${responseData.roi}%\n<b>Рейтинг:</b> ${responseData.rating}\n<b>Заказы:</b> ${responseData.ordersAmount}\n<b>Продано:</b> ${responseData.quantitySold}\n<b>Отзывы:</b> ${responseData.reviewsAmount}\n<b>Статус:</b> ${responseData.status}\n<b>Модерация:</b> ${responseData.moderationStatus}\n<b>Действия:</b> ${responseData.actions.length?responseData.actions.join(', \n'):'Нет действий'}`
                await ctx.sendPhoto(responseData['image'], {protect_content:true})
                //@ts-ignore
                await ctx.reply( message, {protect_content:true, parse_mode:'HTML'})
                await ctx.reply(`Выберите товар`, Markup.inlineKeyboard(data_products))
            }




        })

    }
}