import {Context} from "telegraf";

interface IShop {
    id: number
    shopTitle: string
}


export interface ISessionData{
    auth_email: string
    password: string
    token: string
    refresh_token: string
    auth: boolean
    reviewAnswer: string|null
    shops: IShop[]
    orders: IOrders[]
    reviews: any[]
    current_shop: number
}


export interface IOrders {
    dateIssued: string
    date: string
    status: string
    comment: string
    returnCause: string
    skuTitle: string
    amountReturns: number
    amount: number
    productTitle: string
    sellPrice: string
    orderId: number
    sellerProfit: string

}

export interface IReview {
    characteristics: any[]
    content: string
    read: boolean
    customerName: string
    dateBought: string
    dateCreated: string
    product: any
    reply: any
    photos: []
    rating: string
    replyStatus: string
    reviewId: number

}

export interface IResponseProduct {
    rating: string
    reviewsAmount: number
    ordersAmount: number
    viewers: number
    roi: string
    quantitySold: number
    image: string
    title: string
    totalAvailableAmount: number
    moderationStatus: string
    status: string
    actions: string[]
}

export interface IBotContext extends Context{

    session: ISessionData
}