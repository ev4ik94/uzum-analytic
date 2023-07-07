import AuthenticatedService from "./authenticated.service";

const fetch = require('node-fetch')
import {IReview} from "../context/context.interface";
import {ApiError} from "../utils/ErrorHandler";

const AuthService = new AuthenticatedService()


export  default class ReviewsService{
    constructor() {
    }

    async getReviews(data:{shopId?:number, token:string, status:string, ctx:any}){
        try{

            let response_reviews:any;

            if(data.status==='NEW'){

                response_reviews = await fetch(`${process.env.API}/seller/product-reviews?page=0&filter=NEW${data.shopId?`&shopIds=${data.shopId}`:''}&size=20`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }else{
                response_reviews = await fetch(`${process.env.API}/seller/product-reviews?page=0&filter=${data.status}${data.shopId?`&shopIds=${data.shopId}`:''}&size=20`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }

            if(!response_reviews.ok)  {
                if(response_reviews.status===401){
                    await AuthService.refreshToken(data.ctx)
                }else{
                    await data.ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(data.ctx, `URL: ${response_reviews.url} STATUS: ${response_reviews.status} USER_ID: ${data.ctx.session.userId} TEXT: ${response_reviews.statusText}`))
                    return
                }

                //throw new Error(`URL: ${response_reviews.url} STATUS: ${response_reviews.status} TEXT: ${response_reviews.statusText}`)
            }


            const body = await response_reviews.json()



            const {payload} = body

            payload.forEach(async(item:IReview)=>{
                if(!item.read) await this.reviewMark({token: data.token, reviewId: item.reviewId+''})
            })



            return payload



        }catch (err:any){
            await data.ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(data.ctx, JSON.stringify(err)))
            throw new Error(err)
        }
    }


    async getReviewById(data:{token:string, reviewId:string}){
        try{

            const response_reviews = await fetch(`${process.env.API}/seller/product-reviews/review/${data.reviewId}`, {
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
            });

            if(!response_reviews.ok) {
                throw new Error(`URL: ${response_reviews.url} STATUS: ${response_reviews.status} TEXT: ${response_reviews.statusText}`)
            }

            return await response_reviews.json()

        }catch (err:any){
            throw new Error(err)
        }
    }


    async reviewMark(data:{token:string, reviewId: string}){

        try{
            const response = await fetch(`${process.env.API}/seller/product-reviews/mark`, {
                method: 'post',
                body: JSON.stringify({
                    action: "READ",
                    reviewIds: [+data.reviewId]
                }),
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU', 'content-type':'application/json'}
            })

            if(!response.ok) throw new Error(`URL: ${response.url} STATUS: ${response.status} TEXT: ${response.statusText}`)


        }catch (err:any){
            throw new Error(err)
        }
    }


    async reviewAnswer(data:{token:string, reviewId:string, text:string}){
        try{


            const response_reviews = await fetch(`${process.env.API}/seller/product-reviews/reply/create`, {
                method: 'post',
                body: JSON.stringify([
                    {
                        content: data.text,
                        photos: [],
                        reviewId: data.reviewId
                    }
                ]),
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU', 'content-type':'application/json'}
            });

            if(!response_reviews.ok) {
                throw new Error(`URL: ${response_reviews.url} STATUS: ${response_reviews.status} TEXT: ${response_reviews.statusText}`)
            }



            return await this.getReviewById({token: data.token, reviewId: data.reviewId})

        }catch (err:any){
            throw new Error(err)
        }
    }










}