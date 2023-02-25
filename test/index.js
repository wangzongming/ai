
const path = require("path")
const express = require('express')
const app = express()
const port = 88


const { Configuration,OpenAIApi } = require("openai");
const configuration = new Configuration({
    // apiKey: "sk-xxx",
    // 别提交到 gitub
    apiKey: "sk-",
});
const openai = new OpenAIApi(configuration);

// async function test(){ 
//     console.log("测试")
//     const response = await openai.listFiles();
//     console.log('response', response)
// }
// test()

app.use(express.static(path.join(__dirname,"./web")))

app.all("*",function (req,res,next) {
    console.log(req.url)
    // 除了不校验 token 的接口外，其他接口都需要传入 token 
    res.set({
        "Access-Control-Allow-Headers": "X-Requested-With,Content-Type,token,Authorization,token",
        "Access-Control-Allow-Origin": "*",
        // "Access-Control-Allow-Origin": req.headers.origin,
        "Access-Control-Allow-Methods": "POST,GET",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
    });

    next();
});


var allComm = {};
var allCode = {};
var userTimer = {};


app.get('/ai',async (req,res) => {
    const q = req.query.q;
    const userId = req.query.userId || "fk";
    clearTimeout(userTimer[userId]);

    if (!q || q.length <= 4) {
        res.send(`请输入 q 参数，并且长度不小于 5 `)
        return
    }

    console.log(`正在请求：${userId} ： ${q}`)

    const oldCode = allCode[userId];
    try {
        const response = await openai.createCompletion({
            model: "code-davinci-002",
            prompt: createPrompt(allComm[userId],q),
            stop: "/* Command:",
            temperature: 0.2,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const resCode = response.data.choices[0].text;
        logRes(userId, q, resCode)
        console.log("返回：\n",resCode);
        res.send({
            allCode: allCode[userId],
            newCode: resCode,
            oldCode
        });

        // 定时清空用户缓存
        userTimer[userId] = setTimeout(() => {
            allCode[userId] = "";
            allComm[userId] = "";
        },1000 * 60 * 5)
    } catch (err) {
        console.log('错误：', err)
        res.send({
            allCode: allCode[userId],
            newCode: "// 服务发生了错误 ...",
            oldCode
        });
    }

})

app.listen(port,() => {
    console.log(`Example app listening on port ${port}`)
})


/**
 * 记录返回的代码
*/
function logRes(userId, q, resCode) {
    // 记录命令
    allComm[userId] += `\n/* Command: ${q} */\n${resCode}`;

    // 代码
    allCode[userId] += `\n// ${q}\n${resCode}\n`;
}

/**
 * 创建问题
 * 单纯 html 代码版本
*/
// function createPrompt(userCommand,q) {
//     return `<|endoftext|>
// /* 
//     I start with id is preview Element, 
//     and incrementally modify it via <script> injection. 
//     All images are available at https://www.pexels.com/.
//     Written for Chrome. 
// */

// /* 
//     Command: Add \"Hello World\", 
//     by adding an HTML DOM node 
// */
// var helloWorld = document.createElement('div');
// helloWorld.innerHTML = 'Hello World';
// document.getElementById("preview").appendChild(helloWorld);

// /* Command: change "Hellow World" color to red. */
// helloWorld.style.color = "red"; 

// /* Command: Clear the page. */
// while (document.getElementById("preview").firstChild) {
//     document.getElementById("preview").removeChild(document.getElementById("preview").firstChild);
// }

// ${userCommand}

// /* Command: ${q} */\n`
// }


function createPrompt(userCommand,q) {
    return `<|endoftext|>
/*   
    当需要绘制或者创建一个事物时，将使用 javascript 实现，所有的图片将从 https://www.pexels.com/ 获取 并且将写好的代码添加到 #preview 的元素中，这种情况下为Chrome浏览器编写代码。
    当用户所需要是写一段不是前端的代码将自动用合适的语言实现，并且将代码前一行增加 /* 请复制出去执行，最后增加 */。
*/

/* 
    Command: Add \"Hello World\", 
    by adding an HTML DOM node 
*/
var helloWorld = document.createElement('div');
helloWorld.innerHTML = 'Hello World';
document.getElementById("preview").appendChild(helloWorld);

/* Command: change "Hellow World" color to red. */
helloWorld.style.color = "red"; 

/* Command: Clear the page. */
while (document.getElementById("preview").firstChild) {
    document.getElementById("preview").removeChild(document.getElementById("preview").firstChild);
}

/* Command: 写一段 java 的循环 */
/*
public class Test {
    public static void main(String[] args) {
        int x = 10;
        while( x < 20 ) {
            System.out.print("value of x : " + x );
            x++;
            System.out.print("\n");
        }
    }
}
*/

/* Command: 写一段 c 的循环 */
/*
#include <stdio.h>
 
int main ()
{
   for( ; ; )
   {
      printf("该循环会永远执行下去！\n");
   }
   return 0;
}
*/
 
${userCommand}

/* Command: ${q} */\n`
}