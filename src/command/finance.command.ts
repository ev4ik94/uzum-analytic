import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext, IFinanceData, IHistoryRequest} from "../context/context.interface";
import FinanceSevice from "../services/finance.sevice";
import {DateFormatter, HTMLFormatter, month, NumReplace, translater} from "../utils";
import {ApiError} from "../utils/ErrorHandler";
import {TimeslotsService} from "../services/timeslots.service";

const timeslotsService = new TimeslotsService()


export class FinanceCommand extends Command{

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        const regexp_finance = new RegExp(/^finance/)
        const regexp_invoice_id = new RegExp(/^\/invoiceId+.\d/)
        const regexp_invoice_id_view = new RegExp(/^\/invoiceView+.\d/)

        this.bot.hears('/finance', async(ctx)=>{
            try{
                const buttons_orders = [
                    Markup.button.callback(`${translater(ctx.session.lang||'ru', 'ALL_SHOPS')}`, `financeALL`),
                    Markup.button.callback(`${translater(ctx.session.lang||'ru', 'CURRENT_SHOPS')}`, `financeCURRENT`)
                ]

                await ctx.reply(translater(ctx.session.lang||'ru', 'COMMAND_FINANCE'), Markup.inlineKeyboard(buttons_orders))

            }catch (err:any){
                throw new Error(err)
            }
        })


