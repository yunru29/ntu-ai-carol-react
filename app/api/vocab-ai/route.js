import openai from "@/services/openai";
import db from '@/services/db';

const dbName = "dbName";
const collectionName = "vocab-ai"
export async function GET() {
    const vocabList = [];
    const docList = await db
        .collection(collectionName)
        .orderBy("createdAt", "desc")
        .get();

    docList.forEach(doc => {
        // console.log(doc.id, doc.data());
        const result = doc.data();
        result.id = doc.id;
        //將 result 放入 vocabList 陣列內
        vocabList.push(result);
    })
    return Response.json(vocabList);
}


export async function POST(req) {
    const body = await req.json();
    console.log("body:", body);
    const { userInput, language } = body;
    // TODO: 透過gpt-4o-mini模型讓AI回傳相關單字
    // 文件連結：https://platform.openai.com/docs/guides/text-generation/chat-completions-api?lang=node.js
    // JSON Mode: https://platform.openai.com/docs/guides/text-generation/json-mode?lang=node.js
    const systemPrompt = `請作為一個單字聯想AI根據所提供的單字聯想5個相關單字
    例如
    主題:水果
    語言:English

    JSON回應格式:
    {
        wordList:[Apple,...] // 單字清單
        zhWordList:[蘋果,...] // 繁體中文意思清單
    }
    `;
    const propmpt = `
    聯想主題:${userInput}
    語言:${language}
    `;

    const openAIReqBody = {
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": propmpt }
        ],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
    };
    const completion = await openai.chat.completions.create(openAIReqBody);
    const payload = JSON.parse(completion.choices[0].message.content);
    console.log("payload:", payload);
    console.log("payload的型別:", typeof payload);
    //一個生成結果
    const result = {
        title: userInput,
        payload,
        language,
        createdAt: new Date().getTime(),
    }
    // 將生成結果存進資料庫
    db.collection(dbName).add(result);
    // 將 result 傳輸給前端 .than (res => res.data)
    return Response.json(result);
}