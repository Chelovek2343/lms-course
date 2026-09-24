'use client';

import { useEffect } from 'react';

/* ===== НАСТРОЙКИ: заполните и опубликуйте заново ===== */
const CONFIG = {
  whatsapp: "996706441050",      // номер в международном формате без плюса, например "996555123456"
  telegram: "",      // ник без @, например "bat_consulting"
  instagram: "",     // полная ссылка на профиль
  offerUrl: "",      // ссылка на оферту
  privacyUrl: "",    // ссылка на политику конфиденциальности
  priceSomNote: "",  // например "≈ 8 700 сом"
  author: { name: "", role: "", bio: "", photo: "" },   // photo: data:image/... (встроенное изображение)
 testimonials: [
  {
    name: "Ильгиз",
    note: "Польша, студенческая виза",
    text: "Полгода назад я даже не представлял, что смогу поступить в Польшу. Казалось, что для этого нужен идеальный аттестат, куча документов и очень много нервов. Но благодаря понятному плану и сопровождению BAT я смог пройти весь процесс и получить польскую визу 🇵🇱 Сейчас я понимаю, что поступление за границу — это не так сложно, если знаешь, что и когда нужно делать."
  },
  {
    name: "Аэлита",
    note: "Корея, приглашения от университетов",
    text: "Когда я только начала заниматься поступлением, вообще не понимала, с чего начать. Было много вопросов, а информация только путала. С BAT стало намного понятнее, что и в какой последовательности делать — я разобралась с процессом, подготовила документы и подала заявки сама. И самое приятное — получила приглашения от корейских университетов 🇰🇷❤️ Честно, не ожидала, что за $99 получу столько пользы и поддержки."
  }
]
   // [{ name: "Имя", note: "Страна, программа", text: "Текст отзыва" }]
};
/* ====================================================== */

