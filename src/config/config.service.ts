import {IConfig} from "./config.interface";
import {config, DotenvParseOutput} from 'dotenv'


export class ConfigService implements IConfig{
    private configs:DotenvParseOutput;

    constructor() {
        const {error, parsed} = config();

        if(error){


            //throw new Error('Не найден файл .env')
        }

        if(parsed) this.configs = parsed
        //@ts-ignore
        else this.configs = process.env
        // //@ts-ignore
        // if(process.env)
        //
        // if(!parsed){
        //     //throw new Error('Пустой файл .env')
        // }
        //
        // if(parsed)
    }

    get(key:string):string{
        const res = this.configs[key]
        if(!res){
            throw new Error('Нет такого ключа')
        }

        return res
    }
}