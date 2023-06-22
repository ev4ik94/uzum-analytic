import {DateFormatter} from "./index";

export class ApiError{

    static notFound(message?:string){
        return 'По вашему запросу ни чего не найдено, обратитесь пожалуйста в службу поддержки'
    }

    static badRequest(){
        return 'Вы отправили не корретный запрос, обратитесь пожалуйста в службу поддержки'
    }

    static anAuthorized(message?:string){
        return 'Вы не авторизованы'
    }

    static forbidden(message?:string){
        return 'В доступе отказано, обратитесь пожалуйста в службу поддержки'
    }

    static serverError(message?:string){
        return 'Произошла ошибка на стороне сервера, обратитесь пожалуйста в службу поддержки'
    }

    static errorMessageFormatter(ctx:any, error:any){
        const {message} = ctx
        const {userId} = ctx.session

        const username = message.from.username
        let date = DateFormatter(new Date())
        let messageError = `ОШИБКА\n${date}\nКлиент username: ${username}\nКлиент ID: ${userId}\n\n--------------------------------\n${error}`
        return messageError
    }
}