const PAGE_CSS = `

:root{
  box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);
  padding-bottom:env(safe-area-inset-bottom,0px);
  --topbar:#0a0d12;
  --navy:#02183a;
  --navy-deep:#00112a;
  --ink:#f3f6fb;
  --muted:#9db3d1;
  --dim:#6f88ab;
  --blue:#6b9fe6;
  --line:rgba(140,176,230,.16);
  --card:rgba(255,255,255,.035);
  --card-strong:rgba(70,120,200,.14);
  --white:#ffffff;
  --on-white:#06183a;
  --serif:"Source Serif 4","Georgia","Times New Roman",serif;
  --sans:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  color-scheme:dark;
}
html{scroll-padding-top:calc(env(safe-area-inset-top,0px) + 84px);scroll-behavior:smooth;background:var(--topbar);height:100%}
*,*::before,*::after{box-sizing:border-box}
body{
  margin:0;min-height:100%;
  font-family:var(--sans);font-size:17px;line-height:1.6;color:var(--ink);
  background-color:var(--navy);
  background-image:
    radial-gradient(900px 600px at 78% 8%,rgba(60,110,200,.16),transparent 70%),
    linear-gradient(180deg,#02183a 0%,#001430 55%,#00102a 100%);
  -webkit-font-smoothing:antialiased;
}
img,svg{max-width:100%}
a{color:inherit}
h1,h2,h3{font-family:var(--serif);font-weight:700;margin:0;letter-spacing:-.012em}
h1{font-size:clamp(2.35rem,5.4vw,4.3rem);line-height:1.05;font-weight:800}
h2{font-size:clamp(1.9rem,3.5vw,2.85rem);line-height:1.12}
h3{font-size:1.35rem;line-height:1.25}
em{font-style:italic;font-weight:600;color:var(--blue)}
p{margin:0}
.wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,40px)}
.sec{padding-block:clamp(64px,9vw,112px);border-top:1px solid var(--line)}
.label{font-size:.95rem;font-weight:600;color:var(--blue);margin-bottom:14px}
.lead{color:var(--muted);font-size:1.12rem;max-width:62ch}
:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:6px}

/* buttons */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  font:600 1rem/1 var(--sans);text-decoration:none;cursor:pointer;
  padding:18px 30px;border-radius:999px;border:1px solid transparent;
  background:var(--white);color:var(--on-white);
  box-shadow:0 10px 34px rgba(80,140,255,.16);
  transition:box-shadow .2s,transform .2s,background .2s;
}
.btn:hover{box-shadow:0 12px 40px rgba(110,165,255,.32);transform:translateY(-1px)}
.btn-ghost{background:transparent;color:var(--ink);border-color:rgba(255,255,255,.3);box-shadow:none}
.btn-ghost:hover{background:rgba(255,255,255,.07);box-shadow:none}
.btn-sm{padding:12px 22px;font-size:.95rem;box-shadow:none}

/* header */
.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--topbar);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:72px;gap:20px}
.brand{display:flex;align-items:center;gap:14px;text-decoration:none;font-weight:700;font-size:1.1rem;letter-spacing:-.01em}
.brand svg{height:34px;width:auto;display:block}
.nav{display:flex;gap:30px}
.nav a{text-decoration:none;color:var(--muted);font-size:.98rem;font-weight:500}
.nav a:hover{color:var(--ink)}
@media (max-width:860px){.nav{display:none}}

/* hero */
.hero{padding-block:clamp(48px,7vw,96px) clamp(56px,7vw,88px)}
.hero .grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:clamp(32px,5vw,72px);align-items:center}
@media (max-width:940px){.hero .grid{grid-template-columns:1fr}}
.seg{display:inline-flex;padding:4px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.03);margin-bottom:28px}
.seg button{font:600 .95rem/1 var(--sans);color:var(--muted);background:transparent;border:0;padding:11px 20px;border-radius:999px;cursor:pointer;transition:background .2s,color .2s}
.seg button[aria-pressed="true"]{background:var(--white);color:var(--on-white)}
[data-role="student"] .parent-only,[data-role="parent"] .student-only{display:none}
.hero .lead{margin-top:26px;max-width:56ch}
.hero .actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px;margin-top:38px}
.hero .fine{width:100%;color:var(--dim);font-size:.92rem;margin-top:-2px}

/* route card */
.route{border:1px solid var(--line);border-radius:22px;padding:28px 26px 26px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}
.route h3{font-size:1.05rem;font-family:var(--sans);font-weight:600;color:var(--muted);margin-bottom:22px;display:flex;align-items:center;gap:10px}
.route ol{list-style:none;margin:0;padding:0;position:relative}
.route ol::before{content:"";position:absolute;left:13px;top:12px;bottom:14px;width:2px;background:linear-gradient(180deg,var(--blue),rgba(107,159,230,.15));transform-origin:top;animation:draw 1.5s .25s cubic-bezier(.2,.7,.2,1) both}
.route li{position:relative;padding:0 0 20px 46px;animation:pop .5s both}
.route li:last-child{padding-bottom:0}
.route li::before{content:attr(data-n);position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 .82rem/1 var(--sans);color:var(--on-white);background:var(--blue)}
.route li:nth-child(1){animation-delay:.3s}.route li:nth-child(2){animation-delay:.5s}.route li:nth-child(3){animation-delay:.7s}
.route li:nth-child(4){animation-delay:.9s}.route li:nth-child(5){animation-delay:1.1s}.route li:nth-child(6){animation-delay:1.3s}
.route b{display:block;font-weight:600;color:var(--ink);line-height:1.3}
.route span{display:block;color:var(--muted);font-size:.92rem;line-height:1.4;margin-top:2px}
@keyframes draw{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* facts strip */
.facts{border-top:1px solid var(--line)}
.facts .cols{display:grid;grid-template-columns:repeat(3,1fr)}
.facts .col{padding:38px clamp(16px,3vw,36px);border-right:1px solid var(--line)}
.facts .col:first-child{padding-left:0}
.facts .col:last-child{border-right:0}
.facts h3{color:var(--blue);font-size:1.7rem;margin-bottom:6px}
.facts p{color:var(--muted);font-size:.98rem;max-width:34ch}
@media (max-width:760px){
  .facts .cols{grid-template-columns:1fr}
  .facts .col{border-right:0;border-bottom:1px solid var(--line);padding-left:0}
  .facts .col:last-child{border-bottom:0}
}

/* pains */
.split{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,6vw,88px);align-items:start}
@media (max-width:860px){.split{grid-template-columns:1fr}}
.pains{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.pains li{padding:20px 0;border-bottom:1px solid var(--line);font-size:1.08rem;color:var(--ink)}
.callout{margin-top:32px;padding:22px 24px;border-left:3px solid var(--blue);background:var(--card-strong);border-radius:0 14px 14px 0;font-family:var(--serif);font-size:1.25rem;line-height:1.4;font-weight:600}

/* steps */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:48px;border-top:1px solid var(--line)}
.step{padding:34px clamp(16px,2.4vw,32px) 8px 0}
.step + .step{padding-left:clamp(16px,2.4vw,32px);border-left:1px solid var(--line)}
.step .n{font-family:var(--serif);font-size:2.6rem;color:var(--blue);line-height:1;font-weight:700}
.step h3{margin:16px 0 8px}
.step p{color:var(--muted)}
@media (max-width:820px){
  .steps{grid-template-columns:1fr}
  .step,.step + .step{padding:28px 0;border-left:0;border-bottom:1px solid var(--line)}
}
.more{margin-top:34px;color:var(--muted)}
.more a{color:var(--ink);font-weight:600}

/* modules */
.mods{display:grid;grid-template-columns:1fr 1fr;gap:0 clamp(24px,4vw,56px);margin-top:44px;align-items:start}
@media (max-width:860px){.mods{grid-template-columns:1fr}}
details{border-bottom:1px solid var(--line)}
details:first-child{border-top:1px solid var(--line)}
summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:16px;padding:20px 0;font-weight:600;font-size:1.05rem}
summary::-webkit-details-marker{display:none}
summary .num{flex:none;width:34px;font-family:var(--serif);font-size:1.15rem;color:var(--blue);font-weight:700}
summary .plus{margin-left:auto;flex:none;width:22px;height:22px;position:relative;color:var(--muted)}
summary .plus::before,summary .plus::after{content:"";position:absolute;left:3px;right:3px;top:10px;height:2px;background:currentColor;border-radius:2px;transition:transform .25s}
summary .plus::after{transform:rotate(90deg)}
details[open] summary .plus::after{transform:rotate(0)}
details .body{padding:0 38px 22px 50px;color:var(--muted)}
.faq details .body{padding:0 38px 24px 0}
.faq summary{padding:22px 0}

.outcome{margin-top:64px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(24px,5vw,72px)}
@media (max-width:860px){.outcome{grid-template-columns:1fr}}
.ticks{list-style:none;margin:0;padding:0}
.ticks li{position:relative;padding:14px 0 14px 34px;border-bottom:1px solid var(--line);color:var(--ink)}
.ticks li:first-child{border-top:1px solid var(--line)}
.ticks li::before{content:"";position:absolute;left:4px;top:20px;width:8px;height:14px;border-right:2px solid var(--blue);border-bottom:2px solid var(--blue);transform:rotate(40deg) scale(.9)}

/* budget */
.tablewrap{overflow-x:auto;margin-top:36px;border:1px solid var(--line);border-radius:18px}
table{width:100%;border-collapse:collapse;min-width:520px}
th,td{padding:18px 22px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font-weight:600;color:var(--muted);font-size:.92rem;background:rgba(255,255,255,.03)}
td:first-child{font-weight:600}
.note{margin-top:24px;padding:24px 26px;border:1px solid var(--line);border-radius:18px;background:var(--card-strong);color:var(--ink)}
.note b{font-family:var(--serif);font-size:1.15rem;display:block;margin-bottom:6px}
.note p{color:var(--muted)}
.small{color:var(--dim);font-size:.9rem;margin-top:14px}

/* honesty */
.duo{display:grid;grid-template-columns:1fr 1fr;margin-top:44px;border:1px solid var(--line);border-radius:22px;overflow:hidden}
@media (max-width:760px){.duo{grid-template-columns:1fr}}
.duo > div{padding:34px clamp(22px,3vw,40px)}
.duo .a{background:rgba(255,255,255,.02);border-right:1px solid var(--line)}
@media (max-width:760px){.duo .a{border-right:0;border-bottom:1px solid var(--line)}}
.duo .b{background:var(--card-strong)}
.duo h3{font-family:var(--sans);font-size:.95rem;font-weight:600;margin-bottom:14px}
.duo .a h3{color:var(--dim)}
.duo .b h3{color:var(--blue)}
.duo .a p{color:var(--dim)}
.duo .b p{color:var(--ink)}

/* author + reviews (rendered from config) */
.author{display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;margin-top:36px}
.avatar{width:128px;height:128px;border-radius:50%;background:var(--card-strong);border:1px solid var(--line);object-fit:cover;display:grid;place-items:center;font:700 2.4rem var(--serif);color:var(--blue)}
@media (max-width:640px){.author{grid-template-columns:1fr}}
.quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:36px}
.quote{padding:26px;border:1px solid var(--line);border-radius:18px;background:var(--card)}
.quote p{font-family:var(--serif);font-size:1.12rem;line-height:1.5}
.quote small{display:block;margin-top:14px;color:var(--muted)}

/* compare */
.compare th:first-child,.compare td:first-child{color:var(--muted);font-weight:500}
.compare th.us,.compare td.us{background:var(--card-strong)}
.compare th.us{color:var(--blue)}

/* pricing */
.plans{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:44px}
@media (max-width:860px){.plans{grid-template-columns:1fr}}
.plan{padding:36px clamp(24px,3vw,40px);border:1px solid var(--line);border-radius:24px;background:var(--card);display:flex;flex-direction:column}
.plan.main{background:linear-gradient(180deg,rgba(90,140,230,.2),rgba(90,140,230,.06));border-color:rgba(107,159,230,.5)}
.plan .tag{color:var(--blue);font-weight:600;font-size:.9rem;margin-bottom:10px}
.plan .price{font-family:var(--serif);font-size:3.1rem;font-weight:800;line-height:1;margin:14px 0 4px}
.plan .per{color:var(--muted);font-size:.95rem;margin-bottom:24px}
.plan ul{list-style:none;padding:0;margin:0 0 30px;display:grid;gap:12px;flex:1}
.plan li{position:relative;padding-left:26px;color:var(--ink)}
.plan li::before{content:"";position:absolute;left:3px;top:7px;width:6px;height:11px;border-right:2px solid var(--blue);border-bottom:2px solid var(--blue);transform:rotate(40deg)}
.plan .btn{align-self:flex-start}

.guarantee{margin-top:44px;padding:30px clamp(22px,3vw,40px);border-left:3px solid var(--blue);background:var(--card-strong);border-radius:0 20px 20px 0}
.guarantee h3{margin-bottom:10px}
.guarantee p{color:var(--muted);max-width:70ch}

.faq{max-width:840px;margin-top:40px}
.cta{text-align:left}
.cta .actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:34px}

footer{background:var(--topbar);border-top:1px solid var(--line);padding:40px 0;color:var(--dim);font-size:.93rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:16px 32px;justify-content:space-between;align-items:center}
footer nav{display:flex;flex-wrap:wrap;gap:8px 24px}
footer a{color:var(--muted);text-decoration:none}
footer a:hover{color:var(--ink)}

/* dialog */
dialog{border:1px solid var(--line);border-radius:24px;padding:0;background:#071d40;color:var(--ink); margin: 0 auto;width:min(520px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto}
dialog::backdrop{background:rgba(2,8,20,.72);backdrop-filter:blur(3px)}
dialog[open]{animation:dlg .22s ease-out}
@keyframes dlg{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.dlg{padding:30px 28px 28px;position:relative}
.dlg h3{font-size:1.5rem;padding-right:36px}
.dlg .lead{font-size:1rem;margin-top:8px}
.dlg .close{position:absolute;right:14px;top:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.07);color:var(--ink);font-size:1.3rem;cursor:pointer}
.msg{margin:22px 0 18px;padding:16px 18px;border:1px dashed rgba(157,179,209,.4);border-radius:14px;color:var(--ink);font-size:.98rem;background:rgba(255,255,255,.03)}
.dlg .row{display:flex;flex-wrap:wrap;gap:12px}
.dlg .copy{margin-top:14px;background:none;border:0;color:var(--muted);font:500 .95rem var(--sans);cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:6px 0}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .route ol::before,.route li,dialog[open]{animation:none}
  .btn{transition:none}
}

.main-logo{width:100px;}

`;

