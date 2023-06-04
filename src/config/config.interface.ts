export interface IConfig {
    get: (key:string)=>string
}


export interface IAuth {
    loginUzum: (data:{username:string, password:string, userId:number, login:string, chatId:number})=>any
    refreshToken: (ctx:any)=>any
}