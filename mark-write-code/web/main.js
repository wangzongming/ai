window.onload = () => {
    const submitBtn = document.querySelector("#submit");
    const previewDom = document.querySelector("#preview");
    const codeDom = document.querySelector("#code");
    const inputDom = document.querySelector("#input");

    var ing = false;
    // 用户
    const userId = getUUID();

    submitBtn.onclick = async () => {
        const val = inputDom.value;
        if (ing) return;
        if (!val || val.length < 5) {
            submitBtn.innerHTML = "提交(请输入大于 5 个字的问题)";
            return;
        }

        submitBtn.innerHTML = "思考中...";
        // 清空输入框
        inputDom.value = "";

        var allCode = codeDom.innerText;

        ing = true;
        const res = await getAns(val,userId)
        const newCode = res.newCode;

        submitBtn.innerHTML = "编码中...";
        // 逐个输入
        const codeArr = `// ${val}\n${newCode}`.split("");
        const speed = 30;
        var allT = codeArr.length * speed;
        codeArr.forEach((t,i) => {
            setTimeout(() => {
                enterAni(t);

                allCode += `${t}`;
                const highlightedCode = hljs.highlight(allCode,{
                    language: 'javascript'
                }).value;
                codeDom.innerHTML = highlightedCode;
                codeDom.scrollTo(0,codeDom.scrollHeight);
            },speed * i);
        });

        // 执行代码
        setTimeout(() => {
            // 清空预览区域所有元素
            while (previewDom.firstChild) {
                previewDom.removeChild(previewDom.firstChild);
            }

            eval(res.allCode);
            
            // 如果执行失败就不执行
            // try {
            //     eval(res.allCode);
            // } catch (err) {
            //     // 当时旧代码还是得执行
            //     // eval(res.allCode);
            // }
            ing = false;
            submitBtn.innerHTML = "提交";
        },allT);
    };

    // 按键监听
    window.addEventListener("keydown",(e) => {
        const realDownK = e.code.toLocaleLowerCase()
            .replace(/(key|digit|numpad)/,"")
        enterAni(realDownK);
    })
}

/**
 * 获取结果
*/
async function getAns(val,userId) {
    return new Promise((resolve) => {
          fetch(`https://wangzongming.top/ai/ai?q=${val}&userId=${userId}`)
        // fetch(`/ai?q=${val}&userId=${userId}`)
            .then((res) => res.json())
            .then((res) => resolve(res))
    })
}

/**
 * 创建用户id
*/
function getUUID(val,userId) {
    return `user_${parseInt(Math.random() * 10000000 + 1)}_${parseInt(Math.random() * 10000 + 1)}_${parseInt(Math.random() * 1000 + 1)}`;

}


// 音效dom
const audioDom = document.querySelector("#enterAudio");
audioDom.playbackRate = 4;
var audioDomTime;

/**
 * 按键特效
 * @t 输入的文字
*/
function enterAni(t) {
    let keyDom;
    if (/[a-z]/g.test(`${t}`.toLocaleLowerCase())) {
        keyDom = document.querySelector(`#key-${t}`);
    } else {
        // 特殊符号
        const strMap = [
            [["1","!"],"49"],
            [["2","@"],"50"],
            [["3","#"],"51"],
            [["4","$"],"52"],
            [["5","%"],"53"],
            [["6","^"],"54"],
            [["7","&"],"55"],
            [["8","*"],"56"],
            [["9","("],"57"],
            [["0",")"],"48"],
            [["_","-"],"189"],
            [["+","="],"187"],
            [["{","["],"219"],
            [["}","]"],"221"],
            [["|","\\"],"220"],
            [[";",":"],"186"],
            [['"',"'"],"222"],
            [["<",","],"188"],
            [[">","."],"190"],
            [["?","/"],"191"],
        ];
        const tag = strMap.find((item) => item[0].includes(t));
        if (tag) {
            keyDom = document.querySelector(`#key-${tag[1]}`);
        }
    }
    if (keyDom) {
        keyDom.setAttribute("class",`${keyDom.className} entering`);
        setTimeout(() => {
            keyDom.setAttribute("class",`${keyDom.className.replace("entering","")}`);
        },50);
    }

    // audioDom.play();

    audioDom.pause && audioDom.play();
    clearTimeout(audioDomTime)
    audioDomTime = setTimeout(() => {
        audioDom.pause();
    },100);

}