const PAGE_HTML = `
<header class="top">
  <div class="wrap">
    <a class="brand" href="#top" aria-label="BAT Consulting — на главную">
    <img class="main-logo" src="data:image/png;base64,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" alt="BAT" />
      <span>BAT Consulting</span>
    </a>
    <nav class="nav" aria-label="Разделы">
      <a href="#program">Программа</a>
      <a href="#budget">Бюджет</a>
      <a href="#pricing">Цены</a>
      <a href="#faq">Вопросы</a>
    </nav>
    <div style="display:flex;gap:10px;align-items:center">
      <a class="btn btn-sm btn-ghost" href="/login">Войти</a>
      <button class="btn btn-sm" data-cta="consult" type="button">Заявка</button>
    </div>
  </div>
</header>

<main id="top">

<!-- HERO -->
<section class="hero">
  <div class="wrap grid">
    <div>
      <div class="seg" role="group" aria-label="Кто вы">
        <button type="button" data-set-role="student" aria-pressed="true">Я школьник</button>
        <button type="button" data-set-role="parent" aria-pressed="false">Я родитель</button>
      </div>

      <h1 class="student-only">Не отличник и не миллионер? <em>Тебе тоже есть куда поступать</em></h1>
      <h1 class="parent-only">Поступление ребёнка за границу: <em>без мошенников и сюрпризов в бюджете</em></h1>

      <p class="lead student-only">Пошаговая дорожная карта на 13 модулей: как выбрать страну и вуз под свои оценки, язык и бюджет, собрать документы и получить визу. Университет выбираешь ты сам.</p>
      <p class="lead parent-only">Понятный план для семьи: с чего начать, сколько это стоит на самом деле и как не потерять год. Решение остаётся за вашей семьёй.</p>

      <div class="actions">
        <button class="btn" data-cta="course" type="button">Получить курс за $99</button>
        <button class="btn btn-ghost" data-cta="consult" type="button">Бесплатная консультация</button>
        <p class="fine">Без обязательств · ответ за 24 часа</p>
      </div>
    </div>

    <aside class="route" aria-label="Маршрут поступления">
      <h3>Маршрут поступления</h3>
      <ol>
        <li data-n="1"><b>Страна и бюджет</b><span>Сколько это стоит на самом деле</span></li>
        <li data-n="2"><b>Список из 3–5 вузов</b><span>Желаемые, реалистичные, запасные</span></li>
        <li data-n="3"><b>Требования и язык</b><span>GPA, IELTS/TOEFL, дедлайны</span></li>
        <li data-n="4"><b>Документы</b><span>Переводы, апостиль, письма</span></li>
        <li data-n="5"><b>Заявки</b><span>Подача и отслеживание статуса</span></li>
        <li data-n="6"><b>Виза и переезд</b><span>Всё до вылета</span></li>
      </ol>
    </aside>
  </div>
</section>

<!-- FACTS -->
<section class="facts" aria-label="Коротко о курсе">
  <div class="wrap cols">
    <div class="col"><h3>13 модулей</h3><p>От выбора страны до визы и переезда, с шаблонами документов.</p></div>
    <div class="col"><h3>Один платёж</h3><p>$99 за курс «Дорожная карта», без скрытых доплат.</p></div>
    <div class="col"><h3>Несколько стран</h3><p>Подаёшь документы параллельно, а не ждёшь ответа из одной страны.</p></div>
  </div>
</section>

<!-- PAINS -->
<section class="sec">
  <div class="wrap split">
    <div>
      <p class="label">Знакомо?</p>
      <h2>С поступлением за границу обычно так</h2>
      <div class="callout">Один неправильно выбранный вуз стоит дороже, чем этот курс.</div>
    </div>
    <ul class="pains">
      <li>Непонятно, с чего начать: страна, вуз, язык или бюджет.</li>
      <li>В Telegram десять мнений, и все разные.</li>
      <li>Страшно нарваться на агентство, которое поведёт не туда, куда нужно вам.</li>
      <li>Неясно, сколько это стоит на самом деле: обучение, жильё, виза, билеты, страховка.</li>
      <li>Один пропущенный дедлайн, и год потерян.</li>
    </ul>
  </div>
</section>

<!-- HOW -->
<section class="sec" id="how">
  <div class="wrap">
    <p class="label">Как это работает</p>
    <h2>Три шага от хаоса к плану</h2>
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Получаете доступ</h3><p>Модули 1–2 открываются сразу, остальные по дням. Сразу видно формат и качество.</p></div>
      <div class="step"><div class="n">2</div><h3>Проходите и заполняете свой план</h3><p>В каждом модуле практическое задание: список вузов, бюджет, документы.</p></div>
      <div class="step"><div class="n">3</div><h3>Подаёте заявки</h3><p>Застряли: есть чат в Telegram. Курс не подошёл: бесплатный созвон 15 минут.</p></div>
    </div>
    <p class="more">Хотите, чтобы всё делали вместе с вами? Есть <a href="#pricing">полное сопровождение</a>.</p>
  </div>
</section>

<!-- PROGRAM -->
<section class="sec" id="program">
  <div class="wrap">
    <p class="label">Не курс с видео</p>
    <h2>13 модулей: от выбора страны до переезда</h2>
    <p class="lead" style="margin-top:18px">Большинство гайдов по поступлению — общие советы, которые можно найти бесплатно. Здесь система, шаблоны и практические задания. Нажмите на модуль, чтобы увидеть, что внутри.</p>

    <div class="mods">
      <div>
        <details><summary><span class="num">1</span>Введение<span class="plus"></span></summary><div class="body">Как устроено поступление и карта всего процесса от начала до переезда.</div></details>
        <details><summary><span class="num">2</span>Список документов<span class="plus"></span></summary><div class="body">Какие документы нужны и куда с ними идти.</div></details>
        <details><summary><span class="num">3</span>Выбор университета<span class="plus"></span></summary><div class="body">Как собрать список из 3–5 вузов и разделить его на желаемые, реалистичные и запасные.</div></details>
        <details><summary><span class="num">4</span>Требования<span class="plus"></span></summary><div class="body">GPA, IELTS/TOEFL, SAT и случаи, когда экзамены не нужны. Разбор на примерах США, Италии и Китая.</div></details>
        <details><summary><span class="num">5</span>Подготовка документов<span class="plus"></span></summary><div class="body">Апостиль, переводы, легализация: что делать первым, потому что зависит от третьих лиц.</div></details>
        <details><summary><span class="num">6</span>Мотивационное письмо<span class="plus"></span></summary><div class="body">Структура, типичные ошибки и примеры.</div></details>
        <details><summary><span class="num">7</span>Резюме (CV)<span class="plus"></span></summary><div class="body">Как написать сильное резюме без опыта работы, с примерами.</div></details>
      </div>
      <div>
        <details><summary><span class="num">8</span>Рекомендательные письма<span class="plus"></span></summary><div class="body">Кто пишет, как попросить и шаблоны для рекомендателей.</div></details>
        <details><summary><span class="num">9</span>Подача заявок<span class="plus"></span></summary><div class="body">Common App, порталы вузов, отслеживание статуса. С разбором по странам.</div></details>
        <details><summary><span class="num">10</span>Стипендии и гранты<span class="plus"></span></summary><div class="body">Виды стипендий, где их искать и честный план Б.</div></details>
        <details><summary><span class="num">11</span>После поступления<span class="plus"></span></summary><div class="body">Offer Letter, депозит и что подтверждать в первую очередь.</div></details>
        <details><summary><span class="num">12</span>Виза<span class="plus"></span></summary><div class="body">Документы, собеседование и самые частые причины отказов.</div></details>
        <details><summary><span class="num">13</span>Подготовка к переезду<span class="plus"></span></summary><div class="body">Жильё, страховка, билеты и документы на первые дни.</div></details>
      </div>
    </div>

    <div class="outcome">
      <div>
        <h3 style="font-size:1.7rem">К концу курса у вас на руках будет</h3>
        <p class="small" style="margin-top:12px;font-size:1rem;color:var(--muted)">Это не просмотр видео, а рабочий план, который вы заполняете по ходу курса.</p>
      </div>
      <ul class="ticks">
        <li>выбранные страны и список из 3–5 вузов с категориями</li>
        <li>расчёт полного бюджета на год</li>
        <li>календарь дедлайнов по каждому вузу</li>
        <li>собранный пакет документов по шаблонам</li>
        <li>понимание, как подать заявку и что делать после ответа вуза</li>
      </ul>
    </div>
  </div>
</section>


<!-- BUDGET -->
<section class="sec" id="budget">
  <div class="wrap">
    <p class="label">Честный расчёт</p>
    <h2>Сколько это стоит на самом деле</h2>
    <p class="lead" style="margin-top:18px">Стоимость обучения с сайта университета — только часть суммы. Реальный бюджет на год складывается из обучения, жилья, питания, транспорта, медицинской страховки, визы, билетов и учебных материалов.</p>

    <div class="tablewrap">
      <table>
        <thead><tr><th>Страна</th><th>Обучение в год</th><th>Жизнь в месяц</th></tr></thead>
        <tbody>
          <tr><td>США</td><td>20–60 тыс. $</td><td>1 200–2 500 $</td></tr>
          <tr><td>Италия (государственные вузы)</td><td>500–4 000 €</td><td>700–1 000 €</td></tr>
          <tr><td>Китай</td><td>2,5–7 тыс. $</td><td>300–600 $</td></tr>
        </tbody>
      </table>
    </div>
    <p class="small">Ориентировочные цифры. Точные суммы и дедлайны всегда проверяйте на официальном сайте программы.</p>
  </div>
</section>

<!-- HONESTY -->
<section class="sec">
  <div class="wrap">
    <p class="label">Без пустых обещаний</p>
    <h2>Мы не обещаем поступление. <em>Обещаем ясность</em></h2>
    <div class="duo">
      <div class="a">
        <h3>Что иногда скрывается за «гарантией поступления»</h3>
        <p>Компания подаёт документы в выбранный вами вуз и параллельно в другой, с которым у неё есть договорённость. Поступить можно, но не туда, куда вы хотели.</p>
      </div>
      <div class="b">
        <h3>Как работаем мы</h3>
        <p>Вы сами выбираете страну и университет, понимаете каждый шаг и принимаете решение. Мы даём систему, шаблоны и живого консультанта, когда нужна помощь.</p>
      </div>
    </div>
  </div>
</section>

<!-- AUTHOR (filled from CONFIG.author) -->
<section class="sec" id="author-sec" hidden>
  <div class="wrap">
    <p class="label">Кто стоит за курсом</p>
    <h2 id="author-title"></h2>
    <div class="author">
      <div id="author-avatar"></div>
      <div><p class="lead" id="author-bio"></p><p class="small" id="author-role"></p></div>
    </div>
  </div>
</section>

<!-- COMPARE -->
<section class="sec">
  <div class="wrap">
    <p class="label">Что подойдёт именно вам</p>
    <h2>Telegram, курс или сопровождение</h2>
    <div class="tablewrap compare">
      <table>
        <thead><tr><th></th><th>Telegram и YouTube</th><th class="us">Курс «Дорожная карта»</th><th>Полное сопровождение</th></tr></thead>
        <tbody>
          <tr><td>Структура</td><td>Разрозненно, мнения спорят</td><td class="us">Отфильтрованная система из 13 модулей</td><td>Индивидуальный план</td></tr>
          <tr><td>Кто делает работу</td><td>Вы сами</td><td class="us">Вы сами, по чёткому плану</td><td>Консультант вместе с вами</td></tr>
          <tr><td>Цена</td><td>Бесплатно</td><td class="us">$99</td><td>€599</td></tr>
          <tr><td>Кому подходит</td><td>Изучить тему</td><td class="us">Готовым делать самим</td><td>Тем, кто хочет, чтобы всё делали вместе</td></tr>
        </tbody>
      </table>
    </div>
    <p class="more">Начните с курса. Если понадобится помощь, всегда можно перейти на сопровождение.</p>
  </div>
</section>

<!-- PRICING -->
<section class="sec" id="pricing">
  <div class="wrap">
    <p class="label">Цены</p>
    <h2>Два формата, без скрытых платежей</h2>

    <div class="plans">
      <article class="plan main">
        <p class="tag">Начните отсюда</p>
        <h3>Дорожная карта</h3>
        <div class="price">$99</div>
        <p class="per">Один платёж <span id="som"></span></p>
        <ul>
          <li>13 модулей: от выбора страны до переезда</li>
          <li>Шаблоны документов</li>
          <li>Чат поддержки в Telegram</li>
          <li>Модули 1–2 сразу, остальные по дням</li>
          <li>Бесплатный созвон 15 минут, если курс не подошёл</li>
        </ul>
        <button class="btn" data-cta="course" type="button">Получить курс</button>
      </article>

      <article class="plan">
        <p class="tag">Если нужна помощь рядом</p>
        <h3>Полное сопровождение</h3>
        <div class="price">€599</div>
        <p class="per">Разбор вашей ситуации до оплаты</p>
        <ul>
          <li>Личный консультант на каждом этапе</li>
          <li>Помощь от выбора вуза до подачи документов и визы</li>
          <li>Разбор нестандартных случаев</li>
          <li>Ответы по делу, без «погуглите сами»</li>
        </ul>
        <button class="btn btn-ghost" data-cta="support" type="button">Записаться на разбор</button>
      </article>
    </div>
    <p class="small">Способы оплаты подскажем в мессенджере после заявки.</p>

    <div class="guarantee">
      <h3>Курс не подошёл? Разберёмся вместе</h3>
      <p>Мы не возвращаем деньги «на всякий случай» и не обещаем поступление, потому что честно этого не может никто. Но если после первых модулей вы понимаете, что курс вам не подходит, у вас остались вопросы или ситуация нестандартная, мы проведём бесплатный созвон на 15 минут, разберём ваш случай и подскажем следующий шаг.</p>
    </div>
  </div>
</section>

<!-- REVIEWS (filled from CONFIG.testimonials) -->
<section class="sec" id="reviews-sec" hidden>
  <div class="wrap">
    <p class="label">Отзывы</p>
    <h2>Что говорят студенты</h2>
    <div class="quotes" id="quotes"></div>
  </div>
</section>

<!-- FAQ -->
<section class="sec" id="faq">
  <div class="wrap">
    <p class="label">Вопросы</p>
    <h2>Частые вопросы</h2>
    <div class="faq">
      <details><summary>Чем курс отличается от бесплатной информации в Telegram?<span class="plus"></span></summary><div class="body">В Telegram много, но противоречиво и без системы. В курсе информация отфильтрована и выстроена по шагам, от выбора страны до визы, без дублей и противоречий.</div></details>
      <details><summary>Это видео, а не живой консультант. Как оно поможет?<span class="plus"></span></summary><div class="body">Курс построен на системе, по которой мы сами работаем с клиентами. К нему прилагается чат поддержки, а если нужен живой человек, есть бесплатный созвон на 15 минут и сопровождение.</div></details>
      <details><summary>У меня нестандартный случай. Курс подойдёт?<span class="plus"></span></summary><div class="body">Общая база нужна почти всем: документы, подача, виза. После курса можно записаться на бесплатный созвон, и мы вместе разберёмся, как поступать именно в вашей ситуации.</div></details>
      <details><summary>А если это разводилово?<span class="plus"></span></summary><div class="body">Мы называем автора курса, показываем реальные материалы и не обещаем «100% поступление». Если курс не подошёл, мы проводим бесплатный созвон и объясняем, что делать дальше. Перед покупкой можно сначала написать нам и задать любые вопросы.</div></details>
      <details><summary>Подходит ли курс для любой страны?<span class="plus"></span></summary><div class="body">Курс универсальный: большая часть шагов одинакова для всех стран. Отличия по требованиям и подаче разобраны на примерах США, Италии и Китая. Если вам нужна другая страна, база остаётся той же, а детали уточним на созвоне.</div></details>
      <details><summary>Сколько времени занимает курс?<span class="plus"></span></summary><div class="body">Модули 4–13 открываются постепенно, поэтому пройти всё за один вечер нельзя. Дальше темп зависит от вас: вы заполняете свой план по ходу курса.</div></details>
      <details><summary>Нужен ли IELTS до покупки курса?<span class="plus"></span></summary><div class="body">Нет. В курсе вы узнаете, какой экзамен нужен под вашу программу, какой балл и когда записываться. Обычно регистрироваться советуем за 2–3 месяца до дедлайна подачи документов.</div></details>
      <details><summary>Как оплатить?<span class="plus"></span></summary><div class="body">Нажмите «Получить курс» и напишите нам в WhatsApp или Telegram. Подскажем удобный способ оплаты и откроем доступ.</div></details>
      <details><summary>Для кого курс: школьника, родителя или магистратуры?<span class="plus"></span></summary><div class="body">Для всех, кто поступает за границу: для школьников и их родителей, а также для тех, кто планирует магистратуру или MBA. Выберите в начале страницы, кто вы, и мы покажем подходящий вход.</div></details>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="sec cta">
  <div class="wrap">
    <h2 style="max-width:18ch">Начните с плана, <em>а не с хаоса</em></h2>
    <p class="lead" style="margin-top:18px">Получите курс сразу или сначала обсудите свою ситуацию. Если понадобится помощь, мы рядом.</p>
    <div class="actions">
      <button class="btn" data-cta="course" type="button">Получить курс за $99</button>
      <button class="btn btn-ghost" data-cta="consult" type="button">Бесплатная консультация</button>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <span>© 2026 BAT Consulting · Бишкек, Кыргызстан</span>
    <nav id="foot-links" aria-label="Ссылки"></nav>
  </div>
</footer>

<dialog id="contact" aria-labelledby="dlg-title">
  <div class="dlg">
    <button class="close" type="button" aria-label="Закрыть" id="dlg-close">×</button>
    <h3 id="dlg-title"></h3>
    <p class="lead">Выберите, где удобнее. Сообщение уже подготовлено, останется его отправить.</p>
    <div class="row" id="dlg-row"></div>
    <button class="copy" type="button" id="dlg-copy">Скопировать сообщение</button>
  </div>
</dialog>
`;

