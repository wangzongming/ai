
const path = require("path")
const express = require('express')
const app = express()
const port = 3000


const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: "sk-xxx",
});
const openai = new OpenAIApi(configuration);

app.use(express.static(path.join(__dirname, "./web")))

app.all("*", function (req, res, next) {
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

app.get('/ai', async (req, res) => {
    const q = req.query.q;
    const userId = req.query.userId || "fk";
    clearTimeout(userTimer[userId]);

    if (!q || q.length <= 4) {
        res.send(`请输入 q 参数，并且长度不小于 5 `)
        return
    }

    console.log(`正在请求：${userId} ： ${q}`)

    try {
        const response = await openai.createCompletion({
            model: "code-davinci-002",
            prompt: `<|endoftext|>
            /* 
                I start with id is preview Element, 
                and incrementally modify it via <script> injection. 
                All images are available at https://www.pexels.com/.
                Written for Chrome. 
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
    
            ${allComm[userId]}
    
            /* Command: ${q} */\n`,
            stop: "/* Command:",
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const resCode = response.data.choices[0].text;
        console.log("返回：\n", resCode);


        // 记录命令
        allComm[userId] += ` 
        
        /* Command: ${q} */
        ${resCode}
    
        `;


        // 代码
        const oldCode = allCode[userId];
        allCode[userId] += ` 
        
    // ${q} 
    ${resCode}
    
        `;

        res.send({
            allCode: allCode[userId],
            newCode: resCode,
            oldCode
        });

        // 定时清空用户缓存
        userTimer[userId] = setTimeout(() => {
            allCode[userId] = "";
            allComm[userId] = "";
        }, 1000 * 60 * 5)
    } catch (err) {
        res.send({
            allCode: allCode[userId],
            newCode: "// 服务发生了错误 ...",
            oldCode: allCode[userId]
        }); 
    }

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})