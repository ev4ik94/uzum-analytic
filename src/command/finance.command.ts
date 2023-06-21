import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext, IFinanceData, IHistoryRequest} from "../context/context.interface";
import UpdatesService from "../services/updates.service";
import FinanceSevice from "../services/finance.sevice";
import {DateFormatter, HTMLFormatter, month, NumReplace} from "../utils";



// const UpdateService = new UpdatesService()
const financeServices = new FinanceSevice()



export class FinanceCommand extends Command{

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        this.bot.hears('/finance', async(ctx)=>{
            const response_data:IFinanceData = await financeServices.getFinanceInfo(ctx)
            const history_data = await financeServices.requestHistory(ctx)
console.log(history_data)
console.log(response_data)
            if(history_data&&response_data){
                const {inProcessingCount, withdrawList} = history_data

                let message = ''
                let message_history = ''

                let date_now = new Date()
                let month_current = date_now.getMonth()

                message+=HTMLFormatter([
                    `/n/s✅ Доступно к выводу:  ${NumReplace(response_data.forWithdraw+'')} сум/s/n/n`,
                    `/b🕘 В обработке:  ${NumReplace(response_data.processing+'')} сум/b/n/n`,
                    `/b❌ Возвраты:  ${NumReplace(response_data.cancelled+'')} сум/b/n/n`,
                    `/b🗓 Выведено за ${month[month_current]}:  ${NumReplace(response_data.withdrawnForCurrentMonth+'')} сум/b/n/n`,
                    `/b⏺ Выведено за все время:  ${NumReplace(response_data.withdrawn+'')} сум/b/n/n`
                ])

                message_history+=HTMLFormatter([
                    `/n/sВ процессе вывода: ${inProcessingCount}/s/n-----------------------------------------------/n`,
                ])




                withdrawList.forEach((item:IHistoryRequest)=>{
                    message_history+=HTMLFormatter([
                        `/bСумма вывода:                      ${NumReplace(item.amount+'')} сум/b/n`,
                        `/b${DateFormatter(new Date(item.createdDate))}    ${item.status==='APPROVED'?'✅ Исполнен':item.status==='CREATED'?'🕘 В обработке':'❌ Отменен'}/b/n/n`,
                    ])
                })
                await ctx.replyWithHTML(message)
                await ctx.replyWithHTML(message_history)
            }else{
                await ctx.replyWithHTML('Что-то пошло не так, попробуйте снова!')
            }


        })


    }
}