export default function HomePage() {
  useEffect(() => {

  var body = document.body;
  var role = "student";
  var roleWord = { student: "школьник", parent: "родитель" };

  /* переключатель школьник / родитель */
  document.querySelectorAll("[data-set-role]").forEach(function(btn){
    btn.addEventListener("click", function(){
      role = btn.getAttribute("data-set-role");
      body.setAttribute("data-role", role);
      document.querySelectorAll("[data-set-role]").forEach(function(b){
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
  });

  /* окно выбора мессенджера */
  var dlg = document.getElementById("contact");
  var intents = {
    course:  { title: "Получить курс «Дорожная карта»", msg: function(r){ return "Здравствуйте! Хочу получить курс «Дорожная карта» ($99). Я " + r + "."; } },
    consult: { title: "Бесплатная консультация", msg: function(r){ return "Здравствуйте! Хочу бесплатную консультацию на 15 минут. Я " + r + "."; } },
    support: { title: "Разбор сопровождения", msg: function(r){ return "Здравствуйте! Хочу узнать про полное сопровождение поступления. Я " + r + "."; } }
  };
  var currentText = "";

  function openDialog(kind){
    var it = intents[kind] || intents.consult;
    currentText = it.msg(roleWord[role]);
    document.getElementById("dlg-title").textContent = it.title;
    document.getElementById("dlg-msg").textContent = currentText;
    var row = document.getElementById("dlg-row");
    row.textContent = "";
    var enc = encodeURIComponent(currentText);
    if (CONFIG.whatsapp) {
      var wa = document.createElement("a");
      wa.className = "btn"; wa.target = "_blank"; wa.rel = "noopener";
      wa.href = "https://wa.me/" + CONFIG.whatsapp.replace(/\D/g, "") + "?text=Привет" + enc;
      wa.textContent = "Написать в WhatsApp";
      row.appendChild(wa);
    }
    if (CONFIG.telegram) {
      var tg = document.createElement("a");
      tg.className = "btn btn-ghost"; tg.target = "_blank"; tg.rel = "noopener";
      tg.href = "https://t.me/" + CONFIG.telegram.replace(/^@/, "");
      tg.textContent = "Написать в Telegram";
      row.appendChild(tg);
    }
    if (!CONFIG.whatsapp && !CONFIG.telegram) {
      var p = document.createElement("p");
      p.className = "small";
      p.textContent = "Скопируйте сообщение и отправьте его нам в любом мессенджере.";
      row.appendChild(p);
    }
    document.getElementById("dlg-copy").textContent = "Скопировать сообщение";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  document.querySelectorAll("[data-cta]").forEach(function(btn){
    btn.addEventListener("click", function(){ openDialog(btn.getAttribute("data-cta")); });
  });
  document.getElementById("dlg-close").addEventListener("click", function(){ dlg.close(); });
  dlg.addEventListener("click", function(e){ if (e.target === dlg) dlg.close(); });
  document.getElementById("dlg-copy").addEventListener("click", function(){
    var b = this;
    function done(){ b.textContent = "Скопировано"; }
    try {
      navigator.clipboard.writeText(currentText).then(done, function(){});
    } catch (e) {
      var ta = document.createElement("textarea");
      ta.value = currentText; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e2) {}
      document.body.removeChild(ta);
    }
  });

  /* цена в сомах */
  if (CONFIG.priceSomNote) document.getElementById("som").textContent = "· " + CONFIG.priceSomNote;

  /* автор */
  var a = CONFIG.author;
  if (a && a.name) {
    document.getElementById("author-sec").hidden = false;
    document.getElementById("author-title").textContent = a.name;
    document.getElementById("author-bio").textContent = a.bio || "";
    document.getElementById("author-role").textContent = a.role || "";
    var holder = document.getElementById("author-avatar");
    if (a.photo) {
      var img = document.createElement("img");
      img.className = "avatar"; img.src = a.photo; img.alt = a.name;
      holder.appendChild(img);
    } else {
      var av = document.createElement("div");
      av.className = "avatar"; av.textContent = a.name.trim().charAt(0).toUpperCase();
      holder.appendChild(av);
    }
  }

  /* отзывы */
  if (CONFIG.testimonials && CONFIG.testimonials.length) {
    document.getElementById("reviews-sec").hidden = false;
    var box = document.getElementById("quotes");
    CONFIG.testimonials.forEach(function(t){
      var q = document.createElement("div"); q.className = "quote";
      var p = document.createElement("p"); p.textContent = t.text;
      var s = document.createElement("small"); s.textContent = t.name + (t.note ? " · " + t.note : "");
      q.appendChild(p); q.appendChild(s); box.appendChild(q);
    });
  }

  /* ссылки в подвале */
  var foot = document.getElementById("foot-links");
  function addLink(label, url){
    if (!url) return;
    var l = document.createElement("a"); l.href = url; l.textContent = label;
    l.target = "_blank"; l.rel = "noopener"; foot.appendChild(l);
  }
  addLink("Instagram", CONFIG.instagram);
  addLink("Оферта", CONFIG.offerUrl);
  addLink("Политика конфиденциальности", CONFIG.privacyUrl);

  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;0,8..60,700;0,8..60,800;1,8..60,600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: PAGE_HTML }} />
    </>
  );
}
