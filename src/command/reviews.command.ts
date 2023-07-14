import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders, IResponseProduct, IReview} from "../context/context.interface";
import OrdersService from "../services/orders.service";
import {DateFormatter, HTMLFormatter, month, NumReplace, translater} from "../utils";
import ReviewsService from "../services/reviews.service";
import {ApiError} from "../utils/ErrorHandler";

const reviewsService = new ReviewsService()


export class ReviewsCommand extends Command{
    currentPage:any[] = []
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        const action_reviews_regexp = new RegExp(/^reviewId/)
        const action_reviews_view_regexp = new RegExp(/^reviewView/)
        const action_reviews_answer = new RegExp(/^reviewAnswer/)
        const action_reviews_status = new RegExp(/^reviewStatus/)


        this.bot.hears('/reviews', async (ctx)=>{

            const {userId} = ctx.session
            if(ctx.session.current_shop){
                if(!this.currentPage.find((item:any)=>item.id===userId)){
                    this.currentPage.push({
                        id: userId,
                        page:1
                    })
                }
                await ctx.reply(translater(ctx.session.lang||'ru', 'REVIEWS'), Markup.inlineKeyboard([
                    Markup.button.callback(translater(ctx.session.lang||'ru', 'REVIEWS_WITHOUT_ANSWER'), `reviewStatusNO_REPLY`),
                        Markup.button.callback(translater(ctx.session.lang||'ru', 'REVIEWS_WITH_ANSWER'), `reviewStatusWITH_REPLY`)])
                )
            }

        })

        this.bot.action(action_reviews_view_regexp, async(ctx)=>{
            try{
                const {update} = ctx
                const {token} = ctx.session

                //@ts-ignore
                const data = update.callback_query.data

                const id:number = +data.replace('reviewView', '')

                const review = await reviewsService.getReviewById({token, reviewId:id+''})

                if(review){
                    let stars:string = Array.from(Array(review.rating)).map((item:any)=>'⭐️').join('')
                    const message  =HTMLFormatter([
                        `/n/s${translater(ctx.session.lang||'ru', 'ITEM')}: ${review.product.productTitle}/s/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'SHOP')}:/s ${review.shop.title}/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'DATE_BY')}:/s ${DateFormatter(new Date(review.dateBought))}/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'REVIEW_WRITED')}:/s ${DateFormatter(new Date(review.dateCreated))}/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'BUYER')}:/s ${review.customerName}/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'RAIT')}:/s ${stars}/n`,
                        `/n/sSKU:/s ${review.characteristics.map((item:any)=>`${item.characteristic}, ${item.characteristicValue}`).join('\n')}/n`,
                        `/n/s${translater(ctx.session.lang||'ru', 'REVIEW')}:/s ${review.content}/n/n`
                    ])


                    await ctx.replyWithHTML(message, Markup.inlineKeyboard([Markup.button.callback(translater(ctx.session.lang||'ru', 'ANSWER'), `reviewAnswer${review.reviewId}`)]))
                }else{
                    await ctx.replyWithHTML(translater(ctx.session.lang||'ru', 'REVIEW_NOT_FOUND'))
                }

            }catch(err:any){
                const err_message = `Метод: Command /reviewView\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }
        })


        this.bot.action(action_reviews_regexp, async(ctx)=>{
            try{
                const {update} = ctx
                const {userId, reviews} = ctx.session
                //@ts-ignore
                const data = update.callback_query.data

                const get_page = +data.replace('reviewId', '')


                if(!this.currentPage.find((item:any)=>item.id===userId)){
                    this.currentPage.push({
                        id: userId,
                        page:get_page
                    })
                }else{
                    this.currentPage = this.currentPage.map((item:any)=>{
                        if(item.id===userId){
                            return{
                                ...item,
                                page: get_page
                            }

                        }
                        return item
                    })

                }

                const get_current_page = this.currentPage.find((item:any)=>item.id===userId)


                let date:string = DateFormatter(new Date(reviews[get_current_page.page-1].dateCreated))
                let stars:string = Array.from(Array(reviews[get_current_page.page-1].rating)).map((item:any)=>'⭐️').join('')

                const message  =HTMLFormatter([
                    `/n${translater(ctx.session.lang||'ru', 'ITEM')}: ${reviews[get_current_page.page-1].product.productTitle}/n/n`,
                    `${translater(ctx.session.lang||'ru', 'DATE')}: ${date}/n`,
                    `${translater(ctx.session.lang||'ru', 'RAIT')}: ${stars}/n`,
                    `${translater(ctx.session.lang||'ru', 'REVIEW')}: ${reviews[get_current_page.page-1].content}/n/n`
                ])

                const buttons:any[] = []

                if(get_current_page.page-1>0){
                    buttons.push( Markup.button.callback(`⬅️ ${translater(ctx.session.lang||'ru', 'BACK')}`, `reviewId${get_current_page.page-1}`))
                }

                if(reviews[get_current_page.page-1]?.reply){
                    buttons.push( Markup.button.callback(translater(ctx.session.lang||'ru', 'ANSWER'), `reviewAnswer${reviews[get_current_page.page-1].reviewId}`))
                }



                if(get_current_page.page-1<reviews.length-1){
                    buttons.push( Markup.button.callback(`${translater(ctx.session.lang||'ru', 'FRONT')} ➡️`, `reviewId${get_current_page.page+1}`))
                }

                await ctx.editMessageText(message, Markup.inlineKeyboard(buttons))


            }catch(err:any){
                const err_message = `Метод: Command /reviewId\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }
        })