        this.bot.action(regexp_finance, async(ctx)=>{
            try{
                const {update} = ctx
                const {userId, current_shop} = ctx.session

                //@ts-ignore
                const data = update.callback_query.data
                const type = data.replace(regexp_finance, '')

                const response_data:IFinanceData = await FinanceSevice.getFinanceInfo(ctx, type==='ALL'?undefined:current_shop)
                const history_data = await FinanceSevice.requestHistory(ctx, type==='ALL')

                if(response_data||history_data){

                    if(response_data){
                        let message = ''


                        let date_now = new Date()
                        let month_current = date_now.getMonth()

                        message+=HTMLFormatter([
                            `/n/s✅ ${translater(ctx.session.lang||'ru', 'FINANCE_APPROVED')}:/n/n    ${NumReplace(response_data.forWithdraw+'')} сум/s/n`,
                            `---------------------------------------------/n`,
                            `/b🕘 ${translater(ctx.session.lang||'ru', 'FINANCE_PROCESSING')}:/n/n    ${NumReplace(response_data.processing+'')} сум/b/n`,
                            `---------------------------------------------/n`,
                            `/b❌ ${translater(ctx.session.lang||'ru', 'FINANCE_CANCELED')}:/n/n    ${NumReplace(response_data.cancelled+'')} сум/b/n`,
                            `---------------------------------------------/n`,
                            `/b🗓 ${translater(ctx.session.lang||'ru', 'FINANCE_PERIOD')} ${month[month_current]}:/n/n    ${NumReplace(response_data.withdrawnForCurrentMonth+'')} сум/b/n`,
                            `---------------------------------------------/n`,
                            `/b⏺ ${translater(ctx.session.lang||'ru', 'FINANCE_PERIOD_ALL_TIME')}:/n/n    ${NumReplace(response_data.withdrawn+'')} сум/b/n`
                        ])

                        if(!message.length) message = translater(ctx.session.lang||'ru', 'NO_MATCH_DATA')


                        await ctx.replyWithHTML(message)
                    }

                    if(history_data){
                        const {inProcessingCount, withdrawList} = history_data
                        let message_history = ''

                        message_history+=HTMLFormatter([
                            `/n/s${translater(ctx.session.lang||'ru', 'FINANCE_PROCESSING_1')}: ${inProcessingCount}/s/n-----------------------------------------------/n`,
                        ])




                        withdrawList.forEach((item:IHistoryRequest)=>{
                            message_history+=HTMLFormatter([
                                `/b${translater(ctx.session.lang||'ru', 'FINANCE_AMOUNT')}: ${NumReplace(item.amount+'')} сум/b/n`,
                                `/b${DateFormatter(new Date(item.createdDate))}/n/n${item.status==='APPROVED'?`✅ ${translater(ctx.session.lang||'ru', 'FINANCE_AMOUNT')}`:item.status==='CREATED'?`🕘 ${translater(ctx.session.lang||'ru', 'PROCESSING_HISTORY')}`:`❌ ${translater(ctx.session.lang||'ru', 'CANCELED_STATUS')}`}/b/n`,
                                `--------------------------------------------/n`,
                            ])
                        })

                        await ctx.replyWithHTML(message_history)
                    }else{
                        await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'No_FINANCE_HISTORY')}`)
                    }

                } else{
                    await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                }
            }catch (err:any){
                const err_message = `Метод: Command /finance\n\nОШИБКА: ${err}`
                await ctx.reply(ApiError.serverError())
                await ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(ctx, err_message))
                throw new Error(err)
            }
        })


        this.bot.hears('/invoice', async(ctx)=>{
            try{


                const invoice_data:any = await FinanceSevice.getInvoiceInfo(ctx)

                if(invoice_data){

                    let message = ''
                    const invoice_statuses:any = {
                        "ACCEPTANCE_IN_PROGRESS": "🕒",
                        "ACCEPTED": "✅",
                        "CANCELED": "❌"
                    }

                    for(let k=0; k<invoice_data.length; k++){

                        const status = invoice_data[k].invoiceStatus.value
                        message+=HTMLFormatter([
                            `/n/s${invoice_statuses[status]?invoice_statuses[status]:''} ${translater(ctx.session.lang||'ru', 'STATUS')}: ${invoice_data[k].status}/s/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'INVOICE_NUMBER')}: ${invoice_data[k].invoiceNumber}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_CREATED')}: ${invoice_data[k].dateCreated}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'TIMESLOT')}: ${invoice_data[k].timeSlotReservation?DateFormatter(new Date(invoice_data[k].timeSlotReservation.timeFrom)):'-'}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'BY_SUM')}: ${NumReplace(invoice_data[k].fullPrice+'')} сум/b/n/n`,
                            `\/invoiceView${invoice_data[k].id}/n`,
                            `--------------------------------------------/n`,
                        ])
                    }

                    if(!message.length) {
                        message = translater(ctx.session.lang||'ru', 'NO_MATCH_DATA')
                    }


                    await ctx.reply(`${translater(ctx.session.lang||'ru', 'LAST_LIST_INVOICE')}`)
                    await ctx.replyWithHTML(message)



                } else{
                    await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                }
            }catch (err:any){
                const err_message = `Метод: Command /invoice\n\nОШИБКА: ${err}`
                await ctx.reply(ApiError.serverError())
                await ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(ctx, err_message))
                throw new Error(err)

            }
        })


        this.bot.hears('/timeslots', async(ctx)=>{
            try{

                const invoice_data:any = await FinanceSevice.getInvoiceInfo(ctx)

                if(invoice_data){

                    let message = ''
                    const invoice_statuses:any = {
                        "ACCEPTANCE_IN_PROGRESS": "🕒",
                        "ACCEPTED": "✅",
                        "CANCELED": "❌"
                    }

                    const filterCreated = invoice_data.filter((item:any)=>item.invoiceStatus.value==='CREATED')

                    for(let k=0; k<filterCreated.length; k++){

                        const status = filterCreated[k].invoiceStatus.value
                        message+=HTMLFormatter([
                            `/n/s${invoice_statuses[status]?invoice_statuses[status]:''} ${translater(ctx.session.lang||'ru', 'STATUS')}: ${filterCreated[k].status}/s/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'INVOICE_NUMBER')}: ${filterCreated[k].invoiceNumber}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_CREATED')}: ${filterCreated[k].dateCreated}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'TIMESLOT')}: ${filterCreated[k].timeSlotReservation?DateFormatter(new Date(filterCreated[k].timeSlotReservation.timeFrom)):'-'}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'BY_SUM')}: ${NumReplace(filterCreated[k].fullPrice+'')} сум/b/n/n`,
                            `\/invoiceId${filterCreated[k].id}/n`,
                            `--------------------------------------------/n`,
                        ])
                    }

                    if(!message.length) {
                        message = translater(ctx.session.lang||'ru', 'NO_MATCH_DATA')
                    }


                    await ctx.reply(`${translater(ctx.session.lang||'ru', 'SELECT_INVOICE')}`)
                    await ctx.replyWithHTML(message)



                } else{
                    await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                }


            }catch (err:any){

            }
        })


        this.bot.hears(regexp_invoice_id, async(ctx)=>{
            try{
                const {message} = ctx
                const {token} = ctx.session


                //@ts-ignore
                const data = message.text
                const invoiceId = data.replace(/^\/invoiceId/, '')
                let messageData = ''

                if(invoiceId){
                    const timeslots = await timeslotsService.getTimeslots(token, [+invoiceId], ctx)

                    for(let i=0; i<timeslots.length; i++){
                        const dateFrom = new Date(timeslots[i].timeFrom)
                        const dateTo = new Date(timeslots[i].timeTo)
                        const day = dateFrom.getDate()<10?`0${dateFrom.getDate()}`:dateFrom.getDate()
                        const hoursFrom = dateFrom.getHours()<10?`0${dateFrom.getHours()}`:dateFrom.getHours()
                        const minutesFrom = dateFrom.getMinutes()<10?`0${dateFrom.getMinutes()}`:dateFrom.getMinutes()
                        const hoursTo = dateTo.getHours()<10?`0${dateTo.getHours()}`:dateTo.getHours()
                        const minutesTo = dateTo.getMinutes()<10?`0${dateTo.getMinutes()}`:dateTo.getMinutes()

                            messageData+=HTMLFormatter([
                            `/n/s${day} ${month[dateFrom.getMonth()]}  ${hoursFrom}:${minutesFrom} - ${hoursTo}:${minutesTo}/s/n`,
                            `--------------------------------------------/n`,
                        ])
                    }

                }

                if(!messageData.length) messageData = 'Нет данных'

                await ctx.replyWithHTML(messageData)


            }catch (err:any){

            }
        })


        this.bot.hears(regexp_invoice_id_view, async(ctx)=>{
            try{
                const {message} = ctx


                //@ts-ignore
                const data = message.text
                const invoiceId = data.replace(/^\/invoiceView/, '')
                let messageData = ''

                if(invoiceId){

                    const invoice_data = await FinanceSevice.getInvoiceData(ctx, invoiceId)

                    if(invoice_data&&invoice_data.length){
                        for(let i=0; i<invoice_data.length; i++){
                            let elem = invoice_data[i]

                            messageData+=HTMLFormatter([
                                `/n/sSKU:/s ${elem.skuTitle}/n`,
                                `/n/s${translater(ctx.session.lang||'ru', 'INVOICE_PRODUCT_TITLE')}:/s ${elem.productTitle}/n`,
                                `/n/s${translater(ctx.session.lang||'ru', 'INVOICE_PRODUCT_STOCK')}:/s ${elem.quantityToStock}/n`,
                                `/n/s${translater(ctx.session.lang||'ru', 'INVOICE_PRODUCT_ACCEPTED')}:/s ${elem.quantityAccepted}/n`,
                                `/n/s${translater(ctx.session.lang||'ru', 'INVOICE_PRODUCT_PRICE')}:/s ${NumReplace(elem.purchasePrice+'')} сум/n`,
                                `---------------------------------------------/n`,
                            ])
                        }
                    }



                }

                if(!messageData.length) messageData = 'Нет данных'

                await ctx.replyWithHTML(messageData)


            }catch (err:any){

            }
        })


    }
}