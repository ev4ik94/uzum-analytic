export interface IConfig {
    get: (key:string)=>string
}


export interface IAuth {
    refreshToken: (ctx:any)=>any
    checkToken:(ctx:any)=>void
}