        this.bot.action(action_reviews_answer, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data
            ctx.session.reviewAnswer = data.replace('reviewAnswer', '')
            await ctx.reply(translater(ctx.session.lang||'ru', 'SEND_TEXT_FOR_ANSWER'))

        })

        this.bot.on('text', async (ctx:IBotContext)=>{
            try{
                const {update} = ctx
                //@ts-ignore
                const text = update.message.text


                if(ctx.session.reviewAnswer){

                    const review = await reviewsService.reviewAnswer({token: ctx.session.token, reviewId:ctx.session.reviewAnswer, text})

                    if(review){
                        let date:string = DateFormatter(new Date(review.dateCreated))
                        let date_buy:string = DateFormatter(new Date(review.dateBought))

                        let stars:string = Array.from(Array(review.rating)).map((item:any)=>'⭐️').join('')
                        const characters = review.characteristics.map((item:any)=>item.characteristicValue).join(', ')


                        const message =HTMLFormatter([
                            `/n/s${review.product.productTitle}/s/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'BUYED')}:/b ${date_buy}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'REVIEW_WRITED')}:/b ${date}/n`,
                            `/b${translater(ctx.session.lang||'ru', 'RAIT')}:/b ${stars}/n`,
                            `/bSKU:/b ${characters}/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'BUYER')}:/b ${review.customerName}/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'REVIEW')}:/b ${review?.content||''}/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'YOU_ANSWER')}:/b ${review?.reply?review?.reply?.content:'---'}/n/n`,
                        ])


                        await ctx.replyWithHTML(message)
                    }
                }
            }catch (err:any){
                const err_message = `Метод: Command review Answer /text\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }

        })


        this.bot.action(action_reviews_status, async (ctx)=>{
            try{
                const {update} = ctx
                const {userId} = ctx.session
                //@ts-ignore
                const data = update.callback_query.data

                const status = data.replace('reviewStatus', '')
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

                const get_current_page = this.currentPage.find((item:any)=>item.id===userId)

                ctx.session.reviews = await reviewsService.getReviews({shopId: ctx.session.current_shop, token: ctx.session.token, status, ctx})
                const {reviews} = ctx.session

                if(reviews.length){
                    let message:string = ''

                    let date:string = DateFormatter(new Date(reviews[get_current_page.page-1].dateCreated))
                    let stars:string = Array.from(Array(reviews[get_current_page.page-1].rating)).map((item:any)=>'⭐️').join('')

                    message  =HTMLFormatter([
                        `/n${translater(ctx.session.lang||'ru', 'ITEM')}: ${reviews[get_current_page.page-1].product.productTitle}/n/n`,
                        `${translater(ctx.session.lang||'ru', 'DATE')}: ${date}/n`,
                        `${translater(ctx.session.lang||'ru', 'RAIT')}: ${stars}/n`,
                        `${translater(ctx.session.lang||'ru', 'REVIEW')}: ${reviews[get_current_page.page-1].content}/n/n`
                    ])


                    const buttons:any[] = []

                    if(get_current_page.page-1>1){
                        buttons.push( Markup.button.callback(`⬅️ ${translater(ctx.session.lang||'ru', 'BACK')}`, `reviewId${get_current_page.page-1}`))
                    }

                    if(status==='NO_REPLY'&&reviews.length){
                        buttons.push( Markup.button.callback(translater(ctx.session.lang||'ru', 'ANSWER'), `reviewAnswer${reviews[get_current_page.page-1].reviewId}`))
                    }


                    if(get_current_page.page-1<reviews.length-1){
                        buttons.push( Markup.button.callback(`${translater(ctx.session.lang||'ru', 'FRONT')} ➡️`, `reviewId${get_current_page.page+1}`))
                    }

                    if(buttons.length) return  await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons))

                    return  await ctx.reply(message)

                }else{
                    await ctx.reply(`${translater(ctx.session.lang||'ru', 'LIST_EMPTY')} ⭕️`)
                }
            }catch (err:any){
                const err_message = `Метод: Command /reviewStatus\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheBotError', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru', 'ERROR_HANDLER'))
                throw new Error(err)
            }
        })

    }
}