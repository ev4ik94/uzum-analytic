import {IAuth, IConfig} from "../config/config.interface";
import {Markup} from "telegraf";
const fetch = require('node-fetch')
import moment from "moment";
import {IOrders, IReview} from "../context/context.interface";


export  default class ReviewsService{
    constructor(private readonly configService: IConfig) {
    }

    async getReviews(data:{shopId:number, token:string, status:string}){
        try{


            let response_reviews:any;


            if(data.status==='NEW'){

                response_reviews = await fetch(`${this.configService.get('API')}/seller/product-reviews?page=0&filter=NEW&shopIds=${data.shopId}&size=20`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }else{
                response_reviews = await fetch(`${this.configService.get('API')}/seller/product-reviews?page=0&filter=${data.status}&shopIds=${data.shopId}&size=20`, {
                    headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
                });
            }

            if(!response_reviews.ok)  throw new Error(`ОШИБКА ${this.configService.get('API')}/seller/product-reviews  ${response_reviews.statusText}`)


            const body = await response_reviews.json()



            const {payload} = body

            payload.forEach(async(item:IReview)=>{
                if(!item.read) await this.reviewMark({token: data.token, reviewId: item.reviewId+''})
            })



            return payload



        }catch (err:any){
            console.log(err)
            console.log('ERRRRRRRR')
            throw new Error(err)
        }
    }


    async getReviewById(data:{token:string, reviewId:string}){
        try{

            const response_reviews = await fetch(`${this.configService.get('API')}/seller/product-reviews/review/${data.reviewId}`, {
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU'}
            });

            const body = await response_reviews.json()

            if(body.status>300){
                throw new Error(`ОШИБКА ${body.status}\n${this.configService.get('API')}/seller/product-reviews`)
            }else if(body.errors||body.error){

                if(body.error){
                    throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/product-reviews\n${body.error}`)
                }
                throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/product-reviews`)
            }

            return body



        }catch (err:any){
            throw new Error(err)
        }
    }


    async reviewMark(data:{token:string, reviewId: string}){

        try{
            const response = await fetch(`${this.configService.get('API')}/seller/product-reviews/mark`, {
                method: 'post',
                body: JSON.stringify({
                    action: "READ",
                    reviewIds: [+data.reviewId]
                }),
                headers: {'Authorization': `Bearer ${data.token}`, 'accept-language': 'ru-RU', 'content-type':'application/json'}
            })

            if(!response.ok) throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/product-reviews/mark\n${response.statusText}`)


        }catch (err:any){
            throw new Error(err)
        }
    }


    async reviewAnswer(data:{token:string, reviewId:string, text:string}){
        try{
console.log('answer')
            const response_reviews = await fetch(`${this.configService.get('API')}/seller/product-reviews/reply/create`, {
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

            const body = await response_reviews.json()

            if(body.status>300){
                throw new Error(`ОШИБКА ${body.status}\n${this.configService.get('API')}/seller/product-reviews`)
            }else if(body.errors||body.error){

                if(body.error){
                    throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/product-reviews\n${body.error}`)
                }
                throw new Error(`ОШИБКА \n${this.configService.get('API')}/seller/product-reviews`)
            }

            return await this.getReviewById({token: data.token, reviewId: data.reviewId})

        }catch (err:any){
            throw new Error(err)
        }
    }










}