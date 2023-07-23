const fetch = require('node-fetch')


export class TimeslotsService {

    constructor() {
    }


    async getTimeslots(token:string, invoiceId:number[], ctx:any){
        try{

            const {current_shop} = ctx.session

            const response_timeslots = await fetch(`${process.env.API}/seller/shop/${current_shop}/v2/invoice/time-slot/get`, {
                method: 'POST',
                body: JSON.stringify({
                    invoiceIds: invoiceId,
                    //@ts-ignore
                    timeFrom: new Date().addDays(1).getTime()
                }),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })


            if(!response_timeslots.ok) {
                throw new Error(`URL: ${response_timeslots.url} STATUS: ${response_timeslots.status} TEXT: ${response_timeslots.statusText}`)
            }

            const body:any = await response_timeslots.json()

            const {timeSlots} = body.payload

            return timeSlots


        }catch (err:any){
            throw new Error(err)
        }
    }


    // async setTimeslots(token:string, invoiceId:number[], ctx:any, fromDate:number){
    //     try{
    //         const {current_shop} = ctx.session
    //
    //         const response_timeslots = await fetch(`${process.env.API}/seller/shop/${current_shop}/v2/invoice/time-slot/set`, {
    //             method: 'POST',
    //             body: JSON.stringify({
    //                 invoiceIds: invoiceId,
    //                 //@ts-ignore
    //                 timeFrom: fromDate
    //             }),
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         })
    //         console.log(response_timeslots.ok)
    //
    //         if(!response_timeslots.ok) {
    //             return false
    //         }
    //     }catch (err:any){
    //
    //     }
    // }



}