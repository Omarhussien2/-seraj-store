const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(/<span>أنا سراج! عشان أكتب قصة حلوة، محتاج أعرف اسم بطلنا وسنه وتقولي هو ولد ولا بنت؟<\/span>/g, '<span data-content-key="wizard.step1_speech">أنا سراج! عشان أكتب قصة حلوة، محتاج أعرف اسم بطلنا وسنه وتقولي هو ولد ولا بنت؟</span>');

html = html.replace(/<span>أبطالنا ساعات بيقابلوا تحديات\. اختاري قيمة محتاج البطل يتعلمها\.<\/span>/g, '<span data-content-key="wizard.step2_speech">أبطالنا ساعات بيقابلوا تحديات. اختاري قيمة محتاج البطل يتعلمها.</span>');

html = html.replace(/<span>عشان اخلي البطل في القصة شبه ابنك، محتاج أحلى صورة ليه يكون وشه فيها واضح\.<\/span>/g, '<span data-content-key="wizard.step3_speech">عشان اخلي البطل في القصة شبه ابنك، محتاج أحلى صورة ليه يكون وشه فيها واضح.</span>');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Wizard HTML keys injected successfully');
