import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IResponseProduct, IReview} from "../context/context.interface";
import ProductsService from "../services/products.service";
import AuthenticatedService from "../services/authenticated.service";
import {DateFormatter, HTMLFormatter, NumReplace} from "../utils";

const authService = new AuthenticatedService()

const productsService = new ProductsService(authService)


export class ProductsCommand extends Command{
    currentPage:number = 1
    products:any[] = []

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {


        const action_productId_regexp = new RegExp(/^productId/)
        const action_shopId_regexp = new RegExp(/^shopId/)

        this.bot.hears('/shops', async (ctx)=>{


            if(ctx.session.token){
                const shops = await authService.getUserShops(ctx.session.token)
                ctx.session.shops = shops
                const buttons_shop = shops.map((item:any)=>{
                    return Markup.button.callback(item.shopTitle, `shopId${item.id}`)
                })



                await ctx.reply(`На данный момент вы находитесь в магазине ${ctx.session.shops[0].shopTitle}`)

                if(buttons_shop.length>1){
                    await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))
                }
            }

        })

        this.bot.action(action_shopId_regexp, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data
            const shop_id = data.replace('shopId', '')


            const shop_info = ctx.session.shops.find((item:any)=>item.id===+shop_id)
            if(shop_info){
                ctx.session.current_shop = +shop_id;
                await ctx.reply(`Вы переключились на магазин ${shop_info?.shopTitle}`)
            }else{
                await ctx.reply(`Что-то пошло не так, такой магазин не найден`)
            }

        })


        this.bot.hears('/products', async (ctx)=>{

            if(ctx.session.current_shop&&ctx.session.token){
              this.products = await productsService.getProducts({shopId: ctx.session.current_shop, token: ctx.session.token, page:0, ctx})
                let message:string = ''

                if(this.products.length){
                    message  =HTMLFormatter([
                        `/n${this.products[this.currentPage].title}/n/n`,
                        `В продаже: ${this.products[this.currentPage].quantityActive}/n`,
                        `В Фотостудии: ${this.products[this.currentPage].quantityOnPhotoStudio}/n`,
                        `К отправке: ${this.products[this.currentPage].quantityCreated}/n`,
                        `Просмотры: ${this.products[this.currentPage].viewers||0}/n`,
                        `ROI: ${this.products[this.currentPage].roi}%/n`,
                        `Рейтинг: ${this.products[this.currentPage].rating}/n`,
                        `Продано: ${this.products[this.currentPage].quantitySold}/n`,
                        `Вернули: ${this.products[this.currentPage].quantityReturned}/n`,
                        `Брак: ${this.products[this.currentPage].quantityDefected}/n`,
                        `Статус: ${this.products[this.currentPage].status.title}/n`,
                        `Модерация: ${this.products[this.currentPage].moderationStatus.title}/n`,
                        `Цена: ${NumReplace(this.products[this.currentPage].price+'')} сум/n`,
                    ])


                }else{
                    message+='Список пуст'
                }

                const buttons:any[] = []

                if(this.currentPage-1>0){
                    buttons.push( Markup.button.callback('⬅️ Назад', `productId${this.currentPage-1}`))
                }

                if(this.products.length) buttons.push( Markup.button.callback(`${this.currentPage}/${this.products.length+1}`, `no-action`))



                if(this.currentPage-1<this.products.length){
                    buttons.push( Markup.button.callback('Вперед ➡️', `productId${this.currentPage+1}`))
                }



                if(buttons.length) {
                    return  await ctx.reply(message, Markup.inlineKeyboard(buttons))
                }


                return  await ctx.reply(message)



            }

        })


        this.bot.action(action_productId_regexp, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data


            if(data.match('productId')){

                this.currentPage = +data.replace('productId', '')

                let message:string = ''


                message  =HTMLFormatter([
                    `/n${this.products[this.currentPage].title}/n/n`,
                    `В продаже: ${this.products[this.currentPage].quantityActive}/n`,
                    `В Фотостудии: ${this.products[this.currentPage].quantityOnPhotoStudio}/n`,
                    `К отправке: ${this.products[this.currentPage].quantityCreated}/n`,
                    `Просмотры: ${this.products[this.currentPage].viewers||0}/n`,
                    `ROI: ${this.products[this.currentPage].roi}%/n`,
                    `Рейтинг: ${this.products[this.currentPage].rating}/n`,
                    `Продано: ${this.products[this.currentPage].quantitySold}/n`,
                    `Вернули: ${this.products[this.currentPage].quantityReturned}/n`,
                    `Брак: ${this.products[this.currentPage].quantityDefected}/n`,
                    `Статус: ${this.products[this.currentPage].status.title}/n`,
                    `Модерация: ${this.products[this.currentPage].moderationStatus.title}/n`,
                    `Цена: ${NumReplace(this.products[this.currentPage].price+'')} сум/n`,
                ])

                const buttons:any[] = []

                if(this.currentPage-1>0){
                    buttons.push( Markup.button.callback('⬅️Назад', `productId${this.currentPage-1}`))
                }

                if(this.products.length) buttons.push( Markup.button.callback(`${this.currentPage}/${this.products.length+1}`, `no-action`))


                if(this.currentPage-1<this.products.length-1){
                    buttons.push( Markup.button.callback('Вперед ➡️', `productId${this.currentPage+1}`))
                }

                if(buttons.length) return  await ctx.editMessageText(message, Markup.inlineKeyboard(buttons))

                return  await ctx.editMessageText(message)


            }




        })

    }
}